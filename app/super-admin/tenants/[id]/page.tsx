/**
 * Página de detalle y edición de tenant
 * Permite crear nuevos tenants o editar existentes
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Switch } from '../../../../components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../components/ui/select'
import { Building2, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TenantData {
  id?: string
  name: string
  slug: string
  isActive: boolean
  subscriptionPlan: string | null
  subscriptionExpiresAt: string | null
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
    isActive: true,
    subscriptionPlan: null,
    subscriptionExpiresAt: null,
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

  const newTenant = isNewTenant(tenantId)

  useEffect(() => {
    if (!newTenant && tenantId) {
      loadTenant(tenantId)
    } else {
      setLoading(false)
    }
  }, [tenantId, newTenant])

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

      // Validar credenciales de MP si está habilitado
      if (formData.mercadoPagoEnabled) {
        if (!formData.mercadoPagoAccessToken?.trim()) {
          toast.error('El Access Token de Mercado Pago es requerido cuando está habilitado')
          return
        }
        if (!formData.mercadoPagoPublicKey?.trim()) {
          toast.error('La Public Key de Mercado Pago es requerida cuando está habilitado')
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

  const handleChange = (field: keyof TenantData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
        <Button
          variant="outline"
          onClick={() => router.push('/super-admin')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subscriptionPlan">Plan de Suscripción</Label>
                <Input
                  id="subscriptionPlan"
                  value={formData.subscriptionPlan || ''}
                  onChange={(e) => handleChange('subscriptionPlan', e.target.value || null)}
                  placeholder="Ej: premium, basic"
                />
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

