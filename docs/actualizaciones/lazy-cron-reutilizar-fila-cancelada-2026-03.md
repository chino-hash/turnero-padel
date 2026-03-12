# Cancelación lazy + cron suave + reutilizar fila cancelada (2026-03)

**Fecha:** Marzo 2026  
**Relación:** [Turnos pendientes: bloqueo y expiración](../../admin/turnos-pendientes-bloqueo-temporal-y-expiracion.md)

Resumen de los cambios: cancelación de reservas PENDING expiradas de forma **lazy** al consultar disponibilidad/slots; cron de respaldo **1 vez al día**; y **reutilización de la fila** cuando ya existe una reserva CANCELLED para el mismo slot al crear una nueva reserva (evita P2002 y “horario no disponible”).

---

## 1. Cancelación lazy (principal)

La cancelación de reservas PENDING con `expiresAt` pasada se ejecuta **al consultar** disponibilidad o slots, no solo con un cron cada 5 minutos.

- **Dónde se ejecuta el cleanup:**
  - **GET /api/slots** — Ya existía: antes de generar slots se llama a `ExpiredBookingsService.cancelExpiredBookings(tenantId)` y `clearBookingsCache()`.
  - **GET /api/bookings/availability** — Añadido: antes de `checkAvailability` se obtiene el `tenantId` de la cancha, se cancela expiradas de ese tenant y se limpia caché.
  - **POST /api/bookings/availability** (slots para una fecha) — Añadido: mismo cleanup antes de devolver los slots.
- **Efecto:** En la primera petición de disponibilidad/slots después de que expire una reserva, esa reserva se marca CANCELLED y el slot aparece libre en la misma respuesta. No hace falta esperar al cron.

**Archivos modificados:**

- `app/api/bookings/availability/route.ts`: imports de `ExpiredBookingsService` y `clearBookingsCache`; en GET y POST, bloque que obtiene `tenantId` del court, llama a `cancelExpiredBookings(tenantId)` y `clearBookingsCache()` (con try/catch y `console.warn` en error).

---

## 2. Cron suave (respaldo 1 vez al día)

El cron deja de ejecutarse cada 5 minutos y pasa a ejecutarse **una vez al día** como respaldo para tenants sin tráfico.

- **vercel.json:** `schedule` del cron cambia de `*/5 * * * *` a **`0 3 * * *`** (todos los días a las 03:00 UTC).
- **Comentarios:** En `app/api/jobs/cancel-expired-bookings/route.ts` y en `lib/services/bookings/ExpiredBookingsService.ts` se actualiza la descripción: cancelación principal vía lazy; cron como respaldo diario.

**Archivos modificados:**

- `vercel.json`: `"schedule": "0 3 * * *"`.
- `app/api/jobs/cancel-expired-bookings/route.ts`: cabecera y comentario del GET.
- `lib/services/bookings/ExpiredBookingsService.ts`: cabecera del servicio.

---

## 3. Reutilizar fila cancelada al crear reserva

La tabla `Booking` tiene un unique en `(tenantId, courtId, bookingDate, startTime, endTime)`. Si una reserva se cancela (CANCELLED), la fila sigue existiendo; al intentar **crear** una nueva reserva para el mismo slot, el INSERT fallaba con P2002 y el usuario veía “horario no disponible” aunque el slot estuviera libre en la UI.

**Solución:** En el flujo de creación, si ya existe una reserva **CANCELLED** para ese mismo slot, se **reutiliza** esa fila (UPDATE) en lugar de hacer INSERT.

- **BookingRepository.create():**
  1. Obtiene el court y `tenantId`.
  2. Busca una reserva con mismo `(tenantId, courtId, bookingDate, startTime, endTime)` y `status: 'CANCELLED'`.
  3. **Si existe:** actualiza esa fila con los datos de la nueva reserva (`userId`, `bookedById`, `expiresAt`, precios, `status: 'PENDING'` o `'CONFIRMED'`, etc.), limpia `cancelledAt` y `cancellationReason`, borra los `BookingPlayer` anteriores y crea los nuevos; devuelve la reserva actualizada con relaciones.
  4. **Si no existe:** flujo anterior (INSERT + jugadores).
- Todo dentro de la misma transacción.

**Archivo modificado:**

- `lib/repositories/BookingRepository.ts`: método `create()` con la lógica de búsqueda de CANCELLED y rama de reutilización (update + delete/create de players).

---

## 4. Resumen de archivos tocados

| Archivo | Cambio |
|---------|--------|
| `app/api/bookings/availability/route.ts` | Lazy: cancelar expiradas antes de GET y POST availability. |
| `app/api/jobs/cancel-expired-bookings/route.ts` | Comentarios: lazy principal, cron 1 vez al día. |
| `lib/repositories/BookingRepository.ts` | `create()`: reutilizar fila CANCELLED para el mismo slot si existe. |
| `lib/services/bookings/ExpiredBookingsService.ts` | Comentario: invocación lazy + cron diario. |
| `vercel.json` | Cron schedule `0 3 * * *`. |

---

## 5. Comportamiento esperado

- Usuario A deja una reserva PENDING y no paga; expira.
- Usuario B entra después de la expiración y pide slots o disponibilidad → en esa petición se cancelan las expiradas (lazy) y el slot aparece libre.
- Usuario B reserva ese slot → si había una fila CANCELLED para ese slot, se reutiliza; si no, se crea una nueva. La reserva se completa sin error de “horario no disponible”.
- Tenants sin tráfico: el cron diario (3:00 UTC) limpia cualquier PENDING expirada que no se haya cancelado por lazy.
