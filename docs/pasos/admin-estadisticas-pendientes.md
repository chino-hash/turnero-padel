# Pendientes - Pestaña Estadísticas

**Ruta:** `/admin-panel/estadisticas`  
**Archivo principal:** `app/admin-panel/estadisticas/page.tsx`  
**Hook:** `hooks/useEstadisticas.ts`  
**API:** `app/api/estadisticas/route.ts`

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
- Librerías sugeridas: Recharts, Chart.js
