# Fix: Cerrar sesión no funcionaba en Vercel (sí en local)

**Fecha:** Marzo 2026  
**Problema:** El botón "Cerrar sesión" no cerraba la sesión en producción (Vercel); en local funcionaba correctamente.

---

## Contexto del problema

- En **local** el usuario podía cerrar sesión sin problemas.
- En **Vercel** al pulsar "Cerrar sesión" la sesión no se cerraba (el usuario seguía autenticado o la cookie no se eliminaba).

---

## Causa raíz

En `lib/auth.ts` la cookie de sesión de NextAuth tenía en producción la opción **`domain`** definida así:

```ts
domain: isProduction ? authConfig.url?.replace(/https?:\/\//, '') : undefined
```

En Vercel el host de la petición puede no coincidir exactamente con el valor de `NEXTAUTH_URL` (por ejemplo por redirecciones, URLs de preview o dominio personalizado). Cuando el `domain` de la cookie no coincide con el host real de la petición, el navegador no envía/borra correctamente la cookie en la llamada a `/api/auth/signout`, por lo que el signOut no surte efecto.

---

## Cambios realizados

### `lib/auth.ts` – cookies de sesión

- Se **eliminó** la opción `domain` de la cookie `sessionToken` en producción.
- La cookie queda asociada al **host de la petición** (comportamiento por defecto del navegador cuando no se fija `domain`).
- Así, al cerrar sesión en la misma URL desde la que el usuario está usando la app, la cookie se borra correctamente tanto en local como en Vercel.

**Fragmento actual:**

```ts
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction
      // No fijar 'domain' en producción: en Vercel el host puede ser la URL de deployment
      // (p. ej. xxx.vercel.app). Si domain no coincide con el host real, signOut no borra la cookie.
    }
  },
  // ... resto de cookies
}
```

---

## Comprobaciones en Vercel

1. **Variable `NEXTAUTH_URL`**  
   En el proyecto de Vercel → Settings → Environment Variables debe estar definida y ser la URL real de la app en producción (p. ej. `https://tu-app.vercel.app` o tu dominio propio).

2. **Nuevo deploy**  
   Tras subir este cambio, hacer un nuevo deploy para que la nueva configuración de cookies se aplique.

---

## Referencias

- NextAuth: la cookie sin `domain` se asocia al host actual y se puede limpiar correctamente en signOut.
- `trustHost: true` ya estaba configurado en la config de NextAuth (adecuado para Vercel).
