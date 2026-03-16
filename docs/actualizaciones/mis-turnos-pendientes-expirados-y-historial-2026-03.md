# Mis Turnos: turnos viejos pendientes y limpieza del historial (2026-03)

**Fecha:** Marzo 2026  
**Relación:** [Turnos pendientes: bloqueo y expiración](../admin/turnos-pendientes-bloqueo-temporal-y-expiracion.md), [Cancelación lazy + cron](../actualizaciones/lazy-cron-reutilizar-fila-cancelada-2026-03.md)

Resumen de los cambios: (1) cancelar en backend las reservas PENDING sin pago cuyo **slot ya pasó** (no solo por `expiresAt`), para que no sigan mostrándose como "Pendiente" en Mis Turnos; (2) en la sección **Historial de Reservas**, no mostrar las reservas canceladas y sin pago (datos innecesarios). Los turnos realmente pendientes de pago (PENDING con slot futuro) se siguen mostrando y con aviso, sin cambios.

---

## 1. Problema que se aborda

En la sección **Mis Turnos** del dashboard, algunas reservas aparecían con estado "Pendiente" (chip) aunque en realidad eran turnos ya pasados que no se pagaron o se cancelaron. Además, en **Historial de Reservas** se listaban muchas entradas canceladas y sin pago, generando ruido y datos poco útiles.

- **Objetivo:** Que los turnos viejos que no se pagaron o ya se cancelaron no figuren como "Pendiente" y que el historial no se llene con canceladas sin pago.

---

## 2. Cancelación de PENDING con slot ya pasado (backend)

### Comportamiento anterior

`ExpiredBookingsService` solo cancelaba reservas PENDING sin pago con **`expiresAt` pasada** (ventana de tiempo para pagar). Las reservas PENDING cuyo slot (fecha + hora de fin) ya había pasado pero no tenían `expiresAt` o tenían una ventana amplia seguían en estado PENDING y se mostraban como "Pendiente" en Mis Turnos.

### Cambio realizado

Se amplía la lógica de cancelación para incluir **reservas PENDING sin pago cuyo slot ya pasó**:

- **Criterio "slot pasado":** Se considera el instante de fin del turno como `bookingDate` + `endTime`. Si ese instante es anterior a *ahora*, la reserva se considera expirada por tiempo (turno viejo).
- **Alcance:** Se buscan PENDING sin pagos con `bookingDate` en los **últimos 90 días** y, en aplicación, se filtran las que tienen `slotEnd < now`; el resto se cancelan en bloque con `updateMany`.
- **Motivo de cancelación:** Se actualiza `cancellationReason` a una frase que indica tanto timeout de pago como turno ya pasado.

Así, al entrar a Mis Turnos o al consultar disponibilidad/slots, la llamada lazy a `cancelExpiredBookings(tenantId)` (ya existente en `/api/bookings/user`, `/api/slots` y `/api/bookings/availability`) también limpia estos PENDING de turnos viejos y dejan de mostrarse como "Pendiente".

**Archivo modificado:**

- `lib/services/bookings/ExpiredBookingsService.ts`:
  - Comentario de cabecera actualizado: se documenta que se cancelan tanto reservas con `expiresAt` pasada como aquellas cuyo slot ya pasó.
  - Nueva función auxiliar `getSlotEnd(bookingDate, endTime)` para calcular el instante de fin del slot.
  - En `cancelExpiredBookings()`:
    1. Se mantiene la cancelación por `expiresAt` (usando `buildExpiredPendingWithoutPaymentsWhere`).
    2. Se añade una segunda fase: buscar PENDING sin pagos con `bookingDate >= (now - 90 días)`, y en código filtrar las que tienen `getSlotEnd(bookingDate, endTime) < now`.
    3. Se unifican los IDs a cancelar (por expiresAt y por slot pasado) y se ejecuta un solo `updateMany` con `status: 'CANCELLED'`, `cancelledAt`, `cancellationReason` y `updatedAt`.

---

## 3. Limpieza del historial en Mis Turnos (frontend)

En la sección **Historial de Reservas**, se dejan de mostrar las reservas que están **canceladas y sin pago** (turnos viejos que no se pagaron o se cancelaron), para no llenar la lista con datos innecesarios.

- **Criterio de filtro:** Si `status === 'CANCELLED'` y `paymentStatus === 'Pending'`, la reserva no se muestra en el historial.
- **Lo que sigue visible:** Reservas completadas, confirmadas, canceladas con algún pago (por ejemplo seña y luego cancelación), etc.

**Archivo modificado:**

- `components/providers/AppStateProvider.tsx`:
  - En `fetchAndSetUserBookings`, después de mapear las reservas pasadas (`pastMapped`), se aplica un filtro `pastFiltered` que excluye las que tienen estado cancelado y pago pendiente.
  - Se asigna `pastFiltered` a `setPastBookings` en lugar de `pastMapped`.

---

## 4. Resumen de archivos tocados

| Archivo | Cambio |
|---------|--------|
| `lib/services/bookings/ExpiredBookingsService.ts` | Cancelar PENDING sin pago cuyo slot ya pasó (además de expiresAt); `getSlotEnd()`; un solo `updateMany` para ambos casos. |
| `components/providers/AppStateProvider.tsx` | Filtrar historial: no mostrar canceladas sin pago en Mis Turnos. |

---

## 5. Comportamiento esperado

- **Turnos pendientes de pago (slot futuro):** Siguen mostrándose en "Reservas Actuales" y con aviso de pago; sin cambios.
- **Turnos viejos no pagados:** La primera vez que el usuario abre Mis Turnos (o se consulta disponibilidad/slots) después del cambio, esas reservas PENDING se marcan CANCELLED y dejan de aparecer como "Pendiente".
- **Historial:** En "Historial de Reservas" solo se listan reservas que no son "cancelada + sin pago", reduciendo ruido y datos innecesarios.
