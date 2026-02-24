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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Save, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useAppState } from '../../../../components/providers/AppStateProvider'

interface Court {
  id: string
  name: string
  basePrice: number
  isActive: boolean
  description?: string
  tenantId?: string
  tenantName?: string
  tenantSlug?: string
  operatingHours?: { start: string; end: string; slot_duration: number }
}

interface Tenant {
  id: string
  name: string
  slug: string
}

const DEFAULT_OPERATING_HOURS = { start: '08:00', end: '23:00', slot_duration: 90 }

/** Genera opciones de hora cada 30 minutos (00:00 a 23:30) */
function getTimeOptions30Min(): string[] {
  const options: string[] = []
  for (let h = 0; h < 24; h++) {
    options.push(`${h.toString().padStart(2, '0')}:00`)
    options.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return options
}
const TIME_OPTIONS = getTimeOptions30Min()

/** Redondea una hora al intervalo más cercano de 30 minutos */
function roundTimeTo30Min(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const totalMins = h * 60 + m
  const rounded = Math.round(totalMins / 30) * 30
  const nh = Math.floor(rounded / 60) % 24
  const nm = rounded % 60
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`
}

export default function GestionCanchas() {
  const { data: session } = useSession()
  const { isDarkMode } = useAppState()
  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin)
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteCourtId, setDeleteCourtId] = useState<string | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [formData, setFormData] = useState({
    name: '',
    basePrice: 0,
    isActive: true,
    description: '',
    tenantId: '',
    operatingHours: DEFAULT_OPERATING_HOURS,
  })

  useEffect(() => {
    fetchCourts()
  }, [])

  useEffect(() => {
    if (isSuperAdmin) {
      fetch('/api/tenants', { credentials: 'include' })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.success && Array.isArray(data.data)) {
            setTenants(data.data)
          }
        })
        .catch(() => {})
    }
  }, [isSuperAdmin])

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts')
      const data = await response.json()
      if (response.ok) {
        setCourts(Array.isArray(data) ? data : [])
      } else {
        toast.error(data?.message || data?.error || 'Error al cargar las canchas')
      }
    } catch {
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

    if (!editingCourt && isSuperAdmin && !formData.tenantId) {
      toast.error('Debe seleccionar un tenant')
      return
    }

    setSubmitting(true)
    try {
      const method = editingCourt ? 'PUT' : 'POST'
      const payload = editingCourt
        ? {
            id: editingCourt.id,
            name: formData.name.trim(),
            basePrice: formData.basePrice,
            isActive: formData.isActive,
            description: formData.description || undefined,
            operatingHours: formData.operatingHours,
          }
        : {
            name: formData.name.trim(),
            basePrice: formData.basePrice,
            isActive: formData.isActive,
            description: formData.description || undefined,
            tenantId: formData.tenantId || undefined,
            operatingHours: formData.operatingHours,
          }

      const response = await fetch('/api/courts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const resData = await response.json()

      if (response.ok) {
        toast.success(editingCourt ? 'Cancha actualizada correctamente' : 'Cancha creada correctamente')
        await fetchCourts()
        resetForm()
      } else {
        toast.error(resData?.message || resData?.error || 'Error al procesar la solicitud')
      }
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (court: Court) => {
    setEditingCourt(court)
    const oh = court.operatingHours || DEFAULT_OPERATING_HOURS
    setFormData({
      name: court.name,
      basePrice: court.basePrice,
      isActive: court.isActive,
      description: court.description || '',
      tenantId: court.tenantId || '',
      operatingHours: {
        ...oh,
        start: roundTimeTo30Min(oh.start),
        end: roundTimeTo30Min(oh.end),
      },
    })
    setShowAddForm(true)
  }

  const handleToggleActive = async (court: Court) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/courts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: court.id, isActive: !court.isActive }),
      })

      if (response.ok) {
        toast.success(`Cancha ${!court.isActive ? 'activada' : 'desactivada'} correctamente`)
        await fetchCourts()
      } else {
        const data = await response.json()
        toast.error(data?.message || data?.error || 'Error al cambiar el estado')
      }
    } catch {
      toast.error('Error al cambiar el estado de la cancha')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (court: Court) => {
    setDeleteCourtId(court.id)
  }

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!deleteCourtId) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/courts?id=${deleteCourtId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Cancha eliminada correctamente')
        await fetchCourts()
        setDeleteCourtId(null)
      } else {
        const data = await response.json()
        toast.error(data?.message || data?.error || 'Error al eliminar la cancha')
      }
    } catch {
      toast.error('Error al eliminar la cancha')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      basePrice: 0,
      isActive: true,
      description: '',
      tenantId: '',
      operatingHours: DEFAULT_OPERATING_HOURS,
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
                    disabled={submitting}
                    checked={court.isActive}
                    onCheckedChange={() => handleToggleActive(court)}
                  />
                )}
              </CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>Activa</span>
                {isSuperAdmin && (court.tenantName || court.tenantSlug) && (
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {court.tenantName || court.tenantSlug}
                  </span>
                )}
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
                  <Button variant="destructive" size="sm" className="flex-1" disabled={submitting} onClick={() => handleDeleteClick(court)}>
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
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" disabled={submitting} onClick={() => handleDeleteClick(court)}>
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
          <div className={`rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${isDarkMode
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
              {isSuperAdmin && !editingCourt && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Tenant</Label>
                  <Select
                    value={formData.tenantId}
                    onValueChange={(v) => setFormData({ ...formData, tenantId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Horarios operativos</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="oh-start" className="text-xs">Apertura</Label>
                    <Select
                      value={roundTimeTo30Min(formData.operatingHours.start)}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        operatingHours: { ...formData.operatingHours, start: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Apertura" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="oh-end" className="text-xs">Cierre</Label>
                    <Select
                      value={roundTimeTo30Min(formData.operatingHours.end)}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        operatingHours: { ...formData.operatingHours, end: v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cierre" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="oh-duration" className="text-xs">Slot (min)</Label>
                    <Input
                      id="oh-duration"
                      type="number"
                      min={30}
                      max={180}
                      value={formData.operatingHours.slot_duration}
                      onChange={(e) => setFormData({
                        ...formData,
                        operatingHours: {
                          ...formData.operatingHours,
                          slot_duration: Math.min(180, Math.max(30, Number(e.target.value) || 90))
                        }
                      })}
                    />
                  </div>
                </div>
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
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1" disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingCourt ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteCourtId} onOpenChange={(open) => !open && setDeleteCourtId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cancha?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCourtId && courts.find((c) => c.id === deleteCourtId)?.name}
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
