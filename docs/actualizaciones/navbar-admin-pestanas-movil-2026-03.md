# Corrección: pestañas de la navbar del admin en pantalla reducida (2026-03-05)

**Fecha:** 5 de marzo de 2026  
**Tipo:** Corrección (bugfix)

## Problema

En el panel de administración, cuando la pantalla está reducida (móvil o ventana estrecha), las pestañas de navegación (Canchas, Turnos, Usuarios, Estadísticas, Productos, Torneo) no se veían. Solo aparecía el ícono de menú hamburguesa; al abrirlo, el menú lateral podía no mostrarse correctamente o quedar tapado por el header.

## Causas identificadas

1. **Sheet con import incorrecto:** El componente `Sheet` (`components/ui/sheet.tsx`) importaba el Dialog desde el paquete barrel `"radix-ui"`, lo que podía provocar que el menú desplegable no se abriera o no se comportara bien.
2. **Orden de apilamiento (z-index):** El header del admin no tenía un `z-index` explícito; en algunos contextos el overlay/contenido del Sheet (z-50) podía quedar por debajo visualmente.
3. **Scroll del menú móvil:** Con varios ítems en el menú lateral, no había scroll interno, por lo que en pantallas muy pequeñas los enlaces inferiores podían quedar fuera de vista.

## Solución implementada

### 1. Componente Sheet – import de Radix

**Archivo:** `components/ui/sheet.tsx`

- **Antes:** `import { Dialog as SheetPrimitive } from "radix-ui"`
- **Después:** `import * as SheetPrimitive from "@radix-ui/react-dialog"`

Se usa el mismo paquete que en `components/ui/dialog.tsx` (`@radix-ui/react-dialog`), garantizando que el Sheet se abra y cierre correctamente al pulsar el botón de hamburguesa.

### 2. Header del admin – z-index

**Archivo:** `app/admin-panel/components/AdminLayoutContent.tsx`

- Se añadió al `<header>` la clase **`relative z-40`**.
- El Sheet y su overlay siguen usando **`z-50`**, por lo que el menú lateral queda siempre por encima del header cuando está abierto.

### 3. Menú lateral – scroll

**Archivo:** `app/admin-panel/components/AdminLayoutContent.tsx`

- Al `<nav>` interior del Sheet se le añadieron las clases **`overflow-y-auto flex-1 min-h-0`**.
- Así, si hay muchos ítems (incl. Super Admin), el contenido del menú hace scroll y todas las pestañas siguen siendo accesibles en pantallas pequeñas.

## Comportamiento esperado

- **Pantalla reducida (< lg):** Las pestañas no se muestran en la barra; solo el ícono de hamburguesa (☰) a la derecha.
- **Al tocar el ícono:** Se abre el panel lateral izquierdo con todas las pestañas (Canchas, Turnos, Usuarios, Estadísticas, Productos, Torneo y Super Admin si aplica).
- El menú queda por encima del header y, si no caben todos los ítems, se puede hacer scroll dentro del panel.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/ui/sheet.tsx` | Import de `@radix-ui/react-dialog` en lugar de `radix-ui`. |
| `app/admin-panel/components/AdminLayoutContent.tsx` | Header con `relative z-40`; `<nav>` del Sheet con `overflow-y-auto flex-1 min-h-0`. |

## Referencias

- [admin-panel-sheet-layout-2026-03.md](./admin-panel-sheet-layout-2026-03.md) – Introducción del Sheet para la navegación móvil del panel admin.
