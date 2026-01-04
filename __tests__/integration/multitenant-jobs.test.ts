/**
 * Tests de Jobs Multitenant
 * 
 * Estos tests verifican que:
 * 1. Los jobs procesan datos por tenant
 * 2. Super admin puede ejecutar jobs para todos los tenants
 * 3. Admin de tenant puede ejecutar jobs solo para su tenant
 * 4. User no puede ejecutar jobs
 */

jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('../../lib/database/neon-config', () => {
  const mockPrisma = {
    booking: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    recurringBooking: {
      findMany: jest.fn(),
    },
  }
  return {
    prisma: mockPrisma,
  }
})

import { auth } from '../../lib/auth'
import { prisma } from '../../lib/database/neon-config'
import { isSuperAdminUser, getUserTenantIdSafe } from '../../lib/utils/permissions'
import { GET as cancelExpiredBookings, POST as cancelExpiredBookingsPost } from '../../app/api/jobs/cancel-expired-bookings/route'
import { ExpiredBookingsService } from '../../lib/services/bookings/ExpiredBookingsService'
import { NextRequest } from 'next/server'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as any

// Mock ExpiredBookingsService
jest.mock('../../lib/services/bookings/ExpiredBookingsService', () => ({
  ExpiredBookingsService: jest.fn().mockImplementation(() => ({
    cancelExpiredBookings: jest.fn(),
    getExpiredBookingsStats: jest.fn(),
  })),
}))

const MockedExpiredBookingsService = ExpiredBookingsService as jest.MockedClass<typeof ExpiredBookingsService>

// Datos de prueba
const TENANT_A_ID = 'tenant-a-123'
const TENANT_B_ID = 'tenant-b-456'

const superAdmin = {
  id: 'super-admin-123',
  email: 'super@admin.com',
  name: 'Super Admin',
  role: 'SUPER_ADMIN' as const,
  isAdmin: true,
  isSuperAdmin: true,
  tenantId: null,
}

const adminTenantA = {
  id: 'admin-tenant-a-123',
  email: 'admin-a@tenant-a.com',
  name: 'Admin Tenant A',
  role: 'ADMIN' as const,
  isAdmin: true,
  isSuperAdmin: false,
  tenantId: TENANT_A_ID,
}

const userTenantA = {
  id: 'user-tenant-a-123',
  email: 'user-a@tenant-a.com',
  name: 'User Tenant A',
  role: 'USER' as const,
  isAdmin: false,
  isSuperAdmin: false,
  tenantId: TENANT_A_ID,
}

const expiredBookingTenantA = {
  id: 'booking-expired-a-123',
  tenantId: TENANT_A_ID,
  courtId: 'court-a-123',
  userId: 'user-tenant-a-123',
  bookingDate: new Date('2024-01-01'),
  status: 'PENDING' as const,
  expiresAt: new Date('2024-01-01T10:00:00'), // Expired
}

const expiredBookingTenantB = {
  id: 'booking-expired-b-456',
  tenantId: TENANT_B_ID,
  courtId: 'court-b-456',
  userId: 'user-tenant-b-789',
  bookingDate: new Date('2024-01-01'),
  status: 'PENDING' as const,
  expiresAt: new Date('2024-01-01T10:00:00'), // Expired
}

describe('Multitenant Jobs Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Cancel Expired Bookings Job - Super Admin', () => {
    it('Super Admin DEBE poder ejecutar job para todos los tenants (sin tenantId)', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      // Mock del servicio para evitar llamadas reales a la BD
      mockPrisma.booking.findMany.mockResolvedValue([])
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 })

      const request = new NextRequest('http://localhost:3000/api/jobs/cancel-expired-bookings', {
        method: 'POST',
      })
      const response = await cancelExpiredBookingsPost(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('success')
      expect(data.success).toBe(true)
    })

    it('Super Admin DEBE poder ejecutar job para un tenant específico', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.booking.findMany.mockResolvedValue([])
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 })

      const request = new NextRequest(`http://localhost:3000/api/jobs/cancel-expired-bookings?tenantId=${TENANT_A_ID}`, {
        method: 'POST',
      })
      const response = await cancelExpiredBookingsPost(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('Super Admin DEBE poder ejecutar job para cualquier tenant', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.booking.findMany.mockResolvedValue([])
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 })

      const request = new NextRequest(`http://localhost:3000/api/jobs/cancel-expired-bookings?tenantId=${TENANT_B_ID}`, {
        method: 'POST',
      })
      const response = await cancelExpiredBookingsPost(request)

      expect(response.status).toBe(200)
      // Super admin puede ejecutar para cualquier tenant
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('Cancel Expired Bookings Job - Admin de Tenant', () => {
    it('Admin de Tenant NO DEBE poder ejecutar job sin especificar tenantId', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/jobs/cancel-expired-bookings', {
        method: 'POST',
      })
      const response = await cancelExpiredBookingsPost(request)

      // Admin no puede ejecutar sin tenantId (solo super admin puede)
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('super admin')
    })

    it('Admin de Tenant DEBE poder ejecutar job para su propio tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.booking.findMany.mockResolvedValue([])
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 })

      const request = new NextRequest(`http://localhost:3000/api/jobs/cancel-expired-bookings?tenantId=${TENANT_A_ID}`, {
        method: 'POST',
      })
      const response = await cancelExpiredBookingsPost(request)

      expect(response.status).toBe(200)
      // Admin solo puede ejecutar para su tenant
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('Admin de Tenant NO DEBE poder ejecutar job para otro tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/jobs/cancel-expired-bookings?tenantId=${TENANT_B_ID}`, {
        method: 'POST',
      })
      const response = await cancelExpiredBookingsPost(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('autorizado')
    })
  })

  describe('Cancel Expired Bookings Job - User', () => {
    it('User NO DEBE poder ejecutar job', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/jobs/cancel-expired-bookings?tenantId=${TENANT_A_ID}`, {
        method: 'POST',
      })
      const response = await cancelExpiredBookingsPost(request)

      // El endpoint requiere isAdmin, user no es admin
      expect(response.status).toBe(403)
    })
  })

  describe('ExpiredBookingsService - Filtrado por Tenant', () => {
    it('cancelExpiredBookings debe filtrar por tenantId cuando se proporciona', async () => {
      const service = new ExpiredBookingsService()
      mockPrisma.booking.findMany.mockResolvedValue([expiredBookingTenantA])
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 })

      const result = await service.cancelExpiredBookings(TENANT_A_ID)

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
      expect(result).toBe(1)
    })

    it('cancelExpiredBookings debe procesar todos los tenants cuando tenantId es undefined', async () => {
      const service = new ExpiredBookingsService()
      mockPrisma.booking.findMany.mockResolvedValue([expiredBookingTenantA, expiredBookingTenantB])
      mockPrisma.booking.updateMany.mockResolvedValue({ count: 2 })

      const result = await service.cancelExpiredBookings(undefined)

      // Cuando tenantId es undefined, no debe filtrar por tenantId
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            tenantId: expect.anything(),
          }),
        })
      )
      expect(result).toBe(2)
    })

    it('getExpiredBookingsStats debe filtrar por tenantId cuando se proporciona', async () => {
      const service = new ExpiredBookingsService()
      mockPrisma.booking.findMany.mockResolvedValue([expiredBookingTenantA])

      const result = await service.getExpiredBookingsStats(TENANT_A_ID)

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
      expect(result).toHaveProperty('totalExpired')
      expect(result).toHaveProperty('expiredIds')
    })
  })
})

