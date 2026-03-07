# Estadísticas: uso de la página vs reservas por admin (2026-03)

**Fecha:** Marzo 2026  
**Ruta:** `/admin-panel/estadisticas`  
**Objetivo:** Mostrar en la sección de estadísticas cuántas reservas las hacen los usuarios en la web (uso de la página) y cuántas las hace el admin, con un porcentaje de uso de la página.

---

## 1. Modelo y migración

### Schema Prisma

En `prisma/schema.prisma`, en el modelo **Booking**:

- **Campo:** `bookedById String?` (opcional).
- **Relación:** `bookedBy User? @relation("BookedBy", fields: [bookedById], references: [id])`.
- **Índice:** `@@index([bookedById])`.

En el modelo **User** se añadió la relación inversa:

- `bookedByBookings Booking[] @relation("BookedBy")`.

### Migración

- **Archivo:** `prisma/migrations/20260308000000_add_booking_booked_by/migration.sql`
- Añade la columna `bookedById` (TEXT, nullable), el índice `Booking_bookedById_idx` y la clave foránea a `User`.
- Aplicar con: `npx prisma migrate deploy` (o `prisma migrate dev` en desarrollo).

---

## 2. Grabación de quién hace la reserva

### Repositorio

- **Archivo:** `lib/repositories/BookingRepository.ts`
- `BookingCreateInput` incluye `bookedById?: string | null`.
- En `create()` se pasa `bookedById: data.bookedById ?? undefined` al `prisma.booking.create`.

### Servicio

- **Archivo:** `lib/services/BookingService.ts`
- `createBooking(input, userId, bookedById?: string | null)`.
- Si no se recibe `bookedById`, se usa `userId` (autoatención: el titular hace su propia reserva).
- En los datos enviados al repositorio: `bookedById: bookedById ?? userId`.

### API de reservas

- **Archivo:** `app/api/bookings/route.ts`
- Al crear una reserva se llama a `bookingService.createBooking(validatedData, resolvedUserId, session.user.id)`.
- Así se guarda en `bookedById` el usuario que está haciendo la reserva (sesión actual). Si es el propio usuario, `bookedById === userId`; si es un admin reservando para otro, `bookedById !== userId`.

---

## 3. API de estadísticas

- **Archivo:** `app/api/estadisticas/route.ts`

### Consulta de uso de página

- Se ejecuta una consulta SQL raw (después del `Promise.all` principal) para el período seleccionado:
  - **Por usuarios (web):** reservas donde `bookedById IS NOT NULL AND bookedById = userId` (el titular es quien hizo la reserva).
  - **Por admin:** reservas donde `bookedById IS NOT NULL AND bookedById != userId`.
- La consulta está dentro de un `try/catch`: si la columna `bookedById` no existe (migración no aplicada), se usan valores por defecto (0, 0) y la API sigue respondiendo 200.

### Respuesta

- El objeto de estadísticas incluye `usoPagina`:
  - `reservasPorUsuario`: número de reservas hechas por el usuario en la web.
  - `reservasPorAdmin`: número de reservas hechas por el admin (para otros).
  - `porcentajeUsoPagina`: `reservasPorUsuario / (reservasPorUsuario + reservasPorAdmin) * 100`, o `null` si no hay ninguna reserva con origen conocido.
  - `sinDato`: `reservasCount - (reservasPorUsuario + reservasPorAdmin)` (reservas sin `bookedById`, p. ej. antiguas).

---

## 4. Tipos

- **Archivo:** `types/estadisticas.ts`
- En la interfaz **EstadisticasData** se añadió:

```ts
usoPagina: {
  reservasPorUsuario: number
  reservasPorAdmin: number
  porcentajeUsoPagina: number | null
  sinDato: number
}
```

---

## 5. Hook useEstadisticas

- **Archivo:** `hooks/useEstadisticas.ts`
- El objeto **emptyEstadisticas** (usado cuando la API falla) incluye `usoPagina` con valores por defecto (0, 0, null, 0) para que el tipo sea correcto y la UI no acceda a `estadisticas.usoPagina` cuando sea `undefined`.

---

## 6. UI – Sección Estadísticas

- **Archivo:** `app/admin-panel/estadisticas/page.tsx`
- Nueva tarjeta **«Uso de la página»** entre «Resumen de Usuarios» y «Resumen Financiero»:
  - **Por usuarios (web):** `estadisticas.usoPagina.reservasPorUsuario`.
  - **Por admin:** `estadisticas.usoPagina.reservasPorAdmin`.
  - **Uso de la página:** porcentaje o «—» si `porcentajeUsoPagina` es `null`.
  - **Sin dato:** solo visible si `estadisticas.usoPagina.sinDato > 0` (reservas antiguas sin `bookedById`).

---

## Criterio de la estadística

| Caso | Condición | Interpretación |
|------|-----------|----------------|
| Uso de la página | `bookedById === userId` | El titular de la reserva la hizo él mismo (web). |
| Por admin | `bookedById !== userId` y `bookedById` no null | Otro usuario (p. ej. admin) creó la reserva para el titular. |
| Sin dato | `bookedById` null | Reservas creadas antes de tener el campo (no se puede clasificar). |

El porcentaje de uso de la página se calcula solo sobre reservas con origen conocido (`reservasPorUsuario + reservasPorAdmin`). Las que tienen `bookedById` null no entran en ese porcentaje y se muestran aparte como «Sin dato (reservas antiguas)».
