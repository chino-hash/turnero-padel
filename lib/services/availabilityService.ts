import { prisma } from '../database/neon-config'

export async function getAvailableSlots(courtId: string, dateFrom: string, dateTo: string, userRole: 'ADMIN' | 'USER', tenantId?: string | null) {
  const from = new Date(`${dateFrom}T00:00:00`)
  const to = new Date(`${dateTo}T00:00:00`)
  const today = new Date()
  today.setHours(0,0,0,0)
  const threshold = new Date(today)
  threshold.setDate(threshold.getDate() + 7)

  // Construir filtros WHERE con tenantId
  const bookingWhere: any = {
    courtId,
    bookingDate: { gte: from, lte: to },
    status: { not: 'CANCELLED' }
  }
  if (tenantId) {
    bookingWhere.tenantId = tenantId
  }

  // 1) Instancias reales (Bookings) en todo el rango, excluyendo canceladas
  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: { bookingDate: true, startTime: true, endTime: true }
  })

  // 1b) CourtBlocks (torneos) que bloquean esta cancha en el rango
  const courtBlocks = await prisma.courtBlock.findMany({
    where: {
      courtId,
      date: { gte: from, lte: to }
    },
    select: { date: true, startTime: true, endTime: true }
  })
  const courtBlocksNormalized: Array<{ date: string; startTime: string; endTime: string }> = courtBlocks.map((b) => ({
    date: (b.date instanceof Date ? b.date : new Date(b.date)).toISOString().split('T')[0],
    startTime: b.startTime,
    endTime: b.endTime
  }))

  // 2) Bloqueos virtuales > 7 días para ADMIN
  let virtualBlocks: Array<{ date: string; startTime: string; endTime: string }> = []
  if (userRole === 'ADMIN') {
    const adminStart = new Date(Math.max(threshold.getTime(), from.getTime()))
    const adminEnd = to

    // Construir filtros WHERE para recurring bookings con tenantId
    const recurringWhere: any = {
      courtId,
      status: 'ACTIVE',
      OR: [
        { endsAt: null },
        { endsAt: { gte: adminStart } }
      ],
      startsAt: { lte: adminEnd }
    }
    if (tenantId) {
      recurringWhere.tenantId = tenantId
    }

    // cargar reglas ACTIVE y excepciones SKIP en rango
    const rules = await prisma.recurringBooking.findMany({
      where: recurringWhere,
      select: { id: true, weekday: true, startTime: true, endTime: true }
    })

    // Para excepciones, necesitamos filtrar por recurringId que pertenezca al tenant
    const recurringIds = rules.map(r => r.id)
    const exceptions = await prisma.recurringBookingException.findMany({
      where: {
        recurringId: { in: recurringIds },
        date: { gte: adminStart, lte: adminEnd },
        type: 'SKIP'
      },
      select: { recurringId: true, date: true }
    })

    const skipSet = new Set(exceptions.map(e => `${e.recurringId}::${new Date(e.date).toISOString().split('T')[0]}`))

    // recorrer días
    for (let d = new Date(adminStart); d <= adminEnd; d.setDate(d.getDate() + 1)) {
      const weekday = d.getDay() // 0..6
      const ymd = new Date(d).toISOString().split('T')[0]
      for (const r of rules) {
        if (r.weekday === weekday) {
          const key = `${r.id}::${ymd}`
          if (!skipSet.has(key)) {
            virtualBlocks.push({ date: ymd, startTime: r.startTime, endTime: r.endTime })
          }
        }
      }
    }
  }

  return {
    bookings,
    virtualBlocks,
    courtBlocks: courtBlocksNormalized,
    thresholdDate: threshold.toISOString().split('T')[0]
  }
}