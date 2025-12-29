/**
 * Implementación Mock del Refund Service para desarrollo sin integración real
 * En producción, será reemplazado por MercadoPagoRefundService
 */

import { IRefundService, ProcessRefundParams, RefundResult } from './interfaces/IRefundService';

export class MockRefundService implements IRefundService {
  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    // Loggear la llamada para debugging
    console.log('[MockRefundService] processRefund llamada con:', {
      bookingId: params.bookingId,
      paymentId: params.paymentId,
      amount: params.amount,
      externalPaymentId: params.externalPaymentId,
      reason: params.reason
    });

    // Simular éxito del reembolso
    return {
      success: true,
      refundId: `mock_refund_${params.externalPaymentId}_${Date.now()}`,
      status: 'COMPLETED'
    };
  }
}


