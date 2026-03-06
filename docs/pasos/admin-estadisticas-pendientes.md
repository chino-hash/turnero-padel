# Pendientes - Pestaña Estadísticas

**Ruta principal:** `/admin-panel/estadisticas`  
**Archivo principal:** `app/admin-panel/estadisticas/page.tsx`  
**Hook:** `hooks/useEstadisticas.ts`  
**API:** `app/api/estadisticas/route.ts`

**Ruta deprecada:** `/admin-panel/admin/estadisticas` → redirige automáticamente a `/admin-panel/estadisticas` (archivo: `app/admin-panel/admin/estadisticas/page.tsx`).

---

## Cambios realizados (alineados con el proyecto)

- **Rutas:** La navegación del panel (AdminLayoutContent) enlaza a `/admin-panel/estadisticas`. La ruta antigua `/admin-panel/admin/estadisticas` sigue existiendo pero solo redirige a la ruta principal con datos reales.
- **Layout unificado:** La página de estadísticas usa el mismo bloque de título que el resto del admin (título con `font-light`, línea naranja, descripción, botón "Actualizar" con `flex-shrink-0`). Ver `docs/actualizaciones/admin-panel-sheet-layout-2026-03.md` y `unificacion-titulos-admin-2026-02.md`.
- **Datos:** Los KPIs y métricas se obtienen de la API `/api/estadisticas` (datos reales por tenant).
- **Consistencia con otras pestañas:** La misma estructura de header y layout que Usuarios, Turnos y Torneo (ver `docs/actualizaciones/admin-panel-sheet-layout-2026-03.md` y los docs de pasos de cada pestaña).

---

## Estado actual

La pestaña Estadísticas muestra KPIs, canchas más usadas, horarios pico, resumen de usuarios y resumen financiero mediante barras de progreso y números.

---

## Implementado

- [x] KPIs principales (Reservas hoy, Reservas semana, Ingresos mes, Ocupación)
- [x] Canchas más utilizadas (barras de progreso)
- [x] Horarios pico (barras de progreso)
- [x] Resumen de usuarios (activos, satisfacción, promedio reservas)
- [x] Resumen financiero (recaudado, pendiente, total reservas)
- [x] Botón actualizar

---

## Pendiente para dar por terminada

### 1. Gráficos reales

- Sustituir barras CSS por gráficos (ej. Chart.js o Recharts).
- Gráfico de líneas para evolución de reservas/ingresos.
- Gráfico de barras para canchas y horarios pico.
- Gráfico circular para distribución si aplica.

### 2. Filtro por período

- Selector de período: hoy, semana, mes, trimestre, año.
- Que las métricas y gráficos se recalculen según el período.

### 3. Exportar informe

- Botón para exportar informe en PDF o Excel.
- Incluir todas las métricas y gráficos del período seleccionado.

### 4. Métrica "Satisfacción"

- Confirmar si la satisfacción proviene de encuestas o cálculos reales.
- Si no existe, documentar o sustituir por otro indicador relevante.

### 5. Compatibilidad modo oscuro

- Verificar que los gráficos se vean bien en modo oscuro.
- Usar colores que respeten el tema claro/oscuro.

### 6. Comparativa con período anterior

- Mostrar variación respecto al período anterior (ej. "+15% vs mes anterior").
- Indicar subida/bajada con iconos o colores.

---

## Referencias

- Hook: `hooks/useEstadisticas.ts`
- API: `/api/estadisticas`
- Navegación: `app/admin-panel/components/AdminLayoutContent.tsx` (enlace "Estadísticas" → `/admin-panel/estadisticas`)
- Actualizaciones: `docs/actualizaciones/admin-panel-sheet-layout-2026-03.md`, `unificacion-titulos-admin-2026-02.md`, `unificacion-botones-admin-2026-02.md`
- Librerías sugeridas: Recharts, Chart.js
