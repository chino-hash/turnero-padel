import {
  getUserBookings,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updatePaymentStatus,
  getBookingsByDateAndCourt,
  cancelBooking,
} from '../../../lib/services/bookings'
import { prisma } from '../../../lib/prisma'
import type { Booking, Court, User, BookingPlayer } from '@prisma/client'
import type { BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client'

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Bookings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockCourt: Court = {
    id: 'court-123',
    name: 'Cancha 1',
    description: 'Cancha techada',
    basePrice: 1000,
    priceMultiplier: 1.2,
    features: ['techada'],
    operatingHours: null,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    role: 'USER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockBooking: Booking = {
    id: 'booking-123',
    courtId: 'court-123',
    userId: 'user-123',
    bookingDate: new Date('2024-06-15'),
    startTime: '10:00',
    endTime: '11:30',
    durationMinutes: 90,
    totalPrice: 1200,
    depositAmount: 600,
    status: 'CONFIRMED' as BookingStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    paymentMethod: null,
    notes: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockBookingWithDetails = {
    ...mockBooking,
    court: mockCourt,
    user: mockUser,
    players: [] as BookingPlayer[],
  }

  describe('getUserBookings', () => {
    it('should return user bookings with details', async () => {
      const mockBookings = [mockBookingWithDetails]
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)

      const result = await getUserBookings('user-123')

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          court: true,
          user: true,
          players: true,
        },
        orderBy: [
          { bookingDate: 'desc' },
          { startTime: 'desc' },
        ],
      })
      expect(result).toEqual(mockBookings)
    })

    it('should return empty array when user has no bookings', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([])

      const result = await getUserBookings('user-123')

      expect(result).toEqual([])
    })

    it('should throw error when database fails', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.booking.findMany.mockRejectedValue(dbError)

      await expect(getUserBookings('user-123')).rejects.toThrow('Error al obtener las reservas')
      expect(console.error).toHaveBeenCalledWith('Error obteniendo reservas del usuario:', dbError)
    })
  })

  describe('getAllBookings', () => {
    it('should return all bookings with details', async () => {
      const mockBookings = [mockBookingWithDetails]
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)

      const result = await getAllBookings()

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        include: {
          court: true,
          user: true,
          players: true,
        },
        orderBy: [
          { bookingDate: 'desc' },
          { startTime: 'desc' },
        ],
      })
      expect(result).toEqual(mockBookings)
    })

    it('should throw error when database fails', async () => {
      const dbError = new Error('Database error')
      mockPrisma.booking.findMany.mockRejectedValue(dbError)

      await expect(getAllBookings()).rejects.toThrow('Error al obtener las reservas')
      expect(console.error).toHaveBeenCalledWith('Error obteniendo todas las reservas:', dbError)
    })
  })

  describe('getBookingById', () => {
    it('should return booking when found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingWithDetails)

      const result = await getBookingById('booking-123')

      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        include: {
          court: true,
          user: true,
          players: true,
        },
      })
      expect(result).toEqual(mockBookingWithDetails)
    })

    it('should return null when booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null)

      const result = await getBookingById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error when database fails', async () => {
      const dbError = new Error('Database error')
      mockPrisma.booking.findUnique.mockRejectedValue(dbError)

      await expect(getBookingById('booking-123')).rejects.toThrow('Error al obtener la reserva')
      expect(console.error).toHaveBeenCalledWith('Error obteniendo reserva:', dbError)
    })
  })

  describe('createBooking', () => {
    const createData = {
      courtId: 'court-123',
      userId: 'user-123',
      bookingDate: new Date('2024-06-15'),
      startTime: '10:00',
      endTime: '11:30',
      totalPrice: 1200,
      depositAmount: 600,
    }

    beforeEach(() => {
      // Mock checkAvailability to return true (available)
      mockPrisma.booking.findFirst.mockResolvedValue(null)
    })

    it('should create booking successfully when court is available', async () => {
      mockPrisma.booking.create.mockResolvedValue(mockBooking)

      const result = await createBooking(createData)

      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: {
          courtId: createData.courtId,
          userId: createData.userId,
          bookingDate: createData.bookingDate,
          startTime: createData.startTime,
          endTime: createData.endTime,
          durationMinutes: 90, // Calculated from time difference
          totalPrice: createData.totalPrice,
          depositAmount: createData.depositAmount,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          notes: undefined,
        },
      })
      expect(result).toEqual(mockBooking)
    })

    it('should throw error when court is not available', async () => {
      // Mock conflicting booking
      const conflictingBooking = {
        id: 'existing-booking',
        startTime: '10:30',
        endTime: '12:00',
        status: 'CONFIRMED',
      }
      mockPrisma.booking.findFirst.mockResolvedValue(conflictingBooking as any)

      await expect(createBooking(createData)).rejects.toThrow('La cancha no está disponible en el horario seleccionado')
    })

    it('should calculate duration correctly', async () => {
      const dataWithDifferentTimes = {
        ...createData,
        startTime: '14:00',
        endTime: '16:00', // 2 hours = 120 minutes
        durationMinutes: 120, // Explicitly set duration
      }
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      // Ensure availability check passes for this test
      mockPrisma.booking.findFirst.mockResolvedValue(null)

      await createBooking(dataWithDifferentTimes)

      expect(mockPrisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationMinutes: 120,
          }),
        })
      )
    })

    it('should throw error when creation fails', async () => {
      const dbError = new Error('Database constraint violation')
      mockPrisma.booking.create.mockRejectedValue(dbError)

      await expect(createBooking(createData)).rejects.toThrow('Database constraint violation')
      expect(console.error).toHaveBeenCalledWith('Error creando reserva:', dbError)
    })
  })

  describe('updateBookingStatus', () => {
    it('should update booking status successfully', async () => {
      const updatedBooking = { ...mockBooking, status: 'CANCELLED' as BookingStatus }
      mockPrisma.booking.update.mockResolvedValue(updatedBooking)

      const result = await updateBookingStatus('booking-123', 'CANCELLED', 'User requested cancellation')

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'User requested cancellation',
          cancelledAt: expect.any(Date),
        },
      })
      expect(result).toEqual(updatedBooking)
    })

    it('should update status without cancellation reason', async () => {
      const updatedBooking = { ...mockBooking, status: 'COMPLETED' as BookingStatus }
      mockPrisma.booking.update.mockResolvedValue(updatedBooking)

      const result = await updateBookingStatus('booking-123', 'COMPLETED')

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          status: 'COMPLETED',
          cancellationReason: undefined,
          cancelledAt: undefined,
        },
      })
      expect(result).toEqual(updatedBooking)
    })

    it('should throw error when update fails', async () => {
      const dbError = new Error('Booking not found')
      mockPrisma.booking.update.mockRejectedValue(dbError)

      await expect(updateBookingStatus('booking-123', 'CANCELLED')).rejects.toThrow('Error al actualizar el estado de la reserva')
      expect(console.error).toHaveBeenCalledWith('Error actualizando estado de reserva:', dbError)
    })
  })

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const updatedBooking = {
        ...mockBooking,
        paymentStatus: 'PAID' as PaymentStatus,
        paymentMethod: 'CREDIT_CARD' as PaymentMethod,
      }
      mockPrisma.booking.update.mockResolvedValue(updatedBooking)

      const result = await updatePaymentStatus('booking-123', 'PAID', 'CREDIT_CARD')

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'CREDIT_CARD',
        },
      })
      expect(result).toEqual(updatedBooking)
    })

    it('should update payment status without method', async () => {
      const updatedBooking = { ...mockBooking, paymentStatus: 'FAILED' as PaymentStatus }
      mockPrisma.booking.update.mockResolvedValue(updatedBooking)

      const result = await updatePaymentStatus('booking-123', 'FAILED')

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          paymentStatus: 'FAILED',
          paymentMethod: undefined,
        },
      })
      expect(result).toEqual(updatedBooking)
    })

    it('should throw error when update fails', async () => {
      const dbError = new Error('Payment update failed')
      mockPrisma.booking.update.mockRejectedValue(dbError)

      await expect(updatePaymentStatus('booking-123', 'PAID')).rejects.toThrow('Error al actualizar el estado de pago')
      expect(console.error).toHaveBeenCalledWith('Error actualizando estado de pago:', dbError)
    })
  })

  describe('getBookingsByDateAndCourt', () => {
    const testDate = new Date('2024-06-15')

    it('should return bookings for specific date and court', async () => {
      const mockBookings = [mockBooking]
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)

      const result = await getBookingsByDateAndCourt('court-123', testDate)

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          courtId: 'court-123',
          bookingDate: testDate,
          status: { not: 'CANCELLED' },
        },
        orderBy: { startTime: 'asc' },
      })
      expect(result).toEqual(mockBookings)
    })

    it('should return empty array when no bookings exist', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([])

      const result = await getBookingsByDateAndCourt('court-123', testDate)

      expect(result).toEqual([])
    })

    it('should throw error when database fails', async () => {
      const dbError = new Error('Database error')
      mockPrisma.booking.findMany.mockRejectedValue(dbError)

      await expect(getBookingsByDateAndCourt('court-123', testDate)).rejects.toThrow('Error al obtener las reservas')
      expect(console.error).toHaveBeenCalledWith('Error obteniendo reservas por fecha y cancha:', dbError)
    })
  })

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: 'CANCELLED' as BookingStatus,
        cancellationReason: 'User requested',
        cancelledBy: 'user-123',
        cancelledAt: expect.any(Date),
      }
      mockPrisma.booking.update.mockResolvedValue(cancelledBooking)

      const result = await cancelBooking('booking-123', 'User requested', 'user-123')

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'User requested (Cancelado por: user-123)',
          cancelledAt: expect.any(Date),
        },
      })
      expect(result).toEqual(cancelledBooking)
    })

    it('should throw error when cancellation fails', async () => {
      const dbError = new Error('Booking not found')
      mockPrisma.booking.update.mockRejectedValue(dbError)

      await expect(cancelBooking('booking-123', 'reason', 'user-123')).rejects.toThrow('Error al cancelar la reserva')
      expect(console.error).toHaveBeenCalledWith('Error cancelando reserva:', dbError)
    })
  })
})