/**
 * Página de gestión de productos del panel de administración
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog'
import { Badge } from '../../../../components/ui/badge'
import { ArrowLeft, Plus, Edit2, Trash2, Package, DollarSign, Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAppState } from '@/components/providers/AppStateProvider'

interface Producto {
  id: number
  nombre: string
  precio: number
  stock: number
  categoria: string
  activo: boolean
}

export default function ProductosPage() {
  const router = useRouter()
  const { isDarkMode } = useAppState()
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null)

  const categorias = ['Todas', 'Alquiler', 'Pelotas', 'Toallas', 'Bebidas', 'Snacks', 'Otros']

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = filtroCategoria === 'Todas' || producto.categoria === filtroCategoria
    return coincideBusqueda && coincideCategoria
  })

  const handleEditarProducto = (producto: Producto) => {
    setProductoEditando(producto)
    setModalAbierto(true)
  }

  const handleNuevoProducto = () => {
    const nuevoProducto: Producto = {
      id: Date.now(),
      nombre: '',
      precio: 0,
      stock: 0,
      categoria: 'Bebidas',
      activo: true
    }
    setProductoEditando(nuevoProducto)
    setModalAbierto(true)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      setCargando(true)
      const response = await fetch('/api/productos')
      const data = await response.json()
      
      if (data.success) {
        setProductos(data.data)
      } else {
        toast.error('Error al cargar productos')
        // Fallback a datos mock si la API falla - Sincronizado con modal de extras de AdminTurnos
        setProductos([
          // PRODUCTOS PRINCIPALES DEL MODAL DE EXTRAS
          // Alquiler de Raqueta
          { id: 1, nombre: 'Alquiler de Raqueta', precio: 15000, stock: 10, categoria: 'Alquiler', activo: true },
          { id: 2, nombre: 'Alquiler de Raqueta Premium', precio: 20000, stock: 5, categoria: 'Alquiler', activo: true },
          
          // Pelotas
          { id: 3, nombre: 'Pelota de Pádel', precio: 5000, stock: 50, categoria: 'Pelotas', activo: true },
          { id: 4, nombre: 'Pelotas x2', precio: 9000, stock: 30, categoria: 'Pelotas', activo: true },
          { id: 5, nombre: 'Pelotas x3', precio: 13000, stock: 25, categoria: 'Pelotas', activo: true },
          
          // Toallas
          { id: 6, nombre: 'Toalla', precio: 8000, stock: 20, categoria: 'Toallas', activo: true },
          { id: 7, nombre: 'Toalla Premium', precio: 12000, stock: 15, categoria: 'Toallas', activo: true },
          
          // Bebidas
          { id: 8, nombre: 'Bebida', precio: 3000, stock: 40, categoria: 'Bebidas', activo: true },
          { id: 9, nombre: 'Agua Mineral', precio: 2000, stock: 50, categoria: 'Bebidas', activo: true },
          { id: 10, nombre: 'Gatorade', precio: 4000, stock: 30, categoria: 'Bebidas', activo: true },
          { id: 11, nombre: 'Coca Cola', precio: 3500, stock: 35, categoria: 'Bebidas', activo: true },
          { id: 12, nombre: 'Cerveza', precio: 5000, stock: 25, categoria: 'Bebidas', activo: true },
          
          // Snacks
          { id: 13, nombre: 'Snack', precio: 4000, stock: 30, categoria: 'Snacks', activo: true },
          { id: 14, nombre: 'Barrita Energética', precio: 3500, stock: 40, categoria: 'Snacks', activo: true },
          { id: 15, nombre: 'Frutos Secos', precio: 4500, stock: 25, categoria: 'Snacks', activo: true },
          { id: 16, nombre: 'Sandwich', precio: 8000, stock: 15, categoria: 'Snacks', activo: true },
          
          // Otros productos adicionales
          { id: 17, nombre: 'Otro', precio: 5000, stock: 20, categoria: 'Otros', activo: true },
          { id: 18, nombre: 'Grip Antideslizante', precio: 6000, stock: 30, categoria: 'Otros', activo: true },
          { id: 19, nombre: 'Protector de Paletas', precio: 10000, stock: 20, categoria: 'Otros', activo: true },
          { id: 20, nombre: 'Muñequeras', precio: 7000, stock: 25, categoria: 'Otros', activo: true }
        ])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
      toast.error('Error de conexión al cargar productos')
    } finally {
      setCargando(false)
    }
  }

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const productoData = {
      nombre: formData.get('nombre') as string,
      precio: Number(formData.get('precio')),
      stock: Number(formData.get('stock')),
      categoria: formData.get('categoria') as string,
      activo: formData.get('activo') === 'on'
    }

    try {
      let response
      
      // Si el producto ya existe, actualizar
      if (productoEditando && productos.find(p => p.id === productoEditando.id)) {
        // Actualizar producto existente
        response = await fetch('/api/productos', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: productoEditando.id,
            ...productoData
          })
        })
      } else {
        // Crear nuevo producto
        response = await fetch('/api/productos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productoData)
        })
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success(productoEditando && productos.find(p => p.id === productoEditando.id) 
          ? 'Producto actualizado correctamente' 
          : 'Producto creado correctamente')
        setModalAbierto(false)
        setProductoEditando(null)
        // Recargar productos para mostrar los cambios
        await cargarProductos()
      } else {
        toast.error(data.error || 'Error al guardar producto')
      }
    } catch (error) {
      console.error('Error al guardar producto:', error)
      toast.error('Error de conexión al guardar producto')
    }
  }

  const handleEliminarProducto = (producto: Producto) => {
    setProductoAEliminar(producto)
    setModalEliminar(true)
  }

  const confirmarEliminar = async () => {
    if (productoAEliminar) {
      try {
        const response = await fetch(`/api/productos?id=${productoAEliminar.id}`, {
          method: 'DELETE'
        })

        const data = await response.json()
        
        if (data.success) {
          toast.success('Producto eliminado correctamente')
          setModalEliminar(false)
          setProductoAEliminar(null)
          // Recargar productos para mostrar los cambios
          await cargarProductos()
        } else {
          toast.error(data.error || 'Error al eliminar producto')
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error)
        toast.error('Error de conexión al eliminar producto')
      }
    }
  }

  const toggleActivoProducto = async (producto: Producto) => {
    try {
      const response = await fetch('/api/productos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          stock: producto.stock,
          categoria: producto.categoria,
          activo: !producto.activo
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Producto ${!producto.activo ? 'activado' : 'desactivado'} correctamente`)
        // Recargar productos para mostrar los cambios
        await cargarProductos()
      } else {
        toast.error(data.error || 'Error al actualizar producto')
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      toast.error('Error de conexión al actualizar producto')
    }
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Bebidas': return 'bg-cyan-100 text-cyan-800'
      case 'Accesorios': return 'bg-purple-100 text-purple-800'
      case 'Equipamiento': return 'bg-blue-100 text-blue-800'
      case 'Consumibles': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600'
    if (stock <= 5) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin-panel')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Panel</span>
              </Button>
            </div>
            <Button onClick={handleNuevoProducto} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </Button>
          </div>
          <div className="mt-6">
            <h1 className="text-3xl font-light text-gray-900 mb-2">Gestión de Productos</h1>
            <div className="w-16 h-0.5 bg-orange-500"></div>
            <p className="text-gray-600 mt-2">
              Última actualización: {new Date().toLocaleString('es-ES')}
            </p>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="busqueda">Buscar productos</Label>
                <Input
                  id="busqueda"
                  placeholder="Buscar por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="categoria">Filtrar por categoría</Label>
                <select
                  id="categoria"
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900 break-words overflow-hidden text-ellipsis">{productos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Archive className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">Productos Activos</p>
                  <p className="text-2xl font-bold text-gray-900 break-words overflow-hidden text-ellipsis">{productos.filter(p => p.activo).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Package className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-gray-900 break-words overflow-hidden text-ellipsis">{productos.filter(p => p.stock <= 5 && p.stock > 0).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900 break-words overflow-hidden text-ellipsis">
                    ${productos.reduce((total, p) => total + (p.precio * p.stock), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos ({productosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">Cargando productos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productosFiltrados.map((producto) => (
                  <div key={producto.id} className={`rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 ${!producto.activo ? 'opacity-60' : ''} ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-2">{producto.nombre}</h3>
                          <Badge className={getCategoriaColor(producto.categoria)}>
                            {producto.categoria}
                          </Badge>
                        </div>
                        <Badge className={producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Precio:</span>
                          <span className="font-semibold text-lg">${producto.precio.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Stock:</span>
                          <span className={`font-medium ${getStockColor(producto.stock)}`}>
                            {producto.stock} unidades
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditarProducto(producto)}
                          className="p-2"
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActivoProducto(producto)}
                          className="p-2"
                          title={producto.activo ? 'Desactivar producto' : 'Activar producto'}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEliminarProducto(producto)}
                          className="p-2 text-red-600 hover:text-red-700"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {productosFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron productos</p>
                    <Button onClick={handleNuevoProducto} className="mt-4">
                      Agregar primer producto
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de edición/creación */}
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {productoEditando && productos.find(p => p.id === productoEditando.id) 
                  ? 'Editar Producto' 
                  : 'Nuevo Producto'
                }
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGuardarProducto} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del producto</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Pelotas de Pádel"
                  required
                  defaultValue={productoEditando?.nombre || ''}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio ($)</Label>
                  <Input
                    id="precio"
                    name="precio"
                    type="number"
                    min="0"
                    step="100"
                    required
                    defaultValue={productoEditando?.precio || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    required
                    defaultValue={productoEditando?.stock || ''}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <select
                  id="categoria"
                  name="categoria"
                  required
                  defaultValue={productoEditando?.categoria || 'Bebidas'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Bebidas">Bebidas</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Equipamiento">Equipamiento</option>
                  <option value="Consumibles">Consumibles</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  defaultChecked={productoEditando?.activo ?? true}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <Label htmlFor="activo">Producto activo</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {productoEditando && productos.find(p => p.id === productoEditando.id) 
                    ? 'Actualizar' 
                    : 'Crear'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmación de eliminación */}
        <Dialog open={modalEliminar} onOpenChange={setModalEliminar}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el producto <strong>{productoAEliminar?.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setModalEliminar(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarEliminar}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}