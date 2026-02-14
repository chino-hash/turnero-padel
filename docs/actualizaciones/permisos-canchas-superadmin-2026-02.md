# Permisos de canchas: solo Superadmin agrega y elimina

**Fecha:** 13 de febrero de 2026

Documentación de los cambios que restringen la creación y eliminación de canchas al Super Administrador, y dejan al admin del tenant únicamente la posibilidad de editar canchas existentes.

---

## Objetivo

- **Superadmin**: puede agregar canchas (Nueva Cancha), eliminar canchas (Eliminar), activar/desactivar (Switch) y editar.
- **Admin del tenant**: solo puede editar canchas (nombre, precio, descripción, estado activo); no ve ni usa los botones de agregar cancha ni eliminar cancha, ni el switch de activa/inactiva.

Con esto se evita que un admin de un tenant cree o borre canchas; la estructura de canchas queda bajo control del superadmin.

---

## Resumen de cambios

1. **API de canchas**
   - **POST** (crear): ya estaba restringido a superadmin; se mantiene.
   - **DELETE** (eliminar): nuevo handler que solo permite al superadmin; responde 403 con mensaje claro si no es superadmin.
   - Eliminación implementada como soft delete (`deletedAt` + `isActive: false`).

2. **Servicio de canchas**
   - Nueva función `deleteCourt(id)` que hace soft delete.
   - `getCourts` y `getAllCourts` filtran por `deletedAt: null` para no devolver canchas eliminadas.

3. **UI – Gestión de canchas**
   - Botón **Nueva Cancha**: solo visible para superadmin.
   - Botón **Eliminar**: solo visible para superadmin.
   - **Switch** Activa/Inactiva: solo visible para superadmin.
   - Botón **Editar**: visible para superadmin y admin del tenant (única acción de canchas para el admin del tenant).

---

## 1. Cambios en la API (`app/api/courts/route.ts`)

### GET
- Sin cambios de permisos. Sigue devolviendo canchas según rol (superadmin ve todas; admin del tenant las de su tenant; público/usuario las activas del tenant).

### POST (crear cancha)
- Requiere sesión de admin.
- Comprueba `isSuperAdminUser(user)`.
- Si no es superadmin: responde **403** con `"Solo el Super Administrador puede crear canchas"`.
- Si es superadmin: crea la cancha y devuelve 201.

### PUT (actualizar cancha)
- Sin cambios de permisos. Sigue permitiendo al admin del tenant actualizar canchas de su tenant (editar datos y, si en el futuro se expone en UI, activar/desactivar).

### DELETE (eliminar cancha) – nuevo
- Requiere sesión de admin.
- Comprueba `isSuperAdminUser(user)`.
- Si no es superadmin: responde **403** con `"Solo el Super Administrador puede eliminar canchas"`.
- Si es superadmin:
  - Lee `id` por query: `?id=...`.
  - Comprueba que la cancha exista.
  - Llama a `deleteCourt(id)` (soft delete).
  - Emite evento SSE `courtsUpdated` con `action: 'deleted'`.
  - Devuelve la cancha actualizada.

---

## 2. Cambios en el servicio de canchas (`lib/services/courts.ts`)

### Nueva función: `deleteCourt(id: string)`
- Actualiza la cancha con `deletedAt: new Date()` e `isActive: false`.
- No borra el registro; las canchas eliminadas dejan de aparecer en listados al filtrar por `deletedAt: null`.

### Filtro de canchas eliminadas
- **getCourts**: el `where` incluye `deletedAt: null` además de `isActive: true` (y `tenantId` si aplica).
- **getAllCourts**: el `where` incluye `deletedAt: null` (y `tenantId` si aplica).

Así, las canchas dadas de baja no se listan ni en vista pública ni en administración.

---

## 3. Cambios en la UI (`app/admin-panel/admin/canchas/page.tsx`)

Se usa `isSuperAdmin` (derivado de `session?.user?.isSuperAdmin`) para mostrar u ocultar acciones.

| Elemento              | Superadmin | Admin tenant |
|----------------------|------------|--------------|
| Botón "Nueva Cancha" (header) | Sí         | No           |
| Switch Activa/Inactiva (por cancha) | Sí | No           |
| Botón "Editar"        | Sí         | Sí           |
| Botón "Eliminar"      | Sí         | No           |

- El admin del tenant sigue viendo el texto "Activa" / "Inactiva" en cada tarjeta (solo lectura).
- El modal de agregar/editar se abre con "Editar" para ambos roles; la creación (formulario sin cancha en edición) solo la dispara el botón "Nueva Cancha", visible solo para superadmin.

---

## 4. Archivos modificados

| Archivo | Cambios |
|---------|--------|
| `app/api/courts/route.ts` | Import de `deleteCourt`; nuevo handler `DELETE` con validación de superadmin. |
| `lib/services/courts.ts` | Función `deleteCourt`; en `getCourts` y `getAllCourts` filtro `deletedAt: null`. |
| `app/admin-panel/admin/canchas/page.tsx` | Botón "Nueva Cancha" condicionado a `isSuperAdmin`; Switch condicionado a `isSuperAdmin`; botón "Eliminar" condicionado a `isSuperAdmin`. |

---

## 5. Comportamiento por rol

### Super Administrador
- Ve el botón **Nueva Cancha** en el header de Gestión de Canchas.
- En cada cancha ve: **Switch** (Activa/Inactiva), **Editar**, **Eliminar**.
- Puede crear, editar, activar/desactivar y eliminar canchas (de cualquier tenant si aplica).

### Admin del tenant
- No ve "Nueva Cancha" ni "Eliminar" ni el Switch.
- Solo ve **Editar** en cada cancha y el texto "Activa"/"Inactiva".
- Puede abrir el modal de edición y guardar cambios (nombre, precio, descripción, etc.); la API PUT sigue permitiendo actualizar canchas de su tenant.

---

## Referencias

- API de canchas: `app/api/courts/route.ts`
- Servicio de canchas: `lib/services/courts.ts`
- Página de gestión de canchas: `app/admin-panel/admin/canchas/page.tsx`
- Permisos y superadmin: `lib/admin-system.ts` (`isSuperAdmin`), `lib/utils/permissions.ts` (`isSuperAdminUser`)
- Modelo Court (soft delete): `prisma/schema.prisma` (campo `deletedAt` en `Court`)
