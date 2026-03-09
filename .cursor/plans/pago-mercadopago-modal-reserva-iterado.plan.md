# Plan iterado: Pago Mercado Pago desde "Confirmar Reserva" (todos los huecos)

## Objetivo

Al hacer clic en un horario en el dashboard y luego en "Confirmar Reserva" en el modal, crear la reserva con seña configurable por tenant (25% o 50%) y redirigir a Mercado Pago para pagar ese monto, cubriendo errores, bordes y UX.

---

## 1. Porcentaje de seña configurable por tenant

### 1.1 Schema y migración

- **Archivo:** [prisma/schema.prisma](prisma/schema.prisma)
- En el modelo `Tenant` añadir: `depositPercentage Int?` (porcentaje 1-100; null = usar default en código).
- Crear migración: `npx prisma migrate dev --name add_tenant_deposit_percentage`.
- **Hueco cubierto:** Tenants existentes quedan con null; no romper compatibilidad.

### 1.2 BookingService: cálculo de depósito

- **Archivo:** [lib/services/BookingService.ts](lib/services/BookingService.ts), método `createBooking`.
- Tras obtener `court` (y `court.tenantId`), cargar tenant: `prisma.tenant.findUnique({ where: { id: court.tenantId }, select: { depositPercentage: true } })`.
- Calcular: `const pct = tenant?.depositPercentage ?? 25;` y validar `pct` en rango 1-100 (si está fuera, usar 25).
- `const depositAmount = Math.round(totalPrice * (pct / 100));` (reemplazar el actual `totalPrice * 0.3`).
- **Hueco cubierto:** Default 25 cuando el tenant no tiene valor; validación evita valores inválidos.

### 1.3 API tenants: lectura y escritura

- **Archivo:** [app/api/tenants/[id]/route.ts](app/api/tenants/[id]/route.ts)
- **GET:** Incluir `depositPercentage` en el `select` de la respuesta (para que el formulario lo cargue).
- **PUT:** En el schema Zod añadir: `depositPercentage: z.number().int().min(1).max(100).optional().nullable()`. Aplicar en `updateData` y persistir.
- **Hueco cubierto:** Validación en backend para que nunca se guarde un valor fuera de 1-100.

### 1.4 Super Admin: formulario tenant

- **Archivo:** [app/super-admin/tenants/[id]/page.tsx](app/super-admin/tenants/[id]/page.tsx)
- Añadir `depositPercentage: number | null` al estado y al tipo `TenantData`.
- En el formulario: control para "Porcentaje de seña (%)" con opciones 25 y 50 (Select o radio) y opcional "Otro" con input numérico 1-100.
- Cargar en `loadTenant` y enviar en el submit (PUT). Si el backend devuelve null, mostrar valor por defecto 25 en la UI pero no enviar nada al guardar si el usuario no cambió (o enviar 25 explícitamente al crear).
- **Hueco cubierto:** Tenants nuevos y existentes pueden configurar el %; null/undefined se maneja en backend con default.

### 1.5 Bootstrap (opcional)

- **Archivo:** [scripts/bootstrap-tenant.js](scripts/bootstrap-tenant.js)
- Al crear o actualizar el tenant, setear `depositPercentage: 25` (o variable de entorno) si se desea un default en nuevos tenants.

---

## 2. Flujo: "Confirmar Reserva" → crear reserva → redirigir a Mercado Pago

### 2.1 Forma de respuesta de las APIs (evitar bugs)

- **POST /api/bookings:** Devuelve `NextResponse.json(result)` con `result = { success, data: BookingWithDetails, message }`. No hay `result.booking`. El id de la reserva es **`result.data.id`**.
- **POST /api/bookings/[id]/payment-preference:** Devuelve `{ success, data: { preferenceId, initPoint, sandboxInitPoint }, message }`. Las URLs de redirección están en `result.data.initPoint` y `result.data.sandboxInitPoint`.
- **Hueco cubierto:** El frontend debe usar `data.data.id` (o desestructurar `const { data } = await res.json()` y usar `data.id`) y para payment-preference usar `data.initPoint` / `data.sandboxInitPoint`. Revisar y corregir cualquier uso de `data.booking` o `data.booking.id` en el flujo nuevo y existente.

### 2.2 courtId y fecha en vista unificada vs una cancha

- En vista **una cancha**, el slot puede no traer `courtId`; se usa `selectedCourt` del estado.
- En vista **unificada**, los slots de [AppStateProvider](components/providers/AppStateProvider.tsx) ya incluyen `courtId` y `courtName`.
- El body de POST /api/bookings debe ser: `courtId: slot.courtId || selectedCourt`, `date: ymd(selectedDate)`, `startTime`, `endTime`. Asegurar que el handler reciba `selectedCourt` y `selectedDate` desde padel-booking y los use cuando el slot no tenga `courtId`.
- **Hueco cubierto:** Evitar crear la reserva en la cancha incorrecta en vista unificada; siempre enviar el courtId correcto.

### 2.3 SlotModal: callback y estado de carga

- **Archivo:** [components/SlotModal.tsx](components/SlotModal.tsx)
- Añadir prop: `onConfirmReservation?: (slot: TimeSlot) => void | Promise<void>`.
- En el botón "Confirmar Reserva": si existe `onConfirmReservation`, llamar `await onConfirmReservation(slot)` (manejar Promise), luego `onClose()`. Mostrar estado de carga (spinner + "Redirigiendo a Mercado Pago..." o "Creando reserva...") y deshabilitar el botón mientras corre.
- Si `onConfirmReservation` lanza, no cerrar el modal y mostrar mensaje de error (prop `onError?: (message: string) => void` o toast desde el padre).
- **Hueco cubierto:** Doble clic evitado; usuario ve feedback; errores no cierran el modal sin aviso.

### 2.4 HomeSection: pasar callback

- **Archivo:** [components/HomeSection.tsx](components/HomeSection.tsx)
- Añadir prop: `onConfirmReservation?: (slot: TimeSlot) => void | Promise<void>`.
- Pasarla a `SlotModal` como `onConfirmReservation`. Si no se pasa, el botón "Confirmar Reserva" mantiene el comportamiento actual (solo cerrar) para no romper otros usos.
- **Hueco cubierto:** Componente reutilizable; el flujo de pago es opcional.

### 2.5 padel-booking: handler completo

- **Archivo:** [padel-booking.tsx](padel-booking.tsx)
- Implementar `handleConfirmReservationFromSlot(slot: TimeSlot)` (o nombre similar) que:
  1. **Construir body:** `courtId: slot.courtId || selectedCourt`, `date: ymd(selectedDate)`, `startTime: slot.startTime`, `endTime: slot.endTime`.
  2. **POST /api/bookings** con ese body. Si `!res.ok`, leer `res.json().catch(() => ({}))` para mensaje de error y lanzar Error con mensaje amigable (ej. "Horario no disponible", "No autorizado").
  3. **Respuesta:** `const result = await res.json()`. Booking id = `result.data?.id`. Si no hay `result.data?.id`, lanzar Error("No se pudo crear la reserva").
  4. **POST /api/bookings/${result.data.id}/payment-preference.** Si `!res.ok`, decidir fallback: si el tenant no tiene MP configurado, el backend puede devolver 400; mostrar toast "Pago no disponible. Contacta al club." y opcionalmente cerrar modal o abrir el modal de pago simulado actual. Si hay error de red, mostrar "Error de conexión. Intenta de nuevo."
  5. **Respuesta:** `const pref = await res.json()`. URL = `pref.data?.sandboxInitPoint || pref.data?.initPoint`. Si no hay URL, toast de error y no redirigir.
  6. **Sandbox vs producción:** Usar `sandboxInitPoint` si existe y el entorno es sandbox (por ejemplo si `pref.data.sandboxInitPoint` está presente y se quiere priorizar sandbox en desarrollo), si no `initPoint`. Documentar que en producción Mercado Pago suele devolver solo `init_point`; en sandbox puede devolver ambos.
  7. **Redirección:** `window.location.href = url`.
- Pasar este handler a `HomeSection` como `onConfirmReservation`.
- **Hueco cubierto:** Errores de API, respuestas mal formadas, tenant sin MP y redirección correcta según entorno.

### 2.6 Usuario no autenticado

- POST /api/bookings y POST payment-preference requieren sesión. Si el usuario no está logueado, el API devuelve 401.
- En el handler, si la respuesta es 401, mostrar mensaje "Debes iniciar sesión para reservar" y opcionalmente redirigir a login con `callbackUrl` al dashboard (o abrir el modal de login si existe).
- **Hueco cubierto:** UX clara cuando no hay sesión.

### 2.7 Reserva ya tomada (race condition)

- Entre que el usuario abre el modal y confirma, otro usuario puede tomar el horario. El backend devuelve error (ej. "El horario seleccionado no está disponible").
- Mostrar ese mensaje en toast o en el modal y no redirigir; permitir cerrar el modal y elegir otro horario.
- **Hueco cubierto:** No redirigir a MP si la reserva no se creó.

---

## 3. Páginas de retorno después del pago (Mercado Pago back_urls)

- Las preferencias de MP ya configuran `back_urls` a `/reservas/exito`, `/reservas/error`, `/reservas/pendiente`. Esas rutas **no existen** hoy.
- Crear al menos tres páginas (o una con query `?status=success|failure|pending`) para que al volver de MP el usuario no vea 404:
  - [app/reservas/exito/page.tsx](app/reservas/exito/page.tsx): mensaje de éxito y enlace a "Mis Turnos" o dashboard.
  - [app/reservas/error/page.tsx](app/reservas/error/page.tsx): mensaje de error y enlace a intentar de nuevo o Mis Turnos.
  - [app/reservas/pendiente/page.tsx](app/reservas/pendiente/page.tsx): mensaje de pago pendiente y qué hacer.
- **Hueco cubierto:** Usuario que vuelve de MP tiene feedback claro y navegación.

---

## 4. MockPaymentProvider y desarrollo sin Mercado Pago

- Si el tenant no tiene MP configurado, el backend usa `MockPaymentProvider`, que devuelve `initPoint` a `/payments/mock-success?bookingId=...`. Esa ruta no existe.
- Opción A: Crear [app/payments/mock-success/page.tsx](app/payments/mock-success/page.tsx) que muestre "Pago simulado" y enlace a Mis Turnos (solo para desarrollo).
- Opción B: En el frontend, si la URL de payment-preference es del mismo origen (ej. contiene `/payments/mock-success`), redirigir igual; así el flujo completo funciona en local sin MP.
- **Hueco cubierto:** Desarrollo local sin credenciales de MP no rompe el flujo.

---

## 5. Resumen de archivos y tareas

| # | Área | Archivo | Tarea |
|---|------|---------|--------|
| 1 | Schema | prisma/schema.prisma | Añadir Tenant.depositPercentage (Int?). Migración. |
| 2 | Backend | lib/services/BookingService.ts | Leer depositPercentage del tenant; default 25; validar 1-100; calcular depositAmount. |
| 3 | API | app/api/tenants/[id]/route.ts | GET/PUT depositPercentage (Zod 1-100). |
| 4 | Super Admin | app/super-admin/tenants/[id]/page.tsx | Formulario: cargar/guardar porcentaje de seña (25/50 u otro 1-100). |
| 5 | Modal | components/SlotModal.tsx | Prop onConfirmReservation(slot); estado de carga; onError opcional; evitar doble clic. |
| 6 | Home | components/HomeSection.tsx | Prop onConfirmReservation; pasarla a SlotModal. |
| 7 | Dashboard | padel-booking.tsx | handleConfirmReservationFromSlot: body con courtId/date correctos; crear reserva; payment-preference; elegir initPoint/sandboxInitPoint; redirigir; manejar 401, 4xx, errores de red; toast/feedback. |
| 8 | Respuestas | (mismo flujo) | Usar result.data.id para booking; result.data.initPoint/sandboxInitPoint para URL. Revisar uso de data.booking en el resto del archivo. |
| 9 | Retorno MP | app/reservas/exito, error, pendiente | Crear páginas con mensaje y enlace a Mis Turnos/dashboard. |
| 10 | Mock | app/payments/mock-success/page.tsx (opcional) | Página simple "Pago simulado" + enlace para desarrollo. |
| 11 | Bootstrap | scripts/bootstrap-tenant.js (opcional) | Asignar depositPercentage default (ej. 25) al crear tenant. |

---

## 6. Orden de implementación recomendado

1. Prisma: campo `depositPercentage` y migración.
2. BookingService: uso de `depositPercentage` y default 25.
3. API tenants: GET/PUT y validación Zod.
4. Super Admin: formulario porcentaje de seña.
5. SlotModal: prop `onConfirmReservation`, estado de carga, manejo de errores.
6. HomeSection: prop y pasada a SlotModal.
7. padel-booking: handler con body correcto (courtId/date), uso de `result.data.id` y `result.data.initPoint`/`sandboxInitPoint`, manejo 401/4xx/red, toasts.
8. Páginas de retorno: `/reservas/exito`, `/reservas/error`, `/reservas/pendiente`.
9. (Opcional) Página mock `/payments/mock-success` y bootstrap con default de porcentaje.

Con esta iteración se cubren: forma de respuesta de las APIs, courtId/fecha en vista unificada, doble clic y carga, errores de red y backend, 401, reserva ya tomada, back_urls de MP y flujo mock en desarrollo.
