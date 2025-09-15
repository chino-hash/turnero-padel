'use client'

import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Progress } from '../../../../components/ui/progress'
import { Separator } from '../../../../components/ui/separator'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
} from 'lucide-react'
import type { Booking } from '../../../../types/booking'

interface BookingStatsProps {
  bookings: Booking[]
  loading?: boolean
}

const statusColors = {
  PENDING: '#f59e0b',
  CONFIRMED: '#10b981',
  ACTIVE: '#3b82f6',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
}

const statusLabels = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export function BookingStats({ bookings, loading = false }: BookingStatsProps) {
  const stats = useMemo(() => {
    if (!bookings.length) {
      return {
        total: 0,
        byStatus: {},
        byCourt: {},
        byHour: {},
        byDay: {},
        revenue: 0,
        averagePlayersPerBooking: 0,
        occupancyRate: 0,
        trends: [],
      }
    }

    // Estadísticas por estado
    const byStatus = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Estadísticas por cancha
    const byCourt = bookings.reduce((acc, booking) => {
      const courtName = booking.court?.name || 'Sin cancha'
      acc[courtName] = (acc[courtName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Estadísticas por hora
    const byHour = bookings.reduce((acc, booking) => {
      const hour = booking.startTime.split(':')[0]
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Estadísticas por día de la semana
    const byDay = bookings.reduce((acc, booking) => {
      const date = new Date(booking.bookingDate)
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const dayName = dayNames[date.getDay()]
      acc[dayName] = (acc[dayName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Ingresos estimados (precio base de $50 por hora)
    const revenue = bookings
      .filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
      .reduce((acc, booking) => {
        const startTime = new Date(`2000-01-01T${booking.startTime}`)
        const endTime = new Date(`2000-01-01T${booking.endTime}`)
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        return acc + (hours * 50) // $50 por hora
      }, 0)

    // Promedio de jugadores por reserva
    const totalPlayers = bookings.reduce((acc, booking) => {
      return acc + (booking.players?.length || 0)
    }, 0)
    const averagePlayersPerBooking = bookings.length > 0 ? totalPlayers / bookings.length : 0

    // Tasa de ocupación (simulada)
    const occupancyRate = Math.min((bookings.length / 100) * 100, 100)

    // Tendencias por mes (últimos 6 meses)
    const trends = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthName = date.toLocaleDateString('es', { month: 'short' })
      
      // Simular datos de tendencia
      const monthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDate)
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear()
      }).length
      
      return {
        month: monthName,
        bookings: monthBookings,
        revenue: monthBookings * 75, // Promedio de $75 por reserva
      }
    })

    return {
      total: bookings.length,
      byStatus,
      byCourt,
      byHour,
      byDay,
      revenue,
      averagePlayersPerBooking,
      occupancyRate,
      trends,
    }
  }, [bookings])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Preparar datos para gráficos
  const statusChartData = Object.entries(stats.byStatus).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
    color: statusColors[status as keyof typeof statusColors] || '#6b7280',
  }))

  const courtChartData = Object.entries(stats.byCourt).map(([court, count]) => ({
    name: court,
    reservas: count,
  }))

  const hourChartData = Object.entries(stats.byHour)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([hour, count]) => ({
      hour: `${hour}:00`,
      reservas: count,
    }))

  const dayChartData = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => ({
    day,
    reservas: stats.byDay[day] || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? '+12% desde el mes pasado' : 'No hay datos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenue > 0 ? '+8% desde el mes pasado' : 'No hay ingresos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <Progress value={stats.occupancyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jugadores/Reserva</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePlayersPerBooking.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Promedio de jugadores por reserva
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estados de reservas */}
        <Card>
          <CardHeader>
            <CardTitle>Estados de Reservas</CardTitle>
            <CardDescription>
              Distribución por estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2">
                  {statusChartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservas por cancha */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas por Cancha</CardTitle>
            <CardDescription>
              Uso de cada cancha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courtChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={courtChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reservas" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservas por hora */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas por Hora</CardTitle>
            <CardDescription>
              Horarios más populares
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hourChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reservas" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservas por día de la semana */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas por Día</CardTitle>
            <CardDescription>
              Días más activos de la semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dayChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dayChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reservas" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tendencias */}
      {stats.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendencias (Últimos 6 Meses)</CardTitle>
            <CardDescription>
              Evolución de reservas e ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="bookings" fill="#3b82f6" name="Reservas" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Ingresos ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Resumen de estados */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Estados</CardTitle>
          <CardDescription>
            Detalle de todas las reservas por estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = stats.byStatus[status] || 0
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              
              return (
                <div key={status} className="text-center space-y-2">
                  <Badge 
                    variant="outline" 
                    className="w-full justify-center"
                    style={{ 
                      backgroundColor: `${statusColors[status as keyof typeof statusColors]}20`,
                      borderColor: statusColors[status as keyof typeof statusColors],
                      color: statusColors[status as keyof typeof statusColors]
                    }}
                  >
                    {label}
                  </Badge>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{
                      '--progress-background': statusColors[status as keyof typeof statusColors]
                    } as React.CSSProperties}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}