# Sección TURNOS CERRADOS: colapsable y limpieza a la mañana siguiente (2026-03)

**Fecha:** Marzo 2026  
**Ruta:** `/admin-panel/admin/turnos`  
**Componente:** `components/AdminTurnos.tsx`

Resumen de los cambios en la sección **TURNOS CERRADOS**: sección colapsable por defecto y ocultación automática de los cerrados del día anterior a partir de las 06:00 del día siguiente.

---

## 1. Sección colapsable

- **Objetivo:** Evitar que la vista se sature de información; la sección de turnos cerrados puede ser larga.
- **Comportamiento:**
  - Estado `closedSectionCollapsed` con valor inicial `true` (sección **cerrada** al cargar).
  - El encabezado "TURNOS CERRADOS" incluye un botón (chevron ▼/▲) que alterna la visibilidad del contenido.
  - Cuando hay turnos visibles, se muestra el contador en el título, p. ej. "TURNOS CERRADOS (5)".
  - La lista compacta y los botones "Mostrar más" / "Mostrar menos" solo se renderizan cuando `!closedSectionCollapsed`.
- **Patrón:** Igual que la sección "TURNOS CONFIRMADOS" (`confirmedSectionCollapsed`), con botón ghost y `ChevronDown`/`ChevronUp`.

---

## 2. Limpieza a la mañana siguiente (06:00)

- **Objetivo:** Los turnos cerrados el día D no permanecen indefinidamente; se ocultan a la mañana del día siguiente (no a las 00:00).
- **Regla:** Un turno con `closedAt` en la fecha D se deja de mostrar cuando la hora actual es **≥ día D+1 a las 06:00** (hora fija en hora local).
- **Implementación:**
  - Constante `CLEAN_CLOSED_AT_HOUR = 6` en `AdminTurnos.tsx`.
  - Lista derivada `closedVisibleDerived`: filtra `closedDerived` manteniendo solo los turnos para los que `now < cleanupThreshold`, siendo `cleanupThreshold` = fecha de `closedAt` + 1 día, con hora 06:00:00.
  - La sección (título, lista, "Mostrar más/menos") usa siempre `closedVisibleDerived` en lugar de `closedDerived`.
- **Ejemplo:** Cerrado el 5/3/2026 a las 22:30 → visible hasta el 6/3/2026 05:59:59; a partir del 6/3/2026 06:00:00 ya no se muestra.

---

## 3. Archivos modificados

- `components/AdminTurnos.tsx`:
  - Nuevo estado `closedSectionCollapsed` (default `true`).
  - Constante `CLEAN_CLOSED_AT_HOUR` y `useMemo` para `closedVisibleDerived`.
  - Bloque de la sección TURNOS CERRADOS: encabezado con botón colapsar, contenido condicional y uso de `closedVisibleDerived`.

---

## 4. Documentación relacionada

- [Funcionalidad Completa Admin Turnos](../admin/admin-turnos-funcionalidad-completa.md) — sección 2.5.
