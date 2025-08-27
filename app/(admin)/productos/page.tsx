'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react'

type Producto = {
  id: number
  nombre: string
  precio: number
  stock: number
  categoria: string
  descripcion: string
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([
    {
      id: 1,
      nombre: 'Raqueta Wilson Pro Staff',
      precio: 15000,
      stock: 8,
      categoria: 'Raquetas',
      descripcion: 'Raqueta profesional de alta calidad'
    },
    {
      id: 2,
      nombre: 'Pelotas Penn Championship',
      precio: 800,
      stock: 25,
      categoria: 'Pelotas',
      descripcion: 'Pack de 3 pelotas oficiales'
    },
    {
      id: 3,
      nombre: 'Grip Overgrip Wilson',
      precio: 350,
      stock: 15,
      categoria: 'Accesorios',
      descripcion: 'Grip antideslizante para raquetas'
    },
    {
      id: 4,
      nombre: 'Zapatillas Adidas Barricade',
      precio: 12000,
      stock: 6,
      categoria: 'Calzado',
      descripcion: 'Zapatillas especializadas para pádel'
    }
  ])

  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')

  const categorias = ['Raquetas', 'Pelotas', 'Accesorios', 'Calzado', 'Indumentaria']

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = categoriaFiltro === 'todas' || producto.categoria === categoriaFiltro
    return coincideBusqueda && coincideCategoria
  })

  const handleNuevoProducto = () => {
    setProductoEditando(null)
    setModalAbierto(true)
  }

  const handleEditarProducto = (producto: Producto) => {
    setProductoEditando(producto)
    setModalAbierto(true)
  }

  const handleEliminarProducto = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setProductos(productos.filter(p => p.id !== id))
    }
  }

  const handleGuardarProducto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const nuevoProducto: Producto = {
      id: productoEditando?.id || Date.now(),
      nombre: formData.get('nombre') as string,
      precio: Number(formData.get('precio')),
      stock: Number(formData.get('stock')),
      categoria: formData.get('categoria') as string,
      descripcion: formData.get('descripcion') as string
    }

    if (productoEditando) {
      setProductos(productos.map(p => p.id === productoEditando.id ? nuevoProducto : p))
    } else {
      setProductos([...productos, nuevoProducto])
    }

    setModalAbierto(false)
    setProductoEditando(null)
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50'
    if (stock <= 5) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getStockText = (stock: number) => {
    if (stock === 0) return 'Sin stock'
    if (stock <= 5) return 'Stock bajo'
    return 'En stock'
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-1">Administra el inventario de productos y servicios</p>
        </div>
        <Button onClick={handleNuevoProducto} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-xl font-semibold">{productos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="text-green-600 font-semibold">$</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Valor Inventario</p>
                <p className="text-xl font-semibold">
                  ${productos.reduce((acc, p) => acc + (p.precio * p.stock), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="text-yellow-600 font-semibold">!</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-xl font-semibold">
                  {productos.filter(p => p.stock <= 5 && p.stock > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="text-red-600 font-semibold">×</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Sin Stock</p>
                <p className="text-xl font-semibold">
                  {productos.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productosFiltrados.map((producto) => (
          <Card key={producto.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{producto.categoria}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditarProducto(producto)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminarProducto(producto.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{producto.descripcion}</p>
              <div className="flex justify-between items-center mb-3">
                <div className="text-2xl font-bold text-gray-900">
                  ${producto.precio.toLocaleString()}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(producto.stock)}`}>
                  {getStockText(producto.stock)}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Stock disponible: <div className="font-medium inline">{producto.stock} unidades</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-600">Intenta ajustar los filtros o crear un nuevo producto.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal para crear/editar producto */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardarProducto} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Producto</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={productoEditando?.nombre || ''}
                placeholder="Ej: Raqueta Wilson Pro"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="precio">Precio ($)</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  defaultValue={productoEditando?.precio || ''}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={productoEditando?.stock || ''}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Select name="categoria" defaultValue={productoEditando?.categoria || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                name="descripcion"
                defaultValue={productoEditando?.descripcion || ''}
                placeholder="Descripción del producto"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                {productoEditando ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}