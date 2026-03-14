# Mis Turnos: fecha local para Reservas Actuales vs Historial (2026-03)

**Fecha:** Marzo 2026  
**Objetivo:** Que las reservas con fecha/hora de fin en el futuro aparezcan en **Reservas Actuales** (con letrero Confirmada / Seña Pagada) y no en Historial. Corregir el cálculo de estado de la tarjeta (upcoming/active/completed) y del tiempo restante usando siempre fecha y hora en hora local.

---

## 1. Problema

Una reserva del **viernes 13 de marzo de 2026, 18:30–20:00**, confirmada y con seña pagada, se mostraba en **Historial de Reservas** y "Reservas Actuales" quedaba vacío. En zonas como Argentina (UTC-3), las fechas solo-date (ej. `"2026-03-13"`) o ISO en UTC se interpretaban como medianoche UTC, que en local corresponde al **día anterior** (12 de marzo 21:00). Por eso el turno se clasificaba como pasado (`now > end`).

---

## 2. Solución: helper de fecha local

### 2.1 `parseBookingDateLocal` en lib/utils/booking-utils.ts

- **Función:** `parseBookingDateLocal(dateInput: string | Date | unknown): Date`
- Interpreta la fecha del turno en **hora local** (medianoche del día indicado).
- Si el input es string: toma la parte de fecha con `split('T')[0]`, parsea `YYYY-MM-DD` y construye `new Date(year, month - 1, day)` (sin usar `new Date(isoString)` para evitar UTC).
- Si es `Date`: devuelve fecha a medianoche local (mismo día en local).
- Si falta o es inválido: devuelve `new Date()` (hoy) para no romper filtros.
- Exportada y reutilizada en AppStateProvider y UserBookingsList.

---

## 3. Cambios en AppStateProvider

### 3.1 fetchAndSetUserBookings: current vs past

- En los filtros de `current` y `past` se reemplazó `const bd = new Date(b.bookingDate)` por `const bd = parseBookingDateLocal(b.bookingDate)`.
- Criterio sin cambios: current = reservas con `now <= end`, past = `now > end`; luego se excluyen PENDING de current.
- Con la fecha en local, una reserva del 13 de marzo 18:30–20:00 queda en "Reservas Actuales" cuando hoy es 13 de marzo (o antes).

### 3.2 getCurrentBookingStatus

- Usa `parseBookingDateLocal(booking.date)` para la fecha del turno.
- Parsea `timeRange` en formato **24h** (`"HH:mm - HH:mm"`): split por `' - '`, luego `split(':')` para horas y minutos (se eliminó la lógica de AM/PM que no coincide con el shape de la API).
- Construye `startTime` y `endTime` en hora local y compara con `now` para devolver 'active' | 'completed' | 'upcoming'.
- Casos borde: valores no numéricos con `Number.isFinite` y fallback a 0.

### 3.3 getRemainingTime

- Usa `parseBookingDateLocal(booking.date)` para la fecha.
- Parsea la hora de fin en **24h**: toma la parte después de `' - '` en `timeRange`, luego `split(':')` para horas y minutos.
- Construye `endDateTime` en hora local y calcula la diferencia con `now` para el texto ("Xh Ym restantes" o "Finalizado").
- Si no hay hora de fin parseable, devuelve "Hora no disponible".

---

## 4. Cambios en UserBookingsList

- Filtros "upcoming" y "past" usan `parseBookingDateLocal(b.bookingDate)` y lo comparan con `todayMidnight` (medianoche local de hoy): upcoming = día del turno >= hoy, past = día del turno < hoy.
- En `BookingCard`, `isUpcoming` y el formateo de la fecha con `format(..., 'EEEE, d MMMM yyyy')` usan `parseBookingDateLocal(booking.bookingDate)` para consistencia y para que el día se muestre correctamente en local.

---

## 5. Archivos modificados

| Archivo | Cambio |
| --------| ------ |
| [lib/utils/booking-utils.ts](lib/utils/booking-utils.ts) | Nueva función `parseBookingDateLocal`. |
| [components/providers/AppStateProvider.tsx](components/providers/AppStateProvider.tsx) | Import de `parseBookingDateLocal`; uso en fetchAndSetUserBookings (current/past), getCurrentBookingStatus (fecha local + timeRange 24h) y getRemainingTime (fecha local + hora fin 24h). |
| [components/UserBookingsList.tsx](components/UserBookingsList.tsx) | Import de `parseBookingDateLocal`; filtros upcoming/past y BookingCard usan fecha local. |

---

## 6. Resultado

- Las reservas cuyo **día y hora de fin** son hoy o en el futuro (en hora local del navegador) aparecen en **Reservas Actuales** con el estado correcto (Confirmada, Seña Pagada, etc.).
- Las que ya pasaron van a **Historial de Reservas**.
- El estado de la tarjeta (upcoming/active/completed) y el tiempo restante se calculan en hora local, sin desplazamiento por UTC.
