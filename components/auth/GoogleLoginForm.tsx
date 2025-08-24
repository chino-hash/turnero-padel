'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GoogleLoginFormProps {
  callbackUrl?: string
  error?: string
}

export function GoogleLoginForm({ callbackUrl = '/', error }: GoogleLoginFormProps) {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    console.log('🔐 Botón de Google OAuth clickeado')
    console.log('📍 Callback URL:', callbackUrl)
    setLoading(true)
    try {
      console.log('🚀 Ejecutando signIn("google")...')
      const result = await signIn('google', {
        callbackUrl,
        redirect: true
      })
      console.log('✅ Resultado de signIn:', result)
    } catch (error) {
      console.error('❌ Error al iniciar sesión:', error)
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
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            variant="outline"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-gray-500 space-y-1">
            <p>Solo usuarios autorizados pueden acceder</p>
            <p>Contacta al administrador si necesitas acceso</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
