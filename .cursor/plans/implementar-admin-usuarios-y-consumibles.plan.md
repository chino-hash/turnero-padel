---
name: Admin Usuarios + Consumibles (plan combinado)
overview: Plan único que combina (1) pendientes de la pestaña Usuarios (alineación UI, listado paginado, CRUD/edición, detalle, descuentos y config categorías) y (2) sustitución del Programa de Descuentos fijo por Consumibles editables y activables (Switch como canchas).
status: pending
todos:
  - id: consumibles-modelo-api
    content: "Modelo Consumible en Prisma, migración; API GET/POST /consumibles y GET/PATCH/DELETE /consumibles/[id]"
  - id: consumibles-ui
    content: "En página Usuarios: quitar programaDescuentos; sección Consumibles con lista, Switch isActive, Editar, Nuevo consumible"
  - id: fase1-ui
    content: "Alineación UI (space-y-8, Cards como Turnos) y opcional CTA en header"
  - id: fase1-api-listado
    content: "GET /api/usuarios con paginación, filtros (q, categoria, actividad), Zod, createSuccessResponse"
  - id: fase1-tabla
    content: "Tabla con búsqueda debounced, filtros, paginación, hook useUsuariosList, estados loading/empty/error"
  - id: fase2-edicion
    content: "Edición (modal/sheet) y Activar/Desactivar vía CRUD PATCH; validación no auto-editarse"
  - id: fase2-crear
    content: "Flujo Crear/Invitar usuario (POST CRUD o invite) y botón en header"
  - id: fase3-detalle
    content: "Detalle usuario (modal/sheet con pestañas Info, Reservas, Pagos); GET /api/bookings?userId="
  - id: fase4-descuento
    content: "Campo User.discountPercent (nullable); edición en formulario y tabla"
  - id: fase4-config
    content: "Config umbrales VIP/Premium (GET/PATCH categorias-usuario); uso en análisis y listado"
isProject: false
---

# Plan combinado: Admin Usuarios + Consumibles

Referencias:
- [docs/pasos/admin-usuarios-pendientes.md](docs/pasos/admin-usuarios-pendientes.md)
- Plan iterado Admin Usuarios + Plan Consumibles editables/activables

---

## Contexto

- **Página:** [app/admin-panel/admin/usuarios/page.tsx](app/admin-panel/admin/usuarios/page.tsx) — header con barra naranja y grid de 4 Cards; datos vía [hooks/useAnalisisUsuarios.ts](hooks/useAnalisisUsuarios.ts) desde [app/api/usuarios/analisis/route.ts](app/api/usuarios/analisis/route.ts). Hoy incluye el Card "Programa de Descuentos para Usuarios Regulares" con beneficios VIP/Premium/Regular **hardcodeados**.
- **Objetivo combinado:** (1) Completar pendientes de la pestaña Usuarios (listado paginado, CRUD, detalle, descuentos, config categorías). (2) Sustituir ese programa fijo por **Consumibles**: ítems en BD que el admin puede crear, editar y activar/desactivar con un **Switch** (patrón [app/admin-panel/admin/canchas/page.tsx](app/admin-panel/admin/canchas/page.tsx)).
- **Existente:** CRUD `user` en [app/api/crud/[...params]/route.ts](app/api/crud/[...params]/route.ts); [app/api/users/search/route.ts](app/api/users/search/route.ts); modelo User en [prisma/schema.prisma](prisma/schema.prisma).

---

## Parte A: Consumibles (sustitución del Programa de Descuentos)

Se puede implementar primero o en paralelo a la Fase 1; no depende del listado paginado de usuarios.

### A.1 Modelo de datos

En [prisma/schema.prisma](prisma/schema.prisma):

- Nuevo modelo **Consumible**: `id`, `tenantId`, `name`, `description?`, `isActive` (default true), `sortOrder` (default 0), `createdAt`, `updatedAt`; relación con Tenant.
- En **Tenant** añadir: `consumibles Consumible[]`.
- Migración: `npx prisma migrate dev --name add_consumible`.

Opcional más adelante: campo `categoria` (VIP | Premium | Regular) para agrupar consumibles por categoría.

### A.2 API Consumibles

- **GET** `app/api/consumibles/route.ts`: listar consumibles del tenant (auth ADMIN/SUPER_ADMIN; `getUserTenantIdSafe`). Query opcional `?activos=true`. Orden: `sortOrder asc`, `createdAt`.
- **POST** `app/api/consumibles/route.ts`: crear (body: `name`, `description?`, `isActive?`, `sortOrder?`). Zod; asignar `tenantId`.
- **GET** `app/api/consumibles/[id]/route.ts`: uno por id (y que pertenezca al tenant).
- **PATCH** `app/api/consumibles/[id]/route.ts`: actualizar `name`, `description`, **isActive**, `sortOrder` (usado por Switch y por formulario Editar).
- **DELETE** `app/api/consumibles/[id]/route.ts`: opcional.

Permisos: mismo criterio que análisis usuarios; Super Admin opcionalmente con `x-tenant-id`.

### A.3 UI en página Usuarios

En [app/admin-panel/admin/usuarios/page.tsx](app/admin-panel/admin/usuarios/page.tsx):

- **Quitar:** array `programaDescuentos` (líneas 60–93) y el Card "Programa de Descuentos para Usuarios Regulares" (grid de 3 columnas con beneficios fijos).
- **Añadir:** estado `consumibles`, `loadingConsumibles`, `errorConsumibles`; fetch GET `/api/consumibles` al montar.
- **Nueva sección "Consumibles":**
  - Título y descripción (ej. "Beneficios o consumibles visibles. Activa o desactiva cada uno.").
  - Botón "Nuevo consumible" → modal/sheet con nombre (obligatorio), descripción opcional, activo por defecto → POST.
  - Lista (tarjetas o tabla): nombre, descripción; **Switch** para `isActive` (al cambiar → PATCH con `{ isActive }` y refetch); botón **Editar** (modal con nombre/descripción → PATCH).
- Patrón del Switch: igual que canchas (`handleToggleActive` → PUT courts); aquí `handleToggleConsumible` → PATCH `/api/consumibles/[id]` con `{ isActive: !consumible.isActive }`.

---

## Fase 1: Alineación UI y listado paginado con filtros

### 1.1 Ajustes de UI

- Contenedor principal `space-y-6` → `space-y-8`.
- Cards de métricas: `CardHeader` + `CardTitle` + `CardContent` como en [app/admin-panel/admin/turnos/page.tsx](app/admin-panel/admin/turnos/page.tsx).
- Header: mantener "Actualizar"; en Fase 2 añadir "Invitar usuario" cuando exista el flujo.

### 1.2 GET /api/usuarios (listado paginado)

Crear **GET** `app/api/usuarios/route.ts`:

- Auth: ADMIN o SUPER_ADMIN; `getUserTenantIdSafe`; opcional `x-tenant-id` para Super Admin.
- Query (Zod): `page`, `limit`, `sortBy`, `sortOrder`, `q` (nombre/email), `categoria` (VIP|Premium|Regular), `actividad` (activos|inactivos|nuevos).
- Lógica: usuarios del tenant, `deletedAt: null`; calcular reservas, última reserva, categoría (umbrales por defecto 20/10; en Fase 4 desde config). Ordenación: por nombre/email/createdAt en DB; si `sortBy=reservas|ultimaReserva`, fetch acotado + orden en memoria + paginar.
- Respuesta: `createSuccessResponse` con `data` y `meta` (page, limit, total, totalPages).

### 1.3 Tabla en la UI

- Hook `hooks/useUsuariosList.ts`: parámetros (page, limit, sortBy, sortOrder, q, categoria, actividad) → `{ data, meta, loading, error, refetch }`.
- Página: barra búsqueda (debounce), filtros categoría/actividad, tabla con cabeceras ordenables y paginación; estados loading (skeleton), empty, error (Reintentar).
- Métricas (Total, Activos, Nuevos, Retención) siguen de `useAnalisisUsuarios`.

---

## Fase 2: Gestión de usuarios (CRUD / edición y creación)

- **Edición y activar/desactivar:** PATCH `/api/crud/user/[id]` para name, fullName, email, phone, role, isActive. Validación: si `session.user.id === id`, rechazar PATCH que ponga role no ADMIN/SUPER_ADMIN o `isActive: false`. UI: por fila "Editar" (modal/sheet) y "Activar/Desactivar" (AlertDialog + PATCH).
- **Crear usuario:** POST CRUD user o POST `app/api/usuarios/invitar/route.ts` (email, name, phone?). Botón "Invitar usuario" en header que abra modal.

---

## Fase 3: Detalle de usuario

- "Ver detalle" abre modal/sheet con pestañas: **Info** (contacto, categoría, descuento), **Reservas** (GET `/api/bookings?userId=`), **Pagos/Deuda** (resumen desde bookings o GET `/api/usuarios/[id]/resumen`). Usuario: GET `/api/crud/user/[id]`.

---

## Fase 4: Descuentos y configuración de categorías

- **User.discountPercent** (Int?, migración): null = calculado; 0 = 0%; otro = override. PATCH CRUD; en edición y detalle campo "Descuento %".
- **Umbrales categorías:** SystemSetting `usuario.categoria.vip.minReservas`, `usuario.categoria.premium.minReservas`. GET/PATCH `app/api/admin/config/categorias-usuario/route.ts`; en análisis y GET usuarios usar esos umbrales. UI: bloque "Categorías de usuarios" con inputs y Guardar.

---

## Huecos tapados (resumen)

| Hueco | Decisión |
|-------|----------|
| CREATE usuario | Invitar usuario (POST CRUD o /api/usuarios/invitar); botón en header. |
| Ordenación reservas/ultimaReserva | v1: sort por nombre/email/createdAt en DB; si sortBy reservas|ultimaReserva, fetch acotado + sort en memoria. |
| Historial reservas | GET /api/bookings?userId= (sin nuevo endpoint). |
| Zod en GET /api/usuarios | paginationSchema + q, categoria, actividad. |
| Estados tabla | Loading, empty, error + Reintentar. |
| discountPercent | Int?; null = calculado, 0 = 0%, otro = override. |
| Config categorías | GET/PATCH /api/admin/config/categorias-usuario. |
| Super Admin tenant | x-tenant-id en GET usuarios; selector en UI si se desea. |
| useUsuariosList | Hook con params y refetch. |
| No auto-editarse | PATCH user: si session.id === id y (role baja o isActive false) → 403. |
| **Consumibles** | Modelo Consumible; API dedicada; en Usuarios reemplazar Card fijo por sección con lista, Switch, Editar, Nuevo. |

---

## Orden sugerido de implementación

1. **Parte A (Consumibles):** Modelo Consumible + migración → API consumibles (GET/POST, GET/PATCH/DELETE [id]) → en página Usuarios quitar programaDescuentos y añadir sección Consumibles (lista, Switch, Editar, Nuevo).
2. **Fase 1:** UI (space-y-8, Cards) → GET /api/usuarios → useUsuariosList → tabla con búsqueda, filtros, paginación, estados.
3. **Fase 2:** Validación no auto-editarse en CRUD PATCH user → UI Editar y Activar/Desactivar → Invitar usuario y botón en header.
4. **Fase 3:** Detalle (modal/sheet, pestañas Info / Reservas / Pagos).
5. **Fase 4:** User.discountPercent + GET/PATCH categorias-usuario + uso en análisis y listado + UI config y edición descuento.

```mermaid
flowchart LR
  subgraph A [Parte A]
    A1[Modelo Consumible]
    A2[API consumibles]
    A3[UI Consumibles en Usuarios]
  end
  subgraph F1 [Fase 1]
    B1[UI space-y-8 Cards]
    B2[GET /api/usuarios]
    B3[Tabla filtros paginación]
  end
  subgraph F2 [Fase 2]
    C[Edición Invitar]
  end
  subgraph F3 [Fase 3]
    D[Detalle pestañas]
  end
  subgraph F4 [Fase 4]
    E[discountPercent config]
  end
  A1 --> A2 --> A3
  B1 --> B2 --> B3 --> C --> D --> E
```

---

## Archivos principales

| Acción | Archivo |
|--------|---------|
| Modificar | [prisma/schema.prisma](prisma/schema.prisma): modelo Consumible, relación Tenant; luego User.discountPercent (Fase 4) |
| Crear | `app/api/consumibles/route.ts` (GET, POST) |
| Crear | `app/api/consumibles/[id]/route.ts` (GET, PATCH, DELETE opcional) |
| Modificar | [app/admin-panel/admin/usuarios/page.tsx](app/admin-panel/admin/usuarios/page.tsx): quitar programaDescuentos; sección Consumibles; luego Fases 1–4 |
| Crear | `app/api/usuarios/route.ts` (GET listado paginado) |
| Crear | `hooks/useUsuariosList.ts` |
| Opcional | `app/api/usuarios/invitar/route.ts`, `app/api/usuarios/[id]/resumen/route.ts` |
| Crear | `app/api/admin/config/categorias-usuario/route.ts` |
| Ajustar | [app/api/usuarios/analisis/route.ts](app/api/usuarios/analisis/route.ts) (umbrales Fase 4) |
| Ajustar | [app/api/crud/[...params]/route.ts](app/api/crud/[...params]/route.ts) (no auto-editarse en PATCH user) |
| Reutilizar | GET [app/api/bookings/route.ts](app/api/bookings/route.ts) (userId), CRUD user |

---

## Consideraciones

- **Multitenant:** Todo por `tenantId`; Super Admin con `x-tenant-id` o selector si se implementa.
- **Permisos:** Solo ADMIN y SUPER_ADMIN; no auto-editarse (rol/isActive).
- **UI:** Componentes [components/ui](components/ui); estilos alineados con Turnos/Torneos y Canchas (Switch para activar/desactivar).
