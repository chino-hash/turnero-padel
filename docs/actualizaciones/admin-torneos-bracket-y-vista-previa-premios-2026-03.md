# Admin Torneos: cuadro visual bracket y vista previa de premios

**Fecha:** marzo 2026

Documentación de los cambios realizados en la sección de torneos (`/admin-panel/admin/torneos`): cuadro eliminatorio visual (bracket) en la pestaña Fixture y vista previa de premios en el wizard de creación según formato del torneo (eliminatoria directa vs fase de grupos + doble eliminatoria).

---

## Objetivo

1. **Cuadro visual tipo bracket:** Sustituir la lista en grid de partidos por un cuadro eliminatorio visual con rondas en columnas y líneas de conexión entre partidos, solo para torneos en formato Eliminatoria directa.
2. **Vista previa de premios:** Mostrar en el panel derecho del wizard los premios realmente configurados y, cuando el formato es "Fase de grupos + Doble Eliminatoria", distinguir Premios Liga de Oro y Premios Liga de Plata en lugar de un único "1er / 2do lugar".

---

## Resumen de cambios por archivo

| Archivo | Cambios |
|---------|--------|
| **lib/tournament-bracket.ts** | Nuevo: tipo `BracketMatch`, `getBracketRounds()` (filtro `groupId === null`, agrupación por ronda, orden por cantidad de partidos descendente), `getRoundLabel()`. |
| **components/admin/BracketElimination.tsx** | Nuevo: componente de cuadro eliminatorio (columnas por ronda, celdas de partido, conectores SVG, accesibilidad). Uso de `Fragment` para devolver un solo nodo por ronda en el `map`. |
| **app/admin-panel/admin/torneos/page.tsx** | Objeto `preview` ampliado con formato, tipo de premio y premios Oro/Plata; sección Premios de la vista previa condicional (Liga de Oro/Plata vs 1er/2do lugar); integración de `BracketElimination` en Fixture para eliminatoria directa con partidos. |

---

## 1. Cuadro visual tipo bracket

### Alcance

- Solo torneos con formato **Eliminatoria directa** (`DIRECT_ELIMINATION`).
- Los partidos con `groupId !== null` (fase de grupos) se excluyen del bracket mediante el filtro en `getBracketRounds`.

### Utilidad `lib/tournament-bracket.ts`

- **`BracketMatch`:** Interfaz mínima con `id`, `round`, `positionInRound`, `registration1Label`, `registration2Label`, `winnerLabel`, `score`.
- **`getBracketRounds(matches)`:** Filtra por `groupId == null`, agrupa por `round`, ordena partidos por `positionInRound` y ordena las rondas por **cantidad de partidos descendente** (primera ronda = más partidos).
- **`getRoundLabel(round)`:** Devuelve etiqueta en español (Cuartos, Semifinales, Final, etc.).

### Componente `BracketElimination`

- **Props:** `matches` (compatible con los partidos devueltos por la API, con `groupId` opcional), `roundLabels` opcional.
- **Layout:** Una columna por ronda; cada partido se coloca en la fila del grid que corresponde a su llave (partido en ronda `r`, posición `p` alimenta ronda `r+1`, posición `p >> 1`).
- **Celdas:** Muestran pareja 1 vs pareja 2 ("Bye" si falta), resultado y ganador resaltado (negrita + color).
- **Conectores:** SVG entre columnas con forma de "T" uniendo cada dos partidos al de la siguiente ronda.
- **Accesibilidad:** `role="region"` y `aria-label` en el cuadro; en cada celda `role="article"` y `aria-label` con partido, resultado y ganador.
- **Sintaxis JSX:** El `map` sobre rondas devuelve un único nodo por iteración usando `<Fragment key={bracketRound.round}>` que envuelve la columna de la ronda y el `ConnectorSvg` condicional, evitando el error "Expected '</', got '{'".

### Integración en la página de torneos

- En la pestaña **Fixture / Cuadro**, cuando `selectedTorneo?.tournamentFormat !== "GROUPS_DOUBLE_ELIMINATION"` y `partidos.length > 0`:
  - Se reemplaza el grid de tarjetas por `<BracketElimination matches={partidos} />`.
  - Contenedor con `overflow-x-auto` y borde para scroll horizontal en pantallas pequeñas.
- El texto descriptivo pasa a "Cuadro eliminatorio (N partidos)".

---

## 2. Vista previa de premios en el wizard

### Objeto `preview` ampliado

Se añaden al `useMemo` de `preview`:

- `tournamentFormat`, `prizeIsMonetary`
- `prizeFirst`, `prizeSecond`, `prizeFirstDescription`, `prizeSecondDescription`
- `prizeGoldFirst`, `prizeGoldSecond`, `prizeSilverFirst`, `prizeSilverSecond`
- `prizeGoldFirstDesc`, `prizeGoldSecondDesc`, `prizeSilverFirstDesc`, `prizeSilverSecondDesc`

Así la vista previa refleja en tiempo real el formato elegido y todos los premios configurados en el formulario.

### Sección Premios en el panel derecho

- **Si formato es "Fase de grupos + Doble Eliminatoria":**
  - **Liga de Oro:** bloque con 1er y 2do lugar mostrando `prizeGoldFirst`/`prizeGoldSecond` (monetario) o `prizeGoldFirstDesc`/`prizeGoldSecondDesc` (no monetario). Borde lateral dorado.
  - **Liga de Plata:** bloque con 1er y 2do lugar mostrando `prizeSilverFirst`/`prizeSilverSecond` o sus descripciones. Borde lateral gris.
- **Si formato es "Eliminatoria directa":**
  - Se mantiene la vista de **1er Lugar** y **2do Lugar** con `prizeFirst`/`prizeSecond` (monetario) o `prizeFirstDescription`/`prizeSecondDescription` (no monetario).

De este modo la previsualización deja de mostrar siempre "1er/2do lugar" con guiones y refleja correctamente las dos ligas cuando el torneo es de fase de grupos + doble eliminatoria, así como los valores monetarios o las descripciones según el tipo de incentivo.

---

## 3. Corrección de sintaxis en BracketElimination

- **Problema:** Dentro del `rounds.map()` se retornaban dos elementos hermanos (la `<div>` de la columna y el bloque condicional `{roundIndex < rounds.length - 1 && (<ConnectorSvg />)}`), lo que generaba el error de compilación "Expected '</', got '{'".
- **Solución:** Envolver ambos en `<Fragment key={bracketRound.round}>` para que el callback del `map` devuelva un único elemento raíz. Se eliminó además un `</div>` sobrante que cerraba un contenedor inexistente.

---

## Referencias

- Plan: [.cursor/plans/cuadro-visual-bracket-torneos.plan.md](../../.cursor/plans/cuadro-visual-bracket-torneos.plan.md).
- Formato y premios en torneos: [admin-torneos-formulario-2026-02.md](admin-torneos-formulario-2026-02.md), [completar-seccion-admin-torneos.plan.md](../../.cursor/plans/completar-seccion-admin-torneos.plan.md).
