import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database/neon-config'
import { auth } from '../../../../lib/auth'
import { revalidateTag } from 'next/cache'
import { eventEmitters } from '../../../../lib/sse-events'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 })
    }
    const body = await req.json()
    const { key, value, description, category, isPublic } = body || {}
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ success: false, error: 'key requerido' }, { status: 400 })
    }
    if (typeof value !== 'string' || value.length === 0) {
      return NextResponse.json({ success: false, error: 'value requerido' }, { status: 400 })
    }
    const data: any = {
      key,
      value,
      ...(description !== undefined ? { description: String(description) } : {}),
      ...(category !== undefined ? { category: String(category) } : {}),
      ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {})
    }
    const result = await prisma.systemSetting.upsert({
      where: { key },
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
