/// <reference types="@types/jest" />
import { renderHook, act } from '@testing-library/react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useAuth } from '@/hooks/useAuth'
import { SessionProvider } from 'next-auth/react'
import React from 'react'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn() as any as jest.MockedFunction<any>,
  signIn: jest.fn() as any as jest.MockedFunction<any>,
  signOut: jest.fn() as any as jest.MockedFunction<any>,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider session={null}>{children}</SessionProvider>
  )

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn() as any as jest.MockedFunction<any>,
      })
    })

    it('should return correct authentication state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.loading).toBe(false)
      expect(result.current.profile).toBeNull()
    })

    it('should call signIn with correct parameters', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.signIn()
      })

      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/',
        redirect: true,
      })
    })
  })

  describe('when user is authenticated as regular user', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      role: 'USER',
      isAdmin: false,
    }

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: jest.fn() as any as jest.MockedFunction<any>,
      })
    })

    it('should return correct authentication state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.loading).toBe(false)
    })

    it('should return correct profile data', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.profile).toEqual({
        id: 'user-123',
        full_name: 'Test User',
        role: 'user',
        phone: null,
        avatar_url: 'https://example.com/avatar.jpg',
      })
    })

    it('should call signOut with correct parameters', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: '/login',
        redirect: true,
      })
    })
  })

  describe('when user is authenticated as admin', () => {
    const mockAdminUser = {
      id: 'admin-123',
      name: 'Admin User',
      email: 'admin@example.com',
      image: 'https://example.com/admin-avatar.jpg',
      role: 'ADMIN',
      isAdmin: true,
    }

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: mockAdminUser },
        status: 'authenticated',
        update: jest.fn() as any as jest.MockedFunction<any>,
      })
    })

    it('should return correct admin authentication state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toEqual(mockAdminUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    it('should return correct admin profile data', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.profile).toEqual({
        id: 'admin-123',
        full_name: 'Admin User',
        role: 'admin',
        phone: null,
        avatar_url: 'https://example.com/admin-avatar.jpg',
      })
    })
  })

  describe('when session is loading', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn() as any as jest.MockedFunction<any>,
      })
    })

    it('should return loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle user without name', () => {
      const userWithoutName = {
        id: 'user-123',
        name: null,
        email: 'test@example.com',
        image: null,
        role: 'USER',
        isAdmin: false,
      }

      mockUseSession.mockReturnValue({
        data: { user: userWithoutName },
        status: 'authenticated',
        update: jest.fn() as any as jest.MockedFunction<any>,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.profile?.full_name).toBeNull()
      expect(result.current.profile?.avatar_url).toBeNull()
    })

    it('should handle missing isAdmin property', () => {
      const userWithoutIsAdmin = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'USER',
        // isAdmin property missing
      }

      mockUseSession.mockReturnValue({
        data: { user: userWithoutIsAdmin },
        status: 'authenticated',
        update: jest.fn() as any as jest.MockedFunction<any>,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAdmin).toBe(false)
    })
  })
})