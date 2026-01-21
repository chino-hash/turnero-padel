/**
 * Interface base para proveedores de pago
 * Permite abstraer la implementación específica de Mercado Pago u otros proveedores
 *
 * Nota de unidad monetaria:
 * - En este proyecto los montos se manejan como enteros en ARS (pesos) sin centavos.
 */

export interface CreatePaymentPreferenceParams {
  bookingId: string;
  title: string;
  description: string;
  amount: number; // ARS (pesos) como entero
  expiresAt: Date;
  userId: string;
  backUrls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
}

/**
 * Interface para proveedores de pago
 * Implementaciones futuras: MercadoPagoProvider, StripeProvider, etc.
 */
export interface IPaymentProvider {
  /**
   * Crea una preferencia de pago en el proveedor
   * @param params Parámetros para crear la preferencia
   * @returns Información de la preferencia creada, incluyendo URL de pago
   */
  createPreference(params: CreatePaymentPreferenceParams): Promise<PaymentPreferenceResult>;
}

