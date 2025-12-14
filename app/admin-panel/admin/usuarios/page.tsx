'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { ArrowLeft, Users, Star, Gift, TrendingUp, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { removeDuplicates } from '../../../../lib/utils/array-utils'

// Datos de usuarios frecuentes (movidos desde estadísticas)
const usuariosFrecuentes = [
  { nombre: 'Juan Pérez', email: 'juan@email.com', reservas: 24, frecuencia: 'Semanal', canchaPreferida: 'Cancha 1', ultimaReserva: '2024-01-15', descuento: 15, categoria: 'VIP' },
  { nombre: 'María García', email: 'maria@email.com', reservas: 18, frecuencia: 'Bi-semanal', canchaPreferida: 'Cancha 2', ultimaReserva: '2024-01-14', descuento: 10, categoria: 'Premium' },
  { nombre: 'Carlos López', email: 'carlos@email.com', reservas: 15, frecuencia: 'Semanal', canchaPreferida: 'Cancha 3', ultimaReserva: '2024-01-13', descuento: 10, categoria: 'Premium' },
  { nombre: 'Ana Martínez', email: 'ana@email.com', reservas: 12, frecuencia: 'Quincenal', canchaPreferida: 'Cancha 1', ultimaReserva: '2024-01-12', descuento: 5, categoria: 'Regular' },
  { nombre: 'Roberto Silva', email: 'roberto@email.com', reservas: 10, frecuencia: 'Mensual', canchaPreferida: 'Cancha 2', ultimaReserva: '2024-01-11', descuento: 5, categoria: 'Regular' }
]

// Datos de descuentos y promociones para usuarios
const programaDescuentos = [
  {
    categoria: 'VIP',
    requisitos: '20+ reservas mensuales',
    descuento: 15,
    beneficios: removeDuplicates(['Reserva prioritaria', 'Descuento 15%', 'Acceso a eventos exclusivos', 'Cancelación gratuita']),
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    usuarios: 3
  },
  {
    categoria: 'Premium',
    requisitos: '10-19 reservas mensuales',
    descuento: 10,
    beneficios: removeDuplicates(['Descuento 10%', 'Reserva con 48h anticipación', 'Promociones especiales']),
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    usuarios: 8
  },
  {
    categoria: 'Regular',
    requisitos: '5-9 reservas mensuales',
    descuento: 5,
    beneficios: removeDuplicates(['Descuento 5%', 'Newsletter con ofertas']),
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    usuarios: 15
  }
]

// Estadísticas de usuarios
const estadisticasUsuarios = {
  totalUsuarios: 342,
  usuariosActivos: 156,
  nuevosEstesMes: 23,
  retencion: 78
}

export default function UsuariosPage() {
  const router = useRouter()

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'VIP': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'Premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'Regular': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-light text-foreground mb-2">Gestión de Usuarios</h1>
          </div>
        </div>
        <div>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">Consulta y organiza usuarios por actividad y beneficios.</p>
          <p className="text-muted-foreground mt-1">Última actualización: {new Date().toLocaleString('es-ES')}</p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold text-foreground">{estadisticasUsuarios.totalUsuarios}</p>
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
                  <p className="text-2xl font-bold text-foreground">{estadisticasUsuarios.usuariosActivos}</p>
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
                  <p className="text-2xl font-bold text-foreground">{estadisticasUsuarios.nuevosEstesMes}</p>
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
                  <p className="text-2xl font-bold text-foreground">{estadisticasUsuarios.retencion}%</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Programa de descuentos */}
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
                <div key={index} className="border rounded-lg p-6 space-y-4 bg-card text-card-foreground">
                  <div className="flex items-center justify-between">
                    <Badge className={programa.color}>
                      {programa.categoria}
                    </Badge>
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

        {/* Usuarios frecuentes */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
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
                    {usuariosFrecuentes.map((usuario, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium text-foreground">{usuario.nombre}</td>
                      <td className="p-2 text-muted-foreground">{usuario.email}</td>
                      <td className="p-2">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full text-xs">
                          {usuario.reservas}
                        </span>
                      </td>
                      <td className="p-2">{usuario.frecuencia}</td>
                      <td className="p-2">{usuario.canchaPreferida}</td>
                      <td className="p-2 text-muted-foreground">{usuario.ultimaReserva}</td>
                      <td className="p-2">
                        <Badge className={getCategoriaColor(usuario.categoria)}>
                          {usuario.categoria}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <span className="font-medium text-green-600 dark:text-green-400">{usuario.descuento}%</span>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
