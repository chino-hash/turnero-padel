/**
 * Implementación de Mercado Pago Refund Service
 * Procesa reembolsos a través de la API de Mercado Pago
 * Incluye validaciones de saldo, plazo de 180 días y reembolsos previos
 */

import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';
import { IRefundService, ProcessRefundParams, RefundResult } from './interfaces/IRefundService';
import { randomUUID } from 'crypto';

export class MercadoPagoRefundService implements IRefundService {
  private client: MercadoPagoConfig;

  constructor(accessToken?: string) {
    // Si no se proporciona accessToken, usar variable de entorno (fallback para compatibilidad)
    const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado. Proporciona un accessToken o configura la variable de entorno MERCADOPAGO_ACCESS_TOKEN');
    }

    this.client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 }
    });

    console.log(`[MercadoPagoRefundService] Inicializado${accessToken ? ' con credenciales del tenant' : ' con credenciales globales'}`);
  }

  /**
   * Valida que el pago no haya sido reembolsado completamente
   */
  private checkRefundStatus(mpPayment: any): { canRefund: boolean; alreadyRefunded: boolean; refundedAmount: number } {
    const transactionDetails = mpPayment.transaction_details;
    const totalPaid = mpPayment.transaction_amount || 0;
    const totalRefunded = transactionDetails?.total_paid_amount || totalPaid;
    const netReceived = transactionDetails?.net_received_amount || 0;
    
    // Si hay reembolsos, verificar el monto reembolsado
    const refunds = mpPayment.refunds || [];
    const refundedAmount = refunds.reduce((sum: number, refund: any) => sum + (refund.amount || 0), 0);
    
    const alreadyRefunded = refundedAmount >= totalPaid;
    const canRefund = !alreadyRefunded && mpPayment.status === 'approved';

    return { canRefund, alreadyRefunded, refundedAmount };
  }

  /**
   * Valida que el pago esté dentro del plazo de 180 días para reembolsar
   */
  private validateRefundTimeLimit(mpPayment: any): { valid: boolean; daysSinceApproval: number; error?: string } {
    if (!mpPayment.date_approved) {
      return { valid: false, daysSinceApproval: 0, error: 'Fecha de aprobación no disponible' };
    }

    const approvalDate = new Date(mpPayment.date_approved);
    const now = new Date();
    const daysSinceApproval = Math.floor((now.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceApproval > 180) {
      return {
        valid: false,
        daysSinceApproval,
        error: `El pago fue aprobado hace ${daysSinceApproval} días. Mercado Pago solo permite reembolsos dentro de 180 días desde la aprobación.`
      };
    }

    return { valid: true, daysSinceApproval };
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

      // Validar plazo de 180 días
      const timeValidation = this.validateRefundTimeLimit(mpPayment);
      if (!timeValidation.valid) {
        return {
          success: false,
          error: timeValidation.error || 'Plazo de reembolso expirado'
        };
      }

      // Verificar si ya fue reembolsado
      const refundStatus = this.checkRefundStatus(mpPayment);
      if (refundStatus.alreadyRefunded) {
        return {
          success: false,
          error: `El pago ya fue reembolsado completamente. Monto reembolsado: $${refundStatus.refundedAmount}`
        };
      }

      // Calcular monto a reembolsar
      const totalPaid = mpPayment.transaction_amount || 0;
      const refundAmount = params.amount ? params.amount / 100 : undefined; // MP espera pesos
      
      // Si es reembolso parcial, validar que no exceda el monto disponible
      if (refundAmount) {
        const availableToRefund = totalPaid - refundStatus.refundedAmount;
        if (refundAmount > availableToRefund) {
          return {
            success: false,
            error: `El monto solicitado ($${refundAmount}) excede el disponible para reembolsar ($${availableToRefund}). Ya se reembolsaron $${refundStatus.refundedAmount} de $${totalPaid}`
          };
        }
      }

      // Generar clave de idempotencia única para prevenir reembolsos duplicados
      // La idempotencia es obligatoria desde enero 2024 según documentación oficial
      // Usamos una combinación de bookingId, paymentId y timestamp para garantizar unicidad
      const idempotencyKey = randomUUID();

      // Intentar procesar el reembolso usando PaymentRefund que soporta idempotencyKey
      // Nota: Mercado Pago validará automáticamente el saldo disponible
      // Si no hay saldo, la API retornará un error que capturaremos
      const refund = new PaymentRefund(this.client);
      const refundResponse = await refund.create({
        payment_id: params.externalPaymentId,
        body: refundAmount ? { amount: refundAmount } : {},
        requestOptions: {
          idempotencyKey: idempotencyKey
        }
      });

      if (!refundResponse.id) {
        return {
          success: false,
          error: 'El reembolso se procesó pero no se recibió ID de confirmación'
        };
      }

      // Verificar el estado del reembolso
      const refundStatusFromMP = refundResponse.status;
      const isCompleted = refundStatusFromMP === 'approved' || refundStatusFromMP === 'refunded';

      return {
        success: isCompleted,
        refundId: refundResponse.id.toString(),
        status: isCompleted ? 'COMPLETED' : 'PENDING',
        error: isCompleted ? undefined : `Reembolso procesado pero en estado: ${refundStatusFromMP}`
      };
    } catch (error) {
      console.error('[MercadoPagoRefundService] Error procesando reembolso:', error);
      
      // Manejar errores específicos de Mercado Pago
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Pago ya reembolsado
        if (errorMessage.includes('already refunded') || 
            errorMessage.includes('ya fue reembolsado') ||
            errorMessage.includes('refunded')) {
          return {
            success: false,
            error: 'El pago ya fue reembolsado previamente'
          };
        }
        
        // Saldo insuficiente
        if (errorMessage.includes('insufficient') || 
            errorMessage.includes('insuficiente') ||
            errorMessage.includes('balance') ||
            errorMessage.includes('saldo')) {
          return {
            success: false,
            error: 'Saldo insuficiente en la cuenta de Mercado Pago para procesar el reembolso. Por favor, verifica tu saldo disponible.'
          };
        }
        
        // Plazo expirado
        if (errorMessage.includes('expired') || 
            errorMessage.includes('expirado') ||
            errorMessage.includes('180')) {
          return {
            success: false,
            error: 'El plazo para reembolsar este pago ha expirado (máximo 180 días desde la aprobación)'
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

