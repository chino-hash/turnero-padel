/**
 * Página de historial de ventas del panel de administración
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Badge } from '../../../../components/ui/badge'
import { ShoppingCart, DollarSign, Package, Calendar, Filter, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAppState } from '@/components/providers/AppStateProvider'

interface Venta {
  id: string
  createdAt: string
  quantity: number
  unitPrice: number
  totalPrice: number
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER'
  notes: string | null
  producto: {
    id: number
    nombre: string
    categoria: string
  }
  processedBy: {
    id: string
    name: string | null
    email: string
  } | null
}

interface VentasResponse {
  success: boolean
  data: Venta[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    totalVentas: number
    totalCantidad: number
    totalIngresos: number
  }
}

export default function VentasPage() {
  const router = useRouter()
  const { isDarkMode } = useAppState()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [stats, setStats] = useState({
    totalVentas: 0,
    totalCantidad: 0,
    totalIngresos: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Filtros
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string }>>([])

  useEffect(() => {
    cargarProductos()
    cargarVentas()
  }, [])

  useEffect(() => {
    cargarVentas()
  }, [pagination.page, filtroProducto, filtroMetodoPago, filtroFechaInicio, filtroFechaFin])

  const cargarProductos = async () => {
    try {
      const response = await fetch('/api/productos')
      const data = await response.json()
      if (data.success) {
        setProductos(data.data.map((p: any) => ({ id: p.id, nombre: p.nombre })))
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

  const cargarVentas = async () => {
    try {
      setCargando(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filtroProducto) {
        params.append('productoId', filtroProducto)
      }
      if (filtroMetodoPago) {
        params.append('paymentMethod', filtroMetodoPago)
      }
      if (filtroFechaInicio) {
        params.append('startDate', filtroFechaInicio)
      }
      if (filtroFechaFin) {
        params.append('endDate', filtroFechaFin)
      }

      const response = await fetch(`/api/ventas?${params.toString()}`)
      const data: VentasResponse = await response.json()

      if (data.success) {
        setVentas(data.data)
        setStats(data.stats)
        setPagination(data.pagination)
      } else {
        toast.error('Error al cargar ventas')
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      toast.error('Error de conexión al cargar ventas')
    } finally {
      setCargando(false)
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo'
      case 'CARD':
        return 'Tarjeta'
      case 'BANK_TRANSFER':
        return 'Transferencia'
      default:
        return method
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'CARD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'BANK_TRANSFER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const limpiarFiltros = () => {
    setFiltroProducto('')
    setFiltroMetodoPago('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const exportarCSV = () => {
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Precio Unitario', 'Total', 'Método de Pago', 'Procesado por', 'Notas']
    const rows = ventas.map(v => [
      new Date(v.createdAt).toLocaleString('es-AR'),
      v.producto.nombre,
      v.quantity.toString(),
      `$${v.unitPrice.toLocaleString()}`,
      `$${v.totalPrice.toLocaleString()}`,
      getPaymentMethodLabel(v.paymentMethod),
      v.processedBy?.name || v.processedBy?.email || 'N/A',
      v.notes || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-foreground mb-2">Historial de Ventas</h1>
              <div className="w-16 h-0.5 bg-orange-500"></div>
              <p className="text-muted-foreground text-xs mt-2">Consulta y gestiona todas las ventas directas de productos.</p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalVentas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
                  <Package className="w-6 h-6 text-green-600 dark:text-green-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Productos Vendidos</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCantidad}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${stats.totalIngresos.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Promedio por Venta</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${stats.totalVentas > 0 ? (stats.totalIngresos / stats.totalVentas).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                  Limpiar
                </Button>
                <Button variant="outline" size="sm" onClick={exportarCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filtro-producto">Producto</Label>
                <select
                  id="filtro-producto"
                  value={filtroProducto}
                  onChange={(e) => {
                    setFiltroProducto(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-background dark:text-foreground"
                >
                  <option value="">Todos los productos</option>
                  {productos.map(producto => (
                    <option key={producto.id} value={producto.id.toString()}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filtro-metodo">Método de Pago</Label>
                <select
                  id="filtro-metodo"
                  value={filtroMetodoPago}
                  onChange={(e) => {
                    setFiltroMetodoPago(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-background dark:text-foreground"
                >
                  <option value="">Todos los métodos</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="BANK_TRANSFER">Transferencia</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filtro-fecha-inicio">Fecha Inicio</Label>
                <Input
                  id="filtro-fecha-inicio"
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => {
                    setFiltroFechaInicio(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filtro-fecha-fin">Fecha Fin</Label>
                <Input
                  id="filtro-fecha-fin"
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => {
                    setFiltroFechaFin(e.target.value)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ventas */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-muted-foreground">Cargando ventas...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Procesado por</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell>
                          {new Date(venta.createdAt).toLocaleString('es-AR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {venta.producto.nombre}
                          <Badge className="ml-2" variant="outline">
                            {venta.producto.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>{venta.quantity}</TableCell>
                        <TableCell>${venta.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="font-bold">${venta.totalPrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentMethodColor(venta.paymentMethod)}>
                            {getPaymentMethodLabel(venta.paymentMethod)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {venta.processedBy?.name || venta.processedBy?.email || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {venta.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {ventas.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron ventas</p>
                  </div>
                )}

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} ventas
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}










