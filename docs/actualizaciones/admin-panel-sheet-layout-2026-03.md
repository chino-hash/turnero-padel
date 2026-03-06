# Actualización panel admin: Sheet, layout y torneos (2026-03-05)

**Fecha:** 5 de marzo de 2026  
**Commit:** Admin: actualización páginas, layout, sheet UI y documentación

Resumen de los cambios incluidos en esta actualización: componente Sheet para navegación móvil, layout unificado del panel de administración, ajustes en torneos (orden y preselección de botones de formato) y script de corrección para Radix.

---

## 1. Componente Sheet (UI)

### Qué se añadió
- **Archivo:** `components/ui/sheet.tsx`
- **Propósito:** Componente de panel deslizante (drawer/sheet) basado en Radix UI, con partes exportadas: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetFooter`.

### Dónde se usa
- **AdminLayoutContent:** la navegación del panel de administración en vista móvil usa un `Sheet` para mostrar el menú lateral al pulsar el botón de hamburguesa, en lugar de un dropdown.

---

## 2. Panel de administración – Layout y navegación

### AdminLayoutContent
- **Contenedor común:** todo el contenido del panel se renderiza dentro de `max-w-7xl mx-auto px-4 sm:px-6 py-6`, de modo que el título de cada pestaña quede en la misma posición al cambiar de sección.
- **Navegación móvil:** menú lateral deslizante con `Sheet` (icono `Menu`), con enlaces a Canchas, Turnos, Usuarios, Estadísticas, Productos y Torneo.
- Header, estilos dark/light y enlaces desktop sin cambios de comportamiento; solo se unifica el contenedor y se mejora la experiencia en móvil.

### Bloque de título unificado
En todas las páginas del admin se aplica la misma estructura de título:
- Contenedor con `min-h-[5.5rem]`
- `h1` con `text-3xl font-light`
- Línea decorativa naranja
- Descripción con `text-xs`
- Botones opcionales a la derecha con `flex-shrink-0`

**Páginas actualizadas:** Turnos, Canchas, Usuarios, Productos, Ventas, Torneos, Panel de Administración (dashboard), Estadísticas.

---

## 3. Admin Torneos – Botones de formato

- **Orden visual:** En el Paso 1 del wizard de torneos, a la izquierda queda "Fase de grupos + Doble Eliminatoria" y a la derecha "Eliminatoria directa".
- **Valor por defecto:** `GROUPS_DOUBLE_ELIMINATION` (el botón de la izquierda queda preseleccionado al cargar o resetear el formulario).

Detalle completo en: [admin-torneos-formato-botones-2026-03.md](./admin-torneos-formato-botones-2026-03.md).

---

## 4. Script fix-radix-primitive

### Qué hace
- **Archivo:** `scripts/fix-radix-primitive.js`
- **Problema que aborda:** Copia anidada de `@radix-ui/primitive` dentro de `node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/primitive`, que puede provocar ENOENT en build.
- **Solución:** Elimina esa carpeta anidada para que Node use la versión en `node_modules/@radix-ui/primitive`.

### Uso
Ejecutar cuando sea necesario antes del build (por ejemplo en `postinstall` o de forma manual):

```bash
node scripts/fix-radix-primitive.js
```

---

## 5. Resumen por archivo

| Archivo | Cambios |
|--------|---------|
| `CHANGELOG.md` | Entrada [2026-03-05] y documentación de esta actualización. |
| `app/admin-panel/admin/canchas/page.tsx` | Ajustes de título/layout unificado. |
| `app/admin-panel/admin/page.tsx` | Ajustes de título/layout unificado. |
| `app/admin-panel/admin/productos/page.tsx` | Ajustes de título/layout unificado. |
| `app/admin-panel/admin/torneos/page.tsx` | Orden y preselección de botones de formato; título/layout. |
| `app/admin-panel/admin/turnos/page.tsx` | Ajustes de título/layout unificado. |
| `app/admin-panel/admin/usuarios/page.tsx` | Ajustes de título/layout unificado. |
| `app/admin-panel/components/AdminLayoutContent.tsx` | Contenedor común, navegación móvil con Sheet. |
| `app/admin-panel/components/AdminTitleButton.tsx` | Ajuste menor. |
| `app/admin-panel/estadisticas/page.tsx` | Ajustes de título/layout unificado. |
| `components/ui/sheet.tsx` | **Nuevo.** Componente Sheet (Radix). |
| `docs/actualizaciones/admin-torneos-formato-botones-2026-03.md` | **Nuevo.** Detalle botones de formato torneos. |
| `scripts/fix-radix-primitive.js` | **Nuevo.** Eliminación de `@radix-ui/primitive` anidado. |
| `package.json` / `package-lock.json` | Actualización de dependencias. |

---

## Referencias

- [admin-torneos-formato-botones-2026-03.md](./admin-torneos-formato-botones-2026-03.md) – Orden y preselección de botones de formato del torneo.
- [unificacion-titulos-admin-2026-02.md](./unificacion-titulos-admin-2026-02.md) – Antecedente de la unificación de títulos del panel admin.
