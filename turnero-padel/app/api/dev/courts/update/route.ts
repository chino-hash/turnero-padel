import { NextRequest, NextResponse } from 'next/server'
import { updateCourt } from '../../../../../lib/services/courts'
import { eventEmitters } from '../../../../../lib/sse-events'

// POST /api/dev/courts/update - Actualiza una cancha y emite courts_updated (solo dev)
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Endpoint disponible solo en desarrollo' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...data } = body || {}

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el campo id de la cancha' },
        { status: 400 }
      )
    }

    const court = await updateCourt(id, data)

    // Emitir evento courts_updated para refrescar clientes
    eventEmitters.courtsUpdated({
      message: `Cancha actualizada: ${court.name}`,
      payload: { courtId: court.id, changes: data },
      timestamp: new Date().toISOString(),
      isTest: true,
      source: 'dev-courts-update'
    })

    return NextResponse.json({ success: true, court })
  } catch (error) {
    console.error('Error en POST /api/dev/courts/update:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}