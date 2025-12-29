import { NextRequest, NextResponse } from 'next/server'
import { eventEmitters } from '../../../../lib/sse-events'

// POST /api/dev/test-event - Emitir eventos SSE en desarrollo (sin auth)
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Endpoint disponible solo en desarrollo' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, message, payload } = body || {}

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Se requieren los campos type y message' },
        { status: 400 }
      )
    }

    const eventData = {
      message,
      payload: payload ?? null,
      timestamp: new Date().toISOString(),
      isTest: true,
      source: 'dev-test-endpoint'
    }

    switch (type) {
      case 'courts_updated':
        eventEmitters.courtsUpdated(eventData)
        break
      case 'bookings_updated':
        eventEmitters.bookingsUpdated(eventData)
        break
      case 'slots_updated':
        eventEmitters.slotsUpdated(eventData)
        break
      case 'admin_change':
        eventEmitters.adminChange(eventData)
        break
      default:
        return NextResponse.json(
          { error: `Tipo de evento no válido: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      event: { type, message },
      status: 'emitted'
    })
  } catch (error) {
    console.error('Error en POST /api/dev/test-event:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}