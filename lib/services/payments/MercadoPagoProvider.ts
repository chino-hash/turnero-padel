/**
 * Implementación de Mercado Pago Provider
 * Integración real con la API de Mercado Pago para procesamiento de pagos
 */

import { MercadoPagoConfig, Preference } from 'mercadopago';
import type {
  IPaymentProvider,
  CreatePaymentPreferenceParams,
  PaymentPreferenceResult,
} from './interfaces/IPaymentProvider';

export class MercadoPagoProvider implements IPaymentProvider {
  private client: MercadoPagoConfig;
  private environment: 'sandbox' | 'production';

  constructor(accessToken?: string, environment?: 'sandbox' | 'production') {
    // Si no se proporciona accessToken, usar variable de entorno (fallback para compatibilidad)
    const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!token) {
      throw new Error(
        'MERCADOPAGO_ACCESS_TOKEN no está configurado. Proporciona un accessToken o configura la variable de entorno MERCADOPAGO_ACCESS_TOKEN'
      );
    }

    this.environment =
      environment ||
      (process.env.MERCADOPAGO_ENVIRONMENT as 'sandbox' | 'production') ||
      'sandbox';

    this.client = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 },
    });

    console.log(
      `[MercadoPagoProvider] Inicializado con environment: ${this.environment}${
        accessToken ? ' (credenciales del tenant)' : ' (credenciales globales)'
      }`
    );
  }

  async createPreference(
    params: CreatePaymentPreferenceParams
  ): Promise<PaymentPreferenceResult> {
    const preference = new Preference(this.client);

    // Construir la URL base para las URLs de retorno
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/webhooks/payments`;

    // Nota: Mercado Pago espera montos en ARS (pesos). En este proyecto `amount` ya está en pesos.
    const unitPrice = params.amount;

    // Preparar datos de la preferencia
    const preferenceData: any = {
      items: [
        {
          id: params.bookingId,
          title: params.title,
          description: params.description,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'ARS',
        },
      ],
      external_reference: params.bookingId,
      notification_url: webhookUrl,
      expires: true,
      expiration_date_to: params.expiresAt.toISOString(),
      back_urls: {
        success: params.backUrls?.success || `${baseUrl}/bookings?status=success`,
        failure: params.backUrls?.failure || `${baseUrl}/bookings?status=failure`,
        pending: params.backUrls?.pending || `${baseUrl}/bookings?status=pending`,
      },
      auto_return: 'approved' as const,
    };

    try {
      // Crear la preferencia en Mercado Pago
      const response = await preference.create({ body: preferenceData });

      if (!response.id || !response.init_point) {
        throw new Error('Respuesta inválida de Mercado Pago: falta id o init_point');
      }

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
      };
    } catch (error) {
      console.error('[MercadoPagoProvider] Error creando preferencia:', error);
      throw new Error(
        `Error creando preferencia de pago: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`
      );
    }
  }
}

