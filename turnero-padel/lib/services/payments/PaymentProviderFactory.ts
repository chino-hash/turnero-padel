/**
 * Factory para obtener el proveedor de pago adecuado
 * Retorna MercadoPagoProvider si está configurado, sino MockPaymentProvider
 * Soporta credenciales por tenant o variables de entorno globales
 */

import { IPaymentProvider } from './interfaces/IPaymentProvider';
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
 * 
 * @param tenantId - ID del tenant (opcional)
 * @returns Proveedor de pago configurado
 */
export async function getPaymentProvider(tenantId?: string): Promise<IPaymentProvider> {
  // Si se proporciona tenantId, usar credenciales del tenant
  if (tenantId) {
    // Verificar cache por tenant
    const cached = tenantProviderCache.get(tenantId);
    if (cached) {
      console.log(`[PaymentProviderFactory] Usando MercadoPagoProvider del cache para tenant ${tenantId}`);
      return cached;
    }

    try {
      // Obtener credenciales del tenant
      const credentials = await getTenantMercadoPagoCredentials(tenantId);
      
      // Crear provider con credenciales del tenant
      const provider = new MercadoPagoProvider(credentials.accessToken, credentials.environment);
      tenantProviderCache.set(tenantId, provider);
      
      console.log(`[PaymentProviderFactory] MercadoPagoProvider creado para tenant ${tenantId} (environment: ${credentials.environment})`);
      return provider;
    } catch (error) {
      console.error(`[PaymentProviderFactory] Error obteniendo credenciales del tenant ${tenantId}:`, error);
      
      // Si el tenant no tiene credenciales configuradas, lanzar error (no usar fallback)
      if (error instanceof Error && (
        error.message.includes('no tiene credenciales') ||
        error.message.includes('no está habilitado') ||
        error.message.includes('está inactivo')
      )) {
        throw error;
      }
      
      // Para otros errores, intentar fallback a variables globales
      console.warn(`[PaymentProviderFactory] Fallback a credenciales globales para tenant ${tenantId}`);
      return getGlobalPaymentProvider();
    }
  }

  // Si no se proporciona tenantId, usar comportamiento legacy (variables globales)
  return getGlobalPaymentProvider();
}

/**
 * Obtiene el proveedor de pago usando variables de entorno globales
 * (compatibilidad hacia atrás)
 */
function getGlobalPaymentProvider(): IPaymentProvider {
  if (globalPaymentProviderInstance) {
    return globalPaymentProviderInstance;
  }

  // Verificar si Mercado Pago está configurado
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const paymentProvider = process.env.PAYMENT_PROVIDER;

  if (accessToken && (paymentProvider === 'mercadopago' || !paymentProvider)) {
    try {
      globalPaymentProviderInstance = new MercadoPagoProvider();
      console.log('[PaymentProviderFactory] Usando MercadoPagoProvider con credenciales globales');
    } catch (error) {
      console.error('[PaymentProviderFactory] Error inicializando MercadoPagoProvider, usando MockProvider:', error);
      globalPaymentProviderInstance = new MockPaymentProvider();
    }
  } else {
    globalPaymentProviderInstance = new MockPaymentProvider();
    console.log('[PaymentProviderFactory] Usando MockPaymentProvider (MERCADOPAGO_ACCESS_TOKEN no configurado)');
  }

  return globalPaymentProviderInstance;
}

/**
 * Invalida el cache del proveedor para un tenant específico
 * Debe llamarse cuando se actualicen las credenciales del tenant
 * 
 * @param tenantId - ID del tenant
 */
export function invalidateTenantProviderCache(tenantId: string): void {
  tenantProviderCache.delete(tenantId);
  invalidateCredentialsCache(tenantId);
  console.log(`[PaymentProviderFactory] Cache de proveedor invalidado para tenant ${tenantId}`);
}

/**
 * Limpia todo el cache de proveedores
 */
export function clearProviderCache(): void {
  tenantProviderCache.clear();
  globalPaymentProviderInstance = null;
  console.log('[PaymentProviderFactory] Cache de proveedores limpiado completamente');
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


