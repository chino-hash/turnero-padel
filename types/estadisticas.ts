export type Period = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'ano'

export interface EvolucionItem {
  fecha: string
  cantidad?: number
  total?: number
}

export interface CanchaMasUsada {
  nombre: string
  reservas: number
  porcentaje: number
}

export interface HorarioPico {
  hora: string
  reservas: number
}

export interface EstadisticasData {
  period: Period
  reservasHoy: number
  reservasSemana: number
  reservasCount: number
  reservasAnteriorCount: number
  variacionReservas: number | null
  ingresosMes: number
  ingresosAnterior: number
  variacionIngresos: number | null
  ocupacionPromedio: number
  ocupacionAnterior: number | null
  variacionOcupacion: number | null
  usuariosActivos: number
  canchasMasUsadas: CanchaMasUsada[]
  horariosPico: HorarioPico[]
  financiero: {
    totalRecaudado: number
    saldoPendiente: number
    totalReservas: number
  }
  promedioReservasPorUsuario: number
  satisfaccion: number
  evolucionReservas: EvolucionItem[]
  evolucionIngresos: Array<{ fecha: string; total: number }>
  usoPagina: {
    reservasPorUsuario: number
    reservasPorAdmin: number
    porcentajeUsoPagina: number | null
    sinDato: number
  }
}
