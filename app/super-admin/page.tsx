/**
 * Página principal del panel de Super Administrador
 * Permite gestionar tenants, credenciales de Mercado Pago y admins por tenant
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Building2, Plus, Edit, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
  subscriptionPlan: string | null
  subscriptionExpiresAt: string | null
  mercadoPagoEnabled: boolean
  mercadoPagoEnvironment: string | null
  createdAt: string
  updatedAt: string
  _count: {
    users: number
    courts: number
    bookings: number
  }
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tenants', { credentials: 'include' })
      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }
      const data = await res.json()
      if (data.success) {
        setTenants(data.data || [])
      } else {
        throw new Error(data.error || 'Error al cargar tenants')
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
      toast.error('Error al cargar tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tenantId: string) => {
    router.push(`/super-admin/tenants/${tenantId}`)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando tenants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Tenants
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Administra todos los tenants del sistema
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Tenant</span>
        </Button>
      </div>

      {/* Lista de Tenants */}
      <div className="grid gap-6">
        {tenants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No hay tenants registrados
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Crear primer tenant
              </Button>
            </CardContent>
          </Card>
        ) : (
          tenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tenant.name}</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Slug: {tenant.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {tenant.isActive ? (
                      <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Activo</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Inactivo</span>
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tenant.id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios</p>
                    <p className="text-lg font-semibold">{tenant._count.users}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Canchas</p>
                    <p className="text-lg font-semibold">{tenant._count.courts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reservas</p>
                    <p className="text-lg font-semibold">{tenant._count.bookings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mercado Pago</p>
                    <p className="text-lg font-semibold">
                      {tenant.mercadoPagoEnabled ? (
                        <span className="text-green-600 dark:text-green-400">Habilitado</span>
                      ) : (
                        <span className="text-gray-400">Deshabilitado</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de creación (simplificado - se puede expandir) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Crear Nuevo Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                El formulario completo de creación se encuentra en la página de edición.
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateModal(false)
                    router.push('/super-admin/tenants/new')
                  }}
                  className="flex-1"
                >
                  Ir al formulario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

