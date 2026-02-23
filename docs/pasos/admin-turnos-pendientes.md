# Pendientes - Pestaña Turnos

**Ruta:** `/admin-panel/admin/turnos`  
**Archivos principales:**
- `app/admin-panel/admin/turnos/page.tsx`
- `components/AdminTurnos.tsx`
- `components/admin/AdminAvailabilityGrid.tsx`

---

## Estado actual

La pestaña Turnos permite ver reservas, crear nuevas (puntuales y recurrentes), gestionar turnos fijos, ver disponibilidad semanal y administrar extras y pagos por turno.

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

---

## Pendiente para dar por terminada

### 1. Métricas con datos reales

- **"Usuarios Activos"** está hardcodeado en 24. Sustituir por cálculo real (usuarios con reservas en período reciente).
- **"Turnos Hoy"** tiene texto fijo "+2 desde ayer". Calcular variación real respecto al día anterior.

### 2. Vinculación usuario en nueva reserva

- El modal pide "Nombre Completo" pero no vincula con usuario registrado.
- Añadir selector/búsqueda de usuario existente para vincular la reserva.
- Mantener opción de crear para invitado (nombre libre) si aplica.

### 3. Paginación

- Añadir paginación a la lista de turnos cuando el volumen sea grande.
- Definir tamaño de página (ej. 10, 20, 50) y controles de navegación.

### 4. Exportación

- Opción de exportar lista de turnos a CSV o Excel.
- Incluir filtros activos en la exportación.

### 5. Actualización en tiempo real

- Comprobar si hay polling o SSE para actualizar turnos sin recargar.
- Si no existe, evaluar implementación (ej. polling cada X segundos o WebSocket/SSE).

### 6. Consistencia de alerts

- Sustituir `alert()` por toasts o modales propios.
- Usar el mismo sistema de feedback en todo el flujo (crear, dar de baja, etc.).

---

## Referencias

- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Estados de reserva: `lib/booking-status-map.ts`, `types/booking.ts`
- APIs: `/api/bookings`, `/api/recurring-bookings`, `/api/recurring-exceptions`
