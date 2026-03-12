'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { FcGoogle } from 'react-icons/fc'
import { Loader2 } from 'lucide-react'
import { useAuthWithRetry } from '../../hooks/useAuthWithRetry'
import { AuthStatus } from './AuthStatus'

/**
 * Formulario de login con Google OAuth.
 * Layout de dos columnas: izquierda imagen de cancha; derecha panel con glassmorphism,
 * gradiente oscuro (azul petróleo, negro, gris azulado), logo decorativo y contenido centrado.
 *
 * @component
 * @param {GoogleLoginFormProps} props
 * @param {string} [props.callbackUrl='/dashboard'] - URL a la que redirigir tras login exitoso
 * @param {string} [props.error] - Código de error de NextAuth para mostrar mensaje traducido
 * @see docs/actualizaciones/login-ui-authstatus-2026-03.md
 */
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

  const courtImage = '/login/Gemini_Generated_Image_oh3x4joh3x4joh3x.png'

  return (
    <div className="w-full min-h-screen grid md:grid-cols-2 overflow-hidden bg-slate-950">
      <div className="relative hidden md:block h-full bg-zinc-900">
        <img
          src={courtImage}
          alt="Padel Court"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/30" aria-hidden />
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

      {/* Panel derecho: glassmorphism oscuro, gradiente y blur que difumina la cancha */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Fondo: imagen de cancha difuminada + gradiente oscuro (azul petróleo, negro, gris azulado) */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat bg-[position:100%_0] md:bg-[position:0_0]"
          style={{ backgroundImage: `url(${courtImage})` }}
        />
        <div className="absolute inset-0 backdrop-blur-[18px] md:backdrop-blur-[22px]" aria-hidden />
        {/* Gradiente oscuro difuminado: azul petróleo muy oscuro, negro, gris azulado */}
        <div
          className="absolute inset-0 opacity-95"
          style={{
            background: 'linear-gradient(135deg, #0a2d2d 0%, #051a1a 35%, #000000 65%, #0f172a 100%)',
          }}
          aria-hidden
        />

        {/* Logo decorativo: padel copia.svg — gris claro translúcido, opacidad baja, blur suave */}
        <div
          className="absolute inset-0 flex items-center justify-end pointer-events-none opacity-[0.12]"
          aria-hidden
        >
          <img
            src="/login/padel%20copia.svg"
            alt=""
            className="h-[65%] w-auto max-w-[50%] object-contain blur-[2px] brightness-0 invert"
          />
        </div>

        {/* Contenido centrado — tipografía reducida */}
        <div className="relative z-10 mx-auto w-full max-w-[320px] px-5 py-10 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Bienvenido a PADELBOOK
          </h1>
          <p className="mt-2 text-sm text-gray-300 leading-snug max-w-[280px] mx-auto">
            Accede a tu cuenta para gestionar tus turnos de manera rápida y segura.
          </p>

          <div className="mt-6 grid gap-3">
            <AuthStatus className="mb-1 text-xs" />
            {(error || lastError) && (
              <Alert variant="destructive" className="text-xs">
                <AlertDescription className="text-xs">
                  {error ? getErrorMessage(error) : lastError}
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading || isLoading}
              className="h-10 w-full rounded-lg text-sm bg-white text-black font-medium hover:bg-gray-100 focus-visible:ring-white/20"
              variant="outline"
            >
              {(loading || isLoading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="h-4 w-4 shrink-0" />
              )}
              <span className="ml-2">{(loading || isLoading) ? 'Iniciando sesión...' : 'Continuar con Google'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
