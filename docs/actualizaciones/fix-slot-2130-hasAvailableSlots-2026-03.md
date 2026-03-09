# Fix: Turno 21:30 no visible + mejora hasAvailableSlots

**Fecha:** 9 de marzo de 2026

---

## Problema reportado

El usuario reportó que a las 21:20 el dashboard mostraba "Se acabaron los turnos de hoy" en las 3 canchas, cuando debería existir un turno de 21:30–23:00.

## Diagnóstico

### Causa raíz: Horario de cierre incorrecto en base de datos

Mediante instrumentación de logs en runtime se descubrió que las 3 canchas tenían configurado el **horario de cierre en 22:30** en lugar de 23:00 en la base de datos.

**Evidencia del servidor:**
```
RAW operatingHours: end = "22:30"
endHour = 22.5, slotDuration = 1.5h
9 slots generados. Último: 20:00-21:30
```

La lógica de generación de slots (`h + slotDuration <= endHour`) requiere que el turno **termine** antes del cierre. Con cierre 22:30 y turnos de 90 min:

| Slot | Inicio | Fin | Cabe? |
|------|--------|-----|-------|
| 9 | 20:00 | 21:30 | 21:30 ≤ 22:30 → Sí |
| 10 | 21:30 | 23:00 | 23:00 ≤ 22:30 → **No** |

A las 21:20, el slot de 20:00 ya "empezó" (startTime < ahora) → filtro lo descartaba → no quedaban slots → "Se acabaron los turnos".

### Problema secundario: filtrado `hasAvailableSlots`

`hasAvailableSlots` en `HomeSection.tsx` usaba `slotsForRender` (ya pre-filtrado por `showOnlyOpen`) para decidir si mostrar "Se acabaron los turnos de hoy". Si todos los slots futuros estaban reservados, el filtro `showOnlyOpen` los eliminaba del array, y `hasAvailableSlots` sobre un array vacío declaraba erróneamente que no había turnos.

## Solución

### 1. Datos: Actualizar horarios de cierre (acción manual)

Desde Admin → Canchas → editar cada cancha, cambiar "Cierre" de 22:30 a **23:00**.

**Resultado verificado con logs:**
```
PARSED hours: end = "23:00", endHour = 23
10 slots generados. Último: 21:30-23:00
```

### 2. Código: Exponer `allSlotsForDate` en el contexto

**Archivo:** `components/providers/AppStateProvider.tsx`

Se agregó `allSlotsForDate` al contexto: la lista completa de slots del día **sin filtrar** por `showOnlyOpen`. Esto permite que componentes downstream evalúen la disponibilidad real sin que el filtro visual interfiera.

```typescript
// En la interfaz del contexto
allSlotsForDate: TimeSlot[]

// En el valor del contexto
allSlotsForDate: isUnifiedView ? (unifiedTimeSlots || []) : (timeSlots || []),
```

### 3. Código: Corregir `hasAvailableSlots` en HomeSection

**Archivo:** `components/HomeSection.tsx`

`hasAvailableSlots` ahora consulta `allSlotsForDate` (todos los slots, sin filtrar) en lugar de `slotsForRender` (pre-filtrado). Solo muestra "Se acabaron los turnos de hoy" cuando **realmente no hay ningún turno futuro disponible en ninguna cancha**.

```typescript
const source = Array.isArray(allSlotsForDate) && allSlotsForDate.length > 0
  ? allSlotsForDate
  : (Array.isArray(slotsForRender) ? slotsForRender : [])
```

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/providers/AppStateProvider.tsx` | Agregado `allSlotsForDate` al tipo del contexto y al valor provisto |
| `components/HomeSection.tsx` | `hasAvailableSlots` usa `allSlotsForDate` en lugar de `slotsForRender` |

## Flujo de generación de slots (referencia)

```
API /api/slots → getCourtById() → court.operatingHours
  → parseJsonSafely(operatingHours, schema, defaultHours)
  → for (h = startHour; h + slotDuration <= endHour; h += slotDuration)
  → genera array de slots con disponibilidad
```

El frontend filtra por `showOnlyOpen` y hora actual, pero `hasAvailableSlots` ahora usa la fuente sin filtrar para la decisión de "Se acabaron".
