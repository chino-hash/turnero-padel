import { prisma } from '@/lib/database/neon-config'
import { DEFAULT_COURT_VALUES, getDefaultOperatingHoursJson } from '@/lib/constants/court-defaults'
import { getCourtFeaturesByIndex } from '@/lib/court-colors'
import { encryptCredential } from '@/lib/encryption/credential-encryption'
import { getPlanDefaultCourts } from '@/lib/subscription-plans'

export type BootstrapTenantInput = {
  slug: string
  ownerEmail: string
  name?: string
}

export type BootstrapTenantResult = {
  tenantId: string
  slug: string
  ownerEmail: string
  createdTenant: boolean
  ensured: {
    courts: number
    systemSettings: number
    products: number
    adminWhitelist: boolean
    mercadoPagoConfigured: boolean
  }
  notes: string[]
}

const DEFAULTS = {
  operatingStart: '08:00',
  operatingEnd: '23:00',
  slotDurationMinutes: 90,
  bookingExpirationMinutes: 15,
  basePrice: 24000,
}

function normalizeSlug(slug: string): string {
  return String(slug || '').trim().toLowerCase()
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase()
}

function safeEncryptMaybe(plaintext: string): string {
  // Si falta CREDENTIAL_ENCRYPTION_KEY, guardamos en claro para no bloquear bootstrap.
  // tenant-credentials soporta formato antiguo/no encriptado.
  try {
    return encryptCredential(plaintext)
  } catch (e) {
    console.warn('[bootstrapTenant] No se pudo encriptar credencial (se guardará en claro):', e)
    return plaintext
  }
}

async function getMercadoPagoSource(): Promise<{
  accessToken?: string
  publicKey?: string | null
  webhookSecret?: string | null
}> {
  // 1) Preferir variables de entorno globales
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || null,
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || null,
    }
  }

  // 2) Fallback: copiar desde tenant 'default' si existe
  const defaultTenant = await prisma.tenant.findUnique({
    where: { slug: 'default' },
    select: {
      mercadoPagoAccessToken: true,
      mercadoPagoPublicKey: true,
      mercadoPagoWebhookSecret: true,
    },
  })

  // Nota: ya podrían venir encriptadas (o en claro). Las copiamos tal cual.
  return {
    accessToken: defaultTenant?.mercadoPagoAccessToken || undefined,
    publicKey: defaultTenant?.mercadoPagoPublicKey ?? null,
    webhookSecret: defaultTenant?.mercadoPagoWebhookSecret ?? null,
  }
}

/**
 * Asegura que el tenant tenga al menos getPlanDefaultCourts(plan) canchas (Cancha 1..N).
 * Solo crea las faltantes; no actualiza las existentes (se preservan basePrice, isActive, etc. que configuró el admin).
 * Las canchas soft-deleted (deletedAt) no cuentan como existentes. Usado por bootstrap y por PUT /api/tenants/[id].
 */
export async function ensureCourtsForPlan(tenantId: string): Promise<number> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionPlan: true },
  })
  if (!tenant) return 0
  const numCourts = getPlanDefaultCourts(tenant.subscriptionPlan)
  const operatingHoursJson = getDefaultOperatingHoursJson()
  let count = 0
  for (let n = 1; n <= numCourts; n++) {
    const name = `Cancha ${n}`
    const description = `Cancha ${n}`
    const basePrice = DEFAULT_COURT_VALUES.basePrice
    const features = JSON.stringify(getCourtFeaturesByIndex(n))
    const existing = await prisma.court.findFirst({
      where: { tenantId, name, deletedAt: null },
      select: { id: true },
    })
    if (!existing) {
      await prisma.court.create({
        data: {
          tenantId,
          name,
          description,
          basePrice,
          priceMultiplier: 1.0,
          features,
          operatingHours: operatingHoursJson,
          isActive: true,
        },
      })
      count++
    }
  }
  return count
}

export async function bootstrapTenant(input: BootstrapTenantInput): Promise<BootstrapTenantResult> {
  const slug = normalizeSlug(input.slug)
  const ownerEmail = normalizeEmail(input.ownerEmail)
  const notes: string[] = []

  if (!slug) {
    throw new Error('slug es requerido')
  }
  if (!ownerEmail) {
    throw new Error('ownerEmail es requerido')
  }

  const desiredName = input.name?.trim() || `Club ${slug}`

  // 1) Tenant
  const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
  const createdTenant = !existingTenant

  const tenant = existingTenant
    ? await prisma.tenant.update({
        where: { id: existingTenant.id },
        data: { name: existingTenant.name || desiredName },
      })
    : await prisma.tenant.create({
        data: {
          name: desiredName,
          slug,
          isActive: false,
          subscriptionPlan: 'BASIC',
          settings: JSON.stringify({ description: `Tenant bootstrap: ${slug}` }),
          mercadoPagoEnabled: false,
          mercadoPagoEnvironment: 'sandbox',
        },
      })

  const tenantId = tenant.id

  // 2) AdminWhitelist (owner)
  const existingWhitelist = await prisma.adminWhitelist.findFirst({
    where: { tenantId, email: ownerEmail },
    select: { id: true, isActive: true },
  })

  if (!existingWhitelist) {
    await prisma.adminWhitelist.create({
      data: {
        tenantId,
        email: ownerEmail,
        role: 'ADMIN',
        isActive: true,
        notes: 'Bootstrap tenant: owner admin',
      },
    })
  } else if (!existingWhitelist.isActive) {
    await prisma.adminWhitelist.update({
      where: { id: existingWhitelist.id },
      data: { isActive: true, role: 'ADMIN' },
    })
  }

  // 3) System settings mínimos (idempotentes por @@unique([key, tenantId]))
  const systemSettings: Array<{
    key: string
    value: string
    description: string
    category: string
    isPublic: boolean
  }> = [
    {
      key: 'operating_hours_start',
      value: DEFAULTS.operatingStart,
      description: 'Horario de apertura por defecto',
      category: 'booking',
      isPublic: true,
    },
    {
      key: 'operating_hours_end',
      value: DEFAULTS.operatingEnd,
      description: 'Horario de cierre por defecto',
      category: 'booking',
      isPublic: true,
    },
    {
      key: 'default_slot_duration',
      value: String(DEFAULTS.slotDurationMinutes),
      description: 'Duración de turno por defecto (minutos)',
      category: 'booking',
      isPublic: true,
    },
    {
      key: 'booking_expiration_minutes',
      value: String(DEFAULTS.bookingExpirationMinutes),
      description: 'Tiempo límite para completar el pago (minutos)',
      category: 'payments',
      isPublic: false,
    },
    {
      key: 'deposit_percentage',
      value: '50',
      description: 'Porcentaje del total que se paga como seña (25, 50, 75 o 100)',
      category: 'payments',
      isPublic: false,
    },
    {
      key: 'home_card_settings',
      value: JSON.stringify({
        labelCourtName: 'Canchas',
        locationName: desiredName,
        mapUrl: '',
        sessionText: `${DEFAULTS.slotDurationMinutes} min por turno`,
        descriptionText:
          'Visualiza la disponibilidad del día actual para las canchas. Selecciona una para ver sus horarios y características.',
        iconImage: '',
      }),
      description: 'Configuración de la tarjeta principal del home',
      category: 'ui',
      isPublic: true,
    },
  ]

  let systemSettingsEnsured = 0
  for (const s of systemSettings) {
    const existing = await prisma.systemSetting.findUnique({
      where: { key_tenantId: { key: s.key, tenantId } },
      select: { id: true },
    })
    if (!existing) {
      await prisma.systemSetting.create({
        data: { ...s, tenantId },
      })
      systemSettingsEnsured++
    }
  }

  // 4) Canchas (cantidad según plan del tenant, colores persistidos)
  const courtsEnsured = await ensureCourtsForPlan(tenantId)

  // 5) Productos/stock inicial (mínimo)
  const products = [
    { nombre: 'Pelota de Pádel', precio: 1500, stock: 50, categoria: 'pelotas', activo: true },
    { nombre: 'Grip', precio: 800, stock: 100, categoria: 'accesorios', activo: true },
    { nombre: 'Agua', precio: 1200, stock: 60, categoria: 'bebidas', activo: true },
    { nombre: 'Gaseosa', precio: 1800, stock: 40, categoria: 'bebidas', activo: true },
  ]

  let productsEnsured = 0
  for (const p of products) {
    const existing = await prisma.producto.findFirst({
      where: { tenantId, nombre: p.nombre },
      select: { id: true },
    })
    if (!existing) {
      await prisma.producto.create({
        data: { tenantId, ...p },
      })
      productsEnsured++
    }
  }

  // 6) Mercado Pago: habilitar sandbox y setear credenciales (si hay fuente)
  let mercadoPagoConfigured = false
  const mpSource = await getMercadoPagoSource()

  const updateMpData: any = {
    mercadoPagoEnabled: true,
    mercadoPagoEnvironment: 'sandbox',
  }

  if (!tenant.mercadoPagoAccessToken && mpSource.accessToken) {
    // Si viene en claro (desde env), encriptar si podemos. Si viene de tenant default, copiar tal cual.
    const looksEncrypted = typeof mpSource.accessToken === 'string' && mpSource.accessToken.includes(':') && mpSource.accessToken.split(':').length === 3
    updateMpData.mercadoPagoAccessToken = looksEncrypted ? mpSource.accessToken : safeEncryptMaybe(mpSource.accessToken)
  }

  if (!tenant.mercadoPagoPublicKey && mpSource.publicKey) {
    const pk = String(mpSource.publicKey)
    const looksEncrypted = pk.includes(':') && pk.split(':').length === 3
    updateMpData.mercadoPagoPublicKey = looksEncrypted ? pk : safeEncryptMaybe(pk)
  }

  if (!tenant.mercadoPagoWebhookSecret && mpSource.webhookSecret) {
    const ws = String(mpSource.webhookSecret)
    const looksEncrypted = ws.includes(':') && ws.split(':').length === 3
    updateMpData.mercadoPagoWebhookSecret = looksEncrypted ? ws : safeEncryptMaybe(ws)
  }

  // Aplicar update si corresponde (o al menos habilitar)
  await prisma.tenant.update({ where: { id: tenantId }, data: updateMpData })

  mercadoPagoConfigured = Boolean(updateMpData.mercadoPagoAccessToken || tenant.mercadoPagoAccessToken)
  if (!mercadoPagoConfigured) {
    notes.push('Mercado Pago habilitado en sandbox, pero no se encontraron credenciales para asignar (env o tenant default).')
  }

  return {
    tenantId,
    slug,
    ownerEmail,
    createdTenant,
    ensured: {
      courts: courtsEnsured,
      systemSettings: systemSettingsEnsured,
      products: productsEnsured,
      adminWhitelist: true,
      mercadoPagoConfigured,
    },
    notes,
  }
}

