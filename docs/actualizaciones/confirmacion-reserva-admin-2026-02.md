# Confirmación automática de reservas creadas por el admin

**Fecha:** 13 de febrero de 2026

Documentación de los cambios realizados para que las reservas creadas por el administrador con el botón **Nueva Reserva** se creen ya **confirmadas** en el momento en que el admin hace clic en **Crear Reserva**, sin pasar por estado pendiente.

---

## Objetivo

Definir y documentar el flujo de confirmación de turnos:

1. **Reserva desde la página (usuario)**  
   El usuario elige cancha y horario, paga (seña o total). Cuando el pago es aprobado (webhook), la reserva pasa automáticamente de `PENDING` a `CONFIRMED`. No interviene el admin.

2. **Reserva creada por el admin (Nueva Reserva)**  
   El admin abre el modal **Nueva Reserva**, completa los datos y hace clic en **Crear Reserva**. Ese clic se considera la confirmación del turno por parte del admin. La reserva debe crearse directamente con estado **CONFIRMED**, no como pendiente.

Antes, todas las reservas se creaban con `status: PENDING`; las del admin solo pasaban a confirmadas si el admin las confirmaba después manualmente o si (en otro flujo) se registraba un pago. Con este cambio, la acción **Crear Reserva** del admin implica confirmar el turno.

---

## Resumen de cambios

### 1. Validación y tipos

- **`lib/validations/booking.ts`**  
  - Se añade el campo opcional `confirmOnCreate: z.boolean().optional()` al schema de creación de reserva (`createBookingSchema`).  
  - Solo tiene efecto cuando quien crea la reserva es un admin (se valida en la API).

- **`types/booking.ts`**  
  - Se añade `confirmOnCreate?: boolean` a la interfaz `CreateBookingRequest`.

### 2. Repositorio

- **`lib/repositories/BookingRepository.ts`**  
  - `BookingCreateInput` acepta un campo opcional `status?: BookingStatus`.  
  - `expiresAt` pasa a aceptar `Date | null` (cuando la reserva se crea confirmada, no debe tener fecha de expiración).  
  - En `create()`: si se recibe `data.status === 'CONFIRMED'`, la reserva se crea con `status: 'CONFIRMED'` y `expiresAt: null`; en caso contrario se mantiene el comportamiento anterior (`status: 'PENDING'`, `expiresAt` según configuración).

### 3. Servicio de reservas

- **`lib/services/BookingService.ts`**  
  - En `createBooking()`: si `input.confirmOnCreate === true`:  
    - Se usa `status: 'CONFIRMED'` en los datos de creación.  
    - Se fuerza `expiresAt: null` para que la reserva no entre en el job de cancelación por expiración.  
  - El resto del flujo (disponibilidad, precio, jugadores, etc.) no cambia.

### 4. API

- **`app/api/bookings/route.ts`** (POST para crear reserva)  
  - Tras parsear el body con `createBookingSchema`, se comprueba: si `validatedData.confirmOnCreate === true` y el usuario **no** es admin ni super admin, se fuerza `validatedData.confirmOnCreate = false`.  
  - Así solo los admins pueden crear reservas ya confirmadas; un usuario normal no puede abusar del flag.

### 5. Panel de administración – Turnos

- **`app/admin-panel/admin/turnos/page.tsx`**  
  - Al crear una **reserva puntual** desde el modal **Nueva Reserva** (no turno fijo), el payload enviado a `createBooking()` incluye `confirmOnCreate: true`.  
  - Con ello, esa reserva se crea directamente con estado CONFIRMED y aparece en la pestaña de turnos sin necesidad de confirmación posterior.

---

## Flujos resultantes

| Origen              | Acción                         | Estado al crear | Confirmación posterior        |
|---------------------|--------------------------------|-----------------|-------------------------------|
| Usuario (página)    | Reserva + pago online          | PENDING         | Automática al aprobar pago (webhook → CONFIRMED) |
| Admin               | Nueva Reserva → Crear Reserva  | **CONFIRMED**   | No necesaria (confirmada al crear) |

---

## Archivos modificados

- `lib/validations/booking.ts` – schema y tipo inferido
- `types/booking.ts` – interfaz de request
- `lib/repositories/BookingRepository.ts` – input y lógica de `create()`
- `lib/services/BookingService.ts` – lógica de `confirmOnCreate` y `expiresAt`
- `app/api/bookings/route.ts` – validación de admin para `confirmOnCreate`
- `app/admin-panel/admin/turnos/page.tsx` – envío de `confirmOnCreate: true` al crear reserva puntual

---

## Notas

- Las reservas creadas por el admin con **Nueva Reserva** ya no tienen `expiresAt`; no se cancelan por tiempo.  
- El turno fijo (recurrente) sigue usando su propio flujo; este documento solo afecta a la reserva puntual creada desde el modal **Nueva Reserva**.  
- Si en el futuro se permite que el admin cree reservas “pendientes” (por ejemplo para que el cliente pague después), se podría añadir una opción en el modal para no enviar `confirmOnCreate` en ese caso.
