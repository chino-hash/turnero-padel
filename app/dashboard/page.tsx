'use client'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientAppStateProvider from '@/components/providers/ClientAppStateProvider'

const PadelBookingPage = dynamic(() => import('@/padel-booking'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
    </div>
  )
})

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(false)
  const tenantSlug = searchParams.get('tenantSlug')

  useEffect(() => {
    // Si viene tenantSlug en la URL, validar que el usuario tiene acceso
    // La validación real se hace en el backend, aquí solo limpiamos la URL después de procesar
    if (tenantSlug) {
      // El tenantSlug ya fue procesado en el callback de auth
      // Solo limpiamos la URL para mejor UX (opcional)
      // Podemos mantenerlo para referencia o removerlo
      // Por ahora lo mantenemos en la URL
    }
  }, [tenantSlug, router])

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <ClientAppStateProvider>
      <PadelBookingPage />
    </ClientAppStateProvider>
  )
}