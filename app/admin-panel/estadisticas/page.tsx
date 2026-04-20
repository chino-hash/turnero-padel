'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  RefreshCw,
  AlertCircle,
  FileDown,
  FileSpreadsheet,
  Monitor,
  UserCog,
} from 'lucide-react'
import { exportToPdf, exportToExcel } from '@/lib/export-estadisticas'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useEstadisticas } from '@/hooks/useEstadisticas'
import type { Period } from '@/types/estadisticas'
import { setAdminContextTenant, getAdminContextTenant } from '@/lib/utils/admin-context-tenant'

const CHART_COLORS = {
  reservas: 'var(--chart-1)',
  ingresos: 'var(--chart-2)',
  bar: 'var(--chart-2)',
}

const PERIOD_LABELS: Record<Period, string> = {
  hoy: 'Hoy',
  semana: 'Semana',
  mes: 'Mes',
  trimestre: 'Trimestre',
  ano: 'Año',
}

function VariacionBadge({ variacion }: { variacion: number | null }) {
  if (variacion === null) return null
  const isPositive = variacion >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
    >
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}{variacion}% vs período anterior
    </span>
  )
}

export default function EstadisticasPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin)
  const tenantIdFromUrl = searchParams.get('tenantId')?.trim() || null
  const tenantSlugFromUrl = searchParams.get('tenantSlug')?.trim() || null

  useEffect(() => {
    if (tenantIdFromUrl || tenantSlugFromUrl) {
      setAdminContextTenant(tenantIdFromUrl, tenantSlugFromUrl)
    }
  }, [tenantIdFromUrl, tenantSlugFromUrl])

  useEffect(() => {
    if (!isSuperAdmin || tenantIdFromUrl || tenantSlugFromUrl) return
    const { tenantId, tenantSlug } = getAdminContextTenant()
    if (tenantId) {
      router.replace(`${pathname}?tenantId=${encodeURIComponent(tenantId)}`)
      return
    }
    if (tenantSlug) {
      router.replace(`${pathname}?tenantSlug=${encodeURIComponent(tenantSlug)}`)
    }
  }, [isSuperAdmin, tenantIdFromUrl, tenantSlugFromUrl, pathname, router])

  const { estadisticas, loading, error, refetch, period, setPeriod } =
    useEstadisticas('mes', { tenantId: tenantIdFromUrl, tenantSlug: tenantSlugFromUrl })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Cargando estadísticas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-6 h-6" />
          <span>Error al cargar estadísticas: {error}</span>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!estadisticas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span>No hay datos disponibles</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-foreground mb-2">
            Estadísticas
          </h1>
          <div className="w-16 h-0.5 bg-orange-500" />
          <p className="text-muted-foreground text-xs mt-2">
            Análisis de ocupación y rendimiento del complejo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as Period)}
            disabled={loading}
          >
            <SelectTrigger className="w-[140px] min-h-[44px] sm:min-h-[40px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => exportToPdf(estadisticas, PERIOD_LABELS[period])}
            variant="outline"
            disabled={!estadisticas}
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button
            onClick={() => exportToExcel(estadisticas, PERIOD_LABELS[period])}
            variant="outline"
            disabled={!estadisticas}
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button
            onClick={refetch}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas ({PERIOD_LABELS[period]})
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.reservasCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <VariacionBadge variacion={estadisticas.variacionReservas} />
              {estadisticas.variacionReservas === null && 'Reservas del período'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos ({PERIOD_LABELS[period]})
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${estadisticas.ingresosMes.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <VariacionBadge variacion={estadisticas.variacionIngresos} />
              {estadisticas.variacionIngresos === null && 'Ingresos del período'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ocupación Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.ocupacionPromedio}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <VariacionBadge variacion={estadisticas.variacionOcupacion} />
              {estadisticas.variacionOcupacion === null &&
                'Ocupación del período'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estadisticas.usuariosActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              Con reservas en el período
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Resumen financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20 sm:p-4">
              <p className="text-xs font-medium text-green-600 dark:text-green-300 sm:text-sm">Total recaudado</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400 sm:text-xl">
                ${estadisticas.financiero.totalRecaudado.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 text-center dark:bg-yellow-900/20 sm:p-4">
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-300 sm:text-sm">Saldo pendiente</p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400 sm:text-xl">
                ${estadisticas.financiero.saldoPendiente.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20 sm:p-4">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-300 sm:text-sm">Total reserva</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400 sm:text-xl">
                ${estadisticas.financiero.totalReservas.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolución reservas e ingresos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Evolución de reservas e ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {estadisticas.evolucionReservas.length === 0 &&
          estadisticas.evolucionIngresos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin datos en este período
            </p>
          ) : (
            <div
              className="h-[280px] w-full"
              role="img"
              aria-label={`Evolución de reservas e ingresos en el período ${PERIOD_LABELS[period]}. ${estadisticas.evolucionReservas.length} puntos de datos.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={(() => {
                    const byFecha = new Map<
                      string,
                      { fecha: string; reservas: number; ingresos: number }
                    >()
                    for (const r of estadisticas.evolucionReservas) {
                      byFecha.set(r.fecha, {
                        fecha: r.fecha,
                        reservas: r.cantidad ?? 0,
                        ingresos: 0,
                      })
                    }
                    for (const i of estadisticas.evolucionIngresos) {
                      const existing = byFecha.get(i.fecha)
                      if (existing) existing.ingresos = i.total
                      else byFecha.set(i.fecha, { fecha: i.fecha, reservas: 0, ingresos: i.total })
                    }
                    return Array.from(byFecha.values()).sort((a, b) =>
                      a.fecha.localeCompare(b.fecha)
                    )
                  })()}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: unknown, name, props) => {
                      const dataKey = props?.dataKey ?? String(name).toLowerCase()
                      const isIngresos = dataKey === 'ingresos'
                      const label = isIngresos ? 'Ingresos' : 'Reservas'
                      const num = value != null ? Number(value) : 0
                      const displayValue = isIngresos ? `$${num.toLocaleString()}` : num
                      return [displayValue, label]
                    }}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="reservas"
                    name="Reservas"
                    stroke={CHART_COLORS.reservas}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ingresos"
                    name="Ingresos"
                    stroke={CHART_COLORS.ingresos}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canchas más utilizadas: tabla (sin gráfico) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Canchas Más Utilizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas.canchasMasUsadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin datos en este período
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="h-9 px-4 text-left font-medium text-foreground">
                        Cancha
                      </th>
                      <th className="h-9 px-4 text-right font-medium text-foreground">
                        Reservas
                      </th>
                      <th className="h-9 px-4 text-right font-medium text-foreground">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticas.canchasMasUsadas.map((cancha, index) => (
                      <tr
                        key={index}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-2 text-foreground">
                          {cancha.nombre}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {cancha.reservas}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {cancha.porcentaje}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horarios pico - gráfico de barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Horarios Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas.horariosPico.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin datos en este período
              </p>
            ) : (
              <div
                className="h-[260px] w-full"
                role="img"
              aria-label={`Horarios con más reservas en el período ${PERIOD_LABELS[period]}. ${estadisticas.horariosPico.length} franjas horarias.`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={estadisticas.horariosPico.map((h) => ({
                      hora: h.hora,
                      reservas: h.reservas,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{
                        fontSize: 12,
                        fill: 'var(--foreground)',
                        fontWeight: 500,
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="hora"
                      width={90}
                      tick={{
                        fontSize: 12,
                        fill: 'var(--foreground)',
                        fontWeight: 500,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--foreground)',
                      }}
                      labelStyle={{ color: 'var(--foreground)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      formatter={(value) => [value != null ? value : 0, 'Reservas']}
                      labelFormatter={(label) => `Horario: ${label}`}
                    />
                    <Bar
                      dataKey="reservas"
                      fill={CHART_COLORS.bar}
                      radius={[0, 4, 4, 0]}
                      name="Reservas"
                      maxBarSize={28}
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Resumen de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {estadisticas.usuariosActivos}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Usuarios Activos
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {estadisticas.satisfaccion}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Tasa de cumplimiento
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {estadisticas.promedioReservasPorUsuario}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Reservas por Usuario
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Uso de la página
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Reservas hechas por usuarios en la web vs. reservas hechas por el admin
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {estadisticas.usoPagina.reservasPorUsuario}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Monitor className="h-4 w-4" />
                Por usuarios (web)
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {estadisticas.usoPagina.reservasPorAdmin}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <UserCog className="h-4 w-4" />
                Por admin
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {estadisticas.usoPagina.porcentajeUsoPagina != null
                  ? `${estadisticas.usoPagina.porcentajeUsoPagina}%`
                  : '—'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Uso de la página
              </div>
            </div>
            {estadisticas.usoPagina.sinDato > 0 && (
              <div className="text-center">
                <div className="text-2xl font-semibold text-muted-foreground">
                  {estadisticas.usoPagina.sinDato}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Sin dato (reservas antiguas)
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
