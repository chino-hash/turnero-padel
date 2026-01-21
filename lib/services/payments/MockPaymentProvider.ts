/**
 * Implementación Mock del Payment Provider para desarrollo sin integración real
 * En producción, será reemplazado por MercadoPagoProvider
 */

import type {
  IPaymentProvider,
  CreatePaymentPreferenceParams,
  PaymentPreferenceResult,
} from './interfaces/IPaymentProvider';

export class MockPaymentProvider implements IPaymentProvider {
  async createPreference(
    params: CreatePaymentPreferenceParams
  ): Promise<PaymentPreferenceResult> {
    // Loggear la llamada para debugging
    console.log('[MockPaymentProvider] createPreference llamada con:', {
      bookingId: params.bookingId,
      amount: params.amount,
      expiresAt: params.expiresAt,
      title: params.title,
    });

    // Retornar datos mock
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000';

    return {
      preferenceId: `mock_pref_${params.bookingId}_${Date.now()}`,
      initPoint: `${baseUrl}/payments/mock-success?bookingId=${params.bookingId}`,
      sandboxInitPoint: `${baseUrl}/payments/mock-success?bookingId=${params.bookingId}`,
    };
  }
}

