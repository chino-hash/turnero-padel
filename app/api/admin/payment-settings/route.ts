import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { tryEncrypt } from '@/lib/encryption/credential-encryption'
import { invalidateTenantProviderCache } from '@/lib/services/payments/PaymentProviderFactory'
import { getTenantFromSlug } from '@/lib/tenant/context'
import {
  createErrorResponse,
  createSuccessResponse,
  formatZodErrors,
} from '@/lib/validations/common'
import {
  paymentSettingsQuerySchema,
  updatePaymentSettingsSchema,
} from '@/lib/validations/payment-settings'
import {
  getUserTenantIdSafe,
  isSuperAdminUser,
  type User as PermissionsUser,
} from '@/lib/utils/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TRANSFER_SETTING_KEYS = {
  alias: 'payment_transfer_alias',
  cbu: 'payment_transfer_cbu',
  accountHolder: 'payment_transfer_account_holder',
  bank: 'payment_transfer_bank',
  notes: 'payment_transfer_notes',
} as const

type AuthSession = Awaited<ReturnType<typeof auth>>
type SessionUser = NonNullable<NonNullable<AuthSession>['user']>

function buildPermissionsUser(user: SessionUser): PermissionsUser {
  return {
    id: user.id,
    email: user.email || null,
    role: user.role || 'USER',
    isAdmin: user.isAdmin || false,
    isSuperAdmin: user.isSuperAdmin || false,
    tenantId: user.tenantId || null,
  }
}

function sanitizeTransferValue(value: string | undefined): string {
  return value?.trim() || ''
}

async function resolveTargetTenantId(args: {
  isSuperAdmin: boolean
  userTenantId: string | null
  tenantIdFromRequest?: string
  tenantSlugFromRequest?: string
}) {
  const {
    isSuperAdmin,
    userTenantId,
    tenantIdFromRequest,
    tenantSlugFromRequest,
  } = args

  if (!isSuperAdmin) {
    if (!userTenantId) {
      return { error: 'No se pudo resolver el tenant del usuario', status: 400 as const }
    }
    return { tenantId: userTenantId }
  }

  if (tenantIdFromRequest) {
    return { tenantId: tenantIdFromRequest }
  }

  if (tenantSlugFromRequest) {
    const tenant = await getTenantFromSlug(tenantSlugFromRequest)
    if (!tenant) {
      return { error: 'Tenant no encontrado para tenantSlug', status: 404 as const }
    }
    return { tenantId: tenant.id }
  }

  return {
    error: 'Para super admin, tenantId o tenantSlug es requerido',
    status: 400 as const,
  }
}

function buildHasCredentialAfterUpdate(args: {
  existingEncryptedValue: string | null
  incomingValue: string | undefined
  clearFlag: boolean
}) {
  const { existingEncryptedValue, incomingValue, clearFlag } = args
  if (clearFlag) return false
  if (incomingValue && incomingValue.trim().length > 0) return true
  return Boolean(existingEncryptedValue)
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }

    const user = buildPermissionsUser(session.user)
    const isSuperAdmin = await isSuperAdminUser(user)
    if (!user.isAdmin && !isSuperAdmin) {
      return NextResponse.json(createErrorResponse('Permisos insuficientes'), { status: 403 })
    }

    const queryData = paymentSettingsQuerySchema.parse({
      tenantId: request.nextUrl.searchParams.get('tenantId')?.trim() || undefined,
      tenantSlug: request.nextUrl.searchParams.get('tenantSlug')?.trim() || undefined,
    })

    const userTenantId = await getUserTenantIdSafe(user)
    const resolved = await resolveTargetTenantId({
      isSuperAdmin,
      userTenantId,
      tenantIdFromRequest: queryData.tenantId,
      tenantSlugFromRequest: queryData.tenantSlug,
    })
    if ('error' in resolved) {
      return NextResponse.json(createErrorResponse('No se pudo resolver tenant', resolved.error), {
        status: resolved.status,
      })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: resolved.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: true,
        mercadoPagoAccessToken: true,
        mercadoPagoPublicKey: true,
        mercadoPagoWebhookSecret: true,
      },
    })

    if (!tenant) {
      return NextResponse.json(createErrorResponse('Tenant no encontrado'), { status: 404 })
    }

    const settings = await prisma.systemSetting.findMany({
      where: {
        tenantId: tenant.id,
        key: { in: Object.values(TRANSFER_SETTING_KEYS) },
      },
      select: { key: true, value: true },
    })

    const byKey = settings.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {})

    return NextResponse.json(
      createSuccessResponse('Configuración de pagos obtenida', {
        context: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantName: tenant.name,
        },
        mercadoPago: {
          enabled: tenant.mercadoPagoEnabled,
          environment: tenant.mercadoPagoEnvironment === 'production' ? 'production' : 'sandbox',
          hasCredentials: Boolean(
            tenant.mercadoPagoAccessToken ||
              tenant.mercadoPagoPublicKey ||
              tenant.mercadoPagoWebhookSecret
          ),
        },
        transfer: {
          alias: byKey[TRANSFER_SETTING_KEYS.alias] || '',
          cbu: byKey[TRANSFER_SETTING_KEYS.cbu] || '',
          accountHolder: byKey[TRANSFER_SETTING_KEYS.accountHolder] || '',
          bank: byKey[TRANSFER_SETTING_KEYS.bank] || '',
          notes: byKey[TRANSFER_SETTING_KEYS.notes] || '',
        },
      }),
      { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(error)),
        { status: 400 }
      )
    }
    console.error('[payment-settings][GET] Error:', error)
    return NextResponse.json(createErrorResponse('Error interno del servidor'), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }

    const user = buildPermissionsUser(session.user)
    const isSuperAdmin = await isSuperAdminUser(user)
    if (!user.isAdmin && !isSuperAdmin) {
      return NextResponse.json(createErrorResponse('Permisos insuficientes'), { status: 403 })
    }

    const body = await request.json()
    const validated = updatePaymentSettingsSchema.parse(body)

    const userTenantId = await getUserTenantIdSafe(user)
    const resolved = await resolveTargetTenantId({
      isSuperAdmin,
      userTenantId,
      tenantIdFromRequest: validated.tenantId,
      tenantSlugFromRequest: validated.tenantSlug,
    })
    if ('error' in resolved) {
      return NextResponse.json(createErrorResponse('No se pudo resolver tenant', resolved.error), {
        status: resolved.status,
      })
    }

    const tenantId = resolved.tenantId
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: true,
        mercadoPagoAccessToken: true,
        mercadoPagoPublicKey: true,
        mercadoPagoWebhookSecret: true,
      },
    })
    if (!existingTenant) {
      return NextResponse.json(createErrorResponse('Tenant no encontrado'), { status: 404 })
    }

    const clearAccessToken = validated.clearMercadoPagoAccessToken === true
    const clearPublicKey = validated.clearMercadoPagoPublicKey === true
    const clearWebhookSecret = validated.clearMercadoPagoWebhookSecret === true

    const nextEnabled =
      validated.mercadoPagoEnabled !== undefined
        ? validated.mercadoPagoEnabled
        : existingTenant.mercadoPagoEnabled
    const nextEnvironment =
      validated.mercadoPagoEnvironment !== undefined
        ? validated.mercadoPagoEnvironment
        : existingTenant.mercadoPagoEnvironment === 'production'
        ? 'production'
        : 'sandbox'

    const hasAccessToken = buildHasCredentialAfterUpdate({
      existingEncryptedValue: existingTenant.mercadoPagoAccessToken,
      incomingValue: validated.mercadoPagoAccessToken,
      clearFlag: clearAccessToken,
    })
    const hasPublicKey = buildHasCredentialAfterUpdate({
      existingEncryptedValue: existingTenant.mercadoPagoPublicKey,
      incomingValue: validated.mercadoPagoPublicKey,
      clearFlag: clearPublicKey,
    })

    if (nextEnabled && nextEnvironment === 'production') {
      if (!hasAccessToken || !hasPublicKey) {
        return NextResponse.json(
          createErrorResponse(
            'Datos inválidos',
            'En production, Mercado Pago requiere access token y public key'
          ),
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    let shouldInvalidateProviderCache = false

    if (validated.mercadoPagoEnabled !== undefined) {
      updateData.mercadoPagoEnabled = validated.mercadoPagoEnabled
      shouldInvalidateProviderCache = true
    }
    if (validated.mercadoPagoEnvironment !== undefined) {
      updateData.mercadoPagoEnvironment = validated.mercadoPagoEnvironment
      shouldInvalidateProviderCache = true
    }

    if (clearAccessToken) {
      updateData.mercadoPagoAccessToken = null
      shouldInvalidateProviderCache = true
    } else if (validated.mercadoPagoAccessToken && validated.mercadoPagoAccessToken.trim()) {
      updateData.mercadoPagoAccessToken = tryEncrypt(validated.mercadoPagoAccessToken.trim())
      shouldInvalidateProviderCache = true
    }

    if (clearPublicKey) {
      updateData.mercadoPagoPublicKey = null
      shouldInvalidateProviderCache = true
    } else if (validated.mercadoPagoPublicKey && validated.mercadoPagoPublicKey.trim()) {
      updateData.mercadoPagoPublicKey = tryEncrypt(validated.mercadoPagoPublicKey.trim())
      shouldInvalidateProviderCache = true
    }

    if (clearWebhookSecret) {
      updateData.mercadoPagoWebhookSecret = null
      shouldInvalidateProviderCache = true
    } else if (validated.mercadoPagoWebhookSecret && validated.mercadoPagoWebhookSecret.trim()) {
      updateData.mercadoPagoWebhookSecret = tryEncrypt(validated.mercadoPagoWebhookSecret.trim())
      shouldInvalidateProviderCache = true
    }

    const transferUpdates = [
      { key: TRANSFER_SETTING_KEYS.alias, value: validated.transferAlias },
      { key: TRANSFER_SETTING_KEYS.cbu, value: validated.transferCbu },
      { key: TRANSFER_SETTING_KEYS.accountHolder, value: validated.transferAccountHolder },
      { key: TRANSFER_SETTING_KEYS.bank, value: validated.transferBank },
      { key: TRANSFER_SETTING_KEYS.notes, value: validated.transferNotes },
    ].filter((entry) => entry.value !== undefined)

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: updateData,
        })
      }

      for (const item of transferUpdates) {
        const value = sanitizeTransferValue(item.value)
        if (!value) {
          await tx.systemSetting.deleteMany({
            where: { tenantId, key: item.key },
          })
          continue
        }

        await tx.systemSetting.upsert({
          where: { key_tenantId: { key: item.key, tenantId } },
          update: { value, updatedAt: new Date() },
          create: {
            tenantId,
            key: item.key,
            value,
            category: 'payments',
            description: 'Configuración de transferencia bancaria',
            isPublic: false,
          },
        })
      }
    })

    if (shouldInvalidateProviderCache) {
      invalidateTenantProviderCache(tenantId)
    }

    const updatedTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: true,
        mercadoPagoAccessToken: true,
        mercadoPagoPublicKey: true,
        mercadoPagoWebhookSecret: true,
      },
    })

    const updatedTransferSettings = await prisma.systemSetting.findMany({
      where: {
        tenantId,
        key: { in: Object.values(TRANSFER_SETTING_KEYS) },
      },
      select: { key: true, value: true },
    })

    const transferByKey = updatedTransferSettings.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {})

    return NextResponse.json(
      createSuccessResponse('Configuración de pagos actualizada', {
        context: {
          tenantId,
          tenantSlug: updatedTenant?.slug || existingTenant.slug,
          tenantName: updatedTenant?.name || existingTenant.name,
        },
        mercadoPago: {
          enabled: updatedTenant?.mercadoPagoEnabled ?? existingTenant.mercadoPagoEnabled,
          environment:
            updatedTenant?.mercadoPagoEnvironment === 'production' ? 'production' : 'sandbox',
          hasCredentials: Boolean(
            updatedTenant?.mercadoPagoAccessToken ||
              updatedTenant?.mercadoPagoPublicKey ||
              updatedTenant?.mercadoPagoWebhookSecret
          ),
        },
        transfer: {
          alias: transferByKey[TRANSFER_SETTING_KEYS.alias] || '',
          cbu: transferByKey[TRANSFER_SETTING_KEYS.cbu] || '',
          accountHolder: transferByKey[TRANSFER_SETTING_KEYS.accountHolder] || '',
          bank: transferByKey[TRANSFER_SETTING_KEYS.bank] || '',
          notes: transferByKey[TRANSFER_SETTING_KEYS.notes] || '',
        },
      }),
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse('Datos inválidos', undefined, formatZodErrors(error)),
        { status: 400 }
      )
    }
    console.error('[payment-settings][PUT] Error:', error)
    return NextResponse.json(createErrorResponse('Error interno del servidor'), { status: 500 })
  }
}
