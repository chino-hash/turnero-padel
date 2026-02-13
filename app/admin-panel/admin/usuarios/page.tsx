'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Users, Star, Gift, TrendingUp, Calendar, RefreshCw, AlertCircle } from 'lucide-react'
import { useAnalisisUsuarios } from '../../../../hooks/useAnalisisUsuarios'
import { removeDuplicates } from '../../../../lib/utils/array-utils'

export default function UsuariosPage() {
  const { analisis, loading, error, refetch } = useAnalisisUsuarios()

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'Premium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'Regular':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Cargando análisis de usuarios...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <span>Error al cargar datos: {error}</span>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!analisis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span>No hay datos disponibles</span>
      </div>
    )
  }

  const programaDescuentos = [
    {
      categoria: 'VIP',
      requisitos: '20+ reservas totales',
      descuento: 15,
      beneficios: removeDuplicates([
        'Reserva prioritaria',
        'Descuento 15%',
        'Acceso a eventos exclusivos',
        'Cancelación gratuita',
      ]),
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      usuarios: analisis.distribucionCategorias.VIP,
    },
    {
      categoria: 'Premium',
      requisitos: '10-19 reservas totales',
      descuento: 10,
      beneficios: removeDuplicates([
        'Descuento 10%',
        'Reserva con 48h anticipación',
        'Promociones especiales',
      ]),
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      usuarios: analisis.distribucionCategorias.Premium,
    },
    {
      categoria: 'Regular',
      requisitos: 'Menos de 10 reservas totales',
      descuento: 5,
      beneficios: removeDuplicates(['Descuento 5%', 'Newsletter con ofertas']),
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      usuarios: analisis.distribucionCategorias.Regular,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Gestión de Usuarios</h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">
            Consulta y organiza usuarios por actividad y beneficios.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={refetch}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold text-foreground">{analisis.metricas.totalUsuarios}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-foreground">{analisis.metricas.usuariosActivos}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nuevos Este Mes</p>
                  <p className="text-2xl font-bold text-foreground">{analisis.metricas.nuevosEsteMes}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Retención</p>
                  <p className="text-2xl font-bold text-foreground">{analisis.metricas.retencion}%</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Nuevos vs Recurrentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">
                    Nuevos (últimos 30 días)
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {analisis.clientesNuevosVsRecurrentes.nuevos}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-sm font-medium text-green-600 dark:text-green-300 mb-1">Recurrentes</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {analisis.clientesNuevosVsRecurrentes.recurrentes}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valor Promedio por Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-center">
                <div className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">
                  Ingresos promedio
                </div>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  ${analisis.valorPromedioPorCliente.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Por cliente este mes</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Programa de Descuentos para Usuarios Regulares</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {programaDescuentos.map((programa, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-6 space-y-4 bg-card text-card-foreground"
                >
                  <div className="flex items-center justify-between">
                    <Badge className={programa.color}>{programa.categoria}</Badge>
                    <span className="text-2xl font-bold text-foreground">{programa.descuento}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Requisitos:</p>
                    <p className="text-sm text-muted-foreground">{programa.requisitos}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Beneficios:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {programa.beneficios.map((beneficio, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                          <span>{beneficio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{programa.usuarios}</span> usuarios en esta categoría
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            {analisis.clientesMasFrecuentes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-muted-foreground">Usuario</th>
                      <th className="text-left p-2 text-muted-foreground">Email</th>
                      <th className="text-left p-2 text-muted-foreground">Reservas</th>
                      <th className="text-left p-2 text-muted-foreground">Frecuencia</th>
                      <th className="text-left p-2 text-muted-foreground">Cancha Preferida</th>
                      <th className="text-left p-2 text-muted-foreground">Última Reserva</th>
                      <th className="text-left p-2 text-muted-foreground">Categoría</th>
                      <th className="text-left p-2 text-muted-foreground">Descuento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.clientesMasFrecuentes.map((usuario, index) => (
                      <tr key={usuario.id || index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium text-foreground">{usuario.nombre}</td>
                        <td className="p-2 text-muted-foreground">{usuario.email}</td>
                        <td className="p-2">
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full text-xs">
                            {usuario.reservas}
                          </span>
                        </td>
                        <td className="p-2">{usuario.frecuencia}</td>
                        <td className="p-2">{usuario.canchaPreferida}</td>
                        <td className="p-2 text-muted-foreground">
                          {usuario.ultimaReserva
                            ? new Date(usuario.ultimaReserva).toLocaleDateString('es-ES')
                            : 'N/A'}
                        </td>
                        <td className="p-2">
                          <Badge className={getCategoriaColor(usuario.categoria)}>{usuario.categoria}</Badge>
                        </td>
                        <td className="p-2">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {usuario.descuento}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay usuarios frecuentes registrados
              </p>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
