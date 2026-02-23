---
name: turnero-padel-multitenant
description: Enforces multitenant isolation rules for Turnero de Padel. All data must be scoped by tenantId; slug identifies tenant in URLs. Use when creating or modifying API routes, database queries, services, or any code that accesses Tenant, Court, Booking, or User data.
---

# Turnero Padel - Multitenant Rules

## Golden Rule

**Todas las queries que tocan datos de Tenant, Court, Booking, User, Payment, etc. deben filtrar por `tenantId`**, salvo que el usuario sea super-admin y se permita explícitamente acceso cross-tenant.

## Tenant Resolution

- **URL**: `/club/[slug]` – el slug identifica el tenant en rutas de club.
- **Session**: `user.tenantId` – tenant activo del usuario.
- **API**: Obtener `tenantId` de la sesión o de la URL antes de cualquier query. Endpoint `/api/auth/set-tenant-slug` para fijar el tenant activo.

## Permissions

| Rol | Acceso |
|-----|--------|
| Super Admin | Todos los tenants. Puede omitir filtro por tenant cuando la lógica lo requiera. |
| Admin | Solo su tenant. Siempre filtrar por `user.tenantId`. |
| User | Solo su tenant y sus propios datos (ej. sus reservas). |

Helpers centralizados: `lib/utils/permissions.ts`

- `isSuperAdminUser(user)` – si es super admin
- `canAccessTenant(user, tenantId)` – si puede acceder al tenant
- `canManageAdmins(user, tenantId)` – si puede gestionar admins
- `getUserTenantIdSafe(user)` – tenantId del usuario

## API Routes

1. Obtener `tenantId` válido (session o parámetro según endpoint).
2. Si no es super-admin, validar `canAccessTenant(user, tenantId)` antes de proceder.
3. Incluir `where: { tenantId }` en todas las queries Prisma sobre datos del tenant.

## Public vs Protected Routes

Definido en `middleware.ts`:

- **Públicas**: `/`, `/login`, `/club/*`, `/api/courts`, `/api/slots`, `/api/tenants/public`, `/api/webhooks/payments`, `/api/system-settings/public`.
- **Protegidas**: `/dashboard`, `/admin-panel/*`, resto de `/api/*`.

## Documentación completa

Ver `docs/MULTITENANT_COMPLETE.md` para arquitectura, modelo de datos y troubleshooting.
