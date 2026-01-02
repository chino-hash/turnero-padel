'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirige a la ruta de estadísticas con datos reales
 * Esta ruta con datos mock ha sido deprecada en favor de /admin-panel/estadisticas
 */
export default function EstadisticasPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin-panel/estadisticas')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirigiendo a estadísticas...</p>
      </div>
    </div>
  )
}
