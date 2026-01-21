/**
 * Handler genérico para webhooks de pagos relacionados con reservas
 */

import { prisma } from '@/lib/database/neon-config';
import type { IWebhookHandler, WebhookPayload, WebhookResult } from './interfaces/IWebhookHandler';
import { processRefund } from './RefundService';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getTenantMercadoPagoCredentials } from './tenant-credentials';

/**
 * Obtiene los datos del pago desde la API de Mercado Pago
 */
async function getMercadoPagoPaymentData(
  paymentId: string,
  accessToken?: string
): Promise<any> {
  const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    console.warn(
      '[BookingWebhookHandler] No hay accessToken disponible para obtener datos del pago'
    );
    return null;
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 },
    });
    const payment = new Payment(client);
    return await payment.get({ id: paymentId });
  } catch (error) {
    console.error('[BookingWebhookHandler] Error obteniendo pago de Mercado Pago:', error);
    return null;
  }
}

export class BookingWebhookHandler implements IWebhookHandler {
  async handle(payload: WebhookPayload): Promise<WebhookResult> {
    try {
      if (!payload.type || !payload.data) {
        return { processed: false, error: 'Formato de webhook inválido' };
      }

      // Solo procesar notificaciones de payment
      if (payload.type !== 'payment') {
        return { processed: true, bookingUpdated: false };
      }

      let paymentData = payload.data;
      let paymentStatus: string = '';
      let paymentId: string | number | undefined;
      let bookingId: string | undefined;

      // Intentar obtener bookingId si viene (modo mock u otros proveedores)
      if (paymentData?.external_reference) {
        bookingId = paymentData.external_reference;
      }

      // Si el payload tiene un ID pero no los datos completos, consultar API de MP
      let tenantAccessToken: string | undefined;
      if (payload.data?.id && !payload.data?.status) {
        // Si tenemos bookingId, intentar credenciales del tenant (para consultar API con token tenant)
        if (bookingId) {
          try {
            const booking = await prisma.booking.findUnique({
              where: { id: bookingId },
              select: { tenantId: true },
            });

            if (booking?.tenantId) {
              const credentials = await getTenantMercadoPagoCredentials(booking.tenantId);
              tenantAccessToken = credentials.accessToken;
            }
          } catch (error) {
            console.warn(
              `[BookingWebhookHandler] Error obteniendo credenciales del tenant para booking ${bookingId}, usando fallback global:`,
              error
            );
          }
        }

        const mpPaymentData = await getMercadoPagoPaymentData(
          payload.data.id.toString(),
          tenantAccessToken
        );

        if (mpPaymentData) {
          paymentData = mpPaymentData;
          paymentStatus = mpPaymentData.status || '';
          paymentId = mpPaymentData.id || payload.data.id;
          bookingId = mpPaymentData.external_reference || bookingId;
        } else {
          paymentStatus = payload.data.status || '';
          paymentId = payload.data.id;
          bookingId = payload.data.external_reference || bookingId;
        }
      } else {
        paymentStatus = paymentData.status || '';
        paymentId = paymentData.id;
        bookingId = paymentData.external_reference || bookingId;
      }

      if (!bookingId) {
        console.error('[BookingWebhookHandler] Payment sin external_reference:', paymentId);
        return { processed: false, error: 'Payment sin referencia de reserva' };
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          court: true,
          payments: {
            where: {
              paymentType: 'PAYMENT',
              status: 'completed',
            },
          },
        },
      });

      if (!booking) {
        console.error('[BookingWebhookHandler] Reserva no encontrada:', bookingId);
        return { processed: false, error: 'Reserva no encontrada' };
      }

      const tenantId = booking.tenantId;

      // Caso Normal: Pago aprobado y reserva en PENDING
      if (paymentStatus === 'approved' && booking.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'DEPOSIT_PAID',
              expiresAt: null,
              updatedAt: new Date(),
            },
          });

          // Importante: montos en ARS (pesos). MP devuelve transaction_amount en pesos.
          const amount = paymentData.transaction_amount
            ? Math.round(Number(paymentData.transaction_amount))
            : booking.depositAmount;

          await tx.payment.create({
            data: {
              tenantId,
              bookingId,
              amount,
              paymentMethod: 'CARD',
              paymentType: 'PAYMENT',
              referenceNumber: paymentId?.toString(),
              status: 'completed',
              notes: `Pago aprobado vía webhook - MP Payment ID: ${paymentId}`,
            },
          });
        });

        return { processed: true, bookingUpdated: true, bookingId };
      }

      // Caso borde: pago aprobado pero la reserva está CANCELLED (pago tardío)
      if (paymentStatus === 'approved' && booking.status === 'CANCELLED') {
        const [y, m, d] = booking.bookingDate
          .toISOString()
          .split('T')[0]
          .split('-')
          .map(Number);
        const bookingDateLocal = new Date(y, m - 1, d);
        const now = new Date();

        const conflictingBooking = await prisma.booking.findFirst({
          where: {
            AND: [
              {
                courtId: booking.courtId,
                bookingDate: bookingDateLocal,
                status: { not: 'CANCELLED' },
                id: { not: bookingId },
              },
              {
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
              {
                OR: [
                  {
                    startTime: { lte: booking.startTime },
                    endTime: { gt: booking.startTime },
                  },
                  {
                    startTime: { lt: booking.endTime },
                    endTime: { gte: booking.endTime },
                  },
                  {
                    startTime: { gte: booking.startTime },
                    endTime: { lte: booking.endTime },
                  },
                ],
              },
            ],
          },
        });

        const amount = paymentData.transaction_amount
          ? Math.round(Number(paymentData.transaction_amount))
          : booking.depositAmount;

        // Si la cancha sigue libre - Reactivar la reserva
        if (!conflictingBooking) {
          await prisma.$transaction(async (tx) => {
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: 'CONFIRMED',
                paymentStatus: 'DEPOSIT_PAID',
                expiresAt: null,
                cancelledAt: null,
                cancellationReason: null,
                updatedAt: new Date(),
              },
            });

            await tx.payment.create({
              data: {
                tenantId,
                bookingId,
                amount,
                paymentMethod: 'CARD',
                paymentType: 'PAYMENT',
                referenceNumber: paymentId?.toString(),
                status: 'completed',
                notes: `Pago tardío aprobado - Reserva reactivada - MP Payment ID: ${paymentId}`,
              },
            });
          });

          return { processed: true, bookingUpdated: true, bookingId };
        }

        // Si la cancha está ocupada: registrar pago + intentar reembolso automático.
        await prisma.$transaction(async (tx) => {
          // Mantener CANCELLED (no existe PAYMENT_CONFLICT en el enum de la app raíz).
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              cancellationReason:
                booking.cancellationReason ||
                `Pago tardío recibido pero cancha ocupada (conflicto con booking ${conflictingBooking.id}).`,
              updatedAt: new Date(),
            },
          });

          const paymentRecord = await tx.payment.create({
            data: {
              tenantId,
              bookingId,
              amount,
              paymentMethod: 'CARD',
              paymentType: 'PAYMENT',
              referenceNumber: paymentId?.toString(),
              status: 'completed',
              notes: `PAGO TARDÍO CON CONFLICTO - Cancha ya ocupada - MP Payment ID: ${paymentId}. Se intentará reembolso automático.`,
            },
          });

          let refundStatus: 'success' | 'failed' | 'pending' = 'pending';
          let refundError: string | undefined;

          try {
            const refundResult = await processRefund({
              bookingId,
              paymentId: paymentRecord.id,
              amount: paymentRecord.amount,
              externalPaymentId: paymentId?.toString() || '',
              reason: 'Pago tardío recibido pero cancha ya ocupada',
              tenantId,
            });

            if (refundResult.success) {
              refundStatus = 'success';
            } else {
              refundStatus = 'failed';
              refundError = refundResult.error || 'Error desconocido en reembolso';
            }
          } catch (error) {
            console.error(
              '[BookingWebhookHandler] Error procesando reembolso automático en conflicto:',
              error
            );
            refundStatus = 'failed';
            refundError = error instanceof Error ? error.message : 'Error desconocido en reembolso';
          }

          // Notificación (best-effort). En la app raíz este servicio es liviano (solo log).
          try {
            const { notifyPaymentConflict } = await import('@/lib/services/AdminNotificationService');
            await notifyPaymentConflict({
              bookingId,
              paymentId: paymentId?.toString() || '',
              conflictingBookingId: conflictingBooking.id,
              refundStatus,
              refundError,
            });
          } catch (notificationError) {
            console.error(
              '[BookingWebhookHandler] Error enviando notificación de conflicto:',
              notificationError
            );
          }
        });

        console.error('[BookingWebhookHandler] PAYMENT_CONFLICT (soft):', {
          bookingId,
          paymentId,
          conflictingBookingId: conflictingBooking.id,
        });

        return {
          processed: true,
          bookingUpdated: true,
          bookingId,
          error:
            'Pago tardío recibido pero cancha ocupada. Se registró el pago y se intentó reembolso automático.',
        };
      }

      // Otros estados de pago (pending, rejected, etc.)
      return { processed: true, bookingUpdated: false, bookingId };
    } catch (error) {
      console.error('[BookingWebhookHandler] Error procesando webhook de pago:', error);
      return {
        processed: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      };
    }
  }
}

