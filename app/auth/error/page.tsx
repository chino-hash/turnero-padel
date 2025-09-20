'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Error de Autenticación</h1>
        <p className="text-gray-600 mb-8">
          Ha ocurrido un error durante el proceso de autenticación.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </Link>
      </div>
    </div>
  )
}