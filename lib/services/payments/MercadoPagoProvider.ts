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
    const webhookUrl = params.tenantId
      ? `${baseUrl}/api/webhooks/payments?tenantId=${encodeURIComponent(params.tenantId)}`
      : `${baseUrl}/api/webhooks/payments`;

    // Mercado Pago espera unit_price en ARS (pesos). El caller debe pasar amount ya en pesos.
    const unitPrice = params.amount;

    const successUrl = params.backUrls?.success || `${baseUrl}/reservas/exito`;
    const failureUrl = params.backUrls?.failure || `${baseUrl}/reservas/error`;
    const pendingUrl = params.backUrls?.pending || `${baseUrl}/reservas/pendiente`;

    // La API de MP exige "back_url.success" cuando se usa auto_return (mensaje: back_url.success must be defined)
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
      back_urls: { success: successUrl, failure: failureUrl, pending: pendingUrl },
      back_url: { success: successUrl, failure: failureUrl, pending: pendingUrl },
      auto_return: 'approved' as const,
    };

    try {
      let response: any;
      try {
        response = await preference.create({ body: preferenceData });
      } catch (firstErr: unknown) {
        const errMsg = typeof (firstErr as { message?: string })?.message === 'string' ? (firstErr as { message: string }).message : '';
        if (errMsg.includes('auto_return') || errMsg.includes('back_url')) {
          const { auto_return: _ar, back_url: _bu, ...rest } = preferenceData;
          const fallbackData = { ...rest, back_urls: { success: successUrl, failure: failureUrl, pending: pendingUrl } };
          response = await preference.create({ body: fallbackData });
        } else {
          throw firstErr;
        }
      }

      if (!response.id || !response.init_point) {
        throw new Error('Respuesta inválida de Mercado Pago: falta id o init_point');
      }

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
      };
    } catch (error: unknown) {
      console.error('[MercadoPagoProvider] Error creando preferencia:', error);
      const message =
        error instanceof Error
          ? error.message
          : typeof (error as { message?: string })?.message === 'string'
            ? (error as { message: string }).message
            : (error as { cause?: { message?: string } })?.cause?.message
              ? String((error as { cause: { message: string } }).cause.message)
              : typeof error === 'object' && error !== null
                ? JSON.stringify(error)
                : String(error);
      throw new Error(`Error creando preferencia de pago: ${message || 'Error desconocido'}`);
    }
  }
}

