---
name: Flujo terminar turno admin (iterado)
overview: "Corregir flujo En curso → Completado en Admin Turnos y tapar huecos: botón Terminar turno en awaiting_completion, sección Pendiente de cierre, filtros, cancelar, export, colapsable y tests."
todos:
  - id: boton-terminar
    content: Mostrar botón Terminar turno cuando category === 'in_progress' || 'awaiting_completion'
    status: completed
  - id: derived-y-seccion
    content: confirmedDerived solo 'confirmed'; crear awaitingCompletionDerived y sección PENDIENTE DE CIERRE
    status: completed
  - id: filtros
    content: Filtro Confirmados solo category confirmed; añadir opción Pendiente de cierre; export con awaiting_completion
    status: completed
  - id: cancelar
    content: Permitir Cancelar reserva cuando category === 'awaiting_completion'
    status: completed
  - id: colapsable-testid
    content: Sección Pendiente de cierre colapsable (default abierta), data-testid expand-awaiting-section
    status: completed
  - id: contador-stats
    content: Badge Pendiente de cierre con 00:00; opcional ajustar stat Confirmados por categoría
    status: completed
isProject: false
---

# Plan iterado: Flujo Terminar turno admin (tapando huecos)

Versión que amplía el plan original con filtros, cancelación, export, colapsable, contador y tests.

---

## 1. Flujo correcto (resumen)

- **Confirmados**: CONFIRMED en BD, `now < start`.
- **En curso**: CONFIRMED, `now >= start && now < end`.
- **Pendiente de cierre**: CONFIRMED, `now > end`; el admin debe pulsar "Terminar turno" → COMPLETED.
- **Completados**: COMPLETED en BD. Luego "Cerrar turno" (closedAt) cuando saldo 0.

No hay transición automática en backend por tiempo.

---

## 2. Cambios ya definidos (plan base)

### 2.1 Botón "Terminar turno"

**Archivo:** [components/AdminTurnos.tsx](components/AdminTurnos.tsx) (aprox. línea 1320)

- Cambiar: `showTerminarTurno = cat === 'in_progress' && booking.status !== 'completado'`
- A: `showTerminarTurno = (cat === 'in_progress' || cat === 'awaiting_completion') && booking.status !== 'completado'`

### 2.2 Sección "Pendiente de cierre"

- `confirmedDerived`: dejar solo `d.category === 'confirmed'` (quitar `|| d.category === 'awaiting_completion'`).
- Crear: `awaitingCompletionDerived = useMemo(() => derivedBookings.filter(d => d.category === 'awaiting_completion'), [derivedBookings])`.
- Insertar **entre "TURNOS EN CURSO" y "TURNOS COMPLETADOS"** una nueva sección:
  - Título: **PENDIENTE DE CIERRE** (estilo ámbar, p. ej. `bg-amber-50 text-amber-800 border-amber-200`).
  - Listar `awaitingCompletionDerived` con el mismo patrón de card que En curso; badge "Pendiente de cierre" o "Finalizado · 00:00" (usar `formatRemaining(0)` → "00:00").
  - Cards con expand/collapse y mismo `renderExpandedContent` (ahí ya aparecerá "Terminar turno" por 2.1).

---

## 3. Huecos a tapar

### 3.1 Filtros (Estado)

**Archivo:** [components/AdminTurnos.tsx](components/AdminTurnos.tsx)

- **Dropdown Estado** (líneas ~1616–1621): añadir opción:
  - `<option value="awaiting_completion">Pendiente de cierre</option>`
- **useEffect de filtrado** (líneas 749–769):
  - Cuando `statusFilter === 'confirmed'`: filtrar por `getCategoryAndRemaining(booking).category === 'confirmed'` (quitar `|| ... === 'awaiting_completion'`).
  - Cuando `statusFilter === 'awaiting_completion'`: `filtered = filtered.filter(booking => getCategoryAndRemaining(booking).category === 'awaiting_completion')`.
- **Export CSV** (líneas 779–816):
  - Si `statusFilter === 'awaiting_completion'`: pedir al API con `status: CONFIRMED` (igual que "confirmed"); después del `mapped`, filtrar: `mapped = mapped.filter((b: Booking) => getCategoryAndRemaining(b).category === 'awaiting_completion')`.

### 3.2 Cancelar reserva en "Pendiente de cierre"

**Archivo:** [components/AdminTurnos.tsx](components/AdminTurnos.tsx) (aprox. líneas 1358–1360)

- Hoy: `isConfirmadoOrEnCurso = cat === 'confirmed' || cat === 'in_progress' || booking.status === 'confirmado'` → Cancelar deshabilitado en `awaiting_completion`.
- Cambiar a: incluir `cat === 'awaiting_completion'` para permitir cancelar (p. ej. no-show):
  - `isConfirmadoOrEnCurso = cat === 'confirmed' || cat === 'in_progress' || cat === 'awaiting_completion' || booking.status === 'confirmado'`

### 3.3 Sección colapsable y data-testid

- Añadir estado: `awaitingSectionCollapsed` (default `false` para que la sección sea visible).
- En el header de "PENDIENTE DE CIERRE": botón chevron (igual que Confirmados/Cerrados), `aria-expanded={!awaitingSectionCollapsed}`, `data-testid="expand-awaiting-section"`.
- Renderizar la lista de `awaitingCompletionDerived` solo cuando `!awaitingSectionCollapsed`.

### 3.4 Contador y estadísticas

- **Badge en cards de Pendiente de cierre:** texto fijo "Pendiente de cierre" o "Finalizado · 00:00" (sin contador negativo en esta iteración).
- **Header de sección:** mostrar cantidad, p. ej. `PENDIENTE DE CIERRE (N)` cuando `awaitingCompletionDerived.length > 0`.
- **Tarjeta "Confirmados" (Estadísticas rápidas):** actualmente usa `confirmedBookings = filteredBookings.filter(b => b.status === 'confirmado').length`. Opcional: que refleje solo los de la sección Confirmados: `derivedBookings.filter(d => d.category === 'confirmed').length` (o mantener el actual si se prefiere que "Confirmados" siga siendo "todos los CONFIRMED en filtro").

### 3.5 Paginación en Pendiente de cierre

- Sin paginación inicial: mostrar todos los ítems de `awaitingCompletionDerived`. Si más adelante hay muchos, se puede añadir `visibleAwaiting` + "Mostrar más" igual que en Confirmados.

### 3.6 Tests E2E / data-testid

- Añadir en la sección Pendiente de cierre:
  - `data-testid="section-awaiting-completion"` en el contenedor de la sección.
  - `data-testid="expand-awaiting-section"` en el botón de expandir/colapsar (ya indicado en 3.3).
- Los botones "Terminar turno" dentro de esa sección siguen usando `data-testid={`admin-terminar-turno-btn-${idx + 1}`}` (mismo que en En curso).

---

## 4. Orden de secciones en la lista

1. Turnos fijos
2. Turnos confirmados
3. Turnos en curso
4. **Pendiente de cierre** (nueva)
5. Turnos completados
6. Turnos cerrados

---

## 5. Resumen de archivos


| Área                                                 | Archivo                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Botón Terminar turno                                 | [components/AdminTurnos.tsx](components/AdminTurnos.tsx) |
| confirmedDerived / awaitingCompletionDerived         | [components/AdminTurnos.tsx](components/AdminTurnos.tsx) |
| Sección Pendiente de cierre (UI, colapsable, testid) | [components/AdminTurnos.tsx](components/AdminTurnos.tsx) |
| Filtros (dropdown + useEffect + export)              | [components/AdminTurnos.tsx](components/AdminTurnos.tsx) |
| Cancelar en awaiting_completion                      | [components/AdminTurnos.tsx](components/AdminTurnos.tsx) |
| Stats Confirmados (opcional)                         | [components/AdminTurnos.tsx](components/AdminTurnos.tsx) |


---

## 6. Documentación de referencia

- [.cursor/skills/turnero-padel-domain/SKILL.md](.cursor/skills/turnero-padel-domain/SKILL.md)
- [docs/actualizaciones/admin-turnos-pendientes-completado-2026-03.md](docs/actualizaciones/admin-turnos-pendientes-completado-2026-03.md)
- [.cursor/plans/admin_turnos_pendientes.plan.md](.cursor/plans/admin_turnos_pendientes.plan.md)

