# Corrección: toggle de pago y cierre de turno en Admin (2026-03)

**Fecha:** Marzo 2026  
**Relación:** Plan iterado "Toggle de pago y cierre de turno en Admin"

## Resumen

En el panel de administración de turnos ocurrían dos problemas: (1) al marcar un jugador como pagado con el toggle, el turno pasaba solo a "turnos terminados" aunque hubiera saldo pendiente; (2) el flujo entre **terminar** y **cerrar** turno quedó inconsistente entre UI, backend y documentación. Se corrigió preservando el estado del turno al actualizar pagos y dejando un flujo de **2 etapas**: `Terminar turno` (sin exigir saldo 0) y `Cerrar turno` (solo con saldo 0).

---

## 1. Problemas

### 1.1 Bug del toggle

- Al hacer clic en uno de los toggles de pago (marcar jugador como "Pagado"), el turno se movía automáticamente a la sección "Turnos terminados/completados".
- La respuesta del PATCH (o del PUT fallback) reemplazaba el booking completo en el estado local; si el servidor devolvía o llegaba a devolver `status: COMPLETED`, el turno cambiaba de sección sin que el admin hubiera cerrado explícitamente.

### 1.2 Flujo de cierre incorrecto

- El flujo de cierre quedó ambiguo: había documentación y código que trataban `COMPLETED` como cierre final y otros como estado intermedio.
- Lo deseado: flujo de 2 pasos explícito:
  1. `Terminar turno` -> `status: COMPLETED` (sin `closedAt`, no exige saldo en cero).
  2. `Cerrar turno` -> requiere saldo 0 y registra `closedAt` (cierre definitivo).

---

## 2. Enfoque de la solución

1. **Al aplicar la respuesta del toggle (PATCH o PUT fallback):** no reemplazar el booking por la respuesta tal cual; hacer merge conservando `status` y `closedAt` del booking actual en la lista. Así el turno nunca cambia de sección solo por marcar/desmarcar un pago.
2. **Restaurar el flujo de 2 etapas en UI:** reintroducir `Terminar turno` para categorías `in_progress` y `awaiting_completion`; el botón ejecuta PUT con `status: COMPLETED` sin exigir saldo en cero.
3. **Cerrar turno solo en completados con saldo 0:** mostrarlo únicamente cuando `status === 'completado'`, `closedAt` vacío y `pendingBalance === 0`. Al confirmar, llamar a `closeBooking` (POST `/api/bookings/[id]/close`).
4. **Separar backend entre completado y cerrado:** `COMPLETED` ya no setea `closedAt` automáticamente; `/close` es el único flujo que marca cierre definitivo.
4. **Rate limit 429:** ante 429 en el toggle, revertir el optimistic update y mostrar un toast para que el usuario reintente.

---

## 3. Cambios realizados

### 3.1 Preservar `status` y `closedAt` en el toggle

**Archivo:** `components/AdminTurnos.tsx`  
**Función:** `togglePlayerPayment`

- Tras un **PATCH exitoso** a `/api/bookings/[id]/players/position/[position]/payment`, al actualizar el estado se usa:
  - `setBookings(prev => prev.map(b => (b.id === bookingId ? { ...mapped, status: b.status, closedAt: b.closedAt ?? null } : b)))`
  - donde `mapped = mapApiBookingToLocal(json.data)` y `b` es el booking actual en `prev`.
- En el **éxito del PUT fallback** (cuando el PATCH devuelve 404 "Jugador no encontrado"), se aplica la misma lógica: merge de `mapped` con `status` y `closedAt` del `b` actual.
- Con esto, la sección del turno (confirmados, en curso, completados, cerrados) no cambia solo por actualizar un pago.

### 3.2 Revertir optimistic update y toast en 429

**Archivo:** `components/AdminTurnos.tsx`  
**Función:** `togglePlayerPayment`

- En el bloque que maneja `patchRes.status === 429` o `RATE_LIMIT_EXCEEDED`:
  - Se revierte el estado optimista: `setBookings(prev => prev.map(b => (b.id === bookingId ? previousState : b)))`.
  - Se muestra un toast: "Demasiadas solicitudes; reintentá en un momento."
  - Se mantiene el `return` para no reintentar el PATCH en ese mismo flujo; el `finally` sigue limpiando `inFlightUpdates`.

### 3.3 Flujo de 2 etapas: "Terminar turno" y "Cerrar turno" con condiciones

**Archivo:** `components/AdminTurnos.tsx`  
**Sección:** botones de acción en el contenido expandido del turno

- **Terminar turno:** visible cuando la categoría es `in_progress` o `awaiting_completion`, mientras la reserva no esté ya completada. Ejecuta `updateBookingStatus(booking.id, 'completado')`.
- **Cerrar turno:** visible únicamente cuando:
  - `booking.status === 'completado'`,
  - `!booking.closedAt`,
  - `pendingBalance === 0`.
- Al hacer clic en "Cerrar turno" se abre el modal de confirmación existente y, al confirmar, se llama a `closeBooking(bookingId)` (POST `/api/bookings/[id]/close`).
- El endpoint `/close` valida que:
  - el turno haya finalizado,
  - no exista saldo pendiente,
  - el turno esté previamente en `COMPLETED`,
  - y no esté ya cerrado (`closedAt`).

### 3.4 Comentario en `updateBookingStatus`

- Se actualizó el comentario de la función `updateBookingStatus` para indicar que el cierre explícito del admin es vía `closeBooking` (POST `/close`); la función se mantiene por si otros flujos la usan.

### 3.5 Tests

- Revisión: no hay tests que usen `data-testid="admin-terminar-turno-btn-..."`; el test `AdminTurnos.closed.test.tsx` solo verifica la sección TURNOS CERRADOS y toggles deshabilitados, sin depender del botón eliminado. No se requirieron cambios en tests.

---

## 4. Flujo resultante

1. **En curso / Awaiting completion:** el admin marca pagos sin cambiar automáticamente el estado del turno.
2. **Terminar turno:** el admin puede pasarlo a `COMPLETED` aunque haya saldo pendiente; el turno entra en sección de completados (aún no cerrado).
3. **Cerrar turno:** solo cuando el saldo pendiente llega a 0, el admin puede cerrarlo (POST `/api/bookings/[id]/close`), lo que setea `closedAt`.
4. El turno pasa a la sección de turnos cerrados.

---

## 5. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `components/AdminTurnos.tsx` | Merge preservando `status`/`closedAt` en respuesta PATCH y PUT fallback del toggle; reversión y toast en 429; flujo en 2 etapas con botones `Terminar turno` y `Cerrar turno` por categoría/saldo; comentario en `updateBookingStatus`. |
| `lib/repositories/BookingRepository.ts` | `update()` deja de setear `closedAt` automáticamente al pasar a `COMPLETED`. |
| `app/api/bookings/[id]/close/route.ts` | `/close` exige turno previamente `COMPLETED` y marca cierre definitivo seteando `closedAt`. |

---

## 6. Referencias

- Plan: `.cursor/plans/fix_toggle_pago_y_cierre_turno-iterado.plan.md`
- Endpoint de cierre: `app/api/bookings/[id]/close/route.ts` (valida `now >= endDateTime`, `pendingBalance === 0`, `status === COMPLETED` y `closedAt` vacío).
