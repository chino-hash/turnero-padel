/**
 * Factory para obtener el proveedor de pago adecuado
 * Retorna MercadoPagoProvider si está configurado, sino MockPaymentProvider
 * Soporta credenciales por tenant o variables de entorno globales
 */

import type { IPaymentProvider } from './interfaces/IPaymentProvider';
import { MockPaymentProvider } from './MockPaymentProvider';
import { MercadoPagoProvider } from './MercadoPagoProvider';
import { getTenantMercadoPagoCredentials, invalidateCredentialsCache } from './tenant-credentials';

// Cache por tenant: Map<tenantId, IPaymentProvider>
const tenantProviderCache = new Map<string, IPaymentProvider>();

// Singleton global para compatibilidad hacia atrás (cuando no se proporciona tenantId)
let globalPaymentProviderInstance: IPaymentProvider | null = null;

/**
 * Obtiene el proveedor de pago configurado
 * Si se proporciona tenantId, usa credenciales del tenant
 * Si no se proporciona tenantId, usa variables de entorno globales (compatibilidad hacia atrás)
 */
export async function getPaymentProvider(tenantId?: string): Promise<IPaymentProvider> {
  if (tenantId) {
    const cached = tenantProviderCache.get(tenantId);
    if (cached) return cached;

    try {
      const credentials = await getTenantMercadoPagoCredentials(tenantId);
      const provider = new MercadoPagoProvider(credentials.accessToken, credentials.environment);
      tenantProviderCache.set(tenantId, provider);
      return provider;
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

      // Si el tenant está inactivo o MP está deshabilitado explícitamente, usar Mock (no heredar global).
      if (msg.includes('inactivo') || msg.includes('no está habilitado')) {
        const provider = new MockPaymentProvider();
        tenantProviderCache.set(tenantId, provider);
        return provider;
      }

      // Si faltan credenciales del tenant, fallback a provider global (env) y si no existe, Mock.
      console.warn(
        `[PaymentProviderFactory] No se pudieron obtener credenciales del tenant ${tenantId}. Usando provider global/mock.`,
        error
      );
      const provider = getGlobalPaymentProvider();
      tenantProviderCache.set(tenantId, provider);
      return provider;
    }
  }

  return getGlobalPaymentProvider();
}

function getGlobalPaymentProvider(): IPaymentProvider {
  if (globalPaymentProviderInstance) {
    return globalPaymentProviderInstance;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const paymentProvider = process.env.PAYMENT_PROVIDER;

  if (accessToken && (paymentProvider === 'mercadopago' || !paymentProvider)) {
    try {
      globalPaymentProviderInstance = new MercadoPagoProvider();
    } catch (error) {
      console.error(
        '[PaymentProviderFactory] Error inicializando MercadoPagoProvider, usando MockProvider:',
        error
      );
      globalPaymentProviderInstance = new MockPaymentProvider();
    }
  } else {
    globalPaymentProviderInstance = new MockPaymentProvider();
  }

  return globalPaymentProviderInstance;
}

/**
 * Invalida el cache del proveedor para un tenant específico
 * Debe llamarse cuando se actualicen las credenciales del tenant
 */
export function invalidateTenantProviderCache(tenantId: string): void {
  tenantProviderCache.delete(tenantId);
  invalidateCredentialsCache(tenantId);
}

/**
 * Limpia todo el cache de proveedores
 */
export function clearProviderCache(): void {
  tenantProviderCache.clear();
  globalPaymentProviderInstance = null;
}

/**
 * Permite establecer un proveedor personalizado (útil para testing)
 * @deprecated Usar setTenantProvider o setGlobalProvider en su lugar
 */
export function setPaymentProvider(provider: IPaymentProvider): void {
  globalPaymentProviderInstance = provider;
}

/**
 * Establece un proveedor para un tenant específico (útil para testing)
 */
export function setTenantProvider(tenantId: string, provider: IPaymentProvider): void {
  tenantProviderCache.set(tenantId, provider);
}

/**
 * Resetea el proveedor (útil para testing)
 */
export function resetPaymentProvider(): void {
  globalPaymentProviderInstance = null;
  tenantProviderCache.clear();
}

