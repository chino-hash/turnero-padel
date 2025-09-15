'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const [countdown, setCountdown] = useState(0) // Deshabilitado el countdown
  const [shouldRedirect, setShouldRedirect] = useState(false) // Deshabilitado el redirect automático

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Error de Configuración',
          message: 'Hay un problema con la configuración del servidor. Contacta al administrador.',
          canRetry: false
        }
      case 'AccessDenied':
        return {
          title: 'Acceso Denegado',
          message: 'No tienes permisos para acceder a esta aplicación. Solo usuarios autorizados pueden ingresar.',
          canRetry: true
        }
      case 'Verification':
        return {
          title: 'Error de Verificación',
          message: 'No se pudo verificar tu identidad. Inténtalo de nuevo.',
          canRetry: true
        }
      case 'OAuthSignin':
        return {
          title: 'Error de Conexión',
          message: 'Error al conectar con Google. Verifica tu conexión a internet.',
          canRetry: true
        }
      case 'OAuthCallback':
        return {
          title: 'Error de Respuesta',
          message: 'Error en la respuesta de Google. El proceso de autenticación falló.',
          canRetry: true
        }
      case 'OAuthCreateAccount':
        return {
          title: 'Error al Crear Cuenta',
          message: 'No se pudo crear tu cuenta. Contacta al administrador si el problema persiste.',
          canRetry: true
        }
      case 'EmailCreateAccount':
        return {
          title: 'Email No Autorizado',
          message: 'Tu dirección de email no está autorizada para acceder a esta aplicación.',
          canRetry: false
        }
      case 'Callback':
        return {
          title: 'Error de Autenticación',
          message: 'Ocurrió un error durante el proceso de autenticación.',
          canRetry: true
        }
      case 'OAuthAccountNotLinked':
        return {
          title: 'Cuenta Ya Vinculada',
          message: 'Esta cuenta de Google ya está asociada con otro usuario.',
          canRetry: false
        }
      case 'SessionRequired':
        return {
          title: 'Sesión Requerida',
          message: 'Debes iniciar sesión para acceder a esta página.',
          canRetry: true
        }
      case 'Default':
      default:
        return {
          title: 'Error de Autenticación',
          message: 'Ocurrió un error inesperado durante la autenticación. Inténtalo de nuevo.',
          canRetry: true
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  // Log del error para debugging, pero sin redirección automática para evitar bucles
  useEffect(() => {
    console.log('🚨 Auth Error Page - Error detectado:', error)
    // Eliminamos la redirección automática para evitar bucles infinitos
    // El usuario debe usar los botones manuales para navegar
  }, [error])

  // Función para cancelar el redireccionamiento
  const cancelRedirect = () => {
    setShouldRedirect(false)
    setCountdown(0)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            🎾 Turnero de Padel
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Error de Autenticación
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{errorInfo.title}</p>
                <p className="text-sm">{errorInfo.message}</p>
                {error && (
                  <p className="text-xs text-gray-500 mt-2">
                    Código de error: {error}
                  </p>
                )}
                {shouldRedirect && countdown > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      Serás redirigido al login en <span className="font-bold">{countdown}</span> segundos...
                    </p>
                    <Button 
                      onClick={cancelRedirect}
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs"
                    >
                      Cancelar redireccionamiento
                    </Button>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            {errorInfo.canRetry && (
              <>
                <Button 
                  onClick={() => window.location.href = '/api/auth/signin?prompt=select_account'} 
                  className="w-full"
                >
                  Reintentar Autenticación
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    Ir a Página de Login
                  </Link>
                </Button>
              </>
            )}
            
            {!errorInfo.canRetry && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Volver al Inicio
                </Link>
              </Button>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-500 space-y-1">
            <p>¿Necesitas ayuda?</p>
            <p>Contacta al administrador del sistema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}