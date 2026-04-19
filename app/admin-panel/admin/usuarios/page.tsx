'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Users, Star, TrendingUp, Calendar, RefreshCw, AlertCircle, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAnalisisUsuarios } from '../../../../hooks/useAnalisisUsuarios'
import { useUsuariosList, type UsuarioListItem } from '../../../../hooks/useUsuariosList'
import { setAdminContextTenant, getAdminContextTenant } from '../../../../lib/utils/admin-context-tenant'

export default function UsuariosPage() {
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

  const { analisis, loading, error, refetch } = useAnalisisUsuarios({ tenantId: tenantIdFromUrl, tenantSlug: tenantSlugFromUrl })

  const [listPage, setListPage] = useState(1)
  const [listLimit] = useState(10)
  const [listSortBy, setListSortBy] = useState('createdAt')
  const [listSortOrder, setListSortOrder] = useState<'asc' | 'desc'>('desc')
  const [listQ, setListQ] = useState('')
  const [listQDebounced, setListQDebounced] = useState('')
  const [listActividad, setListActividad] = useState<string>('')

  useEffect(() => {
    const t = setTimeout(() => setListQDebounced(listQ), 300)
    return () => clearTimeout(t)
  }, [listQ])

  const listParams = {
    page: listPage,
    limit: listLimit,
    sortBy: listSortBy,
    sortOrder: listSortOrder,
    q: listQDebounced || undefined,
    actividad: listActividad ? (listActividad as 'activos' | 'inactivos' | 'nuevos') : undefined,
    tenantId: tenantIdFromUrl,
    tenantSlug: tenantSlugFromUrl,
  }

  const { data: usuariosList, meta: usuariosMeta, loading: listLoading, error: listError, refetch: refetchList } = useUsuariosList(listParams)

  const toggleSort = useCallback((by: string) => {
    setListSortBy(by)
    setListSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    setListPage(1)
  }, [])

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
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando análisis de clientes...</span>
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

  return (
    <div className="space-y-8">
      <div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-foreground mb-2">Análisis de Clientes</h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">
            Registro de clientes, actividad y comportamiento de reservas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => {
              refetch()
              refetchList()
            }}
            variant="outline"
            disabled={loading || listLoading}
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || listLoading) ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{analisis.metricas.totalUsuarios}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{analisis.metricas.usuariosActivos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos Este Mes</CardTitle>
            <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{analisis.metricas.nuevosEsteMes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retención</CardTitle>
            <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{analisis.metricas.retencion}%</p>
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
          <CardTitle>Listado de clientes</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Búsqueda, filtros y paginación.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={listQ}
                  onChange={(e) => { setListQ(e.target.value); setListPage(1) }}
                  className="pl-9"
                />
              </div>
              <Select value={listActividad || 'all'} onValueChange={(v) => { setListActividad(v === 'all' ? '' : v); setListPage(1) }}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="activos">Activos</SelectItem>
                  <SelectItem value="inactivos">Inactivos</SelectItem>
                  <SelectItem value="nuevos">Nuevos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Cargando listado...
              </div>
            ) : listError ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <p className="text-sm text-destructive">{listError}</p>
                <Button onClick={refetchList} variant="outline" size="sm">
                  Reintentar
                </Button>
              </div>
            ) : !usuariosList.length ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No hay clientes que coincidan con los filtros.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">
                          <button type="button" className="font-medium hover:underline" onClick={() => toggleSort('name')}>
                            Nombre
                          </button>
                        </th>
                        <th className="text-left p-3">
                          <button type="button" className="font-medium hover:underline" onClick={() => toggleSort('email')}>
                            Email
                          </button>
                        </th>
                        <th className="text-left p-3 text-muted-foreground">Categoría</th>
                        <th className="text-left p-3">
                          <button type="button" className="font-medium hover:underline" onClick={() => toggleSort('reservas')}>
                            Reservas
                          </button>
                        </th>
                        <th className="text-left p-3">
                          <button type="button" className="font-medium hover:underline" onClick={() => toggleSort('ultimaReserva')}>
                            Última reserva
                          </button>
                        </th>
                        <th className="text-left p-3 text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosList.map((u: UsuarioListItem) => (
                        <tr key={u.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{u.name || u.fullName || u.email || '—'}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3">
                            <Badge className={getCategoriaColor(u.categoria)}>{u.categoria}</Badge>
                          </td>
                          <td className="p-3">{u.reservas}</td>
                          <td className="p-3 text-muted-foreground">
                            {u.ultimaReserva ? new Date(u.ultimaReserva).toLocaleDateString('es-ES') : 'Nunca'}
                          </td>
                          <td className="p-3">
                            {u.isActive ? (
                              <span className="text-green-600 dark:text-green-400">Activo</span>
                            ) : (
                              <span className="text-muted-foreground">Inactivo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {usuariosMeta && usuariosMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Página {usuariosMeta.page} de {usuariosMeta.totalPages} ({usuariosMeta.total} clientes)
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={listPage <= 1}
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={listPage >= usuariosMeta.totalPages}
                        onClick={() => setListPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          {analisis.clientesMasFrecuentes.length > 0 ? (
            <>
              <div className="block md:hidden space-y-4">
                {analisis.clientesMasFrecuentes.map((cliente, index) => (
                  <div
                    key={cliente.id || index}
                    className="border rounded-lg p-4 space-y-2 bg-card text-card-foreground"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">{cliente.nombre}</p>
                      <Badge className={getCategoriaColor(cliente.categoria)}>{cliente.categoria}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">{cliente.email}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full">
                        {cliente.reservas} reservas
                      </span>
                      <span className="text-muted-foreground">{cliente.frecuencia}</span>
                      {cliente.canchaPreferida && (
                        <span className="text-muted-foreground">· {cliente.canchaPreferida}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Última: {cliente.ultimaReserva ? new Date(cliente.ultimaReserva).toLocaleDateString('es-ES') : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-muted-foreground">Cliente</th>
                      <th className="text-left p-2 text-muted-foreground">Email</th>
                      <th className="text-left p-2 text-muted-foreground">Reservas</th>
                      <th className="text-left p-2 text-muted-foreground">Frecuencia</th>
                      <th className="text-left p-2 text-muted-foreground">Cancha Preferida</th>
                      <th className="text-left p-2 text-muted-foreground">Última Reserva</th>
                      <th className="text-left p-2 text-muted-foreground">Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.clientesMasFrecuentes.map((cliente, index) => (
                      <tr key={cliente.id || index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium text-foreground">{cliente.nombre}</td>
                        <td className="p-2 text-muted-foreground">{cliente.email}</td>
                        <td className="p-2">
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full text-xs">
                            {cliente.reservas}
                          </span>
                        </td>
                        <td className="p-2">{cliente.frecuencia}</td>
                        <td className="p-2">{cliente.canchaPreferida}</td>
                        <td className="p-2 text-muted-foreground">
                          {cliente.ultimaReserva ? new Date(cliente.ultimaReserva).toLocaleDateString('es-ES') : 'N/A'}
                        </td>
                        <td className="p-2">
                          <Badge className={getCategoriaColor(cliente.categoria)}>{cliente.categoria}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay clientes frecuentes registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
