'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Clock, RefreshCw, AlertCircle, Package, ShoppingCart, TrendingDown, Activity } from 'lucide-react'
import { useEstadisticas } from '../../../hooks/useEstadisticas'
import { Button } from '../../../components/ui/button'

export default function EstadisticasPage() {
  const { estadisticas, loading, error, refetch } = useEstadisticas()

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
        <div className="flex items-center space-x-2 text-red-600">
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
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Análisis y Estadísticas</h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">Consulta métricas clave y análisis de rendimiento.</p>
        </div>
        <Button 
          onClick={refetch} 
          variant="outline" 
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.reservasHoy}</div>
            <p className="text-xs text-muted-foreground">Reservas del día actual</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Semana</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.reservasSemana}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estadisticas.ingresosMes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Mes actual</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.ocupacionPromedio}%</div>
            <p className="text-xs text-muted-foreground">Promedio mensual</p>
          </CardContent>
        </Card>
      </div>

      {/* ANÁLISIS TEMPORAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Análisis Temporal
          </CardTitle>
          <CardDescription>
            Comparativa con mes anterior y tendencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Comparativa Reservas */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">Reservas</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                {estadisticas.temporal.comparativa.reservas.actual}
              </div>
              <div className="flex items-center text-xs">
                {estadisticas.temporal.comparativa.reservas.cambio >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span className={estadisticas.temporal.comparativa.reservas.cambio >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(estadisticas.temporal.comparativa.reservas.cambio)}% vs mes anterior
                </span>
              </div>
            </div>

            {/* Comparativa Ingresos */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-sm font-medium text-green-600 dark:text-green-300 mb-2">Ingresos</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
                ${estadisticas.temporal.comparativa.ingresos.actual.toLocaleString()}
              </div>
              <div className="flex items-center text-xs">
                {estadisticas.temporal.comparativa.ingresos.cambio >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span className={estadisticas.temporal.comparativa.ingresos.cambio >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(estadisticas.temporal.comparativa.ingresos.cambio)}% vs mes anterior
                </span>
              </div>
            </div>

            {/* Comparativa Ocupación */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">Ocupación</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">
                {estadisticas.temporal.comparativa.ocupacion.actual}%
              </div>
              <div className="flex items-center text-xs">
                {estadisticas.temporal.comparativa.ocupacion.cambio >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span className={estadisticas.temporal.comparativa.ocupacion.cambio >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(estadisticas.temporal.comparativa.ocupacion.cambio)}% vs mes anterior
                </span>
              </div>
            </div>
          </div>

          {/* Tendencia Semanal */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Tendencia Semanal (Últimas 4 semanas)</h4>
            <div className="space-y-2">
              {estadisticas.temporal.tendenciaSemanal.map((semana, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium text-foreground">{semana.semana}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">{semana.reservas} reservas</span>
                    <span className="text-sm font-semibold text-green-600">${semana.ingresos.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proyección */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="text-sm font-medium text-orange-600 dark:text-orange-300 mb-1">Proyección de Ingresos</div>
            <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
              ${estadisticas.temporal.proyeccionIngresos.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Basado en tendencia de últimas 4 semanas</div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos y análisis detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canchas más utilizadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Canchas Más Utilizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.canchasMasUsadas.length > 0 ? (
                estadisticas.canchasMasUsadas.map((cancha, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium text-foreground">{cancha.nombre}</div>
                        <div className="text-sm text-muted-foreground">{cancha.reservas} reservas</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${cancha.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Horarios pico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Horarios Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.horariosPico.length > 0 ? (
                estadisticas.horariosPico.map((horario, index) => {
                  const maxReservas = estadisticas.horariosPico[0]?.reservas || 1
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-medium text-foreground">{horario.hora}</div>
                          <div className="text-sm text-muted-foreground">{horario.reservas} reservas</div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(horario.reservas / maxReservas) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ESTADÍSTICAS DE PRODUCTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription>
              Top 10 productos del mes actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.productos.masVendidos.length > 0 ? (
                estadisticas.productos.masVendidos.map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium text-foreground">{producto.nombre}</div>
                        <div className="text-sm text-muted-foreground">{producto.cantidad} unidades</div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{producto.categoria}</span>
                        <span className="font-semibold text-green-600">${producto.ingresos.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay ventas de productos registradas</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de ventas de productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Resumen de Ventas de Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-sm font-medium text-green-600 dark:text-green-300">Total Ingresos</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ${estadisticas.productos.totalIngresos.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Ventas</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {estadisticas.productos.totalVentas}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg col-span-2">
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-300">Unidades Vendidas</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {estadisticas.productos.totalCantidad}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ANÁLISIS DE PRODUCTOS: Bajo Stock, Categorías, Rotación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos con bajo stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
              Productos con Bajo Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estadisticas.productos.bajoStock.length > 0 ? (
                estadisticas.productos.bajoStock.slice(0, 5).map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <div className="text-xs font-medium text-foreground">{producto.nombre}</div>
                    <div className="text-xs font-bold text-orange-600">{producto.stock} unidades</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Todos los productos tienen stock suficiente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categorías más rentables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Categorías Más Rentables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estadisticas.productos.categoriasRentables.length > 0 ? (
                estadisticas.productos.categoriasRentables.slice(0, 5).map((cat, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-xs font-medium text-foreground">{cat.categoria}</div>
                    <div className="text-xs font-bold text-green-600">${cat.ingresos.toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rotación de inventario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Activity className="w-4 h-4 mr-2 text-blue-600" />
              Rotación de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estadisticas.productos.rotacion.length > 0 ? (
                estadisticas.productos.rotacion.slice(0, 5).map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-xs font-medium text-foreground">{producto.nombre}</div>
                    <div className="text-xs font-bold text-blue-600">{producto.rotacion.toFixed(2)}x</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MÉTRICAS DE RENDIMIENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupación por cancha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Ocupación por Cancha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.rendimiento.ocupacionPorCancha.length > 0 ? (
                estadisticas.rendimiento.ocupacionPorCancha.map((cancha, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium text-foreground">{cancha.cancha}</div>
                        <div className="text-sm text-muted-foreground">{cancha.ocupacion}% ({cancha.reservas} reservas)</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${cancha.ocupacion}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Horarios más rentables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Horarios Más Rentables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.rendimiento.horariosRentables.length > 0 ? (
                estadisticas.rendimiento.horariosRentables.map((horario, index) => {
                  const maxIngresos = estadisticas.rendimiento.horariosRentables[0]?.ingresos || 1
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-medium text-foreground">{horario.horario}</div>
                          <div className="text-sm font-semibold text-green-600">${horario.ingresos.toLocaleString()}</div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(horario.ingresos / maxIngresos) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{horario.reservas} reservas</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eficiencia de turnos fijos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Eficiencia de Turnos Fijos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">Turnos Recurrentes</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {estadisticas.rendimiento.eficienciaTurnosFijos.totalRecurrentes}
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <div className="text-sm font-medium text-green-600 dark:text-green-300 mb-1">Turnos Puntuales</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {estadisticas.rendimiento.eficienciaTurnosFijos.totalPuntuales}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-center">
              <div className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-1">% Recurrentes</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {estadisticas.rendimiento.eficienciaTurnosFijos.porcentajeRecurrentes}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DÍAS CON MÁS DEMANDA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Días específicos con más demanda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Días con Más Demanda
            </CardTitle>
            <CardDescription>
              Top 10 días del mes con más reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estadisticas.demanda.diasMasDemanda.length > 0 ? (
                estadisticas.demanda.diasMasDemanda.map((dia, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-foreground capitalize">{dia.diaSemana}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(dia.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-blue-600">{dia.reservas} reservas</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Días de la semana más populares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Días de la Semana Más Populares
            </CardTitle>
            <CardDescription>
              Distribución de reservas por día de la semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.demanda.diasSemanaPopulares.length > 0 ? (
                estadisticas.demanda.diasSemanaPopulares.map((dia, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium text-foreground capitalize">{dia.dia}</div>
                        <div className="text-sm text-muted-foreground">
                          {dia.reservas} reservas ({dia.porcentaje}%)
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${dia.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de usuarios */}
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
              <div className="text-3xl font-bold text-blue-600">{estadisticas.usuariosActivos}</div>
              <div className="text-sm text-muted-foreground mt-1">Usuarios Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{estadisticas.satisfaccion}/5</div>
              <div className="text-sm text-muted-foreground mt-1">Satisfacción</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{estadisticas.promedioReservasPorUsuario}</div>
              <div className="text-sm text-muted-foreground mt-1">Reservas por Usuario</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen Financiero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Recaudado</span>
              <span className="font-semibold text-green-600">${estadisticas.financiero.totalRecaudado.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
              <span className="font-semibold text-orange-600">${estadisticas.financiero.saldoPendiente.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Reservas</span>
              <span className="font-semibold">${estadisticas.financiero.totalReservas.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
