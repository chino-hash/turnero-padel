'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Clock } from 'lucide-react'

export default function EstadisticasPage() {
  // Datos simulados para las estadísticas
  const estadisticas = {
    reservasHoy: 12,
    reservasSemana: 85,
    ingresosMes: 15420,
    ocupacionPromedio: 78,
    usuariosActivos: 156,
    canchasMasUsadas: [
      { nombre: 'Cancha 1', reservas: 45, porcentaje: 85 },
      { nombre: 'Cancha 2', reservas: 38, porcentaje: 72 },
      { nombre: 'Cancha 3', reservas: 32, porcentaje: 61 }
    ],
    horariosPico: [
      { hora: '18:00-19:00', reservas: 28 },
      { hora: '19:00-20:00', reservas: 32 },
      { hora: '20:00-21:00', reservas: 35 },
      { hora: '21:00-22:00', reservas: 25 }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600 mt-1">Análisis de ocupación y rendimiento del complejo</p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                <p className="text-2xl font-semibold text-gray-900">{estadisticas.reservasHoy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reservas Semana</p>
                <p className="text-2xl font-semibold text-gray-900">{estadisticas.reservasSemana}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Mes</p>
                <p className="text-2xl font-semibold text-gray-900">${estadisticas.ingresosMes.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">{estadisticas.ocupacionPromedio}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {estadisticas.canchasMasUsadas.map((cancha, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-medium text-gray-900">{cancha.nombre}</div>
                      <div className="text-sm text-gray-600">{cancha.reservas} reservas</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${cancha.porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
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
              {estadisticas.horariosPico.map((horario, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-medium text-gray-900">{horario.hora}</div>
                      <div className="text-sm text-gray-600">{horario.reservas} reservas</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(horario.reservas / 35) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
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
              <div className="text-sm text-gray-600 mt-1">Usuarios Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">89%</div>
              <div className="text-sm text-gray-600 mt-1">Satisfacción</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">2.3</div>
              <div className="text-sm text-gray-600 mt-1">Reservas por Usuario</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}