const { BookingService } = require('../../../lib/services/BookingService')

jest.mock('../../../lib/database/neon-config', () => {
  const booking = { findMany: jest.fn() }
  const court = { findUnique: jest.fn() }
  return { prisma: { booking, court } }
})

const { prisma } = require('../../../lib/database/neon-config')

describe('BookingService getAvailabilitySlots', () => {
  let service

  beforeEach(() => {
    jest.clearAllMocks()
    service = new BookingService()
  })

  it('genera slots usando operatingHours con claves start/end', async () => {
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      name: 'Cancha 1',
      basePrice: 1000,
      priceMultiplier: 1,
      operatingHours: JSON.stringify({ start: '08:00', end: '22:00', slot_duration: 90 })
    })
    prisma.booking.findMany.mockResolvedValue([])

    const result = await service.getAvailabilitySlots('court-1', '2025-11-14', 90)
    expect(result.success).toBe(true)
    const slots = result.data || []
    expect(slots.length).toBe(26)
    expect(`${slots[0].startTime} - ${slots[0].endTime}`).toBe('08:00 - 09:30')
    const last = slots[slots.length - 1]
    expect(`${last.startTime} - ${last.endTime}`).toBe('20:30 - 22:00')
    expect(slots.every(s => s.available)).toBe(true)
  })

  it('genera slots usando operatingHours con claves open/close', async () => {
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      name: 'Cancha 1',
      basePrice: 1000,
      priceMultiplier: 1,
      operatingHours: JSON.stringify({ open: '09:00', close: '21:00' })
    })
    prisma.booking.findMany.mockResolvedValue([])

    const result = await service.getAvailabilitySlots('court-1', '2025-11-14', 90)
    expect(result.success).toBe(true)
    const slots = result.data || []
    expect(slots.length).toBe(22)
    const last = slots[slots.length - 1]
    expect(`${last.startTime} - ${last.endTime}`).toBe('19:30 - 21:00')
  })

  it('marca conflictos no disponibles cuando hay reservas existentes', async () => {
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      name: 'Cancha 1',
      basePrice: 1000,
      priceMultiplier: 1,
      operatingHours: JSON.stringify({ start: '08:00', end: '22:00' })
    })
    prisma.booking.findMany.mockResolvedValue([
      { startTime: '10:00', endTime: '11:30' }
    ])

    const result = await service.getAvailabilitySlots('court-1', '2025-11-14', 90)
    expect(result.success).toBe(true)
    const slots = result.data || []
    const findSlot = (range: string) => slots.find(s => `${s.startTime} - ${s.endTime}` === range)
    expect(findSlot('08:00 - 09:30')?.available).toBe(true)
    expect(findSlot('09:30 - 11:00')?.available).toBe(false)
    expect(findSlot('10:00 - 11:30')?.available).toBe(false)
    expect(findSlot('10:30 - 12:00')?.available).toBe(false)
  })
})
