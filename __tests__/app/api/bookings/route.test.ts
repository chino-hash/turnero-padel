import { POST } from '@/app/api/bookings/route'
import { createBooking, checkAvailability, getBookingById } from '@/lib/services/bookings'
import { getCourtById } from '@/lib/services/courts'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))
jest.mock('@/lib/services/bookings', () => ({
  createBooking: jest.fn(),
  checkAvailability: jest.fn(),
  getBookingById: jest.fn(),
}))
jest.mock('@/lib/services/courts', () => ({
  getCourtById: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: jest.fn(),
    },
    bookingPlayer: {
      createMany: jest.fn(),
    },
  },
}))

const mockCreateBooking = createBooking as jest.MockedFunction<typeof createBooking>
const mockCheckAvailability = checkAvailability as jest.MockedFunction<typeof checkAvailability>
const mockGetBookingById = getBookingById as jest.MockedFunction<typeof getBookingById>
const mockGetCourtById = getCourtById as jest.MockedFunction<typeof getCourtById>
const mockPrismaSystemSetting = prisma.systemSetting.findUnique as jest.MockedFunction<typeof prisma.systemSetting.findUnique>
const mockPrismaBookingPlayer = prisma.bookingPlayer.createMany as jest.MockedFunction<typeof prisma.bookingPlayer.createMany>

// Import auth mock
const { auth } = require('@/lib/auth')
const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/bookings', () => {
  beforeEach(() => {
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Configurar mocks por defecto
    mockPrismaSystemSetting.mockResolvedValue({
      id: 'deposit-percentage',
      key: 'deposit_percentage',
      value: '50',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    mockPrismaBookingPlayer.mockResolvedValue({ count: 0 })
    
    // Configurar mocks de servicios
    
    // Configurar mock de auth
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      },
      expires: '2024-12-31T23:59:59.999Z',
    })
    
    mockCheckAvailability.mockResolvedValue(true)
    
    mockGetCourtById.mockResolvedValue({
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
    })
    
    const mockBookingData = {
      id: 'booking-123',
      courtId: 'court-123',
      userId: 'user-123',
      bookingDate: new Date('2024-06-15'),
      startTime: '10:00',
      endTime: '11:30',
      totalPrice: 1500,
      depositAmount: 750,
      status: 'confirmed',
      notes: 'Test booking',
      cancellationReason: null,
      cancelledBy: null,
      cancelledAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }
    
    mockCreateBooking.mockResolvedValue(mockBookingData)
    mockGetBookingById.mockResolvedValue({
      ...mockBookingData,
      court: {
        id: 'court-123',
        name: 'Cancha 1',
        basePrice: 1500,
        priceMultiplier: 1,
        features: ['techada'],
        operatingHours: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      players: [
        { id: 'player-1', bookingId: 'booking-123', position: 1, playerName: 'Test User' },
        { id: 'player-2', bookingId: 'booking-123', position: 2, playerName: 'Jugador 2' },
        { id: 'player-3', bookingId: 'booking-123', position: 3, playerName: 'Jugador 3' },
        { id: 'player-4', bookingId: 'booking-123', position: 4, playerName: 'Jugador 4' },
      ],
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    },
    expires: '2024-12-31T23:59:59.999Z',
  }

  const mockCourt = {
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

  const mockBooking = {
    id: 'booking-123',
    courtId: 'court-123',
    userId: 'user-123',
    bookingDate: new Date('2024-06-15'),
    startTime: '10:00',
    endTime: '11:30',
    durationMinutes: 90,
    totalPrice: 1200,
    depositAmount: 600,
    status: 'CONFIRMED' as const,
    paymentStatus: 'PENDING' as const,
    paymentMethod: null,
    notes: null,
    cancellationReason: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  // Usar una fecha futura para las pruebas
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const validBookingData = {
     courtId: 'court-123',
     date: tomorrowStr,
     startTime: '10:00',
     endTime: '11:30',
     notes: 'Test booking',
   }

  describe('POST /api/bookings', () => {
    it('should create booking successfully with valid data', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourtById.mockResolvedValue(mockCourt)
      mockCreateBooking.mockResolvedValue(mockBooking)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockAuth).toHaveBeenCalled()
      expect(mockGetCourtById).toHaveBeenCalledWith('court-123')
      expect(mockCreateBooking).toHaveBeenCalledWith({
        courtId: 'court-123',
        userId: 'user-123',
        bookingDate: expect.any(Date),
        startTime: '10:00',
        endTime: '11:30',
        totalPrice: 1200, // 1000 * 1.2 (precio fijo)
        depositAmount: 600, // 50% of total price
        notes: 'Test booking',
      })
      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id')
    })

    it('should return 401 when no session exists', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No autorizado' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 401 when session has no user ID', async () => {
      const sessionWithoutUserId = {
        user: {
          email: 'user@example.com',
          name: 'Test User',
        },
        expires: '2024-12-31T23:59:59.999Z',
      }
      mockAuth.mockResolvedValue(sessionWithoutUserId)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No autorizado' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid JSON', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Datos inválidos' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 400 for missing required fields', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const incompleteData = {
        courtId: 'court-123',
        // Missing bookingDate, startTime, endTime
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Faltan campos requeridos' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid date format', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const invalidDateData = {
        ...validBookingData,
        date: 'invalid-date',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidDateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Formato de fecha inválido' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid time format', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const invalidTimeData = {
        ...validBookingData,
        startTime: '25:00', // Invalid hour
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidTimeData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Formato de hora inválido' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 400 when end time is before start time', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const invalidTimeOrderData = {
        ...validBookingData,
        startTime: '12:00',
        endTime: '10:00', // End before start
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidTimeOrderData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'La hora de fin debe ser posterior a la hora de inicio' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 400 for booking in the past', async () => {
      mockAuth.mockResolvedValue(mockSession)

      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // Yesterday

      const pastDateData = {
        ...validBookingData,
        date: pastDate.toISOString().split('T')[0],
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(pastDateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'No se pueden hacer reservas en fechas pasadas' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 404 when court does not exist', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourtById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockGetCourtById).toHaveBeenCalledWith('court-123')
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Cancha no encontrada' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should return 400 when court is inactive', async () => {
      mockAuth.mockResolvedValue(mockSession)
      const inactiveCourt = { ...mockCourt, isActive: false }
      mockGetCourtById.mockResolvedValue(inactiveCourt)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'La cancha no está disponible' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should calculate price correctly for different durations', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourtById.mockResolvedValue(mockCourt)
      mockCreateBooking.mockResolvedValue(mockBooking)

      // Test 2-hour booking
      const twoHourBooking = {
        ...validBookingData,
        startTime: '10:00',
        endTime: '12:00', // 2 hours
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(twoHourBooking),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      await POST(request)

      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPrice: 1200, // 1000 * 1.2 (precio fijo)
          depositAmount: 600, // 50% of total
        })
      )
    })

    it('should handle service errors during booking creation', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourtById.mockResolvedValue(mockCourt)
      
      const serviceError = new Error('Court not available')
      mockCreateBooking.mockRejectedValue(serviceError)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(console.error).toHaveBeenCalledWith('Error creating booking:', serviceError)
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Error interno del servidor' })
    })

    it('should handle court service errors', async () => {
      mockAuth.mockResolvedValue(mockSession)
      
      const courtError = new Error('Database error')
      mockGetCourtById.mockRejectedValue(courtError)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(console.error).toHaveBeenCalledWith('Error creating booking:', courtError)
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Error interno del servidor' })
      expect(mockCreateBooking).not.toHaveBeenCalled()
    })

    it('should handle booking without notes', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourtById.mockResolvedValue(mockCourt)
      mockCreateBooking.mockResolvedValue(mockBooking)

      const bookingWithoutNotes = {
        courtId: 'court-123',
        date: tomorrowStr,
        startTime: '10:00',
        endTime: '11:30',
        // No notes field
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingWithoutNotes),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: undefined,
        })
      )
      expect(response.status).toBe(201)
    })

    it('should handle minimum booking duration (30 minutes)', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourtById.mockResolvedValue(mockCourt)
      mockCreateBooking.mockResolvedValue(mockBooking)

      const shortBooking = {
        ...validBookingData,
        startTime: '10:00',
        endTime: '10:30', // 30 minutes
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(shortBooking),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPrice: 1200, // 1000 * 1.2 (precio fijo)
          depositAmount: 600, // 50% of total        
        })
      )
      expect(response.status).toBe(201)
    })
  })
})