'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AdminTurnos from '@/components/AdminTurnos'
import { RealTimeDemo } from '@/components/admin/RealTimeDemo'
import { useRouter } from 'next/navigation'
import { BarChart3, Users, Settings, Package, Edit, DollarSign, Package2 } from 'lucide-react'
import { useState } from 'react'

type Producto = {
  id: number
  nombre: string
  precio: number
  stock: number
  categoria: string
}

export default function AdminPage() {
  const router = useRouter()
  
  // Estado para gestionar productos
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre: 'Pelotas', precio: 15000, stock: 12, categoria: 'Equipamiento' },
    { id: 2, nombre: 'Bebidas', precio: 3000, stock: 8, categoria: 'Consumibles' },
    { id: 3, nombre: 'Paletas', precio: 85000, stock: 6, categoria: 'Equipamiento' }
  ])
  
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  
  const handleEditarProducto = (producto: Producto) => {
    setProductoEditando(producto)
    setModalAbierto(true)
  }
  
  const handleGuardarProducto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const productoActualizado: Producto = {
      id: productoEditando!.id,
      nombre: formData.get('nombre') as string,
      precio: parseFloat(formData.get('precio') as string),
      stock: parseInt(formData.get('stock') as string),
      categoria: formData.get('categoria') as string
    }
    
    setProductos(prev =>
      prev.map(p => p.id === productoEditando!.id ? productoActualizado : p)
    )
    
    setModalAbierto(false)
    setProductoEditando(null)
  }
  
  const handleAgregarProducto = () => {
    const nuevoProducto = {
      id: Date.now(),
      nombre: '',
      precio: 0,
      stock: 0,
      categoria: 'Equipamiento'
    }
    setProductoEditando(nuevoProducto)
    setModalAbierto(true)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header minimalista */}
        <div className="mb-16">
          <h1 className="text-4xl font-light text-gray-900 mb-2">Panel de Administración</h1>
          <div className="w-16 h-0.5 bg-blue-500"></div>
        </div>

        {/* Sección principal de gestión */}
        <div className="mb-16">
          <AdminTurnos />
        </div>

        {/* Demo de tiempo real */}
        <div className="mb-16">
          <RealTimeDemo />
        </div>

        {/* Grid de funciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Gestionar Canchas */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6 group-hover:bg-blue-100 transition-colors">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Canchas</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Administrar configuración de canchas</p>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => router.push('/admin/canchas')}
                >
                  Gestionar →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-2xl mb-6 group-hover:bg-green-100 transition-colors">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Estadísticas</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Análisis de ocupación y rendimiento</p>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto font-medium text-green-600 hover:text-green-700"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/admin/estadisticas')
                  }}
                >
                  Ver detalles →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usuarios */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-50 rounded-2xl mb-6 group-hover:bg-purple-100 transition-colors">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Usuarios</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Gestión de clientes y descuentos</p>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto font-medium text-purple-600 hover:text-purple-700"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/admin/usuarios')
                  }}
                >
                  Administrar →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-50 rounded-2xl mb-6 group-hover:bg-orange-100 transition-colors">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Productos</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Servicios y productos adicionales</p>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto font-medium text-orange-600 hover:text-orange-700"
                  onClick={() => {
                    // Navegación a página de gestión de productos (por implementar)
                    router.push('/admin/productos')
                  }}
                >
                  Gestionar →
                </Button>
                <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {productoEditando?.nombre ? 'Editar Producto' : 'Nuevo Producto'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGuardarProducto} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                          Nombre del producto
                        </Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          defaultValue={productoEditando?.nombre || ''}
                          placeholder="Ej: Pelotas de pádel"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="precio" className="text-sm font-medium text-gray-700">
                            Precio ($)
                          </Label>
                          <Input
                            id="precio"
                            name="precio"
                            type="number"
                            defaultValue={productoEditando?.precio || ''}
                            placeholder="15000"
                            className="mt-1"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                            Stock
                          </Label>
                          <Input
                            id="stock"
                            name="stock"
                            type="number"
                            defaultValue={productoEditando?.stock || ''}
                            placeholder="12"
                            className="mt-1"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                          Categoría
                        </Label>
                        <select
                          id="categoria"
                          name="categoria"
                          defaultValue={productoEditando?.categoria || 'Equipamiento'}
                          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          required
                        >
                          <option value="Equipamiento">Equipamiento</option>
                          <option value="Consumibles">Consumibles</option>
                          <option value="Accesorios">Accesorios</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setModalAbierto(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">
                          Guardar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
