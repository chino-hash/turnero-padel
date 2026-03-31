'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback } from 'react'
import { signOut } from 'next-auth/react'

function getErrorDetails(code: string | null): {
  title: string
  description: string
  variant: 'denied' | 'oauth' | 'generic'
} {
  switch (code) {
    case 'AccessDenied':
      return {
        title: 'Sin acceso a este club',
        description:
          'Tu cuenta no está asociada a este club o no tienes permisos. Si ya juegas en otro club, debes usar su enlace. Si deberías entrar aquí (por ejemplo La Faja), pide al administrador que te dé de alta o que revise que tu usuario pertenezca a este club.',
        variant: 'denied',
      }
    case 'Callback':
      return {
        title: 'No se pudo completar el inicio de sesión',
        description:
          'El sistema no pudo crear la sesión después de Google. Suele pasar si tu email ya está registrado en otro club: cierra sesión abajo, vuelve a abrir el enlace del club correcto e inicia sesión desde ahí.',
        variant: 'oauth',
      }
    case 'Configuration':
      return {
        title: 'Error de configuración del servidor',
        description:
          'Falla la configuración de autenticación (OAuth o NextAuth). Si administras el sitio, revisa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y NEXTAUTH_URL en el entorno de despliegue.',
        variant: 'generic',
      }
    case 'OAuthSignin':
      return {
        title: 'Error al conectar con Google',
        description: 'No se pudo iniciar el flujo con Google. Inténtalo de nuevo o prueba otro navegador.',
        variant: 'oauth',
      }
    case 'OAuthCallback':
      return {
        title: 'Respuesta de Google inválida',
        description: 'Google devolvió un error o la conexión falló. Revisa la red y vuelve a intentar.',
        variant: 'oauth',
      }
    case 'OAuthAccountNotLinked':
      return {
        title: 'Cuenta ya vinculada',
        description: 'Esta cuenta de Google ya está asociada de otra forma. Usa el mismo método de acceso que usaste la primera vez.',
        variant: 'oauth',
      }
    case 'SessionRequired':
      return {
        title: 'Sesión requerida',
        description: 'Debes iniciar sesión para ver esta página.',
        variant: 'generic',
      }
    default:
      return {
        title: 'Error de autenticación',
        description:
          code && code !== 'Default'
            ? `Código: ${code}. Ha ocurrido un error durante el proceso de autenticación.`
            : 'Ha ocurrido un error durante el proceso de autenticación.',
        variant: 'generic',
      }
  }
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const { title, description, variant } = getErrorDetails(error)

  const handleSignOut = useCallback(() => {
    void signOut({ callbackUrl: '/' })
  }, [])

  const titleClass =
    variant === 'denied'
      ? 'text-amber-700'
      : variant === 'oauth'
        ? 'text-orange-700'
        : 'text-red-600'

  const showSignOut = error === 'AccessDenied' || error === 'Callback'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className={`text-2xl sm:text-4xl font-bold mb-4 ${titleClass}`}>{title}</h1>
        <p className="text-gray-600 mb-8 text-sm sm:text-base leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {showSignOut && (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
            >
              Cerrar sesión
            </button>
          )}
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
          >
            Intentar de nuevo
          </Link>
        </div>
        <Link href="/" className="inline-block mt-6 text-sm text-gray-500 hover:text-gray-800 underline-offset-2 hover:underline">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600 text-sm">Cargando…</p>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
