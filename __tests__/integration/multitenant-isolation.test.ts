/**
 * Tests de Aislamiento Multitenant
 * 
 * Estos tests verifican que:
 * 1. Un tenant no puede acceder a datos de otro tenant
 * 2. Super admin puede acceder a todos los tenants
 * 3. Admin de tenant solo puede acceder a su tenant
 * 4. User solo puede acceder a su tenant
 */

jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('../../lib/database/neon-config', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    court: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    producto: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    systemSetting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    adminWhitelist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  }
  return {
    prisma: mockPrisma,
  }
})

import { auth } from '../../lib/auth'
import { prisma } from '../../lib/database/neon-config'
import { isSuperAdminUser, canAccessTenant, getUserTenantIdSafe } from '../../lib/utils/permissions'
import { GET as getCourts } from '../../app/api/courts/route'
import { GET as getBookings } from '../../app/api/bookings/route'
import { GET as getProductos } from '../../app/api/productos/route'
import { NextRequest } from 'next/server'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as any

// Datos de prueba
const TENANT_A_ID = 'tenant-a-123'
const TENANT_B_ID = 'tenant-b-456'

const tenantA = {
  id: TENANT_A_ID,
  name: 'Tenant A',
  slug: 'tenant-a',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const tenantB = {
  id: TENANT_B_ID,
  name: 'Tenant B',
  slug: 'tenant-b',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
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

const adminTenantA = {
  id: 'admin-tenant-a-123',
  email: 'admin-a@tenant-a.com',
  name: 'Admin Tenant A',
  role: 'ADMIN' as const,
  isAdmin: true,
  isSuperAdmin: false,
  tenantId: TENANT_A_ID,
}

const superAdmin = {
  id: 'super-admin-123',
  email: 'super@admin.com',
  name: 'Super Admin',
  role: 'SUPER_ADMIN' as const,
  isAdmin: true,
  isSuperAdmin: true,
  tenantId: null,
}

const courtTenantA = {
  id: 'court-a-123',
  name: 'Court A',
  tenantId: TENANT_A_ID,
  isActive: true,
  basePrice: 1000,
}

const courtTenantB = {
  id: 'court-b-456',
  name: 'Court B',
  tenantId: TENANT_B_ID,
  isActive: true,
  basePrice: 2000,
}

const bookingTenantA = {
  id: 'booking-a-123',
  courtId: 'court-a-123',
  userId: 'user-tenant-a-123',
  tenantId: TENANT_A_ID,
  bookingDate: new Date(),
  status: 'CONFIRMED' as const,
}

const bookingTenantB = {
  id: 'booking-b-456',
  courtId: 'court-b-456',
  userId: 'user-tenant-b-789',
  tenantId: TENANT_B_ID,
  bookingDate: new Date(),
  status: 'CONFIRMED' as const,
}

describe('Multitenant Isolation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Aislamiento de Datos - Courts', () => {
    it('User de Tenant A solo debe ver courts de Tenant A', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.court.findMany.mockResolvedValue([courtTenantA])

      const request = new NextRequest('http://localhost:3000/api/courts')
      const response = await getCourts(request)
      const data = await response.json()

      expect(mockPrisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'court-a-123' }),
      ]))
      expect(data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'court-b-456' }),
      ]))
    })

    it('Admin de Tenant A solo debe ver courts de Tenant A', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.court.findMany.mockResolvedValue([courtTenantA])

      const request = new NextRequest('http://localhost:3000/api/courts')
      const response = await getCourts(request)
      const data = await response.json()

      expect(mockPrisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'court-a-123' }),
      ]))
      expect(data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'court-b-456' }),
      ]))
    })

    it('Super Admin debe ver courts de todos los tenants', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.court.findMany.mockResolvedValue([courtTenantA, courtTenantB])

      const request = new NextRequest('http://localhost:3000/api/courts')
      const response = await getCourts(request)
      const data = await response.json()

      // Super admin no debe tener filtro de tenantId
      expect(mockPrisma.court.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({
          where: expect.objectContaining({
            tenantId: expect.anything(),
          }),
        })
      )
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'court-a-123' }),
        expect.objectContaining({ id: 'court-b-456' }),
      ]))
    })
  })

  describe('Aislamiento de Datos - Bookings', () => {
    it('User de Tenant A solo debe ver bookings de Tenant A', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.booking.findMany.mockResolvedValue([bookingTenantA])

      const request = new NextRequest('http://localhost:3000/api/bookings')
      const response = await getBookings(request)
      const data = await response.json()

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'booking-a-123' }),
      ]))
      expect(data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'booking-b-456' }),
      ]))
    })

    it('Super Admin debe ver bookings de todos los tenants', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.booking.findMany.mockResolvedValue([bookingTenantA, bookingTenantB])

      const request = new NextRequest('http://localhost:3000/api/bookings')
      const response = await getBookings(request)
      const data = await response.json()

      // Super admin no debe tener filtro estricto de tenantId
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'booking-a-123' }),
        expect.objectContaining({ id: 'booking-b-456' }),
      ]))
    })
  })

  describe('Aislamiento de Datos - Productos', () => {
    const productoTenantA = {
      id: 1,
      nombre: 'Product A',
      tenantId: TENANT_A_ID,
      activo: true,
    }

    const productoTenantB = {
      id: 2,
      nombre: 'Product B',
      tenantId: TENANT_B_ID,
      activo: true,
    }

    it('User de Tenant A solo debe ver productos de Tenant A', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.producto.findMany.mockResolvedValue([productoTenantA])

      const request = new NextRequest('http://localhost:3000/api/productos')
      const response = await getProductos(request)
      const data = await response.json()

      expect(mockPrisma.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 1 }),
      ]))
      expect(data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 2 }),
      ]))
    })

    it('Super Admin debe ver productos de todos los tenants', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.producto.findMany.mockResolvedValue([productoTenantA, productoTenantB])

      const request = new NextRequest('http://localhost:3000/api/productos')
      const response = await getProductos(request)
      const data = await response.json()

      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
      ]))
    })
  })

  describe('Permisos Cross-Tenant', () => {
    it('User de Tenant A NO debe poder acceder a datos de Tenant B', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      // Intentar acceder a court de Tenant B
      mockPrisma.court.findUnique.mockResolvedValue(courtTenantB)

      // El sistema debe filtrar automáticamente por tenantId
      // por lo que no debería poder acceder a este court
      const request = new NextRequest('http://localhost:3000/api/courts')
      const response = await getCourts(request)
      const data = await response.json()

      // Verificar que solo se buscan courts de Tenant A
      expect(mockPrisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
    })

    it('Super Admin DEBE poder acceder a datos de todos los tenants', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      mockPrisma.court.findMany.mockResolvedValue([courtTenantA, courtTenantB])

      const request = new NextRequest('http://localhost:3000/api/courts')
      const response = await getCourts(request)
      const data = await response.json()

      // Super admin no debe tener restricción de tenantId
      expect(data.length).toBeGreaterThanOrEqual(2)
      expect(data).toEqual(expect.arrayContaining([
        expect.objectContaining({ tenantId: TENANT_A_ID }),
        expect.objectContaining({ tenantId: TENANT_B_ID }),
      ]))
    })
  })

  describe('Helpers de Permisos', () => {
    it('isSuperAdminUser debe retornar true para super admin', async () => {
      const result = await isSuperAdminUser(superAdmin)
      expect(result).toBe(true)
    })

    it('isSuperAdminUser debe retornar false para user normal', async () => {
      const result = await isSuperAdminUser(userTenantA)
      expect(result).toBe(false)
    })

    it('getUserTenantIdSafe debe retornar tenantId del user', async () => {
      const result = await getUserTenantIdSafe(userTenantA)
      expect(result).toBe(TENANT_A_ID)
    })

    it('getUserTenantIdSafe debe retornar null para super admin', async () => {
      const result = await getUserTenantIdSafe(superAdmin)
      expect(result).toBeNull()
    })

    it('canAccessTenant debe retornar true para super admin en cualquier tenant', async () => {
      const resultA = await canAccessTenant(superAdmin, TENANT_A_ID)
      const resultB = await canAccessTenant(superAdmin, TENANT_B_ID)
      expect(resultA).toBe(true)
      expect(resultB).toBe(true)
    })

    it('canAccessTenant debe retornar true para user en su propio tenant', async () => {
      const result = await canAccessTenant(userTenantA, TENANT_A_ID)
      expect(result).toBe(true)
    })

    it('canAccessTenant debe retornar false para user en otro tenant', async () => {
      const result = await canAccessTenant(userTenantA, TENANT_B_ID)
      expect(result).toBe(false)
    })
  })
})


