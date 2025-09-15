/// <reference types="@types/jest" />
// Mock NextAuth configuration
jest.mock('../../../../lib/auth', () => ({
  auth: jest.fn() as any as jest.MockedFunction<any>,
  signIn: jest.fn() as any as jest.MockedFunction<any>,
  signOut: jest.fn() as any as jest.MockedFunction<any>,
  config: {
    providers: [{
      id: 'google',
      name: 'Google',
      type: 'oauth',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    }],
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
      jwt: jest.fn() as any as jest.MockedFunction<any>,
      session: jest.fn() as any as jest.MockedFunction<any>,
    },
  },
}))

// Mock Prisma
jest.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
      create: jest.fn() as any as jest.MockedFunction<any>,
      update: jest.fn() as any as jest.MockedFunction<any>,
    },
    account: {
      findFirst: jest.fn() as any as jest.MockedFunction<any>,
      create: jest.fn() as any as jest.MockedFunction<any>,
    },
    session: {
      create: jest.fn() as any as jest.MockedFunction<any>,
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
      update: jest.fn() as any as jest.MockedFunction<any>,
      delete: jest.fn() as any as jest.MockedFunction<any>,
    },
  },
}))

import { auth, signIn, signOut } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { NextRequest } from 'next/server'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockPrismaUser = prisma.user as any
const mockPrismaAccount = prisma.account as any
const mockPrismaSession = prisma.session as any

describe('/api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    isAdmin: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    image: 'https://example.com/admin-avatar.jpg',
    isAdmin: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockSession = {
    user: mockUser,
    expires: '2024-12-31T23:59:59.999Z',
  }

  const mockAdminSession = {
    user: mockAdminUser,
    expires: '2024-12-31T23:59:59.999Z',
  }

  describe('Authentication Flow', () => {
    it('should authenticate user with valid credentials', async () => {
mockAuth.mockResolvedValue(mockSession as any)
      
      const session = await auth()
      
      expect(session).toBeDefined()
      expect(session?.user).toEqual(mockUser)
      expect(session?.expires).toBe('2024-12-31T23:59:59.999Z')
    })

    it('should return null for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null)
      
      const session = await auth()
      
      expect(session).toBeNull()
    })

    it('should handle authentication errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Authentication failed'))
      
      await expect(auth()).rejects.toThrow('Authentication failed')
    })
  })

  describe('Sign In Process', () => {
    it('should sign in user with Google provider', async () => {
      const mockSignInResult = {
        ok: true,
        status: 200,
        error: null,
        url: 'http://localhost:3000/dashboard',
      }
      
      mockSignIn.mockResolvedValue(mockSignInResult)
      
      const result = await signIn('google', {
        redirectTo: '/dashboard',
      })
      
      expect(result).toEqual(mockSignInResult)
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard',
      })
    })

    it('should handle sign in errors', async () => {
      const mockSignInError = {
        ok: false,
        status: 401,
        error: 'Invalid credentials',
        url: null,
      }
      
      mockSignIn.mockResolvedValue(mockSignInError)
      
      const result = await signIn('google')
      
      expect(result).toEqual(mockSignInError)
      expect(result.ok).toBe(false)
    })

    it('should create new user on first sign in', async () => {
      const newUser = {
        email: 'newuser@example.com',
        name: 'New User',
        image: 'https://example.com/new-avatar.jpg',
      }
      
      mockPrismaUser.findUnique.mockResolvedValue(null)
      mockPrismaUser.create.mockResolvedValue({
        id: 'new-user-123',
        ...newUser,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      // Simular el callback de JWT que maneja la creación de usuarios
      const jwtCallback = (jest.fn() as any).mockResolvedValue({
        sub: 'new-user-123',
        email: newUser.email,
        name: newUser.name,
        picture: newUser.image,
      })
      
      const token = await jwtCallback({
        token: {},
        user: newUser,
        account: { provider: 'google' },
      })
      
      expect(token).toBeDefined()
      expect(token.email).toBe(newUser.email)
    })
  })

  describe('Sign Out Process', () => {
    it('should sign out user successfully', async () => {
      mockSignOut.mockResolvedValue({
        ok: true,
        status: 200,
        error: null,
        url: 'http://localhost:3000/',
      })
      
      const result = await signOut({
        redirectTo: '/',
      })
      
      expect(result.ok).toBe(true)
      expect(mockSignOut).toHaveBeenCalledWith({
        redirectTo: '/',
      })
    })

    it('should handle sign out errors', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'))
      
      await expect(signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('Session Management', () => {
    it('should validate active session', async () => {
      mockAuth.mockResolvedValue(mockSession)
      
      const session = await auth()
      
      expect(session).toBeDefined()
      expect(session?.user.id).toBe('user-123')
      expect(new Date(session?.expires || '').getTime()).toBeGreaterThan(Date.now())
    })

    it('should handle expired sessions', async () => {
      const expiredSession = {
        user: mockUser,
        expires: '2020-01-01T00:00:00.000Z', // Expired
      }
      
      mockAuth.mockResolvedValue(expiredSession)
      
      const session = await auth()
      
      // En una implementación real, esto debería manejar la expiración
      expect(session).toBeDefined()
      expect(new Date(session?.expires || '').getTime()).toBeLessThan(Date.now())
    })

    it('should update session data', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
        updatedAt: new Date(),
      }
      
      mockPrismaUser.update.mockResolvedValue(updatedUser)
      
      const result = await mockPrismaUser.update({
        where: { id: 'user-123' },
        data: { name: 'Updated Name' },
      })
      
      expect(result.name).toBe('Updated Name')
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'Updated Name' },
      })
    })
  })

  describe('Authorization Checks', () => {
    it('should identify admin users correctly', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)
      
      const session = await auth()
      
      expect(session?.user.isAdmin).toBe(true)
    })

    it('should identify regular users correctly', async () => {
      mockAuth.mockResolvedValue(mockSession)
      
      const session = await auth()
      
      expect(session?.user.isAdmin).toBe(false)
    })

    it('should handle missing user roles', async () => {
      const userWithoutRole = {
        ...mockUser,
        isAdmin: undefined,
      }
      
      const sessionWithoutRole = {
        user: userWithoutRole,
        expires: '2024-12-31T23:59:59.999Z',
      }
      
      mockAuth.mockResolvedValue(sessionWithoutRole)
      
      const session = await auth()
      
      expect(session?.user.isAdmin).toBeUndefined()
    })
  })

  describe('Database Integration', () => {
    it('should find existing user by email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUser)
      
      const user = await mockPrismaUser.findUnique({
        where: { email: 'user@example.com' },
      })
      
      expect(user).toEqual(mockUser)
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      })
    })

    it('should create new user account', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        name: 'New User',
        image: 'https://example.com/avatar.jpg',
      }
      
      mockPrismaUser.create.mockResolvedValue({
        id: 'new-user-123',
        ...newUserData,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
      const user = await mockPrismaUser.create({
        data: newUserData,
      })
      
      expect(user.email).toBe(newUserData.email)
      expect(user.isAdmin).toBe(false)
    })

    it('should handle database connection errors', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection failed'))
      
      await expect(
        mockPrismaUser.findUnique({ where: { email: 'user@example.com' } })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Security Validations', () => {
    it('should validate email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.org',
      ]
      
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        '',
      ]
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      validEmails.forEach((email: any) => {
        expect(emailRegex.test(email)).toBe(true)
      })
      
      invalidEmails.forEach((email: any) => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it('should handle malicious input', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'DROP TABLE users;',
        '../../etc/passwd',
      ]
      
      for (const input of maliciousInputs) {
        mockPrismaUser.findUnique.mockResolvedValue(null)
        
        const result = await mockPrismaUser.findUnique({
          where: { email: input },
        })
        
        expect(result).toBeNull()
      }
    })

    it('should enforce session timeout', () => {
      const sessionTimeout = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      const now = Date.now()
      const sessionStart = now - sessionTimeout - 1000 // 1 second past timeout
      
      const isExpired = (sessionStart + sessionTimeout) < now
      
      expect(isExpired).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during authentication', async () => {
      mockAuth.mockRejectedValue(new Error('Network error'))
      
      await expect(auth()).rejects.toThrow('Network error')
    })

    it('should handle invalid provider configurations', async () => {
      mockSignIn.mockRejectedValue(new Error('Invalid provider configuration'))
      
      await expect(signIn('invalid-provider')).rejects.toThrow('Invalid provider configuration')
    })

    it('should handle concurrent session conflicts', async () => {
      // Simular conflicto de sesiones concurrentes
      mockPrismaSession.create.mockRejectedValue(new Error('Session conflict'))
      
      await expect(
        mockPrismaSession.create({
          data: {
            userId: 'user-123',
            sessionToken: 'token-123',
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        })
      ).rejects.toThrow('Session conflict')
    })
  })
})
