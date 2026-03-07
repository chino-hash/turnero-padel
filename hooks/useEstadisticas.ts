'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EstadisticasData, Period } from '@/types/estadisticas'

const emptyEstadisticas: EstadisticasData = {
  period: 'mes',
  reservasHoy: 0,
  reservasSemana: 0,
  reservasCount: 0,
  reservasAnteriorCount: 0,
  variacionReservas: null,
  ingresosMes: 0,
  ingresosAnterior: 0,
  variacionIngresos: null,
  ocupacionPromedio: 0,
  ocupacionAnterior: null,
  variacionOcupacion: null,
  usuariosActivos: 0,
  canchasMasUsadas: [],
  horariosPico: [],
  financiero: {
    totalRecaudado: 0,
    saldoPendiente: 0,
    totalReservas: 0,
  },
  promedioReservasPorUsuario: 0,
  satisfaccion: 0,
  evolucionReservas: [],
  evolucionIngresos: [],
  usoPagina: {
    reservasPorUsuario: 0,
    reservasPorAdmin: 0,
    porcentajeUsoPagina: null,
    sinDato: 0,
  },
}

export interface UseEstadisticasReturn {
  estadisticas: EstadisticasData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  period: Period
  setPeriod: (p: Period) => void
}

export function useEstadisticas(initialPeriod: Period = 'mes'): UseEstadisticasReturn {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEstadisticas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const url = new URL('/api/estadisticas', window.location.origin)
      url.searchParams.set('period', period)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener estadísticas')
      }

      setEstadisticas(data.data as EstadisticasData)
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setEstadisticas(emptyEstadisticas)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchEstadisticas()
  }, [fetchEstadisticas])

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas,
    period,
    setPeriod,
  }
}

export default useEstadisticas
