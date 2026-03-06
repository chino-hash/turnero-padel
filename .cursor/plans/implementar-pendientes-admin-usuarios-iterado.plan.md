---
name: Implementar pendientes Admin Usuarios (iterado)
overview: Plan iterado para implementar los pendientes de la pestaña Usuarios del admin, con huecos tapados: alineación UI, listado paginado con filtros, CRUD/edición, detalle con pestañas, descuentos y configuración de categorías. Incluye decisiones sobre ordenación, reutilización de APIs, validación y estados de UI.
status: pending
todos:
  - id: fase1-ui
    content: "Alineación UI (space-y-8, Cards como Turnos) y opcional CTA en header"
  - id: fase1-api-listado
    content: "GET /api/usuarios con paginación, filtros (q, categoria, actividad), Zod, createSuccessResponse"
  - id: fase1-tabla
    content: "Tabla con búsqueda debounced, filtros, paginación, hook useUsuariosList, estados loading/empty/error"
  - id: fase2-edicion
    content: "Edición (modal/sheet) y Activar/Desactivar vía CRUD PATCH; validación no auto-editarse"
  - id: fase2-crear
    content: "Flujo Crear/Invitar usuario (email + nombre, POST CRUD o invite) y botón en header"
  - id: fase3-detalle
    content: "Detalle usuario (modal/sheet con pestañas Info, Reservas, Pagos); GET /api/bookings?userId="
  - id: fase4-descuento
    content: "Campo User.discountPercent (nullable); edición en formulario y tabla"
  - id: fase4-config
    content: "Config umbrales VIP/Premium (SystemSetting o GET/PATCH categorias-usuario); uso en análisis y listado"
isProject: false
---

# Plan: Implementar pendientes Admin Usuarios (iterado)

Referencia: [docs/pasos/admin-usuarios-pendientes.md](docs/pasos/admin-usuarios-pendientes.md)

---

## Contexto

- **Página actual:** [app/admin-panel/admin/usuarios/page.tsx](app/admin-panel/admin/usuarios/page.tsx) — header con barra naranja y grid de 4 Cards; datos vía [hooks/useAnalisisUsuarios.ts](hooks/useAnalisisUsuarios.ts) desde [app/api/usuarios/analisis/route.ts](app/api/usuarios/analisis/route.ts).
- **Limitaciones:** La API de análisis devuelve solo top 10 usuarios frecuentes (sin paginación), sin filtros ni búsqueda. No hay UI de edición ni detalle.
- **Existente:** CRUD para `user` en [app/api/crud/[...params]/route.ts](app/api/crud/[...params]/route.ts) (GET list con `page`, `limit`, `sortBy`, `sortOrder`, filtros; GET/PATCH/DELETE por id). Búsqueda typeahead en [app/api/users/search/route.ts](app/api/users/search/route.ts). Modelo User en [prisma/schema.prisma](prisma/schema.prisma): `tenantId`, `name`, `fullName`, `email`, `phone`, `role`, `isActive`, `deletedAt`.

---

## Fase 1: Alineación UI y listado paginado con filtros

### 1.1 Ajustes de UI (punto 0 del doc)

- En [app/admin-panel/admin/usuarios/page.tsx](app/admin-panel/admin/usuarios/page.tsx): contenedor principal `space-y-6` → `space-y-8`.
- Cards de métricas: usar `CardHeader` + `CardTitle` + `CardContent` como en [app/admin-panel/admin/turnos/page.tsx](app/admin-panel/admin/turnos/page.tsx) (líneas 358-408).
- Header: mantener "Actualizar"; en Fase 2 añadir botón "Invitar usuario" o "Nuevo usuario" cuando exista el flujo de creación.

### 1.2 Endpoint GET listado paginado con filtros

Crear **GET** `app/api/usuarios/route.ts`:

- Auth: sesión + rol ADMIN o SUPER_ADMIN; `getUserTenantIdSafe` para tenant (multitenant). Super Admin: aceptar `x-tenant-id` opcional para ver otro club.
- Query params validados con **Zod** (p. ej. extender `paginationSchema` de [lib/validations/common.ts](lib/validations/common.ts) con `q`, `categoria`, `actividad`):
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `q`: búsqueda por nombre/email (OR contains insensitive en `name`, `fullName`, `email`)
  - `categoria`: VIP | Premium | Regular (filtrar por categoría calculada)
  - `actividad`: activos | inactivos | nuevos (activos = reserva en últimos 30d; inactivos = sin reserva en últimos 30d; nuevos = createdAt último mes)
- Lógica: usuarios del tenant con `deletedAt: null`; para cada usuario (o por lotes) calcular total reservas, última reserva, categoría según umbrales (por defecto 20/10; en Fase 4 leer de config). Aplicar filtros en memoria o con subqueries según decisión de ordenación (ver más abajo).
- Respuesta: `createSuccessResponse` de [lib/validations/common.ts](lib/validations/common.ts) con `data` (array de items) y `meta`: `{ page, limit, total, totalPages }` (`calculatePaginationMeta`).

**Ordenación (decisión para tapar hueco):**

- **sortBy por columnas de BD:** `nombre` (name/fullName), `email`, `createdAt` — ordenar en la query con `orderBy`.
- **sortBy por campos calculados (reservas, ultimaReserva):** no se puede ordenar directamente en SQL sin agregados. Opciones:
  - **v1 (recomendada):** Ordenación servidor solo por `nombre`, `email`, `createdAt`. Columnas "Reservas" y "Última reserva" son solo de visualización; si el usuario ordena por ellas en la UI, enviar `sortBy=reservas` y en backend: (a) cargar todos los usuarios del tenant con un límite razonable (ej. 1000), (b) calcular reservas/ultimaReserva, (c) ordenar en memoria y paginar en memoria. Documentar límite para tenants muy grandes.
  - **v2 (futura):** Vista materializada o columna cacheada `totalBookings`/`lastBookingDate` en User, actualizada por job o trigger.
- En el plan se implementa v1: ordenación por nombre/email/createdAt en DB; si `sortBy=reservas` o `ultimaReserva`, aplicar lógica "fetch acotado + sort in memory + slice".

### 1.3 Tabla en la UI: búsqueda, filtros, paginación, estados

- **Hook:** Crear `hooks/useUsuariosList.ts` que reciba `(page, limit, sortBy, sortOrder, q, categoria, actividad)` y llame a GET `/api/usuarios`; devolver `{ data, meta, loading, error, refetch }`. Evita duplicar lógica en la página.
- Estado en página: `page`, `limit`, `sortBy`, `sortOrder`, `q`, `categoria`, `actividad`. Barra de búsqueda con debounce (ej. 300ms) que actualice `q`.
- Filtros: dos Select (o tabs) para categoría y actividad.
- Tabla: cabeceras ordenables (nombre, email, reservas, última reserva, categoría, descuento, acciones). Paginación: anterior/siguiente, tamaño de página, texto "Mostrando X–Y de Z".
- **Estados de UI (hueco tapado):**
  - **Loading:** skeleton de filas o spinner en el bloque de la tabla.
  - **Empty:** cuando `data.length === 0` y no loading, mensaje "No hay usuarios que coincidan con los filtros" y opción de limpiar filtros.
  - **Error:** mensaje de error + botón "Reintentar" que llame a `refetch`.
- Las métricas (Total, Activos, Nuevos, Retención) siguen viniendo de `useAnalisisUsuarios` (solo la parte `metricas`) para no duplicar lógica; la tabla usa exclusivamente el nuevo endpoint.

---

## Fase 2: Gestión de usuarios (CRUD / edición y creación)

### 2.1 Edición y activar/desactivar

- **Backend:** Usar **PATCH** `/api/crud/user/[id]` para actualizar `name`, `fullName`, `email`, `phone`, `role`, `isActive`. **Validación (hueco tapado):** si `session.user.id === id`, rechazar cualquier PATCH que ponga `role` distinto de ADMIN/SUPER_ADMIN o `isActive === false` (no auto-quitarse rol ni desactivarse). Implementar esta validación en el handler del CRUD para el modelo `user` (o en un wrapper/middleware específico para user).
- **Frontend:** Por fila: acciones "Editar", "Activar/Desactivar". Editar abre modal o sheet con formulario (nombre, email, teléfono, rol con Select USER/ADMIN solo si el actual es ADMIN; no mostrar opción de cambiar rol si el usuario editado es el mismo que el logueado). Activar/Desactivar: `AlertDialog` de confirmación → PATCH → refetch lista.

### 2.2 Crear / Invitar usuario (hueco tapado)

- El doc pide "CRUD o al menos edición"; para CRUD completo hace falta **crear** usuario.
- **Backend:** Usar **POST** `/api/crud/user` con body `{ tenantId, name, fullName, email, phone?, role: USER }`. El CRUD ya soporta creación; validar que `email` sea único por tenant (el modelo ya tiene `@@unique([email, tenantId])`). Si no se desea exponer creación genérica por CRUD, crear **POST** `app/api/usuarios/invitar/route.ts` que reciba `email`, `name`, `phone?` y cree usuario en el tenant del admin (sin contraseña: "invitado" que luego hace reset o primer login).
- **Frontend:** Botón en header "Invitar usuario" o "Nuevo usuario" que abra modal con email (obligatorio), nombre, teléfono opcional; al enviar, POST y refetch lista (y análisis si se desea).

---

## Fase 3: Detalle de usuario (punto 4)

- Acción "Ver detalle" por fila (o click en nombre) abre **modal o sheet** con pestañas (patrón Torneos):
  - **Info:** datos de contacto (nombre, email, teléfono, rol, activo, categoría calculada, descuento). Si en Fase 4 existe edición de descuento, incluirla aquí.
  - **Reservas:** historial de reservas. **Reutilizar (hueco tapado):** no crear nuevo endpoint; usar **GET** `/api/bookings?userId=<id>` con sesión de admin. [app/api/bookings/route.ts](app/api/bookings/route.ts) ya acepta `userId` y valida que el usuario pertenezca al tenant. Mostrar tabla o lista paginada de reservas.
  - **Pagos / Deuda:** resumen (totales pagados, pendientes) a partir de los bookings del usuario (paymentStatus, totalPrice); si existe modelo Payment separado, incluirlo. Se puede calcular en front con los mismos datos de bookings o añadir un **GET** `app/api/usuarios/[id]/resumen/route.ts` que devuelva `{ user, totalPagado, totalPendiente, ultimasReservas }` para no hacer varias llamadas.
- Datos del usuario: **GET** `/api/crud/user/[id]` (ya existe).

---

## Fase 4: Descuentos y configuración de categorías (puntos 5 y 6)

### 4.1 Descuento manual por usuario (hueco tapado: nullable)

- **Modelo:** En [prisma/schema.prisma](prisma/schema.prisma) añadir a User: `discountPercent Int?`. Semántica: `null`/`undefined` = usar descuento calculado por categoría; `0` = 0% descuento; cualquier número = override. Migración necesaria.
- **API:** PATCH CRUD ya podrá aceptar `discountPercent` tras la migración.
- **UI:** En modal de edición y en detalle: campo opcional "Descuento %". En la tabla mostrar el descuento efectivo (override si existe, si no el calculado).

### 4.2 Configuración de categorías (umbrales)

- **Almacenamiento:** Usar [SystemSetting](prisma/schema.prisma): claves por tenant, ej. `usuario.categoria.vip.minReservas` (valor `"20"`), `usuario.categoria.premium.minReservas` (valor `"10"`). Valores por defecto si no existen: 20 y 10.
- **Lectura:** [app/api/system-settings/by-key/route.ts](app/api/system-settings/by-key/route.ts) devuelve un solo key. Opciones: (a) llamar dos veces por key en análisis y listado; (b) crear **GET** `app/api/admin/config/categorias-usuario/route.ts` que devuelva `{ minReservasVip: number, minReservasPremium: number }` leyendo ambas claves (solo ADMIN). Se recomienda (b) para un solo round-trip.
- **Escritura:** **PATCH** el mismo endpoint o **POST** [app/api/system-settings/upsert/route.ts](app/api/system-settings/upsert/route.ts) con `key` + `value` para cada umbral. Si se crea `categorias-usuario`, añadir PATCH que reciba `{ minReservasVip, minReservasPremium }` y haga upsert de las dos claves.
- **Uso:** En [app/api/usuarios/analisis/route.ts](app/api/usuarios/analisis/route.ts) y en GET `app/api/usuarios/route.ts`, en lugar de constantes 20/10, leer umbrales (o usar defaults si no existen) y calcular categoría.
- **UI:** En la pestaña Usuarios (o sección Configuración), bloque "Categorías de usuarios" con inputs "Mín. reservas VIP" y "Mín. reservas Premium", botón Guardar.

---

## Huecos tapados (resumen)

| Hueco | Decisión |
|-------|----------|
| CREATE usuario | Incluir flujo "Invitar usuario" con POST CRUD o POST /api/usuarios/invitar; botón en header en Fase 2. |
| Ordenación por reservas/ultimaReserva | v1: sort en servidor solo por nombre/email/createdAt; si sortBy=reservas|ultimaReserva, fetch acotado + sort en memoria + paginar. |
| Historial de reservas | No nuevo endpoint; usar GET /api/bookings?userId= con sesión admin. |
| Validación Zod en nuevo endpoint | GET /api/usuarios validar query con paginationSchema + schema con q, categoria, actividad. |
| Estados tabla | Loading skeleton, empty state con mensaje y limpiar filtros, error con Reintentar. |
| discountPercent | Campo Int? en User; null = calculado, 0 = 0%, otro = override. |
| Config categorías | SystemSetting por key; GET (y PATCH) /api/admin/config/categorias-usuario para leer/escribir ambos umbrales. |
| Super Admin tenant | Aceptar header x-tenant-id en GET /api/usuarios; en UI, selector de tenant en página (como Torneos) cuando isSuperAdmin. |
| Hook lista | useUsuariosList(page, limit, sortBy, sortOrder, q, categoria, actividad) → { data, meta, loading, error, refetch }. |
| No auto-editarse | En PATCH user del CRUD, si session.user.id === id y (role se baja a USER o isActive=false), devolver 403. |
| Accesibilidad | Tabla: aria-label en botones de acción, teclado para abrir menú de acciones. |
| Tests | Opcional: test manual/e2e lista + edición + detalle; tests unitarios del GET /api/usuarios. |

---

## Orden sugerido de implementación

1. **Fase 1:** UI (space-y-8, Cards) → GET /api/usuarios (Zod, paginación, filtros, ordenación v1) → useUsuariosList → tabla con búsqueda, filtros, paginación, estados loading/empty/error.
2. **Fase 2:** Validación no auto-editarse en CRUD PATCH user → UI Editar y Activar/Desactivar → flujo Invitar usuario (POST) y botón en header.
3. **Fase 3:** Detalle (modal/sheet, pestañas Info / Reservas vía GET bookings?userId= / Pagos o resumen).
4. **Fase 4:** Campo discountPercent en User (migración + PATCH) → GET/PATCH config categorias-usuario → leer umbrales en análisis y en GET usuarios → UI configuración umbrales y edición descuento.

---

## Archivos principales

| Acción | Archivo |
|--------|---------|
| Ajustar | [app/admin-panel/admin/usuarios/page.tsx](app/admin-panel/admin/usuarios/page.tsx) |
| Crear | `app/api/usuarios/route.ts` (GET listado paginado) |
| Crear | `hooks/useUsuariosList.ts` |
| Opcional crear | `app/api/usuarios/invitar/route.ts` (si no se usa POST CRUD para crear) |
| Opcional crear | `app/api/usuarios/[id]/resumen/route.ts` (resumen pagos para detalle) |
| Crear | `app/api/admin/config/categorias-usuario/route.ts` (GET/PATCH umbrales) |
| Ajustar | [app/api/usuarios/analisis/route.ts](app/api/usuarios/analisis/route.ts) (leer umbrales en Fase 4) |
| Ajustar | [prisma/schema.prisma](prisma/schema.prisma) (discountPercent en User) |
| Ajustar | [app/api/crud/[...params]/route.ts](app/api/crud/[...params]/route.ts) (validación no auto-editarse en PATCH user) |
| Reutilizar | GET [app/api/bookings/route.ts](app/api/bookings/route.ts) (userId) para historial |
| Reutilizar | GET/PATCH [app/api/crud/[...params]/route.ts](app/api/crud/[...params]/route.ts) para user |

---

## Consideraciones

- **Multitenant:** Todo filtrado por `tenantId`; Super Admin con `x-tenant-id` o selector en UI.
- **Permisos:** Solo ADMIN y SUPER_ADMIN; no auto-editarse para quitar rol o desactivar.
- **UI:** Componentes de [components/ui](components/ui) (Dialog, Sheet, Select, Input, AlertDialog, Tabs); estilos alineados con Turnos/Torneos.
