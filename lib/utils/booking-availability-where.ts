import type { Prisma } from '@prisma/client';

/**
 * Condición Prisma para considerar solo reservas que "ocupan" el slot:
 * - No canceladas
 * - Si están PENDING, solo cuentan si no han expirado (expiresAt null o expiresAt > now).
 * Las PENDING con expiresAt < now no bloquean disponibilidad (se tratan como liberadas).
 */
export function bookingOccupancyWhere(now: Date = new Date()): Prisma.BookingWhereInput {
  return {
    status: { not: 'CANCELLED' },
    OR: [
      { status: { not: 'PENDING' } },
      { status: 'PENDING', expiresAt: null },
      { status: 'PENDING', expiresAt: { gt: now } },
    ],
  };
}
