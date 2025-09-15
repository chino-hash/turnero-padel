import { NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { getCourts, getAllCourts, createCourt, updateCourt } from '../../../lib/services/courts'
import { eventEmitters } from '../../../lib/sse-events'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Si es administrador, obtener todas las canchas (activas e inactivas)
    // Si es usuario normal, solo las activas
    const courts = session.user.isAdmin ? await getAllCourts() : await getCourts()
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
