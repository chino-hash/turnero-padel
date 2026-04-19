'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { Building2, CreditCard, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const [confirmClearSaveOpen, setConfirmClearSaveOpen] = useState(false)

  const willClearMercadoPagoSecrets =
    clearSecrets.accessToken || clearSecrets.publicKey || clearSecrets.webhookSecret

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

  const executeSave = async () => {
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

  const requestSave = () => {
    if (!hasTenantContextForSave) {
      toast.error('Seleccioná un tenant antes de guardar métodos de pago')
      return
    }
    if (willClearMercadoPagoSecrets) {
      setConfirmClearSaveOpen(true)
      return
    }
    void executeSave()
  }

  const handleConfirmClearSave = () => {
    setConfirmClearSaveOpen(false)
    void executeSave()
  }

  const clearMercadoPagoLabels: string[] = []
  if (clearSecrets.accessToken) clearMercadoPagoLabels.push('access token')
  if (clearSecrets.publicKey) clearMercadoPagoLabels.push('public key')
  if (clearSecrets.webhookSecret) clearMercadoPagoLabels.push('webhook secret')

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
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Métodos de pago</h1>
            <div className="mt-2 h-0.5 w-16 rounded-full bg-blue-500" />
          </div>
          {contextName ? (
            <Badge variant="secondary" className="font-normal">
              {contextName}
            </Badge>
          ) : null}
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Configurá Mercado Pago y los datos de transferencia. Las claves sensibles se guardan
            cifradas; los campos vacíos no sobrescriben lo ya guardado.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-11 w-full shrink-0 sm:w-auto sm:min-w-[10.5rem]"
          onClick={requestSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar cambios
        </Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <Card className="shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CreditCard className="h-5 w-5" aria-hidden />
              </span>
              Mercado Pago
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Activá el cobro online y definí el ambiente. Las credenciales se guardan cifradas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  id="mercadoPagoEnabled"
                  checked={formData.mercadoPagoEnabled}
                  onCheckedChange={(checked) => handleChange('mercadoPagoEnabled', checked === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="mercadoPagoEnabled" className="text-sm font-medium">
                    Cobros con Mercado Pago
                  </Label>
                  <p className="text-xs text-muted-foreground">Visible según el resto de la app</p>
                </div>
              </div>
              <div className="w-full space-y-2 sm:max-w-[220px] sm:shrink-0">
                <Label htmlFor="mp-env" className="text-xs text-muted-foreground">
                  Ambiente
                </Label>
                <Select
                  value={formData.mercadoPagoEnvironment}
                  onValueChange={(value: 'sandbox' | 'production') =>
                    handleChange('mercadoPagoEnvironment', value)
                  }
                >
                  <SelectTrigger id="mp-env" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (pruebas)</SelectItem>
                    <SelectItem value="production">Producción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasMercadoPagoCredentials ? (
              <p className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Ya hay credenciales guardadas. Podés dejar los campos en blanco para conservarlas,
                cargar valores nuevos para reemplazarlas o usar las opciones de limpiar abajo.
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">Credenciales</h3>
                <span className="text-xs text-muted-foreground">Mostrar / ocultar</span>
              </div>
              <Separator />
            </div>

            <div className="space-y-6 rounded-xl border bg-card p-4 sm:p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="mercadoPagoAccessToken" className="text-sm">
                    Access token
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-xs"
                    onClick={() =>
                      setShowSecrets((prev) => ({ ...prev, accessToken: !prev.accessToken }))
                    }
                  >
                    {showSecrets.accessToken ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {showSecrets.accessToken ? 'Ocultar' : 'Ver'}
                  </Button>
                </div>
                <Input
                  id="mercadoPagoAccessToken"
                  type={showSecrets.accessToken ? 'text' : 'password'}
                  className="font-mono text-sm"
                  value={formData.mercadoPagoAccessToken}
                  onChange={(e) =>
                    handleSecretChange('mercadoPagoAccessToken', 'accessToken', e.target.value)
                  }
                  placeholder="Vacío = conservar el actual"
                  autoComplete="off"
                />
                <div className="flex items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2">
                  <Label htmlFor="clearAccessToken" className="text-xs font-normal text-muted-foreground">
                    Borrar access token guardado al guardar
                  </Label>
                  <Switch
                    id="clearAccessToken"
                    checked={clearSecrets.accessToken}
                    onCheckedChange={(checked) =>
                      setClearSecrets((prev) => ({ ...prev, accessToken: checked === true }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="mercadoPagoPublicKey" className="text-sm">
                    Public key
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-xs"
                    onClick={() =>
                      setShowSecrets((prev) => ({ ...prev, publicKey: !prev.publicKey }))
                    }
                  >
                    {showSecrets.publicKey ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {showSecrets.publicKey ? 'Ocultar' : 'Ver'}
                  </Button>
                </div>
                <Input
                  id="mercadoPagoPublicKey"
                  type={showSecrets.publicKey ? 'text' : 'password'}
                  className="font-mono text-sm"
                  value={formData.mercadoPagoPublicKey}
                  onChange={(e) =>
                    handleSecretChange('mercadoPagoPublicKey', 'publicKey', e.target.value)
                  }
                  placeholder="Vacío = conservar la actual"
                  autoComplete="off"
                />
                <div className="flex items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2">
                  <Label htmlFor="clearPublicKey" className="text-xs font-normal text-muted-foreground">
                    Borrar public key guardada al guardar
                  </Label>
                  <Switch
                    id="clearPublicKey"
                    checked={clearSecrets.publicKey}
                    onCheckedChange={(checked) =>
                      setClearSecrets((prev) => ({ ...prev, publicKey: checked === true }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="mercadoPagoWebhookSecret" className="text-sm">
                    Webhook secret
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-xs"
                    onClick={() =>
                      setShowSecrets((prev) => ({ ...prev, webhookSecret: !prev.webhookSecret }))
                    }
                  >
                    {showSecrets.webhookSecret ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {showSecrets.webhookSecret ? 'Ocultar' : 'Ver'}
                  </Button>
                </div>
                <Input
                  id="mercadoPagoWebhookSecret"
                  type={showSecrets.webhookSecret ? 'text' : 'password'}
                  className="font-mono text-sm"
                  value={formData.mercadoPagoWebhookSecret}
                  onChange={(e) =>
                    handleSecretChange('mercadoPagoWebhookSecret', 'webhookSecret', e.target.value)
                  }
                  placeholder="Vacío = conservar el actual"
                  autoComplete="off"
                />
                <div className="flex items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2">
                  <Label
                    htmlFor="clearWebhookSecret"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Borrar webhook secret guardado al guardar
                  </Label>
                  <Switch
                    id="clearWebhookSecret"
                    checked={clearSecrets.webhookSecret}
                    onCheckedChange={(checked) =>
                      setClearSecrets((prev) => ({ ...prev, webhookSecret: checked === true }))
                    }
                  />
                </div>
              </div>
            </div>

            {willClearMercadoPagoSecrets ? (
              <div className="space-y-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Marcaste borrar datos guardados de Mercado Pago. Al guardar se eliminan del servidor
                  los valores actuales (no solo los campos en pantalla).
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={requestSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar y aplicar borrado
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-5 w-5" aria-hidden />
              </span>
              Transferencia bancaria
            </CardTitle>
            <CardDescription className="flex items-start gap-2 text-sm leading-relaxed">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              Datos del club para referencia interna; quedan asociados a este tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="transferAlias">Alias</Label>
                <Input
                  id="transferAlias"
                  value={formData.transferAlias}
                  onChange={(e) => handleChange('transferAlias', e.target.value)}
                  placeholder="ej: club.padelfull"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="transferCbu">CBU</Label>
                <Input
                  id="transferCbu"
                  inputMode="numeric"
                  value={formData.transferCbu}
                  onChange={(e) => handleChange('transferCbu', e.target.value)}
                  placeholder="22 dígitos"
                  className="font-mono text-sm tracking-wide"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="transferAccountHolder">Titular</Label>
                <Input
                  id="transferAccountHolder"
                  value={formData.transferAccountHolder}
                  onChange={(e) => handleChange('transferAccountHolder', e.target.value)}
                  placeholder="Nombre del titular"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="transferBank">Banco</Label>
                <Input
                  id="transferBank"
                  value={formData.transferBank}
                  onChange={(e) => handleChange('transferBank', e.target.value)}
                  placeholder="Entidad bancaria"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferNotes">Observaciones</Label>
              <Textarea
                id="transferNotes"
                value={formData.transferNotes}
                onChange={(e) => handleChange('transferNotes', e.target.value)}
                placeholder="Horarios, concepto sugerido, notas para el staff…"
                className="min-h-[100px] resize-y text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmClearSaveOpen} onOpenChange={setConfirmClearSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar credenciales de Mercado Pago?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>
                  Vas a guardar los cambios y eliminar del tenant lo guardado para:{' '}
                  <span className="font-medium text-foreground">
                    {clearMercadoPagoLabels.join(', ')}
                  </span>
                  . Esta acción no se puede deshacer; tendrás que volver a cargar las claves si las
                  necesitás.
                </p>
                {formData.mercadoPagoEnabled && formData.mercadoPagoEnvironment === 'production' ? (
                  <p className="text-amber-600 dark:text-amber-500">
                    En producción, Mercado Pago exige access token y public key. Si borrás alguno de
                    esos dos, el guardado puede fallar hasta que cargues credenciales válidas o
                    cambies a sandbox.
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={handleConfirmClearSave}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, borrar y guardar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
