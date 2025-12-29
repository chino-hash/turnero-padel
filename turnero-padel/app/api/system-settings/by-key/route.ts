import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database/neon-config'
import { auth } from '../../../../lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes' }, { status: 403 })
    }
    const url = new URL(req.url)
    const key = url.searchParams.get('key')
    if (!key) {
      return NextResponse.json({ success: false, error: 'key requerido' }, { status: 400 })
    }
    const item = await prisma.systemSetting.findFirst({ where: { key } })
    if (!item) {
      return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: item }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error' }, { status: 500 })
  }
}
