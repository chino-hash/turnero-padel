/**
 * Implementación de Mercado Pago Refund Service
 * Procesa reembolsos a través de la API de Mercado Pago
 */

import { MercadoPagoConfig, Payment } from 'mercadopago';
import { IRefundService, ProcessRefundParams, RefundResult } from './interfaces/IRefundService';

export class MercadoPagoRefundService implements IRefundService {
  private client: MercadoPagoConfig;

  constructor() {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
    }

    this.client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 5000 }
    });
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    try {
      const payment = new Payment(this.client);
      
      // Obtener información del pago desde Mercado Pago
      const mpPayment = await payment.get({ id: params.externalPaymentId });

      if (!mpPayment) {
        return {
          success: false,
          error: `Pago no encontrado en Mercado Pago: ${params.externalPaymentId}`
        };
      }

      // Validar que el pago esté aprobado
      if (mpPayment.status !== 'approved') {
        return {
          success: false,
          error: `No se puede reembolsar un pago con estado: ${mpPayment.status}. Solo se pueden reembolsar pagos aprobados.`
        };
      }

      // Procesar el reembolso
      // Si amount está especificado, es un reembolso parcial, sino es total
      const refundAmount = params.amount ? params.amount / 100 : undefined; // MP espera pesos

      const refundResponse = await payment.refund({
        id: params.externalPaymentId,
        body: refundAmount ? { amount: refundAmount } : {}
      });

      if (!refundResponse.id) {
        return {
          success: false,
          error: 'El reembolso se procesó pero no se recibió ID de confirmación'
        };
      }

      return {
        success: true,
        refundId: refundResponse.id.toString()
      };
    } catch (error) {
      console.error('[MercadoPagoRefundService] Error procesando reembolso:', error);
      
      // Manejar errores específicos de Mercado Pago
      if (error instanceof Error) {
        // Si el error contiene información sobre el estado del pago
        if (error.message.includes('already refunded') || error.message.includes('ya fue reembolsado')) {
          return {
            success: false,
            error: 'El pago ya fue reembolsado previamente'
          };
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Error desconocido al procesar el reembolso'
      };
    }
  }
}

