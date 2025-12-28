'use client'

import { useState, useEffect } from 'react'

interface ProductoMasVendido {
  nombre: string
  categoria: string
  cantidad: number
  ingresos: number
  transacciones: number
}

interface DiaDemanda {
  fecha: string
  diaSemana: string
  reservas: number
}

interface DiaSemanaPopular {
  dia: string
  reservas: number
  porcentaje: number
}

interface AnalisisTemporal {
  comparativa: {
    reservas: { actual: number, anterior: number, cambio: number }
    ingresos: { actual: number, anterior: number, cambio: number }
    ocupacion: { actual: number, anterior: number, cambio: number }
  }
  tendenciaSemanal: Array<{ semana: string, reservas: number, ingresos: number }>
  proyeccionIngresos: number
}

interface AnalisisProductos {
  masVendidos: ProductoMasVendido[]
  totalIngresos: number
  totalVentas: number
  totalCantidad: number
  bajoStock: Array<{ nombre: string, stock: number, categoria: string }>
  categoriasRentables: Array<{ categoria: string, ingresos: number, ventas: number }>
  rotacion: Array<{ nombre: string, rotacion: number, categoria: string }>
}

interface Rendimiento {
  ocupacionPorCancha: Array<{ cancha: string, ocupacion: number, reservas: number }>
  horariosRentables: Array<{ horario: string, ingresos: number, reservas: number }>
  eficienciaTurnosFijos: {
    totalRecurrentes: number
    totalPuntuales: number
    porcentajeRecurrentes: number
  }
}

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
  productos: AnalisisProductos
  demanda: {
    diasMasDemanda: DiaDemanda[]
    diasSemanaPopulares: DiaSemanaPopular[]
  }
  temporal: AnalisisTemporal
  rendimiento: Rendimiento
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
        satisfaccion: 0,
        productos: {
          masVendidos: [],
          totalIngresos: 0,
          totalVentas: 0,
          totalCantidad: 0,
          bajoStock: [],
          categoriasRentables: [],
          rotacion: []
        },
        demanda: {
          diasMasDemanda: [],
          diasSemanaPopulares: []
        },
        temporal: {
          comparativa: {
            reservas: { actual: 0, anterior: 0, cambio: 0 },
            ingresos: { actual: 0, anterior: 0, cambio: 0 },
            ocupacion: { actual: 0, anterior: 0, cambio: 0 }
          },
          tendenciaSemanal: [],
          proyeccionIngresos: 0
        },
        rendimiento: {
          ocupacionPorCancha: [],
          horariosRentables: [],
          eficienciaTurnosFijos: {
            totalRecurrentes: 0,
            totalPuntuales: 0,
            porcentajeRecurrentes: 0
          }
        }
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