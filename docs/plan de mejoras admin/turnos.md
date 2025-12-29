<!-- Doc-Version: v1.2.0 | Fecha: 2025-11-06 -->

# Turnos (Administración) – Plan y Contratos de API

Este documento consolida el plan de mejoras y los contratos de API que utiliza el panel de administración para la gestión de turnos (reservas). aquí se alinea la sección de API con los endpoints reales del backend.

## Índice
- Objetivos y alcance
- Estados y transiciones (resumen)
- Contratos de API (alineados)
- Criterios de aceptación (resumen)
- Verificación de integridad

## Objetivos y alcance
- Estandarizar documentación, términos y chips de estado en el panel admin.
- Alinear los contratos de API documentados con las rutas reales del backend.
- Mantener cambios atómicos y reversibles con versionado y changelog.

## Estados y transiciones (resumen)
- Estados de turno: `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `CANCELLED`, `CLOSED`.
- Estados de pago: `PENDING`, `DEPOSIT_PAID`, `FULLY_PAID`.
- Transiciones válidas: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `CLOSED`; en cualquier punto: → `CANCELLED`.

## Contratos de API (alineados con backend)

Base: `GET /api/bookings` y rutas relacionadas.

- Listado de turnos
  - `GET /api/bookings`
    - Filtros soportados: `page`, `limit`, `courtId`, `userId`, `status`, `paymentStatus`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`.
    - Autenticación: requerida. Si no es `ADMIN`, se limita a sus propias reservas.

- Operaciones sobre turno específico
  - `GET /api/bookings/[id]`
  - `PUT /api/bookings/[id]`
  - `DELETE /api/bookings/[id]` (soft delete / cancelación)

- Operaciones masivas
  - `PATCH /api/bookings/bulk`
  - `DELETE /api/bookings/bulk`

- Gestión de pagos individuales
  - `PATCH /api/bookings/[id]/players/[playerId]/payment`
  - `PATCH /api/bookings/[id]/players/position/[position]/payment`
    - Fallback por posición cuando no se resolvió `playerId`.

- Gestión de extras del turno
  - `GET /api/bookings/[id]/extras`
  - `POST /api/bookings/[id]/extras`
  - `DELETE /api/bookings/[id]/extras/[extraId]`

- Pendiente (no implementado aún, propuesto en el plan)
  - `POST /api/bookings/[id]/close`
    - Cerrar turno cuando `pendingBalance = 0` y registrar auditoría (`closedBy`, `closedAt`).

## Criterios de aceptación (resumen)
- El panel admin utiliza exclusivamente los endpoints anteriores para listar, actualizar estado, cancelar, gestionar pagos y extras.
- Chips de estado en UI coherentes con `status` y `paymentStatus` del backend.
- SSE emite actualizaciones al crear, actualizar, cancelar y operaciones bulk.

## Verificación de integridad
- Versionado en cabecera del documento (`Doc-Version`).
- Cambios reflejados en `turnos-CHANGELOG.md` (v1.2.0).
- Comprobación cruzada con archivos de rutas en `app/api/bookings/**` y guías de `docs/apis/*`.