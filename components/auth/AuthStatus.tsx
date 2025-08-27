'use client'

import { useAuthWithRetry } from '@/hooks/useAuthWithRetry'
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AuthStatusProps {
  showRetryButton?: boolean
  className?: string
}

export function AuthStatus({ showRetryButton = true, className = '' }: AuthStatusProps) {
  const {
    status,
    isRetrying,
    retryCount,
    lastError,
    retryAuth,
    isAuthenticated,
    user
  } = useAuthWithRetry({
    onError: (error) => {
      console.error('🔴 Error de autenticación:', error)
    }
  })

  if (status === 'loading') {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Verificando autenticación...</span>
      </div>
    )
  }

  if (isRetrying) {
    return (
      <div className={`flex items-center gap-2 text-sm text-amber-600 ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Reintentando conexión... ({retryCount}/3)</span>
      </div>
    )
  }

  if (lastError && !isAuthenticated) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-red-800">
            Error de autenticación: {lastError}
          </span>
          {showRetryButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={retryAuth}
              className="ml-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reintentar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span>
          Conectado como {user.name || user.email}
          {user.isAdmin && ' (Admin)'}
        </span>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span>No autenticado</span>
      </div>
    )
  }

  return null
}

export default AuthStatus