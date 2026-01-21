/**
 * Handler genérico para webhooks de pagos relacionados con reservas
 * Implementa la lógica de negocio para PAYMENT_CONFLICT y otros casos edge
 */

import { prisma } from '../../database/neon-config';
import { IWebhookHandler, WebhookPayload, WebhookResult } from './interfaces/IWebhookHandler';
import { processRefund } from './RefundService';
import { BookingRepository } from '../../repositories/BookingRepository';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getTenantMercadoPagoCredentials } from './tenant-credentials';

const bookingRepository = new BookingRepository(prisma);

/**
 * Obtiene los datos del pago desde la API de Mercado Pago
 * 
 * @param paymentId - ID del pago en Mercado Pago
 * @param accessToken - Access token de Mercado Pago (opcional, usa variable de entorno si no se proporciona)
 */
async function getMercadoPagoPaymentData(paymentId: string, accessToken?: string): Promise<any> {
  const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    console.warn('[BookingWebhookHandler] No hay accessToken disponible para obtener datos del pago');
    return null;
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 }
    });
    const payment = new Payment(client);
    const mpPayment = await payment.get({ id: paymentId });
    return mpPayment;
  } catch (error) {
    console.error('[BookingWebhookHandler] Error obteniendo pago de Mercado Pago:', error);
    return null;
  }
}

export class BookingWebhookHandler implements IWebhookHandler {
  async handle(payload: WebhookPayload): Promise<WebhookResult> {
    try {
      // Validar que sea una notificación de pago
      if (!payload.type || !payload.data) {
        return {
          processed: false,
          error: 'Formato de webhook inválido'
        };
      }

      // Solo procesar notificaciones de payment
      if (payload.type !== 'payment') {
        return {
          processed: true,
          bookingUpdated: false
        };
      }

      // Obtener información del pago
      // Si es Mercado Pago, el payload tiene estructura: { type: 'payment', data: { id: '123456789' } }
      // Necesitamos consultar la API de MP para obtener los detalles completos
      let paymentData = payload.data;
      let paymentStatus: string;
      let paymentId: string | number;
      let bookingId: string | undefined;

      // Obtener bookingId del external_reference si está disponible
      if (!bookingId && paymentData.external_reference) {
        bookingId = paymentData.external_reference;
      }
      
      // Si el payload tiene un ID pero no los datos completos, necesitamos obtener el booking primero
      // para obtener las credenciales del tenant
      let tenantAccessToken: string | undefined;
      
      if (payload.data?.id && !payload.data?.status) {
        // Intentar obtener bookingId del external_reference si está disponible
        if (!bookingId && payload.data.external_reference) {
          bookingId = payload.data.external_reference;
        }
        
        // Si tenemos bookingId, obtener credenciales del tenant antes de consultar API
        if (bookingId) {
          try {
            const booking = await prisma.booking.findUnique({
              where: { id: bookingId },
              select: { tenantId: true }
            });
            
            if (booking?.tenantId) {
              const credentials = await getTenantMercadoPagoCredentials(booking.tenantId);
              tenantAccessToken = credentials.accessToken;
              console.log(`[BookingWebhookHandler] Usando credenciales del tenant ${booking.tenantId} para obtener datos del pago`);
            }
          } catch (error) {
            console.warn(`[BookingWebhookHandler] Error obteniendo credenciales del tenant, usando fallback global:`, error);
          }
        }
        
        // Obtener datos del pago con credenciales del tenant o fallback global
        const mpPaymentData = await getMercadoPagoPaymentData(payload.data.id.toString(), tenantAccessToken);
        if (mpPaymentData) {
          paymentData = mpPaymentData;
          paymentStatus = mpPaymentData.status || '';
          paymentId = mpPaymentData.id || payload.data.id;
          bookingId = mpPaymentData.external_reference || bookingId;
        } else {
          // Si no pudimos obtener los datos, usar lo que viene en el payload
          paymentStatus = payload.data.status || '';
          paymentId = payload.data.id;
          bookingId = payload.data.external_reference || bookingId;
        }
      } else {
        // Datos completos ya vienen en el payload (modo mock o otro proveedor)
        paymentStatus = paymentData.status;
        paymentId = paymentData.id;
        bookingId = paymentData.external_reference || bookingId;
      }

      if (!bookingId) {
        console.error('Payment sin external_reference:', paymentId);
        return {
          processed: false,
          error: 'Payment sin referencia de reserva'
        };
      }

      // Buscar la reserva en la BD
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { 
          court: true,
          payments: {
            where: {
              paymentType: 'PAYMENT',
              status: 'completed'
            }
          }
        }
      });

      if (!booking) {
        console.error('Reserva no encontrada:', bookingId);
        return {
          processed: false,
          error: 'Reserva no encontrada'
        };
      }
      
      // Obtener tenantId del booking para usar en operaciones posteriores
      const tenantId = booking.tenantId;

      // Caso Normal: Pago aprobado y reserva en PENDING
      if (paymentStatus === 'approved' && booking.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          // Actualizar estado de la reserva
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'DEPOSIT_PAID', // O 'FULLY_PAID' según la lógica de negocio
              expiresAt: null, // Limpiar expiración ya que el pago fue exitoso
              updatedAt: new Date()
            }
          });

          // Registrar el pago en la tabla Payment
          await tx.payment.create({
            data: {
              bookingId: bookingId,
              amount: paymentData.transaction_amount ? paymentData.transaction_amount * 100 : booking.depositAmount, // Convertir a centavos
              paymentMethod: 'CARD',
              paymentType: 'PAYMENT',
              referenceNumber: paymentId?.toString(),
              status: 'completed',
              notes: `Pago aprobado vía webhook - Payment ID: ${paymentId}`
            }
          });
        });

        return {
          processed: true,
          bookingUpdated: true,
          bookingId
        };
      }

      // Caso Borde: Pago tardío (reserva CANCELLED o expirada)
      if (paymentStatus === 'approved' && booking.status === 'CANCELLED') {
        // Re-verificación de disponibilidad INMEDIATA
        const [y, m, d] = booking.bookingDate.toISOString().split('T')[0].split('-').map(Number);
        const bookingDateLocal = new Date(y, m - 1, d);
        const now = new Date();

        const conflictingBooking = await prisma.booking.findFirst({
          where: {
            AND: [
              {
                courtId: booking.courtId,
                bookingDate: bookingDateLocal,
                status: { notIn: ['CANCELLED', 'PAYMENT_CONFLICT'] },
                id: { not: bookingId }
              },
              {
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: now } }
                ]
              },
              {
                OR: [
                  {
                    startTime: { lte: booking.startTime },
                    endTime: { gt: booking.startTime }
                  },
                  {
                    startTime: { lt: booking.endTime },
                    endTime: { gte: booking.endTime }
                  },
                  {
                    startTime: { gte: booking.startTime },
                    endTime: { lte: booking.endTime }
                  }
                ]
              }
            ]
          }
        });

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
                updatedAt: new Date()
              }
            });

            await tx.payment.create({
              data: {
                bookingId: bookingId,
                amount: paymentData.transaction_amount ? paymentData.transaction_amount * 100 : booking.depositAmount,
                paymentMethod: 'CARD',
                paymentType: 'PAYMENT',
                referenceNumber: paymentId?.toString(),
                status: 'completed',
                notes: `Pago tardío aprobado - Reserva reactivada - Payment ID: ${paymentId}`
              }
            });
          });

          return {
            processed: true,
            bookingUpdated: true,
            bookingId
          };
        }

        // Si la cancha está ocupada - NO confirmar, marcar como PAYMENT_CONFLICT
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'PAYMENT_CONFLICT',
              updatedAt: new Date()
            }
          });

          // Registrar el pago pero con nota de conflicto
          const paymentRecord = await tx.payment.create({
            data: {
              bookingId: bookingId,
              amount: paymentData.transaction_amount ? paymentData.transaction_amount * 100 : booking.depositAmount,
              paymentMethod: 'CARD',
              paymentType: 'PAYMENT',
              referenceNumber: paymentId?.toString(),
              status: 'completed',
              notes: `PAGO TARDÍO CON CONFLICTO - Cancha ya ocupada - Payment ID: ${paymentId}. REQUIERE REEMBOLSO MANUAL.`
            }
          });

          // Procesar reembolso automático
          let refundStatus: 'success' | 'failed' | 'pending' = 'pending';
          let refundError: string | undefined;

          try {
            const refundResult = await processRefund({
              bookingId,
              paymentId: paymentRecord.id,
              amount: paymentRecord.amount,
              externalPaymentId: paymentId?.toString() || '',
              reason: 'Pago tardío recibido pero cancha ya ocupada',
              tenantId: tenantId // Pasar tenantId para usar credenciales del tenant
            });

            if (refundResult.success) {
              refundStatus = 'success';
            } else {
              refundStatus = 'failed';
              refundError = refundResult.error || 'Error desconocido en reembolso';
            }
          } catch (error) {
            console.error('Error procesando reembolso automático en PAYMENT_CONFLICT:', error);
            refundStatus = 'failed';
            refundError = error instanceof Error ? error.message : 'Error desconocido en reembolso';
          }

          // Enviar notificación a administradores
          try {
            const { notifyPaymentConflict } = await import('../AdminNotificationService');
            await notifyPaymentConflict({
              bookingId,
              paymentId: paymentId?.toString() || '',
              conflictingBookingId: conflictingBooking.id,
              refundStatus,
              refundError,
            });
          } catch (notificationError) {
            console.error('Error enviando notificación de PAYMENT_CONFLICT:', notificationError);
            // No fallar si la notificación falla, ya loggeamos el error
          }
        });

        // Log crítico para monitoreo
        console.error('PAYMENT_CONFLICT detectado:', {
          bookingId,
          paymentId,
          conflictingBookingId: conflictingBooking.id
        });

        return {
          processed: true,
          bookingUpdated: true,
          bookingId,
          error: 'Pago tardío recibido pero cancha ya ocupada - Estado: PAYMENT_CONFLICT - Reembolso procesado'
        };
      }

      // Otros estados de pago (pending, rejected, etc.)
      return {
        processed: true,
        bookingUpdated: false,
        bookingId
      };

    } catch (error) {
      console.error('Error procesando webhook de pago:', error);
      return {
        processed: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      };
    }
  }
}


