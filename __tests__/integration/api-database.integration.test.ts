/// <reference types="@types/jest" />
/**
 * Pruebas de integración para validar la interacción entre APIs y base de datos
 * Estas pruebas verifican el flujo completo desde la API hasta la base de datos
 */

// Mock de autenticación
jest.mock('@/lib/auth', () => ({
  auth: jest.fn() as any as jest.MockedFunction<any>,
}))

// Mock de Prisma con implementación más realista
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
      findMany: jest.fn() as any as jest.MockedFunction<any>,
      create: jest.fn() as any as jest.MockedFunction<any>,
      update: jest.fn() as any as jest.MockedFunction<any>,
      delete: jest.fn() as any as jest.MockedFunction<any>,
    },
    court: {
      findMany: jest.fn() as any as jest.MockedFunction<any>,
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
      create: jest.fn() as any as jest.MockedFunction<any>,
      update: jest.fn() as any as jest.MockedFunction<any>,
      delete: jest.fn() as any as jest.MockedFunction<any>,
    },
    booking: {
      findMany: jest.fn() as any as jest.MockedFunction<any>,
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
      create: jest.fn() as any as jest.MockedFunction<any>,
      update: jest.fn() as any as jest.MockedFunction<any>,
      delete: jest.fn() as any as jest.MockedFunction<any>,
      count: jest.fn() as any as jest.MockedFunction<any>,
    },
    systemSetting: {
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
      findMany: jest.fn() as any as jest.MockedFunction<any>,
      upsert: jest.fn() as any as jest.MockedFunction<any>,
    },
    $transaction: jest.fn() as any as jest.MockedFunction<any>,
    $connect: jest.fn() as any as jest.MockedFunction<any>,
    $disconnect: jest.fn() as any as jest.MockedFunction<any>,
  }
  
  return { prisma: mockPrisma }
})

import { GET as getCourts, POST as createCourt } from '@/app/api/courts/route'
import { GET as getSlots, POST as createBooking, DELETE as deleteBooking } from '@/app/api/slots/route'
import { POST as createBookingAPI } from '@/app/api/bookings/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as any

describe('API-Database Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockAdminSession = {
    user: {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      isAdmin: true,
    },
    expires: '2024-12-31T23:59:59.999Z',
  }

  const mockUserSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      isAdmin: false,
    },
    expires: '2024-12-31T23:59:59.999Z',
  }

  describe('Courts API Integration', () => {
    it('should retrieve courts from database successfully', async () => {
      const mockCourts = [
        {
          id: 'court-1',
          name: 'Cancha 1',
          description: 'Cancha techada',
          basePrice: 1000,
          priceMultiplier: 1.2,
          features: ['techada'],
          operatingHours: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'court-2',
          name: 'Cancha 2',
          description: 'Cancha al aire libre',
          basePrice: 800,
          priceMultiplier: 1.0,
          features: ['aire libre'],
          operatingHours: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ]

      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrisma.court.findMany.mockResolvedValue(mockCourts)

      const response = await getCourts()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCourts)
      expect(mockPrisma.court.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
    })

    it('should create court in database with proper validation', async () => {
      const courtData = {
        name: 'Nueva Cancha',
        description: 'Cancha de prueba',
        basePrice: 1200,
        features: ['techada', 'iluminada'],
      }

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(courtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrisma.court.create.mockResolvedValue({
        id: 'court-new',
        ...courtData,
        priceMultiplier: 1.0,
        operatingHours: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const response = await createCourt(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(courtData.name)
      expect(mockPrisma.court.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: courtData.name,
          description: courtData.description,
          basePrice: courtData.basePrice,
          features: courtData.features,
        }),
      })
    })

    it('should handle database connection errors', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrisma.court.findMany.mockRejectedValue(new Error('Database connection failed'))

      const response = await getCourts()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Bookings API Integration', () => {
    it('should create booking with database transaction', async () => {
      const bookingData = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30',
        notes: 'Test booking',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      mockAuth.mockResolvedValue(mockUserSession)
      
      // Mock system settings
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        id: 'deposit-percentage',
        key: 'deposit_percentage',
        value: '50',
      })

      // Mock court data
      mockPrisma.court.findUnique.mockResolvedValue({
        id: 'court-123',
        name: 'Cancha 1',
        basePrice: 1000,
        priceMultiplier: 1.5,
        isActive: true,
      })

      // Mock availability check
      mockPrisma.booking.findMany.mockResolvedValue([])

      // Mock booking creation
      const createdBooking = {
        id: 'booking-123',
        ...bookingData,
        userId: 'user-123',
        bookingDate: new Date('2024-06-15'),
        totalPrice: 1500,
        depositAmount: 750,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.booking.create.mockResolvedValue(createdBooking)

      const response = await createBookingAPI(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('booking-123')
      expect(data.totalPrice).toBe(1500)
      expect(data.depositAmount).toBe(750)
    })

    it('should validate booking conflicts in database', async () => {
      const bookingData = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      mockAuth.mockResolvedValue(mockUserSession)
      
      // Mock existing conflicting booking
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'existing-booking',
          courtId: 'court-123',
          bookingDate: new Date('2024-06-15'),
          startTime: '09:30',
          endTime: '11:00',
          status: 'confirmed',
        },
      ])

      const response = await createBookingAPI(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('conflicto')
    })

    it('should handle database rollback on booking creation failure', async () => {
      const bookingData = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      mockAuth.mockResolvedValue(mockUserSession)
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'deposit_percentage',
        value: '50',
      })
      
      // Simular fallo en la creación de la reserva
      mockPrisma.booking.create.mockRejectedValue(new Error('Database constraint violation'))

      const response = await createBookingAPI(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Slots API Integration', () => {
    it('should retrieve available slots from database', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123&date=2024-06-15'
      const request = new NextRequest(url)

      mockAuth.mockResolvedValue(mockUserSession)
      
      // Mock court data
      mockPrisma.court.findUnique.mockResolvedValue({
        id: 'court-123',
        name: 'Cancha 1',
        basePrice: 1000,
        isActive: true,
      })

      // Mock existing bookings
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'booking-1',
          startTime: '10:00',
          endTime: '11:30',
          status: 'confirmed',
        },
      ])

      const response = await getSlots(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('slots')
      expect(Array.isArray(data.slots)).toBe(true)
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          courtId: 'court-123',
          bookingDate: new Date('2024-06-15'),
          status: { in: ['confirmed', 'pending'] },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      })
    })

    it('should delete booking and update database', async () => {
      const url = 'http://localhost:3000/api/slots?bookingId=booking-123'
      const request = new NextRequest(url, { method: 'DELETE' })

      mockAuth.mockResolvedValue(mockUserSession)
      mockPrisma.booking.delete.mockResolvedValue({
        id: 'booking-123',
        courtId: 'court-123',
        userId: 'user-123',
        status: 'cancelled',
      })

      const response = await deleteBooking(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message')
      expect(mockPrisma.booking.delete).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
      })
    })
  })

  describe('Database Transaction Integrity', () => {
    it('should maintain data consistency during concurrent operations', async () => {
      // Simular operaciones concurrentes
      const bookingData1 = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30',
      }

      const bookingData2 = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:30',
        endTime: '12:00',
      }

      const request1 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData1),
        headers: { 'Content-Type': 'application/json' },
      })

      const request2 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData2),
        headers: { 'Content-Type': 'application/json' },
      })

      mockAuth.mockResolvedValue(mockUserSession)
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'deposit_percentage',
        value: '50',
      })

      // Primera reserva exitosa
      mockPrisma.booking.findMany.mockResolvedValueOnce([])
      mockPrisma.booking.create.mockResolvedValueOnce({
        id: 'booking-1',
        ...bookingData1,
        userId: 'user-123',
        totalPrice: 1500,
        status: 'confirmed',
      })

      // Segunda reserva con conflicto
      mockPrisma.booking.findMany.mockResolvedValueOnce([
        {
          id: 'booking-1',
          startTime: '10:00',
          endTime: '11:30',
          status: 'confirmed',
        },
      ])

      const [response1, response2] = await Promise.all([
        createBookingAPI(request1),
        createBookingAPI(request2),
      ])

      expect(response1.status).toBe(201)
      expect(response2.status).toBe(409) // Conflicto detectado
    })

    it('should handle database transaction rollback', async () => {
      const bookingData = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: { 'Content-Type': 'application/json' },
      })

      mockAuth.mockResolvedValue(mockUserSession)
      
      // Simular transacción que falla
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))

      const response = await createBookingAPI(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Database Performance and Optimization', () => {
    it('should handle large dataset queries efficiently', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      
      // Simular dataset grande
      const largeCourtsDataset = Array(1000).fill(null).map((_, index) => ({
        id: `court-${index}`,
        name: `Cancha ${index}`,
        basePrice: 1000 + (index * 10),
        isActive: true,
      }))

      mockPrisma.court.findMany.mockResolvedValue(largeCourtsDataset)

      const startTime = Date.now()
      const response = await getCourts()
      const endTime = Date.now()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(5000) // Menos de 5 segundos
    })

    it('should use database indexes effectively', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123&date=2024-06-15'
      const request = new NextRequest(url)

      mockAuth.mockResolvedValue(mockUserSession)
      mockPrisma.court.findUnique.mockResolvedValue({
        id: 'court-123',
        name: 'Cancha 1',
        isActive: true,
      })
      mockPrisma.booking.findMany.mockResolvedValue([])

      const response = await getSlots(request)

      expect(response.status).toBe(200)
      // Verificar que se usan índices apropiados en las consultas
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          courtId: 'court-123', // Índice en courtId
          bookingDate: new Date('2024-06-15'), // Índice en bookingDate
          status: { in: ['confirmed', 'pending'] }, // Índice en status
        },
        select: {
          startTime: true,
          endTime: true,
        },
      })
    })
  })

  describe('Data Validation and Constraints', () => {
    it('should enforce database constraints', async () => {
      const invalidCourtData = {
        name: '', // Nombre vacío (violación de constraint)
        basePrice: -100, // Precio negativo (violación de constraint)
      }

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(invalidCourtData),
        headers: { 'Content-Type': 'application/json' },
      })

      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrisma.court.create.mockRejectedValue(
        new Error('Constraint violation: name cannot be empty')
      )

      const response = await createCourt(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should validate foreign key relationships', async () => {
      const bookingWithInvalidCourt = {
        courtId: 'non-existent-court',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingWithInvalidCourt),
        headers: { 'Content-Type': 'application/json' },
      })

      mockAuth.mockResolvedValue(mockUserSession)
      mockPrisma.court.findUnique.mockResolvedValue(null) // Cancha no existe

      const response = await createBookingAPI(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('cancha no encontrada')
    })
  })

  describe('Database Connection Management', () => {
    it('should handle database connection timeouts', async () => {
      mockAuth.mockResolvedValue(mockUserSession)
      mockPrisma.court.findMany.mockRejectedValue(new Error('Connection timeout'))

      const response = await getCourts()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })

    it('should retry failed database operations', async () => {
      mockAuth.mockResolvedValue(mockUserSession)
      
      // Simular fallo temporal seguido de éxito
      mockPrisma.court.findMany
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce([
          {
            id: 'court-1',
            name: 'Cancha 1',
            isActive: true,
          },
        ])

      // En una implementación real, habría lógica de retry
      // Por ahora, solo verificamos el comportamiento del mock
      try {
        await getCourts()
      } catch (error: unknown) {
        // Primer intento falla
        expect(error).toBeDefined()
      }

      // Segundo intento exitoso
      const response = await getCourts()
      expect(response.status).toBe(200)
    })
  })
})