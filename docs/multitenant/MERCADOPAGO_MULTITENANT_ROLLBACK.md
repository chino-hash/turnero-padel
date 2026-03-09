# Plan de Rollback - Mercado Pago Multitenant

Este documento describe cómo revertir la implementación de Mercado Pago multitenant y volver a usar solo variables de entorno globales si es necesario.

## Estado actual (implementación)

En la app raíz existe integración de pagos con:

- **Preferencia**: `POST /api/bookings/[id]/payment-preference`
- **Webhook**: `POST /api/webhooks/payments` (ruta pública en `middleware.ts`)
- **Provider factory**: `lib/services/payments/PaymentProviderFactory.ts`

El sistema intenta usar credenciales del tenant; si no existen, puede hacer fallback a variables globales (según configuración).

## Situaciones que Requieren Rollback

- Problemas críticos con credenciales por tenant
- Errores en la desencriptación de credenciales
- Necesidad de volver rápidamente al sistema anterior
- Problemas de performance relacionados con el cache

## Opción 1: Rollback Completo (Recomendado para Emergencias)

### Paso 1: Deshabilitar Uso de Credenciales por Tenant

La implementación actual mantiene compatibilidad hacia atrás. Si no se proporciona `tenantId` a `getPaymentProvider()`, el sistema automáticamente usa variables de entorno globales.

**No se requiere cambio de código** - simplemente no pases `tenantId` a las funciones.

### Paso 2: Verificar Variables de Entorno Globales

Asegúrate de que las siguientes variables de entorno estén configuradas:

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret
MERCADOPAGO_PUBLIC_KEY=tu_public_key (opcional)
MERCADOPAGO_ENVIRONMENT=sandbox|production
```

### Paso 3: Verificar que el Sistema Funciona

1. Crear una preferencia de pago (debe usar credenciales globales)
2. Verificar logs - deben mostrar "credenciales globales"
3. Probar webhook (debe validar con secret global)

## Opción 2: Rollback Parcial (Mantener Estructura, Usar Globales)

Si quieres mantener la estructura multitenant pero usar solo credenciales globales temporalmente:

### Modificar BookingService

```typescript
// En BookingService.createPaymentPreference()
// Comentar esta línea:
// const paymentProvider = await getPaymentProvider(tenantId);

// Y usar esta en su lugar:
const paymentProvider = await getPaymentProvider(); // Sin tenantId
```

### Modificar Webhook Handler

El webhook route ya tiene fallback automático a secret global si no puede obtener el tenant.

### Modificar RefundService

```typescript
// En processRefund(), comentar la obtención de credenciales del tenant:
// if (params.tenantId) { ... }

// El sistema automáticamente usará variables globales
```

## Opción 3: Migración Inversa (Mover Credenciales de Tenant a Variables de Entorno)

Si necesitas mover las credenciales del tenant por defecto de vuelta a variables de entorno:

### Script de Migración Inversa

```typescript
// scripts/rollback-mercadopago-to-global.ts
import { prisma } from '../lib/database/neon-config';
import { decryptCredential } from '../lib/encryption/credential-encryption';

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'default' },
    select: {
      mercadoPagoAccessToken: true,
      mercadoPagoWebhookSecret: true,
      mercadoPagoPublicKey: true,
      mercadoPagoEnvironment: true,
    },
  });

  if (!tenant?.mercadoPagoAccessToken) {
    console.error('No hay credenciales en el tenant por defecto');
    return;
  }

  // Desencriptar credenciales
  const accessToken = decryptCredential(tenant.mercadoPagoAccessToken);
  const webhookSecret = tenant.mercadoPagoWebhookSecret 
    ? decryptCredential(tenant.mercadoPagoWebhookSecret)
    : null;

  console.log('Credenciales desencriptadas:');
  console.log(`MERCADOPAGO_ACCESS_TOKEN=${accessToken}`);
  if (webhookSecret) {
    console.log(`MERCADOPAGO_WEBHOOK_SECRET=${webhookSecret}`);
  }
  if (tenant.mercadoPagoPublicKey) {
    console.log(`MERCADOPAGO_PUBLIC_KEY=${tenant.mercadoPagoPublicKey}`);
  }
  console.log(`MERCADOPAGO_ENVIRONMENT=${tenant.mercadoPagoEnvironment || 'sandbox'}`);

  console.log('\n⚠️  IMPORTANTE: Configura estas variables de entorno manualmente');
}
```

## Verificación Post-Rollback

Después de hacer rollback, verifica:

1. **Logs del sistema**: Deben mostrar "credenciales globales" en lugar de "credenciales del tenant"
2. **Creación de preferencias**: Debe funcionar sin errores
3. **Webhooks**: Deben validarse correctamente
4. **Reembolsos**: Deben procesarse correctamente

## Prevención de Problemas

Para evitar necesidad de rollback:

1. **Testing exhaustivo**: Prueba con credenciales de sandbox antes de producción
2. **Feature flags**: Considera agregar un feature flag para habilitar/deshabilitar uso de credenciales por tenant
3. **Monitoreo**: Monitorea logs para detectar problemas temprano
4. **Backup**: Mantén backup de las credenciales antes de migrar

## Feature Flag (Implementación Futura)

Para facilitar rollback en el futuro, considera agregar un feature flag:

```typescript
// lib/config/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_TENANT_CREDENTIALS: process.env.USE_TENANT_CREDENTIALS === 'true',
};

// En PaymentProviderFactory
export async function getPaymentProvider(tenantId?: string): Promise<IPaymentProvider> {
  if (!FEATURE_FLAGS.USE_TENANT_CREDENTIALS || !tenantId) {
    return getGlobalPaymentProvider();
  }
  // ... resto del código
}
```

Luego, para hacer rollback, simplemente:
```bash
USE_TENANT_CREDENTIALS=false
```

## Contacto y Soporte

Si necesitas ayuda con el rollback:
1. Revisa los logs del sistema
2. Verifica las variables de entorno
3. Consulta este documento
4. Contacta al equipo de desarrollo si el problema persiste
