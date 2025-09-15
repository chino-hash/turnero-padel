/// <reference types="@types/jest" />
// Mock the auth module
jest.mock('../../../../lib/auth', () => ({
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

import { GET, POST } from '../../../../app/api/courts/route'
import { getCourts, createCourt } from '../../../../lib/services/courts'
import { auth } from '../../../../lib/auth'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('../../../../lib/services/courts')

const mockGetCourts = getCourts as jest.MockedFunction<typeof getCourts>
const mockCreateCourt = createCourt as jest.MockedFunction<typeof createCourt>
const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/courts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

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
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
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
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ]

  const mockSession = {
    user: {
      email: 'admin@example.com',
      name: 'Admin User',
      image: 'https://example.com/avatar.jpg',
      isAdmin: true,
    },
    expires: '2024-12-31T23:59:59.999Z',
  }

  describe('GET /api/courts', () => {
    it('should return all courts successfully', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourts.mockResolvedValue(mockCourts)

      const response = await GET()
      const data = await response.json()

      expect(mockGetCourts).toHaveBeenCalledWith()
      expect(response.status).toBe(200)
      expect(data).toEqual(mockCourts)
    })

    it('should return empty array when no courts exist', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockGetCourts.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No autorizado' })
      expect(mockGetCourts).not.toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      mockAuth.mockResolvedValue(mockSession)
      const serviceError = new Error('Database connection failed')
      mockGetCourts.mockRejectedValue(serviceError)

      const response = await GET()
      const data = await response.json()

      expect(console.error).toHaveBeenCalledWith('Error en GET /api/courts:', serviceError)
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Error interno del servidor' })
    })
  })

  describe('POST /api/courts', () => {
    const validCourtData = {
      name: 'Nueva Cancha',
      description: 'Cancha de prueba',
      basePrice: 1200,
      priceMultiplier: 1.5,
      features: ['techada', 'iluminada'],
    }

    const mockCreatedCourt = {
      id: 'court-new',
      name: 'Nueva Cancha',
      description: 'Cancha de prueba',
      basePrice: 1200,
      priceMultiplier: 1.5,
      features: ['techada', 'iluminada'],
      operatingHours: null,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    it('should create court successfully with admin session', async () => {
      mockAuth.mockResolvedValue(mockSession)
      mockCreateCourt.mockResolvedValue(mockCreatedCourt)

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(validCourtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockAuth).toHaveBeenCalled()
      expect(mockCreateCourt).toHaveBeenCalledWith(validCourtData)
      expect(response.status).toBe(201)
      expect(data).toEqual(mockCreatedCourt)
    })

    it('should return 401 when no session exists', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(validCourtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No autorizado' })
      expect(mockCreateCourt).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not admin', async () => {
      const nonAdminSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          isAdmin: false,
        },
      }
      mockAuth.mockResolvedValue(nonAdminSession)

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(validCourtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No autorizado' })
      expect(mockCreateCourt).not.toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      mockAuth.mockResolvedValue(mockSession)
      const serviceError = new Error('Database connection failed')
      mockCreateCourt.mockRejectedValue(serviceError)

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(validCourtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(console.error).toHaveBeenCalledWith('Error en POST /api/courts:', serviceError)
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Error interno del servidor' })
    })

    it('should handle service errors during creation', async () => {
      mockAuth.mockResolvedValue(mockSession)
      
      const serviceError = new Error('Database constraint violation')
      mockCreateCourt.mockRejectedValue(serviceError)

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(validCourtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(console.error).toHaveBeenCalledWith('Error en POST /api/courts:', serviceError)
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Error interno del servidor' })
    })

    it('should handle session without email', async () => {
      const sessionWithoutEmail = {
        user: {
          name: 'User Without Email',
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2024-12-31T23:59:59.999Z',
      }
      mockAuth.mockResolvedValue(sessionWithoutEmail)

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(validCourtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No autorizado' })
      expect(mockCreateCourt).not.toHaveBeenCalled()
    })

    it('should handle getUserRole errors', async () => {
      // Simular una sesión sin isAdmin para que falle la autorización
      const sessionWithoutAdmin = {
        user: {
          email: 'user@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
          isAdmin: false
        },
        expires: '2024-12-31T23:59:59.999Z',
      }
      mockAuth.mockResolvedValue(sessionWithoutAdmin)

      const request = new NextRequest('http://localhost:3000/api/courts', {
        method: 'POST',
        body: JSON.stringify(validCourtData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No autorizado' })
      expect(mockCreateCourt).not.toHaveBeenCalled()
    })
  })
})