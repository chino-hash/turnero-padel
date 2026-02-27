# Landing: login con vuelta a la landing, avatar y menú de usuario

**Fecha:** 26 de febrero de 2026

Documentación de los cambios realizados en el flujo de autenticación desde la landing: el usuario que inicia sesión desde la página principal vuelve a la landing (en lugar del dashboard), se muestra su avatar de Google con un menú que incluye "Ir a mi club", "Panel Super Admin" (si aplica) y "Cerrar sesión".

---

## Objetivo

1. **Login desde la landing**: Tras iniciar sesión con Google desde el botón de la landing, redirigir de vuelta a la **landing** (`/`), no al dashboard.
2. **Header con sesión**: En la landing, si el usuario está logueado, mostrar **avatar** (imagen de Google o iniciales) en lugar del botón "Iniciar sesión", con un menú desplegable.
3. **Opciones del menú**:
   - **Ir a mi club**: Solo si el usuario tiene un tenant asignado y activo. Enlaza a `/dashboard?tenantSlug=<slug>` (mismo comportamiento que entrar por la URL del club). Se puede mostrar "Ir a {nombre del club}" usando el nombre del tenant.
   - **Panel Super Admin**: Solo si el usuario tiene rol `SUPER_ADMIN`. Enlaza a `/super-admin`.
   - **Cerrar sesión**: Cierra la sesión y redirige a `/`.
4. **Botón "Reservar Ahora"**: Comportamiento condicional según sesión y tenant: sin sesión → login; con sesión y tenant → dashboard del club; con sesión sin tenant → ancla a la sección de clubs (`#clubs-list`).

El flujo desde la **URL de un club** (`/club/[slug]`) se mantiene sin cambios: el usuario sin sesión es redirigido a login con `callbackUrl=/dashboard?tenantSlug=slug` y, tras autenticarse, llega al dashboard de ese club.

---

## Resumen de cambios por archivo

| Archivo | Cambio |
|---------|--------|
| **middleware.ts** | Aceptar `'/'` como destino válido cuando el usuario logueado entra en `/login` con `callbackUrl=/`. Nueva lógica: `redirectUrl = callbackUrl === '/' ? '/' : (callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/dashboard')`. |
| **app/login/page.tsx** | Tras login, redirigir a `params.callbackUrl ?? '/'` (antes `params.callbackUrl \|\| '/dashboard'`). Solo cambia el valor por defecto; el flujo con tenant en callbackUrl (desde club) no se modifica. |
| **components/LandingPage.tsx** | Todos los enlaces de login usan `callbackUrl=/`. Nuevas props: `session`, `tenantSlug`, `tenantName`. Header desktop y menú móvil: si hay sesión, avatar + dropdown (o bloque en móvil) con "Ir a mi club", "Panel Super Admin", "Cerrar sesión". Botón "Reservar Ahora" condicional. Cierre del drawer móvil al elegir una opción. |
| **app/page.tsx** | Página convertida a async Server Component. Llama a `auth()`; si `session?.user?.tenantId` existe, llama a `getTenantFromId()` y obtiene `tenantSlug` y `tenantName` solo si el tenant está activo. Pasa `session`, `tenantSlug`, `tenantName` a `LandingPage`. |

No se modifican: `lib/auth.ts`, rutas de super-admin, `app/api/auth/set-tenant-slug/route.ts` (sigue usando su default para el flujo desde club).

---

## 1. Middleware

**Archivo:** `middleware.ts`

**Antes:** Si el usuario estaba logueado y entraba en `/login`, se redirigía a `callbackUrl` solo cuando este era distinto de `'/'` y de `'/login'`; en caso contrario se usaba `/dashboard`. Eso impedía volver a la landing tras login desde ella.

**Después:** Se permite explícitamente `callbackUrl === '/'` como destino.

```ts
// Si está logueado y trata de acceder a login, redirigir según callbackUrl
if (isLoggedIn && nextUrl.pathname === '/login') {
  const callbackUrl = nextUrl.searchParams.get('callbackUrl')
  const redirectUrl = callbackUrl === '/' ? '/' : (callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/dashboard')
  return NextResponse.redirect(new URL(redirectUrl, nextUrl))
}
```

Casos: sin `callbackUrl` o inválido → `/dashboard`; `callbackUrl='/'` → `/`; `callbackUrl='/dashboard?tenantSlug=club'` (desde club) → esa URL.

---

## 2. Página de login

**Archivo:** `app/login/page.tsx`

**Cambio único:** Cuando el usuario ya tiene sesión, el destino por defecto pasa a ser la landing.

```ts
if (session) {
  const callbackUrl = params.callbackUrl ?? '/'
  redirect(callbackUrl)
}
```

El resto (extracción de `tenantSlug` del `callbackUrl`, redirect a `set-tenant-slug`, paso de `callbackUrl` a `GoogleLoginForm`) se mantiene igual.

---

## 3. Página principal (landing)

**Archivo:** `app/page.tsx`

- La página es **async** y llama a `await auth()`.
- Si existe `session?.user?.tenantId`, se llama a `getTenantFromId(session.user.tenantId)` (desde `@/lib/tenant/context`) dentro de un `try/catch`.
- Solo si el tenant existe y `tenant.isActive` se asignan `tenantSlug` y `tenantName`; si no, se dejan en `null` (no se muestra "Ir a mi club" para tenants inactivos).
- Se renderiza `<LandingPage session={session} tenantSlug={tenantSlug} tenantName={tenantName} />`.

---

## 4. Componente LandingPage

**Archivo:** `components/LandingPage.tsx`

### 4.1 Props e imports

- **Nuevas props:** `session: Session | null`, `tenantSlug: string | null`, `tenantName: string | null`.
- **Imports añadidos:** `Session` (next-auth), `signOut` (next-auth/react), componentes del dropdown (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`) desde `@/components/ui/dropdown-menu`.
- **Función auxiliar:** `getInitials(name)` para mostrar iniciales cuando no hay imagen de perfil.

### 4.2 Enlaces de login

Todos los enlaces que llevaban a login con `callbackUrl=/dashboard` pasan a usar `callbackUrl=/`:

- Header desktop: botón "Iniciar sesión".
- Menú móvil: botón "Iniciar sesión".
- Hero: botón "Reservar Ahora" (cuando no hay sesión).

### 4.3 Header desktop con sesión

Si `session?.user` existe:

- Se muestra un **avatar**: `session.user.image` si está definido; si no, un círculo con las iniciales (por `getInitials(session.user.name)`).
- El avatar es el **trigger** de un `DropdownMenu` con:
  - **"Ir a mi club"** (o "Ir a {tenantName}"): solo si `tenantSlug` está definido; enlace a `/dashboard?tenantSlug=<tenantSlug>`.
  - **"Panel Super Admin"**: solo si `session.user.isSuperAdmin`; enlace a `/super-admin`.
  - Separador.
  - **"Cerrar sesión"**: ejecuta `signOut({ callbackUrl: '/' })`.

Si no hay sesión, se sigue mostrando el botón "Iniciar sesión" con `href="/login?callbackUrl=/"`.

### 4.4 Menú móvil con sesión

En el drawer móvil se replica la lógica:

- Sin sesión: enlace "Iniciar sesión" con `onClick={() => setMobileMenuOpen(false)}`.
- Con sesión: bloque con avatar, nombre/email, enlaces "Ir a mi club" y "Panel Super Admin" (cuando apliquen), y botón "Cerrar sesión". Cada enlace/botón cierra el menú con `setMobileMenuOpen(false)` (y en "Cerrar sesión" se llama además a `signOut({ callbackUrl: '/' })`).

### 4.5 Botón "Reservar Ahora" (hero)

- **Sin sesión:** `href="/login?callbackUrl=/"`.
- **Con sesión y tenant:** `href="/dashboard?tenantSlug=<tenantSlug>"`.
- **Con sesión sin tenant:** `href="#clubs-list"` (ancla a la sección de selección de club).

### 4.6 Guards

Siempre se comprueba `session?.user` antes de acceder a `session.user.image`, `session.user.isSuperAdmin`, etc. Si `session` es null o `session.user` es undefined, se trata como "sin sesión" y se muestra el botón "Iniciar sesión".

---

## Flujos resultantes

### Usuario que inicia sesión desde la landing

1. Usuario en `/` → clic en "Iniciar sesión" o "Reservar Ahora" → va a `/login?callbackUrl=/`.
2. Inicia sesión con Google.
3. NextAuth redirige a `callbackUrl` = `/`.
4. Usuario vuelve a la landing y ve su avatar en el header; puede abrir el menú para "Ir a mi club", "Panel Super Admin" (si es superadmin) o "Cerrar sesión".

### Usuario que llega con la URL de un club

1. Usuario abre `/club/mi-club` (sin sesión).
2. La página del club redirige a `/login?callbackUrl=/dashboard?tenantSlug=mi-club`.
3. Login detecta `tenantSlug` en el callbackUrl y redirige a `set-tenant-slug` para guardar la cookie.
4. Tras login con Google, el callback JWT asigna el tenant al usuario y NextAuth redirige a `/dashboard?tenantSlug=mi-club`.
5. El usuario termina en el dashboard de ese club (comportamiento sin cambios respecto a antes).

### Superadmin

Puede iniciar sesión desde la landing, volver a `/` y desde el menú del avatar acceder a "Panel Super Admin" sin tener que pasar por un tenant.

---

## Verificación manual sugerida

- Sin sesión: "Iniciar sesión" → Google → vuelta a `/` y avatar visible.
- Con tenant: en el menú aparece "Ir a mi club" (o "Ir a {nombre}"); el enlace lleva al dashboard del club.
- Superadmin: en el menú aparece "Panel Super Admin"; el enlace lleva a `/super-admin`.
- Usuario con tenant inactivo: no debe aparecer "Ir a mi club".
- "Cerrar sesión": redirige a `/` y vuelve a mostrarse "Iniciar sesión".
- Flujo desde club: `/club/[slug]` sin sesión → login → tras Google debe ir al dashboard de ese club (no a la landing).
