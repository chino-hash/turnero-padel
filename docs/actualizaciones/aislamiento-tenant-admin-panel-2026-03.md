# Aislamiento por tenant en el panel de administración (Marzo 2026)

**Fecha:** Marzo 2026  
**Contexto:** El super-admin debe ver únicamente los datos del tenant en el que se encuentra (igual que en Canchas). Antes, en secciones como Turnos, Ventas o Usuarios se mostraban datos de todos los tenants.

---

## 1. Problema que se corrigió

- En **Turnos** (`/admin-panel/admin/turnos?tenantSlug=metro-padel-360`) aparecían reservas de otros tenants (por ejemplo, creadas para poblar otro tenant de prueba).
- La API `GET /api/bookings` solo aplicaba filtro por tenant cuando el usuario **no** era super-admin. Para super-admin no se enviaba ni leía `tenantId`/`tenantSlug`, por lo que se devolvían todas las reservas.
- El mismo patrón afectaba a: estadísticas de bookings, ventas, usuarios, análisis de usuarios, estadísticas generales, torneos y al dashboard del admin.

---

## 2. Patrón de referencia: Canchas

En **Canchas** ya estaba implementado:

- Leer `tenantId` y `tenantSlug` de la URL (`searchParams`).
- Persistir en cookie con `setAdminContextTenant` para que, al navegar sin query, se use el último tenant.
- Si el super-admin entra sin tenant en la URL pero tiene cookie de tenant, redirigir a la misma ruta con `?tenantId=...` o `?tenantSlug=...`.
- En cada request a la API añadir `tenantId` o `tenantSlug` en la query.

Se replicó este patrón en el resto de secciones del admin.

---

## 3. Cambios realizados por área

### 3.1 Turnos (reservas)

| Capa   | Archivo | Cambio |
|--------|---------|--------|
| API    | `app/api/bookings/route.ts` | GET: si el usuario es super-admin, se leen `tenantId` y `tenantSlug` de la query; si viene slug se resuelve con `getTenantFromSlug` y se asigna `validatedParams.tenantId` antes de `getAllBookings`. |
| API    | `app/api/bookings/stats/route.ts` | GET: se acepta `tenantId`/`tenantSlug` en query para super-admin; se resuelve y se pasa el `tenantId` a `getBookingStats`. |
| Hook   | `hooks/useBookings.ts` | Opciones `tenantId` y `tenantSlug`; en `buildQueryParams` se añaden a la query cuando están definidos. |
| Hook   | `hooks/useCourtPrices.ts` | Opciones opcionales `tenantId` y `tenantSlug` para filtrar canchas por tenant. |
| Página | `app/admin-panel/admin/turnos/page.tsx` | Lectura de tenant desde URL, `setAdminContextTenant`, redirección si super-admin sin tenant en URL pero con cookie, y paso de tenant a `useBookings`, a la petición de stats y a `useCourtPrices`. |

### 3.2 Ventas

| Capa   | Archivo | Cambio |
|--------|---------|--------|
| API    | `app/api/ventas/route.ts` | GET: para super-admin se leen `tenantId`/`tenantSlug` de la query, se resuelve slug y se aplica `where.tenantId`. |
| API    | `app/api/productos/route.ts` | GET: se añade soporte de `tenantSlug` en query para super-admin (resolución con `getTenantFromSlug`). |
| Página | `app/admin-panel/admin/ventas/page.tsx` | Contexto de tenant (URL, cookie, redirección) y paso de tenant en `cargarVentas` y `cargarProductos`. |

### 3.3 Usuarios

| Capa   | Archivo | Cambio |
|--------|---------|--------|
| API    | `app/api/usuarios/route.ts` | Para super-admin se acepta `tenantId`/`tenantSlug` en query (además del header `x-tenant-id`). |
| API    | `app/api/usuarios/analisis/route.ts` | Igual: query `tenantId`/`tenantSlug` para super-admin. |
| Hook   | `hooks/useUsuariosList.ts` | Parámetros opcionales `tenantId` y `tenantSlug` en la lista; se envían en la URL. |
| Hook   | `hooks/useAnalisisUsuarios.ts` | Opciones `tenantId`/`tenantSlug`; se añaden a la URL de `/api/usuarios/analisis`. |
| Página | `app/admin-panel/admin/usuarios/page.tsx` | Contexto de tenant y paso de tenant a los hooks y al fetch de productos del modal. |

### 3.4 Productos

| Capa   | Archivo | Cambio |
|--------|---------|--------|
| API    | `app/api/productos/route.ts` | GET: ya aceptaba `tenantId`; se añade resolución de `tenantSlug` para super-admin. |
| Página | `app/admin-panel/admin/productos/page.tsx` | Contexto de tenant (URL, cookie, redirección) y `cargarProductos` con tenant en la query. |

### 3.5 Estadísticas

| Capa   | Archivo | Cambio |
|--------|---------|--------|
| API    | `app/api/estadisticas/route.ts` | Si es super-admin y no hay tenant en sesión, se acepta `tenantId`/`tenantSlug` en query y se usa para el informe. |
| Hook   | `hooks/useEstadisticas.ts` | Segundo argumento opcional `{ tenantId, tenantSlug }`; se añaden a la URL. |
| Página | `app/admin-panel/estadisticas/page.tsx` | Contexto de tenant y paso de tenant al hook. |

### 3.6 Torneos

| Capa   | Archivo | Cambio |
|--------|---------|--------|
| API    | `app/api/torneos/route.ts` | GET: para super-admin sin tenant en sesión se acepta `tenantId`/`tenantSlug` en query y se usa en `getTournamentsByTenant`. |
| Página | `app/admin-panel/admin/torneos/page.tsx` | Contexto de tenant; en `fetchTorneos` se añade tenant a la URL; `selectedTenantId` se sincroniza con `tenantIdFromUrl`. |

### 3.7 Dashboard (resumen del admin)

| Capa   | Archivo | Cambio |
|--------|---------|--------|
| Página | `app/admin-panel/admin/page.tsx` | Se obtiene tenant desde URL o cookie (`getAdminContextTenant`); se pasa tenant a `useBookings` y en el efecto que carga el resumen se añade tenant a las URLs de `/api/estadisticas` y `/api/bookings`. |

---

## 4. Flujo del super-admin

1. **Entra con tenant en la URL**  
   Ejemplo: `/admin-panel/admin/turnos?tenantSlug=metro-padel-360`  
   → Solo ve datos (reservas, ventas, usuarios, etc.) de ese tenant.

2. **Persistencia en cookie**  
   Al tener `tenantId` o `tenantSlug` en la URL se llama a `setAdminContextTenant`, de modo que el contexto se guarda en cookie.

3. **Entra sin tenant en la URL pero con cookie**  
   Si el super-admin abre por ejemplo `/admin-panel/admin/turnos` sin query pero tiene cookie de tenant, se redirige a la misma ruta con `?tenantId=...` o `?tenantSlug=...`.

4. **Enlaces del layout**  
   `AdminLayoutContent` ya añade el query de tenant a los enlaces (`withTenantQuery`), por lo que al cambiar de pestaña (Turnos, Canchas, Usuarios, etc.) se mantiene el mismo tenant.

Los **admins no super-admin** siguen usando solo su `user.tenantId`; no dependen de la URL ni de la cookie.

---

## 5. Archivos tocados (resumen)

- **APIs:** `app/api/bookings/route.ts`, `app/api/bookings/stats/route.ts`, `app/api/ventas/route.ts`, `app/api/productos/route.ts`, `app/api/usuarios/route.ts`, `app/api/usuarios/analisis/route.ts`, `app/api/estadisticas/route.ts`, `app/api/torneos/route.ts`
- **Hooks:** `hooks/useBookings.ts`, `hooks/useCourtPrices.ts`, `hooks/useUsuariosList.ts`, `hooks/useAnalisisUsuarios.ts`, `hooks/useEstadisticas.ts`
- **Páginas admin:** `app/admin-panel/admin/turnos/page.tsx`, `app/admin-panel/admin/ventas/page.tsx`, `app/admin-panel/admin/usuarios/page.tsx`, `app/admin-panel/admin/productos/page.tsx`, `app/admin-panel/admin/torneos/page.tsx`, `app/admin-panel/admin/page.tsx`, `app/admin-panel/estadisticas/page.tsx`

En todas las APIs que aceptan tenant por query se usa `getTenantFromSlug` de `lib/tenant/context` para resolver `tenantSlug` a `tenantId` cuando hace falta.
