import { PrismaClient } from '@prisma/client';
import { BookingRepository, BookingWithRelations, BookingCreateInput, BookingUpdateInput } from '../repositories/BookingRepository';
import { BookingFilters, CheckAvailabilityInput, BulkUpdateBookingsInput, CreateBookingInput, UpdateBookingInput, UpdateBookingPlayerPaymentInput } from '../validations/booking';
import { ApiResponse, PaginatedResponse } from '../validations/common';
import { prisma } from '../database/neon-config';
import { computePricing } from './bookings/pricing';

// Tipos específicos del servicio
export type BookingWithDetails = {
  id: string;
  courtId: string;
  userId: string;
  bookingDate: string; // ISO string
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  depositAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  cancelledAt: string | null; // ISO string
  closedAt: string | null; // ISO string
  recurringId: string | null;
  court: {
    id: string;
    name: string;
    description: string | null;
    basePrice: number;
    priceMultiplier: number;
    features: string[];
    isActive: boolean;
    operatingHours: {
      open: string;
      close: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  players: Array<{
    id: string;
    playerName: string;
    playerPhone: string | null;
    playerEmail: string | null;
    hasPaid: boolean;
    paidAmount: number;
    position: number;
    notes: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentType: string;
    status: string;
    createdAt: string; // ISO string
  }>;
  extras?: Array<{
    id: string;
    productoId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    assignedToAll: boolean;
    notes: string | null;
    deletedAt: string | null;
    player?: {
      id: string;
      playerName: string;
      position: number | null;
    } | null;
    producto?: {
      id: number;
      nombre: string;
      precio: number;
    } | null;
  }>;
  pricing?: {
    basePrice: number;
    extrasTotal: number;
    amountPaid: number;
    totalCalculated: number;
    pendingBalance: number;
  };
};

export type BookingAvailabilitySlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  finalPrice?: number;
  pricePerPerson?: number;
};

export type BookingStats = {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
  revenue: number;
  occupancyRate: number;
};

export class BookingService {
  private repository: BookingRepository;

  constructor(prismaClient?: PrismaClient) {
    const client = prismaClient || prisma;
    this.repository = new BookingRepository(client);
  }

  private parseYmd(date: string) {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y as number, (m as number) - 1, d as number)
  }

  // Transformar datos del repository al formato del servicio
  private transformBookingData(booking: BookingWithRelations): BookingWithDetails {
    const extras = (booking as any).extras?.map((e: any) => ({
      id: e.id,
      productoId: e.productoId,
      quantity: e.quantity,
      unitPrice: e.unitPrice,
      totalPrice: e.totalPrice,
      assignedToAll: e.assignedToAll,
      notes: e.notes ?? null,
      deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
      player: e.player
        ? {
            id: e.player.id,
            playerName: e.player.playerName,
            position: e.player.position
          }
        : null,
      producto: e.producto
        ? {
            id: e.producto.id,
            nombre: e.producto.nombre,
            precio: e.producto.precio
          }
        : null
    })) || undefined;

    const pricing = computePricing(booking);

  return {
      id: booking.id,
      courtId: booking.courtId,
      userId: booking.userId,
      bookingDate: booking.bookingDate.toISOString().split('T')[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMinutes: booking.durationMinutes,
      totalPrice: booking.totalPrice,
      depositAmount: booking.depositAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      notes: booking.notes,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      cancelledAt: booking.cancelledAt?.toISOString() || null,
      closedAt: (booking as any).closedAt ? (booking as any).closedAt.toISOString() : null,
      recurringId: (booking as any).recurringId || null,
      court: {
        id: booking.court.id,
        name: booking.court.name,
        description: booking.court.description,
        basePrice: booking.court.basePrice,
        priceMultiplier: booking.court.priceMultiplier,
        features: this.parseFeatures(booking.court.features),
        isActive: booking.court.isActive,
        operatingHours: this.parseOperatingHours(booking.court.operatingHours)
      },
      user: {
        id: booking.user.id,
        name: booking.user.name || 'Usuario',
        email: booking.user.email,
        phone: booking.user.phone,
        role: booking.user.role
      },
      players: booking.players.map(player => ({
        id: player.id,
        playerName: player.playerName,
        playerPhone: player.playerPhone,
        playerEmail: player.playerEmail,
        hasPaid: player.hasPaid,
        paidAmount: player.paidAmount,
        position: player.position || 0,
        notes: player.notes
      })),
      payments: booking.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentType: payment.paymentType,
        status: payment.status,
        createdAt: payment.createdAt.toISOString()
      })),
      extras,
      pricing
    };
  }

  // Parsear características de la cancha
  private parseFeatures(features: string): string[] {
    try {
      return JSON.parse(features);
    } catch {
      return features ? features.split(',').map(f => f.trim()) : [];
    }
  }

  // Parsear horarios de operación (soporta claves 'open/close' y 'start/end')
  private parseOperatingHours(operatingHours: string): { open: string; close: string } {
    try {
      const parsed = JSON.parse(operatingHours);
      if (parsed && typeof parsed === 'object') {
        const open = typeof parsed.open === 'string' ? parsed.open : (typeof parsed.start === 'string' ? parsed.start : undefined);
        const close = typeof parsed.close === 'string' ? parsed.close : (typeof parsed.end === 'string' ? parsed.end : undefined);
        return {
          open: open || '08:00',
          close: close || '22:00'
        };
      }
      return { open: '08:00', close: '22:00' };
    } catch {
      return { open: '08:00', close: '22:00' };
    }
  }

  // Obtener todas las reservas con filtros y paginación
  async getAllBookings(filters: BookingFilters): Promise<PaginatedResponse<BookingWithDetails>> {
    try {
      const result = await this.repository.findWithPagination(filters);
      
      return {
        success: true,
        message: 'Reservas obtenidas exitosamente',
        data: result.bookings.map(booking => this.transformBookingData(booking)),
        meta: result.meta
      };
    } catch (error) {
      console.error('Error getting bookings:', error);
      throw new Error('Error al obtener las reservas');
    }
  }

  // Obtener reserva por ID
  async getBookingById(id: string): Promise<ApiResponse<BookingWithDetails>> {
    try {
      const booking = await this.repository.findById(id);
      
      if (!booking) {
        return {
          success: false,
          message: 'Reserva no encontrada',
          error: 'Reserva no encontrada'
        };
      }

      return {
        success: true,
        message: 'Reserva encontrada exitosamente',
        data: this.transformBookingData(booking)
      };
    } catch (error) {
      console.error('Error getting booking by ID:', error);
      throw new Error('Error al obtener la reserva');
    }
  }

  // Obtener reservas por usuario
  async getBookingsByUserId(userId: string, limit = 10): Promise<ApiResponse<BookingWithDetails[]>> {
    try {
      const bookings = await this.repository.findByUserId(userId, limit);
      
      return {
        success: true,
        message: 'Reservas obtenidas exitosamente',
        data: bookings.map(booking => this.transformBookingData(booking))
      };
    } catch (error) {
      console.error('Error getting bookings by user ID:', error);
      throw new Error('Error al obtener las reservas del usuario');
    }
  }

  // Verificar disponibilidad
  async checkAvailability(input: CheckAvailabilityInput): Promise<ApiResponse<boolean>> {
    try {
      const isAvailable = await this.repository.checkAvailability(input);
      
      return {
        success: true,
        data: isAvailable,
        message: isAvailable ? 'Horario disponible' : 'Horario no disponible'
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Error al verificar disponibilidad');
    }
  }

  // Obtener slots de disponibilidad para una fecha y cancha
  async getAvailabilitySlots(
    courtId: string,
    date: string,
    durationMinutes = 90
  ): Promise<ApiResponse<BookingAvailabilitySlot[]>> {
    try {
      // Obtener reservas existentes para la fecha
      const existingBookings = await this.repository.findByDateAndCourt(
        courtId,
        this.parseYmd(date)
      );

      // Obtener información de la cancha
      const court = await prisma.court.findUnique({
        where: { id: courtId }
      });

      if (!court) {
        return {
          success: false,
          message: 'Error al obtener disponibilidad',
          error: 'Cancha no encontrada'
        };
      }

      const operatingHours = this.parseOperatingHours(court.operatingHours);
      const slots: BookingAvailabilitySlot[] = [];

      // Generar slots cada 30 minutos
      const startHour = parseInt(operatingHours.open.split(':')[0]);
      const startMinute = parseInt(operatingHours.open.split(':')[1]);
      const endHour = parseInt(operatingHours.close.split(':')[0]);
      const endMinute = parseInt(operatingHours.close.split(':')[1]);

      let currentTime = startHour * 60 + startMinute; // en minutos
      const endTime = endHour * 60 + endMinute;

      while (currentTime + durationMinutes <= endTime) {
        const startTimeStr = this.minutesToTimeString(currentTime);
        const endTimeStr = this.minutesToTimeString(currentTime + durationMinutes);

        // Verificar si hay conflicto con reservas existentes
        const hasConflict = existingBookings.some(booking => {
          const bookingStart = this.timeStringToMinutes(booking.startTime);
          const bookingEnd = this.timeStringToMinutes(booking.endTime);
          
          return (
            (currentTime >= bookingStart && currentTime < bookingEnd) ||
            (currentTime + durationMinutes > bookingStart && currentTime + durationMinutes <= bookingEnd) ||
            (currentTime <= bookingStart && currentTime + durationMinutes >= bookingEnd)
          );
        });

        const computedFinalPrice = Math.round(court.basePrice * court.priceMultiplier);

        slots.push({
          startTime: startTimeStr,
          endTime: endTimeStr,
          available: !hasConflict,
          price: computedFinalPrice,
          finalPrice: computedFinalPrice,
          pricePerPerson: Math.round(computedFinalPrice / 4)
        });

        currentTime += 30; // Incrementar 30 minutos
      }

      return {
        success: true,
        message: 'Slots de disponibilidad obtenidos exitosamente',
        data: slots
      };
    } catch (error) {
      console.error('Error getting availability slots:', error);
      throw new Error('Error al obtener slots de disponibilidad');
    }
  }

  // Crear nueva reserva
  async createBooking(input: CreateBookingInput, userId: string): Promise<ApiResponse<BookingWithDetails>> {
    try {
      // Verificar disponibilidad primero
      const availabilityCheck = await this.checkAvailability({
        courtId: input.courtId,
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime: input.endTime
      });

      if (!availabilityCheck.data) {
        return {
          success: false,
          message: 'El horario seleccionado no está disponible',
          error: 'El horario seleccionado no está disponible'
        };
      }

      // Calcular duración y precio
      const durationMinutes = this.calculateDuration(input.startTime, input.endTime);
      const court = await prisma.court.findUnique({ where: { id: input.courtId } });
      
      if (!court) {
        return {
          success: false,
          message: 'Cancha no encontrada',
          error: 'Cancha no encontrada'
        };
      }

      const totalPrice = court.basePrice * court.priceMultiplier * (durationMinutes / 60);
      const depositAmount = totalPrice * 0.3; // 30% por defecto

      const createData: BookingCreateInput = {
        courtId: input.courtId,
        userId: userId,
        bookingDate: new Date(input.bookingDate),
        startTime: input.startTime,
        endTime: input.endTime,
        durationMinutes,
        totalPrice,
        depositAmount,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        players: input.players
      };

      const booking = await this.repository.create(createData);
      
      return {
        success: true,
        data: this.transformBookingData(booking),
        message: 'Reserva creada exitosamente'
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Error al crear la reserva');
    }
  }

  // Actualizar reserva
  async updateBooking(
    id: string,
    input: UpdateBookingInput,
    userId?: string,
    userRole?: string
  ): Promise<ApiResponse<BookingWithDetails>> {
    try {
      // Verificar que la reserva existe
      const existingBooking = await this.repository.findById(id);
      if (!existingBooking) {
        return {
          success: false,
          message: 'Reserva no encontrada',
          error: 'Reserva no encontrada'
        };
      }

      const isAdmin = userRole === 'ADMIN' || userRole === 'admin'
      if (userId && !isAdmin && existingBooking.userId !== userId) {
        return {
          success: false,
          message: 'Error al actualizar reserva',
          error: 'No tienes permisos para modificar esta reserva'
        };
      }

      // Si se cambian fecha/hora, verificar disponibilidad
      if (input.bookingDate || input.startTime || input.endTime) {
        const availabilityCheck = await this.checkAvailability({
          courtId: existingBooking.courtId,
          bookingDate: input.bookingDate || existingBooking.bookingDate.toISOString().split('T')[0],
          startTime: input.startTime || existingBooking.startTime,
          endTime: input.endTime || existingBooking.endTime,
          excludeBookingId: id
        });

        if (!availabilityCheck.data) {
          return {
            success: false,
            message: 'Error al actualizar reserva',
            error: 'El nuevo horario no está disponible'
          };
        }
      }

      const updateData: BookingUpdateInput = {
        ...(input.bookingDate && { bookingDate: new Date(input.bookingDate) }),
        ...(input.startTime && { startTime: input.startTime }),
        ...(input.endTime && { endTime: input.endTime }),
        ...(input.status && { status: input.status }),
        ...(input.paymentStatus && { paymentStatus: input.paymentStatus }),
        ...(input.paymentMethod && { paymentMethod: input.paymentMethod }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.cancellationReason && { cancellationReason: input.cancellationReason }),
        ...(input.players && { players: input.players })
      };

      const updatedBooking = await this.repository.update(id, updateData);
      
      return {
        success: true,
        data: this.transformBookingData(updatedBooking),
        message: 'Reserva actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error updating booking:', error);
      throw new Error('Error al actualizar la reserva');
    }
  }

  // Actualizar pago de un jugador y recalcular el estado de pago de la reserva
  async updatePlayerPaymentAndRecalc(
    bookingId: string,
    playerId: string,
    input: UpdateBookingPlayerPaymentInput,
    userRole?: string
  ): Promise<ApiResponse<BookingWithDetails>> {
    try {
      const isAdminUpdate = userRole === 'ADMIN' || userRole === 'admin'
      if (!isAdminUpdate) {
        return {
          success: false,
          message: 'Error al actualizar pago del jugador',
          error: 'No tienes permisos para modificar pagos de jugadores'
        };
      }

      // Verificar existencia de la reserva
      const existingBooking = await this.repository.findById(bookingId);
      if (!existingBooking) {
        return {
          success: false,
          message: 'Reserva no encontrada',
          error: 'Reserva no encontrada'
        };
      }

      const updated = await this.repository.updateBookingPlayerPayment(bookingId, playerId, {
        hasPaid: input.hasPaid,
        paidAmount: input.paidAmount
      });

      return {
        success: true,
        data: this.transformBookingData(updated),
        message: 'Pago de jugador actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating player payment:', error);
      throw new Error('Error al actualizar el pago del jugador');
    }
  }

  // Cancelar reserva (soft delete)
  async cancelBooking(
    id: string,
    cancellationReason?: string,
    userId?: string,
    userRole?: string
  ): Promise<ApiResponse<BookingWithDetails>> {
    try {
      // Verificar que la reserva existe
      const existingBooking = await this.repository.findById(id);
      if (!existingBooking) {
        return {
          success: false,
          message: 'Reserva no encontrada',
          error: 'Reserva no encontrada'
        };
      }

      const isAdminCancel = userRole === 'ADMIN' || userRole === 'admin'
      if (userId && !isAdminCancel && existingBooking.userId !== userId) {
        return {
          success: false,
          message: 'Error al cancelar reserva',
          error: 'No tienes permisos para cancelar esta reserva'
        };
      }

      // Verificar que no esté ya cancelada
      if (existingBooking.status === 'CANCELLED') {
        return {
          success: false,
          message: 'Error al cancelar reserva',
          error: 'La reserva ya está cancelada'
        };
      }

      const cancelledBooking = await this.repository.softDelete(id, cancellationReason);
      
      return {
        success: true,
        data: this.transformBookingData(cancelledBooking),
        message: 'Reserva cancelada exitosamente'
      };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw new Error('Error al cancelar la reserva');
    }
  }

  // Operaciones bulk
  async bulkUpdateBookings(
    input: BulkUpdateBookingsInput,
    userRole?: string
  ): Promise<ApiResponse<{ count: number }>> {
    try {
      const isAdminBulk = userRole === 'ADMIN' || userRole === 'admin'
      if (!isAdminBulk) {
        return {
          success: false,
          message: 'Error en operación masiva',
          error: 'No tienes permisos para realizar operaciones masivas'
        };
      }

      const result = await this.repository.bulkUpdate(input);
      
      return {
        success: true,
        data: result,
        message: `${result.count} reservas actualizadas exitosamente`
      };
    } catch (error) {
      console.error('Error bulk updating bookings:', error);
      throw new Error('Error al actualizar reservas masivamente');
    }
  }

  // Obtener estadísticas
  async getBookingStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<BookingStats>> {
    try {
      const stats = await this.repository.getStats(
        dateFrom ? new Date(dateFrom) : undefined,
        dateTo ? new Date(dateTo) : undefined
      );

      // Calcular tasa de ocupación (ejemplo simplificado)
      const occupancyRate = stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0;

      return {
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          ...stats,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        }
      };
    } catch (error) {
      console.error('Error getting booking stats:', error);
      throw new Error('Error al obtener estadísticas');
    }
  }

  // Utilidades privadas
  private calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);
    return end - start;
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

// Instancia singleton del servicio
export const bookingService = new BookingService();
