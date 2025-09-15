import {
  formatBookingDate,
  formatBookingTime,
  generateTimeSlots,
  filterAvailableSlots,
  validateBookingData,
  calculateBookingDuration,
  isTimeSlotAvailable,
  getBookingStatusColor,
  formatPrice,
} from '../../../lib/utils/booking-utils'
import { BookingFormData, Booking } from '../../../types/booking'

describe('Booking Utils', () => {
  describe('Date and Time Formatting', () => {
    it('should format booking date correctly', () => {
      const date = new Date('2024-06-15T10:30:00Z')
      expect(formatBookingDate(date)).toBe('15/06/2024')
    })

    it('should format booking time correctly', () => {
      expect(formatBookingTime('10:30')).toBe('10:30')
      expect(formatBookingTime('09:00')).toBe('09:00')
      expect(formatBookingTime('14:45')).toBe('14:45')
    })

    it('should handle invalid time format', () => {
      expect(formatBookingTime('invalid')).toBe('invalid')
      expect(formatBookingTime('')).toBe('')
    })
  })

  describe('Time Slots Generation', () => {
    it('should generate time slots correctly', () => {
      const slots = generateTimeSlots('09:00', '12:00', 90)
      
      expect(slots).toEqual([
        { start: '09:00', end: '10:30' },
        { start: '10:30', end: '12:00' },
      ])
    })

    it('should handle different intervals', () => {
      const slots = generateTimeSlots('10:00', '13:00', 60)
      
      expect(slots).toEqual([
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
        { start: '12:00', end: '13:00' },
      ])
    })

    it('should return empty array for invalid times', () => {
      const slots = generateTimeSlots('12:00', '10:00', 90)
      expect(slots).toEqual([])
    })
  })

  describe('Available Slots Filtering', () => {
    const mockBookings: Booking[] = [
      {
        id: '1',
        courtId: 'court-1',
        userId: 'user-1',
        bookingDate: new Date('2024-06-15'),
        startTime: '10:00',
        endTime: '11:30',
        totalPrice: 1500,
        depositAmount: 750,
        status: 'confirmed',
        durationMinutes: 90,
        paymentStatus: 'pending',
        paymentMethod: null,
        notes: null,
        cancellationReason: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const allSlots = [
      { start: '09:00', end: '10:30' },
      { start: '10:00', end: '11:30' },
      { start: '11:30', end: '13:00' },
      { start: '14:00', end: '15:30' },
    ]

    it('should filter out occupied slots', () => {
      const availableSlots = filterAvailableSlots(
        allSlots,
        mockBookings,
        'court-1',
        '2024-06-15'
      )

      expect(availableSlots).toEqual([
        { start: '09:00', end: '10:30' },
        { start: '11:30', end: '13:00' },
        { start: '14:00', end: '15:30' },
      ])
    })

    it('should return all slots when no bookings', () => {
      const availableSlots = filterAvailableSlots(
        allSlots,
        [],
        'court-1',
        '2024-06-15'
      )

      expect(availableSlots).toEqual(allSlots)
    })

    it('should filter by court and date', () => {
      const availableSlots = filterAvailableSlots(
        allSlots,
        mockBookings,
        'court-2', // Different court
        '2024-06-15'
      )

      expect(availableSlots).toEqual(allSlots)
    })
  })

  describe('Booking Validation', () => {
    const validBookingData: BookingFormData = {
      courtId: 'court-1',
      bookingDate: '2024-06-15',
      startTime: '10:00',
      endTime: '11:30',
      players: ['Player 1', 'Player 2'],
      notes: 'Test booking',
    }

    it('should validate correct booking data', () => {
      const result = validateBookingData(validBookingData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should detect missing required fields', () => {
      const invalidData = {
        ...validBookingData,
        courtId: '',
        startTime: '',
      }

      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Court ID is required')
      expect(result.errors).toContain('Start time is required')
    })

    it('should validate time logic', () => {
      const invalidData = {
        ...validBookingData,
        startTime: '12:00',
        endTime: '10:00', // End before start
      }

      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('End time must be after start time')
    })

    it('should validate date is not in the past', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const invalidData = {
        ...validBookingData,
        bookingDate: yesterday.toISOString().split('T')[0],
      }

      const result = validateBookingData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Booking date cannot be in the past')
    })
  })

  describe('Duration Calculation', () => {
    it('should calculate duration correctly', () => {
      expect(calculateBookingDuration('10:00', '11:30')).toBe(90)
      expect(calculateBookingDuration('09:00', '10:00')).toBe(60)
      expect(calculateBookingDuration('14:30', '16:00')).toBe(90)
    })

    it('should handle invalid times', () => {
      expect(calculateBookingDuration('invalid', '11:30')).toBe(0)
      expect(calculateBookingDuration('10:00', 'invalid')).toBe(0)
    })

    it('should handle end time before start time', () => {
      expect(calculateBookingDuration('12:00', '10:00')).toBe(0)
    })
  })

  describe('Time Slot Availability', () => {
    const mockBookings: Booking[] = [
      {
        id: '1',
        courtId: 'court-1',
        userId: 'user-1',
        bookingDate: new Date('2024-06-15'),
        startTime: '10:00',
        endTime: '11:30',
        totalPrice: 1500,
        depositAmount: 750,
        status: 'confirmed',
        durationMinutes: 90,
        paymentStatus: 'pending',
        paymentMethod: null,
        notes: null,
        cancellationReason: null,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it('should detect unavailable time slot', () => {
      const isAvailable = isTimeSlotAvailable(
        '10:00',
        '11:30',
        mockBookings,
        'court-1',
        '2024-06-15'
      )

      expect(isAvailable).toBe(false)
    })

    it('should detect available time slot', () => {
      const isAvailable = isTimeSlotAvailable(
        '12:00',
        '13:30',
        mockBookings,
        'court-1',
        '2024-06-15'
      )

      expect(isAvailable).toBe(true)
    })

    it('should handle overlapping times', () => {
      const isAvailable = isTimeSlotAvailable(
        '09:30',
        '10:30', // Overlaps with existing booking
        mockBookings,
        'court-1',
        '2024-06-15'
      )

      expect(isAvailable).toBe(false)
    })
  })

  describe('Status and Formatting', () => {
    it('should return correct status colors', () => {
      expect(getBookingStatusColor('confirmed')).toBe('bg-green-100 text-green-800')
      expect(getBookingStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800')
      expect(getBookingStatusColor('cancelled')).toBe('bg-red-100 text-red-800')
      expect(getBookingStatusColor('completed')).toBe('bg-blue-100 text-blue-800')
    })

    it('should format prices correctly', () => {
      expect(formatPrice(1500)).toBe('$1.500')
      expect(formatPrice(500)).toBe('$500')
      expect(formatPrice(0)).toBe('$0')
    })

    it('should handle decimal prices', () => {
      expect(formatPrice(1500.50)).toBe('$1.501')
      expect(formatPrice(999.99)).toBe('$1.000')
    })
  })
})