'use client'

import dynamic from 'next/dynamic'
import ClientAppStateProvider from '@/components/providers/ClientAppStateProvider'
import { useState } from 'react'

const PadelBookingPage = dynamic(() => import('@/padel-booking'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">Cargando HomeSection...</div>
  ),
})

export default function TestPage() {
  const [showHome, setShowHome] = useState(true)

  return (
    <ClientAppStateProvider>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Página de Test - Componentes</h1>

        <div className="flex gap-3 mb-6">
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white"
            onClick={() => setShowHome(true)}
          >
            Mostrar HomeSection
          </button>
        </div>

        {showHome && <PadelBookingPage />}
      </div>
    </ClientAppStateProvider>
  )
}
