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
 * Verifica si ya existe un reembolso para este pago
 */
async function checkExistingRefund(paymentId: string, externalPaymentId: string): Promise<{
  exists: boolean;
  refundId?: string;
  status?: string;
}> {
  // Buscar reembolsos existentes para este pago
  const existingRefund = await prisma.payment.findFirst({
    where: {
      paymentType: 'REFUND',
      referenceNumber: externalPaymentId,
      OR: [
        { id: paymentId }, // Reembolso del mismo registro de pago
        { 
          // Reembolsos relacionados al mismo pago externo
          notes: {
            contains: externalPaymentId
          }
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (existingRefund) {
    return {
      exists: true,
      refundId: existingRefund.referenceNumber || undefined,
      status: existingRefund.status
    };
  }

  return { exists: false };
}

/**
 * Obtiene el método de pago del pago original
 */
async function getOriginalPaymentMethod(paymentId: string): Promise<string> {
  const originalPayment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { paymentMethod: true }
  });

  // Si no encontramos el pago original, intentar buscar por referencia externa
  if (!originalPayment) {
    return 'CARD'; // Default
  }

  // Mapear el enum a string
  return originalPayment.paymentMethod || 'CARD';
}

/**
 * Mapea el estado del reembolso a un estado estándar
 */
function mapRefundStatus(result: RefundResult): string {
  if (result.status) {
    return result.status.toLowerCase();
  }
  
  if (result.success) {
    return 'completed';
  }
  
  return 'failed';
}

/**
 * Procesa un reembolso y lo registra en la BD con estados y validaciones
 */
export async function processRefund(params: ProcessRefundParams): Promise<RefundResult> {
  // Verificar si ya existe un reembolso para este pago
  const existingRefund = await checkExistingRefund(params.paymentId, params.externalPaymentId);
  if (existingRefund.exists && existingRefund.status === 'completed') {
    return {
      success: false,
      error: `Este pago ya fue reembolsado previamente. Refund ID: ${existingRefund.refundId}`
    };
  }

  // Obtener método de pago del pago original
  const paymentMethod = await getOriginalPaymentMethod(params.paymentId);

  // Registrar el reembolso como PENDING antes de procesarlo
  let refundRecord;
  try {
    refundRecord = await prisma.payment.create({
      data: {
        bookingId: params.bookingId,
        amount: params.amount,
        paymentMethod: paymentMethod as any,
        paymentType: 'REFUND',
        referenceNumber: `pending_${Date.now()}`, // Temporal hasta obtener el ID real
        status: 'pending',
        notes: `Reembolso en proceso. Motivo: ${params.reason}. External Payment ID: ${params.externalPaymentId}`
      }
    });
  } catch (error) {
    console.error('Error creando registro de reembolso en BD:', error);
    return {
      success: false,
      error: 'Error al crear registro de reembolso en la base de datos'
    };
  }

  // Llamar al proveedor para procesar el reembolso
  const refundService = getRefundService();
  const result = await refundService.processRefund(params);

  // Actualizar el registro con el resultado
  const finalStatus = mapRefundStatus(result);
  
  try {
    await prisma.payment.update({
      where: { id: refundRecord.id },
      data: {
        referenceNumber: result.refundId || refundRecord.referenceNumber,
        status: finalStatus,
        notes: result.success
          ? `Reembolso ${finalStatus}. Motivo: ${params.reason}. External Refund ID: ${result.refundId || 'N/A'}`
          : `Reembolso fallido. Error: ${result.error || 'Error desconocido'}. Motivo: ${params.reason}`
      }
    });
  } catch (error) {
    console.error('Error actualizando registro de reembolso en BD:', error);
    // El reembolso se procesó pero falló la actualización
    return {
      success: result.success,
      refundId: result.refundId,
      status: result.status,
      error: result.error || 'Reembolso procesado pero falló la actualización en BD'
    };
  }

  return {
    ...result,
    status: result.status || (result.success ? 'COMPLETED' : 'FAILED')
  };
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
    // Nota: Solo reembolsamos pagos con referencia externa (pagos de Mercado Pago)
    const refundResults = [];
    for (const payment of booking.payments) {
      // Verificar que tenga referencia externa (ID de Mercado Pago)
      if (payment.referenceNumber && payment.paymentMethod === 'CARD') {
        // Verificar que no haya sido reembolsado ya
        const existingRefund = await prisma.payment.findFirst({
          where: {
            paymentType: 'REFUND',
            bookingId: bookingId,
            notes: {
              contains: payment.referenceNumber
            },
            status: 'completed'
          }
        });

        if (existingRefund) {
          console.log(`Pago ${payment.id} ya fue reembolsado, omitiendo`);
          continue;
        }

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
          refundResults.push({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
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


