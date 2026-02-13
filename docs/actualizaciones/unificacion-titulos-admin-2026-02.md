# Unificación de títulos del panel de administración

**Fecha:** 13 de febrero de 2026

Documentación de los cambios realizados para que todos los títulos de las pestañas del panel de administración queden en la misma posición al cambiar de sección.

---

## Objetivo

Al navegar entre las pestañas de la barra superior (Canchas, Turnos, Usuarios, Estadísticas, Productos, Torneo, etc.), el título de la página debe permanecer en la misma posición horizontal y vertical, mostrando solo la información que corresponde a cada sección. Antes, cada página usaba contenedores y paddings distintos, lo que hacía que el título “saltara” de posición al cambiar de pestaña.

---

## Resumen de cambios

1. **Contenedor común en el layout**  
   Todo el contenido del panel admin se renderiza dentro de un único contenedor con el mismo `max-width`, padding horizontal y padding superior.

2. **Estructura unificada del bloque de título**  
   En cada página se usa la misma estructura para el encabezado: altura mínima fija, mismo `h1`, línea naranja y descripción, con botones opcionales alineados a la derecha.

---

## 1. Layout: contenedor común

**Archivo:** `app/admin-panel/components/AdminLayoutContent.tsx`

El contenido principal (`children`) se envuelve en un único contenedor:

```tsx
<main className="flex-1">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    {children}
  </div>
</main>
```

- **`max-w-7xl`**: ancho máximo consistente en todas las vistas.
- **`mx-auto`**: centrado horizontal.
- **`px-4 sm:px-6`**: mismo padding horizontal (16px móvil, 24px en `sm` y superior).
- **`py-6`**: mismo padding vertical superior e inferior.

Con esto, todas las páginas del admin comparten la misma “caja” y el título empieza en la misma posición.

---

## 2. Estructura del bloque de título (por página)

En cada página del admin, el encabezado sigue esta estructura:

- **Contenedor del título**
  - `min-h-[5.5rem]`: altura mínima fija para que la zona del título ocupe siempre el mismo espacio y el contenido debajo empiece a la misma altura.
  - `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4`: en pantallas pequeñas el título va arriba y los botones abajo; en `sm` y mayores, título a la izquierda y botones a la derecha.

- **Contenido del título**
  - `h1`: `text-3xl font-light text-foreground mb-2`.
  - Línea decorativa: `div` con `w-16 h-0.5 bg-orange-500`.
  - Descripción: `p` con `text-muted-foreground text-xs mt-2`.

- **Botones opcionales** (Nueva Cancha, Actualizar, Preferencias, etc.)
  - En la misma fila que el título (en `sm+`) con `flex-shrink-0` para no comprimir el título.

Ejemplo de estructura:

```tsx
<div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
  <div>
    <h1 className="text-3xl font-light text-foreground mb-2">Título de la página</h1>
    <div className="w-16 h-0.5 bg-orange-500"></div>
    <p className="text-muted-foreground text-xs mt-2">Descripción breve.</p>
  </div>
  {/* Opcional: botones a la derecha */}
  <Button className="flex-shrink-0">Acción</Button>
</div>
```

---

## 3. Páginas modificadas

En todas ellas se eliminaron contenedores y paddings propios que duplicaban o contradecían el layout común, y se aplicó la estructura de título anterior.

| Página | Archivo | Cambios principales |
|--------|---------|---------------------|
| **Turnos** | `app/admin-panel/admin/turnos/page.tsx` | Header con `min-h-[5.5rem]` y misma estructura; se quitó `px-4 sm:px-6` del header (ahora lo da el layout). |
| **Canchas** | `app/admin-panel/admin/canchas/page.tsx` | Sustituido `<main className="container mx-auto p-6 space-y-6">` por `<div className="space-y-6">`; header unificado; botón "Nueva Cancha" con `flex-shrink-0`. |
| **Usuarios** | `app/admin-panel/admin/usuarios/page.tsx` | Eliminados `min-h-screen p-6` y `max-w-7xl mx-auto`; título, línea, descripción y botón "Actualizar" en el mismo bloque con `min-h-[5.5rem]`. |
| **Productos** | `app/admin-panel/admin/productos/page.tsx` | Eliminados `min-h-screen`, `max-w-7xl mx-auto px-8 py-12` y un nivel de `div`; header con línea naranja y descripción `text-xs`; botones Ventas y Nuevo Producto en la misma fila. |
| **Ventas** | `app/admin-panel/admin/ventas/page.tsx` | Eliminados `min-h-screen` y `max-w-7xl mx-auto px-8 py-12`; header unificado; eliminado `mt-6` del contenedor del título. |
| **Torneos** | `app/admin-panel/admin/torneos/page.tsx` | Sustituido `max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8` por `space-y-6`; mismo bloque de título. |
| **Panel de Administración** | `app/admin-panel/admin/page.tsx` | Eliminado `p-6` del contenedor principal; bloque de título con `min-h-[5.5rem]`; botón "Preferencias" con `flex-shrink-0`; texto de última actualización con `text-xs`. |
| **Estadísticas** | `app/admin-panel/estadisticas/page.tsx` | Título con `font-light` (antes `font-bold`), línea naranja y descripción unificada; botón "Actualizar" con `flex-shrink-0`. |

---

## 4. Resultado

- Al cambiar de pestaña, el **título** (h1) queda siempre en la misma posición (mismo padding y mismo ancho máximo).
- La **línea naranja** y la **descripción** mantienen la misma relación visual con el título.
- El **contenido debajo del título** (métricas, tablas, formularios, etc.) comienza a la misma altura gracias a `min-h-[5.5rem]` en el bloque del título.
- Los **botones de acción** (Nueva Cancha, Actualizar, etc.) no desplazan el título y se alinean a la derecha en pantallas `sm` y mayores.

---

## Referencias

- Layout del panel: `app/admin-panel/components/AdminLayoutContent.tsx`
- Layout que envuelve el panel: `app/admin-panel/layout.tsx`
- Páginas del admin: `app/admin-panel/admin/*/page.tsx` y `app/admin-panel/estadisticas/page.tsx`
