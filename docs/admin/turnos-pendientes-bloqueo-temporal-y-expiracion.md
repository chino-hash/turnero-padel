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

- **checkAvailability** y **getAvailabilitySlots** usan `bookingOccupancyWhere()`: las reservas **PENDING** con `expiresAt < now` **no** bloquean el slot (se tratan como liberadas). Las CANCELLED tampoco bloquean.
- La cancelación efectiva (PENDING → CANCELLED) se hace de forma **lazy** al consultar `/api/slots` o `/api/bookings/availability`, y como respaldo con un **cron 1 vez al día** (ver siguiente sección).

### 2.4 Expiración y liberación automática

- **ExpiredBookingsService** (`lib/services/bookings/ExpiredBookingsService.ts`):
  - Busca reservas con `status: 'PENDING'` y `expiresAt < now`.
  - Las actualiza a `status: 'CANCELLED'`, `cancellationReason: 'Timeout: pago no completado dentro del tiempo límite'`.
- **Invocación:**
  - **Lazy (principal):** Al llamar a **GET /api/slots** o **GET/POST /api/bookings/availability**, antes de devolver datos se ejecuta `cancelExpiredBookings(tenantId)` para ese tenant. El slot aparece libre en la misma respuesta.
  - **Cron (respaldo):** **GET/POST /api/jobs/cancel-expired-bookings** con Vercel Cron **1 vez al día** (`0 3 * * *`, 03:00 UTC) para tenants sin tráfico.
- Tras la cancelación, el slot vuelve a estar libre. Si otro usuario reserva ese mismo slot, se **reutiliza la fila** CANCELLED (ver doc [lazy-cron-reutilizar-fila-cancelada-2026-03](../actualizaciones/lazy-cron-reutilizar-fila-cancelada-2026-03.md)).

**Archivos relevantes:**

- `lib/services/bookings/ExpiredBookingsService.ts`: `cancelExpiredBookings()`, `getExpiredBookingsStats()`.
- `app/api/jobs/cancel-expired-bookings/route.ts`: endpoint del cron (protección por token en producción).
- `app/api/slots/route.ts`, `app/api/bookings/availability/route.ts`: lazy cleanup antes de devolver slots/disponibilidad.

---

## 3. Configuración

### 3.1 Duración del bloqueo (minutos)

| Dónde | Clave / variable | Valor por defecto |
|-------|------------------|--------------------|
| Sistema | `SystemSetting` por tenant, key: **`booking_expiration_minutes`** | **15** (definido en `BookingService.getBookingExpirationMinutes` y en bootstrap). |
| Bootstrap tenant | `lib/services/tenants/bootstrap.ts` → `DEFAULTS.bookingExpirationMinutes` | **15** |

Para usar 5 o 10 minutos, configurar el valor de `booking_expiration_minutes` para el tenant correspondiente (tabla `SystemSetting` o flujo de configuración del club).

### 3.2 Job de cancelación (cron, respaldo)

- **Endpoint:** `GET` o `POST /api/jobs/cancel-expired-bookings`
- **Vercel Cron:** schedule **`0 3 * * *`** (1 vez al día a las 03:00 UTC). La liberación habitual es **lazy** al consultar slots/disponibilidad.
- **Query opcional:** `?tenantId=xxx` para procesar solo ese tenant. Sin `tenantId`, solo super admin (procesa todos los tenants).
- **Producción:** header `Authorization: Bearer <CRON_SECRET>`.

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
| `lib/repositories/BookingRepository.ts` | Crear reserva (o reutilizar fila CANCELLED para el mismo slot); disponibilidad vía `bookingOccupancyWhere()` (PENDING expiradas no bloquean). |
| `lib/services/bookings/ExpiredBookingsService.ts` | Cancelar PENDING con `expiresAt < now`; invocado de forma lazy y por cron diario. |
| `app/api/jobs/cancel-expired-bookings/route.ts` | Endpoint del cron (respaldo 1 vez al día); validación de permisos y token en producción. |
| `app/api/slots/route.ts`, `app/api/bookings/availability/route.ts` | Lazy: cancelar expiradas del tenant antes de devolver slots/disponibilidad. |
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
                ├── Lazy: alguien consulta /api/slots o /api/bookings/availability
                │   → ExpiredBookingsService.cancelExpiredBookings(tenantId)
                │   → Booking: PENDING → CANCELLED
                │   → Slot LIBRE en esa misma respuesta
                │
                └── Respaldo: cron 1 vez al día (0 3 * * * UTC)
                    → GET /api/jobs/cancel-expired-bookings
                    → Slot LIBRE para tenants sin tráfico
```

Al crear una nueva reserva para un slot que tiene una fila CANCELLED, **BookingRepository.create()** reutiliza esa fila (UPDATE) en lugar de INSERT, evitando P2002 y el mensaje "horario no disponible". Ver [lazy-cron-reutilizar-fila-cancelada-2026-03](../actualizaciones/lazy-cron-reutilizar-fila-cancelada-2026-03.md).
