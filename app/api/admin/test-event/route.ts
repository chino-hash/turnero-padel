import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { eventEmitters } from '../../../../lib/sse-events'

// POST /api/admin/test-event - Emitir eventos de prueba para demostración
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que sea administrador
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden emitir eventos de prueba.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, message } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Tipo y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // Emitir el evento según el tipo
    const eventData = {
      message,
      user: session.user.email,
      timestamp: new Date().toISOString(),
      isTest: true
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

    console.log(`Evento de prueba emitido: ${type} - ${message} por ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Evento emitido correctamente',
      event: {
        type,
        message,
        timestamp: eventData.timestamp
      }
    })

  } catch (error) {
    console.error('Error al emitir evento de prueba:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}