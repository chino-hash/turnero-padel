/**
 * Página de gestión de canchas del panel de administración
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Switch } from '../../../../components/ui/switch'
import { ArrowLeft, Save, Plus, Edit2, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useAppState } from '../../../../components/providers/AppStateProvider'

interface Court {
  id: string
  name: string
  basePrice: number
  isActive: boolean
  description?: string
}

export default function GestionCanchas() {
  const router = useRouter()
  const { data: session } = useSession()
  const { isDarkMode } = useAppState()
  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin)
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    basePrice: 0,
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
        console.log('Datos de canchas recibidos:', data)
        setCourts(data)
      } else {
        toast.error('Error al cargar las canchas')
      }
    } catch (error) {
      console.error('Error al cargar canchas:', error)
      toast.error('Error al cargar las canchas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre de la cancha es requerido')
      return
    }

    if (formData.basePrice <= 0) {
      toast.error('El precio base debe ser mayor a 0')
      return
    }

    try {
      const url = editingCourt ? '/api/courts' : '/api/courts'
      const method = editingCourt ? 'PUT' : 'POST'
      const payload = editingCourt
        ? { id: editingCourt.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingCourt ? 'Cancha actualizada correctamente' : 'Cancha creada correctamente')
        await fetchCourts()
        resetForm()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Error al procesar la solicitud')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar la solicitud')
    }
  }

  const handleEdit = (court: Court) => {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      basePrice: court.basePrice,
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
        toast.success(`Cancha ${!court.isActive ? 'activada' : 'desactivada'} correctamente`)
        await fetchCourts()
      } else {
        toast.error('Error al cambiar el estado de la cancha')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cambiar el estado de la cancha')
    }
  }

  const handleDelete = async (court: Court) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la cancha "${court.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/courts?id=${court.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Cancha eliminada correctamente')
        await fetchCourts()
      } else {
        toast.error('Error al eliminar la cancha')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar la cancha')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      basePrice: 0,
      isActive: true,
      description: ''
    })
    setEditingCourt(null)
    setShowAddForm(false)
  }

  const calculatePricePerPerson = (basePrice: number) => {
    return (basePrice / 4).toFixed(2)
  }

  const activeCourts = courts.filter((c) => c.isActive)
  const inactiveCourts = courts.filter((c) => !c.isActive)

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
    <div className="space-y-6">
      <header className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Gestión de Canchas</h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">Activa, edita y configura precios de canchas.</p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Cancha
            </Button>
          </div>
        )}
      </header>

      {/* Canchas activas: grid completo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCourts.map((court) => (
          <Card key={court.id} className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="truncate">{court.name}</span>
                {isSuperAdmin && (
                  <Switch
                    checked={court.isActive}
                    onCheckedChange={() => handleToggleActive(court)}
                  />
                )}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                Activa
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4 flex-1">
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium text-muted-foreground">Precio Base</Label>
                    <p className="font-bold text-lg text-foreground">${court.basePrice.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-muted-foreground">Precio por Persona</Label>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      ${parseFloat(calculatePricePerPerson(court.basePrice)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {court.description && (
                  <div className="border-t pt-3">
                    <Label className="text-sm font-medium text-muted-foreground block mb-2">Descripción</Label>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{court.description}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 mt-auto">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(court)}>
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                {isSuperAdmin && (
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(court)}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Canchas cerradas/inactivas: lista compacta */}
      {inactiveCourts.length > 0 && (
        <div className="mt-4 rounded-lg border border-muted bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Canchas cerradas (inactivas)</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {inactiveCourts.map((court) => (
              <li key={court.id} className="flex items-center gap-2">
                <span>{court.name}</span>
                {isSuperAdmin && (
                  <>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleEdit(court)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleToggleActive(court)}>
                      Activar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => handleDelete(court)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de Agregar/Editar Cancha */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode
              ? 'bg-card border border-gray-600 text-foreground'
              : 'bg-card border border-gray-200 text-foreground'
            }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCourt ? 'Editar Cancha' : 'Nueva Cancha'}
              </h2>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Nombre de la Cancha</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Cancha 1"
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice" className="text-sm font-medium text-muted-foreground">Precio Base</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice === 0 ? '' : formData.basePrice}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value)
                    setFormData({ ...formData, basePrice: value })
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.select()
                    }
                  }}
                  placeholder="Ingrese el precio base"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">Descripción (Opcional)</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la cancha"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-muted-foreground">Cancha Activa</Label>
              </div>

              {formData.basePrice > 0 && (
                <div className="bg-muted p-4 rounded-md border space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Precio por Persona</Label>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${parseFloat(calculatePricePerPerson(formData.basePrice)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Calculado para 4 personas
                  </p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {editingCourt ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
