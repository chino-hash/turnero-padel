import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCourtById } from "@/lib/services/courts"
import { createBooking, getBookingById } from "@/lib/services/bookings"
import { eventEmitters } from '@/lib/sse-events'

export const runtime = 'nodejs'

function isHHMM(s: string) {
  return /^\d{2}:\d{2}$/.test(s)
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    const courtId = body?.courtId as string
    const dateStr = body?.date as string // YYYY-MM-DD
    const startTime = body?.startTime as string
    const endTime = body?.endTime as string
    const notes = body?.notes as string | undefined

    if (!courtId || !dateStr || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      )
    }

    if (!isHHMM(startTime) || !isHHMM(endTime)) {
       return NextResponse.json(
         { error: 'Formato de hora inválido' },
         { status: 400 }
       )
     }

    // Validar formato de hora primero
    const startHour = parseInt(startTime.split(':')[0])
    const startMinute = parseInt(startTime.split(':')[1])
    const endHour = parseInt(endTime.split(':')[0])
    const endMinute = parseInt(endTime.split(':')[1])
    
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute) ||
        startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
        endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
      return NextResponse.json(
        { error: 'Formato de hora inválido' },
        { status: 400 }
      )
    }
    
    // Validar que la hora de fin sea posterior a la de inicio
    const startTimeMinutes = startHour * 60 + startMinute
    const endTimeMinutes = endHour * 60 + endMinute
    
    if (endTimeMinutes <= startTimeMinutes) {
      return NextResponse.json(
        { error: 'La hora de fin debe ser posterior a la hora de inicio' },
        { status: 400 }
      )
    }

    // Validar que la fecha no sea en el pasado
    const bookingDate = new Date(`${dateStr}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (bookingDate < today) {
      return NextResponse.json(
        { error: 'No se pueden hacer reservas en fechas pasadas' },
        { status: 400 }
      )
    }

    const court = await getCourtById(courtId)
    if (!court) {
      return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 })
    }

    if (!court.isActive) {
      return NextResponse.json({ error: "La cancha no está disponible" }, { status: 400 })
    }

    // Calcular precios (precio fijo por reserva)
    const totalPrice = Math.round((court.base_price || 0) * (court.priceMultiplier || 1))

    // Obtener porcentaje de depósito (fallback 50)
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'deposit_percentage' } })
    const pct = Number(setting?.value ?? 50)
    const depositAmount = Math.round(totalPrice * (isNaN(pct) ? 0.5 : pct / 100))

    // Crear booking (usa checkAvailability internamente)
    const booking = await createBooking({
      courtId,
      userId: session.user.id,
      bookingDate,
      startTime,
      endTime,
      totalPrice,
      depositAmount,
      notes,
    })

    // Crear jugadores
    const p1Name = session.user.name || 'Jugador 1'
    await prisma.bookingPlayer.createMany({
      data: [
        { bookingId: booking.id, position: 1, playerName: p1Name },
        { bookingId: booking.id, position: 2, playerName: 'Jugador 2' },
        { bookingId: booking.id, position: 3, playerName: 'Jugador 3' },
        { bookingId: booking.id, position: 4, playerName: 'Jugador 4' },
      ],
    })

    const full = await getBookingById(booking.id)
    
    // Emitir evento SSE para notificar nueva reserva
    eventEmitters.bookingsUpdated({
      action: 'created',
      booking: full,
      message: `Nueva reserva creada para ${dateStr} ${startTime}-${endTime}`
    })
    
    // También emitir actualización de slots ya que la disponibilidad cambió
    eventEmitters.slotsUpdated({
      action: 'availability_changed',
      courtId: booking.courtId,
      date: dateStr,
      message: `Disponibilidad actualizada para ${dateStr}`
    })
    
    return NextResponse.json({ id: booking.id, booking: full }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

