# Corrección: toggle de pago y cierre de turno en Admin (2026-03)

**Fecha:** Marzo 2026  
**Relación:** Plan iterado "Toggle de pago y cierre de turno en Admin"

## Resumen

En el panel de administración de turnos ocurrían dos problemas: (1) al marcar un jugador como pagado con el toggle, el turno pasaba solo a "turnos terminados" aunque hubiera saldo pendiente; (2) existía un botón "Terminar turno" que pasaba el turno a completado sin exigir saldo en cero ni cierre explícito del admin. Se corrigió preservando el estado del turno al actualizar pagos y unificando el cierre en un único botón "Cerrar turno" que solo se activa con saldo pendiente en cero y requiere confirmación del admin (POST `/api/bookings/[id]/close`).

---

## 1. Problemas

### 1.1 Bug del toggle

- Al hacer clic en uno de los toggles de pago (marcar jugador como "Pagado"), el turno se movía automáticamente a la sección "Turnos terminados/completados".
- La respuesta del PATCH (o del PUT fallback) reemplazaba el booking completo en el estado local; si el servidor devolvía o llegaba a devolver `status: COMPLETED`, el turno cambiaba de sección sin que el admin hubiera cerrado explícitamente.

### 1.2 Flujo de cierre incorrecto

- El botón "Terminar turno" hacía un PUT con `status: 'COMPLETED'` sin validar saldo pendiente.
- El turno podía quedar en "completados" con deuda pendiente y sin que el admin tuviera que cerrarlo de forma explícita.
- Lo deseado: que el turno solo pase a terminados cuando (a) el saldo pendiente sea cero y (b) el admin cierre con un botón que llame al endpoint de cierre (POST `/close`), con confirmación en modal.

---

## 2. Enfoque de la solución

1. **Al aplicar la respuesta del toggle (PATCH o PUT fallback):** no reemplazar el booking por la respuesta tal cual; hacer merge conservando `status` y `closedAt` del booking actual en la lista. Así el turno nunca cambia de sección solo por marcar/desmarcar un pago.
2. **Eliminar** el botón "Terminar turno" que hacía PUT a COMPLETED sin validar saldo.
3. **Un solo botón "Cerrar turno":** mostrarlo solo cuando el saldo pendiente sea 0 y se cumpla una de: (a) el horario del turno ya finalizó (`awaiting_completion`), o (b) turno legacy ya en estado completado pero sin `closedAt`. Al hacer clic, abrir el modal de confirmación y, al confirmar, llamar a `closeBooking` (POST `/api/bookings/[id]/close`).
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

### 3.3 Botón "Terminar turno" eliminado y "Cerrar turno" con condiciones

**Archivo:** `components/AdminTurnos.tsx`  
**Sección:** botones de acción en el contenido expandido del turno

- **Eliminado:** el botón "Terminar turno" que llamaba a `updateBookingStatus(booking.id, 'completado')` (PUT con status COMPLETED sin validar saldo).
- **Condición del botón "Cerrar turno":**
  - `pendingBalance === 0`, y
  - una de:
    - `category === 'awaiting_completion'` (el horario del turno ya finalizó), o
    - `booking.status === 'completado' && !booking.closedAt` (caso legacy: turno ya marcado completado pero aún no cerrado).
- Al hacer clic en "Cerrar turno" se abre el modal de confirmación existente y, al confirmar, se llama a `closeBooking(bookingId)` (POST `/api/bookings/[id]/close`). El backend valida que el turno haya finalizado y que no haya saldo pendiente.
- No se muestra "Cerrar turno" durante `in_progress` (turno aún en horario), porque el endpoint `/close` rechaza con "El turno aún no finalizó".

### 3.4 Comentario en `updateBookingStatus`

- Se actualizó el comentario de la función `updateBookingStatus` para indicar que el cierre explícito del admin es vía `closeBooking` (POST `/close`); la función se mantiene por si otros flujos la usan.

### 3.5 Tests

- Revisión: no hay tests que usen `data-testid="admin-terminar-turno-btn-..."`; el test `AdminTurnos.closed.test.tsx` solo verifica la sección TURNOS CERRADOS y toggles deshabilitados, sin depender del botón eliminado. No se requirieron cambios en tests.

---

## 4. Flujo resultante

1. **En curso / Awaiting completion:** el admin marca los jugadores que pagaron con los toggles. El turno sigue en la misma sección; no pasa a terminados por el solo hecho de togglear.
2. **Cuando el saldo pendiente llega a 0** y el horario del turno ya finalizó (o es un turno legacy completado sin cerrar), se muestra el botón "Cerrar turno".
3. El admin hace clic en "Cerrar turno", confirma en el modal y se ejecuta POST `/api/bookings/[id]/close`. El backend valida saldo 0 y que el turno haya finalizado, luego pone `status: COMPLETED` y `closedAt`.
4. El turno pasa a la sección de turnos cerrados/terminados.

---

## 5. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `components/AdminTurnos.tsx` | Merge preservando `status`/`closedAt` en respuesta PATCH y PUT fallback del toggle; reversión y toast en 429; eliminación del botón "Terminar turno"; condición única para "Cerrar turno"; comentario en `updateBookingStatus`. |

---

## 6. Referencias

- Plan: `.cursor/plans/fix_toggle_pago_y_cierre_turno-iterado.plan.md`
- Endpoint de cierre: `app/api/bookings/[id]/close/route.ts` (valida `now >= endDateTime`, `pendingBalance === 0`, y que no esté ya COMPLETED).
