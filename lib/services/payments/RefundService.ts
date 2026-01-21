/**
 * Servicio de reembolsos con lógica de negocio
 * Utiliza IRefundService para la implementación concreta del proveedor
 */

import { prisma } from '@/lib/database/neon-config';
import type { IRefundService, ProcessRefundParams, RefundResult } from './interfaces/IRefundService';
import { MockRefundService } from './MockRefundService';
import { MercadoPagoRefundService } from './MercadoPagoRefundService';
import { getTenantMercadoPagoCredentials } from './tenant-credentials';

let refundServiceInstance: IRefundService | null = null;

/**
 * Obtiene el servicio de reembolso configurado.
 * - Si se proporciona accessToken, crea instancia con esas credenciales.
 * - Si no se proporciona, usa variables de entorno globales (compatibilidad hacia atrás).
 */
function getRefundService(accessToken?: string): IRefundService {
  if (refundServiceInstance) {
    return refundServiceInstance;
  }

  if (accessToken) {
    try {
      return new MercadoPagoRefundService(accessToken);
    } catch (error) {
      console.error(
        '[RefundService] Error inicializando MercadoPagoRefundService con credenciales proporcionadas, usando MockService:',
        error
      );
      return new MockRefundService();
    }
  }

  const globalAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const paymentProvider = process.env.PAYMENT_PROVIDER;

  if (globalAccessToken && (paymentProvider === 'mercadopago' || !paymentProvider)) {
    try {
      return new MercadoPagoRefundService();
    } catch (error) {
      console.error(
        '[RefundService] Error inicializando MercadoPagoRefundService, usando MockService:',
        error
      );
      return new MockRefundService();
    }
  }

  return new MockRefundService();
}

async function resolveTenantIdForRefund(params: ProcessRefundParams): Promise<string | null> {
  if (params.tenantId) return params.tenantId;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: { tenantId: true },
    });
    return booking?.tenantId || null;
  } catch {
    return null;
  }
}

/**
 * Verifica si ya existe un reembolso para este pago externo (idempotencia en BD)
 */
async function checkExistingRefund(bookingId: string, externalPaymentId: string): Promise<{
  exists: boolean;
  refundId?: string;
  status?: string;
}> {
  const existingRefund = await prisma.payment.findFirst({
    where: {
      bookingId,
      paymentType: 'REFUND',
      OR: [
        { referenceNumber: externalPaymentId },
        {
          notes: {
            contains: externalPaymentId,
          },
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingRefund) {
    return {
      exists: true,
      refundId: existingRefund.referenceNumber || undefined,
      status: existingRefund.status,
    };
  }

  return { exists: false };
}

/**
 * Procesa un reembolso y lo registra en la BD con estados y validaciones
 */
export async function processRefund(params: ProcessRefundParams): Promise<RefundResult> {
  const tenantId = await resolveTenantIdForRefund(params);
  if (!tenantId) {
    return { success: false, error: 'No se pudo resolver tenantId para el reembolso' };
  }

  const existingRefund = await checkExistingRefund(params.bookingId, params.externalPaymentId);
  if (existingRefund.exists && existingRefund.status === 'completed') {
    return {
      success: false,
      error: `Este pago ya fue reembolsado previamente. Refund ID: ${existingRefund.refundId}`,
    };
  }

  // Registrar el reembolso como PENDING antes de procesarlo
  let refundRecord: { id: string; referenceNumber: string | null };
  try {
    refundRecord = await prisma.payment.create({
      data: {
        tenantId,
        bookingId: params.bookingId,
        amount: params.amount,
        paymentMethod: 'CARD',
        paymentType: 'REFUND',
        referenceNumber: `pending_${Date.now()}`, // temporal hasta obtener el ID real
        status: 'pending',
        notes: `Reembolso en proceso. Motivo: ${params.reason}. External Payment ID: ${params.externalPaymentId}`,
      },
      select: { id: true, referenceNumber: true },
    });
  } catch (error) {
    console.error('[RefundService] Error creando registro de reembolso en BD:', error);
    return { success: false, error: 'Error al crear registro de reembolso en la base de datos' };
  }

  // Obtener credenciales del tenant si se proporciona tenantId (o si podemos)
  let accessToken: string | undefined;
  try {
    const credentials = await getTenantMercadoPagoCredentials(tenantId);
    accessToken = credentials.accessToken;
  } catch (error) {
    console.error(`[RefundService] Error obteniendo credenciales del tenant ${tenantId}:`, error);
  }

  // Llamar al proveedor para procesar el reembolso
  const refundService = getRefundService(accessToken);
  const result = await refundService.processRefund({ ...params, tenantId });

  const finalStatus = result.success ? 'completed' : 'failed';

  // Actualizar el registro con el resultado
  try {
    await prisma.payment.update({
      where: { id: refundRecord.id },
      data: {
        referenceNumber: result.refundId || refundRecord.referenceNumber,
        status: finalStatus,
        notes: result.success
          ? `Reembolso completed. Motivo: ${params.reason}. External Refund ID: ${result.refundId || 'N/A'}`
          : `Reembolso fallido. Error: ${result.error || 'Error desconocido'}. Motivo: ${params.reason}`,
      },
    });
  } catch (error) {
    console.error('[RefundService] Error actualizando registro de reembolso en BD:', error);
    return {
      success: result.success,
      refundId: result.refundId,
      status: result.status,
      error: result.error || 'Reembolso procesado pero falló la actualización en BD',
    };
  }

  return {
    ...result,
    status: result.status || (result.success ? 'COMPLETED' : 'FAILED'),
  };
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

