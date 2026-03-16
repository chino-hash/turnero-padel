# Reflejar seña en Admin Turnos (toggles y porcentaje) – 2026-03

**Fecha:** Marzo 2026  
**Plan:** [.cursor/plans/reflejar-seña-admin-turnos-toggles-porcentaje.plan.md](../../.cursor/plans/reflejar-seña-admin-turnos-toggles-porcentaje.plan.md)  
**Relación:** [Mis Turnos: Pendiente y Sincronizar](./mis-turnos-pendiente-ya-pagado-sincronizar-2026-03.md), [Cambios módulo pagos Admin Turnos](./cambios-modulo-pagos-admin-turnos.md)

Documentación de la implementación que hace visible en Admin Turnos el pago de la seña: los toggles por jugador muestran "Pagado" cuando el titular (u otros) pagó, y se muestra un badge con el porcentaje pagado (25%, 50%, 75%, 100%) según la regla 1 jugador = 25%, 2 = 50%, 3 = 75%, 4 = 100%.

---

## 1. Objetivo

- Que el pago de la seña (por Mercado Pago o sincronizado) se refleje en el panel de administración de turnos.
- Que los toggles de pago por jugador (Pagado/Pendiente) muestren el estado real: si el titular pagó la seña, el jugador en posición 1 debe aparecer como "Pagado".
- Mostrar de forma explícita el porcentaje pagado: **25%** = solo titular, **50%** = titular + jugador 2, **75%** = titular + 2 + 3, **100%** = los cuatro jugadores.

---

## 2. Problema que se resolvió

Al aprobar el pago en Mercado Pago (webhook o sync), solo se actualizaba `Booking.paymentStatus` a `DEPOSIT_PAID`; no se actualizaba `BookingPlayer.hasPaid` para el jugador en posición 1 (titular). En Admin Turnos los toggles se construyen desde `apiBooking.players[].hasPaid`, por lo que todos seguían en "Pendiente". Además, las reservas creadas sin enviar `players` no tenían ningún `BookingPlayer`, así que no había a quién marcar como pagado.

---

## 3. Cambios implementados

### 3.1 Webhook de Mercado Pago (BookingWebhookHandler)

**Archivo:** `lib/services/payments/BookingWebhookHandler.ts`

- Se incluye `user: { select: { name: true } }` en el `findUnique` del booking para poder crear el titular con nombre si no existe.
- **Flujo normal (pago aprobado y reserva PENDING):** dentro de la misma transacción, después de actualizar la reserva a CONFIRMED y DEPOSIT_PAID y de crear el registro en `Payment`, se busca el jugador con `bookingId` y `position: 1`. Si existe, se actualiza con `hasPaid: true` y `paidAmount` (en centavos). Si no existe, se crea un `BookingPlayer` con `position: 1`, `playerName: booking.user?.name ?? 'Titular'`, `hasPaid: true` y `paidAmount`. La lógica va en un try/catch para que, si solo falla la actualización/creación del jugador, no se haga rollback de la reserva ni del pago.
- **Flujo pago tardío (reserva CANCELLED reactivada):** en la transacción que reactiva la reserva se aplica la misma lógica de jugador (find → update or create).
- `paidAmount` en centavos: `booking.depositAmount > 0 ? booking.depositAmount : Math.round(booking.totalPrice / 4)`.

### 3.2 Sync de pago desde Mercado Pago

**Archivo:** `app/api/bookings/[id]/sync-payment-status/route.ts`

- Se añade `user: { select: { name: true } }` al `findUnique` del booking.
- Dentro del mismo `$transaction` donde se actualiza la reserva y se crea el `Payment`, se añade la misma lógica idempotente para el jugador en posición 1 (find → update or create), con `paidAmount` en centavos. Try/catch para no hacer rollback si solo falla el jugador.

### 3.3 Crear titular al crear la reserva

**Archivo:** `lib/services/BookingService.ts`

- En `createBooking`, si `input.players` es `undefined` o array vacío, se obtiene el nombre del usuario (`prisma.user.findUnique({ where: { id: userId }, select: { name: true } })`) y se construye `players: [{ playerName: user?.name ?? 'Titular', position: 1 }]` antes de llamar al repository. Así, cualquier reserva creada sin jugadores (usuario o admin) tiene al menos el titular en posición 1 y puede ser marcado como pagado cuando se confirme la seña.

### 3.4 Badge de porcentaje en Admin Turnos

**Archivo:** `components/AdminTurnos.tsx`

- En la sección expandida "Jugadores y Pagos Individuales", junto al título se muestra un badge con el texto "X% pagado" (0, 25, 50, 75 o 100).
- Cálculo: `paidCount = Object.values(booking.individualPayments).filter(s => s === 'pagado').length` y `percent = paidCount === 0 ? 0 : paidCount * 25`.
- Estilos: verde si 100%, ámbar si hay algún pago, gris si 0%.

### 3.5 Migración opcional (reservas existentes)

**Archivo nuevo:** `app/api/bookings/migrate-deposit-paid-player1/route.ts`

- Endpoint **POST** `/api/bookings/migrate-deposit-paid-player1`, restringido a **Super Admin**.
- Para cada reserva con `paymentStatus = DEPOSIT_PAID`, comprueba si existe jugador en posición 1 con `hasPaid: true`. Si no existe ese jugador, lo crea; si existe pero no tiene `hasPaid`, lo actualiza. Usa la misma regla de `paidAmount` en centavos.
- Respuesta: `{ success, data: { totalDepositPaid, updated, created, errors? } }`. Idempotente.

---

## 4. Regla de porcentaje (visualización)

| Jugadores con hasPaid | Porcentaje mostrado |
|------------------------|---------------------|
| 0                      | 0% pagado           |
| 1 (titular)            | 25% pagado          |
| 2                      | 50% pagado          |
| 3                      | 75% pagado          |
| 4                      | 100% pagado         |

La seña configurada por tenant (`deposit_percentage`) define cuánto se cobra en Mercado Pago; el badge refleja cuántos jugadores tienen marcado el pago individual (cada uno cuenta como 25%).

---

## 5. Archivos modificados y nuevos

| Archivo | Cambio |
|---------|--------|
| `lib/services/payments/BookingWebhookHandler.ts` | Incluir `user` en findUnique; marcar/crear jugador 1 en flujo normal y en pago tardío; paidAmount en centavos; try/catch en lógica jugador. |
| `app/api/bookings/[id]/sync-payment-status/route.ts` | Incluir `user` en findUnique; misma lógica jugador dentro de la transacción; try/catch. |
| `lib/services/BookingService.ts` | Si `players` vacío o ausente, construir `players: [{ playerName, position: 1 }]` con nombre del usuario. |
| `components/AdminTurnos.tsx` | Badge "X% pagado" junto al título "Jugadores y Pagos Individuales". |
| `app/api/bookings/migrate-deposit-paid-player1/route.ts` | **Nuevo.** POST solo Super Admin para backfill de jugador 1 en reservas DEPOSIT_PAID. |

---

## 6. Idempotencia y bordes

- **Idempotencia:** En webhook y sync se usa siempre "buscar jugador position 1 → si existe update, si no create", de modo que llamadas repetidas no crean duplicados ni fallan por el unique `(bookingId, position)`.
- **Fallo solo del jugador:** Si la actualización o creación del jugador falla, se registra el error en log y no se re-lanza, para que la transacción haga commit de la reserva y del pago; el admin puede marcar manualmente el pago del titular o ejecutar la migración después.
- **Montos:** `paidAmount` y `totalPrice`/`depositAmount` en BD están en centavos (ver `lib/utils/currency.ts`).

---

## 7. Verificación

- Crear una reserva sin jugadores (desde el modal de usuario o desde admin), pagar la seña por Mercado Pago (o usar sync-payment-status). En Admin Turnos, al expandir el turno, el titular debe aparecer como "Pagado" y el badge debe mostrar "25% pagado".
- Para reservas antiguas con DEPOSIT_PAID pero sin jugador marcado, ejecutar como Super Admin: `POST /api/bookings/migrate-deposit-paid-player1` y comprobar que `updated` o `created` reflejan los cambios.
