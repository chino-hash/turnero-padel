# Unificación de botones del header en el panel de administración

**Fecha:** 13 de febrero de 2026

Documentación de los cambios realizados para que todos los botones de acción a la derecha de los títulos del panel de administración compartan la misma estructura, posición y estilo al cambiar de sección.

---

## Objetivo

Al navegar entre las pestañas del panel (Canchas, Turnos, Usuarios, Estadísticas, Productos, Torneos, etc.), los botones del header (Nueva Cancha, Nueva Reserva, Actualizar, Preferencias, Ventas, Nuevo Producto) deben:

- Estar siempre en la misma posición (dentro del bloque de título, alineados a la derecha en `sm+`).
- Usar la misma estructura de contenedor y las mismas clases de estilo.
- Diferenciar solo por variante: acción principal (primary) frente a acción secundaria (outline).

Antes, cada página usaba contenedores distintos, estilos propios (p. ej. `bg-blue-600`, `bg-orange-500`) o botones fuera del header, lo que hacía que la zona de acciones se viera inconsistente al cambiar de pestaña.

---

## Resumen de cambios

1. **Contenedor común para los botones del header**  
   Todos los botones de acción del título se envuelven en un único contenedor:  
   `flex items-center gap-2 flex-shrink-0`.

2. **Botones dentro del bloque de título**  
   Los botones pasan a estar dentro del mismo `div` con `min-h-[5.5rem]` que el título, no en filas separadas debajo.

3. **Estilo unificado**  
   - **Acción principal** (crear/nuevo): `Button` con variante por defecto (primary), icono + texto con `gap-2`, sin clases de color custom.
   - **Acción secundaria** (actualizar, preferencias, ventas): `variant="outline"`, mismo tamaño por defecto (`h-9`), mismo `gap-2` e iconos `w-4 h-4`.

4. **Tamaño consistente**  
   Se eliminó `size="sm"` del botón Preferencias para que todos los botones del header usen el tamaño por defecto del componente.

---

## 1. Estructura del contenedor de botones

En cada página, los botones del header van dentro del bloque de título así:

```tsx
<div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
  <div>
    <h1 className="text-3xl font-light text-foreground mb-2">Título de la página</h1>
    <div className="w-16 h-0.5 bg-orange-500"></div>
    <p className="text-muted-foreground text-xs mt-2">Descripción breve.</p>
  </div>
  {/* Contenedor unificado de botones */}
  <div className="flex items-center gap-2 flex-shrink-0">
    <Button variant="outline" className="flex items-center gap-2">…</Button>
    <Button className="flex items-center gap-2">…</Button>
  </div>
</div>
```

- **`flex items-center gap-2 flex-shrink-0`**: agrupa uno o más botones, los alinea en fila con espacio fijo y evita que se compriman.
- Los botones usan **`className="flex items-center gap-2"** para icono + texto de forma consistente.
- Los iconos usan **`w-4 h-4`** (o el tamaño por defecto del `Button`); se evita `mr-2` en el icono porque el botón ya tiene `gap-2`.

---

## 2. Variantes de botón

| Tipo              | Uso                         | Variante   | Ejemplo              |
|-------------------|-----------------------------|------------|----------------------|
| Acción principal  | Crear / Nuevo elemento      | default    | Nueva Cancha, Nueva Reserva, Nuevo Producto |
| Acción secundaria | Actualizar, Preferencias, Ventas | `variant="outline"` | Actualizar, Preferencias, Ventas |

No se usan clases custom de color (`bg-blue-600`, `bg-orange-500`, etc.) en los botones del header para mantener coherencia con el tema y el diseño del panel.

---

## 3. Páginas modificadas

| Página     | Archivo | Cambios principales |
|-----------|---------|----------------------|
| **Canchas** | `app/admin-panel/admin/canchas/page.tsx` | Botón "Nueva Cancha" envuelto en `<div className="flex items-center gap-2 flex-shrink-0">`; icono sin `mr-2`; botón con `className="flex items-center gap-2"`. |
| **Turnos**  | `app/admin-panel/admin/turnos/page.tsx`  | "Nueva Reserva" movido dentro del bloque de título (mismo `min-h-[5.5rem]`); eliminado el `div` con `flex justify-end`; botón con variante default (primary) en lugar de `bg-blue-600 hover:bg-blue-700`; contenedor `flex items-center gap-2 flex-shrink-0`. |
| **Usuarios** | `app/admin-panel/admin/usuarios/page.tsx` | Botón "Actualizar" envuelto en el mismo contenedor de botones; `space-x-2` reemplazado por `gap-2`; eliminado `<span>` alrededor del texto. |
| **Productos** | `app/admin-panel/admin/productos/page.tsx` | "Nuevo Producto" pasa a variante default (se quita `bg-orange-500 hover:bg-orange-600 text-white border-0`); "Ventas" con `variant="outline"` y `className="flex items-center gap-2"`; eliminados `<span>` innecesarios. |
| **Panel de Administración** | `app/admin-panel/admin/page.tsx` | Botón "Preferencias" sin `size="sm"` para igualar tamaño al resto de botones del header. |
| **Estadísticas** | `app/admin-panel/estadisticas/page.tsx` | Botón "Actualizar" envuelto en el contenedor de botones; `space-x-2` reemplazado por `gap-2`; eliminado `<span>` alrededor del texto. |

**Ventas** y **Torneos** no tenían botones en el header; no se modificaron.

---

## 4. Resultado

- Los **botones de acción** del header quedan siempre en la misma posición (dentro del bloque de título, a la derecha en `sm+`).
- **Un solo botón** o **varios** comparten el mismo contenedor (`flex items-center gap-2 flex-shrink-0`).
- **Mismo tamaño** (altura por defecto del `Button`) y **misma separación** (icono + texto con `gap-2`).
- **Acción principal** en primary y **secundaria** en outline, sin colores custom en el header.

---

## Referencias

- Unificación de títulos: `docs/actualizaciones/unificacion-titulos-admin-2026-02.md`
- Layout del panel: `app/admin-panel/components/AdminLayoutContent.tsx`
- Componente Button: `components/ui/button.tsx`
- Páginas del admin: `app/admin-panel/admin/*/page.tsx` y `app/admin-panel/estadisticas/page.tsx`
