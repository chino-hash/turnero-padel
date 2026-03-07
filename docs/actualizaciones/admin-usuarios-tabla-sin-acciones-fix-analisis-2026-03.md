# Admin Usuarios: tabla sin acciones y fix API análisis (2026-03)

**Fecha:** Marzo 2026  
**Rutas:** `app/admin-panel/admin/usuarios/page.tsx`, `app/api/usuarios/analisis/route.ts`

Documentación de dos cambios: corrección del error 500 en la API de análisis de usuarios y eliminación de los botones de acción (Ver detalle, Editar, Desactivar) en la tabla de usuarios.

---

## 1. Corrección error 500 en API análisis de usuarios

### Problema

La ruta `GET /api/usuarios/analisis` devolvía **500 Internal Server Error**. El hook `useAnalisisUsuarios` (que llama a esta API) lanzaba el error en consola y la sección de análisis no cargaba.

### Causa

En la ruta se usaba **conteo filtrado** de Prisma sobre una relación:

```ts
include: {
  _count: {
    select: {
      bookings: {
        where: {
          bookingDate: { gte: inicioMes },
          deletedAt: null,
        },
      },
    },
  },
  // ...
}
```

Esa sintaxis requiere la preview feature **`filteredRelationCount`** en `prisma/schema.prisma`. Al no estar habilitada, Prisma lanzaba un error y la API respondía 500.

### Solución

- Se eliminó el bloque `_count` con `where` del `findMany` de usuarios con reservas.
- El campo **`reservasMes`** (reservas del usuario en el mes actual) se calcula en el mapeo a partir de las reservas ya cargadas:

  ```ts
  const reservasMes = todasLasReservas.filter(
    (b) => new Date(b.bookingDate) >= inicioMes
  ).length
  ```

- **Archivo:** `app/api/usuarios/analisis/route.ts`.

El resultado del análisis (métricas, clientes frecuentes, retención, etc.) se mantiene; solo se evita el uso de la API de Prisma que no estaba habilitada.

---

## 2. Eliminación de botones de acción en la tabla de usuarios

### Cambio solicitado

En la sección **Usuarios** del panel de administración, la tabla de listado de usuarios tenía una columna **Acciones** con tres botones por fila:

- **Ver detalle** – abría un modal con información del usuario, reservas y pagos.
- **Editar** – abría un modal para editar nombre, email, teléfono, rol, estado activo y descuento.
- **Desactivar / Activar** – abría un diálogo de confirmación para cambiar el estado del usuario.

Se eliminaron **de raíz**: columna de acciones, botones y toda la lógica y UI asociadas.

### Cambios realizados

#### UI

- Eliminada la columna **Acciones** del encabezado de la tabla.
- Eliminada la celda con los tres botones en cada fila de usuario.

La tabla queda con las columnas: **Nombre**, **Email**, **Categoría**, **Reservas**, **Última reserva**, **Estado**, **Descuento %**.

#### Estado y lógica eliminados

- Estado: `editingUser`, `userForm`, `submittingUser`, `activarDesactivarUser`, `submittingActivar`, `detailUser`, `detailUserFull`, `detailBookings`, `loadingDetail`.
- Funciones: `openEditUser`, `closeEditUser`, `submitUserEdit`, `confirmActivarDesactivar`.
- `useEffect` que cargaba el detalle del usuario al seleccionar uno.

#### Modales / diálogos eliminados

- Modal **Editar usuario** (formulario con nombre, email, teléfono, rol, activo, descuento %).
- **AlertDialog** de confirmación para Activar/Desactivar usuario.
- Modal **Detalle** de usuario (pestañas Info, Reservas, Pagos).

#### Imports

- Eliminados: componentes `AlertDialog*`, `Tabs` / `TabsContent` / `TabsList` / `TabsTrigger`, e iconos `User` y `CreditCard` de lucide-react (solo usados en los modales eliminados).

### Archivo afectado

- `app/admin-panel/admin/usuarios/page.tsx`

El resto de la página (métricas de análisis, invitaciones, programa de descuentos/consumibles, configuración de categorías, listado con filtros y paginación) no se modifica.
