# Pestaña Turnos (admin): plan pendientes completado (2026-03)

**Fecha:** Marzo 2026  
**Ruta:** `/admin-panel/admin/turnos`  
**Referencia:** [docs/pasos/admin-turnos-pendientes.md](../pasos/admin-turnos-pendientes.md), plan `.cursor/plans/admin_turnos_pendientes.plan.md`

Resumen de la implementación del plan "Admin Turnos Pendientes": métricas reales, vinculación de usuario en nueva reserva, paginación, exportación CSV, tiempo real (polling), toasts, confirmación automática al pagar depósito y flujo Terminar turno / Cerrar turno.

---

## 1. Toasts (sonner)

- **Objetivo:** Sustituir `alert()` por toasts en la página de turnos y en AdminTurnos.
- **Cambios:**
  - En `app/layout.tsx`: `<Toaster />` de sonner (posición top-right, richColors, closeButton).
  - En `app/admin-panel/admin/turnos/page.tsx`: todos los `alert()` reemplazados por `toast.success()` / `toast.error()` (crear reserva, turno fijo, dar de baja esta semana, errores).
  - En `components/AdminTurnos.tsx`: import de `sonner`; toasts en `updateBookingStatus` y `closeBooking` (éxito/error).

---

## 2. Botones "Terminar turno" y "Cerrar turno"

- **Objetivo:** Separar el paso a completado del cierre definitivo; permitir terminar turno aunque no esté todo pagado.
- **Cambios:**
  - **Terminar turno:** visible cuando la categoría del turno es `in_progress` o `awaiting_completion`. Al clic: PUT `status: COMPLETED`. No se exige pago completo.
  - **Cerrar turno:** visible cuando `pendingBalance === 0`, `status === 'completado'` y no hay `closedAt`. Al clic: POST `/api/bookings/:id/close`. Si ya está cerrado se muestra texto "Cerrado".
  - Backend PUT `/api/bookings/[id]`: acepta `status: COMPLETED` sin exigir pago completo cuando la petición es de un admin.
  - Backend `/api/bookings/[id]/close`: solo permite cierre definitivo si el turno ya está en `COMPLETED`, terminó el horario y no hay saldo pendiente; el cierre definitivo se representa con `closedAt`.

**Definición de estados en este flujo:**
- `COMPLETED` + `closedAt = null`: turno terminado (intermedio, sección **TURNOS COMPLETADOS**).
- `COMPLETED` + `closedAt != null`: turno cerrado definitivamente (sección **TURNOS CERRADOS**).

**Archivos:** `components/AdminTurnos.tsx`, `app/api/bookings/[id]/route.ts` (validación de status).

---

## 3. Métricas con datos reales

- **Objetivo:** Turnos Hoy y Usuarios Activos con datos reales; variación vs ayer.
- **Backend:**
  - `lib/repositories/BookingRepository.ts`: `getStats(dateFrom?, dateTo?, tenantId?)` devuelve `byDay` (conteo por `bookingDate`) y `activeUsers` (usuarios distintos con reserva en los últimos 30 días, scoped por tenant).
  - `lib/services/BookingService.ts`: `getBookingStats` recibe `tenantId` y expone `byDay`, `activeUsers` y el resto de estadísticas.
  - `app/api/bookings/stats/route.ts`: mapeo de query params `startDate`/`endDate` a `dateFrom`/`dateTo`; llamada a `getBookingStats` con tenant del usuario (o scope para super admin).
- **Tipos:** `types/booking.ts`: `BookingStats` incluye `activeUsers` y estructura para `byDay`.
- **Front:** En `app/admin-panel/admin/turnos/page.tsx`: estado local para stats (`statsLocal`, `statsLoading`), `useEffect` que hace GET `/api/bookings/stats?startDate=&endDate=` (rango hoy/ayer) y actualiza las tarjetas: Turnos Hoy = `byDay[todayKey]`, subtítulo = variación vs ayer, Usuarios Activos = `activeUsers`, Ocupación = `occupancyRate`.

---

## 4. Vinculación de usuario en nueva reserva

- **Objetivo:** Vincular la reserva a un usuario existente (typeahead) o crear invitado por nombre + email (get-or-create).
- **API de búsqueda:** `GET /api/users/search?q=...` (mín. 2 caracteres, scoped por tenant, devuelve `id`, `name`, `email`). Archivo: `app/api/users/search/route.ts`.
- **Backend reservas:**
  - `lib/validations/booking.ts`: en `createBookingSchema` se añaden opcionales `userId`, `guestName`, `guestEmail`; refinamiento para que `guestName` y `guestEmail` vayan juntos.
  - `app/api/bookings/route.ts`: si el usuario es admin/superAdmin y envía `userId`, se valida que el usuario pertenezca al tenant y se usa ese `userId`; si envía `guestName` + `guestEmail`, get-or-create de `User` en el tenant (búsqueda por email+tenantId, creación si no existe) y se usa ese `userId`. En caso contrario se usa el usuario de la sesión.
  - `app/api/recurring-bookings/route.ts`: mismo criterio: acepta `userId` o `guestName` + `guestEmail`; get-or-create cuando corresponde.
- **Modal nueva reserva** (`app/admin-panel/admin/turnos/page.tsx`):
  - Campos **Nombre** y **Email** (ambos obligatorios si no se selecciona usuario).
  - Typeahead en Nombre: búsqueda con debounce 300 ms, mín. 2 caracteres, contra `/api/users/search`; al elegir un resultado se rellenan nombre, email y `selectedUserId`.
  - Envío: si hay usuario seleccionado → `userId`; si no → `guestName` + `guestEmail` (get-or-create en backend).
  - Enlace "Usar como invitado" para limpiar la selección y volver a nombre/email manual.
  - Mismo flujo para reserva puntual y para turno fijo (recurring).

**Archivos:** `app/admin-panel/admin/turnos/page.tsx`, `app/api/bookings/route.ts`, `app/api/recurring-bookings/route.ts`, `app/api/users/search/route.ts`, `lib/validations/booking.ts`, `types/booking.ts`.

---

## 5. Paginación

- **Objetivo:** Lista de turnos paginada con filtros enviados al API.
- **Cambios en** `components/AdminTurnos.tsx`:
  - Estado: `page`, `limit` (20), `totalPages`, `totalCount`.
  - Al cambiar `statusFilter` o `dateFilter` se resetea `page` a 1.
  - El fetch a `/api/bookings` incluye `page`, `limit`, `sortBy`, `sortOrder` y, según filtros: `status` (CONFIRMED/COMPLETED) y `dateFrom`/`dateTo`. El filtro "En curso" (in_progress) se aplica en cliente por categoría de tiempo.
  - `totalPages` y `totalCount` se actualizan desde `payload.meta`.
  - UI de paginación bajo la lista: texto "Página X de Y · Z turnos en total" y botones Anterior / Siguiente (solo si `totalPages > 1`).

---

## 6. Exportación CSV

- **Objetivo:** Exportar la lista de turnos con los filtros activos.
- **Cambios en** `components/AdminTurnos.tsx`:
  - Botón "Exportar" en la barra del header (junto a Filtros).
  - Al clic: petición a `/api/bookings` con los mismos filtros (estado, fecha), `limit=1000`, y filtrado en cliente para búsqueda e "in_progress" si aplica.
  - Generación de CSV: UTF-8 con BOM, columnas Fecha, Cancha, Horario, Usuario, Email, Estado, Pago, Extras; escape de campos con comillas cuando corresponde.
  - Descarga con nombre `turnos-YYYY-MM-DD.csv` y toast de éxito o error.

---

## 7. Actualización en tiempo real (polling)

- **Objetivo:** Refrescar la lista de turnos sin recargar la página; no consumir recursos cuando la pestaña no está visible.
- **Cambios en** `components/AdminTurnos.tsx`:
  - Estado `refreshKey`; efecto que configura un `setInterval` de 45 s que, solo si `document.visibilityState === 'visible'`, incrementa `refreshKey`.
  - Page Visibility API: al pasar a visible se inicia el intervalo; al pasar a oculta se limpia. Al desmontar el componente se limpia el intervalo y se elimina el listener.
  - El efecto que carga reservas depende de `refreshKey`, de modo que cada tick del intervalo provoca una nueva carga.

---

## 8. Confirmación automática al pagar depósito

- **Objetivo:** Pasar la reserva a CONFIRMED cuando el total pagado alcanza un porcentaje configurable del total (solo reservas creadas por usuario, no por admin).
- **Configuración:** Por tenant, clave en SystemSetting: `depositConfirmPercent` (valor 0–100, ej. 25 o 50). Si no existe, no se aplica auto-confirmación.
- **Punto de aplicación:** Tras actualizar el pago de un jugador (PATCH `/api/bookings/[id]/players/position/[position]/payment`). Si la reserva está en PENDING y el "total pagado" (suma de `paidAmount` de jugadores; si solo hay `hasPaid` sin monto, se usa la parte proporcional del total por jugador) ≥ `totalPrice * (depositConfirmPercent / 100)`, se actualiza el `status` de la reserva a CONFIRMED.
- Las reservas creadas por admin con "Nueva reserva" se crean ya CONFIRMED (`confirmOnCreate: true`) y no pasan por este flujo.

**Archivos:** `app/api/bookings/[id]/players/position/[position]/payment/route.ts`, uso de `prisma.systemSetting` (clave `depositConfirmPercent`) y `bookingService.updateBooking` para poner status CONFIRMED.

---

## Resumen de archivos tocados

| Área | Archivos |
|------|----------|
| Toasts | `app/layout.tsx`, `app/admin-panel/admin/turnos/page.tsx`, `components/AdminTurnos.tsx` |
| Terminar/Cerrar turno | `components/AdminTurnos.tsx`, `app/api/bookings/[id]/route.ts` |
| Métricas | `lib/repositories/BookingRepository.ts`, `lib/services/BookingService.ts`, `app/api/bookings/stats/route.ts`, `app/admin-panel/admin/turnos/page.tsx`, `types/booking.ts` |
| Vinculación usuario | `app/admin-panel/admin/turnos/page.tsx`, `app/api/bookings/route.ts`, `app/api/recurring-bookings/route.ts`, `app/api/users/search/route.ts`, `lib/validations/booking.ts`, `types/booking.ts` |
| Paginación | `components/AdminTurnos.tsx` |
| Exportación | `components/AdminTurnos.tsx` |
| Tiempo real | `components/AdminTurnos.tsx` |
| Confirmación depósito | `app/api/bookings/[id]/players/position/[position]/payment/route.ts` |

---

## Uso de la configuración depositConfirmPercent

Para activar la confirmación automática al pagar depósito, crear en cada tenant un registro en `SystemSetting` con:

- **key:** `depositConfirmPercent`
- **value:** número entre 0 y 100 (ej. `25` o `50`)
- **tenantId:** el ID del tenant

Si no existe esta clave, no se realiza auto-confirmación al registrar pagos.
