# Plan de mejoras Admin/Turnos (Backup)

## Objetivo
Implementar transición automática de estado de turnos basada en tiempo y limitar la intervención del administrador únicamente a: agregar extras, registrar pagos y cerrar el turno cuando el saldo quede en cero. Centralizar la categorización y cálculos en una única fuente de verdad (servidor) para garantizar consistencia y seguridad.

## Alcance
- Secciones en Admin/Turnos: `Confirmadas`, `En curso`, `Finalizadas pendientes`, `Completadas`.
- Categorización por tiempo basada en `startDateTime` y `endDateTime` en UTC.
- Cálculos financieros (totales, pagos, saldo pendiente) desde el backend.
- UI consistente: chips, botones y permisos alineados con el estado temporal y el saldo.
- Polling de datos de 30–60s y recategorización visual cada segundo.

## Estados y transiciones
- Confirmada: ahora < `startDateTime`.
- En curso: `startDateTime` ≤ ahora ≤ `endDateTime`.
- Finalizada pendiente: ahora > `endDateTime` y `pendingBalance` > 0.
- Completada: ahora > `endDateTime` y `pendingBalance` = 0 (y marcada como cerrada).

Transiciones automáticas (sin intervención admin):
- Confirmada → En curso al llegar `startDateTime`.
- En curso → Finalizada pendiente al superar `endDateTime` si hay saldo pendiente.
- En curso → Completada al superar `endDateTime` si el saldo ya es 0 (opcionalmente exigir cierre para registrar auditoría).

Cierre administrativo:
- Acción explícita “Cerrar turno” disponible únicamente cuando `pendingBalance` = 0. Registra auditoría y fija estado `closed = true`.

## Intervención del administrador
- Agregar/editar extras durante `Confirmada`, `En curso` y `Finalizada pendiente`.
- Registrar pagos durante `Confirmada`, `En curso` y `Finalizada pendiente`.
- Cerrar turno en `Finalizada pendiente` (visible) y habilitado solamente si `pendingBalance` = 0.
- `Completada`: sólo lectura.

## Frontend (UX y lógica)
- Unificar categorización temporal en una función única: `categorizeByTime(now, startDateTime, endDateTime, pendingBalance, closed)`.
- Chips por estado:
  - Confirmada: “Confirmada”.
  - En curso: “EN CURSO”.
  - Finalizada pendiente: “Finalizada (pendiente)”.
  - Completada: “Completada”.
- Botones/permisos:
  - Extras y pagos: habilitados en `Confirmada`, `En curso`, `Finalizada pendiente`.
  - Cerrar turno: visible en `Finalizada pendiente`; habilitado si `pendingBalance` = 0; confirmar doble paso.
  - `Completada`: vista read-only, sin acciones.
- Sincronización de datos:
  - Polling (SWR/React Query) con `refetchInterval` 30–60s, `revalidateOnFocus` y `revalidateOnReconnect` habilitados.
  - Revalidación manual (mutate/refetch) tras cambios de extras/pagos/cierre.
  - Visual: `setInterval(1000)` para el timer y recategorización precisa durante render.
- SSR/hidratación:
  - Inicializar `now` en client-side para evitar discrepancias de tiempo en SSR.

## Backend (cálculos y API)
- Fuente de tiempo: almacenar `startDateTime` y `endDateTime` en formato ISO (UTC) en la base de datos.
- No persistir totales finales en `schema.prisma`; calcularlos en el servidor.
- Servicio de precios (por ejemplo `lib/services/bookings/pricing.ts`):
  - `extrasTotal`: suma de costos de extras.
  - `basePrice`: precio base del turno (según cancha/horario).
  - `amountPaid`: suma de pagos registrados (incluye pagos individuales).
  - `totalCalculated`: `basePrice + extrasTotal` (aplicar reglas de promoción/bonos si existen).
  - `pendingBalance`: `totalCalculated - amountPaid` (clamp ≥ 0).
- Integración API (por ejemplo `app/api/bookings`):
  - GET /bookings: devolver cada booking con `pricing` derivado: `{ basePrice, extrasTotal, amountPaid, totalCalculated, pendingBalance }`.
  - PATCH /bookings/:id/extras: actualizar extras; responder booking con `pricing` recalculado.
  - PATCH /bookings/:id/payments: registrar pagos; responder booking con `pricing` recalculado.
  - POST /bookings/:id/close: cerrar turno si `pendingBalance` = 0; marcar `closed = true` y responder booking actualizado.
- Auditoría mínima: registrar `closedBy`, `closedAt` y dif de saldo al cierre (debe ser 0).

## Contratos de API
Booking (respuesta simplificada):
```json
{
  "id": "...",
  "courtId": "...",
  "startDateTime": "2025-01-01T14:00:00Z",
  "endDateTime": "2025-01-01T15:00:00Z",
  "extras": [{ "id": "...", "label": "...", "cost": 1000 }],
  "payments": [{ "id": "...", "payer": "...", "amount": 1000 }],
  "closed": false,
  "pricing": {
    "basePrice": 5000,
    "extrasTotal": 1000,
    "amountPaid": 3000,
    "totalCalculated": 6000,
    "pendingBalance": 3000
  }
}
```

## Manejo de tiempo y zonas horarias
- Todo en UTC (ISO) en el backend; el frontend transforma a local sólo para mostrar.
- La categorización usa `nowUTC` vs `startDateTime`/`endDateTime`.
- Pruebas de borde: transiciones exactas en segundos/minutos, y cambios de huso horario.

## Criterios de aceptación
- Un turno pasa de `Confirmada` a `En curso` exactamente al iniciar.
- Un turno pasa a `Finalizada pendiente` al terminar si hay saldo > 0.
- El botón “Cerrar turno” aparece en `Finalizada pendiente`, y sólo se habilita si `pendingBalance` = 0.
- Tras cerrar, el turno aparece en `Completadas` y queda read-only.
- Los totales y saldos en frontend coinciden 100% con los devueltos por el backend.

## Pruebas
- Unitarias (frontend):
  - `categorizeByTime` con múltiples casos (antes, durante, después; límites exactos; saldo y cerrado).
- Unitarias (backend):
  - `pricing` con distintos extras/pagos/promociones.
- UI tests:
  - Renderizado de secciones y chips correcta según tiempo actual.
  - Habilitación de acciones y “Cerrar turno” según saldo.
- E2E:
  - Agregar extra → recalcula y revalida.
  - Registrar pago → recalcula y revalida.
  - Cerrar turno con saldo 0 → auditoría y estado `Completada`.
- Zona horaria:
  - Consistencia al cruzar límites de hora local/UTC.

## Fases de implementación
1) Categorización unificada en frontend y uso consistente en secciones y chips.
2) Servicio de precios en backend y respuesta de `pricing` en API.
3) Ajuste de UI: permisos de extras/pagos y lógica de cierre.
4) Integración de polling 30–60s y `setInterval(1000)` para visual/timer.
5) Pruebas unitarias, UI y E2E; validación de bordes de tiempo y TZ.
6) Documentación y despliegue gradual.

## Riesgos y mitigaciones
- Desincronización visual vs datos:
  - Mitigar con recategorización cada 1s y polling 30–60s.
- Inconsistencias de huso horario:
  - Mitigar almacenando UTC y probando bordes.
- Cambios en contratos de API:
  - Versionar o mantener compatibilidad temporal; actualizar frontend en conjunto.
- Errores al cerrar con saldo ≠ 0:
  - Validar en backend y bloquear la acción.

## Métricas de éxito
- 0 incidencias de estado incorrecto por tiempo.
- Reducción del tiempo de gestión del admin por cierre.
- Disminución de inconsistencias entre frontend y backend en totales.
- Transiciones de estado observadas exactamente en `startDateTime`/`endDateTime`.

## Checklist de entrega
- [ ] Función `categorizeByTime` aplicada en todas las vistas/chips/secciones.
- [ ] API devuelve `pricing` consistente en todas las rutas relevantes.
- [ ] Botones de extras/pagos habilitados según estado; cierre condicionado por saldo.
- [ ] Polling y revalidación integrados; timer visual activo.
- [ ] Pruebas pasando y documentación actualizada.

---

### Notas de implementación (referencias de código)
- Frontend:
  - `turnero-padel/components/admin` (AdminTurnos.tsx o equivalente) para secciones/chips/botones.
  - `turnero-padel/hooks/useBookings.ts` para polling y recategorización.
- Backend:
  - `turnero-padel/lib/services/bookings/pricing.ts` (nuevo) para cálculos.
  - `turnero-padel/app/api/bookings` para contratos y rutas.