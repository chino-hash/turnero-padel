# Análisis: raíz vs subcarpeta `turnero-padel`

**Limpieza realizada:** La subcarpeta `turnero-padel` fue eliminada del repo. Lo útil se portó a la raíz (ver más abajo).

---

## Resumen ejecutivo

- **Proyecto activo:** la **raíz** del repo (`turnero de padel/`). Ahí corres `npm run dev` y está el código multi-tenant actual.
- **Subcarpeta `turnero-padel/`:** versión **antigua single-tenant**, incompatible con la base de datos y el modelo actual. Casi todo está obsoleto; solo un par de cosas son reutilizables si se portan a la raíz.

**Recomendación:** tratar la subcarpeta como obsoleta, portar lo que interese (análisis de usuarios) a la raíz, actualizar 2 scripts que referencian `turnero-padel/.env.local` y luego eliminar la carpeta `turnero-padel/` del repo.

---

## 1. Qué está en la raíz (y se usa)

| Área | Estado |
|------|--------|
| **Multi-tenant** | Modelo `Tenant`, `User.tenantId`, `lib/tenant/`, `lib/encryption/`, `lib/services/tenants/`, `lib/utils/permissions.ts`, `lib/utils/tenant-slug-storage.ts` |
| **Rutas** | `app/super-admin/`, `app/club/[slug]/`, `app/api/tenants/`, `app/api/auth/set-tenant-slug/` |
| **Prisma** | `schema.prisma` con `Tenant` y `User.tenantId` |
| **Scripts** | `add-superadmin.js`, `bootstrap-tenant.js`, `migrate-to-multitenant.ts`, etc. |
| **Build** | `tsconfig.json` con `"exclude": ["node_modules", "turnero-padel"]` → la subcarpeta no se compila |
| **Vercel** | `vercel.json` en raíz **sin** `rootDirectory` → despliegue desde raíz |

La raíz es la única base de código que compila, corre y se despliega hoy.

---

## 2. Qué está obsoleto en la subcarpeta `turnero-padel/`

### 2.1 Modelo de datos incompatible

- **Prisma (subcarpeta):** `User` sin `tenantId`, `email` como `@unique` global. No existe modelo `Tenant`.
- **Prisma (raíz):** `User.tenantId`, relación con `Tenant`, `email` único por tenant.

Si ejecutaras la app desde `turnero-padel/` contra la DB actual, el cliente Prisma y las tablas no coincidirían. La subcarpeta **no es ejecutable** contra tu base actual.

### 2.2 Código que la raíz ya supera

- **App:** sin `super-admin`, sin `club/[slug]`, sin `api/tenants`, sin `api/auth/set-tenant-slug`. Versión anterior del admin (p. ej. `admin-panel/estadisticas` en otra ruta).
- **Lib:** sin `lib/tenant/`, sin `lib/encryption/`, sin `lib/services/tenants/`, sin `lib/utils/permissions.ts` ni `tenant-slug-storage.ts`. Sin `lib/utils/extras.ts` en la misma forma que la raíz.
- **Config:** `turnero-padel/vercel.json` con `"rootDirectory": "turnero-padel"` → pensado para cuando el deploy era desde esa carpeta; hoy el deploy es desde la raíz, este archivo sobra.

### 2.3 Archivos basura o de una sola vez

- Archivos que parecen salida de comandos pegados por error: `--date=local`, `--date=short -10`, `--date=short HEAD~5..HEAD`, `e --abbrev-ref HEAD`, y el archivo con nombre largo tipo `augment-projectsturnero de padel' ; npm run dev...`.
- Scripts de migración/fix ya aplicados: `fix-*.js`, `debug-*.js`, `migrate-*.md`, `MIGRATION-*.md`, `INSTRUCCIONES_MIGRACION_POSTGRESQL.md`, etc.
- Docs de proceso: `DOCKER-SETUP.md`, `lo-siguiente-que-hacer.md`, `AUDITORIA_SEGURIDAD_REPORTE.md`, etc. (referencia, no código activo).
- **Cypress:** config y fixtures en `turnero-padel/`; en la raíz se usan tests en `tests/e2e` (Playwright). No hay indicios de que Cypress se use en el flujo actual.
- **Docker:** `docker-compose.yml` solo en subcarpeta; la raíz no lo usa.
- **Playwright:** `playwright-report/` y artefactos de runs dentro de la subcarpeta; los specs útiles están (o pueden estar) en la raíz en `tests/e2e/`.

Todo esto en la subcarpeta es obsoleto o de apoyo puntual, no parte del producto actual.

---

## 3. Qué tiene solo la subcarpeta y podría interesarte (portar a raíz)

### 3.1 Análisis de usuarios (datos reales)

- **Raíz:** `app/admin-panel/admin/usuarios/page.tsx` usa datos **estáticos** (listas hardcodeadas de usuarios, descuentos, estadísticas).
- **Subcarpeta:** misma página usa **datos reales** vía:
  - `hooks/useAnalisisUsuarios.ts`
  - `app/api/usuarios/analisis/route.ts` (consultas a Prisma: total usuarios, activos, reservas, etc.)

Esa API y el hook están pensados para **single-tenant** (sin filtrar por `tenantId`). Si quieres la misma funcionalidad en la raíz:

1. Copiar a la raíz:
   - `hooks/useAnalisisUsuarios.ts`
   - `app/api/usuarios/analisis/route.ts`
2. En la API y en el hook, **filtrar siempre por `tenantId`** (o por el tenant del usuario de sesión / superadmin) para que sea multi-tenant.
3. Sustituir en `app/admin-panel/admin/usuarios/page.tsx` de la raíz el contenido estático por el uso de `useAnalisisUsuarios` (como en la subcarpeta), una vez adaptado a tenant.

### 3.2 Tests E2E

- Subcarpeta tiene `payment-preference-flow.spec.ts`; la raíz tiene `api-sse-events.spec.ts` y más specs en `tests/e2e/`. Si en la raíz no existe un test equivalente a `payment-preference-flow`, se puede copiar y adaptar (rutas/tenant) a `tests/e2e/`.

### 3.3 Documentación

- En `turnero-padel/docs/` hay plantillas (API, componente, servicio, hook) y guías (Vercel, Mercado Pago, etc.). Si te son útiles, copia los que uses a `docs/` en la raíz y luego no dependes de la subcarpeta.

---

## 4. Dependencias de la raíz hacia `turnero-padel/`

Solo **dos scripts** en la raíz usan la subcarpeta como fallback de env:

1. **`scripts/add-superadmin.js`**  
   - Carga `turnero-padel/.env.local` como override.  
   - **Cambio:** usar solo `.env` y `.env.local` de la raíz (quitar la línea que apunta a `turnero-padel`).

2. **`scripts/bootstrap-tenant.js`**  
   - Fallback a `turnero-padel/.env.local` y `turnero-padel/.env`.  
   - **Cambio:** cargar solo `.env` y `.env.local` de la raíz (eliminar el bloque `turnero-padel/`).

Tu `.env.local` útil está en la raíz (o en `turnero-padel` solo por costumbre); el servidor ya corre desde la raíz, así que lo coherente es que los scripts lean solo la raíz.

---

## 5. Mejor opción recomendada

1. **Decisión:** considerar la subcarpeta `turnero-padel/` obsoleta y dejar un solo código activo en la **raíz**.
2. **Antes de borrar la subcarpeta:**
   - Si quieres análisis de usuarios con datos reales: portar `useAnalisisUsuarios` y `app/api/usuarios/analisis/route.ts` a la raíz y adaptarlos a multi-tenant (filtrar por tenant).
   - Revisar si falta en la raíz algún test E2E (p. ej. `payment-preference-flow`) y copiarlo a `tests/e2e/`.
   - Copiar a `docs/` de la raíz cualquier doc de `turnero-padel/docs/` que sigas usando.
3. **Actualizar scripts en la raíz:**
   - En `scripts/add-superadmin.js`: quitar la línea que carga `turnero-padel/.env.local`.
   - En `scripts/bootstrap-tenant.js`: quitar el fallback a `turnero-padel/.env.local` y `turnero-padel/.env`.
4. **Eliminar la subcarpeta del repo:**
   - Borrar la carpeta `turnero-padel/` del disco.
   - Hacer un commit que elimine todo su contenido del historial de Git (o al menos del árbol actual), para que el repo solo tenga el proyecto en la raíz.

Con esto evitas duplicación, confusión y el riesgo de editar por error la versión antigua. Si quieres, el siguiente paso puede ser aplicar los cambios en `add-superadmin.js` y `bootstrap-tenant.js` y, si lo indicas, esbozar los cambios concretos para portar la API y el hook de análisis de usuarios a la raíz con multi-tenant.
