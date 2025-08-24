import { prisma } from '@/lib/prisma'
import type { Booking, Court, Player, User } from '@/types/types'

// Tipo para jugadores en reservas
export interface BookingPlayer extends Player {
  id?: string;
  bookingId?: string;
}

// Tipos de estado para reservas
export type BookingStatus = 'confirmed' | 'pending' | 'cancelled'
export type PaymentStatus = 'Paid' | 'Deposit Paid' | 'Pending'
export type PaymentMethod = 'cash' | 'card' | 'transfer'

export interface CreateBookingData {
  courtId: string
  userId: string
  bookingDate: Date
  startTime: string
  endTime: string
  durationMinutes?: number
  totalPrice: number
  depositAmount?: number
  notes?: string
}

export interface BookingWithDetails extends Booking {
  court: Court
  user: User
  players: BookingPlayer[]
}

// Obtener reservas del usuario
export async function getUserBookings(userId: string): Promise<BookingWithDetails[]> {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        court: true,
        user: true,
        players: true
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'desc' }
      ]
    })

    // Transformar los datos para que coincidan con BookingWithDetails
    return bookings.map(booking => ({
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }))
  } catch (error) {
    console.error('Error obteniendo reservas del usuario:', error)
    throw new Error('Error al obtener las reservas')
  }
}

// Obtener todas las reservas (admin)
export async function getAllBookings(): Promise<BookingWithDetails[]> {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        court: true,
        user: true,
        players: true
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'desc' }
      ]
    })

    // Transformar los datos para que coincidan con BookingWithDetails
    return bookings.map(booking => ({
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }))
  } catch (error) {
    console.error('Error obteniendo todas las reservas:', error)
    throw new Error('Error al obtener las reservas')
  }
}

// Obtener reserva por ID
export async function getBookingById(id: string): Promise<BookingWithDetails | null> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        court: true,
        user: true,
        players: true
      }
    })

    if (!booking) return null

    // Transformar los datos para que coincidan con BookingWithDetails
    return {
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }
  } catch (error) {
    console.error('Error obteniendo reserva:', error)
    throw new Error('Error al obtener la reserva')
  }
}

// Crear nueva reserva
export async function createBooking(data: CreateBookingData): Promise<BookingWithDetails> {
  try {
    // Verificar disponibilidad antes de crear
    const isAvailable = await checkAvailability(
      data.courtId,
      data.bookingDate,
      data.startTime,
      data.endTime
    )

    if (!isAvailable) {
      throw new Error('La cancha no está disponible en el horario seleccionado')
    }

    const booking = await prisma.booking.create({
      data: {
        courtId: data.courtId,
        userId: data.userId,
        bookingDate: data.bookingDate,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes || 90,
        totalPrice: data.totalPrice,
        depositAmount: data.depositAmount || 0,
        notes: data.notes,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      },
      include: {
        court: true,
        user: true,
        players: true
      }
    })

    // Transformar los datos para que coincidan con BookingWithDetails
    return {
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }
  } catch (error) {
    console.error('Error creando reserva:', error)
    throw new Error(error instanceof Error ? error.message : 'Error al crear la reserva')
  }
}

// Actualizar estado de reserva
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  cancellationReason?: string
): Promise<BookingWithDetails> {
  try {
    const updateData: any = { status }
    
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date()
      updateData.cancellationReason = cancellationReason
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        court: true,
        user: true,
        players: true
      }
    })

    // Transformar los datos para que coincidan con BookingWithDetails
    return {
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }
  } catch (error) {
    console.error('Error actualizando estado de reserva:', error)
    throw new Error('Error al actualizar el estado de la reserva')
  }
}

// Actualizar estado de pago
export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: PaymentMethod
): Promise<BookingWithDetails> {
  try {
    const updateData: any = { paymentStatus }
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        court: true,
        user: true,
        players: true
      }
    })

    // Transformar los datos para que coincidan con BookingWithDetails
    return {
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }
  } catch (error) {
    console.error('Error actualizando estado de pago:', error)
    throw new Error('Error al actualizar el estado de pago')
  }
}

// Verificar disponibilidad
export async function checkAvailability(
  courtId: string,
  date: Date,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        courtId,
        bookingDate: date,
        status: {
          not: 'CANCELLED'
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    })

    return !conflictingBooking
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    return false
  }
}

// Obtener reservas por fecha y cancha
export async function getBookingsByDateAndCourt(
  courtId: string,
  date: Date
): Promise<BookingWithDetails[]> {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: date,
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        court: true,
        user: true,
        players: true
      },
      orderBy: { startTime: 'asc' }
    })

    // Transformar los datos para que coincidan con BookingWithDetails
    return bookings.map(booking => ({
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }))
  } catch (error) {
    console.error('Error obteniendo reservas por fecha y cancha:', error)
    throw new Error('Error al obtener las reservas')
  }
}

// Cancelar reserva
export async function cancelBooking(
  id: string,
  reason: string,
  cancelledBy: string
): Promise<BookingWithDetails> {
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: `${reason} (Cancelado por: ${cancelledBy})`
      },
      include: {
        court: true,
        user: true,
        players: true
      }
    })

    // Transformar los datos para que coincidan con BookingWithDetails
    return {
      ...booking,
      court: {
        ...booking.court,
        description: booking.court.description || '', // Manejar null
        features: booking.court.features ? booking.court.features.split(',').map(f => f.trim()) : [], // Convertir string a array
        color: '#3B82F6', // Valor por defecto
        bgColor: '#EFF6FF', // Valor por defecto
        textColor: '#1E40AF' // Valor por defecto
      },
      user: {
        ...booking.user,
        name: booking.user.name || '', // Manejar null
        phone: booking.user.phone || undefined // Manejar null
      },
      players: booking.players.map(player => ({
        ...player,
        name: player.playerName,
        email: player.playerEmail || '',
        phone: player.playerPhone || '',
        isRegistered: !!player.playerEmail,
        hasPaid: !!player.paidAt
      })),
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
      paymentStatus: booking.paymentStatus === 'FULLY_PAID' ? 'Paid' : 
                    booking.paymentStatus === 'DEPOSIT_PAID' ? 'Deposit Paid' : 'Pending',
      courtName: booking.court.name,
      date: booking.bookingDate.toISOString().split('T')[0],
      timeRange: `${booking.startTime} - ${booking.endTime}`,
      location: 'Club de Padel', // Valor por defecto
      price: booking.totalPrice || 0,
      totalPrice: booking.totalPrice || 0,
      deposit: booking.depositAmount || 0,
      type: new Date(booking.bookingDate) < new Date() ? 'past' as const : 'current' as const
    }
  } catch (error) {
    console.error('Error cancelando reserva:', error)
    throw new Error('Error al cancelar la reserva')
  }
}
