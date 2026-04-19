# Pendientes - Pestaña Estadísticas

> **Nota (abril 2026):** checklist histórico; la fuente de verdad es el código en `app/admin-panel/` y las notas en [`docs/actualizaciones/`](../actualizaciones/).

**Ruta principal:** `/admin-panel/estadisticas`  
**Archivo principal:** `app/admin-panel/estadisticas/page.tsx`  
**Hook:** `hooks/useEstadisticas.ts`  
**API:** `app/api/estadisticas/route.ts`  
**Tipos:** `types/estadisticas.ts`  
**Export:** `lib/export-estadisticas.ts`  
**Validación:** `lib/validations/estadisticas.ts`

**Ruta deprecada:** `/admin-panel/admin/estadisticas` → redirige automáticamente a `/admin-panel/estadisticas` (archivo: `app/admin-panel/admin/estadisticas/page.tsx`).

---

## Cambios realizados (alineados con el proyecto)

- **Rutas:** La navegación del panel (AdminLayoutContent) enlaza a `/admin-panel/estadisticas`. La ruta antigua sigue existiendo y redirige a la ruta principal.
- **Layout unificado:** Misma estructura de título (font-light, línea naranja, descripción, botones con flex-shrink-0). Ver `docs/actualizaciones/admin-panel-sheet-layout-2026-03.md`.
- **Datos:** Métricas por tenant desde `/api/estadisticas` con filtro por período (hoy, semana, mes, trimestre, año).
- **Multitenancy:** La API filtra todas las queries por `tenantId` (obtenido con `getUserTenantIdSafe`). Super-admin tiene la misma visibilidad que el admin del tenant (solo el tenant actual).
- **Visibilidad:** Sin selector de tenant; aislamiento total por tenant.

---

## Estado actual

La pestaña Estadísticas incluye KPIs con comparativa vs período anterior, selector de período, gráficos Recharts (evolución reservas/ingresos, horarios pico), canchas más usadas en tabla (sin gráfico), resumen de usuarios (con tasa de cumplimiento), resumen financiero, exportación PDF/Excel y modo oscuro.

---

## Implementado

- [x] KPIs principales (Reservas, Ingresos, Ocupación, Usuarios activos) con período seleccionable
- [x] Comparativa con período anterior (+X% / -X% con iconos)
- [x] Filtro por período: hoy, semana, mes, trimestre, año
- [x] Gráfico de líneas (Recharts): evolución de reservas e ingresos
- [x] Gráfico de barras (Recharts): horarios pico
- [x] Canchas más utilizadas: tabla (sin gráfico de barras)
- [x] Resumen de usuarios (activos, tasa de cumplimiento %, promedio reservas)
- [x] Resumen financiero (recaudado, pendiente, total reservas como cantidad)
- [x] Botón actualizar
- [x] Exportar PDF y Exportar Excel (jspdf, jspdf-autotable, xlsx)
- [x] Compatibilidad modo oscuro (variables de tema, colores Recharts)
- [x] Accesibilidad: role="img" y aria-label en contenedores de gráficos
- [x] API: multitenancy, createSuccessResponse, Zod para `period`, totalReservas como count
- [x] Satisfacción sustituida por **tasa de cumplimiento** (reservas completadas / no canceladas)

---

## Pendiente (ninguno)

Todos los ítems del plan están implementados.

---

## Referencias

- Hook: `hooks/useEstadisticas.ts`
- API: `app/api/estadisticas/route.ts`
- Tipos: `types/estadisticas.ts`
- Export: `lib/export-estadisticas.ts`
- Validación: `lib/validations/estadisticas.ts`
- Navegación: `app/admin-panel/components/AdminLayoutContent.tsx`
- Dependencias: Recharts, jspdf, jspdf-autotable, xlsx
- Tests: `__tests__/app/api/estadisticas/route.test.ts`
