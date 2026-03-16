/**
 * Servicio para cancelar reservas PENDING que ya no aplican como "pendientes":
 * - Con expiresAt pasada (tiempo límite de pago)
 * - Con slot ya pasado (bookingDate + endTime < now) sin pago — turnos viejos mal etiquetados
 *
 * Se invoca de forma lazy al consultar /api/slots, /api/bookings/availability y /api/bookings/user (por tenant),
 * y como respaldo 1 vez al día vía cron en /api/jobs/cancel-expired-bookings.
 *
 * Soporta multitenancy: puede procesar un tenant específico o todos los tenants (solo super admin).
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/neon-config';
import { buildExpiredPendingWithoutPaymentsWhere } from './expired-bookings-where';

/** Devuelve el instante de fin del slot (bookingDate + endTime) en hora local. */
function getSlotEnd(bookingDate: Date, endTime: string): Date {
  const end = new Date(bookingDate);
  const [h, m] = String(endTime || '00:00').split(':').map(Number);
  end.setHours(h ?? 0, m ?? 0, 0, 0);
  return end;
}

export class ExpiredBookingsService {
  /**
   * Cancela todas las reservas PENDING sin pago que han expirado (expiresAt) o cuyo slot ya pasó.
   * Así los turnos viejos no pagados/cancelados dejan de mostrarse como "Pendiente" en Mis Turnos.
   * @param tenantId - ID del tenant (opcional). Si no se proporciona, procesa todos los tenants (solo para super admin)
   * @returns Número de reservas canceladas
   */
  async cancelExpiredBookings(tenantId?: string | null): Promise<number> {
    const now = new Date();

    try {
      // 1) Cancelar por expiresAt pasada (comportamiento existente)
      const whereClause = buildExpiredPendingWithoutPaymentsWhere(now, tenantId ?? undefined);
      const expiredByPaymentWindow = await prisma.booking.findMany({
        where: whereClause as Prisma.BookingWhereInput,
        select: {
          id: true,
          tenantId: true,
          courtId: true,
          bookingDate: true,
          startTime: true,
          endTime: true
        }
      });

      const toCancelIds = new Set(expiredByPaymentWindow.map(b => b.id));

      // 2) Cancelar PENDING sin pago cuyo slot ya pasó (turnos viejos mal etiquetados como pending)
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 90);
      const pendingNoPaymentWhere: Prisma.BookingWhereInput = {
        status: 'PENDING',
        payments: { none: {} },
        bookingDate: { gte: cutoff }
      };
      if (tenantId) pendingNoPaymentWhere.tenantId = tenantId;

      const pendingSlots = await prisma.booking.findMany({
        where: pendingNoPaymentWhere,
        select: {
          id: true,
          bookingDate: true,
          endTime: true
        }
      });

      for (const b of pendingSlots) {
        if (toCancelIds.has(b.id)) continue;
        const slotEnd = getSlotEnd(b.bookingDate, b.endTime);
        if (slotEnd < now) toCancelIds.add(b.id);
      }

      if (toCancelIds.size === 0) {
        return 0;
      }

      const result = await prisma.booking.updateMany({
        where: {
          id: { in: Array.from(toCancelIds) },
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: 'Timeout: pago no completado dentro del tiempo límite o turno ya pasado',
          updatedAt: now
        }
      });

      const tenantInfo = tenantId ? ` (tenant: ${tenantId})` : ' (todos los tenants)';
      console.log(`[ExpiredBookingsService] Canceladas ${result.count} reservas expiradas/slot pasado${tenantInfo}`);

      return result.count;
    } catch (error) {
      console.error('Error cancelando reservas expiradas:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de reservas expiradas
   * @param tenantId - ID del tenant (opcional). Si no se proporciona, procesa todos los tenants
   */
  async getExpiredBookingsStats(tenantId?: string | null): Promise<{
    totalExpired: number;
    expiredIds: string[];
    byTenant?: Record<string, number>;
  }> {
    const now = new Date();

    try {
      // Construir filtro base
      const whereClause: any = {
        status: 'PENDING',
        expiresAt: {
          lt: now
        }
      };

      // Si se proporciona tenantId, filtrar por tenant
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const expiredBookings = await prisma.booking.findMany({
        where: whereClause,
        select: {
          id: true,
          tenantId: true
        }
      });

      // Si no se filtró por tenant, agrupar por tenant
      let byTenant: Record<string, number> | undefined;
      if (!tenantId) {
        byTenant = {};
        expiredBookings.forEach(booking => {
          const tid = booking.tenantId;
          byTenant![tid] = (byTenant![tid] || 0) + 1;
        });
      }

      return {
        totalExpired: expiredBookings.length,
        expiredIds: expiredBookings.map(b => b.id),
        byTenant
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de reservas expiradas:', error);
      throw error;
    }
  }
}



