# Limpieza: eliminación de la subcarpeta `turnero-padel`

**Fecha:** Febrero 2026

## Resumen

Se eliminó del repositorio la subcarpeta **`turnero-padel/`**, que contenía la versión antigua **single-tenant** del proyecto. El código activo y el despliegue están en la **raíz** del repo (`turnero de padel/`), con modelo multi-tenant y base de datos actual.

## Motivo

- **Raíz:** código multi-tenant actual, Prisma con `Tenant` y `User.tenantId`, rutas `app/super-admin/`, `app/club/[slug]/`, APIs de tenants.
- **Subcarpeta:** versión obsoleta single-tenant, modelo de datos incompatible (User sin tenantId, email único global), no ejecutable contra la base actual.

Mantener ambas generaba duplicación, confusión y riesgo de editar por error la versión antigua.

## Cambios realizados

1. **Eliminación de `turnero-padel/`**
   - Borrada toda la carpeta y su contenido del árbol de trabajo.
   - Incluía: app, components, APIs, tests (Jest/Cypress), documentación interna, configuraciones (Docker, Vercel desde subcarpeta), archivos de migración y scripts ya aplicados.

2. **Scripts en la raíz**
   - `scripts/bootstrap-tenant.js`: carga variables solo desde la raíz (`.env.local` y `.env`). No se referencia `turnero-padel/.env.local`.
   - Cualquier otro script que usara la subcarpeta queda alineado con la raíz.

3. **Configuración**
   - `tsconfig.json`: se eliminó la entrada `turnero-padel` de `exclude` (ya no existe la carpeta; `exclude` queda solo con `node_modules`).

4. **Documentación**
   - Se mantiene `docs/ANALISIS_CARPETA_TURNERO-PADEL.md` como referencia del análisis previo y de qué se podía portar (p. ej. análisis de usuarios con datos reales).
   - Este documento (`docs/LIMPIEZA_TURNERO_PADEL_2026-02.md`) describe la limpieza realizada.

## Resultado

- Un único código activo en la raíz.
- Sin referencias a `turnero-padel` en scripts ni en `tsconfig`.
- Repositorio más simple y alineado con el modelo multi-tenant actual.

## Referencias

- Análisis previo: `docs/ANALISIS_CARPETA_TURNERO-PADEL.md`
- Changelog: `CHANGELOG.md` (entrada [2026-02-12])
