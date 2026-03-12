# Admin Canchas: contexto por tenant y navegación

**Fecha:** Marzo 2026

Documentación de los cambios para que el Super Admin, al estar “dentro” de un tenant en el panel de administración, vea solo las canchas de ese tenant (no de todos), y para que la navegación (dashboard, home, enlaces del panel) conserve el tenant en la URL.

---

## Objetivo

- **Super Admin en un tenant**: en la sección Canchas solo debe ver las canchas de ese tenant, no las de todos los tenants.
- **Origen del contexto**: el tenant puede venir de la URL (`?tenantId=` o `?tenantSlug=`), de la sesión o de un valor persistido (cookie) cuando se entra sin parámetros.
- **Navegación**: al ir al dashboard o al panel desde un tenant, la URL debe mantener `tenantSlug` o `tenantId` para no perder el contexto.

---

## Resumen de cambios

1. **API de canchas (GET)**  
   - Prioridad: si hay `tenantId`/`tenantSlug` en query → filtrar por ese tenant.  
   - Si no hay query pero el usuario tiene `userTenantId` (sesión) → filtrar por ese tenant (incluye Super Admin con tenant en sesión).  
   - Solo si es Super Admin sin tenant en sesión ni en query → devolver todas las canchas.  
   - Con `tenantSlug` y usuario admin/super admin → devolver todas las canchas del tenant (activas e inactivas) con `getAllCourts`, no solo activas.

2. **Página Gestión de Canchas**  
   - Lee `tenantId` y `tenantSlug` de la URL y los envía al API.  
   - Si no hay tenant en la URL y el usuario es Super Admin, lee el tenant guardado en cookie y redirige a la misma ruta añadiendo `?tenantId=` o `?tenantSlug=`.

3. **Persistencia del tenant del admin**  
   - Nueva utilidad `lib/utils/admin-context-tenant.ts`: guarda/lee en cookie el último tenant usado en el panel (`admin-context-tenant-id`, `admin-context-tenant-slug`).  
   - Se actualiza la cookie cuando: hay tenant en la URL del dashboard, hay tenant en la URL de cualquier página del admin, o se está en Canchas con tenant en la URL.

4. **Navegación del panel**  
   - Enlaces del menú (Canchas, Turnos, Usuarios, etc.) y el botón “Admin” preservan `tenantId`/`tenantSlug` en la URL.  
   - Botón **Home** (icono casa): al ir al dashboard, añade `?tenantSlug=` o `?tenantId=` según la URL actual del panel.

5. **Entrada al panel con tenant**  
   - Desde el **dashboard** con `?tenantSlug=`: el botón de administración lleva a `/admin-panel/admin?tenantSlug=...`.  
   - Desde **Super Admin** (detalle de tenant): botón “Abrir panel de administración” que lleva a `/admin-panel/admin?tenantId=...`.

---

## 1. API de canchas (`app/api/courts/route.ts`)

### GET – Lógica de filtrado

- **Con `tenantSlug` en query**  
  - Exige sesión y acceso al tenant.  
  - Si el usuario es admin o super admin → `getAllCourts(tenant.id, { includeTenant: isSuperAdmin })`.  
  - Si no es admin → `getCourts(tenant.id)` (solo activas).

- **Sin `tenantSlug`**  
  - `canUseQueryTenant`: usar `queryTenantId` solo si está presente y (es super admin o `queryTenantId === userTenantId`).  
  - Si `canUseQueryTenant` → `getAllCourts(queryTenantId, …)`.  
  - Si no pero hay `userTenantId` → `getAllCourts(userTenantId, …)` (incluye super admin con tenant en sesión).  
  - Si no pero es super admin → `getAllCourts(undefined, …)` (todas).  
  - Resto → `getCourts(userTenantId || undefined)`.

Con esto, cuando el super admin tiene tenant en sesión o en la URL, solo recibe canchas de ese tenant.

---

## 2. Utilidad de contexto admin (`lib/utils/admin-context-tenant.ts`)

- **Funciones**  
  - `setAdminContextTenant(tenantId, tenantSlug)`: escribe en cookies `admin-context-tenant-id` y/o `admin-context-tenant-slug` (cliente, path `/`, 24 h).  
  - `getAdminContextTenant()`: devuelve `{ tenantId, tenantSlug }` leyendo esas cookies.

- **Uso**  
  - Para que, si el usuario abre `/admin-panel/admin/canchas` sin parámetros, se redirija a la misma ruta con `?tenantId=` o `?tenantSlug=` usando el último tenant guardado.

---

## 3. Página Gestión de Canchas (`app/admin-panel/admin/canchas/page.tsx`)

- **URL**  
  - `tenantIdFromUrl = searchParams.get('tenantId')`, `tenantSlugFromUrl = searchParams.get('tenantSlug')`.

- **Persistir tenant**  
  - `useEffect`: si hay `tenantIdFromUrl` o `tenantSlugFromUrl`, llama a `setAdminContextTenant(tenantIdFromUrl, tenantSlugFromUrl)`.

- **Redirección sin tenant en URL**  
  - Si el usuario es super admin y no hay `tenantIdFromUrl` ni `tenantSlugFromUrl`:  
    - Lee `getAdminContextTenant()`.  
    - Si hay `tenantId` → `router.replace(pathname + '?tenantId=' + …)`.  
    - Si no pero hay `tenantSlug` → `router.replace(pathname + '?tenantSlug=' + …)`.

- **Fetch**  
  - No se llama al API si `willRedirect` (super admin sin tenant en URL pero con tenant en cookie).  
  - En el resto de casos se llama a `/api/courts` con `?tenantId=` o `?tenantSlug=` cuando corresponda.

---

## 4. Layout del panel (`app/admin-panel/components/AdminLayoutContent.tsx`)

- **Función `withTenantQuery(href, searchParams)`**  
  - Añade `tenantId` o `tenantSlug` de la URL actual a cualquier `href` del menú (Canchas, Turnos, Usuarios, etc.) para mantener el contexto.

- **Enlaces del menú**  
  - Desktop y móvil usan `href={withTenantQuery(href, searchParams)}` para cada enlace de sección.

- **Persistir tenant**  
  - `useEffect`: si en `searchParams` hay `tenantId` o `tenantSlug`, llama a `setAdminContextTenant(...)`.

- **Botón Home**  
  - `onClick`: construye `/dashboard` y, si hay `tenantId` o `tenantSlug` en `searchParams`, añade `?tenantId=` o `?tenantSlug=` y hace `router.push(...)`.

---

## 5. Botón “Admin” del layout (`app/admin-panel/components/AdminTitleButton.tsx`)

- Lee `tenantId` y `tenantSlug` de `useSearchParams()`.  
- Al hacer clic en “Admin”, navega a `/admin-panel/admin` + `?tenantId=...` o `?tenantSlug=...` si existen.

---

## 6. Dashboard y entrada al panel (`padel-booking.tsx`)

- **Cookie de contexto**  
  - Si la URL tiene `tenantSlug` (p. ej. `/dashboard?tenantSlug=metro-padel-360`), `useEffect` llama a `setAdminContextTenant(null, tenantSlugFromUrl)`.

- **Botón de administración**  
  - Si el usuario es admin, navega a `/admin-panel/admin` + `?tenantSlug=...` cuando hay `tenantSlugFromUrl`.

---

## 7. Super Admin – detalle de tenant (`app/super-admin/tenants/[id]/page.tsx`)

- Botón **“Abrir panel de administración”** (junto a “Volver”) cuando existe `tenantIdForSections`.  
- Enlace: `/admin-panel/admin?tenantId=${encodeURIComponent(tenantIdForSections)}`.  
- Así el super admin abre el panel ya en el contexto de ese tenant.

---

## Flujos de uso

1. **Entrar por club**  
   - `/club/mi-club` → login → `/dashboard?tenantSlug=mi-club`.  
   - Se guarda el tenant en cookie.  
   - Clic en “Admin” → `/admin-panel/admin?tenantSlug=mi-club`.  
   - Clic en “Canchas” → `/admin-panel/admin/canchas?tenantSlug=mi-club` → solo canchas de ese tenant.

2. **Entrar a canchas sin parámetros**  
   - Super Admin abre `/admin-panel/admin/canchas` directamente.  
   - Si hay tenant en cookie → redirección a `.../canchas?tenantSlug=...` o `?tenantId=...` y se muestran solo las canchas de ese tenant.

3. **Volver al dashboard del tenant**  
   - En `/admin-panel/admin/canchas?tenantSlug=metro-padel-360`, clic en el icono **Home** → `/dashboard?tenantSlug=metro-padel-360` (se mantiene el tenant).

---

## Archivos modificados o nuevos

| Archivo | Cambio |
|--------|--------|
| `app/api/courts/route.ts` | GET: orden de filtrado por tenant; con `tenantSlug` + admin → `getAllCourts`. |
| `lib/utils/admin-context-tenant.ts` | **Nuevo**: cookie de contexto tenant del admin. |
| `app/admin-panel/admin/canchas/page.tsx` | Lee tenant de URL; cookie y redirección; fetch con tenant. |
| `app/admin-panel/components/AdminLayoutContent.tsx` | `withTenantQuery`; persistir tenant; botón Home con tenant. |
| `app/admin-panel/components/AdminTitleButton.tsx` | Navegación a admin con `tenantId`/`tenantSlug`. |
| `padel-booking.tsx` | Cookie al tener `tenantSlug`; botón Admin con `?tenantSlug=`. |
| `app/super-admin/tenants/[id]/page.tsx` | Botón “Abrir panel de administración” con `?tenantId=`. |

---

## Notas

- La cookie de contexto tiene una vida de 24 horas y se usa solo para redirigir cuando se entra a Canchas (u otras secciones) sin tenant en la URL.  
- El **admin de un tenant** (no super admin) sigue viendo solo las canchas de su tenant porque la API usa `userTenantId` de la sesión cuando no hay `tenantId`/`tenantSlug` en la query.
