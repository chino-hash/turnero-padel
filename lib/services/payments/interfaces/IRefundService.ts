/**
 * Interface para servicios de reembolso
 * Permite abstraer la implementación específica de Mercado Pago u otros proveedores
 *
 * Nota de unidad monetaria:
 * - En este proyecto los montos se manejan como enteros en ARS (pesos) sin centavos.
 */

export interface ProcessRefundParams {
  bookingId: string;
  paymentId: string; // ID del registro Payment en BD
  amount: number; // ARS (pesos) como entero
  externalPaymentId: string; // ID del pago en el proveedor externo (ej: MP Payment ID)
  reason: string;
  tenantId?: string; // ID del tenant (opcional, para usar credenciales del tenant)
}

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface RefundResult {
  success: boolean;
  refundId?: string; // ID del reembolso en el proveedor externo
  status?: RefundStatus; // Estado del reembolso
  error?: string;
}

/**
 * Interface para servicios de reembolso
 * Implementaciones futuras: MercadoPagoRefundService, StripeRefundService, etc.
 */
export interface IRefundService {
  /**
   * Procesa un reembolso en el proveedor externo
   * @param params Parámetros del reembolso
   * @returns Resultado del reembolso
   */
  processRefund(params: ProcessRefundParams): Promise<RefundResult>;
}

