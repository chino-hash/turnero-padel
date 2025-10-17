// Quick test script to validate slot generation and availability without starting the server
// Uses Prisma directly and reproduces the availability logic

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function hhmmToHour(hhmm) {
  const [hh, mm] = hhmm.split(':').map(Number)
  return hh + (mm / 60)
}

function hourToHHMM(hour) {
  const total = Math.round(hour * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

async function checkCourtAvailability(courtId, date, startTime, endTime) {
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      courtId,
      bookingDate: date,
      status: { not: 'CANCELLED' },
      OR: [
        { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
        { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
        { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
      ],
    },
  })
  return !conflictingBooking
}

function parseJsonSafely(str, fallback) {
  try {
    const parsed = JSON.parse(str)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch (_) {
    return fallback
  }
}

const idToCanonicalName = {
  'cmew6nvsd0001u2jcngxgt8au': 'Cancha 1',
  'cmew6nvsd0002u2jcc24nirbn': 'Cancha 2',
  'cmew6nvi40000u2jcmer3av60': 'Cancha 3',
  'court-a': 'Cancha 1',
  'court-b': 'Cancha 2',
  'court-c': 'Cancha 3',
}

async function resolveCourtByIdWithFallback(id) {
  const byId = await prisma.court.findUnique({ where: { id } })
  if (byId) return byId
  const name = idToCanonicalName[id]
  if (!name) return null
  const activeByName = await prisma.court.findFirst({ where: { name, isActive: true } })
  if (activeByName) return activeByName
  const anyByName = await prisma.court.findFirst({ where: { name } })
  return anyByName
}

async function main() {
  // Defaults: old ID and date tomorrow
  const args = process.argv.slice(2)
  const argMap = Object.fromEntries(args.map(kv => kv.split('=')))
  const courtIdArg = argMap.courtId || 'cmew6nvsd0001u2jcngxgt8au'
  const dateArg = argMap.date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  console.log('Testing slots with:', { courtIdArg, dateArg })

  const court = await resolveCourtByIdWithFallback(courtIdArg)
  if (!court) throw new Error('Court not found via ID or fallback')

  console.log('Resolved court:', { id: court.id, name: court.name, isActive: court.isActive })

  const basePrice = court.basePrice / 100
  const priceMultiplier = court.priceMultiplier || 1
  const finalPrice = Math.round(basePrice * priceMultiplier)

  const hours = parseJsonSafely(court.operatingHours, {
    start: '08:00',
    end: '24:00',
    slot_duration: 60,
  })

  const startHour = hhmmToHour(hours.start)
  const endHour = Math.max(hhmmToHour(hours.end) - hours.slot_duration / 60, startHour)
  const durationHours = hours.slot_duration / 60

  const requestedDate = new Date(`${dateArg}T00:00:00`)

  const availabilityPromises = []
  for (let h = startHour; h <= endHour + 0.0001; h += durationHours) {
    const startTime = hourToHHMM(h)
    const endTime = hourToHHMM(h + durationHours)
    availabilityPromises.push(
      checkCourtAvailability(court.id, requestedDate, startTime, endTime).then(isAvailable => ({
        id: `${court.id}--${dateArg}--${startTime}`,
        startTime,
        endTime,
        timeRange: `${startTime} - ${endTime}`,
        isAvailable,
        price: finalPrice,
        courtId: court.id,
        date: dateArg,
      }))
    )
  }

  const slots = await Promise.all(availabilityPromises)
  const open = slots.filter(s => s.isAvailable).length
  console.log(`Generated ${slots.length} slots, ${open} available (${Math.round(open * 100 / slots.length)}%)`)
  console.log('First 3 slots:', slots.slice(0, 3))
}

main()
  .catch(err => {
    console.error('Test failed:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })