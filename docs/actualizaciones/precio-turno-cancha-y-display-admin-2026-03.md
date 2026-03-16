# Precio del turno por cancha y visualización en Admin Turnos (2026-03)

**Fecha:** Marzo 2026  
**Áreas:** Reservas (BookingService), Panel Admin Turnos (AdminTurnos)

Documentación de los cambios en el cálculo del precio total del turno al crear una reserva y en la visualización del total y del precio por jugador en la gestión de turnos.

---

## 1. Contexto

- El **precio base** de una cancha en la configuración (ej. Super Admin / Canchas) corresponde al **precio del turno completo** (p. ej. 90 minutos), no por hora.
- En la pantalla de turnos del admin se muestra el **total del turno** y el **precio por jugador** ($ total ÷ 4). La seña que paga el usuario (25% o 50%) se calcula sobre ese total.
- Era necesario que: (a) al crear una reserva el `totalPrice` guardado sea el precio base de la cancha para la duración del slot; (b) en la UI se muestre el precio **acordado al reservar** (`booking.totalPrice`) para que la seña coincida con lo mostrado.

---

## 2. Backend: Cálculo de `totalPrice` al crear la reserva

**Archivo:** `lib/services/BookingService.ts`

### 2.1 Antes

El total se calculaba como si el precio base fuera **por hora**:

```ts
totalPrice = basePrice * priceMultiplier * (durationMinutes / 60)
```

Para un turno de 90 min y precio base $20, daba $30 en lugar de $20.

### 2.2 Después

El precio base es **por turno completo** (duración del slot configurada en la cancha). Se usa la duración del slot (`slot_duration` en `operatingHours`) para prorratear solo si la duración de la reserva no coincide con el slot:

```ts
slotDurationMinutes = getSlotDurationMinutes(court.operatingHours)  // default 90
totalPrice = basePrice * priceMultiplier * (durationMinutes / slotDurationMinutes)
```

- Turno 90 min y slot 90 min → `totalPrice = basePrice * priceMultiplier` (ej. $20).
- Turno 60 min y slot 90 min → total prorrateado en proporción.

### 2.3 Método nuevo: `getSlotDurationMinutes(operatingHours)`

- **Ubicación:** `lib/services/BookingService.ts` (método privado de la clase).
- **Función:** Lee `slot_duration` del JSON `operatingHours` de la cancha.
- **Valor por defecto:** 90 minutos si no existe o no es válido.
- **Uso:** Solo en `createBooking` para el cálculo de `totalPrice`.

### 2.4 Cambios en `createBooking`

- Se incluye `operatingHours` en el `select` de la cancha al obtenerla antes de crear la reserva.
- Se usa `getSlotDurationMinutes(court.operatingHours)` y la fórmula anterior para calcular `totalPrice` y, a partir de él, `depositAmount`.

---

## 3. Frontend: Visualización en Admin Turnos

**Archivo:** `components/AdminTurnos.tsx`

### 3.1 Criterio de visualización

En la gestión de turnos se muestra el **precio acordado al crear la reserva** (`booking.totalPrice`), no el precio actual de la cancha, para que:

- El **total original** coincida con el monto sobre el que se calculó la seña (25% o 50%).
- El **precio por jugador** sea coherente con ese total (total ÷ 4).
- El **saldo pendiente** y el chip de precio en la tarjeta reflejen el mismo criterio.

### 3.2 Dónde se usa `booking.totalPrice`

| Concepto | Cálculo |
|----------|--------|
| Total original | `booking.totalPrice + totalExtras` |
| Monto base por jugador | `booking.totalPrice / 4` (+ parte de extras si aplica) |
| Total en evento del calendario | `booking.totalPrice` |
| Estadísticas (ingresos, reserva total) | Suma de `booking.totalPrice` (+ extras) por reserva |
| Chip en tarjeta (saldo pendiente) | `totalOriginal - amountPaid` con `totalOriginal` anterior |

No se usa el precio actual de la cancha (`getCourtTotalPrice`) para estos valores; así la seña pagada es un porcentaje del total mostrado.

### 3.3 Reservas ya existentes

- Si una reserva se creó con el bug anterior, puede tener guardado un `totalPrice` incorrecto (p. ej. calculado por hora).
- Esa reserva seguirá mostrando ese valor hasta que se corrija en base de datos o mediante una futura edición de precio.
- Las **nuevas reservas** ya reciben el `totalPrice` correcto gracias al cambio en `BookingService`.

---

## 4. Resumen de archivos

| Área | Archivo | Cambios |
|------|---------|--------|
| Backend | `lib/services/BookingService.ts` | `createBooking`: uso de `operatingHours` y `getSlotDurationMinutes`; fórmula de `totalPrice` por duración del slot. |
| Frontend | `components/AdminTurnos.tsx` | Total, por jugador, estadísticas y calendario usan `booking.totalPrice` (sin `getCourtTotalPrice` para display). |

---

## 5. Fórmulas de referencia

**Creación de reserva (backend):**

```
slotDurationMinutes = operatingHours.slot_duration ?? 90
totalPrice = round(basePrice * priceMultiplier * (durationMinutes / slotDurationMinutes))
depositAmount = round(totalPrice * (depositPercentage / 100))
```

**Visualización en Admin Turnos (frontend):**

```
totalOriginal     = booking.totalPrice + sum(extras.cost)
basePorJugador    = booking.totalPrice / 4
montoJugador      = basePorJugador + parte de extras asignados
saldoPendiente    = max(0, totalOriginal - amountPaid)
```
