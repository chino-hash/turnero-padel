/**
 * Página de detalle y edición de tenant
 * Permite crear nuevos tenants o editar existentes
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Switch } from '../../../../components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../components/ui/select'
import { Building2, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Users, MapPin, Settings, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SUBSCRIPTION_PLANS, getPlanDefaultCourts } from '../../../../lib/subscription-plans'
import { useAuth } from '../../../../hooks/useAuth'
import { nameToSlug } from '../../../../lib/utils/slug'

const PLAN_OPTIONS = Object.values(SUBSCRIPTION_PLANS)

interface TenantData {
  id?: string
  name: string
  slug: string
  isActive: boolean
  subscriptionPlan: string | null
  subscriptionExpiresAt: string | null
  ownerEmail: string | null
  mercadoPagoEnabled: boolean
  mercadoPagoEnvironment: 'sandbox' | 'production' | null
  mercadoPagoAccessToken: string | null
  mercadoPagoPublicKey: string | null
  mercadoPagoWebhookSecret: string | null
}

const isNewTenant = (id: string | string[] | undefined): boolean => {
  return id === 'new' || id === undefined
}

export default function TenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<TenantData>({
    name: '',
    slug: '',
    isActive: false,
    subscriptionPlan: 'BASIC',
    subscriptionExpiresAt: null,
    ownerEmail: null,
    mercadoPagoEnabled: false,
    mercadoPagoEnvironment: 'sandbox',
    mercadoPagoAccessToken: null,
    mercadoPagoPublicKey: null,
    mercadoPagoWebhookSecret: null,
  })

  const [showCredentials, setShowCredentials] = useState({
    accessToken: false,
    publicKey: false,
    webhookSecret: false,
  })

  const lastDerivedSlugRef = useRef<string>('')
  const newTenant = isNewTenant(tenantId)
  const { user: authUser } = useAuth()

  const [bootstrapLoading, setBootstrapLoading] = useState(false)
  const [ensureCourtsLoading, setEnsureCourtsLoading] = useState(false)
  const [admins, setAdmins] = useState<Array<{ email: string; role: string; tenantId: string | null; isActive: boolean }>>([])
  const [adminsLoading, setAdminsLoading] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminAdding, setAdminAdding] = useState(false)
  const [courts, setCourts] = useState<Array<{ id: string; name: string; basePrice: number; tenantId: string | null; isActive?: boolean }>>([])
  const [courtsLoading, setCourtsLoading] = useState(false)
  const [configSettings, setConfigSettings] = useState<Record<string, string>>({})
  const [configLoading, setConfigLoading] = useState(false)
  const [depositPercentage, setDepositPercentage] = useState('50')
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string; precio: number; categoria: string }>>([])
  const [productosLoading, setProductosLoading] = useState(false)

  useEffect(() => {
    if (!newTenant && tenantId) {
      loadTenant(tenantId)
    } else {
      setLoading(false)
    }
  }, [tenantId, newTenant])

  const tenantIdForSections = formData.id as string | undefined
  useEffect(() => {
    if (!tenantIdForSections) return
    const load = async () => {
      setAdminsLoading(true)
      try {
        const r = await fetch(`/api/admin?tenantId=${tenantIdForSections}`, { credentials: 'include' })
        if (r.ok) {
          const j = await r.json()
          setAdmins(Array.isArray(j?.data) ? j.data : [])
        }
      } catch { setAdmins([]) }
      finally { setAdminsLoading(false) }
    }
    load()
  }, [tenantIdForSections])
  useEffect(() => {
    if (!tenantIdForSections) return
    const load = async () => {
      setCourtsLoading(true)
      try {
        const r = await fetch(`/api/courts?tenantId=${tenantIdForSections}`, { credentials: 'include' })
        if (r.ok) {
          const list = await r.json()
          setCourts(Array.isArray(list) ? list : [])
        }
      } catch { setCourts([]) }
      finally { setCourtsLoading(false) }
    }
    load()
  }, [tenantIdForSections])
  useEffect(() => {
    if (!tenantIdForSections) return
    const keys = ['operating_hours_start', 'operating_hours_end', 'default_slot_duration', 'booking_expiration_minutes', 'deposit_percentage']
    const load = async () => {
      setConfigLoading(true)
      try {
        const out: Record<string, string> = {}
        for (const key of keys) {
          const r = await fetch(`/api/system-settings/by-key?key=${encodeURIComponent(key)}&tenantId=${tenantIdForSections}`, { credentials: 'include' })
          if (r.ok) {
            const j = await r.json()
            if (j?.data?.value != null) out[key] = String(j.data.value)
          }
        }
        setConfigSettings(out)
        if (out.deposit_percentage) setDepositPercentage(out.deposit_percentage)
      } catch {}
      finally { setConfigLoading(false) }
    }
    load()
  }, [tenantIdForSections])
  useEffect(() => {
    if (!tenantIdForSections) return
    const load = async () => {
      setProductosLoading(true)
      try {
        const r = await fetch(`/api/productos?tenantId=${tenantIdForSections}`, { credentials: 'include' })
        if (r.ok) {
          const j = await r.json()
          const list = j?.data ?? j
          setProductos(Array.isArray(list) ? list : [])
        }
      } catch { setProductos([]) }
      finally { setProductosLoading(false) }
    }
    load()
  }, [tenantIdForSections])

  const loadTenant = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/tenants/${id}`, { credentials: 'include' })
      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }
      const data = await res.json()
      if (data.success && data.data) {
        const tenant = data.data
        setFormData({
          id: tenant.id,
          name: tenant.name || '',
          slug: tenant.slug || '',
          isActive: tenant.isActive ?? true,
          subscriptionPlan: tenant.subscriptionPlan || null,
          subscriptionExpiresAt: tenant.subscriptionExpiresAt 
            ? new Date(tenant.subscriptionExpiresAt).toISOString().split('T')[0]
            : null,
          ownerEmail: tenant.ownerEmail ?? null,
          mercadoPagoEnabled: tenant.mercadoPagoEnabled ?? false,
          mercadoPagoEnvironment: tenant.mercadoPagoEnvironment || 'sandbox',
          // Las credenciales vienen encriptadas, no las mostramos
          mercadoPagoAccessToken: null,
          mercadoPagoPublicKey: null,
          mercadoPagoWebhookSecret: null,
        })
      } else {
        throw new Error(data.error || 'Error al cargar tenant')
      }
    } catch (error) {
      console.error('Error loading tenant:', error)
      toast.error('Error al cargar tenant')
      router.push('/super-admin')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)

      // Validación básica
      if (!formData.name.trim()) {
        toast.error('El nombre es requerido')
        return
      }

      if (!formData.slug.trim()) {
        toast.error('El slug es requerido')
        return
      }

      // Validar formato de slug
      if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        toast.error('El slug solo puede contener letras minúsculas, números y guiones')
        return
      }

      // Validar credenciales de MP si está habilitado (en production son obligatorias; en sandbox se permite modo demo sin credenciales)
      const isSandbox = (formData.mercadoPagoEnvironment || 'sandbox') === 'sandbox'
      if (formData.mercadoPagoEnabled && !isSandbox) {
        if (!formData.mercadoPagoAccessToken?.trim()) {
          toast.error('El Access Token de Mercado Pago es requerido en ambiente production')
          return
        }
        if (!formData.mercadoPagoPublicKey?.trim()) {
          toast.error('La Public Key de Mercado Pago es requerida en ambiente production')
          return
        }
      }

      const payload: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        isActive: formData.isActive,
        subscriptionPlan: formData.subscriptionPlan?.trim() || null,
        subscriptionExpiresAt: formData.subscriptionExpiresAt || null,
        mercadoPagoEnabled: formData.mercadoPagoEnabled,
        mercadoPagoEnvironment: formData.mercadoPagoEnvironment || 'sandbox',
      }
      if (newTenant) {
        payload.ownerEmail = formData.ownerEmail?.trim() || undefined
      } else {
        payload.ownerEmail = formData.ownerEmail?.trim() || null
      }

      // Solo incluir credenciales si se están proporcionando (para no sobrescribir las existentes si están vacías)
      if (formData.mercadoPagoAccessToken?.trim()) {
        payload.mercadoPagoAccessToken = formData.mercadoPagoAccessToken.trim()
      }
      if (formData.mercadoPagoPublicKey?.trim()) {
        payload.mercadoPagoPublicKey = formData.mercadoPagoPublicKey.trim()
      }
      if (formData.mercadoPagoWebhookSecret?.trim()) {
        payload.mercadoPagoWebhookSecret = formData.mercadoPagoWebhookSecret.trim()
      }

      let res: Response
      if (newTenant) {
        res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/tenants/${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar tenant')
      }

      toast.success(newTenant ? 'Tenant creado exitosamente' : 'Tenant actualizado exitosamente')
      router.push('/super-admin')
    } catch (error) {
      console.error('Error saving tenant:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar tenant')
    } finally {
      setSaving(false)
    }
  }

  const handleBootstrap = async () => {
    if (!formData.slug?.trim()) {
      toast.error('El slug es requerido para ejecutar bootstrap')
      return
    }
    const ownerEmail = formData.ownerEmail?.trim() || (authUser?.email as string) || ''
    if (!ownerEmail) {
      toast.error('Indica el email del administrador del tenant o inicia sesión para ejecutar bootstrap')
      return
    }
    setBootstrapLoading(true)
    try {
      const res = await fetch('/api/tenants/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slug: formData.slug.trim(),
          ownerEmail,
          name: formData.name?.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Bootstrap ejecutado correctamente')
        if (tenantIdForSections) {
          setCourtsLoading(true)
          fetch(`/api/courts?tenantId=${tenantIdForSections}`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : [])
            .then(list => setCourts(Array.isArray(list) ? list : []))
            .catch(() => {})
            .finally(() => setCourtsLoading(false))
        }
      } else {
        toast.error(data?.error || 'Error al ejecutar bootstrap')
      }
    } catch {
      toast.error('Error al ejecutar bootstrap')
    } finally {
      setBootstrapLoading(false)
    }
  }

  const handleEnsureCourts = async () => {
    if (!tenantIdForSections) return
    setEnsureCourtsLoading(true)
    try {
      const res = await fetch(`/api/tenants/${tenantIdForSections}/ensure-courts`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        toast.success('Canchas creadas según el plan')
        const r = await fetch(`/api/courts?tenantId=${tenantIdForSections}`, { credentials: 'include' })
        if (r.ok) {
          const list = await r.json()
          setCourts(Array.isArray(list) ? list : [])
        }
      } else {
        toast.error(data?.error || 'Error al crear canchas')
      }
    } catch {
      toast.error('Error al crear canchas')
    } finally {
      setEnsureCourtsLoading(false)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEmail.trim() || !tenantIdForSections) return
    setAdminAdding(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: adminEmail.trim(), tenantId: tenantIdForSections, role: 'ADMIN' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        toast.success('Administrador agregado')
        setAdminEmail('')
        const r = await fetch(`/api/admin?tenantId=${tenantIdForSections}`, { credentials: 'include' })
        if (r.ok) { const j = await r.json(); setAdmins(Array.isArray(j?.data) ? j.data : []) }
      } else {
        toast.error(data?.error || 'Error al agregar administrador')
      }
    } catch {
      toast.error('Error al agregar administrador')
    } finally {
      setAdminAdding(false)
    }
  }

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const name = (form.querySelector('[name="courtName"]') as HTMLInputElement)?.value?.trim()
    const basePriceRaw = (form.querySelector('[name="courtBasePrice"]') as HTMLInputElement)?.value?.trim() || '0'
    const basePrice = parseFloat(basePriceRaw)
    if (!name || !tenantIdForSections) {
      toast.error('Nombre y tenant requeridos')
      return
    }
    if (Number.isNaN(basePrice) || basePrice < 1) {
      toast.error('Precio base debe ser un número mayor a 0')
      return
    }
    setCourtsLoading(true)
    try {
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, basePrice, tenantId: tenantIdForSections, isActive: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Cancha creada')
        form.reset()
        const r = await fetch(`/api/courts?tenantId=${tenantIdForSections}`, { credentials: 'include' })
        if (r.ok) { const list = await r.json(); setCourts(Array.isArray(list) ? list : []) }
      } else {
        toast.error(data?.error || data?.message || 'Error al crear cancha')
      }
    } catch {
      toast.error('Error al crear cancha')
    } finally {
      setCourtsLoading(false)
    }
  }

  const handleDeleteCourt = async (courtId: string) => {
    if (!confirm('¿Eliminar esta cancha?')) return
    try {
      const res = await fetch(`/api/courts?id=${courtId}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        toast.success('Cancha eliminada')
        if (tenantIdForSections) {
          const r = await fetch(`/api/courts?tenantId=${tenantIdForSections}`, { credentials: 'include' })
          if (r.ok) { const list = await r.json(); setCourts(Array.isArray(list) ? list : []) }
        }
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error al eliminar cancha')
    }
  }

  const handleSaveConfig = async (key: string, value: string) => {
    if (!tenantIdForSections) return
    try {
      const res = await fetch('/api/system-settings/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value, tenantId: tenantIdForSections }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Configuración guardada')
        setConfigSettings(prev => ({ ...prev, [key]: value }))
      } else {
        toast.error(data?.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error al guardar configuración')
    }
  }

  const handleDepositPercentageChange = (value: string) => {
    setDepositPercentage(value)
    handleSaveConfig('deposit_percentage', value)
  }

  const handleAddProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const nombre = (form.querySelector('[name="productoNombre"]') as HTMLInputElement)?.value?.trim()
    const precio = parseFloat((form.querySelector('[name="productoPrecio"]') as HTMLInputElement)?.value || '0')
    const categoria = (form.querySelector('[name="productoCategoria"]') as HTMLInputElement)?.value?.trim() || 'general'
    if (!nombre || !tenantIdForSections) {
      toast.error('Nombre requerido')
      return
    }
    setProductosLoading(true)
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, precio, stock: 0, categoria, activo: true, tenantId: tenantIdForSections }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Producto creado')
        form.reset()
        const r = await fetch(`/api/productos?tenantId=${tenantIdForSections}`, { credentials: 'include' })
        if (r.ok) { const j = await r.json(); const list = j?.data ?? j; setProductos(Array.isArray(list) ? list : []) }
      } else {
        toast.error(data?.error || 'Error al crear producto')
      }
    } catch {
      toast.error('Error al crear producto')
    } finally {
      setProductosLoading(false)
    }
  }

  const handleChange = (field: keyof TenantData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (newTenant && field === 'name' && typeof value === 'string') {
        const derived = nameToSlug(value)
        const shouldAutoSlug = !prev.slug || prev.slug === lastDerivedSlugRef.current
        if (shouldAutoSlug && derived !== undefined) {
          lastDerivedSlugRef.current = derived
          next.slug = derived
        }
      }
      if (field === 'slug') {
        lastDerivedSlugRef.current = '' // usuario editó slug manualmente
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Cargando tenant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => router.push('/super-admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          {tenantIdForSections && (
            <Button variant="outline" asChild>
              <Link href={`/admin-panel/admin?tenantId=${encodeURIComponent(tenantIdForSections)}`}>
                <Settings className="w-4 h-4 mr-2" />
                Abrir panel de administración
              </Link>
            </Button>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {newTenant ? 'Crear Nuevo Tenant' : 'Editar Tenant'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {newTenant 
            ? 'Complete el formulario para crear un nuevo tenant'
            : 'Modifique los datos del tenant según sea necesario'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Información Básica */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Club de Padel Central"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="ej: club-central"
                required
                pattern="[a-z0-9-]+"
              />
              <p className="text-sm text-gray-500 mt-1">
                Solo letras minúsculas, números y guiones. Se usará en la URL.
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Tenant activo
                </Label>
              </div>
              {!formData.isActive && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  Mientras el tenant esté inactivo, no aparecerá en la landing pública ni aceptará reservas.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subscriptionPlan">Plan de Suscripción</Label>
                <Select
                  value={formData.subscriptionPlan || 'BASIC'}
                  onValueChange={(value) => handleChange('subscriptionPlan', value)}
                >
                  <SelectTrigger id="subscriptionPlan">
                    <SelectValue placeholder="Seleccione un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} — {plan.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subscriptionExpiresAt">Fecha de Expiración</Label>
                <Input
                  id="subscriptionExpiresAt"
                  type="date"
                  value={formData.subscriptionExpiresAt || ''}
                  onChange={(e) => handleChange('subscriptionExpiresAt', e.target.value || null)}
                />
              </div>
            </div>
            {tenantIdForSections && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-sm text-muted-foreground">
                  Canchas: {courtsLoading ? '…' : courts.length} de {getPlanDefaultCourts(formData.subscriptionPlan)} (según plan)
                </span>
                {!courtsLoading && courts.length < getPlanDefaultCourts(formData.subscriptionPlan) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnsureCourts}
                    disabled={ensureCourtsLoading}
                  >
                    {ensureCourtsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Crear canchas faltantes
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Administrador del tenant */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Administrador del tenant</CardTitle>
            <CardDescription>Email (Gmail) del administrador del tenant. Se usa para bootstrap y acceso al panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerEmail">Email del administrador (Gmail)</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={formData.ownerEmail ?? ''}
                onChange={(e) => handleChange('ownerEmail', e.target.value || null)}
                placeholder="ej: admin@club.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Credenciales de Mercado Pago */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Credenciales de Mercado Pago</CardTitle>
            <CardDescription>Configure las credenciales para procesar pagos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="mercadoPagoEnabled"
                checked={formData.mercadoPagoEnabled}
                onCheckedChange={(checked) => handleChange('mercadoPagoEnabled', checked)}
              />
              <Label htmlFor="mercadoPagoEnabled" className="cursor-pointer">
                Habilitar Mercado Pago
              </Label>
            </div>

            {formData.mercadoPagoEnabled && (
              <>
                <div>
                  <Label htmlFor="mercadoPagoEnvironment">Ambiente</Label>
                  <Select
                    value={formData.mercadoPagoEnvironment || 'sandbox'}
                    onValueChange={(value: 'sandbox' | 'production') => handleChange('mercadoPagoEnvironment', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Pruebas)</SelectItem>
                      <SelectItem value="production">Production (Producción)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="mercadoPagoAccessToken">Access Token *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCredentials(prev => ({ ...prev, accessToken: !prev.accessToken }))}
                    >
                      {showCredentials.accessToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="mercadoPagoAccessToken"
                    type={showCredentials.accessToken ? 'text' : 'password'}
                    value={formData.mercadoPagoAccessToken || ''}
                    onChange={(e) => handleChange('mercadoPagoAccessToken', e.target.value)}
                    placeholder={newTenant ? 'Ingrese el access token' : 'Dejar vacío para mantener el actual'}
                  />
                  {!newTenant && (
                    <p className="text-sm text-gray-500 mt-1">
                      Solo complete si desea actualizar el token. Se guardará encriptado.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="mercadoPagoPublicKey">Public Key *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCredentials(prev => ({ ...prev, publicKey: !prev.publicKey }))}
                    >
                      {showCredentials.publicKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="mercadoPagoPublicKey"
                    type={showCredentials.publicKey ? 'text' : 'password'}
                    value={formData.mercadoPagoPublicKey || ''}
                    onChange={(e) => handleChange('mercadoPagoPublicKey', e.target.value)}
                    placeholder={newTenant ? 'Ingrese la public key' : 'Dejar vacío para mantener la actual'}
                  />
                  {!newTenant && (
                    <p className="text-sm text-gray-500 mt-1">
                      Solo complete si desea actualizar la clave pública. Se guardará encriptado.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="mercadoPagoWebhookSecret">Webhook Secret</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCredentials(prev => ({ ...prev, webhookSecret: !prev.webhookSecret }))}
                    >
                      {showCredentials.webhookSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="mercadoPagoWebhookSecret"
                    type={showCredentials.webhookSecret ? 'text' : 'password'}
                    value={formData.mercadoPagoWebhookSecret || ''}
                    onChange={(e) => handleChange('mercadoPagoWebhookSecret', e.target.value)}
                    placeholder={newTenant ? 'Ingrese el webhook secret' : 'Dejar vacío para mantener el actual'}
                  />
                  {!newTenant && (
                    <p className="text-sm text-gray-500 mt-1">
                      Solo complete si desea actualizar el secret. Se guardará encriptado.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!newTenant && formData.id && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Bootstrap
                </CardTitle>
                <CardDescription>Inicializar o actualizar canchas, config y admin del tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBootstrap}
                  disabled={bootstrapLoading || !formData.slug?.trim()}
                >
                  {bootstrapLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Ejecutar bootstrap
                </Button>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Admins
                </CardTitle>
                <CardDescription>Administradores de este tenant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {adminsLoading ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {admins.filter(a => a.tenantId === tenantIdForSections || !a.tenantId).map((a, i) => (
                      <li key={i}>{a.email} ({a.role})</li>
                    ))}
                    {admins.filter(a => a.tenantId === tenantIdForSections || !a.tenantId).length === 0 && (
                      <li className="text-gray-500">Ningún admin aún</li>
                    )}
                  </ul>
                )}
                <form onSubmit={handleAddAdmin} className="flex gap-2 flex-wrap items-end">
                  <div>
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@ejemplo.com"
                      className="min-w-[200px]"
                    />
                  </div>
                  <Button type="submit" disabled={adminAdding}>{adminAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Canchas
                </CardTitle>
                <CardDescription>Canchas de este tenant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courtsLoading ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : (
                  <ul className="text-sm space-y-2">
                    {courts.map((c) => (
                      <li key={c.id} className="flex justify-between items-center">
                        <span>{c.name} — ${c.basePrice}{c.isActive === false ? ' — Inactiva' : ' — Activa'}</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleDeleteCourt(c.id)}>Eliminar</Button>
                      </li>
                    ))}
                    {courts.length === 0 && <li className="text-gray-500">Ninguna cancha</li>}
                  </ul>
                )}
                <form onSubmit={handleAddCourt} className="flex gap-2 flex-wrap items-end">
                  <div>
                    <Label>Nombre</Label>
                    <Input name="courtName" placeholder="Cancha 1" required className="min-w-[120px]" />
                  </div>
                  <div>
                    <Label>Precio base</Label>
                    <Input name="courtBasePrice" type="text" inputMode="decimal" defaultValue="24000" placeholder="24000" className="w-24" />
                  </div>
                  <Button type="submit" disabled={courtsLoading}>{courtsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar cancha'}</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración
                </CardTitle>
                <CardDescription>System settings y porcentaje de seña</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {configLoading ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : (
                  <>
                    <div>
                      <Label>Porcentaje de seña</Label>
                      <Select value={depositPercentage} onValueChange={handleDepositPercentageChange}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25%</SelectItem>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="100">100%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Apertura</Label>
                        <Input
                          value={configSettings.operating_hours_start || ''}
                          onChange={(e) => setConfigSettings(prev => ({ ...prev, operating_hours_start: e.target.value }))}
                          onBlur={(e) => handleSaveConfig('operating_hours_start', e.target.value)}
                          placeholder="08:00"
                        />
                      </div>
                      <div>
                        <Label>Cierre</Label>
                        <Input
                          value={configSettings.operating_hours_end || ''}
                          onChange={(e) => setConfigSettings(prev => ({ ...prev, operating_hours_end: e.target.value }))}
                          onBlur={(e) => handleSaveConfig('operating_hours_end', e.target.value)}
                          placeholder="23:00"
                        />
                      </div>
                      <div>
                        <Label>Duración slot (min)</Label>
                        <Input
                          value={configSettings.default_slot_duration || ''}
                          onChange={(e) => setConfigSettings(prev => ({ ...prev, default_slot_duration: e.target.value }))}
                          onBlur={(e) => handleSaveConfig('default_slot_duration', e.target.value)}
                          placeholder="90"
                        />
                      </div>
                      <div>
                        <Label>Expiración reserva (min)</Label>
                        <Input
                          value={configSettings.booking_expiration_minutes || ''}
                          onChange={(e) => setConfigSettings(prev => ({ ...prev, booking_expiration_minutes: e.target.value }))}
                          onBlur={(e) => handleSaveConfig('booking_expiration_minutes', e.target.value)}
                          placeholder="15"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Productos
                </CardTitle>
                <CardDescription>Productos del tenant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {productosLoading ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {productos.map((p) => (
                      <li key={p.id}>{p.nombre} — ${p.precio} ({p.categoria})</li>
                    ))}
                    {productos.length === 0 && <li className="text-gray-500">Ningún producto</li>}
                  </ul>
                )}
                <form onSubmit={handleAddProducto} className="flex gap-2 flex-wrap items-end">
                  <div>
                    <Label>Nombre</Label>
                    <Input name="productoNombre" placeholder="Pelotas" required className="min-w-[120px]" />
                  </div>
                  <div>
                    <Label>Precio</Label>
                    <Input name="productoPrecio" type="number" min={0} step={0.01} defaultValue={0} className="w-24" />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Input name="productoCategoria" placeholder="general" defaultValue="general" className="w-28" />
                  </div>
                  <Button type="submit" disabled={productosLoading}>{productosLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar producto'}</Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/super-admin')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {newTenant ? 'Crear Tenant' : 'Guardar Cambios'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

