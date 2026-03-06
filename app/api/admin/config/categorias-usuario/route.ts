import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { createErrorResponse, createSuccessResponse } from '@/lib/validations/common'

const KEY_VIP = 'usuario.categoria.vip.minReservas'
const KEY_PREMIUM = 'usuario.categoria.premium.minReservas'
const DEFAULT_VIP = 20
const DEFAULT_PREMIUM = 10

async function getTenantId(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return null
  const isAdmin = session.user.role === 'ADMIN'
  const isSuper = await isSuperAdminUser(session.user as PermissionsUser)
  if (!isAdmin && !isSuper) return null
  let tenantId = await getUserTenantIdSafe(session.user as PermissionsUser)
  if (!tenantId && isSuper) {
    const x = request.headers.get('x-tenant-id')
    if (x) tenantId = x
  }
  return tenantId
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) {
      return NextResponse.json(createErrorResponse('No autorizado o contexto de tenant no disponible'), { status: 403 })
    }
    const [vipSetting, premiumSetting] = await Promise.all([
      prisma.systemSetting.findFirst({ where: { key: KEY_VIP, tenantId } }),
      prisma.systemSetting.findFirst({ where: { key: KEY_PREMIUM, tenantId } }),
    ])
    const vipMinReservas = vipSetting?.value != null ? parseInt(vipSetting.value, 10) : DEFAULT_VIP
    const premiumMinReservas = premiumSetting?.value != null ? parseInt(premiumSetting.value, 10) : DEFAULT_PREMIUM
    return NextResponse.json(createSuccessResponse('OK', {
      vipMinReservas: Number.isNaN(vipMinReservas) ? DEFAULT_VIP : Math.max(0, vipMinReservas),
      premiumMinReservas: Number.isNaN(premiumMinReservas) ? DEFAULT_PREMIUM : Math.max(0, premiumMinReservas),
    }))
  } catch (err) {
    console.error('GET /api/admin/config/categorias-usuario:', err)
    return NextResponse.json(createErrorResponse('Error al obtener configuración', 'Error interno'), { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) {
      return NextResponse.json(createErrorResponse('No autorizado o contexto de tenant no disponible'), { status: 403 })
    }
    const body = await request.json().catch(() => ({}))
    const vip = body.vipMinReservas != null ? Math.max(0, parseInt(String(body.vipMinReservas), 10) || 0) : null
    const premium = body.premiumMinReservas != null ? Math.max(0, parseInt(String(body.premiumMinReservas), 10) || 0) : null
    if (vip !== null) {
      await prisma.systemSetting.upsert({
        where: { key_tenantId: { key: KEY_VIP, tenantId } },
        update: { value: String(vip), updatedAt: new Date() },
        create: { key: KEY_VIP, tenantId, value: String(vip), category: 'usuario' },
      })
    }
    if (premium !== null) {
      await prisma.systemSetting.upsert({
        where: { key_tenantId: { key: KEY_PREMIUM, tenantId } },
        update: { value: String(premium), updatedAt: new Date() },
        create: { key: KEY_PREMIUM, tenantId, value: String(premium), category: 'usuario' },
      })
    }
    const [vipSetting, premiumSetting] = await Promise.all([
      prisma.systemSetting.findFirst({ where: { key: KEY_VIP, tenantId } }),
      prisma.systemSetting.findFirst({ where: { key: KEY_PREMIUM, tenantId } }),
    ])
    const vipMinReservas = vipSetting?.value != null ? parseInt(vipSetting.value, 10) : DEFAULT_VIP
    const premiumMinReservas = premiumSetting?.value != null ? parseInt(premiumSetting.value, 10) : DEFAULT_PREMIUM
    return NextResponse.json(createSuccessResponse('Configuración guardada', {
      vipMinReservas: Number.isNaN(vipMinReservas) ? DEFAULT_VIP : vipMinReservas,
      premiumMinReservas: Number.isNaN(premiumMinReservas) ? DEFAULT_PREMIUM : premiumMinReservas,
    }))
  } catch (err) {
    console.error('PATCH /api/admin/config/categorias-usuario:', err)
    return NextResponse.json(createErrorResponse('Error al guardar configuración', 'Error interno'), { status: 500 })
  }
}
