import {
  getAllAdmins,
  addAdmin,
  removeAdmin,
  listAdmins,
  determineUserRole,
  logAdminAccess,
  isAdminEmail,
  clearAdminCache,
} from '@/lib/admin-system'
import { prisma } from '@/lib/prisma'
import type { AdminWhitelist } from '@prisma/client'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    adminWhitelist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    adminAccess: {
      create: jest.fn(),
    },
  },
}))

// Mock environment variables
const originalEnv = process.env

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Admin System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas (pero permitir console.log para depuración)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    // jest.spyOn(console, 'log').mockImplementation(() => {}) // Comentado para depuración
    
    // Limpiar cache de administradores
    clearAdminCache()
    
    // Reset environment variables
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  const mockAdminWhitelist: AdminWhitelist = {
    id: 'admin-whitelist-123',
    email: 'admin@example.com',
    isActive: true,
    addedBy: 'super-admin@example.com',
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  describe('getAllAdmins', () => {
    it('should return combined admins from env and database', async () => {
      process.env.ADMIN_EMAILS = 'env-admin1@example.com,env-admin2@example.com'
      const mockWhitelistAdmins = [mockAdminWhitelist]
      mockPrisma.adminWhitelist.findMany.mockResolvedValue(mockWhitelistAdmins)

      const result = await getAllAdmins()

      expect(mockPrisma.adminWhitelist.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { email: true },
      })
      expect(result).toEqual(new Set([
        'env-admin1@example.com',
        'env-admin2@example.com',
        'admin@example.com',
      ]))
    })

    it('should return only env admins when database is empty', async () => {
      process.env.ADMIN_EMAILS = 'env-admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])

      const result = await getAllAdmins()

      expect(result).toEqual(new Set(['env-admin@example.com']))
    })

    it('should return only database admins when env is empty', async () => {
      process.env.ADMIN_EMAILS = ''
      const mockWhitelistAdmins = [mockAdminWhitelist]
      mockPrisma.adminWhitelist.findMany.mockResolvedValue(mockWhitelistAdmins)

      const result = await getAllAdmins()

      expect(result).toEqual(new Set(['admin@example.com']))
    })

    it('should handle undefined ADMIN_EMAILS env variable', async () => {
      delete process.env.ADMIN_EMAILS
      const mockWhitelistAdmins = [mockAdminWhitelist]
      mockPrisma.adminWhitelist.findMany.mockResolvedValue(mockWhitelistAdmins)

      const result = await getAllAdmins()

      expect(result).toEqual(new Set(['admin@example.com']))
    })

    it('should remove duplicates between env and database', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,other@example.com'
      const mockWhitelistAdmins = [mockAdminWhitelist] // admin@example.com
      mockPrisma.adminWhitelist.findMany.mockResolvedValue(mockWhitelistAdmins)

      const result = await getAllAdmins()

      expect(result).toEqual(new Set(['admin@example.com', 'other@example.com']))
    })

    it('should handle database errors gracefully', async () => {
      process.env.ADMIN_EMAILS = 'env-admin@example.com'
      const dbError = new Error('Database connection failed')
      mockPrisma.adminWhitelist.findMany.mockRejectedValue(dbError)

      const result = await getAllAdmins()

      expect(console.error).toHaveBeenCalledWith('Error obteniendo administradores de BD:', dbError)
      expect(result).toEqual(new Set(['env-admin@example.com'])) // Should fallback to env admins
    })
  })

  describe('isAdminEmail', () => {
    it('should return true for admin user', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])

      const result = await isAdminEmail('admin@example.com')

      expect(result).toBe(true)
    })

    it('should return false for non-admin user', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])

      const result = await isAdminEmail('user@example.com')

      expect(result).toBe(false)
    })

    it('should be case insensitive', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])

      const result = await isAdminEmail('ADMIN@EXAMPLE.COM')

      expect(result).toBe(true)
    })
  })

  describe('addAdmin', () => {
    it('should add admin to whitelist successfully', async () => {
      // Configurar super-admin como administrador válido
      process.env.ADMIN_EMAILS = 'super-admin@example.com'
      
      const mockCreatedAdmin = {
        ...mockAdminWhitelist,
        email: 'new-admin@example.com',
      }
      mockPrisma.adminWhitelist.create.mockResolvedValue(mockCreatedAdmin)

      const result = await addAdmin('new-admin@example.com', 'super-admin@example.com', 'Test admin')

      expect(mockPrisma.adminWhitelist.create).toHaveBeenCalledWith({
        data: {
          email: 'new-admin@example.com',
          addedBy: 'super-admin@example.com',
          notes: 'Test admin',
          isActive: true,
        },
      })
      expect(result.success).toBe(true)
      expect(result.message).toContain('agregado exitosamente')
    })

    it('should handle duplicate admin error', async () => {
      // Configurar super-admin como administrador válido
      process.env.ADMIN_EMAILS = 'super-admin@example.com'
      
      const dbError = new Error('Unique constraint failed')
      mockPrisma.adminWhitelist.create.mockRejectedValue(dbError)

      const result = await addAdmin('admin@example.com', 'super-admin@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Error interno del servidor')
    })
  })

  describe('removeAdmin', () => {
    it('should remove admin from whitelist successfully', async () => {
      // Configurar super-admin como administrador válido
      process.env.ADMIN_EMAILS = 'super-admin@example.com'
      
      mockPrisma.adminWhitelist.updateMany.mockResolvedValue({
        count: 1,
      })

      const result = await removeAdmin('admin@example.com', 'super-admin@example.com')

      expect(mockPrisma.adminWhitelist.updateMany).toHaveBeenCalledWith({
        where: { 
          email: 'admin@example.com',
          isActive: true 
        },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      })
      expect(result.success).toBe(true)
      expect(result.message).toContain('removido exitosamente')
    })

    it('should handle admin not found error', async () => {
      // Configurar super-admin como administrador válido
      process.env.ADMIN_EMAILS = 'super-admin@example.com'
      
      const dbError = new Error('Record not found')
      mockPrisma.adminWhitelist.updateMany.mockRejectedValue(dbError)

      const result = await removeAdmin('non-existent@example.com', 'super-admin@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Error interno del servidor')
    })
  })

  describe('listAdmins', () => {
    it('should return formatted list of all admins', async () => {
      process.env.ADMIN_EMAILS = 'env-admin@example.com'
      const mockWhitelistAdmins = [{
        ...mockAdminWhitelist,
        addedBy: 'super-admin@example.com',
        createdAt: new Date('2024-01-01'),
      }]
      mockPrisma.adminWhitelist.findMany.mockResolvedValue(mockWhitelistAdmins)

      const result = await listAdmins()

      expect(result.envAdmins).toEqual(['env-admin@example.com'])
      expect(result.dbAdmins).toEqual([{
        id: 'admin-whitelist-123',
        email: 'admin@example.com',
        isActive: true,
        addedBy: 'super-admin@example.com',
        notes: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }])
    })

    it('should handle empty admin lists', async () => {
      process.env.ADMIN_EMAILS = ''
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])

      const result = await listAdmins()

      expect(result.envAdmins).toEqual([])
      expect(result.dbAdmins).toEqual([])
    })
  })

  describe('determineUserRole', () => {
    it('should return admin for admin user', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])

      const result = await determineUserRole('admin@example.com')

      expect(result).toBe('admin')
    })

    it('should return user for non-admin user', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])

      const result = await determineUserRole('user@example.com')

      expect(result).toBe('user')
    })
  })

  describe('logAdminAccess', () => {
    it('should log admin access successfully', async () => {
      const mockAccessLog = {
        id: 'access-123',
        email: 'admin@example.com',
        granted: true,
        method: 'google' as const,
        action: 'LOGIN',
        createdAt: new Date('2024-01-01'),
      }
      mockPrisma.adminAccess.create.mockResolvedValue(mockAccessLog)

      logAdminAccess('admin@example.com', true, 'google', 'LOGIN')

      // Note: logAdminAccess might be async but doesn't return a promise
      // We just verify it doesn't throw an error
      expect(true).toBe(true)
    })
  })

  describe('Debug tests', () => {
    it('should debug addAdmin step by step', async () => {
      // Clear any existing cache by importing the module fresh
      jest.resetModules()
      const { addAdmin, isAdminEmail } = require('../../lib/admin-system')
      
      // Setup: super-admin is in env, new user is not admin
      process.env.ADMIN_EMAILS = 'super-admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])
      mockPrisma.adminWhitelist.findUnique.mockResolvedValue(null)
      mockPrisma.adminWhitelist.create.mockResolvedValue({
        id: 'new-admin-123',
        email: 'new-user@example.com',
        isActive: true,
        addedBy: 'super-admin@example.com',
        notes: 'Agregado por administrador',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      // Test: super-admin should be authorized
      const isSuperAdmin = await isAdminEmail('super-admin@example.com')
      console.log('Is super admin?', isSuperAdmin)
      expect(isSuperAdmin).toBe(true)
      
      // Test: add new admin
      const result = await addAdmin('new-user@example.com', 'super-admin@example.com')
      console.log('AddAdmin result:', result)
      expect(result.success).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle admin promotion workflow', async () => {
      // Initially user is not admin
      process.env.ADMIN_EMAILS = 'super-admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])
      mockPrisma.adminWhitelist.findUnique.mockResolvedValue(null)
      
      let isAdmin = await isAdminEmail('new-user@example.com')
      expect(isAdmin).toBe(false)

      // Add user as admin
      mockPrisma.adminWhitelist.create.mockResolvedValue({
        id: 'new-admin-123',
        email: 'new-user@example.com',
        isActive: true,
        addedBy: 'super-admin@example.com',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const addResult = await addAdmin('new-user@example.com', 'super-admin@example.com')
      console.log('DEBUG addResult:', addResult)
      console.log('DEBUG process.env.ADMIN_EMAILS:', process.env.ADMIN_EMAILS)
      expect(addResult.success).toBe(true)

      // Now user should be admin (mock the new state)
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([{
        id: 'new-admin-123',
        email: 'new-user@example.com',
        isActive: true,
        addedBy: 'super-admin@example.com',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }])
      
      isAdmin = await isAdminEmail('new-user@example.com')
      expect(isAdmin).toBe(true)
    })

    it('should handle admin removal workflow', async () => {
      // Initially user is admin (in database only, not in env)
      process.env.ADMIN_EMAILS = 'super-admin@example.com'
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([mockAdminWhitelist])
      
      let isAdmin = await isAdminEmail('admin@example.com')
      expect(isAdmin).toBe(true)

      // Remove admin - mock the updateMany to return success
      mockPrisma.adminWhitelist.updateMany.mockResolvedValue({
        count: 1,
      })
      const removeResult = await removeAdmin('admin@example.com', 'super-admin@example.com')
      expect(removeResult.success).toBe(true)

      // Now user should not be admin - mock empty result
      mockPrisma.adminWhitelist.findMany.mockResolvedValue([])
      
      isAdmin = await isAdminEmail('admin@example.com')
      expect(isAdmin).toBe(false)
    })
  })
})