'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

interface AuthRetryOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: string) => void
}

export function useAuthWithRetry(options: AuthRetryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  // Función para reintentar la autenticación
  const retryAuth = useCallback(async () => {
    if (retryCount >= maxRetries) {
      const error = `Máximo número de reintentos alcanzado (${maxRetries})`
      setLastError(error)
      onError?.(error)
      return false
    }

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      // Intentar actualizar la sesión
      const updatedSession = await update()
      
      if (updatedSession) {
        setRetryCount(0)
        setLastError(null)
        setIsRetrying(false)
        return true
      } else {
        throw new Error('No se pudo actualizar la sesión')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setLastError(errorMessage)
      setIsRetrying(false)
      
      if (retryCount + 1 >= maxRetries) {
        onError?.(errorMessage)
        return false
      }
      
      // Reintentar automáticamente
      return retryAuth()
    }
  }, [retryCount, maxRetries, retryDelay, onError, update])

  // Función para iniciar sesión con manejo de errores
  const signInWithRetry = useCallback(async (provider: string, callbackUrl?: string) => {
    try {
      const result = await signIn(provider, {
        callbackUrl: callbackUrl || '/',
        redirect: false // No redirigir automáticamente para manejar errores
      })

      if (result?.error) {
        const errorMessage = `Error de autenticación: ${result.error}`
        setLastError(errorMessage)
        onError?.(errorMessage)
        
        // Redirigir a página de error
        router.push(`/auth/error?error=${result.error}`)
        return false
      }

      if (result?.url) {
        router.push(result.url)
        return true
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en signIn'
      setLastError(errorMessage)
      onError?.(errorMessage)
      router.push('/auth/error?error=Default')
      return false
    }
  }, [router, onError])

  // Función para cerrar sesión con manejo de errores
  const signOutWithRetry = useCallback(async (callbackUrl?: string) => {
    try {
      await signOut({
        callbackUrl: callbackUrl || '/login',
        redirect: true
      })
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar sesión'
      setLastError(errorMessage)
      onError?.(errorMessage)
      return false
    }
  }, [onError])

  // Resetear contador de reintentos cuando la sesión se recupera
  useEffect(() => {
    if (status === 'authenticated' && session) {
      setRetryCount(0)
      setLastError(null)
      setIsRetrying(false)
    }
  }, [status, session])

  // Auto-retry cuando hay problemas de sesión
  useEffect(() => {
    if (status === 'unauthenticated' && retryCount === 0 && !isRetrying) {
      // Solo auto-retry si estamos en una página que requiere autenticación
      const currentPath = window.location.pathname
      const protectedPaths = ['/admin', '/dashboard', '/profile']
      
      if (protectedPaths.some(path => currentPath.startsWith(path))) {
        retryAuth()
      }
    }
  }, [status, retryCount, isRetrying, retryAuth])

  return {
    session,
    status,
    isLoading: status === 'loading' || isRetrying,
    isRetrying,
    retryCount,
    lastError,
    signIn: signInWithRetry,
    signOut: signOutWithRetry,
    retryAuth,
    isAuthenticated: status === 'authenticated' && !!session,
    isAdmin: session?.user?.isAdmin || false,
    user: session?.user
  }
}

export default useAuthWithRetry