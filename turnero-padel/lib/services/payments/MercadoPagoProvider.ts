/**
 * Implementación de Mercado Pago Provider
 * Integración real con la API de Mercado Pago para procesamiento de pagos
 */

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { IPaymentProvider, CreatePaymentPreferenceParams, PaymentPreferenceResult } from './interfaces/IPaymentProvider';

export class MercadoPagoProvider implements IPaymentProvider {
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

  async createPreference(params: CreatePaymentPreferenceParams): Promise<PaymentPreferenceResult> {
    try {
      const preference = new Preference(this.client);
      
      // Construir la URL base para las URLs de retorno
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const webhookUrl = `${baseUrl}/api/webhooks/payments`;
      
      // Preparar datos de la preferencia
      const preferenceData = {
        items: [{
          id: params.bookingId,
          title: params.title,
          description: params.description,
          quantity: 1,
          unit_price: params.amount / 100, // MP espera pesos, convertir de centavos
          currency_id: 'ARS'
        }],
        external_reference: params.bookingId,
        notification_url: webhookUrl,
        expires: true,
        expiration_date_to: params.expiresAt.toISOString(),
        back_urls: {
          success: params.backUrls?.success || `${baseUrl}/bookings?status=success`,
          failure: params.backUrls?.failure || `${baseUrl}/bookings?status=failure`,
          pending: params.backUrls?.pending || `${baseUrl}/bookings?status=pending`
        },
        auto_return: 'approved' as const
      };

      // Crear la preferencia en Mercado Pago
      const response = await preference.create({ body: preferenceData });

      if (!response.id || !response.init_point) {
        throw new Error('Respuesta inválida de Mercado Pago: falta id o init_point');
      }

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point
      };
    } catch (error) {
      console.error('[MercadoPagoProvider] Error creando preferencia:', error);
      throw new Error(
        `Error creando preferencia de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }
}

