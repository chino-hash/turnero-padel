# Documentación Detallada de Refactorización - Turnero de Padel

**Fecha de análisis:** Febrero 2026  
**Versión:** 1.0

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Refactorización Auth Middleware (Edge Runtime)](#2-refactorización-auth-middleware-edge-runtime)
3. [Migración Auth.js v5 y Layouts de Servidor](#3-migración-authjs-v5-y-layouts-de-servidor)
4. [Nuevos Hooks de Autenticación](#4-nuevos-hooks-de-autenticación)
5. [Componente TurneroAppServer](#5-componente-turneroappserver)
6. [Cambios en padel-booking.tsx](#6-cambios-en-padel-bookingtsx)
7. [Skills de Cursor Añadidos](#7-skills-de-cursor-añadidos)
8. [Reorganización de Documentación](#8-reorganización-de-documentación)

---

## 1. Resumen Ejecutivo

La refactorización aborda principalmente:

- **Problema de límite Vercel**: El bundle del middleware Edge superaba 1 MB debido a dependencias pesadas (Prisma, Zod, Google provider).
- **Arquitectura de autenticación**: Separación entre auth para middleware (ligero) y auth completo para rutas API.
- **Patrones Auth.js v5**: Layouts de servidor, componentes de servidor y eliminación de FOUC.
- **Hooks reutilizables**: `useAuth` y `useAuthWithRetry` para lógica de autenticación en cliente.

---

## 2. Refactorización Auth Middleware (Edge Runtime)

### Contexto

- **Commit:** `c065b5d` - refactor: auth-middleware modular, skills Cursor, docs reorg
- **Problema:** Edge Function del middleware ~1.03 MB (límite Vercel Hobby: 1 MB)
- **Causa:** `lib/auth.ts` incluye Prisma, Zod, Google provider, `getUserRoleAndTenant` → bundle pesado

### Cambios Implementados

#### 2.1 Nuevo archivo: `lib/auth-middleware.ts`

Configuración mínima para validar sesión en Edge Runtime:

```typescript
// Solo valida JWT y construye la sesión
// NO incluye: providers, Prisma, Zod, callbacks complejos
```

**Características:**
- `providers: []` — vacío en Edge
- `session: { strategy: "jwt" }` — decodificación JWT desde cookie
- `cookies.sessionToken.name`: `"next-auth.session-token"` (debe coincidir con `lib/auth`)
- Callback `session` idéntico al de `lib/auth.ts` para mantener forma de `session.user`

**Regla:** `lib/auth-middleware.ts` solo debe ser importado en `middleware.ts`. Para rutas API, layouts y componentes usar siempre `lib/auth`.

#### 2.2 Cambio en `middleware.ts`

| Antes | Después |
|-------|---------|
| `import { auth } from "./lib/auth"` | `import { auth } from "./lib/auth-middleware"` |

La lógica de rutas, redirecciones y headers no cambia.

#### 2.3 Diagrama de imports

```
ANTES:
middleware.ts → lib/auth.ts → next-auth, Google, env (zod), getUserRoleAndTenant (Prisma)
                              → bundle > 1 MB

DESPUÉS:
middleware.ts → lib/auth-middleware.ts → next-auth (solo secret + session callback)
lib/auth.ts   → (sin cambios, usado por API route /api/auth/[...nextauth])
```

#### 2.4 Script de verificación: `scripts/check-middleware-size.js`

Permite validar que el bundle del middleware esté bajo 1 MB:

```bash
npm run build
node scripts/check-middleware-size.js
```

### Referencias

- `docs/pasos/refactor-auth-middleware-reducir-bundle.md`

---

## 3. Migración Auth.js v5 y Layouts de Servidor

### Cambios principales

- **Protección de rutas:** De client-side (`ProtectedRoute` con `useEffect`) a layouts de servidor con `auth()` y `redirect()`.
- **FOUC:** Eliminado al no depender de `useEffect` + `router.push` en cliente.
- **Rutas API:** Usan `auth()` de `lib/auth` (no `auth-middleware`).

### Arquitectura recomendada (documentada)

```
app/
├── (protected)/          # Rutas que requieren autenticación
│   ├── layout.tsx        # const session = await auth(); if (!session) redirect("/login")
│   └── dashboard/
├── (admin)/              # Rutas que requieren admin
│   ├── layout.tsx        # auth() + check isAdmin
│   └── admin/
└── (public)/             # Rutas públicas
    └── login/
```

### ProtectedRoute simplificado

- Antes: `useEffect` con navegación (causaba FOUC).
- Después: Solo renderiza o no renderiza; el middleware gestiona redirecciones.

### Referencias

- `docs/migraciones/MIGRATION-AUTH-V5.md`

---

## 4. Nuevos Hooks de Autenticación

### 4.1 `hooks/useAuth.ts`

**Propósito:** Hook de cliente para autenticación usando `next-auth/react`.

**Uso:**

```tsx
const { user, loading, isAuthenticated, isAdmin, isSuperAdmin, profile, signIn, signOut } = useAuth()
```

**Valores retornados:**

| Propiedad      | Tipo              | Descripción                                      |
|----------------|-------------------|--------------------------------------------------|
| `user`         | `User \| null`    | Usuario de la sesión                             |
| `loading`      | `boolean`         | `status === 'loading'`                           |
| `isAuthenticated` | `boolean`      | Usuario autenticado                              |
| `isAdmin`      | `boolean`         | Rol admin o super admin                          |
| `isSuperAdmin` | `boolean`         | Rol super admin                                  |
| `profile`      | Objeto compatible | Compatibilidad con código que espera `profile`   |
| `signIn`       | `() => Promise<void>` | Inicia login con Google (callbackUrl: `/dashboard`) |
| `signOut`      | `() => Promise<void>` | Cierra sesión (callbackUrl: `/`)              |

**Notas:**
- Usa `useSession`, `signIn`, `signOut` de `next-auth/react`.
- `profile` adapta la sesión al formato legacy.

---

### 4.2 `hooks/useAuthWithRetry.ts`

**Propósito:** Autenticación con reintentos y manejo de errores.

**Opciones:**

```typescript
interface AuthRetryOptions {
  maxRetries?: number    // default: 3
  retryDelay?: number    // default: 1000 ms
  onError?: (error: string) => void
}
```

**Valores retornados:**

| Propiedad       | Descripción                                      |
|-----------------|--------------------------------------------------|
| `session`       | Sesión actual                                   |
| `status`        | Estado de sesión                                |
| `isLoading`     | `loading` o reintentando                        |
| `isRetrying`    | Indica reintento en curso                       |
| `retryCount`    | Número de reintentos                            |
| `lastError`     | Último mensaje de error                         |
| `signIn`        | `signInWithRetry(provider, callbackUrl?)`       |
| `signOut`       | `signOutWithRetry(callbackUrl?)`                |
| `retryAuth`     | Reintentar manualmente                          |
| `isAuthenticated`, `isAdmin`, `isSuperAdmin`, `user` | Igual que en `useAuth` |

**Comportamiento:**

- Auto-retry en rutas protegidas (`/admin`, `/dashboard`, `/profile`) cuando `unauthenticated`.
- Redirección a `/auth/error` en errores de autenticación.
- `signIn` usa `redirect: false` para poder manejar errores.
- Reseteo de contador cuando la sesión se recupera.

---

## 5. Componente TurneroAppServer

### Archivo: `components/TurneroAppServer.tsx`

**Tipo:** Server Component (async).

**Uso de auth:**

- `auth()` de `lib/auth` (server-side).
- Server action `handleSignOut` que usa `signOut` de `lib/auth`.

**Estructura:**

- Header con nombre de usuario y badges Admin/Super Admin.
- Formulario con action para cerrar sesión.
- Card indicando migración a Auth.js v5 con layouts de servidor.

**Nota:** Usa Server Actions con `'use server'` en `handleSignOut`, compatible con Auth.js v5.

---

## 6. Cambios en padel-booking.tsx

### 6.1 Redirección tras cerrar sesión

| Antes | Después |
|-------|---------|
| `router.push('/login')` | `router.push('/')` |

**Motivo:** `signOut` de `useAuth` usa `callbackUrl: '/'` y `redirect: true`, por lo que NextAuth redirige a la landing. El `router.push('/')` actúa como fallback si la redirección no ocurre.

### 6.2 Manejo de errores en signOut

- **Antes:** Solo `console.error` en el catch.
- **Después:** Se añade `router.push('/')` en el `catch` para garantizar redirección a la landing si hay error al cerrar sesión.

### 6.3 Cambios de formato

- Ajuste de espacios/indentación en la sección del logo de la navbar (código equivalente).

### Resumen de diff

```diff
- router.push('/login')
+ router.push('/')
+ // signOut usa callbackUrl: '/' y redirect: true...
+ router.push('/')  // en catch
```

---

## 7. Skills de Cursor Añadidos

En el commit `c065b5d` se añadieron skills en `.cursor/skills/`:

| Skill                      | Propósito principal                               |
|----------------------------|---------------------------------------------------|
| `turnero-padel-api`        | Patrones para rutas API (ApiResponse, Zod, etc.)  |
| `turnero-padel-components` | Convenciones UI y componentes                     |
| `turnero-padel-domain`     | Dominio (reservas, estados, etc.)                 |
| `turnero-padel-multitenant`| Reglas de aislamiento multitenant                 |
| `turnero-padel-services`   | Servicios y lógica de negocio                     |

---

## 8. Reorganización de Documentación

### Documentos eliminados (Supabase legacy)

- `docs/02-diseno-base-datos-supabase.md`
- `docs/03-configuracion-autenticacion-supabase.md`
- `docs/04-implementacion-apis-supabase.md`
- `docs/05-configuracion-proyecto-supabase.md`
- Varios reportes Playwright antiguos
- Templates de mantenimiento antiguos
- Otros documentos obsoletos

### Documentos añadidos/actualizados

- `docs/pasos/README.md` — índice de pasos.
- `docs/pasos/refactor-auth-middleware-reducir-bundle.md` — guía del refactor de auth middleware.
- Pasos admin: canchas, estadísticas, productos, torneos, turnos, usuarios.
- `docs/pasos/planes-suscripcion-canchas-pendientes.md`
- `docs/00-indice-documentacion.md` — índice actualizado.

---

## Tabla de Archivos Modificados/Creados

| Archivo                      | Estado  | Descripción                                      |
|-----------------------------|---------|--------------------------------------------------|
| `lib/auth-middleware.ts`    | Nuevo   | Auth mínimo para Edge Runtime                    |
| `middleware.ts`             | Modificado | Import desde auth-middleware                   |
| `scripts/check-middleware-size.js` | Nuevo | Verificación de tamaño del bundle             |
| `hooks/useAuth.ts`          | Nuevo   | Hook cliente de autenticación                    |
| `hooks/useAuthWithRetry.ts` | Nuevo   | Hook con reintentos y manejo de errores          |
| `components/TurneroAppServer.tsx` | Nuevo | Server component de turnero                  |
| `padel-booking.tsx`         | Modificado | Redirección post signOut y manejo de errores |
| `.cursor/skills/*`          | Nuevo   | Skills de Cursor                                 |
| `docs/`                     | Modificado | Limpieza y nueva estructura                     |
| `next.config.js`            | Modificado | Config relacionada al bundle                   |
| `package.json`              | Modificado | Dependencias y scripts                         |

---

## Recomendaciones

1. **Verificar deploy en Vercel** y que el bundle del middleware esté bajo 1 MB.
2. **Probar flujos** descritos en `docs/pasos/refactor-auth-middleware-reducir-bundle.md`.
3. **No importar** `lib/auth-middleware` fuera de `middleware.ts`.
4. **Usar** `useAuth` en client components que necesiten sesión; `useAuthWithRetry` cuando se requiera resiliencia.
5. **Priorizar** Server Components y layouts para protección de rutas según Auth.js v5.

---

**Documento generado a partir del análisis del repositorio.**  
**Última revisión:** Febrero 2026
