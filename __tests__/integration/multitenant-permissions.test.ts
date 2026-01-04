/**
 * Tests de Permisos Multitenant
 * 
 * Estos tests verifican que:
 * 1. Super admin puede gestionar todos los tenants
 * 2. Admin de tenant puede gestionar solo su tenant
 * 3. User no puede gestionar tenants ni admins
 * 4. Los permisos se validan correctamente en todas las operaciones
 */

jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('../../lib/database/neon-config', () => {
  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    court: {
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
    adminWhitelist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  }
  return {
    prisma: mockPrisma,
  }
})

import { auth } from '../../lib/auth'
import { prisma } from '../../lib/database/neon-config'
import { isSuperAdminUser, canManageAdmins } from '../../lib/utils/permissions'
import { GET as getTenants, POST as createTenant } from '../../app/api/tenants/route'
import { GET as getTenant, PUT as updateTenant } from '../../app/api/tenants/[id]/route'
import { GET as getAdmins, POST as addAdmin } from '../../app/api/admin/route'
import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<Session | null>>
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
  _count: {
    users: 5,
    courts: 3,
    bookings: 10,
  },
}

const tenantB = {
  id: TENANT_B_ID,
  name: 'Tenant B',
  slug: 'tenant-b',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: {
    users: 3,
    courts: 2,
    bookings: 8,
  },
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

describe('Multitenant Permissions Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Gestión de Tenants - Super Admin', () => {
    it('Super Admin DEBE poder listar todos los tenants', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session)

      mockPrisma.tenant.findMany.mockResolvedValue([tenantA, tenantB])
      mockPrisma.user.count.mockResolvedValue(0)
      mockPrisma.court.count.mockResolvedValue(0)
      mockPrisma.booking.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/tenants')
      const response = await getTenants(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveLength(2)
      expect(mockPrisma.tenant.findMany).toHaveBeenCalled()
    })

    it('Super Admin DEBE poder crear un nuevo tenant', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session)

      const newTenantData = {
        name: 'New Tenant',
        slug: 'new-tenant',
        isActive: true,
      }

      mockPrisma.tenant.findUnique.mockResolvedValue(null) // No existe
      mockPrisma.tenant.create.mockResolvedValue({
        id: 'new-tenant-123',
        ...newTenantData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/tenants', {
        method: 'POST',
        body: JSON.stringify(newTenantData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createTenant(request)

      expect(response.status).toBe(201)
      expect(mockPrisma.tenant.create).toHaveBeenCalled()
    })

    it('Super Admin DEBE poder obtener un tenant específico', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session)

      mockPrisma.tenant.findUnique.mockResolvedValue(tenantA)

      const request = new NextRequest(`http://localhost:3000/api/tenants/${TENANT_A_ID}`)
      const response = await getTenant(request, { params: Promise.resolve({ id: TENANT_A_ID }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(data.data.id).toBe(TENANT_A_ID)
    })

    it('Super Admin DEBE poder actualizar cualquier tenant', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session)

      const updateData = {
        name: 'Updated Tenant A',
        isActive: false,
      }

      mockPrisma.tenant.findUnique.mockResolvedValue(tenantA)
      mockPrisma.tenant.update.mockResolvedValue({
        ...tenantA,
        ...updateData,
      })

      const request = new NextRequest(`http://localhost:3000/api/tenants/${TENANT_A_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await updateTenant(request, { params: Promise.resolve({ id: TENANT_A_ID }) })

      expect(response.status).toBe(200)
      expect(mockPrisma.tenant.update).toHaveBeenCalled()
    })
  })

  describe('Gestión de Tenants - Admin de Tenant', () => {
    it('Admin de Tenant NO DEBE poder listar todos los tenants', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/tenants')
      const response = await getTenants(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Super Administrador')
    })

    it('Admin de Tenant NO DEBE poder crear un nuevo tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const newTenantData = {
        name: 'New Tenant',
        slug: 'new-tenant',
        isActive: true,
      }

      const request = new NextRequest('http://localhost:3000/api/tenants', {
        method: 'POST',
        body: JSON.stringify(newTenantData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createTenant(request)

      expect(response.status).toBe(403)
      expect(mockPrisma.tenant.create).not.toHaveBeenCalled()
    })

    it('Admin de Tenant NO DEBE poder obtener otro tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/tenants/${TENANT_B_ID}`)
      const response = await getTenant(request, { params: Promise.resolve({ id: TENANT_B_ID }) })

      expect(response.status).toBe(403)
    })

    it('Admin de Tenant NO DEBE poder actualizar otro tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const updateData = {
        name: 'Updated Tenant B',
      }

      const request = new NextRequest(`http://localhost:3000/api/tenants/${TENANT_B_ID}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await updateTenant(request, { params: Promise.resolve({ id: TENANT_B_ID }) })

      expect(response.status).toBe(403)
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled()
    })
  })

  describe('Gestión de Tenants - User', () => {
    it('User NO DEBE poder listar tenants', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/tenants')
      const response = await getTenants(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Super Administrador')
      expect(mockPrisma.tenant.findMany).not.toHaveBeenCalled()
    })

    it('User NO DEBE poder crear un tenant', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const newTenantData = {
        name: 'New Tenant',
        slug: 'new-tenant',
        isActive: true,
      }

      const request = new NextRequest('http://localhost:3000/api/tenants', {
        method: 'POST',
        body: JSON.stringify(newTenantData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createTenant(request)

      expect(response.status).toBe(403)
      expect(mockPrisma.tenant.create).not.toHaveBeenCalled()
    })

    it('User NO DEBE poder obtener un tenant', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/tenants/${TENANT_A_ID}`)
      const response = await getTenant(request, { params: Promise.resolve({ id: TENANT_A_ID }) })

      expect(response.status).toBe(403)
    })
  })

  describe('Gestión de Admins - Super Admin', () => {
    it('Super Admin DEBE poder listar admins de cualquier tenant', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session)

      const adminList = [
        {
          id: 'admin-1',
          email: 'admin1@tenant-a.com',
          tenantId: TENANT_A_ID,
          role: 'ADMIN' as const,
          isActive: true,
        },
      ]

      mockPrisma.adminWhitelist.findMany.mockResolvedValue(adminList)

      const request = new NextRequest(`http://localhost:3000/api/admin?tenantId=${TENANT_A_ID}`)
      const response = await getAdmins(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(mockPrisma.adminWhitelist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
    })

    it('Super Admin DEBE poder agregar admin a cualquier tenant', async () => {
      mockAuth.mockResolvedValue({
        user: superAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session)

      const newAdminData = {
        email: 'newadmin@tenant-a.com',
        tenantId: TENANT_A_ID,
        role: 'ADMIN' as const,
      }

      mockPrisma.adminWhitelist.findUnique.mockResolvedValue(null)
      mockPrisma.adminWhitelist.create.mockResolvedValue({
        id: 'admin-new',
        ...newAdminData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify(newAdminData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await addAdmin(request)

      expect(response.status).toBe(201)
      expect(mockPrisma.adminWhitelist.create).toHaveBeenCalled()
    })
  })

  describe('Gestión de Admins - Admin de Tenant', () => {
    it('Admin de Tenant DEBE poder listar admins de su propio tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const adminList = [
        {
          id: 'admin-1',
          email: 'admin1@tenant-a.com',
          tenantId: TENANT_A_ID,
          role: 'ADMIN' as const,
          isActive: true,
        },
      ]

      mockPrisma.adminWhitelist.findMany.mockResolvedValue(adminList)

      const request = new NextRequest(`http://localhost:3000/api/admin?tenantId=${TENANT_A_ID}`)
      const response = await getAdmins(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.adminWhitelist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A_ID,
          }),
        })
      )
    })

    it('Admin de Tenant NO DEBE poder listar admins de otro tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/admin?tenantId=${TENANT_B_ID}`)
      const response = await getAdmins(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('gestionar')
    })

    it('Admin de Tenant DEBE poder agregar admin a su propio tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const newAdminData = {
        email: 'newadmin@tenant-a.com',
        tenantId: TENANT_A_ID,
        role: 'ADMIN' as const,
      }

      mockPrisma.adminWhitelist.findUnique.mockResolvedValue(null)
      mockPrisma.adminWhitelist.create.mockResolvedValue({
        id: 'admin-new',
        ...newAdminData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify(newAdminData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await addAdmin(request)

      expect(response.status).toBe(201)
      expect(mockPrisma.adminWhitelist.create).toHaveBeenCalled()
    })

    it('Admin de Tenant NO DEBE poder agregar admin a otro tenant', async () => {
      mockAuth.mockResolvedValue({
        user: adminTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const newAdminData = {
        email: 'newadmin@tenant-b.com',
        tenantId: TENANT_B_ID,
        role: 'ADMIN' as const,
      }

      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify(newAdminData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await addAdmin(request)

      expect(response.status).toBe(403)
      expect(mockPrisma.adminWhitelist.create).not.toHaveBeenCalled()
    })
  })

  describe('Gestión de Admins - User', () => {
    it('User NO DEBE poder listar admins', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/admin?tenantId=${TENANT_A_ID}`)
      const response = await getAdmins(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('gestionar')
      expect(mockPrisma.adminWhitelist.findMany).not.toHaveBeenCalled()
    })

    it('User NO DEBE poder agregar admin', async () => {
      mockAuth.mockResolvedValue({
        user: userTenantA,
        expires: '2024-12-31T23:59:59.999Z',
      } as any)

      const newAdminData = {
        email: 'newadmin@tenant-a.com',
        tenantId: TENANT_A_ID,
        role: 'ADMIN' as const,
      }

      const request = new NextRequest('http://localhost:3000/api/admin', {
        method: 'POST',
        body: JSON.stringify(newAdminData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await addAdmin(request)

      expect(response.status).toBe(403)
      expect(mockPrisma.adminWhitelist.create).not.toHaveBeenCalled()
    })
  })

  describe('Helpers de Permisos', () => {
    it('isSuperAdminUser debe retornar true para super admin', async () => {
      const result = await isSuperAdminUser(superAdmin)
      expect(result).toBe(true)
    })

    it('isSuperAdminUser debe retornar false para admin de tenant', async () => {
      const result = await isSuperAdminUser(adminTenantA)
      expect(result).toBe(false)
    })

    it('canManageAdmins debe retornar true para super admin en cualquier tenant', async () => {
      const resultA = await canManageAdmins(superAdmin, TENANT_A_ID)
      const resultB = await canManageAdmins(superAdmin, TENANT_B_ID)
      expect(resultA).toBe(true)
      expect(resultB).toBe(true)
    })

    it('canManageAdmins debe retornar true para admin en su propio tenant', async () => {
      const result = await canManageAdmins(adminTenantA, TENANT_A_ID)
      expect(result).toBe(true)
    })

    it('canManageAdmins debe retornar false para admin en otro tenant', async () => {
      const result = await canManageAdmins(adminTenantA, TENANT_B_ID)
      expect(result).toBe(false)
    })

    it('canManageAdmins debe retornar false para user', async () => {
      const result = await canManageAdmins(userTenantA, TENANT_A_ID)
      expect(result).toBe(false)
    })
  })
})

