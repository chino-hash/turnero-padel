const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })
const prisma = new PrismaClient()

;(async () => {
  try {
    const bookings = await prisma.booking.findMany({
      select: { id: true, bookingDate: true, startTime: true, endTime: true, status: true },
      orderBy: { bookingDate: 'desc' },
      take: 100,
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const counts = { today: 0, future: 0, past: 0, total: bookings.length }
    const sample = bookings.slice(0, 10).map((b) => ({
      id: String(b.id),
      date: (b.bookingDate instanceof Date ? b.bookingDate : new Date(b.bookingDate)).toISOString().split('T')[0],
      time: `${b.startTime}-${b.endTime}`,
      status: String(b.status),
    }))

    for (const b of bookings) {
      const d = new Date(b.bookingDate)
      d.setHours(0, 0, 0, 0)
      if (d.getTime() === today.getTime()) counts.today++
      else if (d > today) counts.future++
      else counts.past++
    }

    console.log(JSON.stringify({ counts, sample }, null, 2))
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()