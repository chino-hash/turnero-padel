# Actualización dashboard: tarjetas de torneos/canchas y selector de fecha móvil

**Fecha:** 3 de marzo de 2026  

Documentación de los cambios visuales y de UX aplicados en el dashboard público y en el panel de administración para torneos, canchas y selección de fechas en móvil.

---

## Objetivo

- Unificar el diseño visual de las tarjetas de **torneos** y **canchas** en el panel admin usando el header azul degradado.
- Mejorar la legibilidad de precios y descripciones en las tarjetas de canchas.
- Corregir el comportamiento del **selector de fechas en móvil** para que las fechas no se vean cortadas y el scroll sea más fluido.
- Mantener alineado el aspecto general del dashboard con el nuevo look & feel del módulo de torneos y de estadísticas.

---

## 1. Tarjetas de historial de torneos (admin)

### Contexto

En `app/admin-panel/admin/torneos/page.tsx` ya se había implementado un diseño más rico para:

- El **historial de torneos** (cards con header azul, badges de categoría y cantidad mínima de parejas).
- La **vista previa** del torneo que se está creando.

### Cambios relevantes

- Se consolidó el uso de:
  - Header con **gradiente azul** `from-blue-600 via-blue-700 to-indigo-800`.
  - Badges compactas para:
    - Categoría (ej: `6ta`, `7ma`, `Mixto`, `Suma`).
    - Mínimo de parejas (`Min 16`, etc.).
  - Secciones claramente separadas para:
    - **Premios** (1º y 2º puesto).
    - **Fechas** con chips por día.
- Se reforzó la validación previa al publicar:
  - Título y categoría obligatorios.
  - Al menos un día y una franja horaria con hora de inicio por día.
  - Rango de parejas mínimas/máximas coherente.

### Archivos tocados

- `app/admin-panel/admin/torneos/page.tsx`

---

## 2. Tarjetas de canchas (admin) con header azul

### Problema

Las tarjetas de canchas activas en `Gestión de Canchas` tenían un diseño más simple y no seguían el estilo visual de las tarjetas de torneos:

- Header plano, sin gradiente.
- Información de precios mostrada en un bloque único.
- Descripción separada pero sin jerarquía visual clara.

### Solución

Se actualizó el layout de las tarjetas de canchas activas para reutilizar el mismo lenguaje visual que las tarjetas de torneos:

- **Card contenedor**
  - `rounded-2xl`, `overflow-hidden` y borde suave para que el header azul cubra completamente las esquinas superiores.
  - Fondo base `bg-card` y borde `border-border/50` para integrarse con el resto del panel.

- **Header azul**
  - `bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800` con texto blanco.
  - Etiqueta pequeña `Cancha activa`.
  - Nombre de la cancha en tipografía **bold** y una sola línea (`line-clamp-1`).
  - Badges:
    - Estado (`Activa`).
    - Tenant (cuando aplica: `tenantName` o `tenantSlug`), solo visible para superadmin.
  - El **switch de activación** se mantiene arriba a la derecha para superadmin.

- **Cuerpo de la tarjeta**
  - Sección **Tarifa** con dos cajitas tipo “Premios” de torneos:
    - Caja azul: **Precio base**.
    - Caja verde: **Precio por persona** (cálculo en base a 4 jugadores).
  - Sección **Descripción**:
    - Título pequeño en mayúsculas.
    - Texto en `line-clamp-3` para evitar desbordes.
  - Botones de acción:
    - `Editar`.
    - `Eliminar` (solo superadmin), manteniendo el estilo de botones global del admin.

### Archivo modificado

- `app/admin-panel/admin/canchas/page.tsx`

---

## 3. Página de estadísticas (admin)

### Contexto

La página de estadísticas se simplificó para alinearla con el nuevo patrón de encabezados del admin y con cards de métricas claras.

### Cambios principales

- Header consistente con el resto de pestañas admin:
  - Título **“Estadísticas”** con `font-light`.
  - Línea naranja decorativa bajo el título.
  - Descripción corta del módulo.
  - Botón **“Actualizar”** alineado al lado derecho.
- Métricas principales en cards:
  - Reservas hoy.
  - Reservas semana.
  - Ingresos del mes.
  - Ocupación promedio.
- Bloques de análisis:
  - **Canchas más utilizadas** con barras horizontales.
  - **Horarios pico** con porcentajes de ocupación.

### Archivo modificado

- `app/admin-panel/admin/estadisticas/page.tsx`

---

## 4. Selector de fechas en móvil (dashboard público)

### Problema

En algunos móviles el carrusel de fechas en la sección de **reservar canchas** se veía incompleto:

- La última fecha podía quedar parcialmente cortada hacia la derecha.
- El scroll horizontal no era del todo fluido en navegadores móviles (especialmente Safari).

### Solución

Se ajustó el contenedor y el contenido del selector de fechas móvil en `HomeSection`:

- Contenedor de scroll:
  - `overflow-x-auto overflow-y-hidden pb-2 scroll-smooth`.
  - `WebkitOverflowScrolling: 'touch'` para mejorar el scroll en iOS.
- Contenido:
  - `flex items-center gap-3 sm:gap-4 pl-4 pr-4 min-w-min snap-x snap-mandatory`.
  - Se equilibró el padding izquierdo (`pl-4`) y derecho (`pr-4`) para que la **última fecha tenga margen completo** y no quede cortada.
  - Se mantiene el comportamiento `snap-center` de cada día.

El resultado es un carrusel horizontal de fechas completamente visible y desplazable en móvil.

### Archivo modificado

- `components/HomeSection.tsx`

---

## Resumen de archivos modificados en este commit

| Archivo                                      | Descripción                                                                                  |
|----------------------------------------------|----------------------------------------------------------------------------------------------|
| `app/admin-panel/admin/torneos/page.tsx`     | Ajustes en validaciones, payload y refetch de torneos; consolidación del diseño de tarjetas |
| `app/admin-panel/admin/canchas/page.tsx`     | Tarjetas de canchas con header azul y cuerpo estilo “premios”                               |
| `app/admin-panel/admin/estadisticas/page.tsx`| Header y cards de métricas alineados al nuevo diseño del admin                              |
| `components/HomeSection.tsx`                 | Corrección del selector de fechas en móvil (scroll, padding y visibilidad de la última fecha) |

