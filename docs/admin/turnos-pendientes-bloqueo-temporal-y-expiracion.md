# Turnos pendientes: bloqueo temporal y expiración automática

**Estado:** Implementado y operativo.  
**Última actualización:** Marzo 2026.

---

## Resumen

Los turnos en estado **PENDING** (pendiente) representan reservas que un usuario **empezó pero aún no completó el pago**. Durante ese tiempo el slot queda **bloqueado** para que otro usuario no pueda reservarlo. El bloqueo tiene una **duración limitada** (configurable) y se **libera de forma automática** si el usuario no paga a tiempo; **no se requiere intervención del administrador**.

---

## 1. Concepto de "pendiente"

| Concepto | Descripción |
|---------|-------------|
| **Estado PENDING** | La reserva fue creada (usuario eligió cancha, fecha y horario) pero el pago no se completó. |
| **Bloqueo del slot** | Ese horario se considera ocupado en la disponibilidad: nadie más puede reservarlo mientras la reserva sea PENDING (y no esté cancelada). |
| **Duración del bloqueo** | Tiempo máximo para completar el pago. Por defecto **15 minutos**, configurable por tenant. |
| **Liberación** | Si no se paga a tiempo, un job cancela la reserva (PENDING → CANCELLED) y el slot vuelve a estar libre. |

No existe una entidad separada de "bloqueo temporal": el propio **Booking** con `status: PENDING` y `expiresAt` cumple esa función.

---

## 2. Flujo técnico

### 2.1 Creación de la reserva (usuario hace la reserva)

- El usuario selecciona cancha, fecha y horario y avanza al pago.
- Se llama a **POST /api/bookings** (sin `confirmOnCreate`, o con `confirmOnCreate: false`).
- **BookingService.createBooking**:
  - Comprueba disponibilidad.
  - Obtiene **expirationMinutes** del tenant (setting `booking_expiration_minutes`) o usa el default **15**.
  - Crea el **Booking** con:
    - `status: 'PENDING'`
    - `expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000)`
- El slot queda bloqueado porque las consultas de disponibilidad consideran todas las reservas con `status !== 'CANCELLED'` (incluidas las PENDING).

**Archivos relevantes:**

- `lib/services/BookingService.ts`: `getBookingExpirationMinutes()`, `createBooking()` (uso de `expiresAt`).
- `lib/repositories/BookingRepository.ts`: creación con `expiresAt` cuando `initialStatus === 'PENDING'`.

### 2.2 Reserva creada por admin ("Nueva Reserva")

- Si el admin crea la reserva desde el panel con **Crear Reserva**, se envía `confirmOnCreate: true`.
- La reserva se crea con `status: 'CONFIRMED'` y `expiresAt: null`.
- No hay bloqueo temporal: la reserva queda confirmada de inmediato.

### 2.3 Disponibilidad y bloqueo

- **checkAvailability** (BookingRepository) y **getAvailabilitySlots** (BookingService) usan reservas con `status: { not: 'CANCELLED' }`.
- Por tanto, una reserva **PENDING** (aunque ya haya pasado su `expiresAt`) sigue bloqueando el slot **hasta que un job la cancele**. Por eso es importante que el job de cancelación se ejecute con frecuencia (p. ej. cada 5 minutos).

### 2.4 Expiración y liberación automática

- **ExpiredBookingsService** (`lib/services/bookings/ExpiredBookingsService.ts`):
  - Busca reservas con `status: 'PENDING'` y `expiresAt < now`.
  - Las actualiza a `status: 'CANCELLED'`, `cancellationReason: 'Timeout: pago no completado dentro del tiempo límite'`.
- Este servicio se invoca desde el endpoint **POST /api/jobs/cancel-expired-bookings**, que debe ser llamado periódicamente por un **cron** (p. ej. Vercel Cron cada 5 minutos).
- Tras la cancelación, el slot vuelve a estar libre en las consultas de disponibilidad.

**Archivos relevantes:**

- `lib/services/bookings/ExpiredBookingsService.ts`: `cancelExpiredBookings()`, `getExpiredBookingsStats()`.
- `app/api/jobs/cancel-expired-bookings/route.ts`: endpoint del job (protección por token en producción).

---

## 3. Configuración

### 3.1 Duración del bloqueo (minutos)

| Dónde | Clave / variable | Valor por defecto |
|-------|------------------|--------------------|
| Sistema | `SystemSetting` por tenant, key: **`booking_expiration_minutes`** | **15** (definido en `BookingService.getBookingExpirationMinutes` y en bootstrap). |
| Bootstrap tenant | `lib/services/tenants/bootstrap.ts` → `DEFAULTS.bookingExpirationMinutes` | **15** |

Para usar 5 o 10 minutos, configurar el valor de `booking_expiration_minutes` para el tenant correspondiente (tabla `SystemSetting` o flujo de configuración del club).

### 3.2 Job de cancelación (cron)

- **Endpoint:** `POST /api/jobs/cancel-expired-bookings`
- **Query opcional:** `?tenantId=xxx` para procesar solo ese tenant (admin de tenant o super admin). Sin `tenantId`, solo super admin puede ejecutarlo (procesa todos los tenants).
- **Producción:** el endpoint exige un token de autorización (header `Authorization: Bearer <secret>`); el secret se obtiene de `getCronConfig().secret`.
- **Recomendación:** ejecutar el cron **cada 5 minutos** para que los slots expirados se liberen con poca demora.

---

## 4. Vista de administración (AdminTurnos)

- En la sección **Gestión de Turnos** (`/admin-panel/admin/turnos`), las reservas con estado **pendiente** se **excluyen de la lista** de forma intencional (no se muestran en filtros ni en la tabla).
- Motivo: esas reservas son "en curso" (usuario completando el pago) o estarán canceladas por el job en breve; no requieren acción del admin.
- La confirmación explícita de pendientes por parte del admin no forma parte de este flujo; la liberación es automática vía expiración y job.

---

## 5. Resumen de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `lib/services/BookingService.ts` | `getBookingExpirationMinutes()`, creación de reserva con `expiresAt` cuando no es `confirmOnCreate`. |
| `lib/repositories/BookingRepository.ts` | Crear reserva con `expiresAt`; disponibilidad sin distinguir PENDING por `expiresAt`. |
| `lib/services/bookings/ExpiredBookingsService.ts` | Cancelar PENDING con `expiresAt < now`; estadísticas de expiradas. |
| `app/api/jobs/cancel-expired-bookings/route.ts` | Endpoint del cron; validación de permisos y token en producción. |
| `lib/services/tenants/bootstrap.ts` | Valor por defecto `booking_expiration_minutes` (15) en settings del tenant. |

---

## 6. Diagrama del flujo

```
Usuario inicia reserva
        │
        ▼
POST /api/bookings (sin confirmOnCreate)
        │
        ▼
Booking creado: status=PENDING, expiresAt=now+15min (o valor configurado)
        │
        ├── Slot BLOQUEADO en disponibilidad
        │
        ├── Usuario paga a tiempo
        │   → Webhook/API actualiza status → CONFIRMED (u otro flujo de pago)
        │   → expiresAt puede quedar en null o ignorarse
        │
        └── Usuario NO paga a tiempo
                │
                ▼
            expiresAt < now
                │
                ▼
            Cron llama POST /api/jobs/cancel-expired-bookings (ej. cada 5 min)
                │
                ▼
            ExpiredBookingsService.cancelExpiredBookings()
                │
                ▼
            Booking: PENDING → CANCELLED, cancellationReason = "Timeout: ..."
                │
                ▼
            Slot LIBRE de nuevo
```

Esta funcionalidad está **terminada** en el código actual; solo debe asegurarse que el cron esté configurado en el entorno de despliegue.
