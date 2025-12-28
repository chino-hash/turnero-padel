# Integración de Pagos - Arquitectura

Este documento describe la arquitectura de integración de pagos preparada para Mercado Pago y otros proveedores.

## Visión General

El sistema está diseñado con una arquitectura basada en interfaces que permite cambiar de proveedor de pago sin afectar la lógica de negocio. Actualmente está preparado para integrar Mercado Pago, pero funciona con implementaciones mock para desarrollo.

## Componentes Principales

### Interfaces

#### `IPaymentProvider`
**Ubicación:** `lib/services/payments/interfaces/IPaymentProvider.ts`

Interface base para proveedores de pago. Define el contrato para crear preferencias de pago.

```typescript
interface IPaymentProvider {
  createPreference(params: CreatePaymentPreferenceParams): Promise<PaymentPreferenceResult>;
}
```

**Implementaciones:**
- `MockPaymentProvider`: Implementación mock para desarrollo (actual)
- `MercadoPagoProvider`: Implementación futura para Mercado Pago

#### `IRefundService`
**Ubicación:** `lib/services/payments/interfaces/IRefundService.ts`

Interface para servicios de reembolso. Define el contrato para procesar reembolsos.

```typescript
interface IRefundService {
  processRefund(params: ProcessRefundParams): Promise<RefundResult>;
}
```

**Implementaciones:**
- `MockRefundService`: Implementación mock para desarrollo (actual)
- `MercadoPagoRefundService`: Implementación futura para Mercado Pago

#### `IWebhookHandler`
**Ubicación:** `lib/services/payments/interfaces/IWebhookHandler.ts`

Interface para handlers de webhooks. Define el contrato para procesar notificaciones de pago.

```typescript
interface IWebhookHandler {
  handle(payload: WebhookPayload): Promise<WebhookResult>;
}
```

**Implementaciones:**
- `BookingWebhookHandler`: Handler genérico con lógica de negocio (actual)
- `MercadoPagoWebhookHandler`: Handler específico para Mercado Pago (futuro)

## Flujo de Integración

### Creación de Reserva con Pago

```
Usuario selecciona turno
    ↓
BookingService.createBooking() crea reserva con expiresAt
    ↓
BookingService.createPaymentPreference() obtiene IPaymentProvider
    ↓
IPaymentProvider.createPreference() crea preferencia en proveedor
    ↓
Retorna URL de pago al frontend
    ↓
Usuario completa pago en proveedor
    ↓
Webhook del proveedor notifica al sistema
```

### Webhook de Pago

```
Webhook recibido en /api/webhooks/payments
    ↓
IWebhookHandler.handle() procesa notificación
    ↓
Si pago aprobado:
    - Busca reserva por external_reference
    - Si status === 'PENDING': Actualiza a 'CONFIRMED'
    - Si status === 'CANCELLED' (pago tardío):
        * Re-verifica disponibilidad
        * Si libre: Reactiva reserva
        * Si ocupada: Marca 'PAYMENT_CONFLICT' y procesa reembolso
```

## Implementación Futura: Mercado Pago

### Pasos para Implementar MercadoPagoProvider

1. **Instalar SDK de Mercado Pago:**
```bash
npm install mercadopago
```

2. **Crear MercadoPagoProvider:**
```typescript
// lib/services/payments/MercadoPagoProvider.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { IPaymentProvider, CreatePaymentPreferenceParams, PaymentPreferenceResult } from './interfaces/IPaymentProvider';

export class MercadoPagoProvider implements IPaymentProvider {
  private client: MercadoPagoConfig;
  
  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      options: { timeout: 5000 }
    });
  }

  async createPreference(params: CreatePaymentPreferenceParams): Promise<PaymentPreferenceResult> {
    const preference = new Preference(this.client);
    
    const preferenceData = {
      items: [{
        id: params.bookingId,
        title: params.title,
        description: params.description,
        quantity: 1,
        unit_price: params.amount / 100, // MP espera pesos, no centavos
        currency_id: 'ARS'
      }],
      external_reference: params.bookingId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payments`,
      expires: true,
      expiration_date_to: params.expiresAt.toISOString(),
      back_urls: params.backUrls,
      auto_return: 'approved'
    };

    const response = await preference.create({ body: preferenceData });
    
    return {
      preferenceId: response.id!,
      initPoint: response.init_point!,
      sandboxInitPoint: response.sandbox_init_point
    };
  }
}
```

3. **Actualizar PaymentProviderFactory:**
```typescript
export function getPaymentProvider(): IPaymentProvider {
  if (paymentProviderInstance) {
    return paymentProviderInstance;
  }

  if (process.env.PAYMENT_PROVIDER === 'mercadopago' && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    paymentProviderInstance = new MercadoPagoProvider();
  } else {
    paymentProviderInstance = new MockPaymentProvider();
  }

  return paymentProviderInstance;
}
```

### Pasos para Implementar MercadoPagoRefundService

1. **Crear MercadoPagoRefundService:**
```typescript
// lib/services/payments/MercadoPagoRefundService.ts
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { IRefundService, ProcessRefundParams, RefundResult } from './interfaces/IRefundService';

export class MercadoPagoRefundService implements IRefundService {
  private client: MercadoPagoConfig;
  
  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    try {
      const payment = new Payment(this.client);
      const mpPayment = await payment.get({ id: params.externalPaymentId });

      if (mpPayment.status !== 'approved') {
        throw new Error(`No se puede reembolsar un pago con estado: ${mpPayment.status}`);
      }

      const refundResponse = await payment.refund({
        id: params.externalPaymentId,
        body: {
          amount: params.amount / 100 // MP espera pesos
        }
      });

      return {
        success: true,
        refundId: refundResponse.id?.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
```

2. **Actualizar RefundService para usar MercadoPagoRefundService:**
```typescript
function getRefundService(): IRefundService {
  if (refundServiceInstance) {
    return refundServiceInstance;
  }

  if (process.env.PAYMENT_PROVIDER === 'mercadopago' && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    refundServiceInstance = new MercadoPagoRefundService();
  } else {
    refundServiceInstance = new MockRefundService();
  }

  return refundServiceInstance;
}
```

### Validación de Webhooks de Mercado Pago

Al implementar Mercado Pago, agregar validación de firma en el endpoint de webhook:

```typescript
// app/api/webhooks/payments/route.ts
import crypto from 'crypto';

function validateMercadoPagoSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const payload = `id=${dataId}&request_id=${xRequestId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return expectedSignature === xSignature;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');
  
  // Validar firma si es Mercado Pago
  if (process.env.PAYMENT_PROVIDER === 'mercadopago' && signature && requestId) {
    const body = await request.json();
    const dataId = body.data?.id;
    
    if (!validateMercadoPagoSignature(signature, requestId, dataId)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }
  }

  // ... resto del código
}
```

## Variables de Entorno Necesarias

### Desarrollo (Mock)
No se requieren variables adicionales.

### Producción (Mercado Pago)
```env
PAYMENT_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Estados de Reserva Relacionados con Pagos

- `PENDING`: Reserva creada, esperando pago
- `CONFIRMED`: Pago recibido y procesado
- `PAYMENT_CONFLICT`: Pago tardío recibido pero cancha ya ocupada (requiere reembolso)

## Expiración de Reservas

Las reservas tienen un campo `expiresAt` que se sincroniza con la preferencia de pago. El sistema:

1. Cancela automáticamente reservas expiradas vía job (`ExpiredBookingsService`)
2. Sincroniza la expiración con el proveedor de pago (cuando se implemente)
3. Maneja pagos tardíos mediante re-verificación de disponibilidad

## Testing

Para testing, se pueden usar los servicios mock o inyectar implementaciones personalizadas:

```typescript
import { setPaymentProvider } from '@/lib/services/payments/PaymentProviderFactory';
import { MockPaymentProvider } from '@/lib/services/payments/MockPaymentProvider';

// En tests
setPaymentProvider(new MockPaymentProvider());
```

## Referencias

- [Documentación de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs)
- [API de Preferencias](https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post)
- [API de Reembolsos](https://www.mercadopago.com.ar/developers/es/reference/refunds/_payments_id_refunds/post)


