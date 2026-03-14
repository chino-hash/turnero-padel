# Admin Turnos: flujo Pendiente de cierre (2026-03)

**Fecha:** Marzo 2026  
**Ruta:** `/admin-panel/admin/turnos`  
**Referencia:** [.cursor/plans/flujo-terminar-turno-admin-iterado.plan.md](../../.cursor/plans/flujo-terminar-turno-admin-iterado.plan.md)

Documentación de la corrección del flujo de estados en la pestaña Turnos del admin: los turnos cuya hora ya terminó dejan de mostrarse en "Confirmados" y pasan a la sección **Pendiente de cierre** hasta que el admin pulse "Terminar turno" para llevarlos a Completados.

---

## 1. Flujo correcto de estados

| Fase | Condición (tiempo) | Estado en BD | Sección en UI |
|------|--------------------|-------------|---------------|
| Confirmado | `now < start` | CONFIRMED | TURNOS CONFIRMADOS |
| En curso | `now >= start && now < end` | CONFIRMED | TURNOS EN CURSO |
| Pendiente de cierre | `now > end` | CONFIRMED | PENDIENTE DE CIERRE |
| Completado | admin pulsó "Terminar turno" | COMPLETED | TURNOS COMPLETADOS |
| Cerrado | admin pulsó "Cerrar turno" (saldo 0) | COMPLETED + closedAt | TURNOS CERRADOS |

No hay transición automática en backend por tiempo: el paso a COMPLETED solo ocurre cuando el admin ejecuta "Terminar turno". La categoría "en curso" / "pendiente de cierre" se calcula en front con `getCategoryAndRemaining(booking)` según la hora actual.

---

## 2. Cambios implementados

### 2.1 Botón "Terminar turno"

- **Antes:** Solo visible cuando la categoría era `in_progress` (turno dentro del horario). Al pasar la hora, la categoría pasaba a `awaiting_completion` y el botón desaparecía; el turno volvía a listarse en "Confirmados".
- **Ahora:** El botón se muestra cuando `category === 'in_progress'` **o** `category === 'awaiting_completion'`, de modo que el admin puede terminar el turno tanto durante el horario como después de que terminó.

**Archivo:** `components/AdminTurnos.tsx` (condición `showTerminarTurno`).

### 2.2 Sección "PENDIENTE DE CIERRE"

- **confirmedDerived:** Solo incluye turnos con `category === 'confirmed'` (ya no se mezclan los `awaiting_completion`).
- **awaitingCompletionDerived:** Nuevo `useMemo` que filtra por `category === 'awaiting_completion'`.
- **Nueva sección** entre "TURNOS EN CURSO" y "TURNOS COMPLETADOS":
  - Título: **PENDIENTE DE CIERRE** con estilo ámbar (`bg-amber-50`, `text-amber-800`, `border-amber-200`).
  - Muestra la cantidad en el header cuando hay ítems: `PENDIENTE DE CIERRE (N)`.
  - Lista de cards con el mismo patrón que En curso; badge "Pendiente de cierre · 00:00" (contador en cero).
  - Sección colapsable (estado `awaitingSectionCollapsed`, por defecto abierta), con botón chevron y `data-testid="expand-awaiting-section"`.
  - Contenedor de la sección con `data-testid="section-awaiting-completion"`.
  - Al expandir una card se usa el mismo `renderExpandedContent`, donde aparece "Terminar turno" y "Cancelar".

### 2.3 Cancelar reserva en Pendiente de cierre

- **Antes:** El botón "Cancelar" estaba deshabilitado para turnos con categoría `awaiting_completion`.
- **Ahora:** Se permite cancelar también cuando `cat === 'awaiting_completion'` (p. ej. no-show), incluyendo esa categoría en la condición `isConfirmadoOrEnCurso`.

### 2.4 Filtros (Estado)

- **Dropdown Estado:** Nueva opción "Pendiente de cierre" (`value="awaiting_completion"`) en ambos selectores (modal de filtros y barra de filtros en vista lista).
- **Filtro "Confirmados":** Solo turnos con `getCategoryAndRemaining(booking).category === 'confirmed'` (futuros); ya no incluye `awaiting_completion`.
- **Filtro "Pendiente de cierre":** Muestra solo turnos con `category === 'awaiting_completion'`.
- **Export CSV:** Con filtro "Pendiente de cierre" se pide al API `status: CONFIRMED`; en cliente se filtra el resultado por `category === 'awaiting_completion'` antes de generar el CSV.

### 2.5 Tests E2E / data-testid

- `data-testid="section-awaiting-completion"` en el contenedor de la sección Pendiente de cierre.
- `data-testid="expand-awaiting-section"` en el botón de expandir/colapsar.
- Los botones "Terminar turno" siguen usando `data-testid="admin-terminar-turno-btn-{idx}"` en todas las secciones (En curso y Pendiente de cierre).

---

## 3. Orden de secciones en la lista

1. Turnos fijos  
2. Turnos confirmados  
3. Turnos en curso  
4. **Pendiente de cierre** (nueva)  
5. Turnos completados  
6. Turnos cerrados  

---

## 4. Archivos modificados

| Área | Archivo |
|------|---------|
| Botón Terminar turno / Cancelar | `components/AdminTurnos.tsx` |
| confirmedDerived / awaitingCompletionDerived | `components/AdminTurnos.tsx` |
| Sección Pendiente de cierre (UI, colapsable, testid) | `components/AdminTurnos.tsx` |
| Filtros (dropdown + useEffect + export CSV) | `components/AdminTurnos.tsx` |

---

## 5. Documentación relacionada

- [.cursor/skills/turnero-padel-domain/SKILL.md](../../.cursor/skills/turnero-padel-domain/SKILL.md) – Estados de reserva (PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED).
- [docs/actualizaciones/admin-turnos-pendientes-completado-2026-03.md](admin-turnos-pendientes-completado-2026-03.md) – Plan pendientes (Terminar turno / Cerrar turno).
- [docs/pasos/admin-turnos-pendientes.md](../pasos/admin-turnos-pendientes.md) – Pasos de la pestaña Turnos.
