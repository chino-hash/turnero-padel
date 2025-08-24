'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Plus, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Court {
  id: string
  name: string
  basePrice: number
  priceMultiplier: number
  isActive: boolean
  description?: string
}

export default function GestionCanchas() {
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    basePrice: 0,
    priceMultiplier: 1,
    isActive: true,
    description: ''
  })

  useEffect(() => {
    fetchCourts()
  }, [])

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts')
      if (response.ok) {
        const data = await response.json()
        setCourts(data)
      } else {
        toast.error('Error al cargar las canchas')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar las canchas')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (courtData: Partial<Court>) => {
    try {
      const url = editingCourt ? '/api/courts' : '/api/courts'
      const method = editingCourt ? 'PUT' : 'POST'
      const payload = editingCourt 
        ? { id: editingCourt.id, ...courtData }
        : courtData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingCourt ? 'Cancha actualizada' : 'Cancha creada')
        setEditingCourt(null)
        setShowAddForm(false)
        setFormData({
          name: '',
          basePrice: 0,
          priceMultiplier: 1,
          isActive: true,
          description: ''
        })
        fetchCourts()
      } else {
        toast.error('Error al guardar la cancha')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar la cancha')
    }
  }

  const handleEdit = (court: Court) => {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      basePrice: court.basePrice,
      priceMultiplier: court.priceMultiplier,
      isActive: court.isActive,
      description: court.description || ''
    })
    setShowAddForm(true)
  }

  const handleToggleActive = async (court: Court) => {
    try {
      const response = await fetch('/api/courts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: court.id,
          isActive: !court.isActive
        }),
      })

      if (response.ok) {
        toast.success(`Cancha ${!court.isActive ? 'habilitada' : 'deshabilitada'}`)
        fetchCourts()
      } else {
        toast.error('Error al actualizar el estado de la cancha')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el estado de la cancha')
    }
  }

  const resetForm = () => {
    setEditingCourt(null)
    setShowAddForm(false)
    setFormData({
      name: '',
      basePrice: 0,
      priceMultiplier: 1,
      isActive: true,
      description: ''
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando canchas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <h1 className="text-2xl font-bold">Gestión de Canchas</h1>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Cancha</span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCourt ? 'Editar Cancha' : 'Agregar Nueva Cancha'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Cancha</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Cancha 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Precio Base ($)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMultiplier">Divisor</Label>
                <Input
                  id="priceMultiplier"
                  type="number"
                  value={4}
                  readOnly
                  className="bg-gray-100"
                />
                {editingCourt && (
                  <div className="text-sm text-gray-600 mt-1">
                    Precio por persona: ${(formData.basePrice / 4).toFixed(2)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Estado</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <span className={formData.isActive ? 'text-green-600' : 'text-red-600'}>
                    {formData.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la cancha"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={() => handleSave(formData)} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{editingCourt ? 'Actualizar' : 'Crear'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <Card key={court.id} className={`${!court.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{court.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(court)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={court.isActive}
                    onCheckedChange={() => handleToggleActive(court)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Precio Base:</span>
                  <span className="font-medium">${court.basePrice}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Precio por persona:</span>
                  <span className="font-bold text-green-600">
                    ${((court.basePrice * court.priceMultiplier) / 4).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className={`font-medium ${
                    court.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {court.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                {court.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">{court.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No hay canchas registradas</p>
            <Button onClick={() => setShowAddForm(true)}>
              Agregar Primera Cancha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}