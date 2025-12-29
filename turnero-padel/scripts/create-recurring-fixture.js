const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function ymd(d) { return new Date(d).toISOString().split('T')[0] }

function computeNextDateForWeekday(weekday, startDate) {
  const base = new Date(startDate)
  base.setHours(0,0,0,0)
  const today = new Date(); today.setHours(0,0,0,0)
  const ref = today < base ? base : today
  const diff = (weekday - ref.getDay() + 7) % 7
  const target = new Date(ref); target.setDate(ref.getDate() + diff)
  return target
}

async function ensureTestUser() {
  const email = 'turno.fijo.prueba@example.com'
  let user = await prisma.user.findFirst({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Turno Fijo Prueba',
        role: 'USER',
        isActive: true,
      }
    })
  }
  return user
}

async function ensureCourt() {
  let court = await prisma.court.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
  if (!court) {
    court = await prisma.court.create({
      data: {
        name: 'Cancha 1',
        description: 'Cancha de prueba',
        basePrice: 6000,
        priceMultiplier: 1.0,
        features: JSON.stringify({ color: 'from-green-400 to-green-600', bgColor: 'bg-green-100', textColor: 'text-green-700' }),
        operatingHours: JSON.stringify({ start: '08:00', end: '23:00', slot_duration: 90 }),
        isActive: true,
      }
    })
  }
  return court
}

async function main() {
  console.log('🧪 Creando turno fijo de prueba para el panel de turnos...')
  const court = await ensureCourt()
  const user = await ensureTestUser()

  const startTime = '20:00'
  const endTime = '21:30'
  const startsAt = new Date(); startsAt.setHours(0,0,0,0)
  const weekday = startsAt.getDay()

  const rule = await prisma.recurringBooking.create({
    data: {
      courtId: court.id,
      userId: user.id,
      weekday,
      startTime,
      endTime,
      startsAt,
      status: 'ACTIVE',
      notes: 'Turno fijo de prueba'
    }
  })

  const targetDate = computeNextDateForWeekday(weekday, startsAt)
  const slots = [
    { start: startTime, end: endTime },
    { start: '21:30', end: '23:00' },
    { start: '17:00', end: '18:30' },
    { start: '18:30', end: '20:00' },
    { start: '09:30', end: '11:00' },
  ]

  let booking = null
  for (const s of slots) {
    try {
      booking = await prisma.booking.create({
        data: {
          courtId: court.id,
          userId: user.id,
          bookingDate: targetDate,
          startTime: s.start,
          endTime: s.end,
          durationMinutes: 90,
          totalPrice: court.basePrice,
          status: 'CONFIRMED',
          paymentStatus: 'PENDING',
          notes: 'Reserva generada por turno fijo de prueba',
          recurringId: rule.id,
        }
      })
      await prisma.bookingPlayer.create({
        data: {
          bookingId: booking.id,
          playerName: user.name || 'Titular',
          position: 1,
          hasPaid: false,
          paidAmount: 0,
        }
      })
      break
    } catch (e) {
      // Intentar siguiente slot si hay conflicto de horario
    }
  }

  if (!booking) {
    console.log('⚠️ No se pudo crear la instancia de reserva; la regla fija igualmente se creó.')
  } else {
    console.log(`✅ Turno fijo creado. Regla ${rule.id}. Reserva ${booking.id} para ${ymd(targetDate)} ${booking.startTime}-${booking.endTime}.`)
    console.log('👉 Ver en /admin-panel/admin/turnos bajo la sección TURNOS FIJOS.')
  }
}

main()
  .catch((e) => { console.error(e) })
  .finally(async () => { await prisma.$disconnect() })