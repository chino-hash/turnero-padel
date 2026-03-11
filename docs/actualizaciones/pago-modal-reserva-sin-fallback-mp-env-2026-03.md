# Pago desde modal de reserva sin fallback a Mercado Pago de .env (2026-03)

**Fecha:** Marzo 2026  
**Contexto:** Flujo "Confirmar Reserva" en el dashboard (modal al elegir un horario).  
**Objetivo:** No usar las credenciales de Mercado Pago de `.env.local` para el flujo de pago del tenant; si el tenant no tiene MP conectado, mostrar un mensaje claro y no redirigir.

---

## 1. Objetivo del cambio

- **No usar** las variables `MERCADOPAGO_*` de `.env.local` en el flujo de pago de reservas del tenant (esa cuenta se reserva para otro uso).
- Si el **tenant no tiene Mercado Pago conectado:** al apretar "Confirmar reserva" debe mostrarse el mensaje: *"Mercado Pago no está conectado, no es posible hacer la transferencia"* y no crearse redirección a MP.
- Si el **tenant tiene Mercado Pago conectado:** el flujo crea la reserva, obtiene la preferencia de pago y redirige al usuario al checkout de Mercado Pago (`initPoint` / `sandboxInitPoint`).

---

## 2. Cambios realizados

### 2.1. PaymentProviderFactory (`lib/services/payments/PaymentProviderFactory.ts`)

- **Antes:** Si el tenant no tenía credenciales de MP (o fallaba `getTenantMercadoPagoCredentials`), se hacía fallback a `getGlobalPaymentProvider()`, que usa `MERCADOPAGO_ACCESS_TOKEN` de `.env.local`.
- **Ahora:** Cuando se llama `getPaymentProvider(tenantId)` con `tenantId` definido y no se pueden obtener credenciales del tenant (salvo los casos "tenant inactivo" o "MP no está habilitado", que siguen devolviendo Mock), **no** se usa el provider global. Se relanza el error para que el llamador (p. ej. `BookingService.createPaymentPreference`) pueda responder con un mensaje y código claros.

### 2.2. BookingService (`lib/services/BookingService.ts`)

- En el `catch` de `createPaymentPreference`:
  - Se detecta si el error corresponde a "tenant sin Mercado Pago" (mensaje que contenga "no tiene credenciales", "no está habilitado", "inactivo" o "mercado pago").
  - En ese caso se devuelve:
    - `success: false`
    - `message` y `error`: *"Mercado Pago no está conectado. No es posible hacer la transferencia."*
    - `code: 'MERCADOPAGO_NOT_CONNECTED'`
  - Para cualquier otro error se devuelve un mensaje genérico ("Error al crear la preferencia de pago") sin exponer detalles internos.

### 2.3. Tipo ApiResponse (`lib/validations/common.ts`)

- Se añadió el campo opcional `code?: string` al tipo `ApiResponse` para que las respuestas de la API puedan incluir un código estable (p. ej. `MERCADOPAGO_NOT_CONNECTED`) y el front pueda detectarlo sin depender del texto del mensaje.

### 2.4. API payment-preference (`app/api/bookings/[id]/payment-preference/route.ts`)

- Cuando `createPaymentPreference` devuelve `code === 'MERCADOPAGO_NOT_CONNECTED'`, la ruta responde con **HTTP 503** (Service Unavailable).
- El cuerpo de la respuesta incluye `success`, `error`, `message` y `code`, de modo que el cliente puede mostrar el mensaje y no redirigir.

### 2.5. Front: modal "Confirmar Reserva" (`padel-booking.tsx`)

- **Estado:** Se añadió `confirmReservationLoading` para evitar doble clic y mostrar "Redirigiendo a Mercado Pago..." en el botón mientras se procesa.
- **Flujo de "Confirmar reserva":**
  1. Se crea la reserva con `POST /api/bookings` (se usa `createResult.data` como reserva; el API devuelve `{ success, data, message }`).
  2. Se llama a `POST /api/bookings/[bookingId]/payment-preference`.
  3. Si la respuesta tiene `code === 'MERCADOPAGO_NOT_CONNECTED'`: se muestra el mensaje *"Mercado Pago no está conectado, no es posible hacer la transferencia"* (alert), se cierra el modal y **no** se redirige.
  4. Si la respuesta es correcta: se obtiene `sandboxInitPoint` o `initPoint` y se redirige con `window.location.href = url`.
- El botón "Confirmar Reserva" se deshabilita mientras corre el flujo.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/services/payments/PaymentProviderFactory.ts` | Eliminado fallback a provider global cuando hay `tenantId` y faltan credenciales del tenant; se relanza el error. |
| `lib/services/BookingService.ts` | En el catch de `createPaymentPreference`, detección de error "tenant sin MP" y respuesta con mensaje unificado y `code: 'MERCADOPAGO_NOT_CONNECTED'`. |
| `lib/validations/common.ts` | Añadido `code?: string` a `ApiResponse`. |
| `app/api/bookings/[id]/payment-preference/route.ts` | Respuesta con status 503 cuando `result.code === 'MERCADOPAGO_NOT_CONNECTED'`. |
| `padel-booking.tsx` | Handler de "Confirmar reserva": crear reserva → payment-preference; si `MERCADOPAGO_NOT_CONNECTED`, mostrar mensaje y no redirigir; si ok, redirigir a MP. Estado de carga en el botón. |

---

## 4. Comportamiento resultante

- **Tenant con MP conectado:** El usuario hace clic en "Confirmar reserva" → se crea la reserva → se obtiene la preferencia de pago con las credenciales del tenant → se redirige al checkout de Mercado Pago.
- **Tenant sin MP conectado:** El usuario hace clic en "Confirmar reserva" → se crea la reserva → la llamada a payment-preference falla (el factory no usa .env) → la API devuelve 503 y `code: 'MERCADOPAGO_NOT_CONNECTED'` → el front muestra el mensaje acordado, cierra el modal y no redirige.

**Nota:** Si el tenant no tiene MP, la reserva se crea igual (queda en estado PENDING). El mensaje evita que el usuario espere una redirección que no ocurrirá. Si se desea no crear la reserva cuando no hay MP, haría falta un paso previo (p. ej. endpoint o comprobación) antes de llamar a `POST /api/bookings`.

---

## 5. Relación con otra documentación

- **Estado general de pagos con MP:** [sistema-pago-mercadopago-estado-2026-03.md](./sistema-pago-mercadopago-estado-2026-03.md).
- **Multitenant y credenciales por tenant:** [multitenant/ALTA_TENANT_PLANES_CONFIGURACION.md](../multitenant/ALTA_TENANT_PLANES_CONFIGURACION.md), [multitenant/BOOTSTRAP_TENANT_Y_PAGOS.md](../multitenant/BOOTSTRAP_TENANT_Y_PAGOS.md).
