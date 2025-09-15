import { PrismaClient, Booking, BookingStatus, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { BookingFilters, CheckAvailabilityInput, BulkUpdateBookingsInput } from '../validations/booking';
import { calculatePaginationMeta } from '../validations/common';

// Tipos para el repository
export type BookingWithRelations = Booking & {
  court: {
    id: string;
    name: string;
    description: string | null;
    basePrice: number;
    priceMultiplier: number;
    features: string;
    isActive: boolean;
    operatingHours: string;
  };
  user: {
    id: string;
    name: string | null;
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
    position: number | null;
    notes: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentType: string;
    status: string;
    createdAt: Date;
  }>;
};

export type BookingCreateInput = {
  courtId: string;
  userId: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  depositAmount?: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
  players?: Array<{
    playerName: string;
    playerPhone?: string;
    playerEmail?: string;
    position?: number;
  }>;
};

export type BookingUpdateInput = {
  bookingDate?: Date;
  startTime?: string;
  endTime?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  cancellationReason?: string;
  players?: Array<{
    id?: string;
    playerName: string;
    playerPhone?: string;
    playerEmail?: string;
    position?: number;
    hasPaid?: boolean;
    paidAmount?: number;
  }>;
};

export type BookingSearchResult = {
  bookings: BookingWithRelations[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export class BookingRepository {
  constructor(private prisma: PrismaClient) {}

  // Incluir relaciones estándar
  private getIncludeRelations() {
    return {
      court: {
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          priceMultiplier: true,
          features: true,
          isActive: true,
          operatingHours: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true
        }
      },
      players: {
        select: {
          id: true,
          playerName: true,
          playerPhone: true,
          playerEmail: true,
          hasPaid: true,
          paidAmount: true,
          position: true,
          notes: true
        },
        orderBy: { position: 'asc' as const }
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          paymentType: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' as const }
      }
    };
  }

  // Buscar con paginación y filtros
  async findWithPagination(filters: BookingFilters): Promise<BookingSearchResult> {
    const {
      page,
      limit,
      courtId,
      userId,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder
    } = filters;

    // Construir condiciones WHERE
    const where: Prisma.BookingWhereInput = {
      // Excluir soft deleted (si implementamos deletedAt)
      // deletedAt: null,
      ...(courtId && { courtId }),
      ...(userId && { userId }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(dateFrom || dateTo) && {
        bookingDate: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) })
        }
      }
    };

    // Construir ordenación
    const orderBy: Prisma.BookingOrderByWithRelationInput = {};
    if (sortBy === 'bookingDate') {
      orderBy.bookingDate = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'totalPrice') {
      orderBy.totalPrice = sortOrder;
    }

    // Ejecutar consultas en paralelo
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: this.getIncludeRelations(),
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.booking.count({ where })
    ]);

    return {
      bookings: bookings as BookingWithRelations[],
      meta: calculatePaginationMeta(page, limit, total)
    };
  }

  // Buscar por ID
  async findById(id: string): Promise<BookingWithRelations | null> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: this.getIncludeRelations()
    });

    return booking as BookingWithRelations | null;
  }

  // Buscar por usuario
  async findByUserId(userId: string, limit = 10): Promise<BookingWithRelations[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: this.getIncludeRelations(),
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'desc' }],
      take: limit
    });

    return bookings as BookingWithRelations[];
  }

  // Verificar disponibilidad
  async checkAvailability(input: CheckAvailabilityInput): Promise<boolean> {
    const { courtId, bookingDate, startTime, endTime, excludeBookingId } = input;

    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        courtId,
        bookingDate: new Date(bookingDate),
        status: { not: 'CANCELLED' },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        OR: [
          // Caso 1: Nueva reserva empieza durante una existente
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          // Caso 2: Nueva reserva termina durante una existente
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          // Caso 3: Nueva reserva contiene completamente una existente
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ]
      }
    });

    return !conflictingBooking;
  }

  // Crear reserva con transacción
  async create(data: BookingCreateInput): Promise<BookingWithRelations> {
    return await this.prisma.$transaction(async (tx) => {
      // Crear la reserva
      const booking = await tx.booking.create({
        data: {
          courtId: data.courtId,
          userId: data.userId,
          bookingDate: data.bookingDate,
          startTime: data.startTime,
          endTime: data.endTime,
          durationMinutes: data.durationMinutes,
          totalPrice: data.totalPrice,
          depositAmount: data.depositAmount || 0,
          notes: data.notes,
          paymentMethod: data.paymentMethod,
          status: 'PENDING',
          paymentStatus: 'PENDING'
        }
      });

      // Crear jugadores si se proporcionan
      if (data.players && data.players.length > 0) {
        await tx.bookingPlayer.createMany({
          data: data.players.map((player, index) => ({
            bookingId: booking.id,
            playerName: player.playerName,
            playerPhone: player.playerPhone,
            playerEmail: player.playerEmail,
            position: player.position || index + 1
          }))
        });
      }

      // Obtener la reserva completa con relaciones
      const completeBooking = await tx.booking.findUnique({
        where: { id: booking.id },
        include: this.getIncludeRelations()
      });

      return completeBooking as BookingWithRelations;
    });
  }

  // Actualizar reserva
  async update(id: string, data: BookingUpdateInput): Promise<BookingWithRelations> {
    return await this.prisma.$transaction(async (tx) => {
      // Preparar datos de actualización
      const updateData: Prisma.BookingUpdateInput = {
        ...(data.bookingDate && { bookingDate: data.bookingDate }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.status && { status: data.status }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.cancellationReason && { cancellationReason: data.cancellationReason }),
        updatedAt: new Date()
      };

      // Si se está cancelando, agregar timestamp
      if (data.status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }

      // Actualizar la reserva
      await tx.booking.update({
        where: { id },
        data: updateData
      });

      // Actualizar jugadores si se proporcionan
      if (data.players) {
        // Eliminar jugadores existentes
        await tx.bookingPlayer.deleteMany({
          where: { bookingId: id }
        });

        // Crear nuevos jugadores
        if (data.players.length > 0) {
          await tx.bookingPlayer.createMany({
            data: data.players.map((player, index) => ({
              bookingId: id,
              playerName: player.playerName,
              playerPhone: player.playerPhone,
              playerEmail: player.playerEmail,
              position: player.position || index + 1,
              hasPaid: player.hasPaid || false,
              paidAmount: player.paidAmount || 0
            }))
          });
        }
      }

      // Obtener la reserva actualizada
      const updatedBooking = await tx.booking.findUnique({
        where: { id },
        include: this.getIncludeRelations()
      });

      return updatedBooking as BookingWithRelations;
    });
  }

  // Soft delete (cancelar)
  async softDelete(id: string, cancellationReason?: string): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason,
        updatedAt: new Date()
      },
      include: this.getIncludeRelations()
    });

    return booking as BookingWithRelations;
  }

  // Operaciones bulk
  async bulkUpdate(input: BulkUpdateBookingsInput): Promise<{ count: number }> {
    const { bookingIds, updates } = input;

    const updateData: Prisma.BookingUpdateManyArgs['data'] = {
      ...(updates.status && { status: updates.status }),
      ...(updates.paymentStatus && { paymentStatus: updates.paymentStatus }),
      ...(updates.cancellationReason && { cancellationReason: updates.cancellationReason }),
      updatedAt: new Date()
    };

    // Si se está cancelando, agregar timestamp
    if (updates.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: { in: bookingIds }
      },
      data: updateData
    });

    return { count: result.count };
  }

  // Obtener reservas por fecha y cancha (para calendario)
  async findByDateAndCourt(
    courtId: string,
    date: Date
  ): Promise<BookingWithRelations[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: date,
        status: { not: 'CANCELLED' }
      },
      include: this.getIncludeRelations(),
      orderBy: { startTime: 'asc' }
    });

    return bookings as BookingWithRelations[];
  }

  // Obtener estadísticas
  async getStats(dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.BookingWhereInput = {
      ...(dateFrom || dateTo) && {
        bookingDate: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo })
        }
      }
    };

    const [total, confirmed, cancelled, revenue] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.booking.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { totalPrice: true }
      })
    ]);

    return {
      total,
      confirmed,
      cancelled,
      pending: total - confirmed - cancelled,
      revenue: revenue._sum.totalPrice || 0
    };
  }

  // Eliminar físicamente (solo para admin/testing)
  async hardDelete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Eliminar jugadores primero
      await tx.bookingPlayer.deleteMany({
        where: { bookingId: id }
      });

      // Eliminar pagos
      await tx.payment.deleteMany({
        where: { bookingId: id }
      });

      // Eliminar reserva
      await tx.booking.delete({
        where: { id }
      });
    });
  }
}