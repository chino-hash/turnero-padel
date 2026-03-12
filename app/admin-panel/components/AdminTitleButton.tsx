"use client"

import { useRouter, useSearchParams } from "next/navigation"

// Componente de botón que mantiene el estilo del h1
export default function AdminTitleButton() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantId = searchParams.get('tenantId')?.trim()
  const tenantSlug = searchParams.get('tenantSlug')?.trim()
  const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''
  
  const handleClick = () => {
    router.push(`/admin-panel/admin${qs}`)
  }

  return (
    <button
      onClick={handleClick}
      className="text-lg sm:text-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 flex items-center justify-center"
      id="admin-title"
      aria-label="Ir al panel principal de administración"
      title="Panel Principal de Administración"
    >
      Admin
    </button>
  )
}