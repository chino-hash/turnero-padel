---
name: Super Admin UI pendiente
overview: "Plan unificado: (1) Super Admin con slug derivado del nombre, Bootstrap, Admins, Canchas, Configuración, Productos y seña configurable; (2) Flujo de pago MP con páginas de retorno, botón Pagar en Mis Turnos (seña como porcentaje), y página mock-success."
todos:
  - id: api-courts-tenantid
    content: GET /api/courts query tenantId y filtrar para Super Admin
    status: pending
  - id: api-productos-tenantid
    content: GET /api/productos query tenantId y filtrar para Super Admin
    status: pending
  - id: api-bykey-tenantid
    content: GET /api/system-settings/by-key query tenantId para Super Admin
    status: pending
  - id: bootstrap-deposit-percentage
    content: Bootstrap añadir system setting deposit_percentage = 50
    status: pending
  - id: slug-nameToSlug
    content: Helper nameToSlug y derivar slug del nombre al crear tenant
    status: pending
  - id: sena-getDepositPercentage
    content: BookingService getDepositPercentage y usar en createBooking
    status: pending
  - id: superadmin-bootstrap-btn
    content: Super Admin botón Ejecutar bootstrap y manejo éxito/error
    status: pending
  - id: superadmin-admins
    content: Super Admin sección Admins listar y agregar
    status: pending
  - id: superadmin-canchas
    content: Super Admin sección Canchas listar crear eliminar
    status: pending
  - id: superadmin-config-sena
    content: Super Admin Configuración 5 keys y selector seña 25/50/75/100
    status: pending
  - id: superadmin-productos
    content: Super Admin sección Productos listar y crear
    status: pending
  - id: mapeo-bookings-misturnos
    content: AppStateProvider mapear api/bookings/user a forma MisTurnos y expiresAt
    status: pending
  - id: misturnos-boton-pagar-sena
    content: MisTurnos botón Pagar seña y onPayDeposit en padel-booking
    status: pending
  - id: paginas-retorno
    content: Crear páginas reservas exito error pendiente
    status: pending
  - id: pagina-mock-success
    content: Crear payments/mock-success Pago simulado y enlaces
    status: pending
isProject: false
---

# Plan: Super Admin UI + Flujo de pago Mercado Pago

Este plan integra las funcionalidades del panel Super Admin, el flujo de pago con Mercado Pago ([sistema-pago-mercadopago-estado-2026-03.md](docs/actualizaciones/sistema-pago-mercadopago-estado-2026-03.md), [pago-modal-reserva-sin-fallback-mp-env-2026-03.md](docs/actualizaciones/pago-modal-reserva-sin-fallback-mp-env-2026-03.md)) y las reglas de negocio: slug desde nombre, seña como porcentaje configurable, y página mock.

---

## Alcance

### Bloque A – Super Admin (detalle del tenant)

- **Slug derivado del nombre al crear tenant:** Al crear un tenant nuevo, el slug se deriva automáticamente del nombre del club (ej. "Club Central" → `club-central`: minúsculas, espacios a guiones, sin acentos/caracteres especiales). El campo slug sigue siendo editable por el usuario antes de guardar.
- **Bootstrap** (alta) – Botón que llame a `POST /api/tenants/bootstrap`.
- **Admins** (alta) – Listar y agregar admins con `GET/POST /api/admin?tenantId=`.
- **Canchas** (media) – Listar, crear y eliminar canchas del tenant.
- **Configuración** (media) – Ver/editar system settings del tenant (keys del bootstrap **y** porcentaje de seña).
- **Productos** (baja) – Listar y crear productos del tenant.
- **Seña (porcentaje):** El Super Admin configura por tenant el porcentaje de la cancha que se paga como seña: **25%, 50%, 75% o 100%**. Se guarda como system setting (ej. key `deposit_percentage`, valor `"25"`|`"50"`|`"75"`|`"100"`). El backend al crear la reserva usará ese porcentaje para calcular `depositAmount = totalPrice * (percentage / 100)`; la preferencia de pago de MP cobra ese monto (la seña), no el total completo salvo que sea 100%.

Todo en [app/super-admin/tenants/[id]/page.tsx](app/super-admin/tenants/[id]/page.tsx), solo cuando el tenant ya existe salvo el slug derivado que aplica en creación.

### Bloque B – Flujo de pago Mercado Pago

**Ya implementado (no tocar):**

- Backend: `POST /api/bookings/[id]/payment-preference` con 503 y `code: 'MERCADOPAGO_NOT_CONNECTED'` cuando el tenant no tiene MP; sin fallback a `.env`.
- Modal "Confirmar reserva" en [padel-booking.tsx](padel-booking.tsx): crea reserva → payment-preference → redirige a MP o muestra mensaje si no hay MP.

**Pendiente:**

- **Páginas de retorno:** Crear [app/reservas/exito/page.tsx](app/reservas/exito/page.tsx), [app/reservas/error/page.tsx](app/reservas/pendiente/page.tsx) con mensaje y enlace a Mis Turnos o club.
- **Botón "Pagar" en Mis Turnos:** Para reservas con `paymentStatus === 'Pending'` y no expiradas: botón "Pagar seña" (o "Pagar con Mercado Pago") que llame a payment-preference y redirija a MP; si 503 + `MERCADOPAGO_NOT_CONNECTED`, mostrar mensaje y no redirigir. **Solo se paga el monto de la seña** (porcentaje configurado por tenant), no el total de la cancha salvo que el porcentaje sea 100%.
- **Página mock:** Implementar [app/payments/mock-success/page.tsx](app/payments/mock-success/page.tsx) con mensaje "Pago simulado" y enlace a Mis Turnos o home (para desarrollo con `MockPaymentProvider`).

---

## 1. Slug derivado del nombre al crear tenant

- **Dónde:** Formulario de creación en [app/super-admin/tenants/[id]/page.tsx](app/super-admin/tenants/[id]/page.tsx) (cuando `id === 'new'`).
- **Comportamiento:** Al cambiar el campo "Nombre", si el slug está vacío o no fue editado manualmente, derivar slug desde el nombre: normalizar a minúsculas, reemplazar espacios por guiones, quitar acentos y caracteres no permitidos (solo `a-z`, `0-9`, `-`). Si el usuario edita el slug a mano, no sobrescribirlo al seguir editando el nombre.
- **Implementación:** Función helper `nameToSlug(name: string)`. En el formulario, al `onChange` del nombre, si se considera que el slug debe auto-actualizarse (p. ej. slug vacío o igual al último slug derivado), setear slug con `nameToSlug(formData.name)`.

---

## 2. Seña: porcentaje 25 / 50 / 75 / 100 % configurable por tenant

- **Modelo de configuración:** System setting por tenant con key `deposit_percentage` (o `seña_percentage`), valor `"25"` | `"50"` | `"75"` | `"100"`. Valor por defecto si no existe: p. ej. `"50"`.
- **Super Admin UI:** En el detalle del tenant, en la sección **Configuración** (o una card "Pagos / Seña"), un selector o radio: "Porcentaje de seña: 25% | 50% | 75% | 100%". Guardar vía `POST /api/system-settings/upsert` con `key: 'deposit_percentage'`, `value`, `tenantId`.
- **Backend – creación de reserva:** En [lib/services/BookingService.ts](lib/services/BookingService.ts) (o donde se calcula `depositAmount` al crear el booking), en lugar de `totalPrice * 0.3`, obtener el system setting `deposit_percentage` del tenant (o default 50). `depositAmount = Math.round(totalPrice * (percentage / 100))`. El modelo `Booking` ya tiene `depositAmount`; [createPaymentPreference](lib/services/BookingService.ts) ya usa `booking.depositAmount || booking.totalPrice` como monto a cobrar.
- **Resumen:** El usuario (club) decide qué porcentaje quiere; el Super Admin lo configura desde el panel. En 3.2 (Mis Turnos) y en el modal de confirmar reserva, el pago que se redirige a MP es solo ese monto (seña).

---

## 3. Ajustes de API (solo Super Admin)

| Endpoint | Cambio |
|----------|--------|
| **GET /api/courts** | Query opcional `tenantId`. Si Super Admin y `tenantId`, usar `getAllCourts(tenantId)`. |
| **GET /api/productos** | Query opcional `tenantId`. Si Super Admin y `tenantId`, `where.tenantId = tenantId`. |
| **GET /api/system-settings/by-key** | Query opcional `tenantId`. Si Super Admin y `tenantId`, `where: { key, tenantId }`. |

---

## 4. Super Admin – Estructura y secciones (resumen)

- Formulario actual (nombre, slug, plan, MP). **Al crear:** slug derivado del nombre (editable).
- Solo si `!newTenant && formData.id`: cards Bootstrap, Admins, Canchas, **Configuración** (incluye las 5 keys del bootstrap **y** porcentaje de seña 25/50/75/100), Productos.

---

## 5. Flujo de pago MP – Detalle

### 5.1 Páginas de retorno (obligatorio)

- Crear `app/reservas/exito/page.tsx`, `app/reservas/error/page.tsx`, `app/reservas/pendiente/page.tsx`: mensaje y enlace a Mis Turnos o club.

### 5.2 Botón "Pagar seña" en Mis Turnos (obligatorio)

- En [components/MisTurnos.tsx](components/MisTurnos.tsx), para reservas con `paymentStatus === 'Pending'` y no expiradas: botón "Pagar seña" (o "Pagar con Mercado Pago").
- Al clic: `POST /api/bookings/[id]/payment-preference`. Si 503 y `data.code === 'MERCADOPAGO_NOT_CONNECTED'`, mostrar mensaje y no redirigir. Si OK, redirigir a `sandboxInitPoint` o `initPoint`.
- **Importante:** El monto cobrado es solo la **seña** (porcentaje del precio de la cancha configurado por tenant), no el total salvo que el porcentaje sea 100%. El backend ya usa `booking.depositAmount` para el monto de la preferencia.

### 5.3 Página mock (obligatorio)

- Implementar [app/payments/mock-success/page.tsx](app/payments/mock-success/page.tsx): mensaje "Pago simulado" y enlace a Mis Turnos o home. Útil en desarrollo con `MockPaymentProvider`.

---

## 6. Orden de implementación sugerido

1. **Fase API:** courts, productos, by-key (query `tenantId`).
2. **Slug desde nombre:** Helper `nameToSlug` y uso en formulario de creación de tenant.
3. **Seña:** System setting `deposit_percentage`; UI en Super Admin (Configuración); en BookingService al crear reserva usar porcentaje para `depositAmount`.
4. **Fase Super Admin UI:** Bootstrap, Admins, Canchas, Configuración (incl. seña), Productos.
5. **Fase Pago MP:** Páginas `/reservas/exito`, `/reservas/error`, `/reservas/pendiente`; botón Pagar seña en Mis Turnos; página `/payments/mock-success`.

---

## To-dos (seguimiento)

| # | Tarea | Estado |
|---|--------|--------|
| 1 | GET /api/courts: query `tenantId` y filtrar para Super Admin | Pendiente |
| 2 | GET /api/productos: query `tenantId` y filtrar para Super Admin | Pendiente |
| 3 | GET /api/system-settings/by-key: query `tenantId` para Super Admin | Pendiente |
| 4 | Bootstrap: añadir system setting `deposit_percentage` = 50 | Pendiente |
| 5 | Helper `nameToSlug` y derivar slug del nombre al crear tenant | Pendiente |
| 6 | BookingService: `getDepositPercentage` y usar en createBooking | Pendiente |
| 7 | Super Admin: botón "Ejecutar bootstrap" y manejo éxito/error | Pendiente |
| 8 | Super Admin: sección Admins (listar + agregar) | Pendiente |
| 9 | Super Admin: sección Canchas (listar, crear, eliminar) | Pendiente |
| 10 | Super Admin: Configuración (5 keys + selector seña 25/50/75/100) | Pendiente |
| 11 | Super Admin: sección Productos (listar + crear) | Pendiente |
| 12 | AppStateProvider: mapear /api/bookings/user a forma MisTurnos + expiresAt | Pendiente |
| 13 | MisTurnos: botón "Pagar seña" + onPayDeposit en padel-booking | Pendiente |
| 14 | Crear páginas /reservas/exito, /reservas/error, /reservas/pendiente | Pendiente |
| 15 | Crear /payments/mock-success ("Pago simulado" + enlaces) | Pendiente |

---

## 7. Archivos a tocar (resumen)

| Archivo | Cambios |
|---------|--------|
| [app/super-admin/tenants/[id]/page.tsx](app/super-admin/tenants/[id]/page.tsx) | Derivar slug del nombre al crear; secciones Bootstrap, Admins, Canchas, Config (con seña 25/50/75/100), Productos. |
| [app/api/courts/route.ts](app/api/courts/route.ts) | GET: query `tenantId` para Super Admin. |
| [app/api/productos/route.ts](app/api/productos/route.ts) | GET: query `tenantId` para Super Admin. |
| [app/api/system-settings/by-key/route.ts](app/api/system-settings/by-key/route.ts) | GET: query `tenantId` para Super Admin. |
| [lib/services/BookingService.ts](lib/services/BookingService.ts) | Al crear reserva: leer `deposit_percentage` del tenant (system setting), default 50; `depositAmount = totalPrice * (percentage/100)`. |
| [app/reservas/exito/page.tsx](app/reservas/exito/page.tsx) | Nueva página retorno pago exitoso. |
| [app/reservas/error/page.tsx](app/reservas/error/page.tsx) | Nueva página retorno pago fallido. |
| [app/reservas/pendiente/page.tsx](app/reservas/pendiente/page.tsx) | Nueva página retorno pago pendiente. |
| [components/MisTurnos.tsx](components/MisTurnos.tsx) | Botón "Pagar seña" para reservas PENDING; llamada a payment-preference; manejo 503 + MERCADOPAGO_NOT_CONNECTED; redirección a MP. |
| [app/payments/mock-success/page.tsx](app/payments/mock-success/page.tsx) | Página "Pago simulado" con enlace a Mis Turnos o home. |

---

## 8. Criterios de aceptación

**Super Admin:**

- Al crear tenant, el slug se deriva del nombre y es editable.
- Desde `/super-admin/tenants/[id]`: ejecutar bootstrap, ver/agregar admins, ver/crear/eliminar canchas, ver/editar config (5 keys + **porcentaje de seña 25/50/75/100**), ver/crear productos.
- GET courts, productos y by-key filtran por `tenantId` cuando es Super Admin.

**Seña:**

- El porcentaje de seña (25, 50, 75, 100 %) es configurable por tenant desde el panel Super Admin y se persiste (system setting).
- Al crear una reserva, `depositAmount` se calcula con ese porcentaje sobre el total. El pago en MP cobra ese monto (seña).

**Pago MP:**

- Retorno desde MP a `/reservas/exito`, `/reservas/error`, `/reservas/pendiente` sin 404.
- Mis Turnos: reservas PENDING muestran "Pagar seña"; al pagar se redirige a MP; si el tenant no tiene MP se muestra el mensaje acordado y no se redirige.
- Página `/payments/mock-success` implementada para desarrollo con mock.
