/**
 * Página de gestión de productos del panel de administración
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog'
import { Badge } from '../../../../components/ui/badge'
import { ArrowLeft, Plus, Edit2, Trash2, Package, DollarSign, Archive, ShoppingCart } from 'lucide-react'
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
  const [modalVenta, setModalVenta] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null)

  // Estados para el volumen de bebidas
  const [volumen, setVolumen] = useState('')
  const [unidadVolumen, setUnidadVolumen] = useState('ml')
  const [categoriaFormulario, setCategoriaFormulario] = useState('')

  // Estados para venta
  const [productoVenta, setProductoVenta] = useState<number | null>(null)
  const [cantidadVenta, setCantidadVenta] = useState(1)
  const [metodoPago, setMetodoPago] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH')
  const [notasVenta, setNotasVenta] = useState('')
  const [procesandoVenta, setProcesandoVenta] = useState(false)
  const [busquedaVenta, setBusquedaVenta] = useState('')
  const [mostrarListaProductos, setMostrarListaProductos] = useState(false)

  const categorias = ['Todas', 'Alquiler', 'Pelotas', 'Toallas', 'Bebidas', 'Snacks', 'Otros']

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = filtroCategoria === 'Todas' || producto.categoria === filtroCategoria
    return coincideBusqueda && coincideCategoria
  })

  // Productos disponibles para venta (activos y con stock)
  const productosDisponibles = productos.filter(p => p.activo && p.stock > 0)

  // Productos filtrados por búsqueda en modal de venta
  const productosFiltradosVenta = productosDisponibles.filter(p =>
    p.nombre.toLowerCase().includes(busquedaVenta.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busquedaVenta.toLowerCase())
  )

  // Producto seleccionado para venta
  const productoSeleccionado = productos.find(p => p.id === productoVenta)
  const precioTotal = productoSeleccionado ? productoSeleccionado.precio * cantidadVenta : 0

  const handleEditarProducto = (producto: Producto) => {
    setProductoEditando(producto)
    setCategoriaFormulario(producto.categoria)

    // Intentar extraer volumen del nombre si es bebida
    if (producto.categoria === 'Bebidas') {
      const regex = /\s*\((\d+(?:[.,]\d+)?)\s*(ml|L|l|cc)\)$/i
      const match = producto.nombre.match(regex)
      if (match) {
        setVolumen(match[1])
        setUnidadVolumen(match[2].toLowerCase() === 'l' ? 'L' : 'ml')
      } else {
        setVolumen('')
        setUnidadVolumen('ml')
      }
    } else {
      setVolumen('')
      setUnidadVolumen('ml')
    }

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
    setCategoriaFormulario('Bebidas') // Default o vacío
    setVolumen('')
    setUnidadVolumen('ml')
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

    let nombreFinal = formData.get('nombre') as string
    const categoria = formData.get('categoria') as string

    // Si es bebida y tiene volumen, agregarlo al nombre
    if (categoria === 'Bebidas' && volumen) {
      // Limpiar volumen anterior si existe para no duplicar al editar
      const regex = /\s*\((\d+(?:[.,]\d+)?)\s*(ml|L|l|cc)\)$/i
      nombreFinal = nombreFinal.replace(regex, '').trim()
      nombreFinal = `${nombreFinal} (${volumen}${unidadVolumen})`
    }

    const productoData = {
      nombre: nombreFinal,
      precio: Number(formData.get('precio')),
      stock: Number(formData.get('stock')),
      categoria: categoria,
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

  const handleAbrirVenta = () => {
    setProductoVenta(null)
    setCantidadVenta(1)
    setMetodoPago('CASH')
    setNotasVenta('')
    setBusquedaVenta('')
    setMostrarListaProductos(false)
    setModalVenta(true)
  }

  const handleConfirmarVenta = async () => {
    if (!productoVenta || cantidadVenta <= 0) {
      toast.error('Selecciona un producto y una cantidad válida')
      return
    }

    const producto = productos.find(p => p.id === productoVenta)
    if (!producto) {
      toast.error('Producto no encontrado')
      return
    }

    if (producto.stock < cantidadVenta) {
      toast.error(`Stock insuficiente. Disponible: ${producto.stock}`)
      return
    }

    setProcesandoVenta(true)

    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productoId: productoVenta,
          quantity: cantidadVenta,
          paymentMethod: metodoPago,
          notes: notasVenta || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Venta registrada: ${producto.nombre} x${cantidadVenta} - $${precioTotal.toLocaleString()}`)
        setModalVenta(false)
        setProductoVenta(null)
        setCantidadVenta(1)
        setMetodoPago('CASH')
        setNotasVenta('')
        // Recargar productos para actualizar stock
        await cargarProductos()
      } else {
        toast.error(data.error || 'Error al procesar la venta')
      }
    } catch (error) {
      console.error('Error al procesar venta:', error)
      toast.error('Error de conexión al procesar la venta')
    } finally {
      setProcesandoVenta(false)
    }
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Bebidas': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100'
      case 'Accesorios': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'Equipamiento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'Consumibles': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600'
    if (stock <= 5) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* Header (misma posición que el resto de pestañas) */}
      <div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">
            <span className="border-b-2 border-orange-500 pb-0.5">Gestión</span> de Productos
          </h1>
          <p className="text-muted-foreground text-xs mt-2">Administra catálogo, stock y precios de productos.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
              <Button onClick={handleAbrirVenta} variant="outline" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Ventas
              </Button>
              <Button onClick={handleNuevoProducto} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
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
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-background dark:text-foreground"
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
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                  <p className="text-2xl font-bold text-foreground break-words overflow-hidden text-ellipsis">{productos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
                  <Archive className="w-6 h-6 text-green-600 dark:text-green-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Productos Activos</p>
                  <p className="text-2xl font-bold text-foreground break-words overflow-hidden text-ellipsis">{productos.filter(p => p.activo).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex-shrink-0">
                  <Package className="w-6 h-6 text-yellow-600 dark:text-yellow-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="text-2xl font-bold text-foreground break-words overflow-hidden text-ellipsis">{productos.filter(p => p.stock <= 5 && p.stock > 0).length}</p>
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
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-foreground break-words overflow-hidden text-ellipsis">
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
                <span className="ml-3 text-muted-foreground">Cargando productos...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.map((producto) => (
                      <TableRow key={producto.id} className={!producto.activo ? 'opacity-60 bg-muted/50' : ''}>
                        <TableCell className="font-medium">
                          {producto.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoriaColor(producto.categoria)}>
                            {producto.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${producto.precio.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getStockColor(producto.stock)}`}>
                            {producto.stock} u.
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={producto.activo ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400' : 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'}>
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditarProducto(producto)}
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleActivoProducto(producto)}
                              title={producto.activo ? 'Desactivar producto' : 'Activar producto'}
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEliminarProducto(producto)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {productosFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No se encontraron productos</p>
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
                  defaultValue={productoEditando?.nombre.replace(/\s*\((\d+(?:[.,]\d+)?)\s*(ml|L|l|cc)\)$/i, '') || ''}
                />
              </div>

              {categoriaFormulario === 'Bebidas' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="volumen">Cantidad</Label>
                    <Input
                      id="volumen"
                      type="number"
                      placeholder="Ej: 500"
                      value={volumen}
                      onChange={(e) => setVolumen(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidad">Unidad</Label>
                    <select
                      id="unidad"
                      value={unidadVolumen}
                      onChange={(e) => setUnidadVolumen(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="ml">ml</option>
                      <option value="L">Litros</option>
                    </select>
                  </div>
                </div>
              )}

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
                  defaultValue={productoEditando?.categoria || ''}
                  onChange={(e) => setCategoriaFormulario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background text-foreground"
                >
                  <option value="" disabled>Seleccionar categoría</option>
                  {categorias.filter(c => c !== 'Todas').map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
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
            <p className="text-muted-foreground mb-6">
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

        {/* Modal de Venta */}
        <Dialog open={modalVenta} onOpenChange={setModalVenta}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Venta</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {!productoVenta ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="busqueda-producto-venta">Buscar Producto</Label>
                    <Input
                      id="busqueda-producto-venta"
                      type="text"
                      placeholder="Escribe para buscar producto..."
                      value={busquedaVenta}
                      onChange={(e) => {
                        setBusquedaVenta(e.target.value)
                        setMostrarListaProductos(true)
                      }}
                      onFocus={() => setMostrarListaProductos(true)}
                      className="w-full"
                    />
                  </div>

                  {mostrarListaProductos && (
                    <div className="space-y-2">
                      <Label htmlFor="producto-venta">Seleccionar Producto</Label>
                      {productosFiltradosVenta.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground border border-gray-300 dark:border-gray-600 rounded-md">
                          {busquedaVenta ? 'No se encontraron productos' : 'No hay productos disponibles'}
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                          {productosFiltradosVenta.map(producto => (
                            <div
                              key={producto.id}
                              onClick={() => {
                                setProductoVenta(producto.id)
                                setCantidadVenta(1)
                                setMostrarListaProductos(false)
                                setBusquedaVenta('')
                              }}
                              className="p-3 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{producto.nombre}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {producto.categoria} • Stock: {producto.stock} • ${producto.precio.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Producto Seleccionado</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProductoVenta(null)
                        setCantidadVenta(1)
                        setBusquedaVenta('')
                        setMostrarListaProductos(true)
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>
                  <div className="p-4 bg-muted rounded-md border border-gray-300 dark:border-gray-600">
                    <div className="font-medium text-lg">{productoSeleccionado?.nombre}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {productoSeleccionado?.categoria} • Stock: {productoSeleccionado?.stock} • ${productoSeleccionado?.precio.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {productoSeleccionado && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cantidad-venta">Cantidad</Label>
                    <Input
                      id="cantidad-venta"
                      type="number"
                      min="1"
                      max={productoSeleccionado.stock}
                      value={cantidadVenta}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        setCantidadVenta(Math.min(Math.max(1, value), productoSeleccionado.stock))
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Stock disponible: {productoSeleccionado.stock}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metodo-pago">Método de Pago</Label>
                    <select
                      id="metodo-pago"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value as 'CASH' | 'CARD' | 'BANK_TRANSFER')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="CASH">Efectivo</option>
                      <option value="CARD">Tarjeta</option>
                      <option value="BANK_TRANSFER">Transferencia</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas-venta">Notas (opcional)</Label>
                    <Input
                      id="notas-venta"
                      value={notasVenta}
                      onChange={(e) => setNotasVenta(e.target.value)}
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Precio unitario:</span>
                      <span className="font-medium">${productoSeleccionado.precio.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Cantidad:</span>
                      <span className="font-medium">{cantidadVenta}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-lg font-bold text-orange-600">${precioTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalVenta(false)}
                  disabled={procesandoVenta}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmarVenta}
                  disabled={!productoVenta || cantidadVenta <= 0 || procesandoVenta}
                >
                  {procesandoVenta ? 'Procesando...' : 'Confirmar Venta'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}
