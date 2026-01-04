/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */

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
  const isSuperAdmin = session?.user?.isSuperAdmin || false

  const handleSignIn = async () => {
    console.log('🔐 useAuth: Iniciando proceso de login')
    await signIn('google', {
      callbackUrl: '/dashboard',
      redirect: true
    })
  }

  const handleSignOut = async () => {
    console.log('🚪 useAuth: Iniciando proceso de logout')
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
    isSuperAdmin,
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
