/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */
'use client'

import dynamic from 'next/dynamic'

// Importación dinámica para evitar problemas de prerenderización
const PadelBookingPage = dynamic(() => import('@/padel-booking'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
    </div>
  )
})

export default function DashboardPage() {
  // La autenticación se maneja en el layout (protected)
  return <PadelBookingPage />
}
