/**
 * Servicio de reembolsos con lógica de negocio
 * Utiliza IRefundService para la implementación concreta del proveedor
 */

import { prisma } from '../../prisma';
import { IRefundService, ProcessRefundParams, RefundResult } from './interfaces/IRefundService';
import { MockRefundService } from './MockRefundService';
import { MercadoPagoRefundService } from './MercadoPagoRefundService';
import { PaymentType } from '@prisma/client';

let refundServiceInstance: IRefundService | null = null;

/**
 * Obtiene el servicio de reembolso configurado
 * Usa MercadoPagoRefundService si MERCADOPAGO_ACCESS_TOKEN está configurado
 * De lo contrario, usa MockRefundService para desarrollo/testing
 */
function getRefundService(): IRefundService {
  if (refundServiceInstance) {
    return refundServiceInstance;
  }

  // Verificar si Mercado Pago está configurado
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const paymentProvider = process.env.PAYMENT_PROVIDER;

  if (accessToken && (paymentProvider === 'mercadopago' || !paymentProvider)) {
    try {
      refundServiceInstance = new MercadoPagoRefundService();
      console.log('[RefundService] Usando MercadoPagoRefundService');
    } catch (error) {
      console.error('[RefundService] Error inicializando MercadoPagoRefundService, usando MockService:', error);
      refundServiceInstance = new MockRefundService();
    }
  } else {
    refundServiceInstance = new MockRefundService();
    console.log('[RefundService] Usando MockRefundService (MERCADOPAGO_ACCESS_TOKEN no configurado)');
  }

  return refundServiceInstance;
}

/**
 * Procesa un reembolso y lo registra en la BD
 */
export async function processRefund(params: ProcessRefundParams): Promise<RefundResult> {
  const refundService = getRefundService();

  // Llamar al proveedor para procesar el reembolso
  const result = await refundService.processRefund(params);

  if (result.success && result.refundId) {
    // Registrar el reembolso en la tabla Payment
    try {
      await prisma.payment.create({
        data: {
          bookingId: params.bookingId,
          amount: params.amount,
          paymentMethod: 'CARD', // TODO: Obtener del pago original
          paymentType: 'REFUND',
          referenceNumber: result.refundId,
          status: 'completed',
          notes: `Reembolso procesado. Motivo: ${params.reason}. External Refund ID: ${result.refundId}`
        }
      });
    } catch (error) {
      console.error('Error registrando reembolso en BD:', error);
      // El reembolso se procesó pero falló el registro, retornar éxito parcial
      return {
        success: true,
        refundId: result.refundId,
        error: 'Reembolso procesado pero falló el registro en BD'
      };
    }
  }

  return result;
}

/**
 * Procesa reembolso por cancelación de reserva
 * Aplica políticas de negocio (ej: 2 horas de anticipación)
 */
export async function processRefundForCancellation(
  bookingId: string,
  cancellationReason: string
): Promise<{ success: boolean; refundId?: string; refundAmount?: number; error?: string }> {
  try {
    // Obtener la reserva y sus pagos
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          where: {
            paymentType: 'PAYMENT',
            status: 'completed'
          }
        }
      }
    });

    if (!booking) {
      return {
        success: false,
        error: 'Reserva no encontrada'
      };
    }

    // Calcular si aplica reembolso (2 horas de anticipación)
    const now = new Date();
    const bookingStartTime = new Date(booking.bookingDate);
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    bookingStartTime.setHours(hours, minutes, 0, 0);

    const hoursUntilBooking = (bookingStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const canRefund = hoursUntilBooking >= 2;

    if (!canRefund) {
      return {
        success: false,
        error: 'No aplica reembolso: cancelación con menos de 2 horas de anticipación',
        refundAmount: 0
      };
    }

    // Calcular monto a reembolsar (solo el depósito según la lógica de negocio)
    const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const refundAmount = booking.depositAmount || totalPaid;

    // Reembolsar todos los pagos aprobados
    const refundResults = [];
    for (const payment of booking.payments) {
      if (payment.referenceNumber && payment.paymentMethod === 'CARD') {
        try {
          const refundResult = await processRefund({
            bookingId,
            paymentId: payment.id,
            amount: refundAmount,
            externalPaymentId: payment.referenceNumber,
            reason: `Cancelación con ${hoursUntilBooking.toFixed(1)} horas de anticipación. ${cancellationReason}`
          });
          refundResults.push(refundResult);
        } catch (error) {
          console.error(`Error reembolsando pago ${payment.id}:`, error);
        }
      }
    }

    if (refundResults.length === 0) {
      return {
        success: false,
        error: 'No se pudieron procesar los reembolsos (no hay pagos con referencia externa)',
        refundAmount
      };
    }

    const successfulRefunds = refundResults.filter(r => r.success);
    if (successfulRefunds.length === 0) {
      return {
        success: false,
        error: 'No se pudieron procesar los reembolsos',
        refundAmount
      };
    }

    return {
      success: true,
      refundId: successfulRefunds[0].refundId,
      refundAmount
    };
  } catch (error) {
    console.error('Error procesando reembolso por cancelación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Permite establecer un servicio de reembolso personalizado (útil para testing)
 */
export function setRefundService(service: IRefundService): void {
  refundServiceInstance = service;
}

/**
 * Resetea el servicio de reembolso (útil para testing)
 */
export function resetRefundService(): void {
  refundServiceInstance = null;
}


