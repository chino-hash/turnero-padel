---
name: Admin Turnos Pendientes
overview: "Plan para completar la pestaña Turnos del admin: métricas reales, vinculación usuario (nombre+email, typeahead, get-or-create), paginación, exportación, tiempo real, toasts, confirmación automática al pagar depósito (25%/50% por tenant) y flujo Terminar turno / Cerrar turno."
status: completed
completedAt: "2026-03-05"
todos:
  - id: toasts
    content: "Sustituir alert() por toasts (sonner) en página turnos y AdminTurnos"
    completed: true
  - id: terminar-cerrar
    content: "Botones Terminar turno y Cerrar turno; PUT bookings acepte COMPLETED sin pago completo"
    completed: true
  - id: metricas
    content: "Métricas reales: byDay, activeUsers, fetch stats en página"
    completed: true
  - id: vinculacion
    content: "Modal nombre+email, typeahead, get-or-create; POST bookings y recurring-bookings"
    completed: true
  - id: paginacion
    content: "Paginación en AdminTurnos con filtros al API"
    completed: true
  - id: exportacion
    content: "Exportar lista a CSV con filtros activos"
    completed: true
  - id: tiempo-real
    content: "Polling (o SSE) para refrescar lista; Page Visibility"
    completed: true
  - id: confirmacion-deposito
    content: "Config % por tenant; auto CONFIRMED al pagar depósito"
    completed: true
isProject: false
---

# Plan: Pendientes pestaña Turnos (admin)

## ✅ Completado

Este plan fue implementado en marzo 2026. Todos los ítems (toasts, Terminar/Cerrar turno, métricas reales, vinculación usuario, paginación, exportación CSV, polling con Page Visibility, confirmación al pagar depósito) están completos.

Referencia: [docs/pasos/admin-turnos-pendientes.md](docs/pasos/admin-turnos-pendientes.md)

Este plan desarrolla los 6 puntos del doc y añade: **confirmación automática al pagar depósito** (sec. 7), **flujo Terminar turno / Cerrar turno** (sec. 8), y en vinculación usuario **nombre + email**, **typeahead** y **get-or-create** (sin reservas "invitado" sin usuario: se crea usuario si no existe).

---

## 1. Métricas con datos reales

**Situación actual**

- En [app/admin-panel/admin/turnos/page.tsx](app/admin-panel/admin/turnos/page.tsx): "Usuarios Activos" está fijo en **24** (línea 417); "Turnos Hoy" muestra subtexto fijo **"+2 desde ayer"** (línea 380). `turnosHoy` se obtiene de `stats?.byDay?.[todayKey]` pero `useBookings` nunca popula `stats` (no hay llamada a `setStats`), y el backend de stats no devuelve `byDay`.

**Cambios**

- **Backend**: En [lib/repositories/BookingRepository.ts](lib/repositories/BookingRepository.ts), ampliar `getStats(dateFrom?, dateTo?)` para devolver:
  - `byDay`: agregación por `bookingDate` (formato YYYY-MM-DD) con conteo de reservas por día, acotada al rango si se pasa.
  - Respuesta con scope por tenant (implícito si el repo ya filtra por tenant).
- En [lib/services/BookingService.ts](lib/services/BookingService.ts), devolver en `getBookingStats` además de lo actual: `byDay`, `activeUsers` (usuarios distintos con al menos una reserva en período reciente; definir intervalo, ej. últimos 30 días, y documentarlo). `turnosAyer` se puede derivar en front desde `byDay`.
- En [types/booking.ts](types/booking.ts), ampliar el tipo `BookingStats` (o el que use la API) para incluir `byDay` y `activeUsers` si no están.
- **API**: [app/api/bookings/stats/route.ts](app/api/bookings/stats/route.ts) ya llama a `getBookingStats`; asegurar que los query params (p. ej. `dateFrom`/`dateTo` o `startDate`/`endDate`) se pasen correctamente y que la respuesta incluya `byDay` y `activeUsers`.
- **Front**: En la página de turnos, cargar estadísticas (p. ej. `useEffect` que llame a `GET /api/bookings/stats` con rango que incluya hoy y ayer), guardar en estado local y usar:
  - **Turnos Hoy**: valor de `byDay[todayKey]`; subtexto: variación real vs ayer, ej. "+N desde ayer" / "-N desde ayer" / "Sin cambio".
  - **Usuarios Activos**: valor de `activeUsers` (usuarios con reservas en período reciente).

---

## 2. Vinculación usuario en nueva reserva

**Situación actual**

- El modal de nueva reserva en la misma página usa solo "Nombre Completo" ([formData.userName](app/admin-panel/admin/turnos/page.tsx)) y al crear reserva puntual se envía `userId: user?.id` (el admin), no el cliente.

**Cambios**

- Añadir en el modal **nombre y email**: el modal de nueva reserva debe tener siempre campo **Email** además de nombre (actualmente solo "Nombre Completo"). Si el admin selecciona un usuario del typeahead, se rellenan nombre y email desde ese usuario; si escribe manualmente (get-or-create), ambos campos son obligatorios para crear el usuario en el tenant (el modelo `User` exige `email` y es único por tenant).
- Selector/búsqueda de usuario del tenant: usar `GET /api/crud/user` o `GET /api/usuarios?search=...` con búsqueda por nombre/email; typeahead con debounce; al elegir usuario, rellenar nombre y email y guardar `userId`. Si no se elige, enviar `guestName` + `guestEmail` (o equivalente) para get-or-create en backend.
- Backend POST: aceptar `userId` o `guestName` + `guestEmail`; get-or-create usuario cuando venga nombre+email sin `userId`; revisar [app/api/bookings/route.ts](app/api/bookings/route.ts) y [lib/validations/booking.ts](lib/validations/booking.ts).
- **Turno fijo (recurring)**: El mismo flujo (nombre + email, typeahead, get-or-create) aplica al crear un turno fijo desde el modal: el titular de la serie debe ser el usuario seleccionado o creado, no el admin. En POST `/api/recurring-bookings` aceptar `userId` o `guestName` + `guestEmail` y aplicar get-or-create si corresponde; en la página enviar el mismo `selectedUser` o nombre+email que en reserva puntual.

---

## 3. Paginación

**Situación actual**

- [components/AdminTurnos.tsx](components/AdminTurnos.tsx) hace un único `GET /api/bookings?limit=50` (línea 661-665), sin `page`; los filtros (búsqueda, estado, fecha) se aplican en cliente sobre esa lista.

**Cambios**

- En `AdminTurnos`: añadir estado de paginación (`page`, `limit`), incluir `page` y `limit` en los params del fetch a `/api/bookings`. Permitir `limit` configurable (ej. 10, 20, 50).
- Añadir controles de paginación (anterior/siguiente, página actual, total de páginas) usando `result.meta`. Al cambiar filtros (búsqueda, estado, fecha), resetear `page` a 1.
- Enviar filtros al API: usar `search`, `status`, `dateFrom`/`dateTo` según [app/api/bookings/route.ts](app/api/bookings/route.ts) y actualizar lista y `meta` con la respuesta (evita filtrar en cliente y mantiene consistencia con volumen grande).

---

## 4. Exportación

**Cambios**

- Añadir botón "Exportar" en la sección "Lista de Turnos y Reservas" (en `AdminTurnos` o en la página de turnos).
- Al exportar: usar los **filtros activos** (búsqueda, estado, fecha) y la paginación actual o un límite alto para obtener los datos (p. ej. `GET /api/bookings?limit=1000&...` con los mismos filtros), luego generar CSV (o Excel si se añade librería) con columnas útiles: fecha, cancha, horario, usuario, estado, pago, etc.
- Descarga en cliente: generar el archivo desde la respuesta y disparar descarga (sin nuevo endpoint si no se requiere; si se prefiere, se puede añadir `GET /api/bookings/export` que devuelva CSV con filtros en query).

---

## 5. Actualización en tiempo real

**Situación actual**

- No hay polling ni SSE para la lista de turnos en la pestaña Turnos. Existe `eventEmitters` en [lib/sse-events](lib/sse-events) y el API de bookings puede emitir eventos; hay que confirmar si ya hay un canal de eventos para reservas.

**Cambios**

- Comprobar si existe un endpoint SSE o cliente que escuche "bookings updated" (o similar) y si la lista de turnos se refresca al recibirlo.
- Si no existe: implementar **polling** cada X segundos (ej. 30–60 s): llamar a la función que recarga la lista en un `setInterval`, pausar cuando la pestaña no esté visible (Page Visibility API) y limpiar al desmontar. Alternativa: SSE si ya hay canal de reservas.

---

## 6. Consistencia de alerts (toasts)

**Situación actual**

- En [app/admin-panel/admin/turnos/page.tsx](app/admin-panel/admin/turnos/page.tsx) se usan múltiples `alert()` (líneas 78, 83, 99, 114, 117, 121, 222, 227, 247, 250, 266, 277, 282). En el proyecto se usan tanto `react-hot-toast` ([components/providers/ClientToaster.tsx](components/providers/ClientToaster.tsx)) como `sonner` (p. ej. [app/admin-panel/admin/canchas/page.tsx](app/admin-panel/admin/canchas/page.tsx)).

**Cambios**

- Elegir **un** sistema de toasts para el admin (recomendado: **sonner**, ya usado en canchas y bookings protegidos).
- Sustituir todos los `alert()` de la página de turnos por `toast.success()` o `toast.error()` según el caso.
- [components/AdminTurnos.tsx](components/AdminTurnos.tsx) actualmente no usa `alert()`. Al implementar los botones de la sección 8 (Terminar/Cerrar turno), usar el mismo sistema de toasts para éxito/error (import de sonner en el componente o callback `onNotify` desde la página).

---

## 7. Confirmación automática al pagar depósito (reserva creada por usuario)

**Requisito**

- Cuando la reserva la crea un **usuario normal** desde el dashboard (no el admin), **no** debe requerir confirmación manual del admin.
- La reserva debe pasar a estado **CONFIRMED** automáticamente cuando el usuario pague el depósito configurado: **25% o 50%** del total, según configuración del tenant.

**Cambios**

- **Configuración por tenant**: Añadir en el modelo o en configuración del tenant un campo que defina el porcentaje de depósito que confirma la reserva (ej. `depositConfirmPercent`: 25 o 50). Si ya existe algo similar (ej. en `Tenant` o `SystemSetting`), reutilizarlo.
- **Flujo de pago**: En el flujo donde se registra el pago (webhook de Mercado Pago, callback o endpoint de registro de pago), al detectar que el total pagado alcanza o supera ese porcentaje del total de la reserva, actualizar el `status` de la reserva a `CONFIRMED` sin intervención del admin.
- **Reserva creada por admin**: Sigue pudiendo crearse ya confirmada (`confirmOnCreate: true`); este punto solo aplica a reservas creadas por usuario desde el dashboard.

**Archivos a tocar**

- Modelo o config del tenant (nuevo campo o SystemSetting) para el porcentaje; **punto donde se registra el pago** (webhook Mercado Pago, callback, PATCH de pago, etc.): ahí añadir la lógica que actualice el status de la reserva a CONFIRMED cuando el total pagado alcance o supere el % configurado (ver Huecos 7 para total base y idempotencia).

---

## 8. Botones "Terminar turno" y "Cerrar turno"

**Requisito**

- **Terminar turno**: mostrarse cuando el turno está **en curso** (`in_progress`) o **pasada la hora sin cerrar** (`awaiting_completion`). Al clic: pasar la reserva a **COMPLETED**; el turno va a "Turnos completados" y se puede seguir agregando extras.
- **Cerrar turno**: mostrarse **solo** cuando el turno está **completado** (COMPLETED) y **todo pagado** (saldo = 0). Al clic: POST `/api/bookings/:id/close` (setear `closedAt`); el turno pasa a "Turnos cerrados".

**Situación actual**

- En AdminTurnos hay un único botón "Completar" que hace el cierre (close) y está deshabilitado si hay saldo pendiente. No existe un botón "Terminar turno" que solo pase a COMPLETED.

**Cambios**

- En [components/AdminTurnos.tsx](components/AdminTurnos.tsx), en el contenido expandido de cada turno (donde se muestran acciones):
  - **"Terminar turno"**: Mostrar cuando `category === 'in_progress'` **o** `category === 'awaiting_completion'` (para no dejar turnos atascados en "confirmados" cuando ya pasó la hora). Al clic: `updateBookingStatus(bookingId, 'completado')` (PUT status COMPLETED). Permitir pasar a completado aunque el pago no esté al 100% (ajustar la condición que hoy bloquea por `paymentStatus !== 'pagado'` solo para esta acción).
  - **"Cerrar turno"**: Mostrar solo cuando `pendingBalance === 0` y `status === 'completado' && !booking.closedAt`. Al clic: `closeBooking(bookingId)`. Renombrar el botón actual "Completar" a "Cerrar turno" donde corresponda.
- Asegurar que "Turnos completados" muestre los que tienen status COMPLETED y no closedAt, con "Agregar Extra" y "Cerrar turno" (cuando saldo 0) disponibles.
- **Backend**: En [app/api/bookings/[id]/route.ts](app/api/bookings/[id]/route.ts) (PUT), permitir `status: COMPLETED` aunque el pago no esté al 100% cuando la petición es de un admin (ajustar validación si hoy se rechaza o ignora).

---

## Huecos a tapar (decisiones y detalles)

### 1. Métricas

- **Params stats API**: En [app/api/bookings/stats/route.ts](app/api/bookings/stats/route.ts) los query params usan `startDate`/`endDate` pero `bookingFiltersSchema` espera `dateFrom`/`dateTo`. Mapear en la ruta antes del `parse` o usar un schema propio para stats.
- **Período "usuarios activos"**: Definir intervalo (ej. últimos 30 días con al menos una reserva) y documentarlo; mismo criterio en repo y API.
- **Origen de stats**: La página debe cargar stats con un `useEffect` propio que llame a `GET /api/bookings/stats`; no depender de `useBookings` (no rellena stats).
- **Tenant**: `getStats` debe filtrar por tenant (si no está ya implícito en el repositorio).

### 2. Vinculación usuario (nombre + email, get-or-create)

- **Búsqueda get-or-create**: Al recibir `guestName` + `guestEmail` sin `userId`: criterio de búsqueda (email exacto, nombre contains, etc.); si hay varios candidatos, política (usar el primero, o error pidiendo desambiguar).
- **Validación**: Longitud y formato de `guestName` y `guestEmail`; toast claro si get-or-create falla.

### 3. Paginación

- **Estado vacío**: Mensaje (y opcionalmente CTA) cuando `total === 0`. El resto (filtros al API, reset page) ya está fijado en la sección 3.

### 4. Exportación

- **Límite**: Límite máximo (ej. 1000 filas) con aviso en UI si hay más, o endpoint de export con streaming.
- **CSV**: Encoding (UTF-8 con BOM para Excel), separador (`,` o `;` según locale), formato de fechas; columnas sugeridas: fecha, cancha, horario, usuario, email, estado, pago, extras.

### 5. Tiempo real

- **Tras refrescar**: Si la página actual queda vacía tras el refresh (ej. se borraron items), volver a página 1 o mostrar vacío; documentar decisión. Page Visibility y limpieza del intervalo ya están en la sección 5.

### 6. Toasts

- **Provider**: Comprobar que el layout de admin (o raíz) incluya `<Toaster />` de sonner; si no, añadirlo. Alternativa: `react-hot-toast` en turnos.

### 7. Confirmación al pagar depósito

- **Dónde guardar el %**: Modelo `Tenant` (nuevo campo) o `SystemSetting` por tenant; documentar clave.
- **Valor por defecto**: Si no hay config, default (ej. 50%) o "no auto-confirmar".
- **Cálculo del total**: Definir si el umbral es sobre `totalPrice` solo o `totalPrice + totalExtras`; mismo criterio para "total pagado" vs ese total.
- **Idempotencia**: Si la reserva ya está CONFIRMED, no re-ejecutar.

### 8. Terminar turno / Cerrar turno

- **awaiting_completion**: Decisión aplicada en sección 8: mostrar "Terminar turno" también para `awaiting_completion` (además de `in_progress`).
- **Opcional / futuro**: En la sección "Turnos confirmados", para ítems con categoría `awaiting_completion`, mostrar temporizador en rojo con cuenta regresiva negativa (minutos pasados desde la hora de fin del turno) para mayor visibilidad.

---

## Orden sugerido de implementación

1. **Toasts** (6): cambio acotado; mejora UX del resto.
2. **Botones Terminar turno / Cerrar turno** (8): En AdminTurnos, dos botones con visibilidad por categoría y saldo; en paralelo, ajustar PUT [app/api/bookings/[id]/route.ts](app/api/bookings/[id]/route.ts) para aceptar COMPLETED sin exigir pago completo cuando es admin.
3. **Métricas reales** (1): Backend (repo + service + API, params y tipos) y luego front (fetch stats en página).
4. **Vinculación usuario** (2): Modal nombre + email, typeahead, get-or-create; API búsqueda; POST bookings y recurring-bookings.
5. **Paginación** (3): AdminTurnos con page/limit y filtros al API; reset page al cambiar filtros.
6. **Exportación** (4): Botón + generación CSV con filtros activos (límite y formato según Huecos 4).
7. **Tiempo real** (5): Polling (o SSE si existe canal), con Page Visibility y limpieza.
8. **Confirmación al pagar depósito** (7): Config tenant; en el punto donde se registra el pago, actualizar status a CONFIRMED al alcanzar el % (Huecos 7).

---

## Archivos principales a tocar


| Área                         | Archivos                                                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Métricas                     | `lib/repositories/BookingRepository.ts`, `lib/services/BookingService.ts`, `app/api/bookings/stats/route.ts`, `app/admin-panel/admin/turnos/page.tsx`, `types/booking.ts`                                                                                                                     |
| Usuario en reserva           | `app/admin-panel/admin/turnos/page.tsx` (modal nombre + email, typeahead, puntual y turno fijo), `app/api/bookings/route.ts` (POST, get-or-create), `app/api/recurring-bookings/route.ts` (POST, get-or-create), `lib/validations/booking.ts`, `app/api/usuarios/route.ts` o `/api/crud/user` |
| Paginación                   | `components/AdminTurnos.tsx`, opcionalmente `app/admin-panel/admin/turnos/page.tsx`                                                                                                                                                                                                           |
| Exportación                  | `components/AdminTurnos.tsx` o página de turnos                                                                                                                                                                                                                                               |
| Toasts                       | `app/admin-panel/admin/turnos/page.tsx`, `components/AdminTurnos.tsx`                                                                                                                                                                                                                         |
| Tiempo real                  | `app/admin-panel/admin/turnos/page.tsx` y/o `components/AdminTurnos.tsx`, `lib/sse-events` si aplica                                                                                                                                                                                          |
| Confirmación al depósito (7) | Config tenant (schema/config), flujo de pago (webhook/callback), lógica que actualice status a CONFIRMED al alcanzar %                                                                                                                                                                        |
| Terminar / Cerrar turno (8)  | `components/AdminTurnos.tsx` (dos botones, visibilidad por categoría y saldo), `app/api/bookings/[id]/route.ts` (PUT: permitir COMPLETED sin pago completo para admin)                                                                                                                        |
