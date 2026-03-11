# Estado del sistema de pago con Mercado Pago (2026-03)

**Fecha:** Marzo 2026  
**Objetivo:** Resumen de lo implementado y lo que falta para que el flujo de pago con Mercado Pago funcione de punta a punta.

---

## 1. Lo que está implementado

### 1.1 Backend – Proveedor y preferencias

- **`lib/services/payments/MercadoPagoProvider.ts`**
  - Integración con SDK oficial `mercadopago` (v2.11+).
  - `createPreference`: crea una preferencia en Mercado Pago con:
    - `items` (bookingId, título, descripción, monto en ARS).
    - `external_reference`: ID de la reserva.
    - `notification_url`: `${baseUrl}/api/webhooks/payments`.
    - `expires` y `expiration_date_to` según `expiresAt` de la reserva.
    - `back_urls`: success, failure, pending (ver punto 2.2).
  - Devuelve `preferenceId`, `initPoint` y `sandboxInitPoint` para redirigir al checkout de MP.

- **`lib/services/payments/PaymentProviderFactory.ts`**
  - Resuelve el proveedor por **tenant** (credenciales en BD) o **global** (variables de entorno cuando no se pasa `tenantId`).
  - Si se pasa `tenantId` y el tenant no tiene credenciales válidas, **no** se usa el provider global (.env); se lanza error para que el llamador devuelva un mensaje claro (véase [Pago modal reserva sin fallback MP env](./pago-modal-reserva-sin-fallback-mp-env-2026-03.md)).
  - Si no hay credenciales válidas y no hay tenantId, usa `MockPaymentProvider` (solo para desarrollo).

- **`lib/services/payments/tenant-credentials.ts`**
  - Obtiene credenciales de Mercado Pago por tenant: `accessToken`, `publicKey`, `webhookSecret`, `environment`.
  - Cache en memoria (TTL 5 min), desencriptación con `CREDENTIAL_ENCRYPTION_KEY`.
  - Exige tenant activo, `mercadoPagoEnabled` y `mercadoPagoAccessToken` configurado.

### 1.2 API de preferencia de pago

- **`POST /api/bookings/[id]/payment-preference`**
  - Requiere sesión y permisos (admin del tenant o dueño de la reserva).
  - Llama a `BookingService.createPaymentPreference(bookingId)`.
  - Retorna `{ success, data: { preferenceId, initPoint, sandboxInitPoint } }` para que el cliente redirija al usuario al checkout de MP.
  - Si el tenant no tiene Mercado Pago conectado, responde con **503** y `{ success: false, code: 'MERCADOPAGO_NOT_CONNECTED', error: '...' }` (véase [Pago modal reserva sin fallback MP env](./pago-modal-reserva-sin-fallback-mp-env-2026-03.md)).

### 1.3 Webhook de pagos

- **`POST /api/webhooks/payments`**
  - Ruta pública (allowlist en `middleware.ts`).
  - Valida firma de Mercado Pago (`x-signature`, `x-request-id`) si está configurado `MERCADOPAGO_WEBHOOK_SECRET` (global) o el webhook secret del tenant.
  - Cache anti-replay por `request_id` (5 min).
  - Delega en `BookingWebhookHandler`.

- **`lib/services/payments/BookingWebhookHandler.ts`**
  - Procesa solo notificaciones `type === 'payment'`.
  - Si el payload trae solo `data.id`, consulta la API de MP para obtener estado y `external_reference` (bookingId).
  - **Pago aprobado y reserva PENDING:** actualiza reserva a `CONFIRMED`, `paymentStatus: DEPOSIT_PAID`, `expiresAt: null`, y crea registro en `Payment`.
  - **Pago aprobado y reserva CANCELLED (pago tardío):** si la cancha sigue libre, reactiva la reserva y registra el pago; si hay conflicto, registra el pago e intenta reembolso automático vía `RefundService` y notificación de conflicto.

### 1.4 Reembolsos

- **`lib/services/payments/MercadoPagoRefundService.ts`**
  - Reembolsos vía API de MP (parcial o total).
  - Validaciones: pago aprobado, plazo 180 días desde aprobación, no reembolsado previamente.
  - Idempotencia con `idempotencyKey`.

- **`lib/services/payments/RefundService.ts`**
  - Resuelve proveedor por tenant o global; usa `MercadoPagoRefundService` o `MockRefundService`.

### 1.5 Modelo de datos

- **Tenant (Prisma):** `mercadoPagoEnabled`, `mercadoPagoAccessToken`, `mercadoPagoPublicKey`, `mercadoPagoWebhookSecret`, `mercadoPagoEnvironment`.
- **Payment:** registros creados por el webhook (bookingId, amount, paymentMethod: CARD, paymentType: PAYMENT, referenceNumber = ID de pago MP, status: completed).

### 1.6 Configuración de tenants

- **Super Admin:** edición de tenant con campos de Mercado Pago (`app/super-admin/tenants/[id]/page.tsx`).
- **Bootstrap:** `scripts/bootstrap-tenant.js` y API `POST /api/tenants/bootstrap` pueden asignar credenciales desde env al tenant.

---

## 2. Lo que falta para que funcione de punta a punta

### 2.1 UI para iniciar el pago (crítico)

- **Problema:** No existe en la app ninguna pantalla que:
  1. Muestre un botón tipo “Pagar con Mercado Pago” (o “Pagar seña”) para una reserva pendiente.
  2. Llame a `POST /api/bookings/[id]/payment-preference` con el `id` de esa reserva.
  3. Redirija al usuario a `data.initPoint` (o `data.sandboxInitPoint` en sandbox) para completar el pago en Mercado Pago.

- **Dónde encajaría:** Por ejemplo en **Mis Turnos** (`components/MisTurnos.tsx`): para reservas con `paymentStatus === 'Pending'` y que sigan vigentes (no expiradas), mostrar un botón que ejecute el flujo anterior. Alternativamente (o además) en una vista de detalle de reserva o en el flujo post-reserva.

- **Resumen:** El backend ya expone la preferencia y la URL de checkout; falta el único paso de UI que une “quiero pagar esta reserva” con “redirigir a initPoint”.

### 2.2 Páginas de retorno después del pago

- **Problema:** En `BookingService.createPaymentPreference` las `back_urls` están definidas como:
  - Success: `${baseUrl}/reservas/exito`
  - Failure: `${baseUrl}/reservas/error`
  - Pending: `${baseUrl}/reservas/pendiente`

  No existen rutas en la app para `/reservas/exito`, `/reservas/error` ni `/reservas/pendiente`. Tras pagar en MP, el usuario vuelve a URLs que hoy darían 404.

- **Acción:** Crear al menos tres páginas (o una con query param), por ejemplo:
  - `app/reservas/exito/page.tsx`
  - `app/reservas/error/page.tsx`
  - `app/reservas/pendiente/page.tsx`

  Que muestren un mensaje claro y, si aplica, enlace a “Mis Turnos” o al inicio del club.

### 2.3 Configuración del webhook en Mercado Pago

- **Problema:** La aplicación ya tiene el endpoint y la lógica para procesar notificaciones, pero Mercado Pago debe conocer la URL y enviar allí los eventos.

- **Acción:** En el [panel de desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers), en la aplicación usada (por tenant o global), configurar la **URL de notificaciones** para pagos con la URL pública del proyecto, por ejemplo:
  - `https://tu-dominio.com/api/webhooks/payments`

  Sin este paso, MP no notificará y la reserva no pasará automáticamente a CONFIRMED ni se creará el registro en `Payment`.

### 2.4 Variables de entorno y credenciales

Para que el proveedor real se use:

- **Opción global (un solo MP por entorno):**
  - `MERCADOPAGO_ACCESS_TOKEN` (obligatorio).
  - `MERCADOPAGO_WEBHOOK_SECRET` (recomendado para validar firma del webhook).
  - Opcional: `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_ENVIRONMENT` (sandbox | production), `PAYMENT_PROVIDER=mercadopago`.

- **Opción por tenant (multitenant):**
  - Tenant con `mercadoPagoEnabled = true` y credenciales en BD (`mercadoPagoAccessToken` obligatorio; `mercadoPagoWebhookSecret` recomendado).
  - Si las credenciales se guardan encriptadas: `CREDENTIAL_ENCRYPTION_KEY` en el servidor (32 bytes hex).

- **Documentación:** Las variables de Mercado Pago no están listadas en `docs/deployment/VARIABLES_ENTORNO.md`; conviene añadirlas ahí o en un doc específico de pagos.

### 2.5 Página mock para desarrollo (opcional)

- **Problema:** `MockPaymentProvider` devuelve `initPoint` apuntando a `${baseUrl}/payments/mock-success?bookingId=...`. No existe la ruta `/payments/mock-success` en la app.

- **Impacto:** Solo afecta a desarrollo con proveedor mock (sin credenciales de MP). No bloquea el flujo real.

- **Acción opcional:** Crear `app/payments/mock-success/page.tsx` que muestre “Pago simulado” y, si se desea simular el efecto del webhook en local, documentar cómo disparar manualmente el handler o un script de prueba.

---

## 3. Checklist resumido

| Elemento | Estado |
|----------|--------|
| MercadoPagoProvider (preferencia, init_point, notification_url) | ✅ Implementado |
| PaymentProviderFactory (tenant / global / mock) | ✅ Implementado |
| Credenciales por tenant (BD + cache + decrypt) | ✅ Implementado |
| POST /api/bookings/[id]/payment-preference | ✅ Implementado |
| POST /api/webhooks/payments + firma + anti-replay | ✅ Implementado |
| BookingWebhookHandler (approved → CONFIRMED, Payment, reembolso por conflicto) | ✅ Implementado |
| MercadoPagoRefundService + RefundService | ✅ Implementado |
| Botón / pantalla “Pagar” que llame a la API y redirija a initPoint | ❌ Falta |
| Páginas /reservas/exito, /reservas/error, /reservas/pendiente | ❌ Faltan |
| URL de webhook configurada en el panel de Mercado Pago | ⚠️ Configuración manual |
| Variables MERCADOPAGO_* (o credenciales por tenant) | ⚠️ Configuración manual |
| Página /payments/mock-success (solo mock) | ❌ Opcional |

---

## 4. Orden sugerido para cerrar el flujo

1. **Configurar credenciales** (env o por tenant) y, en producción, la URL del webhook en el panel de MP.
2. **Añadir la UI de “Pagar”** (ej. en Mis Turnos) que llame a `POST /api/bookings/[id]/payment-preference` y redirija a `initPoint` (o `sandboxInitPoint`).
3. **Crear las páginas de retorno** `/reservas/exito`, `/reservas/error`, `/reservas/pendiente`.
4. (Opcional) Página mock `/payments/mock-success` y documentar variables de Mercado Pago en `VARIABLES_ENTORNO.md` o en un doc de pagos.

Con eso, el flujo queda: usuario paga desde la app → redirección a MP → pago → vuelta a /reservas/exito (o error/pendiente) y, en paralelo, webhook actualiza la reserva a CONFIRMED y crea el `Payment`.

---

## 5. Ver también

- **[Pago desde modal de reserva sin fallback a MP de .env](./pago-modal-reserva-sin-fallback-mp-env-2026-03.md)** (2026-03): implementación del botón "Confirmar reserva" en el modal del dashboard que crea la reserva, llama a payment-preference y redirige a Mercado Pago; sin uso de credenciales globales cuando el tenant no tiene MP conectado (mensaje claro al usuario).
