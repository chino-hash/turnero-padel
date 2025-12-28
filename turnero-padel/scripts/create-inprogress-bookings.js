const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚧 Creando turnos de prueba EN CURSO y FINALIZADOS (sin crear canchas)')

  const courts = await prisma.court.findMany({ where: { isActive: true } })
  if (courts.length === 0) {
    console.error('No hay canchas activas en la base de datos. Abortando.')
    return
  }
  const users = await prisma.user.findMany({ take: 5 })
  if (users.length === 0) {
    console.error('No hay usuarios en la base de datos. Abortando.')
    return
  }

  const court = courts[0]
  const user = users[0]

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  function minutesToHHMM(minutes) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  function timeStringToMinutes(t) {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // EN CURSO: empezó hace 30 minutos, termina en 60
  const inProgressStart = minutesToHHMM(Math.max(currentMinutes - 30, 8 * 60))
  const inProgressEnd = minutesToHHMM(Math.min(currentMinutes + 60, 22 * 60 + 30))

  // FINALIZADA · confirmar cierre: terminó hace 30 minutos
  const finishedStart = minutesToHHMM(Math.max(currentMinutes - 120, 8 * 60))
  const finishedEnd = minutesToHHMM(Math.max(currentMinutes - 30, 8 * 60 + 90))

  const bookingsData = [
    {
      label: 'EN_CURSO',
      bookingDate: today,
      startTime: inProgressStart,
      endTime: inProgressEnd,
      status: 'CONFIRMED',
      paymentStatus: 'DEPOSIT_PAID'
    },
    {
      label: 'FINALIZADA',
      bookingDate: today,
      startTime: finishedStart,
      endTime: finishedEnd,
      status: 'CONFIRMED',
      paymentStatus: 'FULLY_PAID'
    }
  ]

  for (const b of bookingsData) {
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        courtId: court.id,
        bookingDate: b.bookingDate,
        startTime: b.startTime,
        endTime: b.endTime,
        durationMinutes: timeStringToMinutes(b.endTime) - timeStringToMinutes(b.startTime),
        totalPrice: court.basePrice,
        status: b.status,
        paymentStatus: b.paymentStatus,
        notes: `Reserva ${b.label} ${b.startTime} - ${b.endTime}`
      }
    })

    // Crear únicamente el titular; los demás slots se manejarán como genéricos en la UI
    await prisma.bookingPlayer.create({
      data: {
        bookingId: booking.id,
        playerName: user.name || 'Titular',
        position: 1,
        hasPaid: false,
        paidAmount: 0
      }
    })

    console.log(`✔️  Reserva ${b.label} creada: ${booking.id} (${b.startTime} - ${b.endTime})`)
  }

  console.log('✅ Turnos de prueba creados. Visita /admin-panel/admin/turnos para verlos.')
}

main()
  .catch((e) => { console.error(e) })
  .finally(async () => { await prisma.$disconnect() })