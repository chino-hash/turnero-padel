import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../lib/auth'
import { getCourts, getAllCourts, createCourt, updateCourt } from '../../../lib/services/courts'
import { eventEmitters } from '../../../lib/sse-events'

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener sesión; si no existe, devolver canchas activas de forma pública
    let session: any = null
    try {
      session = await auth()
    } catch {}

    // Permitir forzar vista pública/deduplicada vía query param
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || searchParams.get('scope') || searchParams.get('mode')
    const dedupe = searchParams.get('dedupe')
    const forcePublic = (view && /public|active/i.test(view)) || dedupe === 'true'

    // Si es administrador y no se fuerza vista pública, obtener todas las canchas
    // Caso contrario, devolver solo activas (deduplicadas por nombre)
    const courts = session?.user?.isAdmin && !forcePublic ? await getAllCourts() : await getCourts()
    return NextResponse.json(courts)
  } catch (error) {
    console.error('Error en GET /api/courts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const court = await createCourt(data)
    
    // Emitir evento SSE para notificar cambios
    eventEmitters.courtsUpdated({
      action: 'created',
      court: court,
      message: `Nueva cancha creada: ${court.name}`
    })
    
    return NextResponse.json(court, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/courts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json({ error: 'ID de cancha requerido' }, { status: 400 })
    }

    const court = await updateCourt(id, updateData)
    
    // Emitir evento SSE para notificar cambios
    eventEmitters.courtsUpdated({
      action: 'updated',
      court: court,
      message: `Cancha actualizada: ${court.name}`
    })
    
    return NextResponse.json(court)
  } catch (error) {
    console.error('Error en PUT /api/courts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
