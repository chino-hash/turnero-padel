// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
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

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    court: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemSetting: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

import { GET, POST, PUT, DELETE } from '@/app/api/admin/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrismaUser = prisma.user as any
const mockPrismaBooking = prisma.booking as any
const mockPrismaCourt = prisma.court as any
const mockPrismaSystemSetting = prisma.systemSetting as any

describe('/api/admin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    image: 'https://example.com/admin-avatar.jpg',
    isAdmin: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockRegularUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Regular User',
    image: 'https://example.com/user-avatar.jpg',
    isAdmin: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockAdminSession = {
    user: mockAdminUser,
    expires: '2024-12-31T23:59:59.999Z',
  }

  const mockUserSession = {
    user: mockRegularUser,
    expires: '2024-12-31T23:59:59.999Z',
  }

  describe('GET /api/admin - Dashboard Data', () => {
    it('should return dashboard data for admin users', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      
      // Mock dashboard data
      mockPrismaUser.findMany.mockResolvedValue([
        mockAdminUser,
        mockRegularUser,
      ])
      
      mockPrismaBooking.count.mockResolvedValue(150)
      mockPrismaBooking.findMany.mockResolvedValue([
        {
          id: 'booking-1',
          courtId: 'court-1',
          userId: 'user-1',
          bookingDate: new Date('2024-06-15'),
          totalPrice: 1500,
          status: 'confirmed',
        },
      ])
      
      mockPrismaCourt.findMany.mockResolvedValue([
        {
          id: 'court-1',
          name: 'Cancha 1',
          isActive: true,
        },
      ])
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('users')
      expect(data).toHaveProperty('bookings')
      expect(data).toHaveProperty('courts')
      expect(data.users).toHaveLength(2)
    })

    it('should return 403 for non-admin users', async () => {
      mockAuth.mockResolvedValue(mockUserSession)
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('acceso denegado')
    })

    it('should return 401 for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null)
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error')
    })

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaUser.findMany.mockRejectedValue(new Error('Database error'))
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('POST /api/admin - Create Resources', () => {
    it('should create a new court as admin', async () => {
      const courtData = {
        name: 'Nueva Cancha',
        description: 'Cancha de prueba',
        basePrice: 1200,
        features: ['techada', 'iluminada'],
      }
      
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify({ type: 'court', data: courtData }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaCourt.create.mockResolvedValue({
        id: 'court-new',
        ...courtData,
        priceMultiplier: 1.0,
        operatingHours: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.name).toBe(courtData.name)
      expect(mockPrismaCourt.create).toHaveBeenCalledWith({
        data: expect.objectContaining(courtData),
      })
    })

    it('should create system settings as admin', async () => {
      const settingData = {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable/disable maintenance mode',
      }
      
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify({ type: 'setting', data: settingData }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaSystemSetting.upsert.mockResolvedValue({
        id: 'setting-1',
        ...settingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.key).toBe(settingData.key)
    })

    it('should return 403 for non-admin users', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify({ type: 'court', data: {} }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockUserSession)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify({ type: 'court', data: {} }), // Missing required fields
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('PUT /api/admin - Update Resources', () => {
    it('should update user permissions as admin', async () => {
      const updateData = {
        id: 'user-123',
        isAdmin: true,
      }
      
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        body: JSON.stringify({ type: 'user', data: updateData }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaUser.update.mockResolvedValue({
        ...mockRegularUser,
        isAdmin: true,
        updatedAt: new Date(),
      })
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.isAdmin).toBe(true)
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: { isAdmin: updateData.isAdmin },
      })
    })

    it('should update court information as admin', async () => {
      const updateData = {
        id: 'court-123',
        name: 'Cancha Actualizada',
        basePrice: 1500,
      }
      
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        body: JSON.stringify({ type: 'court', data: updateData }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaCourt.update.mockResolvedValue({
        id: updateData.id,
        name: updateData.name,
        basePrice: updateData.basePrice,
        description: 'Cancha actualizada',
        priceMultiplier: 1.0,
        features: [],
        operatingHours: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      })
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.name).toBe(updateData.name)
      expect(data.basePrice).toBe(updateData.basePrice)
    })

    it('should return 403 for non-admin users', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        body: JSON.stringify({ type: 'user', data: { id: 'user-123' } }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockUserSession)
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
    })

    it('should return 404 for non-existent resources', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        body: JSON.stringify({ type: 'user', data: { id: 'non-existent' } }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaUser.update.mockRejectedValue(new Error('Record not found'))
      
      const response = await PUT(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data).toHaveProperty('error')
    })
  })

  describe('DELETE /api/admin - Delete Resources', () => {
    it('should deactivate court as admin', async () => {
      const url = 'http://localhost:3000/api/admin?type=court&id=court-123'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaCourt.update.mockResolvedValue({
        id: 'court-123',
        name: 'Cancha 1',
        isActive: false,
        updatedAt: new Date(),
      })
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message')
      expect(mockPrismaCourt.update).toHaveBeenCalledWith({
        where: { id: 'court-123' },
        data: { isActive: false },
      })
    })

    it('should delete user as admin', async () => {
      const url = 'http://localhost:3000/api/admin?type=user&id=user-123'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaUser.delete.mockResolvedValue(mockRegularUser)
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message')
      expect(mockPrismaUser.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
    })

    it('should return 403 for non-admin users', async () => {
      const url = 'http://localhost:3000/api/admin?type=user&id=user-123'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(mockUserSession)
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for missing parameters', async () => {
      const url = 'http://localhost:3000/api/admin'
      const request = new NextRequest(url, { method: 'DELETE' })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      
      const response = await DELETE(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Analytics and Reports', () => {
    it('should return booking analytics for admin', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      
      // Mock analytics data
      mockPrismaBooking.groupBy.mockResolvedValue([
        {
          status: 'confirmed',
          _count: { id: 120 },
        },
        {
          status: 'cancelled',
          _count: { id: 15 },
        },
      ])
      
      mockPrismaBooking.findMany.mockResolvedValue([
        {
          id: 'booking-1',
          totalPrice: 1500,
          bookingDate: new Date('2024-06-15'),
          status: 'confirmed',
        },
        {
          id: 'booking-2',
          totalPrice: 1200,
          bookingDate: new Date('2024-06-16'),
          status: 'confirmed',
        },
      ])
      
      const url = 'http://localhost:3000/api/admin?analytics=bookings'
      const request = new NextRequest(url)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('analytics')
      expect(data.analytics).toHaveProperty('bookingsByStatus')
      expect(data.analytics).toHaveProperty('recentBookings')
    })

    it('should return revenue analytics for admin', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      
      const mockRevenue = [
        {
          date: '2024-06-15',
          totalRevenue: 15000,
          bookingCount: 10,
        },
        {
          date: '2024-06-16',
          totalRevenue: 12000,
          bookingCount: 8,
        },
      ]
      
      // Simular consulta de ingresos
      mockPrismaBooking.findMany.mockResolvedValue(
        mockRevenue.flatMap(day => 
          Array(day.bookingCount).fill({
            totalPrice: day.totalRevenue / day.bookingCount,
            bookingDate: new Date(day.date),
            status: 'confirmed',
          })
        )
      )
      
      const url = 'http://localhost:3000/api/admin?analytics=revenue'
      const request = new NextRequest(url)
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('analytics')
    })
  })

  describe('Security and Validation', () => {
    it('should prevent privilege escalation', async () => {
      // Usuario regular intentando hacerse admin
      const maliciousRequest = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        body: JSON.stringify({
          type: 'user',
          data: { id: 'user-123', isAdmin: true }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockUserSession)
      
      const response = await PUT(maliciousRequest)
      const data = await response.json()
      
      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
      expect(mockPrismaUser.update).not.toHaveBeenCalled()
    })

    it('should validate input data types', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify({
          type: 'court',
          data: {
            name: 123, // Should be string
            basePrice: 'invalid', // Should be number
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      
      const response = await POST(invalidRequest)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionRequest = new NextRequest('http://localhost:3000/api/admin', {
        method: 'PUT',
        body: JSON.stringify({
          type: 'user',
          data: {
            id: "'; DROP TABLE users; --",
            name: 'Malicious User'
          }
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaUser.update.mockRejectedValue(new Error('Invalid input'))
      
      const response = await PUT(sqlInjectionRequest)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
    })
  })

  describe('Rate Limiting and Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      mockPrismaUser.findMany.mockResolvedValue([mockAdminUser])
      
      // Simular múltiples requests concurrentes
      const requests = Array(5).fill(null).map(() => GET())
      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      // Verificar que se manejaron todas las requests
      expect(mockPrismaUser.findMany).toHaveBeenCalledTimes(5)
    })

    it('should handle large dataset queries efficiently', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      
      // Simular dataset grande
      const largeUserList = Array(1000).fill(null).map((_, index) => ({
        id: `user-${index}`,
        email: `user${index}@example.com`,
        name: `User ${index}`,
        isAdmin: false,
      }))
      
      mockPrismaUser.findMany.mockResolvedValue(largeUserList)
      
      const startTime = Date.now()
      const response = await GET()
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})