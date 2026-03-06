# Admin Turnos: una sola página sin paginación global (2026-03)

**Fecha:** Marzo 2026  
**Ruta:** `/admin-panel/admin/turnos`  
**Componente:** `components/AdminTurnos.tsx`

Resumen de los cambios para mostrar todos los turnos en una misma página (sin “Página 1 de N” ni botones Anterior/Siguiente), con límite inicial en la sección Confirmados y “Mostrar más”, y ajuste del límite máximo en el API.

---

## 1. Objetivo

- Evitar la paginación global que obligaba a cambiar de página para ver confirmados, en curso, completados y cerrados.
- Mantener todo en una sola vista: una única petición con hasta 500 turnos y las cuatro secciones visibles.
- Reducir clics: solo la sección Confirmados (la que puede ser muy larga) usa un límite inicial de 20 y botón “Mostrar más” de 20 en 20.

---

## 2. Cambios en el frontend (`components/AdminTurnos.tsx`)

### 2.1. Carga de datos (una sola “página”)

- **Antes:** Se enviaba `page`, `limit` (20) y, según filtro, `status` (CONFIRMED/COMPLETED). La UI mostraba “Página X de Y · Z turnos” y botones Anterior/Siguiente.
- **Ahora:**
  - Una sola petición con `page=1` y `limit=500`.
  - No se envía `status` al API: se traen todos los estados para rellenar las cuatro secciones (confirmados, en curso, completados, cerrados) en una misma carga.
  - Eliminados el estado `page`, `totalPages`, `totalCount` y el bloque de UI de paginación (texto “Página X de Y” y botones Anterior/Siguiente).
  - Los filtros de fecha (`dateFilter`: Hoy, Mañana, etc.) se siguen enviando como `dateFrom`/`dateTo` cuando corresponden.

### 2.2. Filtros en cliente

- Al no filtrar por `status` en el API, los filtros “Confirmados” y “Completados” del dropdown se aplican en cliente sobre la lista ya cargada:
  - `statusFilter === 'confirmed'`: se muestran solo turnos con `status === 'confirmado'` o categoría `awaiting_completion`.
  - `statusFilter === 'completed'`: se muestran solo turnos con categoría `completed`.
- El filtro “En curso” (in_progress) ya se aplicaba en cliente por categoría temporal; se mantiene igual.
- La exclusión de turnos con `status === 'pendiente'` se mantiene.

### 2.3. Sección Confirmados

- **Límite inicial:** 20 turnos (constante `CONFIRMED_PAGE_SIZE = 20`).
- **Botón “Mostrar más”:** muestra 20 más cada vez (si quedan menos, muestra los restantes). Opcionalmente indica “(N más)”.
- **Botón “Mostrar menos”:** vuelve a mostrar solo los primeros 20.
- La sección sigue siendo colapsable como antes.

### 2.4. Secciones En curso y Completados

- **Antes:** Se mostraban hasta `visibleInProgress` / `visibleCompleted` (30) con “Mostrar más” / “Mostrar menos”.
- **Ahora:** Se muestran todos los turnos de cada sección (sin slice ni botones “Mostrar más”). Se eliminó el estado `visibleInProgress` y `visibleCompleted`.

### 2.5. Sección Cerrados

- Sin cambios: sección colapsable y “Mostrar más” / “Mostrar menos” por bloques de 30, con limpieza a las 06:00 del día siguiente.

### 2.6. Exportar CSV

- La exportación sigue usando su propia petición con `limit=1000` y los filtros activos (incluido `status` cuando aplica); no se modificó.

---

## 3. Cambios en el API / validación

### 3.1. Límite máximo de `limit` (`lib/validations/booking.ts`)

- **Antes:** `bookingFiltersSchema` definía `limit` con `.max(100)`.
- **Ahora:** `.max(500)` para permitir una única carga de hasta 500 reservas en la vista de turnos.
- **Motivo:** El frontend enviaba `limit=500` tras estos cambios; con `max(100)` la validación fallaba (400) y la lista llegaba vacía. Subir el tope a 500 no impacta el rendimiento porque la UI no pinta las 500 a la vez (Confirmados muestra 20 iniciales + “Mostrar más”; el resto de secciones son pequeñas).

---

## 4. Archivos modificados

| Archivo | Cambios |
|--------|---------|
| `components/AdminTurnos.tsx` | Estado y fetch sin paginación global; límite 500; filtros en cliente para confirmed/completed; Confirmados 20 + “Mostrar más” de 20; En curso y Completados sin límite; eliminada UI de paginación y estado no usado. |
| `lib/validations/booking.ts` | `limit` en `bookingFiltersSchema`: `.max(100)` → `.max(500)`. |

---

## 5. Comportamiento resultante

- Con **ningún filtro** (o “Todos” / “Todos los días”): se hace una petición con `page=1`, `limit=500` y sin `status`; se muestran las cuatro secciones con los turnos correspondientes.
- **Confirmados:** primeros 20 visibles; “Mostrar más” añade 20; “Mostrar menos” vuelve a 20.
- **En curso** y **Completados:** todos los ítems visibles.
- **Cerrados:** igual que antes (colapsable + “Mostrar más” / “Mostrar menos” por 30).
- Los filtros de fecha (Hoy, Mañana, etc.) y de estado (Confirmados, Completados, En curso) siguen funcionando; los de estado se aplican en cliente cuando la carga es “todas las reservas”.
