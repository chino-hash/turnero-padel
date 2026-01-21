/**
 * Helper para obtener y gestionar credenciales de Mercado Pago por tenant
 * Incluye cache para optimizar performance y manejo de errores robusto
 */

import { prisma } from '@/lib/database/neon-config';
import { decryptCredential } from '@/lib/encryption/credential-encryption';

export interface TenantMercadoPagoCredentials {
  accessToken: string;
  publicKey: string | null;
  webhookSecret: string | null;
  environment: 'sandbox' | 'production';
}

interface CachedCredentials {
  credentials: TenantMercadoPagoCredentials;
  expiresAt: number;
  tenantUpdatedAt: Date;
}

// Cache en memoria con TTL de 5 minutos
const credentialsCache = new Map<string, CachedCredentials>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpia entradas expiradas del cache
 */
function cleanCache(): void {
  const now = Date.now();
  for (const [tenantId, cached] of credentialsCache.entries()) {
    if (now > cached.expiresAt) {
      credentialsCache.delete(tenantId);
    }
  }
}

/**
 * Intenta desencriptar una credencial, manejando errores gracefully
 */
function tryDecrypt(encrypted: string | null): string | null {
  if (!encrypted) {
    return null;
  }

  try {
    // Intentar desencriptar
    return decryptCredential(encrypted);
  } catch (error) {
    // Si falla la desencriptación, puede ser que:
    // 1. La credencial no está encriptada (formato antiguo)
    // 2. Falta CREDENTIAL_ENCRYPTION_KEY
    // 3. La credencial está corrupta

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Si falta la clave de encriptación, lanzar error descriptivo
      if (
        errorMessage.includes('credential_encryption_key') ||
        errorMessage.includes('clave de encriptación')
      ) {
        throw new Error(
          'CREDENTIAL_ENCRYPTION_KEY no está configurada. ' +
            'Necesitas configurar esta variable de entorno para desencriptar credenciales de tenants. ' +
            'Genera una clave con: crypto.randomBytes(32).toString("hex")'
        );
      }

      // Si es un error de formato (bad decrypt), puede ser que la credencial no esté encriptada
      if (
        errorMessage.includes('bad decrypt') ||
        errorMessage.includes('formato de texto encriptado inválido')
      ) {
        // Intentar retornar la credencial sin desencriptar (formato antiguo)
        // Validar que no tenga el formato de encriptación (iv:authTag:encryptedData)
        if (!encrypted.includes(':') || encrypted.split(':').length !== 3) {
          console.warn(
            `[TenantCredentials] Credencial no está encriptada (formato antiguo), usando directamente`
          );
          return encrypted;
        }
      }
    }

    // Si no podemos determinar el error, lanzar
    throw error;
  }
}

/**
 * Obtiene las credenciales de Mercado Pago para un tenant específico
 * Incluye cache, validaciones y manejo de errores robusto
 *
 * @param tenantId - ID del tenant
 * @returns Credenciales desencriptadas del tenant
 * @throws Error si el tenant no existe, está inactivo, no tiene Mercado Pago habilitado, o no tiene credenciales
 */
export async function getTenantMercadoPagoCredentials(
  tenantId: string
): Promise<TenantMercadoPagoCredentials> {
  // Limpiar cache expirado
  cleanCache();

  // Verificar cache
  const cached = credentialsCache.get(tenantId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.credentials;
  }

  // Obtener tenant de la BD
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      isActive: true,
      mercadoPagoEnabled: true,
      mercadoPagoAccessToken: true,
      mercadoPagoPublicKey: true,
      mercadoPagoWebhookSecret: true,
      mercadoPagoEnvironment: true,
      updatedAt: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant no encontrado: ${tenantId}`);
  }

  // Validar que el tenant esté activo
  if (!tenant.isActive) {
    throw new Error(
      `Tenant ${tenantId} está inactivo. No se pueden usar credenciales de Mercado Pago.`
    );
  }

  // Validar que Mercado Pago esté habilitado
  if (!tenant.mercadoPagoEnabled) {
    throw new Error(
      `Mercado Pago no está habilitado para el tenant ${tenantId}. ` +
        `Habilita Mercado Pago en la configuración del tenant antes de usar pagos.`
    );
  }

  // Validar que tenga accessToken
  if (!tenant.mercadoPagoAccessToken) {
    throw new Error(
      `El tenant ${tenantId} no tiene credenciales de Mercado Pago configuradas. ` +
        `Configura el Access Token en la configuración del tenant.`
    );
  }

  // Desencriptar credenciales
  let accessToken: string;
  let publicKey: string | null = null;
  let webhookSecret: string | null = null;

  try {
    accessToken =
      tryDecrypt(tenant.mercadoPagoAccessToken) || tenant.mercadoPagoAccessToken;

    if (tenant.mercadoPagoPublicKey) {
      publicKey = tryDecrypt(tenant.mercadoPagoPublicKey);
    }

    if (tenant.mercadoPagoWebhookSecret) {
      webhookSecret = tryDecrypt(tenant.mercadoPagoWebhookSecret);
    }
  } catch (error) {
    console.error(
      `[TenantCredentials] Error desencriptando credenciales para tenant ${tenantId}:`,
      error
    );
    throw new Error(
      `Error al desencriptar credenciales del tenant ${tenantId}: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }

  // Validar formato básico del accessToken
  if (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-')) {
    console.warn(
      `[TenantCredentials] Access Token del tenant ${tenantId} no tiene formato esperado (APP_USR- o TEST-)`
    );
  }

  // Determinar environment
  const environment = (tenant.mercadoPagoEnvironment || 'sandbox') as
    | 'sandbox'
    | 'production';

  const credentials: TenantMercadoPagoCredentials = {
    accessToken,
    publicKey,
    webhookSecret,
    environment,
  };

  // Guardar en cache
  credentialsCache.set(tenantId, {
    credentials,
    expiresAt: Date.now() + CACHE_TTL,
    tenantUpdatedAt: tenant.updatedAt,
  });

  return credentials;
}

/**
 * Invalida el cache de credenciales para un tenant específico
 * Debe llamarse cuando se actualicen las credenciales del tenant
 *
 * @param tenantId - ID del tenant
 */
export function invalidateCredentialsCache(tenantId: string): void {
  credentialsCache.delete(tenantId);
}

/**
 * Limpia todo el cache de credenciales
 */
export function clearCredentialsCache(): void {
  credentialsCache.clear();
}

