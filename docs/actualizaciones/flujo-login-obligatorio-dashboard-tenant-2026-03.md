# Flujo: login obligatorio antes del dashboard del tenant

**Fecha:** Marzo 2026

Documentación de la implementación del flujo en el que **ningún usuario sin sesión puede ver el dashboard de ningún tenant**. El tenant se identifica siempre por la URL (`tenantSlug`); las APIs de canchas y turnos exigen sesión y acceso al tenant cuando se usa ese contexto.

---

## Reglas de negocio

- Usuario **sin sesión** no puede ver el dashboard de ningún tenant.
- **Enlace directo** (ej. WhatsApp): el usuario abre el enlace → debe hacer **login** → tras el login entra al dashboard de ese tenant.
- **Landing, con sesión:** usuario ya logueado hace clic en un club en "Selecciona tu Club" → entra al dashboard de ese tenant con la cuenta actual.
- **Landing, sin sesión:** usuario hace clic en un club → va a **login** → tras el login se redirige al dashboard de ese tenant.
- Solo usuarios con rol **ADMIN** o **SUPER_ADMIN** pueden acceder a la sección de administración (ya implementado previamente).
- El **tenant siempre viene de la URL** (`tenantSlug`); no se usa solo el tenant de la sesión para mostrar datos en el dashboard.

---

## Resumen de cambios por archivo

| Archivo | Cambio |
|---------|--------|
| **app/club/[slug]/page.tsx** | Redirige a **login** con `callbackUrl=/dashboard?tenantSlug={slug}` en lugar de redirigir directo al dashboard. Así no se muestra el dashboard sin sesión. |
| **app/api/courts/route.ts** | Con `queryTenantSlug`: exige sesión (403 si no hay); comprueba tenant activo (403 si inactivo); mantiene `canAccessTenant` para autorización. |
| **app/api/slots/route.ts** | Con `queryTenantSlug`: exige sesión (403 si no hay); comprueba `canAccessTenant(session.user.email, tenant.id)` y tenant activo; la cancha debe pertenecer al tenant del slug. |
| **components/providers/AppStateProvider.tsx** | Al cargar canchas: si la respuesta es **403** → `router.replace('/auth/error?error=AccessDenied')`; si es **404** → `router.replace('/?error=tenant-not-found')`. Evita dejar al usuario en un dashboard vacío o con errores. |
| **middleware.ts** | Para cualquier usuario logueado que **no** sea super admin y que acceda a `/dashboard` **sin** `tenantSlug` en la URL → redirige a la landing (`/`). Así el dashboard solo se usa con tenant explícito en la URL. |

---

## 1. Página del club (`/club/[slug]`)

**Archivo:** `app/club/[slug]/page.tsx`

**Antes:** Redirigía directamente a `/dashboard?tenantSlug={slug}`, por lo que el usuario llegaba al dashboard y el middleware lo enviaba a login (doble redirección).

**Después:** Redirige a login con el callback al dashboard de ese tenant:

```ts
const callbackUrl = `/dashboard?tenantSlug=${encodeURIComponent(slug)}`
redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
```

Flujo resultante: usuario abre `/club/metro-padel-360` → va a `/login?callbackUrl=...` → inicia sesión → NextAuth redirige a `/dashboard?tenantSlug=metro-padel-360`.

---

## 2. API de canchas (GET con `tenantSlug`)

**Archivo:** `app/api/courts/route.ts`

- Si viene **tenantSlug** en la query:
  1. **Sin sesión** → **403** con mensaje "Inicia sesión para ver las canchas de este club".
  2. Se resuelve el tenant por slug; si no existe → **404**.
  3. Si el tenant **no está activo** (`!tenant.isActive`) → **403** "Este club no está disponible".
  4. Se comprueba **canAccessTenant(session.user.email, tenant.id)**; si no tiene acceso → **403**.
  5. Se devuelven las canchas del tenant.

Así, las canchas por `tenantSlug` solo se devuelven a usuarios autenticados con acceso a ese tenant.

---

## 3. API de slots (GET con `tenantSlug`)

**Archivo:** `app/api/slots/route.ts`

- Si viene **tenantSlug** en la query:
  1. **Sin sesión** → **403** "Inicia sesión para ver los horarios".
  2. Se resuelve el tenant por slug; si no existe → **404**; si no está activo → **403**.
  3. Se comprueba **canAccessTenant(session.user.email, tenant.id)**; si no tiene acceso → **403**.
  4. Se comprueba que la cancha solicitada pertenezca al tenant (`courtRow.tenantId === tenant.id`); si no → **403**.

Los turnos por `tenantSlug` solo se devuelven a usuarios autenticados con acceso al tenant y para canchas de ese tenant.

---

## 4. Frontend: redirección ante 403/404 al cargar canchas

**Archivo:** `components/providers/AppStateProvider.tsx`

- En la función que hace fetch de canchas (`loadCourts`):
  - Si **res.status === 403** → `router.replace('/auth/error?error=AccessDenied')`.
  - Si **res.status === 404** → `router.replace('/?error=tenant-not-found')`.
- Se usa `useRouter()` de `next/navigation` para la redirección.

Así, si el usuario tiene sesión pero no tiene acceso al tenant de la URL (o el tenant no existe/está inactivo), no se queda en un dashboard vacío ni solo con mensajes de error.

---

## 5. Middleware: exigir `tenantSlug` en `/dashboard`

**Archivo:** `middleware.ts`

**Antes:** Solo se redirigía a `/` cuando el usuario estaba logueado, **no** tenía `userTenantId` y accedía a `/dashboard` sin `tenantSlug`.

**Después:** Para **cualquier** usuario logueado que **no** sea super admin y que acceda a `/dashboard` **sin** `tenantSlug` en la URL → redirección a la landing (`/`).

```ts
if (isLoggedIn && !isSuperAdmin && nextUrl.pathname === '/dashboard') {
  const tenantSlug = nextUrl.searchParams.get('tenantSlug')
  if (!tenantSlug) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }
}
```

Con esto, el dashboard solo se usa con tenant explícito en la URL (o como super admin).

---

## Flujos resultantes

| Caso | Flujo |
|------|--------|
| Enlace directo (ej. WhatsApp) | Usuario abre `/dashboard?tenantSlug=X` o `/club/X` → sin sesión, middleware o página club redirigen a login con callback → tras login → dashboard de X. |
| Landing, ya logueado, clic en club | Usuario en `/` con sesión → clic en club (`/club/X`) → redirect a login con callback → al estar logueado, redirect a `/dashboard?tenantSlug=X`. |
| Landing, sin sesión, clic en club | Usuario en `/` sin sesión → clic en club → `/club/X` → redirect a login → login → redirect a `/dashboard?tenantSlug=X`. |
| Dashboard sin tenantSlug (no super-admin) | Usuario logueado abre `/dashboard` sin query → middleware redirige a `/`. |
| Sesión sin acceso al tenant de la URL | APIs devuelven 403 → frontend (loadCourts) redirige a `/auth/error?error=AccessDenied`. |
| Tenant no encontrado (404) | API courts devuelve 404 → frontend redirige a `/?error=tenant-not-found`. |

---

## Relación con multitenancy

- Cada tenant se identifica por **slug** en la URL (ej. `metro-padel-360`).
- Las APIs **courts** y **slots** aceptan **tenantSlug** como contexto; con él, solo devuelven datos de ese tenant y exigen sesión y **canAccessTenant**.
- El frontend (dashboard) envía **tenantSlug** desde la URL en las peticiones de canchas y slots, de modo que el usuario solo ve datos del tenant que tiene en la URL.
- Otras APIs (bookings, etc.) siguen validando sesión y tenant en sus propias rutas; este documento solo cubre el flujo de acceso al dashboard y el uso de courts/slots con `tenantSlug`.
