# Dashboard: carga inicial sin parpadeos y mejoras de scroll (2026-04)

**Fecha:** Abril 2026  
**Ruta:** `/dashboard` y `/[slug]`  
**Áreas:** Home de reservas (slots), estado de carga inicial, fondo visual y rendimiento de scroll

Documentación de los cambios aplicados para eliminar el mensaje prematuro de "no hay turnos", reducir parpadeos durante recargas/revalidaciones y mejorar la fluidez al hacer scroll.

---

## 1. Síntoma reportado

En recarga rápida del dashboard se observaba la secuencia:

1. `skeleton/spinner`
2. mensaje de "no hay turnos"
3. nuevamente `skeleton/spinner`
4. finalmente aparecen los turnos

Además, el scroll se percibía pesado en algunos equipos.

---

## 2. Cambios implementados

## 2.1 Loading ampliado en Home

**Archivo:** `padel-booking.tsx`

- Se amplió `homeSlotsLoading` para tratar como carga:
  - `courtsLoading` activo.
  - vista unificada con canchas presentes pero sin primer fetch de slots finalizado.
  - vista por cancha con `selectedCourt` presente pero sin primer fetch finalizado.
- Objetivo: evitar que el estado "lista vacía temporal" se interprete como "sin turnos disponibles".

---

## 2.2 Estado explícito de carga de canchas

**Archivo:** `components/providers/AppStateProvider.tsx`

- Se agregó `courtsLoading` al contexto global.
- `courtsLoading` se activa al iniciar `loadCourts` y se apaga en `finally`.
- Se expone en `AppStateContextType` y se consume desde `padel-booking`.

---

## 2.3 Señal de "primer fetch completado" para slots

**Archivo:** `hooks/useOptimizedSlots.ts`

- Se agregó `hasFetchedOnce` en ambos hooks:
  - `useOptimizedSlots` (vista por cancha)
  - `useOptimizedMultipleSlots` (vista unificada)
- `hasFetchedOnce` se pone en `true` cuando:
  - se sirve caché válida, o
  - termina un fetch real (éxito/error controlado).
- Se resetea a `false` cuando falta contexto mínimo (sin cancha seleccionada o sin canchas).

**Archivo:** `components/providers/AppStateProvider.tsx`

- Se exponen ambos flags como:
  - `slotsFetchedOnce`
  - `multipleSlotsFetchedOnce`

**Archivo:** `padel-booking.tsx`

- `homeSlotsLoading` ahora depende también de estos flags para no mostrar el empty state antes de tiempo.

---

## 2.4 Debounce sin ventana de "no loading"

**Archivo:** `hooks/useOptimizedSlots.ts`

- En `fetchSlots` y `fetchAllSlots`, `setLoading(true)` (o `setIsRefreshing(true)`) se mueve **antes** del `setTimeout` del debounce.
- Objetivo: evitar el hueco temporal donde la UI quedaba en `!loading` antes de iniciar realmente la petición.

---

## 2.5 Evitar vaciado de canchas en revalidaciones del mismo tenant

**Archivo:** `components/providers/AppStateProvider.tsx`

- Antes se hacía `setCourts([])` en cada ejecución del efecto de carga.
- Ahora se vacía `courts` solo cuando realmente cambia `tenantSlug` (con `useRef` para comparar tenant previo).
- Resultado esperado: menos parpadeo visual durante revalidaciones o eventos en tiempo real.

---

## 2.6 Resolución más estable de tenantSlug al primer render

**Archivo:** `components/providers/AppStateProvider.tsx`

- `tenantSlug` pasa a resolverse con `useMemo` usando:
  1) `useSearchParams()`
  2) fallback a `window.location.search` en cliente
  3) `tenantSlugFromPath`
- Objetivo: reducir un primer ciclo de carga con slug incompleto antes de la hidratación de query params.

---

## 2.7 Fondo visual y scroll

**Archivo:** `padel-booking.tsx`

- Se cambió el fondo a `public/padel-dashboard-hero.png`.
- Se añadió capa de gradiente claro arriba -> oscuro abajo para legibilidad.
- Se optimizó el listener de scroll con `requestAnimationFrame` para evitar demasiados updates por evento.

---

## 3. Archivos afectados

- `hooks/useOptimizedSlots.ts`
- `components/providers/AppStateProvider.tsx`
- `padel-booking.tsx`
- `public/padel-dashboard-hero.png`

---

## 4. Resultado esperado

- Menos casos de mensaje prematuro de "no hay turnos" durante recarga.
- Menos parpadeo por doble/tercera transición visual en estados iniciales.
- Scroll más estable por reducción de actualizaciones de estado por frame.

---

## 5. Nota de seguimiento

Si aún aparecen parpadeos en algunos flujos, el próximo ajuste recomendado es demorar la primera revalidación en tiempo real (SSE) hasta que termine la carga inicial de slots visibles.
