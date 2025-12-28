'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { FcGoogle } from 'react-icons/fc'
import { Loader2 } from 'lucide-react'
import { useAuthWithRetry } from '../../hooks/useAuthWithRetry'
import { AuthStatus } from './AuthStatus'

interface GoogleLoginFormProps {
  callbackUrl?: string
  error?: string
}

export function GoogleLoginForm({ callbackUrl = '/dashboard', error }: GoogleLoginFormProps) {
  const [loading, setLoading] = useState(false)
  const { signIn, isLoading, lastError } = useAuthWithRetry({
    onError: (error) => {
      console.error('🔴 Error en GoogleLoginForm:', error)
      setLoading(false)
    }
  })

  const handleGoogleSignIn = async () => {
    console.log('🔐 Botón de Google OAuth clickeado')
    console.log('📍 Callback URL:', callbackUrl)
    setLoading(true)
    
    const success = await signIn('google', callbackUrl)
    
    if (!success) {
      setLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error al conectar con Google. Inténtalo de nuevo.'
      case 'OAuthCallback':
        return 'Error en la respuesta de Google. Verifica tu conexión.'
      case 'OAuthCreateAccount':
        return 'No se pudo crear tu cuenta. Contacta al administrador.'
      case 'EmailCreateAccount':
        return 'Tu email no está autorizado para acceder.'
      case 'Callback':
        return 'Error de autenticación. Inténtalo de nuevo.'
      case 'OAuthAccountNotLinked':
        return 'Esta cuenta ya está asociada con otro método de login.'
      case 'EmailSignin':
        return 'No se pudo enviar el email de verificación.'
      case 'CredentialsSignin':
        return 'Credenciales inválidas.'
      case 'SessionRequired':
        return 'Debes iniciar sesión para acceder a esta página.'
      default:
        return 'Error de autenticación. Inténtalo de nuevo.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            🎾 Turnero de Padel
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Inicia sesión con tu cuenta de Google
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de autenticación */}
          <AuthStatus className="mb-4" />
          
          {(error || lastError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {error ? getErrorMessage(error) : lastError}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
            variant="outline"
          >
            {(loading || isLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FcGoogle className="h-5 w-5" />
            )}
            {(loading || isLoading) ? 'Iniciando sesión...' : 'Continuar con Google'}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Solo usuarios autorizados pueden acceder.</p>
            <p>Contacta al administrador para obtener acceso.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
