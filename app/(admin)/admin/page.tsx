/**
 * ✅ ÁREA DE ADMINISTRACIÓN - MODIFICACIONES PERMITIDAS
 * 
 * Este archivo es parte del panel de administración y puede ser modificado
 * según las necesidades del negocio. Cambios permitidos incluyen:
 * - Nuevas funcionalidades administrativas
 * - Mejoras en la interfaz de administración
 * - Integración de nuevos módulos de gestión
 * - Optimizaciones de rendimiento
 * 
 * Última actualización: 2024-12-19
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AdminTurnos from '@/components/AdminTurnos'
import { RealTimeDemo } from '@/components/admin/RealTimeDemo'
import { useRouter } from 'next/navigation'
import { BarChart3, Users, DollarSign } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  
  return (
    <div className="space-y-8">
      {/* Resumen del dashboard */}
      <section aria-labelledby="dashboard-overview" className="mb-8">
        <h2 id="dashboard-overview" className="text-2xl font-semibold text-gray-900 mb-4">
          Resumen del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                <p className="text-2xl font-semibold text-gray-900">$48.000</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-semibold text-gray-900">24</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección principal de gestión */}
      <section aria-labelledby="turnos-management" className="mb-8">
        <h2 id="turnos-management" className="text-2xl font-semibold text-gray-900 mb-4">
          Gestión de Turnos
        </h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AdminTurnos />
        </div>
      </section>

      {/* Sección de acciones rápidas */}
      <section aria-labelledby="quick-actions" className="mb-8">
        <h2 id="quick-actions" className="text-2xl font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Administrar usuarios, roles y permisos del sistema
              </p>
              <Button 
                onClick={() => router.push('/admin/usuarios')}
                className="w-full"
                variant="outline"
              >
                Ver Usuarios
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Ver reportes detallados y análisis de rendimiento
              </p>
              <Button 
                onClick={() => router.push('/admin/estadisticas')}
                className="w-full"
                variant="outline"
              >
                Ver Estadísticas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gestionar productos y servicios adicionales
              </p>
              <Button 
                onClick={() => router.push('/admin/productos')}
                className="w-full"
                variant="outline"
              >
                Ver Productos
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  )
}
