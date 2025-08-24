import { NextRequest, NextResponse } from 'next/server'
import { getCourtById, checkCourtAvailability } from '@/lib/services/courts'

// Helpers
function hhmmToHour(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h + (m || 0) / 60
}

function hourToHHMM(hour: number): string {
  const total = Math.round(hour * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get('courtId') || ''
    const dateStr = searchParams.get('date') // YYYY-MM-DD

    if (!courtId || !dateStr) {
      return NextResponse.json({ error: 'courtId and date are required' }, { status: 400 })
    }

    const court = await getCourtById(courtId)
    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    // Parse date
    const date = new Date(`${dateStr}T00:00:00`)

    // Range and duration (spec): 14:00 → 00:00, 90 minutes, consecutive (no overlap)
    const startHour = 14
    const endHour = 24
    const slotDuration = 1.5 // 90 minutes

    const slots: Array<any> = []
    for (let h = startHour; h + slotDuration <= endHour; h += slotDuration) {
      const startTime = hourToHHMM(h)
      const endTime = hourToHHMM(h + slotDuration)
      const isAvailable = await checkCourtAvailability(courtId, date, startTime, endTime)
      slots.push({
        id: `${courtId}-${startTime}`,
        startTime,
        endTime,
        timeRange: `${startTime} - ${endTime}`,
        isAvailable,
        price: Math.round((court.base_price || 6000) * (court.priceMultiplier || 1)),
        courtId,
      })
    }

    const open = slots.filter(s => s.isAvailable).length
    const total = slots.length
    const rate = total > 0 ? Math.round((open / total) * 100) : 0

    return NextResponse.json({ 
      slots, 
      summary: { total, open, rate },
      courtName: court.name,
      courtId: court.id
    })
  } catch (err) {
    console.error('GET /api/slots error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

