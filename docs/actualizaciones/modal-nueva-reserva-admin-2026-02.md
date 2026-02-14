# Mejoras del modal «Nueva Reserva - Administrador»

**Fecha:** 13 de febrero de 2026

Documentación de los cambios realizados en la ventana de crear turno (modal «Nueva Reserva - Administrador») del panel de administración: visibilidad de botones, layout del diálogo, estilo de las tarjetas y sección Turno Fijo desplegable.

---

## Objetivo

Mejorar la usabilidad y la coherencia visual del modal de creación de reserva en **Admin → Turnos**:

1. Que todos los botones del modal sean visibles (evitar que se confundan con el fondo o queden fuera de la ventana).
2. Que las tarjetas de información usen el mismo gris oscuro que el resto del panel de administración.
3. Que la opción «Turno Fijo (Opcional)» esté oculta por defecto y se despliegue al hacer clic, igual que en la sección de turnos.

---

## Resumen de cambios

| Área | Cambio |
|------|--------|
| **Layout del modal** | Estructura en flex: cabecera fija, cuerpo con scroll, pie fijo. Los botones de acción quedan siempre visibles en la parte inferior. |
| **Botones del pie** | Cancelar y «Dar baja semana» con bordes y texto explícitos para buen contraste; «Crear Reserva» sin `w-full` para alineación correcta. |
| **Tarjetas del formulario** | Tres secciones (Información del Cliente, Turno Fijo, Detalles de la Reserva) con `bg-gray-800`, `border-gray-700` y texto claro. |
| **Turno Fijo** | Sección colapsada por defecto; cabecera clicable con ChevronDown/ChevronUp para desplegar/colapsar. |

---

## 1. Layout del modal y botones siempre visibles

**Problema:** El contenido del modal era un único bloque con `overflow-y-auto`. Cuando el formulario era largo, los botones «Cancelar» y «Crear Reserva» quedaban por debajo del viewport o se cortaban (p. ej. botón a 498px en un diálogo de 535px de alto).

**Solución:** El `DialogContent` pasó a usar **flex en columna**:

- **Cabecera** (`DialogHeader`): `flex-shrink-0` — título fijo arriba.
- **Cuerpo** (formulario): `flex-1 min-h-0 overflow-y-auto` — solo esta zona hace scroll.
- **Pie** (botones de acción): `flex-shrink-0` — siempre visible abajo, con `bg-background` para que no se transparente al hacer scroll.

**Archivo:** `app/admin-panel/admin/turnos/page.tsx`

```tsx
<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 gap-0">
  <DialogHeader className="pb-4 flex-shrink-0">...</DialogHeader>
  <div className="flex-1 min-h-0 overflow-y-auto space-y-8 px-1 py-2">
    {/* Información del cliente, Turno Fijo, Detalles de la reserva */}
  </div>
  <div className="flex flex-wrap justify-end gap-3 pt-4 mt-4 border-t ... flex-shrink-0 bg-background">
    {/* Cancelar, Dar baja semana, Crear Reserva */}
  </div>
</DialogContent>
```

---

## 2. Visibilidad de los botones del pie

**Problema:** El botón «Cancelar» con `variant="outline"` usaba `bg-background`, por lo que en tema claro se confundía con el fondo.

**Solución:** Clases explícitas para contraste en claro y oscuro:

- **Cancelar:** `border-gray-400 text-gray-800 hover:bg-gray-100` y variantes `dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-800`.
- **Dar baja semana:** `border-purple-400`, `dark:border-purple-500 dark:hover:bg-purple-950`.
- **Crear Reserva / Crear Turno Fijo:** se quitó `w-full` y se usó `px-6 py-2.5 h-auto` para que no ocupe todo el ancho y el grupo de botones se vea ordenado.

---

## 3. Tarjetas en gris oscuro (estilo del panel de administración)

**Problema:** Las tres secciones del formulario usaban fondos claros (`bg-gray-50`, `bg-purple-50`, `bg-blue-50`) que no coincidían con el estilo del panel (header `bg-gray-800 border-gray-700`).

**Solución:** Unificar las tres tarjetas con el mismo gris oscuro:

- **Contenedores:** `bg-gray-800 border border-gray-700 p-5 rounded-lg`.
- **Títulos de sección:** `text-gray-100`.
- **Etiquetas (Label):** `text-gray-300`.
- **Texto de ayuda:** `text-gray-400`.
- **Input «Nombre Completo»:** `bg-gray-700/50 border-gray-600 text-gray-100 placeholder:text-gray-500`.
- **Selects y botones tipo dropdown** (Activar turno fijo, Día, Inicio, Fin, Cancha, Fecha, Horario): `bg-gray-700/50 border-gray-600 text-gray-200` y `hover:bg-gray-600` donde aplica.

Así las secciones «Información del Cliente», «Turno Fijo (Opcional)» y «Detalles de la Reserva» quedan alineadas visualmente con el resto del admin.

---

## 4. Turno Fijo oculto por defecto y desplegable

**Problema:** La sección «Turno Fijo (Opcional)» estaba siempre visible y ocupaba mucho espacio, aunque muchos usuarios solo crean reservas puntuales.

**Solución:** Mismo patrón que en la sección de turnos (lista de reservas con filas expandibles):

- **Estado:** `turnoFijoExpanded` (boolean), por defecto `false`.
- **Cabecera clicable:** botón que ocupa todo el ancho con el título «Turno Fijo (Opcional)», icono `FileText` y chevrón:
  - `ChevronDown` cuando está colapsado.
  - `ChevronUp` cuando está expandido.
- **Contenido:** el bloque con la descripción, «Activar turno fijo», día de la semana, Inicio y Fin se renderiza solo cuando `turnoFijoExpanded === true`.
- **Cierre del modal:** en `onOpenChange` del `Dialog`, si el modal se cierra (`open === false`) se ejecuta `setTurnoFijoExpanded(false)` para que al reabrir el modal la sección vuelva a estar colapsada.

**Estructura:**

```tsx
<div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
  <button type="button" onClick={() => setTurnoFijoExpanded((v) => !v)} ...>
    <h3>... Turno Fijo (Opcional)</h3>
    {turnoFijoExpanded ? <ChevronUp /> : <ChevronDown />}
  </button>
  {turnoFijoExpanded && (
    <div className="space-y-5 px-5 pb-5 pt-0">
      {/* Descripción + campos */}
    </div>
  )}
</div>
```

---

## Archivos modificados

- **`app/admin-panel/admin/turnos/page.tsx`**
  - Layout del modal (flex, scroll solo en el cuerpo, pie fijo).
  - Estilos de botones Cancelar, Dar baja semana y Crear Reserva.
  - Tarjetas con `bg-gray-800`, bordes y texto en tonos gris claro.
  - Estilos de inputs y selects en las tarjetas oscuras.
  - Estado `turnoFijoExpanded` y sección Turno Fijo desplegable.
  - Reset de `turnoFijoExpanded` en `onOpenChange` del `Dialog`.
  - Import de `ChevronDown` y `ChevronUp` desde `lucide-react`.

---

## Referencias

- Estilo del header del panel: `app/admin-panel/components/AdminLayoutContent.tsx` (`bg-gray-800 border-gray-700` en modo oscuro).
- Patrón de desplegable en la lista de turnos: `components/AdminTurnos.tsx` (estado `expandedBooking`, botón con ChevronDown/ChevronUp, contenido condicional).
