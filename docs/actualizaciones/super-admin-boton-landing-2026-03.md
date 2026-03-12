# Super Admin: botón "Ir al sitio principal" lleva a la landing

**Fecha:** Marzo 2026  
**Componente:** `app/super-admin/components/SuperAdminLayoutContent.tsx`

---

## Problema

El botón con título "Ir al sitio principal" (ícono Home en el header del panel Super Admin) navegaba a `/dashboard`. Ese dashboard no pertenece a ningún tenant, por lo que el comportamiento era confuso y no coincidía con la etiqueta "sitio principal".

## Solución

Se cambió el destino del botón para que navegue a la **landing** (`/`), que es la página principal del sitio (pública, sin tenant).

## Cambio realizado

| Antes | Después |
|-------|---------|
| `router.push('/dashboard')` | `router.push('/')` |

**Archivo:** `app/super-admin/components/SuperAdminLayoutContent.tsx`  
**Línea:** ~70 (botón con `title="Ir al sitio principal"`).

## Notas

- El panel Super Admin es global y no está asociado a un tenant; por eso "sitio principal" debe ser la landing, no un dashboard de club.
- Se añadió un comentario en el código que referencia este documento para futuras modificaciones.
