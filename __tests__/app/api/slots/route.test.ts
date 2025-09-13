/// <reference types="@types/jest" />
// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn() as any as jest.MockedFunction<any>,
  config: {
    providers: [{
      id: 'google',
      name: 'Google',
      type: 'oauth',
    }],
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {},
  },
}))

import { GET, POST, DELETE } from '@/app/api/slots/route'
import { checkCourtAvailability } from '@/lib/services/courts'
import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/services/courts')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: jest.fn() as any as jest.MockedFunction<any>,
      create: jest.fn() as any as jest.MockedFunction<any>,
      delete: jest.fn() as any as jest.MockedFunction<any>,
    },
    court: {
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
    },
  },
}))

const mockCheckCourtAvailability = checkCourtAvailability as jest.MockedFunction<typeof checkCourtAvailability>
const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrismaBooking = prisma.booking as any
const mockPrismaCourt = prisma.court as any

describe('/api/slots', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
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

  describe('GET /api/slots', () => {
    it('should return available slots for a valid court and date', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123&date=2024-06-15'
      const request = new NextRequest(url)
      
      mockAuth.mockResolvedValue(mockSession)
      mockPrismaCourt.findUnique.mockResolvedValue(mockCourt)
      mockPrismaBooking.findMany.mockResolvedValue([])
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('slots')
      expect(Array.isArray(data.slots)).toBe(true)
    })

    it('should return 400 for missing courtId parameter', async () => {
      const url = 'http://localhost:3000/api/slots?date=2024-06-15'
      const request = new NextRequest(url)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for missing date parameter', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123'
      const request = new NextRequest(url)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for invalid date format', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123&date=invalid-date'
      const request = new NextRequest(url)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 404 for non-existent court', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=non-existent&date=2024-06-15'
      const request = new NextRequest(url)
      
      mockAuth.mockResolvedValue(mockSession)
      mockPrismaCourt.findUnique.mockResolvedValue(null)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data).toHaveProperty('error')
    })

    it('should return cached results on subsequent requests', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123&date=2024-06-15'
      const request1 = new NextRequest(url)
      const request2 = new NextRequest(url)
      
      mockAuth.mockResolvedValue(mockSession)
      mockPrismaCourt.findUnique.mockResolvedValue(mockCourt)
      mockPrismaBooking.findMany.mockResolvedValue([])
      
      // Primera solicitud
      const response1 = await GET(request1)
      expect(response1.status).toBe(200)
      
      // Segunda solicitud (debería usar caché)
      const response2 = await GET(request2)
      expect(response2.status).toBe(200)
      
      // Verificar que solo se llamó una vez a la base de datos
      expect(mockPrismaBooking.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors gracefully', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123&date=2024-06-15'
      const request = new NextRequest(url)
      
      mockAuth.mockResolvedValue(mockSession)
      mockPrismaCourt.findUnique.mockRejectedValue(new Error('Database error'))
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('POST /api/slots', () => {
    it('should create a booking successfully', async () => {
      const requestBody = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30',
        notes: 'Test booking'
      }
      
      const request = new NextRequest('http://localhost:3000/api/slots', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockSession)
      mockCheckCourtAvailability.mockResolvedValue(true)
      mockPrismaBooking.create.mockResolvedValue({
        id: 'booking-123',
        ...requestBody,
        userId: 'user-123',
        totalPrice: 1500,
        depositAmount: 750,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id')
      expect(data.courtId).toBe(requestBody.courtId)
    })

    it('should return 401 for unauthenticated users', async () => {
      const requestBody = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30'
      }
      
      const request = new NextRequest('http://localhost:3000/api/slots', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(null)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for invalid request body', async () => {
      const requestBody = {
        courtId: 'court-123',
        // Missing required fields
      }
      
      const request = new NextRequest('http://localhost:3000/api/slots', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockSession)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 409 for conflicting bookings', async () => {
      const requestBody = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30'
      }
      
      const request = new NextRequest('http://localhost:3000/api/slots', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockSession)
      mockCheckCourtAvailability.mockResolvedValue(false)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(409)
      expect(data).toHaveProperty('error')
    })
  })

  describe('DELETE /api/slots', () => {
    it('should delete a booking successfully', async () => {
      const url = 'http://localhost:3000/api/slots?bookingId=booking-123'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(mockSession)
      mockPrismaBooking.delete.mockResolvedValue({
        id: 'booking-123',
        courtId: 'court-123',
        userId: 'user-123',
        status: 'cancelled',
      })
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message')
    })

    it('should return 401 for unauthenticated users', async () => {
      const url = 'http://localhost:3000/api/slots?bookingId=booking-123'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(null)
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for missing bookingId parameter', async () => {
      const url = 'http://localhost:3000/api/slots'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(mockSession)
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should return 404 for non-existent booking', async () => {
      const url = 'http://localhost:3000/api/slots?bookingId=non-existent'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(mockSession)
      mockPrismaBooking.delete.mockRejectedValue(new Error('Record not found'))
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=court-123&date=2024-06-15'
      const request = new NextRequest(url)
      
      mockAuth.mockRejectedValue(new Error('Unexpected error'))
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })

    it('should validate input parameters correctly', async () => {
      const url = 'http://localhost:3000/api/slots?courtId=&date=2024-06-15'
      const request = new NextRequest(url)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Cache Management', () => {
    it('should clear cache after successful booking creation', async () => {
      // Primero hacer una consulta GET para llenar el caché
      const getUrl = 'http://localhost:3000/api/slots?courtId=court-123&date=2024-06-15'
      const getRequest = new NextRequest(getUrl)
      
      mockAuth.mockResolvedValue(mockSession)
      mockPrismaCourt.findUnique.mockResolvedValue(mockCourt)
      mockPrismaBooking.findMany.mockResolvedValue([])
      
      await GET(getRequest)
      
      // Luego crear una reserva
      const postBody = {
        courtId: 'court-123',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:30'
      }
      
      const postRequest = new NextRequest('http://localhost:3000/api/slots', {
        method: 'POST',
        body: JSON.stringify(postBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockCheckCourtAvailability.mockResolvedValue(true)
      mockPrismaBooking.create.mockResolvedValue({
        id: 'booking-123',
        ...postBody,
        userId: 'user-123',
        totalPrice: 1500,
        depositAmount: 750,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const postResponse = await POST(postRequest)
      expect(postResponse.status).toBe(201)
      
      // Hacer otra consulta GET para verificar que el caché se limpió
      const getRequest2 = new NextRequest(getUrl)
      await GET(getRequest2)
      
      // Verificar que se hicieron dos llamadas a la base de datos (caché limpiado)
      expect(mockPrismaBooking.findMany).toHaveBeenCalledTimes(2)
    })
  })
})