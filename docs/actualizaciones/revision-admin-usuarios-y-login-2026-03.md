# Revisión: Admin Usuarios y flujo de inicio de sesión (Marzo 2026)

**Fecha:** Marzo 2026  
**Ámbito:** Sección Admin → Usuarios, inicio de sesión (Google OAuth)

Documentación de la revisión de la pestaña Usuarios del panel de administración, correcciones aplicadas y verificación del flujo de login.

---

## 1. Sección Admin → Usuarios

### 1.1 Cambios realizados

| Cambio | Archivo | Descripción |
|--------|---------|-------------|
| Fallback tenant para super-admin | `app/api/usuarios/analisis/route.ts` | Si el usuario es SUPER_ADMIN y no tiene `tenantId` en sesión, se usa el header `x-tenant-id` para resolver el tenant. Evita 403 "Contexto de tenant no disponible" al cargar la página de usuarios como super-admin sin tenant activo. |
| Credentials en análisis | `hooks/useAnalisisUsuarios.ts` | Añadido `credentials: 'include'` en el `fetch` a `/api/usuarios/analisis` para enviar cookies de sesión correctamente. |
| Botones en tabla de usuarios | `app/admin-panel/admin/usuarios/page.tsx` | En la columna "Acciones" del listado se añadieron **Editar** y **Activar/Desactivar** por fila (además del ya existente "Ver detalle"). Los modales y el `AlertDialog` ya existían; antes no había forma de abrirlos desde la tabla. |
| Corrección build | `app/api/usuarios/analisis/route.ts` | Eliminada declaración duplicada de `isSuper`; se reutiliza la variable del bloque de permisos. |

### 1.2 APIs utilizadas por la pestaña Usuarios

| API | Uso en la página |
|-----|------------------|
| `GET /api/usuarios/analisis` | Métricas (total, activos, nuevos, retención), clientes nuevos vs recurrentes, valor promedio, distribución por categoría, clientes más frecuentes. |
| `GET /api/usuarios` | Listado paginado con query: `page`, `limit`, `sortBy`, `sortOrder`, `q`, `categoria`, `actividad`. Respuesta: `{ success, data[], meta }`. |
| `GET/PATCH /api/admin/config/categorias-usuario` | Umbrales VIP/Premium (min reservas). GET devuelve `vipMinReservas`, `premiumMinReservas`. |
| `GET /api/consumibles` | Programa de descuentos (tarjetas VIP, Premium, Regular). |
| `GET/POST/PATCH /api/consumibles/[id]` | CRUD de consumibles desde el modal de categorías. |
| `GET /api/productos` | Lista de productos para el selector del modal de consumible (tipo consumible). |
| `GET /api/crud/user/:id` | Detalle de usuario (modal "Ver detalle") y datos para el modal "Editar". |
| `PUT /api/crud/user/:id` | Actualizar usuario (Editar y Activar/Desactivar). |
| `POST /api/crud/user` | Invitar usuario (modal "Invitar usuario"). |
| `GET /api/bookings?userId=...&limit=50` | Reservas del usuario en el modal "Ver detalle" (pestaña Reservas). |

Todas las rutas que tocan datos de usuario, reservas o configuración aplican filtro por `tenantId` (o permiten super-admin con header `x-tenant-id` cuando corresponda).

### 1.3 Hooks

- **`useAnalisisUsuarios()`**: carga `/api/usuarios/analisis`, devuelve `{ analisis, loading, error, refetch }`. Formato esperado: `{ success, data: { metricas, clientesMasFrecuentes, ... } }`.
- **`useUsuariosList(params)`**: carga `/api/usuarios` con `page`, `limit`, `sortBy`, `sortOrder`, `q`, `categoria`, `actividad`. Devuelve `{ data, meta, loading, error, refetch }`.

---

## 2. Inicio de sesión (login)

### 2.1 Revisión del flujo

- **Página:** `app/login/page.tsx` — Comprueba sesión con `auth()`; si hay sesión redirige a `callbackUrl` o `/`. Si no hay sesión, puede redirigir a `set-tenant-slug` cuando en la URL viene `tenantSlug` (acceso desde club). Luego renderiza `GoogleLoginForm`.
- **NextAuth:** `lib/auth.ts` — Provider Google, JWT, callbacks `signIn` / `jwt` / `session`, páginas `signIn: '/login'`, `error: '/auth/error'`.
- **API:** `app/api/auth/[...nextauth]/route.ts` — Exporta `GET` y `POST` de `handlers` desde `lib/auth`.
- **Middleware:** `middleware.ts` — Redirige a `/login` con `callbackUrl` si no hay sesión y la ruta no es pública; si hay sesión y se accede a `/login`, redirige a `callbackUrl` o `/dashboard`. Usa el mismo nombre de cookie que `lib/auth` para el JWT.
- **Cliente:** `SessionProvider` en el layout raíz; `GoogleLoginForm` usa `useAuthWithRetry` → `signIn('google', { callbackUrl, redirect: false })`.

### 2.2 Cambio aplicado

| Cambio | Archivo | Descripción |
|--------|---------|-------------|
| Redirección OAuth explícita | `hooks/useAuthWithRetry.ts` | Cuando NextAuth devuelve `result.url` (URL absoluta de Google OAuth), se usa `window.location.href = result.url` en lugar de `router.push(result.url)` para garantizar la redirección correcta al proveedor OAuth en todos los entornos. |

### 2.3 Variables de entorno necesarias

- `NEXTAUTH_URL` — URL base de la app.
- `NEXTAUTH_SECRET` — Clave para firmar JWT (mín. 32 caracteres).
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` — Credenciales OAuth de Google.

En Google Cloud Console, el URI de redirección debe ser:  
`{NEXTAUTH_URL}/api/auth/callback/google`  
(por ejemplo `http://localhost:3000/api/auth/callback/google` en local).

---

## 3. Resumen

- **Admin Usuarios:** La pestaña queda con análisis cargando correctamente (incluido super-admin sin tenant), listado con búsqueda/filtros/paginación y acciones **Ver detalle**, **Editar** y **Activar/Desactivar** por usuario. Todas las APIs usadas están documentadas y respetan multitenant.
- **Login:** El flujo de inicio de sesión con Google está revisado; la redirección al proveedor OAuth se hace de forma explícita con `window.location.href` cuando la URL es absoluta.

Documento relacionado: `docs/actualizaciones/admin-usuarios-consumibles-modal-2026-03.md` (consumibles, modal y listado previos).
