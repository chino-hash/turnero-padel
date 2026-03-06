# Pestaña Usuarios: consumibles, modal y listado (2026-03)

**Fecha:** Marzo 2026  
**Ruta:** `app/admin-panel/admin/usuarios/page.tsx`  
**Referencias:** Plan implementar-admin-usuarios-y-consumibles, plan modal_consumibles_y_ui, plan modal_consumibles_mejoras

Documentación de todos los cambios realizados en la pestaña Usuarios del panel de administración: programa de descuentos (consumibles), modal de edición, toggle de activación y simplificación del listado de usuarios.

---

## 1. Modelo Consumible y migraciones

### Schema Prisma (`prisma/schema.prisma`)

- **Consumible:** `id`, `tenantId`, `name`, `description?`, `requisitos?`, `discountPercent?`, `tipoBeneficio?` (`'descuento' | 'consumible'`), `productoId?` (FK a `Producto`), `isActive`, `sortOrder`, `createdAt`, `updatedAt`. Relación con `Tenant` y opcional con `Producto`.
- **Producto:** añadida relación `consumibles Consumible[]`.

### Migraciones

- `20260306000000_add_consumible`: tabla Consumible inicial.
- `20260307000000_consumible_requisitos_discount`: columnas `requisitos`, `discountPercent`.
- `20260307100000_consumible_tipo_beneficio`: columna `tipoBeneficio`.
- `20260307200000_consumible_producto_id`: columna `productoId`, índice y FK a `Producto.id` (ON DELETE SET NULL).

---

## 2. API Consumibles

### Rutas

- **GET/POST** `app/api/consumibles/route.ts`: listado por tenant (query `?activos=true`), creación con body validado por Zod. Incluye `include: { producto: { select: { id, nombre, precio } } }` en GET.
- **GET/PATCH/DELETE** `app/api/consumibles/[id]/route.ts`: uno por id, actualización parcial (name, description, requisitos, discountPercent, tipoBeneficio, productoId, isActive, sortOrder), mismo include de producto en GET y en respuesta de PATCH.

### Validaciones (`lib/validations/consumible.ts`)

- `consumibleCreateSchema` y `consumibleUpdateSchema`: `tipoBeneficio` (enum descuento/consumible opcional), `productoId` (entero positivo opcional), además de name, description, requisitos, discountPercent, isActive, sortOrder.

---

## 3. UI: tarjetas del programa de descuentos

### Estructura fija de 3 tarjetas (VIP, Premium, Regular)

- Siempre se muestran tres tarjetas (esqueleto), con datos del consumible guardado para esa categoría o valores por defecto (`DEFAULTS_CATEGORIAS`).
- Cada tarjeta muestra: badge de categoría, % (solo si tipo no es consumible), Requisitos, Beneficios (lista; si hay producto asociado se muestra nombre y precio), "X usuarios en esta categoría".

### Toggle de activación (fuera del modal)

- En el pie de cada tarjeta, **siempre visible** un **Switch** inmediatamente al lado del botón "Editar".
- **Texto junto al toggle:** "Activar" cuando está desactivado, "Desactivar" cuando está activado.
- **Comportamiento:**
  - Si **hay consumible guardado:** el Switch está activo; al hacer clic se llama `handleToggleConsumible(consumible, checked)` con actualización optimista (`setConsumibles`) y PATCH a `/api/consumibles/[id]` con `isActive: nextActive`. Si el PATCH falla, se revierte el estado local.
  - Si **no hay consumible:** al hacer clic en "activar" (Switch a on) se abre el modal de edición para crear/guardar el consumible.
- El switch "Activo" que estaba **dentro** del modal de consumible fue **eliminado**; la activación/desactivación se hace solo desde la tarjeta.

### Tarjeta cuando el beneficio es tipo consumible

- Si `tipoBeneficio === 'consumible'` y hay `producto` asociado, en Beneficios se muestra el nombre del producto (y precio si existe) y el porcentaje grande de la esquina se oculta (`showPercent`).

---

## 4. Modal de consumible

### Bloqueo de scroll

- `useEffect` que, cuando `showConsumibleModal === true`, asigna `document.body.style.overflow = 'hidden'` y restaura el valor anterior en el cleanup al cerrar.

### Orden del formulario

1. Nombre / Categoría (solo lectura cuando se edita una categoría fija).
2. Requisitos.
3. **Tipo de beneficio** (Select: —, Descuento, Consumible).
4. Según tipo: **Descuento % (0-100)** si tipo = descuento; **Selector de producto** (GET `/api/productos`) si tipo = consumible.
5. **Beneficios (incluir en tarjeta):** solo visible cuando tipo = **consumible**. Lista de líneas con checkbox "Incluir en tarjeta" + input por línea y botón "Añadir línea". Al guardar se persiste en `description` solo las líneas marcadas.
6. **Umbral de categoría:** solo si se está editando una categoría fija: **VIP** muestra solo "VIP (mín. reservas)"; **Premium** solo "Premium (mín. reservas)"; **Regular** no muestra bloque de umbrales.
7. Botones Cancelar y Guardar.

Al guardar, si se está editando una categoría fija (VIP/Premium), además se envía PATCH a `/api/admin/config/categorias-usuario` con los valores actuales de `configCategorias`.

### Eliminación de la tarjeta "Categorías de usuarios"

- El Card que contenía los inputs "VIP (mín. reservas)" y "Premium (mín. reservas)" con botón Guardar fue **eliminado**. Esa configuración se edita solo dentro del modal de consumible al editar VIP o Premium.

### Carga de productos

- Al abrir el modal (`showConsumibleModal === true`) se hace GET `/api/productos` y se guarda en estado `productos` para el selector cuando tipo = consumible.

---

## 5. Estado del formulario de consumible

- `consumibleForm` incluye: name, description, requisitos, discountPercent, tipoBeneficio, productoId, isActive, **benefitLines** (string[]), **benefitIncluded** (boolean[]).
- Al abrir para editar: `benefitLines` y `benefitIncluded` se derivan de `description` (split por líneas; todas incluidas por defecto).
- Al guardar: `description` se arma con las líneas de `benefitLines` cuyo `benefitIncluded[i]` es true.

---

## 6. Listado de usuarios: acciones reducidas

- En la tabla del listado de usuarios se **eliminaron** los botones **Editar** y **Desactivar/Activar** de la columna de acciones.
- Queda únicamente el botón **Ver detalle**, que abre el modal con pestañas Info, Reservas y Pagos.
- No se puede editar usuario, cambiar rol ni activar/desactivar desde la tabla; solo consultar detalle.

Los modales de "Editar usuario" y el AlertDialog de "Desactivar/Activar" siguen en el código pero ya no se accede a ellos desde la tabla (solo desde "Ver detalle" si en el futuro se añade ahí).

---

## 7. Archivos modificados o creados

| Archivo | Cambios |
|--------|---------|
| `prisma/schema.prisma` | Modelo Consumible (requisitos, discountPercent, tipoBeneficio, productoId); relación Producto.consumibles. |
| `prisma/migrations/*` | Cuatro migraciones indicadas arriba. |
| `lib/validations/consumible.ts` | tipoBeneficio, productoId en create/update. |
| `app/api/consumibles/route.ts` | Aceptar y persistir tipoBeneficio, productoId; include producto en GET. |
| `app/api/consumibles/[id]/route.ts` | PATCH con tipoBeneficio, productoId; include producto en GET y PATCH. |
| `app/admin-panel/admin/usuarios/page.tsx` | Scroll lock, estado consumibleForm (benefitLines, benefitIncluded, productoId), fetch productos, modal reordenado y condicional (tipo descuento/consumible, umbral por categoría, beneficios solo si consumible), tarjetas con Switch siempre visible y etiqueta Activar/Desactivar, handleToggleConsumible con optimista y parámetro nextActive, eliminación Card Categorías de usuarios, eliminación botones Editar y Desactivar/Activar en tabla usuarios. |

---

## 8. Resumen de comportamiento para el usuario

- **Programa de descuentos:** Siempre se ven las 3 tarjetas (VIP, Premium, Regular). En cada una puede editar requisitos, tipo de beneficio (descuento o consumible), porcentaje o producto, y beneficios (si tipo consumible), y activar/desactivar con el toggle al lado de "Editar". Los umbrales VIP/Premium se configuran dentro del modal al editar esa categoría.
- **Listado de usuarios:** Solo se puede ver detalle de cada usuario; no hay acciones de editar ni activar/desactivar en la tabla.
