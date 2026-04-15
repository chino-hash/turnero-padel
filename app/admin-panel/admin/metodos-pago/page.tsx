'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { CreditCard, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAdminContextTenant, setAdminContextTenant } from '@/lib/utils/admin-context-tenant'

type PaymentSettingsResponse = {
  success: boolean
  message: string
  data?: {
    context: {
      tenantId: string
      tenantSlug: string
      tenantName: string
    }
    mercadoPago: {
      enabled: boolean
      environment: 'sandbox' | 'production'
      hasCredentials: boolean
    }
    transfer: {
      alias: string
      cbu: string
      accountHolder: string
      bank: string
      notes: string
    }
  }
  error?: string
}

type FormState = {
  mercadoPagoEnabled: boolean
  mercadoPagoEnvironment: 'sandbox' | 'production'
  mercadoPagoAccessToken: string
  mercadoPagoPublicKey: string
  mercadoPagoWebhookSecret: string
  transferAlias: string
  transferCbu: string
  transferAccountHolder: string
  transferBank: string
  transferNotes: string
}

const DEFAULT_FORM: FormState = {
  mercadoPagoEnabled: false,
  mercadoPagoEnvironment: 'sandbox',
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
  mercadoPagoWebhookSecret: '',
  transferAlias: '',
  transferCbu: '',
  transferAccountHolder: '',
  transferBank: '',
  transferNotes: '',
}

export default function MetodosPagoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin)
  const tenantIdFromUrl = searchParams.get('tenantId')?.trim() || null
  const tenantSlugFromUrl = searchParams.get('tenantSlug')?.trim() || null

  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasMercadoPagoCredentials, setHasMercadoPagoCredentials] = useState(false)
  const [contextName, setContextName] = useState('')
  const [showSecrets, setShowSecrets] = useState({
    accessToken: false,
    publicKey: false,
    webhookSecret: false,
  })
  const [clearSecrets, setClearSecrets] = useState({
    accessToken: false,
    publicKey: false,
    webhookSecret: false,
  })

  useEffect(() => {
    if (tenantIdFromUrl || tenantSlugFromUrl) {
      setAdminContextTenant(tenantIdFromUrl, tenantSlugFromUrl)
    }
  }, [tenantIdFromUrl, tenantSlugFromUrl])

  useEffect(() => {
    if (status === 'loading' || !isSuperAdmin || tenantIdFromUrl || tenantSlugFromUrl) return
    const { tenantId, tenantSlug } = getAdminContextTenant()
    if (tenantId) {
      router.replace(`${pathname}?tenantId=${encodeURIComponent(tenantId)}`)
      return
    }
    if (tenantSlug) {
      router.replace(`${pathname}?tenantSlug=${encodeURIComponent(tenantSlug)}`)
    }
  }, [status, isSuperAdmin, tenantIdFromUrl, tenantSlugFromUrl, pathname, router])

  const willRedirect =
    isSuperAdmin &&
    !tenantIdFromUrl &&
    !tenantSlugFromUrl &&
    (getAdminContextTenant().tenantId || getAdminContextTenant().tenantSlug)

  const hasTenantContextForSave = useMemo(() => {
    if (!isSuperAdmin) return true
    return Boolean(tenantIdFromUrl || tenantSlugFromUrl)
  }, [isSuperAdmin, tenantIdFromUrl, tenantSlugFromUrl])

  const loadPaymentSettings = useCallback(async () => {
    if (status === 'loading') {
      return
    }

    if (isSuperAdmin && !tenantIdFromUrl && !tenantSlugFromUrl) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (tenantIdFromUrl) params.set('tenantId', tenantIdFromUrl)
      else if (tenantSlugFromUrl) params.set('tenantSlug', tenantSlugFromUrl)
      const url = params.toString()
        ? `/api/admin/payment-settings?${params.toString()}`
        : '/api/admin/payment-settings'

      const response = await fetch(url, { cache: 'no-store', credentials: 'include' })
      const json: PaymentSettingsResponse = await response.json()
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error || json.message || 'No se pudo cargar la configuración')
      }

      setFormData((prev) => ({
        ...prev,
        mercadoPagoEnabled: Boolean(json.data?.mercadoPago.enabled),
        mercadoPagoEnvironment:
          json.data?.mercadoPago.environment === 'production' ? 'production' : 'sandbox',
        mercadoPagoAccessToken: '',
        mercadoPagoPublicKey: '',
        mercadoPagoWebhookSecret: '',
        transferAlias: json.data?.transfer.alias || '',
        transferCbu: json.data?.transfer.cbu || '',
        transferAccountHolder: json.data?.transfer.accountHolder || '',
        transferBank: json.data?.transfer.bank || '',
        transferNotes: json.data?.transfer.notes || '',
      }))

      setContextName(json.data.context.tenantName || json.data.context.tenantSlug || '')
      setHasMercadoPagoCredentials(Boolean(json.data.mercadoPago.hasCredentials))
      setClearSecrets({ accessToken: false, publicKey: false, webhookSecret: false })
    } catch (error) {
      console.error('[metodos-pago] Error loading settings:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }, [status, isSuperAdmin, tenantIdFromUrl, tenantSlugFromUrl])

  useEffect(() => {
    if (willRedirect) return
    loadPaymentSettings()
  }, [willRedirect, loadPaymentSettings])

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSecretChange = (
    field: 'mercadoPagoAccessToken' | 'mercadoPagoPublicKey' | 'mercadoPagoWebhookSecret',
    clearField: 'accessToken' | 'publicKey' | 'webhookSecret',
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (value.trim()) {
      setClearSecrets((prev) => ({ ...prev, [clearField]: false }))
    }
  }

  const handleSave = async () => {
    if (!hasTenantContextForSave) {
      toast.error('Seleccioná un tenant antes de guardar métodos de pago')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        mercadoPagoEnabled: formData.mercadoPagoEnabled,
        mercadoPagoEnvironment: formData.mercadoPagoEnvironment,
        transferAlias: formData.transferAlias,
        transferCbu: formData.transferCbu,
        transferAccountHolder: formData.transferAccountHolder,
        transferBank: formData.transferBank,
        transferNotes: formData.transferNotes,
        clearMercadoPagoAccessToken: clearSecrets.accessToken,
        clearMercadoPagoPublicKey: clearSecrets.publicKey,
        clearMercadoPagoWebhookSecret: clearSecrets.webhookSecret,
      }

      if (isSuperAdmin) {
        if (tenantIdFromUrl) payload.tenantId = tenantIdFromUrl
        if (tenantSlugFromUrl) payload.tenantSlug = tenantSlugFromUrl
      }

      if (formData.mercadoPagoAccessToken.trim()) {
        payload.mercadoPagoAccessToken = formData.mercadoPagoAccessToken.trim()
      }
      if (formData.mercadoPagoPublicKey.trim()) {
        payload.mercadoPagoPublicKey = formData.mercadoPagoPublicKey.trim()
      }
      if (formData.mercadoPagoWebhookSecret.trim()) {
        payload.mercadoPagoWebhookSecret = formData.mercadoPagoWebhookSecret.trim()
      }

      const response = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json: PaymentSettingsResponse = await response.json()
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error || json.message || 'No se pudo guardar configuración')
      }

      setContextName(json.data.context.tenantName || json.data.context.tenantSlug || '')
      setHasMercadoPagoCredentials(Boolean(json.data.mercadoPago.hasCredentials))
      setFormData((prev) => ({
        ...prev,
        mercadoPagoAccessToken: '',
        mercadoPagoPublicKey: '',
        mercadoPagoWebhookSecret: '',
      }))
      setClearSecrets({ accessToken: false, publicKey: false, webhookSecret: false })
      toast.success('Métodos de pago guardados')
    } catch (error) {
      console.error('[metodos-pago] Error saving settings:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || willRedirect || loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cargando métodos de pago...</p>
      </div>
    )
  }

  if (!hasTenantContextForSave) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Métodos de pago</h1>
          <div className="w-16 h-0.5 bg-blue-500" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tenant no seleccionado</CardTitle>
            <CardDescription>
              Para configurar métodos de pago como super admin, abrí esta sección con
              <code className="ml-1">tenantId</code> o <code className="ml-1">tenantSlug</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => router.push('/super-admin')}>
              Ir a Super Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin-panel/admin')}
            >
              Volver al panel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Métodos de pago</h1>
          <div className="w-16 h-0.5 bg-blue-500" />
          <p className="text-muted-foreground text-xs mt-2">
            Configurá Mercado Pago y transferencia bancaria para {contextName || 'tu club'}.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Guardar cambios
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Mercado Pago
          </CardTitle>
          <CardDescription>
            Las credenciales se guardan cifradas. Dejá en blanco para conservar valores actuales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center space-x-2">
            <Switch
              id="mercadoPagoEnabled"
              checked={formData.mercadoPagoEnabled}
              onCheckedChange={(checked) => handleChange('mercadoPagoEnabled', checked === true)}
            />
            <Label htmlFor="mercadoPagoEnabled">Habilitar Mercado Pago</Label>
          </div>

          {hasMercadoPagoCredentials && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
              Ya existen credenciales guardadas. Cargá un valor para reemplazarlo o marcá la opción
              de limpiar.
            </p>
          )}

          <div>
            <Label>Ambiente</Label>
            <Select
              value={formData.mercadoPagoEnvironment}
              onValueChange={(value: 'sandbox' | 'production') =>
                handleChange('mercadoPagoEnvironment', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (pruebas)</SelectItem>
                <SelectItem value="production">Production (producción)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mercadoPagoAccessToken">Access Token</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShowSecrets((prev) => ({ ...prev, accessToken: !prev.accessToken }))
                }
              >
                {showSecrets.accessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Input
              id="mercadoPagoAccessToken"
              type={showSecrets.accessToken ? 'text' : 'password'}
              value={formData.mercadoPagoAccessToken}
              onChange={(e) =>
                handleSecretChange('mercadoPagoAccessToken', 'accessToken', e.target.value)
              }
              placeholder="Dejar vacío para conservar"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearSecrets.accessToken}
                onChange={(e) =>
                  setClearSecrets((prev) => ({ ...prev, accessToken: e.target.checked }))
                }
              />
              Limpiar access token guardado
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mercadoPagoPublicKey">Public Key</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSecrets((prev) => ({ ...prev, publicKey: !prev.publicKey }))}
              >
                {showSecrets.publicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Input
              id="mercadoPagoPublicKey"
              type={showSecrets.publicKey ? 'text' : 'password'}
              value={formData.mercadoPagoPublicKey}
              onChange={(e) =>
                handleSecretChange('mercadoPagoPublicKey', 'publicKey', e.target.value)
              }
              placeholder="Dejar vacío para conservar"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearSecrets.publicKey}
                onChange={(e) =>
                  setClearSecrets((prev) => ({ ...prev, publicKey: e.target.checked }))
                }
              />
              Limpiar public key guardada
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mercadoPagoWebhookSecret">Webhook Secret</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShowSecrets((prev) => ({ ...prev, webhookSecret: !prev.webhookSecret }))
                }
              >
                {showSecrets.webhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Input
              id="mercadoPagoWebhookSecret"
              type={showSecrets.webhookSecret ? 'text' : 'password'}
              value={formData.mercadoPagoWebhookSecret}
              onChange={(e) =>
                handleSecretChange('mercadoPagoWebhookSecret', 'webhookSecret', e.target.value)
              }
              placeholder="Dejar vacío para conservar"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearSecrets.webhookSecret}
                onChange={(e) =>
                  setClearSecrets((prev) => ({ ...prev, webhookSecret: e.target.checked }))
                }
              />
              Limpiar webhook secret guardado
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Transferencia bancaria
          </CardTitle>
          <CardDescription>
            Estos datos quedan guardados por tenant para uso interno administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transferAlias">Alias</Label>
            <Input
              id="transferAlias"
              value={formData.transferAlias}
              onChange={(e) => handleChange('transferAlias', e.target.value)}
              placeholder="ej: club.padelfull"
            />
          </div>

          <div>
            <Label htmlFor="transferCbu">CBU</Label>
            <Input
              id="transferCbu"
              value={formData.transferCbu}
              onChange={(e) => handleChange('transferCbu', e.target.value)}
              placeholder="22 dígitos"
            />
          </div>

          <div>
            <Label htmlFor="transferAccountHolder">Titular</Label>
            <Input
              id="transferAccountHolder"
              value={formData.transferAccountHolder}
              onChange={(e) => handleChange('transferAccountHolder', e.target.value)}
              placeholder="Nombre del titular"
            />
          </div>

          <div>
            <Label htmlFor="transferBank">Banco</Label>
            <Input
              id="transferBank"
              value={formData.transferBank}
              onChange={(e) => handleChange('transferBank', e.target.value)}
              placeholder="Entidad bancaria"
            />
          </div>

          <div>
            <Label htmlFor="transferNotes">Observaciones</Label>
            <Input
              id="transferNotes"
              value={formData.transferNotes}
              onChange={(e) => handleChange('transferNotes', e.target.value)}
              placeholder="Información adicional para administración"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
