'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ImprovedLoginFormProps {
  callbackUrl?: string
  error?: string
}

export function ImprovedLoginForm({ callbackUrl = '/', error }: ImprovedLoginFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleGoogleSignIn = async () => {
    console.log('🔐 Iniciando autenticación con Google')
    setLoading(true)
    
    try {
      const result = await signIn('google', {
        callbackUrl,
        redirect: false
      })
      
      if (result?.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = callbackUrl
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Error al iniciar sesión:', error)
      setLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    const errorMessages = {
      'OAuthSignin': {
        title: 'Error de conexión',
        message: 'No se pudo conectar con Google. Verifica tu conexión a internet.',
        action: 'Intentar nuevamente'
      },
      'OAuthCallback': {
        title: 'Error de respuesta',
        message: 'Hubo un problema con la respuesta de Google.',
        action: 'Reintentar'
      },
      'OAuthCreateAccount': {
        title: 'Cuenta no autorizada',
        message: 'Tu cuenta no tiene permisos para acceder.',
        action: 'Contactar administrador'
      },
      'EmailCreateAccount': {
        title: 'Email no autorizado',
        message: 'Tu dirección de email no está en la lista de usuarios autorizados.',
        action: 'Solicitar acceso'
      },
      'SessionRequired': {
        title: 'Sesión requerida',
        message: 'Necesitas iniciar sesión para acceder a esta página.',
        action: 'Iniciar sesión'
      },
      'default': {
        title: 'Error de autenticación',
        message: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
        action: 'Reintentar'
      }
    }
    
    return errorMessages[error as keyof typeof errorMessages] || errorMessages.default
  }

  const errorInfo = error ? getErrorMessage(error) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50 px-4">
      <Card className="w-full max-w-md transform transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4 space-y-2">
          {/* Logo mejorado */}
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg border-2 border-emerald-200">
            <img 
              src="/logo/padellisto.png" 
              alt="Padel Listo Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Turnero de Padel
          </CardTitle>
          
          <p className="text-sm text-gray-600">
            {success ? '¡Bienvenido! Redirigiendo...' : 'Inicia sesión con tu cuenta de Google'}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Mensaje de error mejorado */}
          {errorInfo && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <div>
                <div className="font-medium">{errorInfo.title}</div>
                <AlertDescription className="mt-1">
                  {errorInfo.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {/* Mensaje de éxito */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ¡Autenticación exitosa! Redirigiendo al dashboard...
              </AlertDescription>
            </Alert>
          )}
          
          {/* Botón de Google mejorado */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading || success}
            className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            variant="outline"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Conectando con Google...</span>
              </div>
            ) : success ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>¡Conectado!</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Icono de Google mejorado */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Continuar con Google</span>
              </div>
            )}
          </Button>
          
          {/* Información adicional mejorada */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sistema seguro y confiable</span>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>Solo usuarios autorizados pueden acceder</p>
              <p>
                ¿Necesitas acceso?{' '}
                <button 
                  className="text-blue-600 hover:text-blue-800 underline transition-colors"
                  onClick={() => window.open('mailto:admin@turnero.com?subject=Solicitud de Acceso', '_blank')}
                >
                  Contactar administrador
                </button>
              </p>
            </div>
          </div>
          
          {/* Indicador de progreso */}
          {loading && (
            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Elementos decorativos de fondo */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-teal-200/30 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}