import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/neon-config'

export const dynamic = 'force-dynamic'

const ALL_TIME_SLOTS = [
  '08:00 - 09:30', '09:30 - 11:00', '11:00 - 12:30',
  '12:30 - 14:00', '14:00 - 15:30', '15:30 - 17:00',
  '17:00 - 18:30', '18:30 - 20:00', '20:00 - 21:30',
  '21:30 - 23:00',
]

function parseSlot(slot: string) {
  const [start, end] = slot.split(' - ')
  return { start, end }
}

function formatDateYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export async function GET() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const days: string[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      return formatDateYMD(d)
    })

    const activeCourts = await prisma.court.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      take: 3,
      select: { id: true, name: true },
    })

    const startDate = new Date(days[0] + 'T00:00:00')
    const endDate = new Date(days[days.length - 1] + 'T23:59:59')

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: startDate, lte: endDate },
        status: { in: ['CONFIRMED', 'PENDING'] },
        deletedAt: null,
      },
      select: { courtId: true, bookingDate: true, startTime: true, endTime: true, status: true },
    })

    const byDateCourt: Record<string, Record<string, Array<{ start: string; end: string; status: 'CONFIRMED' | 'PENDING' }>>> = {}
    for (const b of bookings) {
      const dateKey = formatDateYMD(new Date(b.bookingDate))
      byDateCourt[dateKey] ||= {}
      byDateCourt[dateKey][b.courtId] ||= []
      byDateCourt[dateKey][b.courtId].push({ start: b.startTime, end: b.endTime, status: b.status as any })
    }

    const timeSlots = ALL_TIME_SLOTS.map((label) => {
      const { start, end } = parseSlot(label)
      return {
        timeLabel: label,
        days: days.map((date) => ({
          date,
          courts: activeCourts.map((court) => {
            const list = byDateCourt[date]?.[court.id] || []
            const match = list.find((b) => b.start === start && b.end === end)
            let status: 'free' | 'booked' | 'pending' = 'free'
            if (match?.status === 'CONFIRMED') status = 'booked'
            else if (match?.status === 'PENDING') status = 'pending'
            return { courtId: court.id, status }
          }),
        })),
      }
    })

    return NextResponse.json({ timeSlots })
  } catch (error) {
    console.error('Error en /api/admin/availability:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}