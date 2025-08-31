'use client'

import { useState, useEffect } from 'react'

interface EstadisticasData {
  reservasHoy: number
  reservasSemana: number
  ingresosMes: number
  ocupacionPromedio: number
  usuariosActivos: number
  canchasMasUsadas: Array<{
    nombre: string
    reservas: number
    porcentaje: number
  }>
  horariosPico: Array<{
    hora: string
    reservas: number
  }>
  financiero: {
    totalRecaudado: number
    saldoPendiente: number
    totalReservas: number
  }
  promedioReservasPorUsuario: number
  satisfaccion: number
}

interface UseEstadisticasReturn {
  estadisticas: EstadisticasData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useEstadisticas(): UseEstadisticasReturn {
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEstadisticas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/estadisticas', {
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
        throw new Error(data.error || 'Error al obtener estadísticas')
      }

      setEstadisticas(data.data)
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      
      // Datos de fallback en caso de error
      setEstadisticas({
        reservasHoy: 0,
        reservasSemana: 0,
        ingresosMes: 0,
        ocupacionPromedio: 0,
        usuariosActivos: 0,
        canchasMasUsadas: [],
        horariosPico: [],
        financiero: {
          totalRecaudado: 0,
          saldoPendiente: 0,
          totalReservas: 0
        },
        promedioReservasPorUsuario: 0,
        satisfaccion: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstadisticas()
  }, [])

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas
  }
}

export default useEstadisticas