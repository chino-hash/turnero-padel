# Tarjetas de turnos: optimización de espacio y legibilidad del texto (2026-03)

**Fecha:** Marzo 2026  
**Ruta:** `/admin-panel/admin/turnos`  
**Componente:** `components/AdminTurnos.tsx`

Resumen de los cambios aplicados a las tarjetas de reserva en la lista de turnos: reducción del espacio vertical (menos “espacio muerto”) y mejora del contraste del texto de fecha, hora y nombre del jugador para que se lean mejor, sobre todo en modo oscuro.

---

## 1. Optimización del espacio de las tarjetas

### Problema
Las tarjetas de cada turno (Fijos, Confirmados, En curso, Completados) tenían demasiada altura: padding y gap por defecto del componente `Card` (`py-6`, `gap-6`) generaban espacio vacío debajo del contenido.

### Solución
Se aplican clases de override solo a las tarjetas de la lista de turnos (no al componente base `Card` en `ui/card.tsx`):

| Elemento   | Antes     | Después        |
|------------|-----------|----------------|
| **Card**   | (default: `py-6 gap-6`) | `py-3 gap-0`   |
| **CardHeader** | `pb-3`   | `pb-2 pt-0`    |
| Fila de detalles (fecha/hora/nombre) | `mt-2` | `mt-1.5`       |

- **Secciones afectadas:** las cuatro que renderizan tarjetas por reserva:
  - TURNOS FIJOS
  - TURNOS CONFIRMADOS
  - TURNOS EN CURSO
  - TURNOS COMPLETADOS

- **Resultado:** tarjetas más compactas, con menos espacio muerto y mejor aprovechamiento del espacio vertical. El contenido expandido (al hacer clic en la flecha) sigue usando `CardContent` con `pt-0`.

---

## 2. Claridad del texto (fecha, hora, nombre)

### Problema
La línea de detalles (fecha, hora, nombre del jugador) usaba `text-gray-600` fijo. En fondo oscuro (`bg-[#090E1A]` del layout admin) el gris medio se veía poco contrastado y costaba leer.

### Solución
El color del texto de esa fila depende del tema que usa el componente (`isDarkMode` de `useAppState()`):

- **Modo oscuro:** `text-gray-300` — gris claro para buen contraste sobre fondo oscuro.
- **Modo claro:** `text-gray-600` — se mantiene la jerarquía visual sin ser demasiado fuerte.

Implementación: clase dinámica en el contenedor de la fila de detalles:

```tsx
<div className={`flex items-center gap-4 text-sm mt-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
  {/* íconos + fecha, hora, nombre */}
</div>
```

Afecta a los mismos cuatro bloques de tarjetas (Fijos, Confirmados, En curso, Completados). Los íconos (Calendar, Clock, User) heredan el color y también ganan legibilidad en modo oscuro.

---

## 3. Archivos modificados

- **`components/AdminTurnos.tsx`**
  - En cada uno de los cuatro bloques de tarjetas (fixed, confirmed, inProgress, completed):
    - `Card`: añadido `className="overflow-hidden py-3 gap-0"`.
    - `CardHeader`: `className="pb-3"` → `"pb-2 pt-0"`.
    - Contenedor de fecha/hora/nombre: `className="flex items-center gap-4 text-sm text-gray-600 mt-2"` → `` `flex items-center gap-4 text-sm mt-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}` ``.

No se modificó el componente base `components/ui/card.tsx`, para no alterar el resto de la aplicación.

---

## 4. Documentación relacionada

- [Funcionalidad Completa Admin Turnos](../admin/admin-turnos-funcionalidad-completa.md)
- [Sección TURNOS CERRADOS: colapsable y limpieza](admin-turnos-cerrados-colapsable-limpieza-2026-03.md)
