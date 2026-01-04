import { prisma } from '../database/neon-config'

function ymd(d: Date) { return new Date(d).toISOString().split('T')[0] }

/**
 * Genera instancias de reservas recurrentes para los próximos 7 días
 * @param tenantId - ID del tenant (opcional). Si se proporciona, solo genera instancias para ese tenant
 */
export async function generateRecurringInstances(tenantId?: string | null) {
  const today = new Date(); today.setHours(0,0,0,0)
  const end = new Date(today); end.setDate(end.getDate() + 7)

  // Construir filtro base
  const whereClause: any = {
    status: 'ACTIVE',
    OR: [{ endsAt: null }, { endsAt: { gte: today } }],
    startsAt: { lte: end }
  }

  // Si se proporciona tenantId, filtrar por tenant
  if (tenantId) {
    whereClause.tenantId = tenantId
  }

  const rules = await prisma.recurringBooking.findMany({
    where: whereClause
  })

  const exceptions = await prisma.recurringBookingException.findMany({
    where: { date: { gte: today, lte: end } }
  })

  const byDay: Record<string, { weekday: number; date: Date }> = {}
  for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
    byDay[ymd(d)] = { weekday: d.getDay(), date: new Date(d) }
  }

  const skipMap = new Set(exceptions.filter(e => e.type === 'SKIP').map(e => `${e.recurringId}::${ymd(e.date)}`))
  const overrideMap = new Map(exceptions.filter(e => e.type === 'OVERRIDE').map(e => [`${e.recurringId}::${ymd(e.date)}`, e]))

  const toCreate: any[] = []
  for (const r of rules) {
    for (const [dateStr, info] of Object.entries(byDay)) {
      if (r.weekday !== info.weekday) continue
      const key = `${r.id}::${dateStr}`
      if (skipMap.has(key)) continue
      const existing = await prisma.booking.findFirst({ where: { recurringId: r.id, bookingDate: info.date } })
      if (existing) continue
      const override = overrideMap.get(key)
      const totalPrice = override?.newPrice ? Math.round(override.newPrice) : undefined
      toCreate.push({
        tenantId: r.tenantId,
        courtId: r.courtId,
        userId: r.userId,
        bookingDate: info.date,
        startTime: r.startTime,
        endTime: r.endTime,
        durationMinutes: 90,
        totalPrice: totalPrice ?? 6000,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        notes: override?.reason,
        recurringId: r.id
      })
    }
  }

  if (toCreate.length > 0) {
    await prisma.booking.createMany({ data: toCreate })
  }

  return { created: toCreate.length }
}

if (require.main === module) {
  generateRecurringInstances().then(res => {
    console.log(`Instancias creadas: ${res.created}`)
    process.exit(0)
  }).catch(err => { console.error(err); process.exit(1) })
}