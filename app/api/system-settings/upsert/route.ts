import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database/neon-config'
import { auth } from '../../../../lib/auth'
import { revalidateTag } from 'next/cache'
import { eventEmitters } from '../../../../lib/sse-events'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '../../../../lib/utils/permissions'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (!session.user?.isAdmin && !session.user?.isSuperAdmin)) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 })
    }

    // Construir usuario para validación de permisos
    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    const userTenantId = await getUserTenantIdSafe(user)

    const body = await req.json()
    const { key, value, description, category, isPublic, tenantId } = body || {}
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ success: false, error: 'key requerido' }, { status: 400 })
    }
    if (typeof value !== 'string' || value.length === 0) {
      return NextResponse.json({ success: false, error: 'value requerido' }, { status: 400 })
    }

    // Validar tenantId: si no es super admin, usar el tenantId del usuario
    let finalTenantId = tenantId
    if (!isSuperAdmin) {
      if (tenantId && tenantId !== userTenantId) {
        return NextResponse.json({ success: false, error: 'No tienes permisos para crear configuraciones en otro tenant' }, { status: 403 })
      }
      finalTenantId = userTenantId
    }

    // Si es update, validar que la configuración existente pertenece al tenant accesible
    const existing = await prisma.systemSetting.findFirst({
      where: { key, ...(finalTenantId ? { tenantId: finalTenantId } : { tenantId: null }) }
    })

    // Si no existe con el tenantId correcto pero existe con otro, validar permisos
    if (!existing && finalTenantId) {
      const existingOtherTenant = await prisma.systemSetting.findFirst({
        where: { key, tenantId: { not: finalTenantId } }
      })
      if (existingOtherTenant && !isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'Esta configuración pertenece a otro tenant' }, { status: 403 })
      }
    }

    const data: any = {
      key,
      value,
      ...(finalTenantId ? { tenantId: finalTenantId } : {}),
      ...(description !== undefined ? { description: String(description) } : {}),
      ...(category !== undefined ? { category: String(category) } : {}),
      ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {})
    }

    // Para upsert, necesitamos usar una clave única compuesta si hay tenantId
    const whereClause = finalTenantId 
      ? { key_tenantId: { key, tenantId: finalTenantId } }
      : { key }

    const result = await prisma.systemSetting.upsert({
      where: whereClause as any,
      update: { ...data, updatedAt: new Date() },
      create: { ...data, createdAt: new Date(), updatedAt: new Date() }
    })

    try {
      const operatingKeys = new Set([
        'operating_hours_start',
        'operating_hours_end',
        'default_slot_duration'
      ])
      if (operatingKeys.has(key)) {
        revalidateTag('system-settings:operating-hours')
      }
      eventEmitters.adminChange({
        type: 'system_setting_updated',
        key,
        message: `Configuración "${key}" actualizada`
      })
    } catch {}

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error al guardar' }, { status: 500 })
  }
}
