# Actualización: clasificación de canchas Exterior/Interior + fix de update en admin

**Fecha:** 2026-04-28  
**Estado:** Implementado y validado en entorno local

## Objetivo

Agregar una clasificación explícita de canchas por tipo (`OUTDOOR` / `INDOOR`) para:

- administrar el tipo desde paneles de gestión,
- mostrar colores semánticos por tipo en UI,
- y garantizar que las canchas por defecto de un tenant nuevo se creen como `OUTDOOR`.

Además, corregir el error de actualización en admin que devolvía *"Error interno del servidor"* al editar una cancha.

## Resumen funcional

- Se incorporó `courtType` al modelo de datos de canchas con default `OUTDOOR`.
- El alta y edición de canchas en admin/super admin ahora incluye selector de tipo.
- Los colores de canchas se derivan por tipo (verde exterior, azul interior), reemplazando la lógica principal por índice/número.
- Al crear tenant y canchas bootstrap, el tipo por defecto queda explícitamente en `OUTDOOR`.
- Se invalida/refresca caché de canchas al evento SSE `courts_updated`.
- Se corrige el flujo de `PUT /api/courts` para updates parciales y se mejora el diagnóstico de errores.

## Cambios técnicos principales

### 1) Base de datos y Prisma

- `prisma/schema.prisma`
  - Nuevo enum `CourtType` (`OUTDOOR`, `INDOOR`).
  - Nuevo campo `Court.courtType` con default `OUTDOOR`.
- Migración SQL manual aplicada para compatibilidad de entorno:
  - crear enum si no existe,
  - agregar columna si no existe,
  - backfill de nulos a `OUTDOOR`,
  - default y `NOT NULL`.

### 2) Validación y contratos

- `types/types.ts`
  - `Court` ahora incluye `courtType`.
- `lib/validations/court.ts`
  - `courtCreateSchema`: `courtType` con default `OUTDOOR`.
  - `courtUpdateSchema`: soporta actualización parcial de `courtType`.

### 3) Colores por tipo

- `lib/court-colors.ts`
  - Se consolidan helpers por tipo:
    - `normalizeCourtType`
    - `getCourtFeaturesByType`
    - `getCourtHexByType`
  - Mapeo semántico:
    - `OUTDOOR` → familia verde
    - `INDOOR` → familia azul

### 4) Servicios y API de canchas

- `lib/services/courts.ts`
  - `createCourt` y `updateCourt` soportan `courtType`.
  - `transformCourtData` devuelve colores en base a `courtType`.
  - `updateCourt` armado de `prismaData` campo por campo para evitar valores inválidos en updates parciales.
  - Si se actualiza `courtType`, se sincroniza `features` con colores del tipo.
- `app/api/courts/route.ts`
  - `PUT` valida payload con Zod y ejecuta update parcial.
  - Se añadieron logs de diagnóstico de `PUT` (payload validado y errores detallados) para troubleshooting.
  - Respuesta de error del `PUT` devuelve mensaje real de excepción en lugar de genérico.

### 5) Defaults de tenant y bootstrap

- `app/api/tenants/route.ts`
- `lib/services/tenants/bootstrap.ts`

En ambos casos, las canchas iniciales se crean con:

- `courtType: 'OUTDOOR'`
- `features` derivados del helper por tipo `OUTDOOR`.

### 6) UI de administración

- `app/admin-panel/admin/canchas/page.tsx`
  - Selector `Tipo de cancha` en alta/edición.
  - Badge visual de tipo en cards/listado.
  - Payload de edición compatible con update parcial.
- `app/super-admin/tenants/[id]/page.tsx`
  - Alta de cancha incluye tipo (`OUTDOOR` / `INDOOR`).

### 7) UI pública / reservas

- `components/HomeSection.tsx`
  - Colores de cancha y slots basados en `courtType` (no por índice como criterio principal).
- `components/TurneroApp.tsx`
  - Priorización de `courtType` para visualización mini-canchas (interior/exterior).

### 8) Estado cliente y sincronización

- `components/providers/AppStateProvider.tsx`
  - Versionado de caché de canchas (`courts_cache_v2`).
  - Invalidación y refetch ante evento SSE `courts_updated`.

## Bugfix registrado: error al actualizar tipo de cancha

### Síntoma

Al editar una cancha y presionar **Actualizar**, se mostraba toast de error interno del servidor.

### Causa abordada

Fragilidad en updates parciales del backend (normalización de payload) y falta de visibilidad del error real.

### Corrección aplicada

- Normalización de `updateCourt` para construir payload de Prisma de forma explícita.
- Ignorar `tenantId` vacío en update.
- Sincronizar `features` cuando cambia `courtType`.
- Mejorar logging y mensaje de error de `PUT /api/courts`.

### Verificación

Se ejecutó actualización de cancha con cambio de `courtType` en admin y el backend respondió:

- `PUT /api/courts 200`
- `UPDATE` exitoso en Prisma.

## Impacto y compatibilidad

- Compatible con datos existentes vía migración con backfill.
- Mantiene aislamiento multitenant.
- El campo `features` queda alineado al tipo de cancha al crear/editar, evitando inconsistencias visuales.

## Archivos clave modificados

- `prisma/schema.prisma`
- `prisma/migrations/20260428193000_add_court_type/migration.sql`
- `lib/court-colors.ts`
- `types/types.ts`
- `lib/validations/court.ts`
- `lib/services/courts.ts`
- `app/api/courts/route.ts`
- `app/api/tenants/route.ts`
- `lib/services/tenants/bootstrap.ts`
- `app/admin-panel/admin/canchas/page.tsx`
- `app/super-admin/tenants/[id]/page.tsx`
- `components/HomeSection.tsx`
- `components/TurneroApp.tsx`
- `components/providers/AppStateProvider.tsx`

