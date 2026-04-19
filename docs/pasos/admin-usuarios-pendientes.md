# Pendientes - Pestaña Usuarios

> **Nota (abril 2026):** esta pestaña se define como módulo de analítica de clientes.  
> No incluye gestión de cuentas ni configuración de descuentos en esta etapa.

**Ruta:** `/admin-panel/admin/usuarios`  
**Archivo principal:** `app/admin-panel/admin/usuarios/page.tsx`  
**APIs activas:** `/api/usuarios/analisis`, `/api/usuarios`

---

## Alcance oficial vigente

La pestaña Usuarios está orientada a seguimiento comercial y comportamiento de clientes:

- Registro de clientes que reservan
- Ranking de clientes frecuentes
- KPIs de actividad y retención
- Nuevos vs recurrentes
- Valor promedio por cliente
- Listado paginado con búsqueda/filtros

---

## Implementado

- [x] Header unificado del panel admin (título, barra naranja, acción Actualizar)
- [x] KPIs: Total Clientes, Clientes Activos, Nuevos Este Mes, Retención
- [x] Bloque de Nuevos vs Recurrentes
- [x] Bloque de Valor Promedio por Cliente
- [x] Listado de clientes con búsqueda, filtro por actividad y paginación
- [x] Ranking de Clientes Frecuentes (mobile cards + tabla desktop)
- [x] Soporte de contexto tenant para super admin (`tenantId` / `tenantSlug`)

---

## Fuera de alcance (fase posterior)

- Programa de descuentos en la pantalla de Usuarios
- Gestión de consumibles desde esta pestaña
- Configuración de umbrales/descuentos por categoría en esta pantalla
- ABM operativo de usuarios (editar/activar/desactivar/cambiar rol) desde Usuarios

Estos puntos se tratarán en una fase específica de descuentos y/o administración de cuentas.

---

## Pendiente para dar por terminada

- [ ] Ejecutar y dejar estables los tests agregados para APIs y UI de Usuarios
- [ ] Validar en QA manual el flujo completo en tenant admin y super admin
- [ ] Mantener este documento sincronizado con cambios de alcance futuros

---

## Referencias

- Actualización de alcance: `docs/actualizaciones/usuarios-sin-descuentos-2026-04.md`
- APIs: `app/api/usuarios/analisis/route.ts`, `app/api/usuarios/route.ts`
- Hooks: `hooks/useAnalisisUsuarios.ts`, `hooks/useUsuariosList.ts`
# Pendientes - Pestaña Usuarios

> **Nota (abril 2026):** checklist histórico; la fuente de verdad es el código en `app/admin-panel/` y las notas en [`docs/actualizaciones/`](../actualizaciones/).

**Ruta:** `/admin-panel/admin/usuarios`  
**Archivo principal:** `app/admin-panel/admin/usuarios/page.tsx`  
**APIs:** `/api/usuarios/analisis`, `/api/usuarios`, `/api/consumibles`, `/api/crud/user/*`, `/api/admin/config/categorias-usuario`, `/api/productos`

---

## Cambios realizados (alineados con el proyecto)

- **Layout unificado:** Header con título, barra naranja, descripción y botones siguiendo el mismo patrón que Turnos y Torneos (ver `docs/actualizaciones/admin-panel-sheet-layout-2026-03.md`, `unificacion-titulos-admin-2026-02.md`).
- **Programa de descuentos (consumibles):** Tarjetas VIP, Premium y Regular con requisitos, tipo de beneficio (descuento/consumible), producto asociado y toggle Activar/Desactivar; modal para editar categoría y configurar umbrales. Ver `docs/actualizaciones/admin-usuarios-consumibles-modal-2026-03.md`.
- **Análisis y listado:** Fallback de tenant para super-admin en `/api/usuarios/analisis`; listado paginado con búsqueda, filtros por categoría y actividad; en la tabla de usuarios las acciones **Ver detalle**, **Editar** y **Activar/Desactivar** por fila. Ver `docs/actualizaciones/revision-admin-usuarios-y-login-2026-03.md`.

---

## Convenciones de la sección Admin (Torneos y Turnos)

Para mantener coherencia, la pestaña Usuarios debe alinearse con los patrones ya usados en **Torneos** y **Turnos**:

### Estructura de página (Turnos / Torneos)

- **Header fijo:** título `h1` (`text-2xl md:text-3xl font-light`), barra decorativa naranja (`w-16 h-0.5 bg-orange-500`), descripción en `text-muted-foreground text-xs`, y botones de acción a la derecha (`flex flex-wrap items-center gap-2 flex-shrink-0`) con `min-h-[44px] sm:min-h-0` en móvil.
- **Contenido:** `space-y-6` o `space-y-8`; métricas en grid de Cards cuando aplique.
- **Acciones principales:** botón primario tipo "Crear…" o "Nueva…" en el header (como "Crear torneo" en Torneos y "Nueva Reserva" en Turnos).

### Torneos (`app/admin-panel/admin/torneos/page.tsx`)

- Vistas: `historial` | `crear` | `detalle`. Navegación con "Volver" y "Crear torneo".
- Listado en cards (grid), detalle con pestañas (Info, Inscripciones, Fixture/Cuadro).
- Crear/editar: stepper de 3 pasos (Datos → Días y franjas → Vista previa), vista previa lateral en desktop.
- APIs: `GET/POST /api/torneos`, `PATCH/DELETE /api/torneos/[id]`, `GET/POST/DELETE /api/torneos/[id]/inscripciones`, `GET /api/torneos/[id]/partidos`, `POST /api/torneos/[id]/sorteo`.
- Eliminación con `AlertDialog` de confirmación.
- Super Admin: selector de tenant al crear torneo.

### Turnos (`app/admin-panel/admin/turnos/page.tsx`)

- Header con "Gestión de Turnos" y botón "Nueva Reserva".
- Métricas en grid de 4 Cards: Turnos Hoy, Próximos Turnos, Ocupación, Usuarios Activos (datos de `/api/bookings/stats`).
- `AdminAvailabilityGrid` para disponibilidad semanal por cancha.
- Lista de turnos con componente `AdminTurnos`.
- Modal `Dialog` para nueva reserva: datos del cliente (búsqueda por nombre/email con `/api/users/search` o invitado), opción "Turno Fijo" (recurring), cancha/fecha/horario; integración con `useBookings`, `useCourtPrices`, `/api/recurring-bookings`, `/api/recurring-exceptions`.

### Aplicación a Usuarios

- Reutilizar el mismo **bloque de header** (título, barra naranja, descripción, botones).
- Mantener o ampliar las métricas en Cards (Total, Activos, Nuevos, Retención) en un grid similar al de Turnos.
- Si se agrega gestión (CRUD), considerar vistas o modales alineados con el flujo de Torneos (detalle con pestañas) o Turnos (modal de creación/edición).

---

## Estado actual

La pestaña Usuarios muestra análisis de clientes (métricas, clientes nuevos vs recurrentes, valor promedio), programa de descuentos con tarjetas VIP/Premium/Regular editables (consumibles), listado paginado de usuarios con búsqueda y filtros, y en la tabla las acciones Ver detalle, Editar y Activar/Desactivar. El header ya sigue el patrón unificado del panel (título + barra naranja + descripción + botones).

---

## Implementado

- [x] Métricas (Total, Activos, Nuevos, Retención)
- [x] Clientes nuevos vs recurrentes
- [x] Valor promedio por cliente
- [x] Programa de descuentos (VIP, Premium, Regular)
- [x] Tabla de usuarios frecuentes (nombre, email, reservas, frecuencia, cancha preferida, categoría, descuento)
- [x] Acciones en tabla: Ver detalle, Editar, Activar/Desactivar (modales y AlertDialog integrados)
- [x] Programa de consumibles/descuentos (tarjetas VIP/Premium/Regular con modal de edición y toggles)
- [x] Header unificado (título, barra naranja, descripción, botón Actualizar)
- [x] Botón actualizar datos

---

## Pendiente para dar por terminada

### 0. Alineación UI con Torneos y Turnos (parcialmente cubierto)

- ~~Header unificado~~: ya aplicado.
- Métricas en grid de Cards (4 columnas en desktop) con el mismo estilo que la sección Turnos (opcional refinar).
- Espaciado general `space-y-8` y estructura de página consistente con el resto del admin.

### 1. Gestión de usuarios

- Edición de usuarios y activar/desactivar ya disponibles desde la tabla (modales y AlertDialog).
- Pendiente: cambiar rol (USER, ADMIN) si el admin tiene permisos.
- Ver y editar datos de contacto (teléfono, email) según alcance del modal Editar.

### 2. Búsqueda y filtros

- Búsqueda por nombre o email (referencia: Turnos usa `/api/users/search` con `q` para el modal de nueva reserva).
- Filtro por categoría (VIP, Premium, Regular).
- Filtro por actividad (activos, inactivos, nuevos).

### 3. Paginación

- Paginación en la tabla de usuarios frecuentes.
- Ordenación por columnas (reservas, última reserva, etc.).

### 4. Detalle de usuario

- Página o modal de detalle de usuario (similar a detalle de torneo con pestañas si aplica).
- Historial de reservas del usuario.
- Datos completos de contacto.
- Resumen de pagos y deuda.

### 5. Aplicar/ajustar descuentos

- Posibilidad de asignar o modificar descuentos manualmente.
- O que los descuentos vengan de configuración/backend y no estén hardcodeados.

### 6. Configuración de categorías

- Los criterios VIP/Premium/Regular están fijos.
- Considerar configuración de umbrales (ej. reservas para cada categoría) desde el admin o sistema.

---

## Referencias

- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Roles: USER, ADMIN, Super Admin
- APIs: `/api/usuarios/analisis`, `/api/usuarios`, `/api/consumibles`, `/api/crud/user/:id`, `/api/admin/config/categorias-usuario`, `/api/productos`
- Actualizaciones: `docs/actualizaciones/admin-usuarios-consumibles-modal-2026-03.md`, `docs/actualizaciones/revision-admin-usuarios-y-login-2026-03.md`, `admin-panel-sheet-layout-2026-03.md`
- Patrones de UI: `app/admin-panel/admin/torneos/page.tsx`, `app/admin-panel/admin/turnos/page.tsx`
- Navegación admin: `app/admin-panel/components/AdminLayoutContent.tsx` (links Canchas, Turnos, Usuarios, Estadísticas, Productos, Torneo)
