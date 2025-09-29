'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { ArrowLeft, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Componente simple de estadísticas sin gráficos por ahora
const SimpleChart = ({ data, title }: { data: any[], title: string }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <h4 className="font-medium mb-2">{title}</h4>
    <div className="text-sm text-gray-600">
      Gráfico temporalmente deshabilitado para el build de producción
    </div>
  </div>
)

// Datos de ejemplo para las estadísticas
const ocupacionPorHorario = [
  { hora: '08:00', ocupacion: 45, ingresos: 27000 },
  { hora: '09:00', ocupacion: 60, ingresos: 36000 },
  { hora: '10:00', ocupacion: 75, ingresos: 45000 },
  { hora: '11:00', ocupacion: 85, ingresos: 51000 },
  { hora: '12:00', ocupacion: 90, ingresos: 54000 },
  { hora: '13:00', ocupacion: 70, ingresos: 42000 },
  { hora: '14:00', ocupacion: 55, ingresos: 33000 },
  { hora: '15:00', ocupacion: 80, ingresos: 48000 },
  { hora: '16:00', ocupacion: 95, ingresos: 57000 },
  { hora: '17:00', ocupacion: 100, ingresos: 60000 },
  { hora: '18:00', ocupacion: 100, ingresos: 60000 },
  { hora: '19:00', ocupacion: 95, ingresos: 57000 },
  { hora: '20:00', ocupacion: 85, ingresos: 51000 },
  { hora: '21:00', ocupacion: 70, ingresos: 42000 },
  { hora: '22:00', ocupacion: 40, ingresos: 24000 }
]



const promocionesEfectivas = [
  { nombre: 'Descuento Matutino', conversion: 85, reservasGeneradas: 156, ingresosPerdidos: 23400, ingresosGenerados: 93600 },
  { nombre: 'Pack Familiar', conversion: 72, reservasGeneradas: 89, ingresosPerdidos: 17800, ingresosGenerados: 53400 },
  { nombre: 'Happy Hour', conversion: 68, reservasGeneradas: 134, ingresosPerdidos: 20100, ingresosGenerados: 80400 },
  { nombre: 'Estudiantes', conversion: 45, reservasGeneradas: 67, ingresosPerdidos: 13400, ingresosGenerados: 40200 }
]

const distribucionCanchas = [
  { name: 'Cancha 1', value: 35, color: '#8b5cf6' },
  { name: 'Cancha 2', value: 40, color: '#ef4444' },
  { name: 'Cancha 3', value: 25, color: '#008000' }
]

const COLORS = ['#8b5cf6', '#ef4444', '#008000', '#f59e0b']

export default function EstadisticasPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/admin-panel')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Análisis y Estadísticas</h1>
          </div>
          <div className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleString('es-ES')}
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">78%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">342</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">45</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">$270,000</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ocupación por horario */}
          <Card>
            <CardHeader>
              <CardTitle>Ocupación por Horario</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart data={ocupacionPorHorario} title="Gráfico de Ocupación" />
            </CardContent>
          </Card>

          {/* Distribución por canchas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Reservas por Cancha</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart data={distribucionCanchas} title="Gráfico de Distribución" />
            </CardContent>
          </Card>
        </div>



        {/* Promociones efectivas */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Promociones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {promocionesEfectivas.map((promo, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">{promo.nombre}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conversión:</span>
                      <span className="font-medium text-green-600">{promo.conversion}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reservas:</span>
                      <span className="font-medium">{promo.reservasGeneradas}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ingresos:</span>
                      <span className="font-medium text-green-600">${promo.ingresosGenerados.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-red-600">-${promo.ingresosPerdidos.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ingresos por horario */}
         <Card>
           <CardHeader>
             <CardTitle>Ingresos por Horario</CardTitle>
           </CardHeader>
           <CardContent>
             <SimpleChart data={ocupacionPorHorario} title="Gráfico de Ingresos" />
           </CardContent>
         </Card>

        {/* Resumen Financiero */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Recaudado</p>
                    <p className="text-3xl font-bold text-green-700">$1,250,000</p>
                    <p className="text-sm text-green-600 mt-1">Este mes</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Saldo Pendiente</p>
                    <p className="text-3xl font-bold text-yellow-700">$85,000</p>
                    <p className="text-sm text-yellow-600 mt-1">Por cobrar</p>
                  </div>
                  <Calendar className="h-12 w-12 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Reserva</p>
                    <p className="text-3xl font-bold text-blue-700">$320,000</p>
                    <p className="text-sm text-blue-600 mt-1">Próximo mes</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}