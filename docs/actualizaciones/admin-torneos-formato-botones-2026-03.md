# Admin Torneos: orden y preselección de botones de formato

**Fecha:** 4 de marzo de 2026

Documentación de los cambios en la sección "Formato del torneo" del Paso 1 del wizard de creación/edición de torneos (`/admin-panel/admin/torneos`): inversión del orden de los botones y preselección del botón izquierdo.

---

## Objetivo

1. **Orden visual:** Invertir las posiciones de los dos botones de formato del torneo en pantalla.
2. **Preselección:** Mantener preseleccionado el botón que queda a la izquierda (igual que antes del cambio).

---

## Cambios realizados

### 1. Orden de los botones (Formato del torneo)

| Antes | Después |
|------|--------|
| Izquierda: **Eliminatoria directa** | Izquierda: **Fase de grupos + Doble Eliminatoria** |
| Derecha: **Fase de grupos + Doble Eliminatoria** | Derecha: **Eliminatoria directa** |

En el JSX de `app/admin-panel/admin/torneos/page.tsx` se intercambió el orden de los dos `<button>` dentro del contenedor `div.flex.flex-wrap.gap-2` de la sección "Formato del torneo": primero se renderiza el botón "Fase de grupos + Doble Eliminatoria", luego "Eliminatoria directa".

### 2. Valor por defecto y preselección

- **Antes:** El formato por defecto era `DIRECT_ELIMINATION` (Eliminatoria directa), que era el botón de la izquierda.
- **Después:** El formato por defecto pasó a ser `GROUPS_DOUBLE_ELIMINATION` (Fase de grupos + Doble Eliminatoria), de modo que el botón de la **izquierda** sigue siendo el preseleccionado al cargar o resetear el formulario.

Cambios concretos:

| Ubicación | Cambio |
|-----------|--------|
| Estado inicial `useState` | `"DIRECT_ELIMINATION"` → `"GROUPS_DOUBLE_ELIMINATION"` |
| Reset tras publicar torneo | `setTournamentFormat("DIRECT_ELIMINATION")` → `setTournamentFormat("GROUPS_DOUBLE_ELIMINATION")` |
| Reset al volver (botón cancelar/salir del crear/editar) | `setTournamentFormat("DIRECT_ELIMINATION")` → `setTournamentFormat("GROUPS_DOUBLE_ELIMINATION")` |

Al **editar** un torneo existente, el formato se sigue cargando desde el torneo (`selectedTorneo.tournamentFormat`), por lo que no se ve afectado.

---

## Resumen por archivo

| Archivo | Cambios |
|---------|--------|
| **app/admin-panel/admin/torneos/page.tsx** | Orden de los dos botones de formato invertido en el DOM; valor por defecto de `tournamentFormat` y resets actualizados a `GROUPS_DOUBLE_ELIMINATION`. |

---

## Notas

- La lógica de premios, número de grupos y vistas condicionadas por `tournamentFormat` no cambia; solo el orden visual y el valor por defecto.
- Los torneos ya creados o guardados con formato "Eliminatoria directa" siguen mostrando ese formato al editarlos.
