# Pendientes solo en grilla, PENDING → CONFIRMED y sync al volver de MP (2026-03)

**Fecha:** Marzo 2026  
**Objetivo:** Que los turnos con status PENDING se muestren solo en la grilla de disponibilidad; que al pagar la reserva pase a CONFIRMED de forma fiable (webhook + fallback); y que en Mis Turnos no se muestren pendientes ni el turno tras el pago como pendiente.

---

## 1. Resumen de lo implementado

### 1.1 Pendientes solo en la grilla

- **Lista de Turnos y Reservas (admin):** Sin cambios. En `AdminTurnos.tsx` se mantiene el filtro que excluye `status === 'pendiente'` en `filteredBookings`. Los pendientes solo aparecen en la grilla "Disponibilidad de canchas (semana)".
- **Mis Turnos (dashboard):** En `components/providers/AppStateProvider.tsx`, en `fetchAndSetUserBookings`, la lista que se asigna a `currentBookings` ahora **excluye todas las reservas con status PENDING** (no solo las expiradas). Filtro: `currentMapped.filter((b) => (b.status || '').toUpperCase() !== 'PENDING')`. En Mis Turnos solo se ven CONFIRMED, ACTIVE, COMPLETED.

### 1.2 Fallback: sync-payment-status

Para no depender solo del webhook (que puede tardar o fallar por URL/firma), se implementó un endpoint que el front llama al volver de Mercado Pago:

- **`POST /api/bookings/[id]/sync-payment-status`** (`app/api/bookings/[id]/sync-payment-status/route.ts`)
  - Requiere sesión; solo dueño de la reserva o admin del tenant.
  - Si la reserva no está PENDING, devuelve el booking actual.
  - Si está PENDING: con credenciales MP del tenant, busca pagos con `external_reference = bookingId` vía `GET https://api.mercadopago.com/v1/payments/search?external_reference=...`. Si hay un pago con `status === 'approved'`, actualiza la reserva a CONFIRMED, paymentStatus DEPOSIT_PAID, expiresAt null, crea el registro en `Payment`, y devuelve el booking actualizado.
  - Respuesta: `{ success, data: booking, updated?: boolean }`.

### 1.3 URL de éxito con bookingId y llamada al sync desde el front

- **`lib/services/bookings/payment-success-url.js`**
  - `buildPaymentSuccessUrl(baseUrl, tenantSlug, bookingId?)`: nuevo tercer argumento opcional `bookingId`. La URL de éxito incluye `?section=turnos&bookingId=xxx` cuando se pasa bookingId, para que al volver del checkout el front pueda llamar a sync-payment-status.
- **`lib/services/BookingService.ts`**
  - Al crear la preferencia de pago se pasa `booking.id` a `buildPaymentSuccessUrl(baseUrl, tenantSlug, booking.id)`.
- **`components/providers/AppStateProvider.tsx`**
  - Efecto al tener `?section=turnos` o `bookingId` en la URL: si hay `bookingId`, llama a `POST /api/bookings/[bookingId]/sync-payment-status` y luego hace refetch de reservas (`refetchUserBookings`). Refetch de nuevo a los 3 s. Al limpiar la URL se eliminan `section` y `bookingId`.
- **`app/reservas/exito/page.tsx`**
  - Si la página de éxito recibe `bookingId` en la query (flujo sin tenant), hace una llamada a sync-payment-status al montar para sincronizar el estado del pago.

### 1.4 Diagnóstico del webhook

- **`app/api/webhooks/payments/route.ts`:** Log al recibir POST con `type`, `dataId` y `external_reference`.
- **`lib/services/payments/BookingWebhookHandler.ts`:** Log con `paymentStatus` y `bookingId` tras resolver el pago; log cuando la reserva se actualiza a CONFIRMED.

---

## 2. Archivos modificados o nuevos

| Archivo | Cambio |
| --------| ------ |
| `components/providers/AppStateProvider.tsx` | Filtro PENDING en currentBookings; efecto que llama sync-payment-status cuando hay bookingId en URL y refetch; limpieza de bookingId en URL. |
| `app/api/bookings/[id]/sync-payment-status/route.ts` | **Nuevo.** POST para sincronizar estado de pago con MP y actualizar reserva a CONFIRMED si hay pago aprobado. |
| `lib/services/bookings/payment-success-url.js` | buildPaymentSuccessUrl acepta tercer argumento `bookingId` y lo añade a la query. |
| `lib/services/BookingService.ts` | Pasa `booking.id` a buildPaymentSuccessUrl al crear la preferencia. |
| `app/reservas/exito/page.tsx` | useEffect que llama sync-payment-status cuando hay bookingId en searchParams. |
| `app/api/webhooks/payments/route.ts` | Log de diagnóstico al recibir webhook (type, dataId, external_reference). |
| `lib/services/payments/BookingWebhookHandler.ts` | Logs de diagnóstico (paymentStatus, bookingId; reserva actualizada a CONFIRMED). |
| `__tests__/lib/services/bookings/payment-success-url.test.ts` | Tests actualizados para la nueva firma con bookingId y URL con section=turnos. |

---

## 3. Flujo resultante

1. Usuario crea reserva → queda PENDING. No se muestra en Mis Turnos ni en la Lista de Turnos; solo en la grilla de disponibilidad.
2. Usuario paga en Mercado Pago. El webhook (si llega) actualiza la reserva a CONFIRMED.
3. MP redirige a la URL de éxito con `?section=turnos&bookingId=xxx`. El front llama a sync-payment-status para ese bookingId (por si el webhook no actualizó aún) y hace refetch de reservas. Si el pago estaba aprobado, la reserva pasa a CONFIRMED y aparece en Mis Turnos y en la Lista de Turnos.
4. Al no mostrarse PENDING en Mis Turnos, el turno "no se sigue viendo" como pendiente después del pago: solo se ve cuando ya está CONFIRMED.
