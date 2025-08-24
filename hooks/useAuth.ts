'use client'

import { useSession } from 'next-auth/react'
import { signIn, signOut } from 'next-auth/react'

interface Profile {
  id: string
  full_name: string | null
  role: 'user' | 'admin'
  phone: string | null
  avatar_url: string | null
}

export function useAuth() {
  const { data: session, status } = useSession()

  const loading = status === 'loading'
  const user = session?.user || null
  const isAuthenticated = !!session?.user
  const isAdmin = session?.user?.isAdmin || false

  const handleSignIn = async () => {
    await signIn('google', {
      callbackUrl: '/',
      redirect: true
    })
  }

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/login',
      redirect: true
    })
  }

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    signIn: handleSignIn,
    signOut: handleSignOut,
    // Mantener compatibilidad con código existente
    profile: user ? {
      id: user.id,
      full_name: user.name,
      role: user.role.toLowerCase() as 'user' | 'admin',
      phone: null, // Se puede agregar después
      avatar_url: user.image,
    } : null,
  }
}
