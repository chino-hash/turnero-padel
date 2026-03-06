# Pendientes - Pestaña Turnos

**Ruta:** `/admin-panel/admin/turnos`  
**Archivos principales:**
- `app/admin-panel/admin/turnos/page.tsx`
- `components/AdminTurnos.tsx`
- `components/admin/AdminAvailabilityGrid.tsx`

---

## Estado actual

La pestaña Turnos permite ver reservas, crear nuevas (puntuales y recurrentes), gestionar turnos fijos, ver disponibilidad semanal y administrar extras y pagos por turno. **El plan de pendientes está completado** (marzo 2026).

**Documentación de lo implementado:** [admin-turnos-pendientes-completado-2026-03.md](../actualizaciones/admin-turnos-pendientes-completado-2026-03.md)

---

## Implementado

- [x] Métricas rápidas (Turnos Hoy, Próximos, Ocupación)
- [x] Grid de disponibilidad semanal por cancha
- [x] Lista de reservas con filtros (búsqueda, estado, fecha)
- [x] Modal de nueva reserva (puntual y recurrente)
- [x] Turnos fijos y "dar de baja esta semana"
- [x] Integración con AdminTurnos (extras, pagos individuales, cancelar, completar)
- [x] Vista calendario y vista lista
- [x] Horarios disponibles según disponibilidad real
- [x] Comprobación de disponibilidad antes de crear
- [x] **Métricas con datos reales:** Turnos Hoy desde `byDay`, variación vs ayer, Usuarios Activos desde API
- [x] **Vinculación usuario:** modal con nombre + email, typeahead (GET /api/users/search), get-or-create en POST bookings y recurring-bookings
- [x] **Paginación:** lista con page/limit, filtros al API, controles Anterior/Siguiente
- [x] **Exportación:** botón Exportar, CSV con filtros activos (UTF-8 BOM)
- [x] **Tiempo real:** polling cada 45 s con Page Visibility y limpieza al desmontar
- [x] **Toasts:** sonner en página turnos y AdminTurnos (sustitución de alert())
- [x] **Terminar turno / Cerrar turno:** dos botones por categoría y saldo; PUT acepta COMPLETED sin pago completo
- [x] **Confirmación al pagar depósito:** SystemSetting `depositConfirmPercent` por tenant; auto CONFIRMED al alcanzar el % en PATCH pago jugador
- [x] **Una sola página sin paginación global:** lista con hasta 500 turnos, cuatro secciones visibles (Pendientes, Confirmados, En curso, Cerrados), sin "Página X de Y" ni Anterior/Siguiente. Ver [admin-turnos-una-pagina-sin-paginacion-2026-03.md](../actualizaciones/admin-turnos-una-pagina-sin-paginacion-2026-03.md).
- [x] **Sección TURNOS CERRADOS:** colapsable por defecto; limpieza a las 06:00 del día siguiente. Ver [admin-turnos-cerrados-colapsable-limpieza-2026-03.md](../actualizaciones/admin-turnos-cerrados-colapsable-limpieza-2026-03.md).
- [x] **Tarjetas de turnos:** diseño compacto y texto legible. Ver [admin-turnos-tarjetas-compactas-texto-legible-2026-03.md](../actualizaciones/admin-turnos-tarjetas-compactas-texto-legible-2026-03.md).

---

## Referencias

- Documentación detallada: [admin-turnos-pendientes-completado-2026-03.md](../actualizaciones/admin-turnos-pendientes-completado-2026-03.md)
- Una página sin paginación: [admin-turnos-una-pagina-sin-paginacion-2026-03.md](../actualizaciones/admin-turnos-una-pagina-sin-paginacion-2026-03.md)
- Turnos cerrados colapsable y limpieza: [admin-turnos-cerrados-colapsable-limpieza-2026-03.md](../actualizaciones/admin-turnos-cerrados-colapsable-limpieza-2026-03.md)
- Tarjetas compactas: [admin-turnos-tarjetas-compactas-texto-legible-2026-03.md](../actualizaciones/admin-turnos-tarjetas-compactas-texto-legible-2026-03.md)
- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Estados de reserva: `lib/booking-status-map.ts`, `types/booking.ts`
- APIs: `/api/bookings`, `/api/bookings/stats`, `/api/users/search`, `/api/recurring-bookings`, `/api/recurring-exceptions`
