# Pendientes - Pestaña Usuarios

**Ruta:** `/admin-panel/admin/usuarios`  
**Archivo principal:** `app/admin-panel/admin/usuarios/page.tsx`  
**API:** `app/api/usuarios/analisis/route.ts`

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

La pestaña Usuarios muestra un análisis de clientes: métricas, categorías VIP/Premium/Regular, tabla de usuarios frecuentes y programa de descuentos. Es mayormente de solo lectura. La estructura de header aún no sigue el patrón unificado de Turnos/Torneos (título + barra naranja + descripción + acciones en la misma línea).

---

## Implementado

- [x] Métricas (Total, Activos, Nuevos, Retención)
- [x] Clientes nuevos vs recurrentes
- [x] Valor promedio por cliente
- [x] Programa de descuentos (VIP, Premium, Regular)
- [x] Tabla de usuarios frecuentes (nombre, email, reservas, frecuencia, cancha preferida, categoría, descuento)
- [x] Botón actualizar datos

---

## Pendiente para dar por terminada

### 0. Alineación UI con Torneos y Turnos

- Header unificado: mismo layout que Turnos/Torneos (título, barra naranja `bg-orange-500`, descripción, botones a la derecha con `min-h-[44px] sm:min-h-0`).
- Métricas en grid de Cards (4 columnas en desktop) con el mismo estilo que la sección Turnos.
- Espaciado general `space-y-8` y estructura de página consistente con el resto del admin.

### 1. Gestión de usuarios

- CRUD o al menos edición de usuarios.
- Activar/desactivar usuarios.
- Cambiar rol (USER, ADMIN) si el admin tiene permisos.
- Ver y editar datos de contacto (teléfono, email).

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
- API análisis: `/api/usuarios/analisis`
- Patrones de UI: `app/admin-panel/admin/torneos/page.tsx`, `app/admin-panel/admin/turnos/page.tsx`
- Navegación admin: `app/admin-panel/components/AdminLayoutContent.tsx` (links Canchas, Turnos, Usuarios, Estadísticas, Productos, Torneo)
