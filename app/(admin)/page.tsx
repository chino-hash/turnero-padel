/**
 * Página principal del panel de administración
 * Redirige automáticamente a la sección de turnos
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente a la sección de turnos
    router.replace('/admin/turnos')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando panel de administración...</p>
      </div>
    </div>
  )
}
