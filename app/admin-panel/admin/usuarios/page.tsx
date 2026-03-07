'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Switch } from '../../../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Users, Star, Gift, TrendingUp, Calendar, RefreshCw, AlertCircle, Plus, Edit2, X, Loader2, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useAnalisisUsuarios } from '../../../../hooks/useAnalisisUsuarios'
import { useUsuariosList, type UsuarioListItem } from '../../../../hooks/useUsuariosList'
import { toast } from 'sonner'

interface ProductoOption {
  id: number
  nombre: string
  precio: number
  activo: boolean
}

interface Consumible {
  id: string
  tenantId: string
  name: string
  description: string | null
  requisitos: string | null
  discountPercent: number | null
  tipoBeneficio: string | null
  productoId: number | null
  producto?: { id: number; nombre: string; precio: number } | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const CATEGORIAS_BENEFICIOS: Array<'VIP' | 'Premium' | 'Regular'> = ['VIP', 'Premium', 'Regular']
const DEFAULTS_CATEGORIAS: Record<string, { requisitos: string; beneficios: string[]; discountPercent: number; color: string }> = {
  VIP: {
    requisitos: '20+ reservas totales',
    beneficios: ['Reserva prioritaria', 'Descuento 15%', 'Acceso a eventos exclusivos', 'Cancelación gratuita'],
    discountPercent: 15,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  },
  Premium: {
    requisitos: '10-19 reservas totales',
    beneficios: ['Descuento 10%', 'Reserva con 48h anticipación', 'Promociones especiales'],
    discountPercent: 10,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  },
  Regular: {
    requisitos: 'Menos de 10 reservas totales',
    beneficios: ['Descuento 5%', 'Newsletter con ofertas'],
    discountPercent: 5,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  },
}

export default function UsuariosPage() {
  const { analisis, loading, error, refetch } = useAnalisisUsuarios()
  const [consumibles, setConsumibles] = useState<Consumible[]>([])
  const [loadingConsumibles, setLoadingConsumibles] = useState(true)
  const [errorConsumibles, setErrorConsumibles] = useState<string | null>(null)
  const [showConsumibleModal, setShowConsumibleModal] = useState(false)
  const [editingConsumible, setEditingConsumible] = useState<Consumible | null>(null)
  const [submittingConsumible, setSubmittingConsumible] = useState(false)
  const [consumibleForm, setConsumibleForm] = useState<{
    name: string
    description: string
    requisitos: string
    discountPercent: string
    tipoBeneficio: string
    productoId: number | undefined
    isActive: boolean
    benefitLines: string[]
    benefitIncluded: boolean[]
  }>({ name: '', description: '', requisitos: '', discountPercent: '', tipoBeneficio: '', productoId: undefined, isActive: true, benefitLines: [''], benefitIncluded: [true] })
  const [editingCategoriaFija, setEditingCategoriaFija] = useState<'VIP' | 'Premium' | 'Regular' | null>(null)
  const [productos, setProductos] = useState<ProductoOption[]>([])

  useEffect(() => {
    if (showConsumibleModal) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [showConsumibleModal])

  useEffect(() => {
    if (showConsumibleModal) {
      fetch('/api/productos', { credentials: 'include' })
        .then((r) => r.json())
        .then((json) => { if (json?.success && Array.isArray(json.data)) setProductos(json.data) })
        .catch(() => {})
    }
  }, [showConsumibleModal])

  const [listPage, setListPage] = useState(1)
  const [listLimit] = useState(10)
  const [listSortBy, setListSortBy] = useState('createdAt')
  const [listSortOrder, setListSortOrder] = useState<'asc' | 'desc'>('desc')
  const [listQ, setListQ] = useState('')
  const [listQDebounced, setListQDebounced] = useState('')
  const [listCategoria, setListCategoria] = useState<string>('')
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
    categoria: listCategoria ? (listCategoria as 'VIP' | 'Premium' | 'Regular') : undefined,
    actividad: listActividad ? (listActividad as 'activos' | 'inactivos' | 'nuevos') : undefined,
  }
  const { data: usuariosList, meta: usuariosMeta, loading: listLoading, error: listError, refetch: refetchList } = useUsuariosList(listParams)
  const toggleSort = useCallback((by: string) => {
    setListSortBy(by)
    setListSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    setListPage(1)
  }, [])

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', role: 'USER' as string })
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [configCategorias, setConfigCategorias] = useState({ vipMinReservas: 20, premiumMinReservas: 10 })
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingConfig(true)
    fetch('/api/admin/config/categorias-usuario', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json?.success && json?.data) {
          setConfigCategorias({
            vipMinReservas: json.data.vipMinReservas ?? 20,
            premiumMinReservas: json.data.premiumMinReservas ?? 10,
          })
        }
      })
      .finally(() => { if (!cancelled) setLoadingConfig(false) })
    return () => { cancelled = true }
  }, [])

  const saveConfigCategorias = async () => {
    setSavingConfig(true)
    try {
      const res = await fetch('/api/admin/config/categorias-usuario', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(configCategorias),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Configuración guardada')
        refetch()
        refetchList()
      } else {
        toast.error(json?.message || json?.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSavingConfig(false)
    }
  }

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteForm.email?.trim()) {
      toast.error('El email es requerido')
      return
    }
    if (!inviteForm.name?.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setSubmittingInvite(true)
    try {
      const res = await fetch('/api/crud/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: inviteForm.name.trim(),
          email: inviteForm.email.trim(),
          phone: inviteForm.phone.trim() || undefined,
          role: inviteForm.role,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Usuario creado')
        setShowInviteModal(false)
        setInviteForm({ name: '', email: '', phone: '', role: 'USER' })
        refetchList()
        refetch()
      } else {
        toast.error(json?.error || json?.message || 'Error al crear usuario')
      }
    } catch {
      toast.error('Error al crear usuario')
    } finally {
      setSubmittingInvite(false)
    }
  }

  const fetchConsumibles = async () => {
    setLoadingConsumibles(true)
    setErrorConsumibles(null)
    try {
      const res = await fetch('/api/consumibles', { credentials: 'include' })
      const json = await res.json()
      if (res.ok && json.success && Array.isArray(json.data)) {
        setConsumibles(json.data)
      } else {
        setErrorConsumibles(json?.message || json?.error || 'Error al cargar consumibles')
      }
    } catch {
      setErrorConsumibles('Error al cargar consumibles')
    } finally {
      setLoadingConsumibles(false)
    }
  }

  useEffect(() => {
    fetchConsumibles()
  }, [])

  const openNewConsumible = () => {
    setEditingConsumible(null)
    setEditingCategoriaFija(null)
    setConsumibleForm({ name: '', description: '', requisitos: '', discountPercent: '', tipoBeneficio: '', productoId: undefined, isActive: true, benefitLines: [''], benefitIncluded: [true] })
    setShowConsumibleModal(true)
  }

  const openEditConsumible = (c: Consumible | null, categoria: 'VIP' | 'Premium' | 'Regular') => {
    setEditingConsumible(c)
    setEditingCategoriaFija(categoria)
    const def = DEFAULTS_CATEGORIAS[categoria]
    const desc = c?.description ?? (def?.beneficios.join('\n') ?? '')
    const lines = desc ? desc.split(/\r?\n/) : ['']
    const benefitLines = lines.length ? lines : ['']
    const benefitIncluded = benefitLines.map(() => true)
    setConsumibleForm({
      name: categoria,
      description: desc,
      requisitos: c?.requisitos ?? def?.requisitos ?? '',
      discountPercent: c?.discountPercent != null ? String(c.discountPercent) : (def ? String(def.discountPercent) : ''),
      tipoBeneficio: c?.tipoBeneficio ?? '',
      productoId: c?.productoId ?? undefined,
      isActive: c?.isActive ?? true,
      benefitLines,
      benefitIncluded,
    })
    setShowConsumibleModal(true)
  }

  const closeConsumibleModal = () => {
    setShowConsumibleModal(false)
    setEditingConsumible(null)
    setEditingCategoriaFija(null)
    setConsumibleForm({ name: '', description: '', requisitos: '', discountPercent: '', tipoBeneficio: '', productoId: undefined, isActive: true, benefitLines: [''], benefitIncluded: [true] })
  }

  const submitConsumible = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = consumibleForm.name.trim() || (editingCategoriaFija ?? '')
    if (!name) {
      toast.error('El nombre es requerido')
      return
    }
    const descriptionToSave = consumibleForm.benefitLines
      .filter((_, i) => consumibleForm.benefitIncluded[i])
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n')
    const discountVal = consumibleForm.discountPercent === '' ? null : Math.min(100, Math.max(0, parseInt(consumibleForm.discountPercent, 10) || 0))
    const tipoVal = consumibleForm.tipoBeneficio === 'descuento' || consumibleForm.tipoBeneficio === 'consumible' ? consumibleForm.tipoBeneficio : undefined
    setSubmittingConsumible(true)
    try {
      if (editingConsumible) {
        const res = await fetch(`/api/consumibles/${editingConsumible.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: descriptionToSave || undefined,
            requisitos: consumibleForm.requisitos.trim() || undefined,
            discountPercent: discountVal,
            tipoBeneficio: tipoVal,
            productoId: consumibleForm.productoId ?? null,
            isActive: consumibleForm.isActive,
          }),
          credentials: 'include',
        })
        const json = await res.json()
        if (res.ok && json.success) {
          if (editingCategoriaFija) {
            try {
              const cfgRes = await fetch('/api/admin/config/categorias-usuario', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(configCategorias),
              })
              const cfgJson = await cfgRes.json()
              if (cfgRes.ok && cfgJson.success) {
                refetch()
                refetchList()
              }
            } catch {
              // consumible ya guardado; config opcional
            }
          }
          toast.success('Consumible actualizado')
          closeConsumibleModal()
          fetchConsumibles()
        } else {
          toast.error(json?.message || json?.error || 'Error al actualizar')
        }
      } else {
        const res = await fetch('/api/consumibles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: descriptionToSave || undefined,
            requisitos: consumibleForm.requisitos.trim() || undefined,
            discountPercent: discountVal,
            tipoBeneficio: tipoVal,
            productoId: consumibleForm.productoId ?? null,
            isActive: consumibleForm.isActive,
          }),
          credentials: 'include',
        })
        const json = await res.json()
        if (res.ok && json.success) {
          if (editingCategoriaFija) {
            try {
              const cfgRes = await fetch('/api/admin/config/categorias-usuario', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(configCategorias),
              })
              const cfgJson = await cfgRes.json()
              if (cfgRes.ok && cfgJson.success) {
                refetch()
                refetchList()
              }
            } catch {
              // consumible ya guardado; config opcional
            }
          }
          toast.success('Consumible creado')
          closeConsumibleModal()
          fetchConsumibles()
        } else {
          toast.error(json?.message || json?.error || 'Error al crear')
        }
      }
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSubmittingConsumible(false)
    }
  }

  const handleToggleConsumible = async (c: Consumible, nextActive: boolean) => {
    setConsumibles((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: nextActive } : x)))
    try {
      const res = await fetch(`/api/consumibles/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
        credentials: 'include',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(nextActive ? 'Consumible activado' : 'Consumible desactivado')
        fetchConsumibles()
      } else {
        setConsumibles((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: c.isActive } : x)))
        toast.error(json?.message || json?.error || 'Error al cambiar estado')
      }
    } catch {
      setConsumibles((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: c.isActive } : x)))
      toast.error('Error al cambiar estado')
    }
  }

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

  const getConsumibleBadgeColor = (isActive: boolean) =>
    isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Cargando análisis de usuarios...</span>
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
          <h1 className="text-2xl md:text-3xl font-light text-foreground mb-2">Gestión de Usuarios</h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">
            Consulta y organiza usuarios por actividad y beneficios.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0"
          >
            <Plus className="w-4 h-4" />
            Invitar usuario
          </Button>
          <Button
            onClick={refetch}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2 min-h-[44px] sm:min-h-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{analisis.metricas.totalUsuarios}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
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
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Programa de Descuentos para Usuarios Regulares</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Beneficios por categoría. Edita requisitos y beneficios en cada tarjeta.
            </p>
          </CardHeader>
          <CardContent>
            {loadingConsumibles ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Cargando...
              </div>
            ) : errorConsumibles ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <p className="text-sm text-destructive">{errorConsumibles}</p>
                <Button onClick={fetchConsumibles} variant="outline" size="sm">
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CATEGORIAS_BENEFICIOS.map((cat) => {
                  const consumible = consumibles.find((c) => c.name === cat)
                  const def = DEFAULTS_CATEGORIAS[cat]
                  const requisitos = consumible?.requisitos ?? def.requisitos
                  const beneficiosFromDesc = consumible?.description
                    ? consumible.description.split(/\r?\n/).filter(Boolean)
                    : def.beneficios
                  const isTipoConsumible = consumible?.tipoBeneficio === 'consumible'
                  const productBenefit = consumible?.producto ? `${consumible.producto.nombre}${consumible.producto.precio != null ? ` — $${Number(consumible.producto.precio).toLocaleString()}` : ''}` : null
                  const beneficios = productBenefit ? [productBenefit, ...beneficiosFromDesc] : beneficiosFromDesc
                  const discountPercent = consumible?.discountPercent ?? def.discountPercent
                  const showPercent = !isTipoConsumible && (consumible?.discountPercent != null || !consumible)
                  const isActive = consumible?.isActive ?? true
                  const colorClass = consumible ? getConsumibleBadgeColor(consumible.isActive) : def.color
                  const usuariosCount = analisis?.distribucionCategorias?.[cat] ?? 0
                  return (
                    <div
                      key={cat}
                      className={`border rounded-lg p-6 space-y-4 bg-card text-card-foreground flex flex-col ${
                        !isActive ? 'opacity-75 border-muted' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={colorClass}>{cat}</Badge>
                        {showPercent && <span className="text-2xl font-bold text-foreground">{discountPercent}%</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Requisitos:</p>
                        <p className="text-sm text-muted-foreground">{requisitos}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Beneficios:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {beneficios.map((b, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-border/40 mt-auto space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{usuariosCount}</span> usuarios en esta categoría
                        </p>
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditConsumible(consumible ?? null, cat)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Switch
                            checked={consumible?.isActive ?? false}
                            onCheckedChange={(checked) => {
                              if (consumible) {
                                handleToggleConsumible(consumible, checked)
                              } else if (checked) {
                                openEditConsumible(null, cat)
                              }
                            }}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {consumible?.isActive ? 'Desactivar' : 'Activar'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado de usuarios</CardTitle>
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
                <Select value={listCategoria || 'all'} onValueChange={(v) => { setListCategoria(v === 'all' ? '' : v); setListPage(1) }}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
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
                  <p className="text-sm text-muted-foreground">No hay usuarios que coincidan con los filtros.</p>
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
                          <th className="text-left p-3 text-muted-foreground">Descuento %</th>
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
                            <td className="p-3">
                              {u.discountPercent != null ? `${u.discountPercent}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {usuariosMeta && usuariosMeta.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        Página {usuariosMeta.page} de {usuariosMeta.totalPages} ({usuariosMeta.total} usuarios)
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
            <CardTitle>Usuarios Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            {analisis.clientesMasFrecuentes.length > 0 ? (
              <>
                {/* Vista cards: móvil (< md) */}
                <div className="block md:hidden space-y-4">
                  {analisis.clientesMasFrecuentes.map((usuario, index) => (
                    <div
                      key={usuario.id || index}
                      className="border rounded-lg p-4 space-y-2 bg-card text-card-foreground"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">{usuario.nombre}</p>
                        <Badge className={getCategoriaColor(usuario.categoria)}>{usuario.categoria}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground break-all">{usuario.email}</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full">
                          {usuario.reservas} reservas
                        </span>
                        <span className="text-muted-foreground">{usuario.frecuencia}</span>
                        {usuario.canchaPreferida && (
                          <span className="text-muted-foreground">· {usuario.canchaPreferida}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Última: {usuario.ultimaReserva
                            ? new Date(usuario.ultimaReserva).toLocaleDateString('es-ES')
                            : 'N/A'}
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {usuario.descuento}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Vista tabla: tablet y desktop (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-muted-foreground">Usuario</th>
                        <th className="text-left p-2 text-muted-foreground">Email</th>
                        <th className="text-left p-2 text-muted-foreground">Reservas</th>
                        <th className="text-left p-2 text-muted-foreground">Frecuencia</th>
                        <th className="text-left p-2 text-muted-foreground">Cancha Preferida</th>
                        <th className="text-left p-2 text-muted-foreground">Última Reserva</th>
                        <th className="text-left p-2 text-muted-foreground">Categoría</th>
                        <th className="text-left p-2 text-muted-foreground">Descuento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analisis.clientesMasFrecuentes.map((usuario, index) => (
                        <tr key={usuario.id || index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium text-foreground">{usuario.nombre}</td>
                          <td className="p-2 text-muted-foreground">{usuario.email}</td>
                          <td className="p-2">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full text-xs">
                              {usuario.reservas}
                            </span>
                          </td>
                          <td className="p-2">{usuario.frecuencia}</td>
                          <td className="p-2">{usuario.canchaPreferida}</td>
                          <td className="p-2 text-muted-foreground">
                            {usuario.ultimaReserva
                              ? new Date(usuario.ultimaReserva).toLocaleDateString('es-ES')
                              : 'N/A'}
                          </td>
                          <td className="p-2">
                            <Badge className={getCategoriaColor(usuario.categoria)}>{usuario.categoria}</Badge>
                          </td>
                          <td className="p-2">
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {usuario.descuento}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay usuarios frecuentes registrados
              </p>
            )}
          </CardContent>
        </Card>

        {showConsumibleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingConsumible ? 'Editar categoría' : editingCategoriaFija ? 'Configurar categoría' : 'Nuevo consumible'}
                </h2>
                <Button variant="ghost" size="sm" onClick={closeConsumibleModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={submitConsumible} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="consumible-name">Nombre / Categoría</Label>
                  <Input
                    id="consumible-name"
                    value={consumibleForm.name}
                    onChange={(e) => setConsumibleForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VIP, Premium, Regular..."
                    required
                    readOnly={!!editingCategoriaFija}
                    className={editingCategoriaFija ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumible-requisitos">Requisitos</Label>
                  <Input
                    id="consumible-requisitos"
                    value={consumibleForm.requisitos}
                    onChange={(e) => setConsumibleForm((f) => ({ ...f, requisitos: e.target.value }))}
                    placeholder="Ej: 20+ reservas totales"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de beneficio</Label>
                  <Select
                    value={consumibleForm.tipoBeneficio || 'none'}
                    onValueChange={(v) => setConsumibleForm((f) => ({ ...f, tipoBeneficio: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="descuento">Descuento</SelectItem>
                      <SelectItem value="consumible">Consumible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {consumibleForm.tipoBeneficio === 'descuento' ? (
                  <div className="space-y-2">
                    <Label htmlFor="consumible-discount">Descuento % (0-100)</Label>
                    <Input
                      id="consumible-discount"
                      type="number"
                      min={0}
                      max={100}
                      value={consumibleForm.discountPercent}
                      onChange={(e) => setConsumibleForm((f) => ({ ...f, discountPercent: e.target.value }))}
                      placeholder="Ej: 15"
                    />
                  </div>
                ) : consumibleForm.tipoBeneficio === 'consumible' ? (
                  <div className="space-y-2">
                    <Label>Producto (consumible)</Label>
                    <Select
                      value={consumibleForm.productoId != null ? String(consumibleForm.productoId) : 'none'}
                      onValueChange={(v) => setConsumibleForm((f) => ({ ...f, productoId: v === 'none' ? undefined : parseInt(v, 10) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {productos.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)} disabled={!p.activo}>
                            {p.nombre}{p.precio != null ? ` — $${Number(p.precio).toLocaleString()}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {consumibleForm.tipoBeneficio === 'consumible' && (
                  <div className="space-y-2">
                    <Label>Beneficios (incluir en tarjeta)</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {consumibleForm.benefitLines.map((line, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`benefit-incl-${idx}`}
                            checked={consumibleForm.benefitIncluded[idx]}
                            onChange={() => {
                              const next = [...consumibleForm.benefitIncluded]
                              next[idx] = !next[idx]
                              setConsumibleForm((f) => ({ ...f, benefitIncluded: next }))
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <Label htmlFor={`benefit-incl-${idx}`} className="sr-only">Incluir en tarjeta</Label>
                          <Input
                            value={line}
                            onChange={(e) => {
                              const next = [...consumibleForm.benefitLines]
                              next[idx] = e.target.value
                              setConsumibleForm((f) => ({ ...f, benefitLines: next }))
                            }}
                            placeholder="Texto del beneficio"
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConsumibleForm((f) => ({ ...f, benefitLines: [...f.benefitLines, ''], benefitIncluded: [...f.benefitIncluded, true] }))}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Añadir línea
                    </Button>
                  </div>
                )}
                {editingCategoriaFija === 'VIP' && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">Umbral de categoría VIP</p>
                    <div className="space-y-1">
                      <Label className="text-xs">VIP (mín. reservas)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={configCategorias.vipMinReservas}
                        onChange={(e) => setConfigCategorias((c) => ({ ...c, vipMinReservas: parseInt(e.target.value, 10) || 0 }))}
                        className="w-24"
                      />
                    </div>
                  </div>
                )}
                {editingCategoriaFija === 'Premium' && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground">Umbral de categoría Premium</p>
                    <div className="space-y-1">
                      <Label className="text-xs">Premium (mín. reservas)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={configCategorias.premiumMinReservas}
                        onChange={(e) => setConfigCategorias((c) => ({ ...c, premiumMinReservas: parseInt(e.target.value, 10) || 0 }))}
                        className="w-24"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeConsumibleModal} className="flex-1" disabled={submittingConsumible}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submittingConsumible}>
                    {submittingConsumible ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {editingConsumible ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Invitar usuario</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={submitInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono (opcional)</Label>
                  <Input
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Teléfono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuario</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)} className="flex-1" disabled={submittingInvite}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submittingInvite}>
                    {submittingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Crear
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}
