# Modo demo Mercado Pago y administrador del tenant (2026-03)

**Fecha:** Marzo 2026  
**Áreas:** Pagos (modo demo), Super Admin (tenants), Flujo de reserva con pago simulado

Documentación de lo implementado según el plan "Demo MP (Sandbox sin credenciales) y Admin del tenant": uso de Mock cuando el tenant está en sandbox sin credenciales, sección de email del administrador del tenant al crear/editar, y confirmación de reserva en la página de pago simulado.

---

## 1. Modo demo profesional: Sandbox sin credenciales → Mock

### Objetivo

Si un tenant tiene **Mercado Pago habilitado**, ambiente **Sandbox** y **no tiene Access Token** (o está vacío), el sistema debe usar `MockPaymentProvider` en lugar de fallar. Así se puede demostrar el flujo de pago sin credenciales reales y luego configurarlas en "Editar tenant".

### Cambios

#### 1.1 Credenciales por tenant

**Archivo:** `lib/services/payments/tenant-credentials.ts`

- Después de validar que Mercado Pago está habilitado y **antes** de validar el Access Token, se añadió:
  - Si el ambiente es `sandbox` y no hay token usable (`!tenant.mercadoPagoAccessToken` o string vacío tras trim), se lanza un error con mensaje fijo: `SANDBOX_SIN_CREDENCIALES_USAR_MOCK`.
- El factory de pagos puede distinguir este caso de "tenant inactivo", "MP no habilitado" o "production sin credenciales" (que siguen fallando).

#### 1.2 Factory de proveedores de pago

**Archivo:** `lib/services/payments/PaymentProviderFactory.ts`

- En el `catch` de `getPaymentProvider(tenantId)`:
  - Si el mensaje del error incluye `SANDBOX_SIN_CREDENCIALES_USAR_MOCK`, se instancia `MockPaymentProvider`, se guarda en caché y se devuelve (no se relanza el error).

#### 1.3 Formulario tenant (Super Admin)

**Archivo:** `app/super-admin/tenants/[id]/page.tsx`

- En `handleSubmit`, la validación de credenciales se relajó cuando **Mercado Pago habilitado + ambiente Sandbox**:
  - No se exigen Access Token ni Public Key en ese caso (se permite guardar para usar modo demo).
- En ambiente **production** se siguen exigiendo Access Token y Public Key.

---

## 2. Sección "Administrador del tenant" (crear y editar)

### Objetivo

Entre la tarjeta "Información Básica" y "Credenciales de Mercado Pago" se añadió una tarjeta **"Administrador del tenant"** con el campo **Email (Gmail) del administrador**. Visible al crear y al editar tenant; el valor se persiste y se usa para el primer admin y para bootstrap.

### Cambios

#### 2.1 Modelo y migración

**Archivo:** `prisma/schema.prisma`

- En el modelo `Tenant` se añadió el campo opcional: `ownerEmail String?`.
- **Migración:** `prisma/migrations/20260308100000_add_tenant_owner_email/migration.sql` (añade la columna `ownerEmail` a `Tenant`).

#### 2.2 API de tenants

**POST `/api/tenants`** (`app/api/tenants/route.ts`)

- Schema Zod: `ownerEmail: z.string().email().optional().or(z.literal(''))`.
- Si se envía `ownerEmail` no vacío, se guarda en el tenant y, tras crear el tenant, se hace **upsert** en `AdminWhitelist` (tenantId, email, rol ADMIN, isActive) para que ese email quede como admin del tenant.
- La respuesta incluye `ownerEmail` en el `select`.

**GET/PUT `/api/tenants/[id]`** (`app/api/tenants/[id]/route.ts`)

- **GET:** Se añadió `ownerEmail` al `select` del tenant.
- **PUT:** Schema con `ownerEmail` opcional/nullable; si viene en el body, se actualiza el tenant. Si se envía un `ownerEmail` nuevo no vacío, se hace upsert en `AdminWhitelist` para ese tenant (no se desactiva el email anterior). Tras actualizar se sigue llamando a `invalidateTenantProviderCache(id)` cuando corresponda.

#### 2.3 Formulario Super Admin

**Archivo:** `app/super-admin/tenants/[id]/page.tsx`

- **Estado:** Se añadió `ownerEmail: string | null` a la interfaz `TenantData` y al estado inicial; al cargar un tenant existente se rellena desde `tenant.ownerEmail`.
- **Nueva tarjeta** entre "Información Básica" y "Credenciales de Mercado Pago":
  - Título: "Administrador del tenant".
  - Descripción: indica que es el email (Gmail) del administrador del tenant.
  - Campo: "Email del administrador (Gmail)", `type="email"`, opcional.
- **Envío:** En POST se envía `ownerEmail` (trim o undefined); en PUT se envía `ownerEmail` (trim o null).
- **Bootstrap:** En `handleBootstrap` se usa por defecto `formData.ownerEmail?.trim() || authUser?.email || ''` para el `ownerEmail` del request a `/api/tenants/bootstrap`.

---

## 3. Modo demo: simular pago y confirmar reserva

### Objetivo

En modo demo el usuario es redirigido a `/payments/mock-success?bookingId=...`. Antes esa página solo mostraba "Pago simulado" y no confirmaba la reserva. Ahora, al cargar la página, se llama a una API que aplica el mismo efecto que el webhook de Mercado Pago: confirmar la reserva, quitar el turno del dashboard y mostrarlo en Mis Turnos como confirmado.

### Cambios

#### 3.1 API mock-confirm

**Nueva ruta:** `POST /api/bookings/[id]/mock-confirm` (`app/api/bookings/[id]/mock-confirm/route.ts`)

- **Autenticación:** Requiere sesión.
- **Autorización:** Solo el dueño de la reserva (`booking.userId === session.user.id`); si no coincide, 403.
- **Condición de modo demo:** El tenant del booking debe tener `mercadoPagoEnabled === true`, ambiente `sandbox` y sin Access Token (o vacío). Si no, 403.
- **Idempotencia:** Si la reserva no está en `PENDING` (ya confirmada o cancelada), responde 200 sin cambios.
- **Lógica (misma que webhook de MP para pago aprobado):**
  - En una transacción: actualizar booking a `status: 'CONFIRMED'`, `paymentStatus: 'DEPOSIT_PAID'`, `expiresAt: null`; crear registro en `Payment` (tenantId, bookingId, amount = depositAmount o totalPrice, paymentMethod: 'CARD', paymentType: 'PAYMENT', status: 'completed', notes: 'Pago simulado (modo demo)').
  - Tras la transacción: `clearBookingsCache(booking.courtId, booking.bookingDate)` y `eventEmitters.bookingsUpdated(...)` para que el dashboard y Mis Turnos se actualicen en tiempo real.
- Respuesta: `200` con `{ success: true }`.

#### 3.2 Página mock-success

**Archivo:** `app/payments/mock-success/page.tsx`

- **Query:** Se lee `bookingId` de `searchParams`. Si falta o está vacío, no se llama a la API y se muestra el mensaje "Falta información de la reserva" con enlace al inicio.
- **Llamada única:** En un `useEffect` se llama una sola vez a `POST /api/bookings/[bookingId]/mock-confirm` (se usa un ref para evitar doble llamada en React Strict Mode).
- **Estados:**
  - **loading:** "Confirmando reserva..." con spinner.
  - **success:** Mensaje "Pago simulado - La reserva quedó confirmada" y enlaces "Ir a Mis Turnos" y "Volver al inicio" (ambos a `/`).
  - **error:** Mensaje de error (ej. 403) y enlaces a Mis Turnos e inicio.

---

## 4. Resumen de archivos tocados

| Área              | Archivo                                           | Cambio principal                                                                 |
|-------------------|---------------------------------------------------|-----------------------------------------------------------------------------------|
| Credenciales MP   | `lib/services/payments/tenant-credentials.ts`     | Lanzar `SANDBOX_SIN_CREDENCIALES_USAR_MOCK` cuando sandbox sin token             |
| Factory pagos     | `lib/services/payments/PaymentProviderFactory.ts` | Detectar ese error y devolver MockPaymentProvider                                |
| Schema            | `prisma/schema.prisma`                            | Campo `ownerEmail` en Tenant                                                      |
| Migración         | `prisma/migrations/20260308100000_add_tenant_owner_email/migration.sql` | Añadir columna ownerEmail                         |
| API crear tenant  | `app/api/tenants/route.ts`                        | Aceptar ownerEmail; crear AdminWhitelist al crear tenant                          |
| API get/put       | `app/api/tenants/[id]/route.ts`                   | GET/PUT ownerEmail; upsert AdminWhitelist en PUT cuando hay ownerEmail            |
| Form tenant       | `app/super-admin/tenants/[id]/page.tsx`          | Validación MP sandbox opcional; tarjeta Admin; ownerEmail en estado y payload; bootstrap con ownerEmail |
| Mock confirm      | `app/api/bookings/[id]/mock-confirm/route.ts`     | Nueva ruta POST para confirmar reserva en modo demo                              |
| Mock success UI   | `app/payments/mock-success/page.tsx`              | Leer bookingId; llamar mock-confirm al montar; estados loading/success/error      |

---

## 5. Flujo resultante

1. **Crear/editar tenant (Super Admin):** Se puede indicar el Gmail del administrador; al crear, se crea el tenant y, si hay email, la entrada en AdminWhitelist. Al editar, se puede cambiar el ownerEmail y se hace upsert en AdminWhitelist.
2. **Modo demo (tenant con MP habilitado, sandbox, sin credenciales):** Al crear una reserva, se genera la preferencia con MockPaymentProvider y se redirige a `/payments/mock-success?bookingId=...`.
3. **Página mock-success:** Llama a `POST /api/bookings/[id]/mock-confirm`; la reserva pasa a CONFIRMED y DEPOSIT_PAID, se crea el Payment de demo y se invalida caché y se emite evento. El turno desaparece del dashboard y aparece en Mis Turnos como confirmado.
