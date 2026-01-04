/**
 * Servicio para cancelar reservas expiradas automáticamente
 * Este servicio debe ejecutarse periódicamente (ej: cada 5 minutos) vía cron job
 * 
 * Soporta multitenancy: puede procesar un tenant específico o todos los tenants (solo super admin)
 */

import { prisma } from '../../database/neon-config';

export class ExpiredBookingsService {
  /**
   * Cancela todas las reservas que han expirado sin pago
   * @param tenantId - ID del tenant (opcional). Si no se proporciona, procesa todos los tenants (solo para super admin)
   * @returns Número de reservas canceladas
   */
  async cancelExpiredBookings(tenantId?: string | null): Promise<number> {
    const now = new Date();

    try {
      // Construir filtro base
      const whereClause: any = {
        status: 'PENDING',
        expiresAt: {
          lt: now // expiresAt < now
        }
      };

      // Si se proporciona tenantId, filtrar por tenant
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      // Buscar reservas expiradas con status PENDING
      const expiredBookings = await prisma.booking.findMany({
        where: whereClause,
        select: {
          id: true,
          tenantId: true,
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

      const tenantInfo = tenantId ? ` (tenant: ${tenantId})` : ' (todos los tenants)';
      console.log(`[ExpiredBookingsService] Canceladas ${result.count} reservas expiradas${tenantInfo}`);

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



