'use client'

import { useState, useEffect } from 'react'

interface ClienteFrecuente {
  id: string
  nombre: string
  email: string
  reservas: number
  reservasMes: number
  frecuencia: string
  canchaPreferida: string
  ultimaReserva: string | null
  categoria: string
  descuento: number
}

interface AnalisisUsuariosData {
  metricas: {
    totalUsuarios: number
    usuariosActivos: number
    nuevosEsteMes: number
    retencion: number
  }
  clientesMasFrecuentes: ClienteFrecuente[]
  clientesNuevosVsRecurrentes: {
    nuevos: number
    recurrentes: number
  }
  valorPromedioPorCliente: number
  distribucionCategorias: {
    VIP: number
    Premium: number
    Regular: number
  }
}

interface UseAnalisisUsuariosReturn {
  analisis: AnalisisUsuariosData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAnalisisUsuarios(): UseAnalisisUsuariosReturn {
  const [analisis, setAnalisis] = useState<AnalisisUsuariosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalisis = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/usuarios/analisis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener análisis de usuarios')
      }

      setAnalisis(data.data)
    } catch (err) {
      console.error('Error al cargar análisis de usuarios:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')

      setAnalisis({
        metricas: {
          totalUsuarios: 0,
          usuariosActivos: 0,
          nuevosEsteMes: 0,
          retencion: 0,
        },
        clientesMasFrecuentes: [],
        clientesNuevosVsRecurrentes: {
          nuevos: 0,
          recurrentes: 0,
        },
        valorPromedioPorCliente: 0,
        distribucionCategorias: {
          VIP: 0,
          Premium: 0,
          Regular: 0,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalisis()
  }, [])

  return {
    analisis,
    loading,
    error,
    refetch: fetchAnalisis,
  }
}

export default useAnalisisUsuarios
