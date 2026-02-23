# Refactorización: Auth ligero para Middleware (reducir bundle Edge < 1 MB)

Guía paso a paso para refactorizar el middleware y bajar el tamaño del Edge Function por debajo del límite de 1 MB del plan Hobby de Vercel.

## Contexto

- **Problema**: El Edge Function "middleware" pesa ~1.03 MB (límite 1 MB).
- **Causa principal**: El archivo WASM (~2.2 MB) y dependencias pesadas (Prisma, Zod, Google provider) se incluyen en el bundle porque el middleware importa `auth` desde `lib/auth.ts`.
- **Objetivo**: Crear un módulo de auth mínimo solo para middleware, sin tocar el flujo de login ni el resto de la app.

## Verificación de tamaño antes/después

```bash
npm run build
node scripts/check-middleware-size.js
```

---

## Paso 1: Crear el módulo de auth ligero

Crear `lib/auth-middleware.ts` con solo lo necesario para validar la sesión en Edge:

```typescript
/**
 * Configuración mínima de NextAuth para el middleware (Edge Runtime).
 * Solo valida JWT y construye la sesión. No incluye providers, Prisma ni Zod.
 */
import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

const config = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || session.user.id
        session.user.role = (token.role as 'USER' | 'ADMIN' | 'SUPER_ADMIN') || 'USER'
        session.user.isAdmin = Boolean(token.isAdmin)
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin)
        session.user.tenantId = (token.tenantId as string | null) || null
      }
      return session
    },
  },
} satisfies NextAuthConfig

export const { auth } = NextAuth(config)
```

**Importante**: El callback `session` debe coincidir con el de `lib/auth.ts` (líneas 340-351) para que la forma de `session.user` sea idéntica.

---

## Paso 2: Cambiar el import en el middleware

En `middleware.ts`, cambiar:

```typescript
// Antes
import { auth } from "./lib/auth"

// Después
import { auth } from "./lib/auth-middleware"
```

Nada más en el middleware: la lógica de rutas, redirecciones y headers permanece igual.

---

## Paso 3: Build y verificación de tamaño

```bash
npm run build
node scripts/check-middleware-size.js
```

- Si el resultado muestra `✅ Dentro del límite`, continuar al Paso 4.
- Si sigue excediendo, revisar si hay otros imports transitivos. Se puede usar `ANALYZE=true npm run build` para inspeccionar el bundle.

---

## Paso 4: Pruebas manuales

Verificar que todo funciona igual:

| Acción | Resultado esperado |
|--------|--------------------|
| Sin login, ir a `/dashboard` | Redirección a `/login` |
| Login con Google | Sesión creada, redirección correcta |
| Usuario normal accede a `/admin-panel` | Redirección a `/auth/error?error=AccessDenied` |
| Admin accede a `/admin-panel` | Acceso permitido |
| Super admin accede a `/super-admin` | Acceso permitido |
| Usuario con tenant accede a `/dashboard` | Acceso permitido |
| Usuario sin tenant en `/dashboard` (sin tenantSlug) | Redirección a `/` |
| APIs públicas (`/api/courts`, etc.) | Sin login, 200 OK |
| Club público (`/club/[slug]`) | Sin login, acceso permitido |

---

## Paso 5: Desplegar en Vercel

Hacer commit, push y desplegar. Confirmar que el deploy no reporta el error de límite de 1 MB.

---

## Qué NO cambiar

- **`lib/auth.ts`**: Sigue siendo la config completa usada por la ruta API `/api/auth/[...nextauth]` (login, callbacks, providers).
- **`app/api/auth/[...nextauth]/route.ts`**: Debe seguir usando `handlers` desde `lib/auth`.
- **Lógica del middleware**: Rutas públicas, protecciones admin, headers `x-tenant-id` y `x-tenant-slug` se mantienen igual.

## Diagrama de imports

```
ANTES:
middleware.ts → lib/auth.ts → next-auth, Google, env.ts (zod), callbacks (getUserRoleAndTenant → Prisma)

DESPUÉS:
middleware.ts → lib/auth-middleware.ts → next-auth (solo secret + session callback)
lib/auth.ts   → (sin cambios, solo lo usa la API route)
```

---

## Rollback rápido

Si algo falla, revertir solo el import en el middleware:

```typescript
import { auth } from "./lib/auth"
```

Y eliminar `lib/auth-middleware.ts` si se creó. No hay cambios en base de datos ni en la API.
