/**
 * Servicio para cancelar reservas expiradas automáticamente
 * Este servicio debe ejecutarse periódicamente (ej: cada 5 minutos) vía cron job
 */

import { prisma } from '../../prisma';

export class ExpiredBookingsService {
  /**
   * Cancela todas las reservas que han expirado sin pago
   * @returns Número de reservas canceladas
   */
  async cancelExpiredBookings(): Promise<number> {
    const now = new Date();

    try {
      // Buscar reservas expiradas con status PENDING
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            lt: now // expiresAt < now
          }
        },
        select: {
          id: true,
          courtId: true,
          bookingDate: true,
          startTime: true,
          endTime: true
        }
      });

      if (expiredBookings.length === 0) {
        return 0;
      }

      // Cancelar todas las reservas expiradas
      const result = await prisma.booking.updateMany({
        where: {
          id: {
            in: expiredBookings.map(b => b.id)
          },
          status: 'PENDING',
          expiresAt: {
            lt: now
          }
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: 'Timeout: pago no completado dentro del tiempo límite',
          updatedAt: now
        }
      });

      console.log(`[ExpiredBookingsService] Canceladas ${result.count} reservas expiradas`);

      return result.count;
    } catch (error) {
      console.error('Error cancelando reservas expiradas:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de reservas expiradas
   */
  async getExpiredBookingsStats(): Promise<{
    totalExpired: number;
    expiredIds: string[];
  }> {
    const now = new Date();

    try {
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            lt: now
          }
        },
        select: {
          id: true
        }
      });

      return {
        totalExpired: expiredBookings.length,
        expiredIds: expiredBookings.map(b => b.id)
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de reservas expiradas:', error);
      throw error;
    }
  }
}


