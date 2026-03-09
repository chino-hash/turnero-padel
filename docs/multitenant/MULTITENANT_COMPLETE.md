# Documentación Completa - Arquitectura Multitenant

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Estrategia de Implementación](#estrategia-de-implementación)
4. [Modelo de Datos](#modelo-de-datos)
5. [Gestión de Roles y Permisos](#gestión-de-roles-y-permisos)
6. [APIs y Servicios](#apis-y-servicios)
7. [Migración](#migración)
8. [Rollback](#rollback)
9. [Testing](#testing)
10. [Operación y Mantenimiento](#operación-y-mantenimiento)
11. [Mejores Prácticas](#mejores-prácticas)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Este documento describe la arquitectura multitenant implementada en el sistema Turnero de Padel. La arquitectura multitenant permite que múltiples clientes (tenants) compartan la misma instancia de la aplicación mientras mantienen el aislamiento completo de sus datos.

### Conceptos Clave

- **Tenant**: Un cliente independiente con sus propios datos, usuarios, canchas, reservas, y configuraciones
- **Super Admin**: Usuario con permisos para gestionar todos los tenants
- **Admin de Tenant**: Usuario administrador que gestiona un tenant específico
- **User**: Usuario regular que pertenece a un tenant específico

### Beneficios

- ✅ Aislamiento completo de datos entre tenants
- ✅ Escalabilidad horizontal
- ✅ Mantenimiento simplificado (una sola instancia)
- ✅ Costos reducidos de infraestructura
- ✅ Actualizaciones centralizadas

---

## 🏗️ Arquitectura

### Estrategia: Shared Database + Shared Schema

Se implementó la estrategia **"Shared Database + Shared Schema"**, donde:

- **Una sola base de datos PostgreSQL** (Neon)
- **Un schema compartido** con columna `tenantId` en todas las tablas relevantes
- **Filtrado por `tenantId`** en todas las queries
- **Validación de permisos** en cada operación

### Ventajas de esta Estrategia

1. **Simplicidad**: Un solo schema, migraciones más simples
2. **Rendimiento**: Consultas eficientes con índices en `tenantId`
3. **Costos**: Una sola base de datos
4. **Mantenibilidad**: Una sola versión del código

### Desventajas y Mitigaciones

- **Riesgo de fuga de datos**: Mitigado con validación estricta de permisos
- **Escalabilidad de datos**: Mitigado con particionado futuro si es necesario
- **Complejidad en queries**: Mitigado con helpers y servicios centralizados

---

## 📊 Modelo de Datos

### Tabla Tenant

```prisma
model Tenant {
  id                    String    @id @default(cuid())
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  name                  String
  slug                  String    @unique
  isActive              Boolean   @default(true)
  subscriptionPlan      String?
  subscriptionExpiresAt DateTime?
  settings              String    @default("{}")
  
  // Credenciales de Mercado Pago (encriptadas)
  mercadoPagoAccessToken   String? @db.Text
  mercadoPagoPublicKey     String? @db.Text
  mercadoPagoWebhookSecret String? @db.Text
  mercadoPagoEnabled       Boolean @default(false)
  mercadoPagoEnvironment   String? @default("sandbox")
  
  // Relaciones
  users             User[]
  courts            Court[]
  bookings          Booking[]
  payments          Payment[]
  recurringBookings RecurringBooking[]
  products          Producto[]
  systemSettings    SystemSetting[]
  admins            AdminWhitelist[]
}
```

### Tablas con tenantId

Las siguientes tablas incluyen `tenantId` como campo requerido:

- `User` - Usuarios del sistema
- `Court` - Canchas
- `Booking` - Reservas
- `Payment` - Pagos
- `SystemSetting` - Configuraciones del sistema
- `Producto` - Productos
- `RecurringBooking` - Reservas recurrentes
- `RecurringBookingException` - Excepciones de reservas recurrentes
- `AdminWhitelist` - Lista de administradores por tenant

### Índices y Constraints

- **Índice único compuesto**: `User.email + tenantId` (permite mismo email en diferentes tenants)
- **Índice único compuesto**: `SystemSetting.key + tenantId` (permite misma key en diferentes tenants)
- **Índices en tenantId**: Todas las tablas tienen índice en `tenantId` para queries eficientes
- **Foreign Keys**: Todas las tablas con `tenantId` tienen FK hacia `Tenant.id`

---

## 🔐 Gestión de Roles y Permisos

### Roles Disponibles

1. **SUPER_ADMIN**
   - Gestiona todos los tenants
   - Crea, edita y elimina tenants
   - Gestiona admins de cualquier tenant
   - Acceso completo al sistema

2. **ADMIN** (Admin de Tenant)
   - Gestiona solo su tenant asignado
   - Gestiona admins de su tenant
   - Acceso a datos de su tenant únicamente

3. **USER**
   - Usuario regular de un tenant
   - Acceso limitado a sus propios datos
   - Sin permisos administrativos

### Sistema de Permisos

#### Helpers de Permisos (`lib/utils/permissions.ts`)

```typescript
// Verificar si es super admin
isSuperAdminUser(user: User): Promise<boolean>

// Verificar acceso a tenant
canAccessTenant(user: User, tenantId: string): Promise<boolean>

// Verificar si puede gestionar admins
canManageAdmins(user: User, tenantId?: string): Promise<boolean>

// Obtener lista de tenants accesibles
getAccessibleTenants(user: User): Promise<string[]>

// Obtener tenantId del usuario (seguro)
getUserTenantIdSafe(user: User): Promise<string | null>
```

#### Validación en APIs

Todas las APIs validan permisos antes de ejecutar operaciones:

```typescript
// Ejemplo: API de courts
const session = await auth()
const user = session?.user
const isSuperAdmin = await isSuperAdminUser(user)
const userTenantId = await getUserTenantIdSafe(user)

// Super admin ve todos, admin/user solo su tenant
const courts = await getCourts(isSuperAdmin ? undefined : userTenantId)
```

---

## 🔌 APIs y Servicios

### APIs Actualizadas (27+ endpoints)

Todas las APIs críticas han sido actualizadas para soportar multitenancy:

#### Bookings APIs
- `/api/bookings` - GET, POST
- `/api/bookings/[id]` - GET, PUT, DELETE
- `/api/bookings/stats` - GET, POST
- `/api/bookings/user` - GET
- `/api/bookings/[id]/close` - POST
- `/api/bookings/availability` - GET, POST
- `/api/bookings/bulk` - PATCH, DELETE
- `/api/bookings/[id]/extras` - GET, POST
- `/api/bookings/[id]/extras/[extraId]` - DELETE
- `/api/bookings/[id]/players/[playerId]/payment` - PATCH
- `/api/bookings/[id]/players/position/[position]/payment` - PATCH

#### Courts APIs
- `/api/courts` - GET, POST, PUT

#### Productos APIs
- `/api/productos` - GET, POST, PUT, DELETE

#### Recurring Bookings APIs
- `/api/recurring-bookings` - POST
- `/api/recurring-exceptions` - POST
- `/api/recurring-exceptions/[id]` - DELETE

#### System Settings APIs
- `/api/system-settings/public/by-key` - GET
- `/api/system-settings/upsert` - POST

#### Admin APIs
- `/api/admin` - GET, POST
- `/api/crud/[...params]` - GET, POST, PUT, DELETE
- `/api/crud/stats` - GET
- `/api/crud/transaction` - POST

#### Tenants APIs (Super Admin)
- `/api/tenants` - GET, POST
- `/api/tenants/[id]` - GET, PUT

#### Jobs APIs
- `/api/jobs/cancel-expired-bookings` - GET, POST

#### Slots API
- `/api/slots` - GET

### Servicios Actualizados

- `BookingService` - Filtrado por `tenantId`
- `CourtService` - Filtrado por `tenantId`
- `CrudService` - Soporte multitenant integrado
- `ExpiredBookingsService` - Procesa por tenant
- `BookingRepository` - Filtrado por `tenantId`
- `AvailabilityService` - Filtrado por `tenantId`

---

## 🔄 Migración

### Proceso de Migración

La migración a multitenant se realizó en los siguientes pasos:

1. **Actualización del Schema Prisma**
   - Agregar modelo `Tenant`
   - Agregar campo `tenantId` a todas las tablas relevantes
   - Agregar rol `SUPER_ADMIN` al enum `Role`
   - Actualizar índices y constraints

2. **Migración de Base de Datos**
   - Ejecutar migración de Prisma
   - Ejecutar script de migración de datos (`scripts/migrate-to-multitenant.ts`)

3. **Actualización del Código**
   - Actualizar servicios para filtrar por `tenantId`
   - Actualizar APIs para validar permisos
   - Actualizar autenticación para incluir `tenantId` en sesión
   - Crear helpers de permisos

4. **Actualización del Frontend**
   - Actualizar hooks para detectar roles
   - Actualizar componentes para mostrar/ocultar funciones según rol
   - Crear panel de super admin

### Script de Migración de Datos

```bash
# Ejecutar script de migración
npx tsx scripts/migrate-to-multitenant.ts
```

El script:
- Crea un tenant por defecto (`default`)
- Asigna todos los registros existentes al tenant por defecto
- Migra administradores a la nueva estructura
- Genera un reporte detallado

Para más detalles, ver: `docs/ROLLBACK_MULTITENANT.md`

---

## ⏪ Rollback

### Proceso de Rollback

Si es necesario revertir la migración multitenant:

1. **Hacer backup completo de la base de datos**
   ```bash
   pg_dump -h <host> -U <user> -d <database> > backup_pre_rollback.sql
   ```

2. **Ejecutar script de rollback**
   ```bash
   # Modo dry-run (recomendado primero)
   npx tsx scripts/rollback-multitenant.ts --dry-run
   
   # Ejecutar rollback real
   npx tsx scripts/rollback-multitenant.ts --confirm
   ```

3. **Regenerar Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Revertir cambios en código**
   - Revertir cambios en `prisma/schema.prisma`
   - Revertir cambios en APIs y servicios
   - Eliminar panel de super admin

**⚠️ IMPORTANTE**: El rollback es irreversible sin backup. Ver documentación completa en `docs/ROLLBACK_MULTITENANT.md`

---

## 🧪 Testing

### Tests Implementados

#### Tests de Aislamiento (`__tests__/integration/multitenant-isolation.test.ts`)
- Verificación de aislamiento de datos por tenant
- Validación de que usuarios no pueden acceder a datos de otros tenants
- Verificación de que super admin puede acceder a todos los datos

#### Tests de Permisos (`__tests__/integration/multitenant-permissions.test.ts`)
- Verificación de permisos de gestión de tenants
- Verificación de permisos de gestión de admins
- Validación de helpers de permisos

#### Tests de Jobs (`__tests__/integration/multitenant-jobs.test.ts`)
- Verificación de jobs por tenant
- Validación de permisos para ejecutar jobs
- Verificación de filtrado por tenantId

### Ejecutar Tests

```bash
# Todos los tests
npm run test

# Tests de integración multitenant
npm run test:integration

# Tests específicos
npm test __tests__/integration/multitenant-isolation.test.ts
npm test __tests__/integration/multitenant-permissions.test.ts
npm test __tests__/integration/multitenant-jobs.test.ts
```

---

## 🔧 Operación y Mantenimiento

### Crear un Nuevo Tenant

Solo Super Admins pueden crear tenants:

1. Acceder al panel de Super Admin: `/super-admin`
2. Click en "Nuevo Tenant"
3. Completar formulario:
   - Nombre del tenant
   - Slug (único, solo letras minúsculas, números y guiones)
   - Estado activo/inactivo
   - Credenciales de Mercado Pago (opcional, se encriptan automáticamente)
4. Guardar

### Gestionar Admins por Tenant

#### Super Admin
- Puede agregar admins a cualquier tenant
- Puede ver lista de admins de todos los tenants

#### Admin de Tenant
- Puede agregar admins a su propio tenant
- Puede ver lista de admins de su tenant
- NO puede agregar admins a otros tenants

### Variables de Entorno

```env
# Super Admins (emails separados por comas)
SUPER_ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Clave de encriptación para credenciales de Mercado Pago
CREDENTIAL_ENCRYPTION_KEY=tu-clave-secreta-de-32-caracteres-minimo

# Base de datos (Neon PostgreSQL)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Encriptación de Credenciales

Las credenciales de Mercado Pago se encriptan automáticamente usando AES-256-GCM:

- Al crear/actualizar tenant con credenciales MP
- Se encriptan antes de guardar en la BD
- Se desencriptan cuando se necesitan para hacer pagos

**⚠️ IMPORTANTE**: Nunca desencriptar credenciales en el frontend. Solo se desencriptan en el backend cuando se procesan pagos.

---

## ✅ Mejores Prácticas

### Desarrollo

1. **Siempre filtrar por tenantId**
   ```typescript
   // ✅ Correcto
   const courts = await prisma.court.findMany({
     where: { tenantId: userTenantId, isActive: true }
   })
   
   // ❌ Incorrecto (falta tenantId)
   const courts = await prisma.court.findMany({
     where: { isActive: true }
   })
   ```

2. **Validar permisos antes de operaciones**
   ```typescript
   // ✅ Correcto
   const canAccess = await canAccessTenant(user, tenantId)
   if (!canAccess) {
     return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
   }
   ```

3. **Usar helpers de permisos**
   ```typescript
   // ✅ Correcto
   const isSuperAdmin = await isSuperAdminUser(user)
   const userTenantId = await getUserTenantIdSafe(user)
   
   // ❌ Incorrecto (validación manual)
   if (user.role === 'SUPER_ADMIN') { ... }
   ```

4. **Nunca confiar en el cliente**
   - Validar `tenantId` en el backend
   - No confiar en headers del cliente
   - Validar permisos en cada request

### Seguridad

1. **Encriptar datos sensibles**
   - Credenciales de Mercado Pago se encriptan
   - Nunca exponer credenciales en logs o respuestas de API

2. **Validar cross-tenant access**
   - Verificar que usuarios no puedan acceder a datos de otros tenants
   - Validar `tenantId` en cada operación

3. **Auditar operaciones**
   - Loggear operaciones críticas
   - Incluir `tenantId` en logs para trazabilidad

### Performance

1. **Índices en tenantId**
   - Todas las tablas tienen índice en `tenantId`
   - Queries eficientes con filtrado por tenant

2. **Cache cuando sea apropiado**
   - Cache de configuraciones del sistema por tenant
   - Invalidate cache cuando se actualicen configuraciones

---

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. Error: "tenantId is required"

**Causa**: Un registro no tiene `tenantId` asignado.

**Solución**: Ejecutar script de migración de datos:
```bash
npx tsx scripts/migrate-to-multitenant.ts
```

#### 2. Error: "No autorizado para acceder a este tenant"

**Causa**: Usuario intenta acceder a datos de otro tenant.

**Solución**: Verificar permisos y `tenantId` del usuario. Si es super admin, verificar que `isSuperAdmin` esté configurado correctamente.

#### 3. Error: "Constraint violation: User_email_tenantId_key"

**Causa**: Intentando crear un usuario con un email que ya existe en el mismo tenant.

**Solución**: El email debe ser único por tenant. Verificar que el email no exista en el tenant.

#### 4. Credenciales de Mercado Pago no funcionan

**Causa**: Las credenciales pueden estar mal encriptadas o no se están desencriptando correctamente.

**Solución**:
- Verificar que `CREDENTIAL_ENCRYPTION_KEY` esté configurada
- Verificar que las credenciales estén correctamente encriptadas
- Revisar logs de error en el proceso de pago

#### 5. Super Admin no puede acceder al panel

**Causa**: El email del usuario no está en `SUPER_ADMIN_EMAILS`.

**Solución**: Agregar el email a la variable de entorno:
```env
SUPER_ADMIN_EMAILS=tu-email@example.com
```

---

## 📚 Referencias

### Documentación Relacionada

- `docs/ROLLBACK_MULTITENANT.md` - Guía completa de rollback
- `docs/REVISION_APIS_MULTITENANT.md` - Revisión de APIs actualizadas
- `docs/REVISION_SUPER_ADMIN_PANEL.md` - Revisión del panel de super admin

### Archivos Importantes

- `prisma/schema.prisma` - Schema de base de datos
- `lib/utils/permissions.ts` - Helpers de permisos
- `lib/admin-system.ts` - Sistema de administración
- `lib/encryption/credential-encryption.ts` - Encriptación de credenciales
- `scripts/migrate-to-multitenant.ts` - Script de migración
- `scripts/rollback-multitenant.ts` - Script de rollback

### APIs Clave

- `/api/tenants` - Gestión de tenants (Super Admin)
- `/api/admin` - Gestión de admins
- `/api/courts` - Gestión de canchas (filtrado por tenant)
- `/api/bookings` - Gestión de reservas (filtrado por tenant)

---

## 📝 Notas Adicionales

### Limitaciones Conocidas

1. **Eliminación de Tenants**: Actualmente no está permitida por seguridad. Se recomienda desactivar el tenant en su lugar.

2. **Migración de Datos entre Tenants**: No está soportada actualmente. Requeriría implementación adicional.

3. **Particionado de Datos**: Actualmente no está implementado. Para tenants muy grandes, considerar particionado futuro.

### Mejoras Futuras

1. **Gestión de Admins en UI**: Actualmente se gestiona via API. Podría agregarse interfaz en el panel de super admin.

2. **Métricas por Tenant**: Dashboard con métricas agregadas por tenant.

3. **Backup por Tenant**: Capacidad de hacer backup/restore de datos por tenant individual.

4. **Particionado Automático**: Particionado de tablas grandes por tenantId para mejor performance.

---

**Última actualización**: 2025-01-XX  
**Versión**: 1.0.0


