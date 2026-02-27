---
name: Landing login y menú usuario
overview: "Cambiar el flujo de login desde la landing para volver a la landing tras iniciar sesión, mostrar avatar de Google en lugar del botón \"Iniciar sesión\", y añadir menú con opciones: \"Ir a mi club\" (si tiene tenant), \"Panel Super Admin\" (si es superadmin) y cerrar sesión."
todos: []
isProject: false
---

# Plan: Landing con sesión, avatar y "Ir a mi club"

## Objetivo

- Login desde la landing redirige de vuelta a la landing (no al dashboard).
- En la landing, si hay sesión: mostrar avatar de Google y un menú con "Ir a mi club" (si el usuario tiene tenant), "Panel Super Admin" (si es superadmin) y cerrar sesión.
- "Ir a mi club" debe comportarse igual que entrar con la URL del tenant (dashboard con ese club).

## Archivos clave

- app/page.tsx, components/LandingPage.tsx, app/login/page.tsx, middleware.ts, lib/tenant/context.ts

## Implementación realizada

1. **middleware.ts**: redirectUrl acepta `'/'` cuando callbackUrl es `'/'`.
2. **app/login/page.tsx**: redirect post-login usa `params.callbackUrl ?? '/'`.
3. **LandingPage.tsx**: todos los enlaces de login usan `callbackUrl=/`.
4. **app/page.tsx**: async, auth(), getTenantFromId si hay tenantId, pasa session, tenantSlug, tenantName (solo si tenant activo).
5. **LandingPage.tsx**: props session, tenantSlug, tenantName; header desktop y móvil con avatar + dropdown o "Iniciar sesión"; "Reservar Ahora" condicional; menú con "Ir a mi club", "Panel Super Admin", "Cerrar sesión"; cierre del drawer móvil al clic.

## Verificación manual sugerida

- Sin sesión: Iniciar sesión → Google → vuelve a `/`, se ve avatar.
- Con tenant: aparece "Ir a mi club" / "Ir a {nombre}"; lleva al dashboard del club.
- Superadmin: aparece "Panel Super Admin"; lleva a `/super-admin`.
- Cerrar sesión: redirige a `/` y vuelve el botón "Iniciar sesión".
- Flujo desde club: `/club/[slug]` sin sesión → login → debe ir al dashboard de ese club (no a la landing).
