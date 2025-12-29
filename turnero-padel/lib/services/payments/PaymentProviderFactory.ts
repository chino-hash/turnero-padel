/**
 * Factory para obtener el proveedor de pago adecuado
 * Retorna MercadoPagoProvider si está configurado, sino MockPaymentProvider
 */

import { IPaymentProvider } from './interfaces/IPaymentProvider';
import { MockPaymentProvider } from './MockPaymentProvider';
import { MercadoPagoProvider } from './MercadoPagoProvider';

let paymentProviderInstance: IPaymentProvider | null = null;

/**
 * Obtiene el proveedor de pago configurado
 * Usa MercadoPagoProvider si MERCADOPAGO_ACCESS_TOKEN está configurado
 * De lo contrario, usa MockPaymentProvider para desarrollo/testing
 */
export function getPaymentProvider(): IPaymentProvider {
  if (paymentProviderInstance) {
    return paymentProviderInstance;
  }

  // Verificar si Mercado Pago está configurado
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const paymentProvider = process.env.PAYMENT_PROVIDER;

  if (accessToken && (paymentProvider === 'mercadopago' || !paymentProvider)) {
    try {
      paymentProviderInstance = new MercadoPagoProvider();
      console.log('[PaymentProviderFactory] Usando MercadoPagoProvider');
    } catch (error) {
      console.error('[PaymentProviderFactory] Error inicializando MercadoPagoProvider, usando MockProvider:', error);
      paymentProviderInstance = new MockPaymentProvider();
    }
  } else {
    paymentProviderInstance = new MockPaymentProvider();
    console.log('[PaymentProviderFactory] Usando MockPaymentProvider (MERCADOPAGO_ACCESS_TOKEN no configurado)');
  }

  return paymentProviderInstance;
}

/**
 * Permite establecer un proveedor personalizado (útil para testing)
 */
export function setPaymentProvider(provider: IPaymentProvider): void {
  paymentProviderInstance = provider;
}

/**
 * Resetea el proveedor (útil para testing)
 */
export function resetPaymentProvider(): void {
  paymentProviderInstance = null;
}


