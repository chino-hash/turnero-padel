'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
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
    <div className="w-full min-h-screen grid md:grid-cols-2 overflow-hidden bg-background">
      <div className="relative hidden md:block h-full bg-zinc-900">
        <img
          src="/login/Gemini_Generated_Image_oh3x4joh3x4joh3x.png"
          alt="Padel Court"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="relative z-20 flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Turnero de Padel
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;La plataforma ideal para gestionar tus reservas de padel de manera simple y eficiente.&rdquo;
              </p>
            </blockquote>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black/95">
        <div className="mx-auto grid w-full max-w-[350px] gap-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Crear una cuenta
            </h1>
            <p className="text-sm text-gray-400">
              Inicia sesión con tu cuenta de Google para continuar
            </p>
          </div>
          
          <div className="grid gap-4">
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
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200"
              variant="outline"
            >
              {(loading || isLoading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="h-5 w-5" />
              )}
              {(loading || isLoading) ? 'Iniciando sesión...' : 'Continuar con Google'}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>Solo usuarios autorizados pueden acceder.</p>
            <p>Contacta al administrador para obtener acceso.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
