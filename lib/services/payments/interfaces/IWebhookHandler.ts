/**
 * Interface para handlers de webhooks de proveedores de pago
 * Permite abstraer la implementación específica de Mercado Pago u otros proveedores
 */

export interface WebhookPayload {
  type: string;
  data: any;
  [key: string]: any; // Permite campos adicionales específicos del proveedor
}

export interface WebhookResult {
  processed: boolean;
  bookingUpdated?: boolean;
  error?: string;
  bookingId?: string;
}

/**
 * Interface para handlers de webhooks
 * Implementaciones futuras: MercadoPagoWebhookHandler, StripeWebhookHandler, etc.
 */
export interface IWebhookHandler {
  /**
   * Procesa un webhook recibido del proveedor de pago
   * @param payload Payload del webhook
   * @returns Resultado del procesamiento
   */
  handle(payload: WebhookPayload): Promise<WebhookResult>;
}

