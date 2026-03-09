# Alta de Tenant, Planes de Suscripción y Configuración

**Fecha**: 2026-03-09
**Estado**: Implementado

---

## Tabla de Contenidos

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Crear un tenant nuevo](#crear-un-tenant-nuevo)
3. [Configuración del tenant](#configuración-del-tenant)
4. [Planes de suscripción](#planes-de-suscripción)
5. [Protección de tenant inactivo](#protección-de-tenant-inactivo)
6. [Qué debe brindar el cliente](#qué-debe-brindar-el-cliente)
7. [Panel Super Admin](#panel-super-admin)
8. [Flujo completo de alta de un tenant](#flujo-completo-de-alta-de-un-tenant)
9. [Mercado Pago por tenant](#mercado-pago-por-tenant)
10. [Permisos y roles sobre canchas](#permisos-y-roles-sobre-canchas)
11. [Reservas y expiración](#reservas-y-expiración)
12. [Variables de entorno relevantes](#variables-de-entorno-relevantes)
13. [Archivos involucrados](#archivos-involucrados)
14. [Decisiones de diseño](#decisiones-de-diseño)
15. [Troubleshooting](#troubleshooting)

---

## Resumen ejecutivo

Este documento cubre el proceso completo de crear un tenant nuevo en el sistema Turnero de Padel:

- **Tres formas de crear un tenant**: UI Super Admin, API y bootstrap.
- **Planes de suscripción** con límite de canchas: Básico (3), Intermedio (6), Premium (sin límite, 9 por defecto).
- **Protección de tenant inactivo**: un tenant recién creado está oculto (`isActive: false`) y no acepta reservas (endpoints de bookings, slots y availability lo validan). Solo el Super Admin lo activa cuando está listo.
- **El admin del tenant** configura horarios, precios y detalles de las canchas después de la creación.
- **Permisos de canchas**: solo el Super Admin crea y elimina canchas; el admin del tenant solo las edita.

---

## Crear un tenant nuevo

### Opción 1: Panel Super Admin (UI)

1. Entrar como Super Admin (email en `SUPER_ADMIN_EMAILS` de `.env`).
2. Ir a `/super-admin`.
3. Clic en **"Nuevo Tenant"** → **"Ir al formulario"** → `/super-admin/tenants/new`.
4. Completar el formulario:
   - **Nombre** (obligatorio): ej. "Club de Padel Central".
   - **Slug** (obligatorio, único): solo `a-z`, `0-9`, `-`. Se usa en la URL del club (`/club/mi-club`).
   - **Plan de Suscripción**: selector con Básico (hasta 3 canchas), Intermedio (hasta 6), Premium (sin límite).
   - **Fecha de Expiración**: opcional, para renovaciones.
   - **Mercado Pago**: habilitar, ambiente (sandbox/production), credenciales (Access Token, Public Key, Webhook Secret).
5. El tenant se crea con `isActive: false` (oculto) y una advertencia visible en el formulario.

**Nota sobre producción (Vercel):** Si se modifican variables como `SUPER_ADMIN_EMAILS` en Vercel, se requiere un **redeploy** y que el usuario **cierre sesión y vuelva a iniciar**, ya que el rol se almacena en el JWT al momento del login (ver `docs/actualizaciones/superadmin-vercel-2026-02.md`).

### Opción 2: API (solo Super Admin)

**POST `/api/tenants`**

```json
{
  "name": "Nombre del club",
  "slug": "slug-unico",
  "isActive": false,
  "subscriptionPlan": "BASIC",
  "subscriptionExpiresAt": "2026-12-31",
  "mercadoPagoAccessToken": "opcional",
  "mercadoPagoPublicKey": "opcional",
  "mercadoPagoWebhookSecret": "opcional",
  "mercadoPagoEnabled": false,
  "mercadoPagoEnvironment": "sandbox"
}
```

Validaciones:
- Slug: regex `^[a-z0-9-]+$`, debe ser único en BD.
- Credenciales MP: se encriptan con AES-256-GCM antes de guardar (requiere `CREDENTIAL_ENCRYPTION_KEY`).

### Opción 3: Bootstrap (tenant listo para usar)

Bootstrap **idempotente** que crea tenant + admin + canchas + settings + productos + MP.

**API** (con sesión Super Admin):

```
POST /api/tenants/bootstrap
```

```json
{
  "slug": "mi-club",
  "ownerEmail": "admin@club.com",
  "name": "Club Mi Club"
}
```

**Script** (sin Next.js):

```bash
node scripts/bootstrap-tenant.js mi-club admin@club.com "Club Mi Club"
```

Requisitos del script:
- `DATABASE_URL` configurada.
- Opcional: `CREDENTIAL_ENCRYPTION_KEY` para encriptar credenciales MP.
- Opcional: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`.

**Qué crea el bootstrap:**

| Elemento | Detalle |
|----------|---------|
| Tenant | `isActive: false`, `subscriptionPlan: 'BASIC'` |
| AdminWhitelist | Email del owner con rol ADMIN |
| Canchas | Cantidad según plan (3 para BASIC, 6 para MEDIUM, 9 para PREMIUM) con horarios 08:00–23:00, slot 90 min, precio base $24.000 |
| System settings | `operating_hours_start/end`, `default_slot_duration`, `booking_expiration_minutes`, `home_card_settings` |
| Productos | Pelota de Pádel, Grip, Agua, Gaseosa (precios y stock iniciales) |
| Mercado Pago | Si hay credenciales en env o en tenant `default`, las asigna (sandbox) |

Si el tenant ya existe, el bootstrap lo reactiva (sin forzar `isActive: true`) y actualiza/crea lo que falte sin duplicar.

---

## Configuración del tenant

### Modelo de datos (Prisma)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | String | Nombre del club |
| `slug` | String (único) | Identificador en URL |
| `isActive` | Boolean | Si está visible y acepta reservas |
| `subscriptionPlan` | String? | Plan: `BASIC`, `MEDIUM`, `PREMIUM` |
| `subscriptionExpiresAt` | DateTime? | Fecha de vencimiento del plan |
| `settings` | String (JSON) | Configuración genérica |
| `mercadoPagoAccessToken` | String? (encriptado) | Token de MP |
| `mercadoPagoPublicKey` | String? (encriptado) | Public Key de MP |
| `mercadoPagoWebhookSecret` | String? (encriptado) | Webhook Secret de MP |
| `mercadoPagoEnabled` | Boolean | Si MP está habilitado |
| `mercadoPagoEnvironment` | String? | `sandbox` o `production` |

### Qué configura cada rol

| Configuración | Quién la hace | Cuándo |
|---|---|---|
| Nombre, slug, plan, expiración, MP | Super Admin | Al crear/editar tenant |
| Bootstrap (canchas + settings + productos + admin) | Super Admin | Después de crear el tenant |
| Horarios y precios de canchas | Admin del tenant | Después del bootstrap, desde su panel |
| Activar tenant (`isActive: true`) | Super Admin | Cuando todo está listo |

### System settings por tenant

Creados por el bootstrap (idempotentes por constraint `@@unique([key, tenantId])`):

| Key | Valor por defecto | Categoría | Público |
|-----|-------------------|-----------|---------|
| `operating_hours_start` | `08:00` | booking | Sí |
| `operating_hours_end` | `23:00` | booking | Sí |
| `default_slot_duration` | `90` (minutos) | booking | Sí |
| `booking_expiration_minutes` | `15` (minutos) | payments | No |
| `home_card_settings` | JSON con nombre del club, texto descriptivo | ui | Sí |

**Nota:** Si un tenant no tiene system settings propios, la app usa valores por defecto (08:00, 23:00, 90 min). Ver `lib/services/system-settings.ts`.

---

## Planes de suscripción

### Definición de planes

Definidos en `lib/subscription-plans.ts`:

| Plan | ID | Canchas máximas | Canchas por defecto (bootstrap) | Descripción |
|------|-----|-----------------|--------------------------------|-------------|
| **Básico** | `BASIC` | 3 | 3 | Plan inicial; hasta 3 canchas habilitadas |
| **Intermedio** | `MEDIUM` | 6 | 6 | Hasta 6 canchas habilitadas |
| **Premium** | `PREMIUM` | Sin límite | 9 | Sin límite de canchas; 9 por defecto |

### Reglas de negocio

- El **límite** es la cantidad máxima de canchas que puede tener el tenant (contando las que tienen `deletedAt: null`, es decir, todas las no eliminadas).
- Si un tenant tiene **menos canchas** que su límite, no pasa nada; no se obliga a tener exactamente N canchas.
- Al **crear una cancha** (solo Super Admin puede hacerlo), `createCourt` en `lib/services/courts.ts` valida que no se exceda el límite del plan. Si se excede, devuelve error: *"El Plan Básico permite hasta 3 canchas. Actualiza el plan del tenant para agregar más."*
- Al **cambiar de plan** a uno más restrictivo, no se eliminan canchas automáticamente. El Super Admin decide qué hacer si el tenant tiene más canchas que el nuevo máximo.
- El **bootstrap** crea `defaultCourts` canchas del plan asignado al tenant.

### Funciones helper

```typescript
import { getPlanMaxCourts, getPlanDefaultCourts, getPlan, getAllPlans } from '@/lib/subscription-plans'

getPlanMaxCourts('BASIC')     // 3
getPlanMaxCourts('MEDIUM')    // 6
getPlanMaxCourts('PREMIUM')   // null (sin límite)
getPlanMaxCourts(null)        // 3 (fallback a BASIC)

getPlanDefaultCourts('PREMIUM') // 9
getPlan('MEDIUM')               // { id: 'MEDIUM', name: 'Plan Intermedio', ... }
getAllPlans()                    // Array con los 3 planes
```

---

## Protección de tenant inactivo

### Problema resuelto

Antes de estos cambios, `isActive: false` solo impedía que el tenant apareciera en la landing pública (`getAllActiveTenants` en `lib/services/tenants.ts` filtra por `isActive: true`). **Pero las reservas se podían crear igualmente** si se conocía el ID de la cancha, y los slots se devolvían normalmente.

### Solución implementada

Se verifica `tenant.isActive` en los siguientes endpoints (excepto para Super Admin):

| Endpoint | Verificación | Mensaje de error |
|----------|-------------|------------------|
| `POST /api/bookings` | Después de resolver `tenantIdForBooking`, consulta si `tenant.isActive === true` | "Este club no está habilitado para reservas todavía" (400) |
| `GET /api/slots` | Después de obtener el `tenantId` del court | "Este club no está habilitado todavía" (400) |
| `GET /api/bookings/availability` | En la validación de la cancha | "Este club no está habilitado todavía" (400) |
| `POST /api/bookings/availability` | En la validación de la cancha | "Este club no está habilitado todavía" (400) |

El **Super Admin** puede operar sobre tenants inactivos (las verificaciones solo aplican si `!isSuperAdmin`).

### Flujo de visibilidad

```
isActive: false → No aparece en landing, no devuelve slots, no acepta reservas
isActive: true  → Aparece en landing, devuelve slots, acepta reservas
```

---

## Qué debe brindar el cliente

### Checklist para alta de un club

```
OBLIGATORIOS
[ ] Nombre del club (ej. "Club de Padel Central")
[ ] Slug único (ej. "club-central") — solo letras minúsculas, números y guiones
[ ] Email del administrador del club (se usará como admin del tenant)

PLAN
[ ] Plan elegido: Básico (hasta 3 canchas) / Intermedio (hasta 6) / Premium (sin límite)
[ ] Fecha de vencimiento de la suscripción (opcional, para renovaciones)

MERCADO PAGO (si el club cobra online)
[ ] Access Token de Mercado Pago
[ ] Public Key de Mercado Pago
[ ] Webhook Secret de Mercado Pago (recomendado)
[ ] Ambiente: sandbox (pruebas) o production

POST-BOOTSTRAP (el admin del tenant configura)
[ ] Horarios de cada cancha (inicio, fin, duración de turno)
[ ] Precios de cada cancha
[ ] Personalización del home card (nombre, descripción, logo)
```

### Dónde obtiene el cliente las credenciales de MP

En el [panel de desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers):
- Crear o seleccionar una **aplicación**.
- Obtener **Access Token** (producción o testing según ambiente).
- Obtener **Public Key**.
- Configurar la **URL de notificaciones** (webhook) apuntando a `https://tu-dominio.com/api/webhooks/payments`.
- Copiar el **Webhook Secret** desde la configuración del webhook.

---

## Panel Super Admin

### Funcionalidades actuales en UI

| Funcionalidad | Ruta | Estado |
|---|---|---|
| Listar tenants (con stats de usuarios, canchas, reservas) | `/super-admin` | Implementado |
| Crear tenant (nombre, slug, plan, MP, isActive) | `/super-admin/tenants/new` | Implementado |
| Editar tenant | `/super-admin/tenants/[id]` | Implementado |
| Selector de plan (Básico/Intermedio/Premium) | En formulario del tenant | Implementado |
| Credenciales MP (con toggle show/hide) | En formulario del tenant | Implementado |
| Advertencia de tenant inactivo | En formulario del tenant | Implementado |

### Funcionalidades pendientes para Super Admin UI

Las APIs backend ya existen; solo falta la UI:

| Funcionalidad | API existente | Prioridad |
|---|---|---|
| Botón "Bootstrap" en detalle del tenant | `POST /api/tenants/bootstrap` | Alta |
| Sección "Admins" en detalle del tenant | `GET/POST /api/admin` con `tenantId` | Alta |
| Sección "Canchas" en detalle del tenant | `GET/POST/DELETE /api/courts` con `tenantId` | Media |
| Sección "Configuración" (system settings) | `GET/POST /api/system-settings` con `tenantId` | Media |
| Sección "Productos" en detalle del tenant | `GET/POST /api/productos` con `tenantId` | Baja |

---

## Flujo completo de alta de un tenant

```
1. CREACIÓN (Super Admin)
   └─ /super-admin/tenants/new
      ├─ Nombre, slug, plan (BASIC por defecto)
      ├─ Credenciales MP si las tiene
      └─ Tenant se crea con isActive: false
         ├─ NO aparece en la landing pública
         ├─ NO devuelve slots disponibles
         └─ NO acepta reservas

2. BOOTSTRAP (Super Admin)
   └─ POST /api/tenants/bootstrap (o botón futuro en UI)
      ├─ Crea AdminWhitelist para el email del owner
      ├─ Crea canchas según plan (3/6/9)
      ├─ Crea system settings mínimos
      ├─ Crea productos iniciales
      └─ Configura MP si hay credenciales

3. CONFIGURACIÓN (Admin del tenant)
   └─ Inicia sesión con el email registrado en AdminWhitelist
      ├─ Configura horarios de cada cancha
      ├─ Configura precios de cada cancha
      ├─ Personaliza home card
      └─ Ajusta duración de turnos y expiración de reservas

4. ACTIVACIÓN (Super Admin)
   └─ /super-admin/tenants/[id] → switch isActive: true
      ├─ El club aparece en la landing pública
      ├─ Los slots se muestran a los usuarios
      └─ Se pueden crear reservas

5. OPERACIÓN
   └─ Usuarios reservan turnos
      ├─ Reserva PENDING → slot bloqueado 15 min (configurable)
      ├─ Si paga → CONFIRMED
      ├─ Si no paga a tiempo → job cancela automáticamente (CANCELLED)
      └─ Si cobra con MP: webhook actualiza estado y crea Payment
```

---

## Mercado Pago por tenant

### Resolución de credenciales (orden de prioridad)

1. **Credenciales del tenant** en BD (si `mercadoPagoEnabled: true` y `mercadoPagoAccessToken` configurado).
2. **Variables de entorno globales** (`MERCADOPAGO_ACCESS_TOKEN`, etc.).
3. **Mock provider** (solo desarrollo, si no hay credenciales).

### Encriptación

- Las credenciales se encriptan con AES-256-GCM antes de guardar en BD.
- Se desencriptan solo en el backend cuando se procesan pagos.
- Requiere `CREDENTIAL_ENCRYPTION_KEY` (32 bytes hex, 64 caracteres).
- Si falta la clave de encriptación, el bootstrap guarda las credenciales en claro (tolerable en desarrollo).
- Cache de credenciales en memoria con TTL de 5 minutos (`lib/services/payments/tenant-credentials.ts`).

### Estado actual del flujo de pago

| Componente | Estado |
|------------|--------|
| Proveedor MP (preferencia, initPoint) | Implementado |
| API `POST /api/bookings/[id]/payment-preference` | Implementado |
| Webhook `POST /api/webhooks/payments` | Implementado |
| Reembolsos (`MercadoPagoRefundService`) | Implementado |
| **UI "Pagar" (botón que redirija a initPoint)** | **Pendiente** |
| **Páginas de retorno (/reservas/exito, /error, /pendiente)** | **Pendiente** |
| Configuración webhook en panel de MP | Configuración manual del cliente |

Referencia completa: `docs/actualizaciones/sistema-pago-mercadopago-estado-2026-03.md`.

---

## Permisos y roles sobre canchas

La estructura de canchas queda bajo control exclusivo del Super Admin:

| Acción | Super Admin | Admin del tenant |
|--------|-------------|-----------------|
| **Crear cancha** (Nueva Cancha) | Sí (validando límite del plan) | No |
| **Eliminar cancha** (soft delete) | Sí | No |
| **Activar/Desactivar** (switch) | Sí | No |
| **Editar** (nombre, precio, horarios, descripción) | Sí | Sí |

La eliminación es soft delete (`deletedAt` + `isActive: false`). Las canchas eliminadas no aparecen en listados (filtro `deletedAt: null`).

Referencia: `docs/actualizaciones/permisos-canchas-superadmin-2026-02.md`.

---

## Reservas y expiración

Los turnos pendientes (PENDING) tienen un bloqueo temporal:

| Concepto | Valor |
|----------|-------|
| Estado inicial al reservar | `PENDING` |
| Tiempo de expiración | Configurable por tenant (`booking_expiration_minutes`), default 15 min |
| Campo `expiresAt` | Se setea al crear la reserva; se limpia (`null`) al confirmar pago |
| Job de cancelación | `POST /api/jobs/cancel-expired-bookings` cancela reservas expiradas |
| Slot bloqueado | Mientras la reserva sea PENDING y no expirada, el slot no está disponible |
| Reserva creada por admin | Se crea como `CONFIRMED` directamente (sin pasar por PENDING) |

Referencia: `docs/admin/turnos-pendientes-bloqueo-temporal-y-expiracion.md`.

---

## Variables de entorno relevantes

### Obligatorias para multitenancy

```bash
DATABASE_URL=postgresql://...
SUPER_ADMIN_EMAILS=email1@gmail.com,email2@empresa.com
```

### Para encriptación de credenciales MP

```bash
# 32 bytes hex (64 caracteres). Generar con:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CREDENTIAL_ENCRYPTION_KEY=tu_clave_hexadecimal_de_64_caracteres
```

### Para Mercado Pago global (fallback si el tenant no tiene credenciales propias)

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret
MERCADOPAGO_PUBLIC_KEY=tu_public_key          # opcional
MERCADOPAGO_ENVIRONMENT=sandbox               # sandbox | production
```

### Autenticación

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=clave_secreta_minimo_32_caracteres
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

Referencia completa: `docs/deployment/VARIABLES_ENTORNO.md`.

---

## Archivos involucrados

### Creados en esta implementación

| Archivo | Propósito |
|---------|-----------|
| `lib/subscription-plans.ts` | Constantes de planes (BASIC, MEDIUM, PREMIUM) y funciones helper |
| `docs/multitenant/ALTA_TENANT_PLANES_CONFIGURACION.md` | Este documento |

### Modificados en esta implementación

| Archivo | Cambio |
|---------|--------|
| `lib/services/tenants/bootstrap.ts` | `isActive: false`, `subscriptionPlan: 'BASIC'`, canchas dinámicas según plan |
| `lib/services/courts.ts` → `createCourt` | Validar límite de canchas por plan antes de crear |
| `app/api/bookings/route.ts` | Verificar `tenant.isActive` antes de crear reserva |
| `app/api/slots/route.ts` | Verificar `tenant.isActive` antes de devolver slots |
| `app/api/bookings/availability/route.ts` | Verificar `tenant.isActive` en GET y POST |
| `app/super-admin/tenants/[id]/page.tsx` | Selector de plan (Select), `isActive: false` por defecto, advertencia visual |

### Archivos de referencia (no modificados)

| Archivo | Rol |
|---------|-----|
| `prisma/schema.prisma` | Modelo Tenant con `subscriptionPlan`, `isActive`, credenciales MP |
| `lib/services/tenants.ts` | `getAllActiveTenants` (filtra `isActive: true`), `HIDDEN_TEST_TENANT_SLUG` |
| `lib/utils/permissions.ts` | `isSuperAdminUser`, `canAccessTenant`, `getUserTenantIdSafe` |
| `lib/encryption/credential-encryption.ts` | `encryptCredential`, `decryptCredential` (AES-256-GCM) |
| `lib/services/payments/PaymentProviderFactory.ts` | Resolución de proveedor de pago por tenant |
| `lib/services/payments/tenant-credentials.ts` | Credenciales MP por tenant con cache |
| `app/api/tenants/route.ts` | GET/POST tenants (Super Admin) |
| `app/api/tenants/[id]/route.ts` | GET/PUT tenant individual (Super Admin) |
| `app/api/tenants/bootstrap/route.ts` | POST bootstrap (Super Admin) |
| `app/api/admin/route.ts` | GET/POST admins por tenant |
| `app/api/courts/route.ts` | CRUD canchas (create/delete solo Super Admin) |
| `middleware.ts` | Rutas públicas vs protegidas, redirección por rol |
| `scripts/bootstrap-tenant.js` | Script standalone de bootstrap (sin Next.js) |

---

## Decisiones de diseño

| Tema | Decisión | Razón |
|------|----------|-------|
| Tenant inactivo al crear | `isActive: false` por defecto | Evitar reservas antes de configurar completamente |
| Validación de `isActive` en endpoints | En bookings, slots y availability | Triple barrera: landing (ya filtraba) + slots + reservas |
| Super Admin bypass `isActive` | Sí, Super Admin opera sin restricción | Para poder gestionar y probar tenants inactivos |
| Conteo de canchas para plan | `deletedAt: null` (todas las no eliminadas) | Refleja las canchas reales del tenant, no solo las activas |
| Eliminación de canchas | Soft delete (`deletedAt` + `isActive: false`) | Las canchas eliminadas dejan de aparecer pero no se pierden datos |
| Asignación de plan | Manual por Super Admin (selector en UI) | El plan se elige según contrato comercial |
| Plan por defecto | BASIC al crear/bootstrap | Conservador: empieza con el plan más restrictivo |
| Precios de los planes | Constantes en código (`subscription-plans.ts`) | Simple y centralizado; se puede migrar a BD si se necesita facturación |
| Cambio de plan hacia abajo | Sin bloqueo automático | El Super Admin decide qué hacer con las canchas extra |
| Horarios de canchas | Los configura el admin del tenant post-bootstrap | Cada club tiene horarios diferentes; el bootstrap pone un default genérico |
| Bootstrap idempotente | Sí, se puede correr múltiples veces | No duplica datos si el tenant ya existe |
| Credenciales MP | Encriptadas en BD, desencriptadas solo en backend | Seguridad: nunca se exponen en frontend ni en respuestas de API |

---

## Troubleshooting

### El Super Admin no puede acceder a `/super-admin`

1. Verificar que el email está en `SUPER_ADMIN_EMAILS`.
2. En Vercel: verificar que se hizo **redeploy** después de configurar la variable.
3. **Cerrar sesión y volver a iniciar**: el rol se guarda en el JWT al login.
4. Referencia: `docs/actualizaciones/superadmin-vercel-2026-02.md`.

### Error "El Plan Básico permite hasta 3 canchas"

El tenant tiene plan BASIC y ya tiene 3 canchas (con `deletedAt: null`). Opciones:
- Cambiar el plan del tenant a MEDIUM o PREMIUM en `/super-admin/tenants/[id]`.
- Eliminar una cancha existente (soft delete) antes de crear otra.

### Error "Este club no está habilitado para reservas todavía"

El tenant tiene `isActive: false`. Para activarlo:
- Ir a `/super-admin/tenants/[id]` → activar el switch "Tenant activo".
- Verificar que la configuración esté completa (canchas, horarios, precios).

### Error "El slug ya está en uso"

Cada tenant debe tener un slug único. Elegir otro slug o verificar si ya existe un tenant con ese slug.

### Credenciales de Mercado Pago no funcionan

1. Verificar que `CREDENTIAL_ENCRYPTION_KEY` está configurada.
2. Verificar que las credenciales son del ambiente correcto (sandbox vs production).
3. Revisar logs: si dice "credenciales globales" cuando debería usar las del tenant, verificar `mercadoPagoEnabled: true` y que `mercadoPagoAccessToken` está configurado en el tenant.
4. En producción: verificar que la URL del webhook está configurada en el panel de MP.

### El tenant no aparece en la landing

- Verificar `isActive: true`.
- Verificar que el slug no sea `tenant-de-prueba` (oculto por `HIDDEN_TEST_TENANT_SLUG`).
- La landing usa `/api/tenants/public` que filtra por `isActive: true` y excluye el tenant de prueba.

---

## Documentación relacionada

- [Arquitectura Multitenant](./MULTITENANT_COMPLETE.md) — Guía completa del sistema multitenant
- [Bootstrap Tenant y Pagos](./BOOTSTRAP_TENANT_Y_PAGOS.md) — Detalles del bootstrap
- [Rollback Multitenant](./ROLLBACK_MULTITENANT.md) — Proceso de rollback
- [Revisión APIs Multitenant](./REVISION_APIS_MULTITENANT.md) — 25+ endpoints actualizados
- [Revisión Panel Super Admin](./REVISION_SUPER_ADMIN_PANEL.md) — Estado del panel
- [Permisos Canchas Super Admin](../actualizaciones/permisos-canchas-superadmin-2026-02.md) — Solo Super Admin crea/elimina canchas
- [Estado Mercado Pago](../actualizaciones/sistema-pago-mercadopago-estado-2026-03.md) — Qué está implementado y qué falta
- [Turnos Pendientes y Expiración](../admin/turnos-pendientes-bloqueo-temporal-y-expiracion.md) — Bloqueo temporal de slots
- [Super Admin en Vercel](../actualizaciones/superadmin-vercel-2026-02.md) — Configuración de rol en producción
- [Variables de Entorno](../deployment/VARIABLES_ENTORNO.md) — Todas las variables del sistema
