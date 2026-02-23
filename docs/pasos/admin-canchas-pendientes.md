# Pendientes - Pestaña Canchas

**Ruta:** `/admin-panel/admin/canchas`  
**Archivo principal:** `app/admin-panel/admin/canchas/page.tsx`

---

## Estado actual

La pestaña Canchas permite gestionar canchas del club: crear, editar, eliminar, activar/desactivar, ver precios base y por persona.

---

## Implementado

- [x] CRUD básico (crear, editar, eliminar canchas)
- [x] Activar/desactivar canchas
- [x] Precio base y cálculo de precio por persona (4 jugadores)
- [x] Descripción opcional
- [x] Permisos diferenciados (Super Admin vs Admin)
- [x] Grid de cards para canchas activas
- [x] Sección compacta para canchas inactivas
- [x] Modal para agregar/editar

---

## Pendiente para dar por terminada

### 1. Multitenant

- **Verificar** que la API `/api/courts` filtre correctamente por `tenantId`.
- Garantizar que un admin solo vea y gestione canchas de su tenant.

### 2. Validación en API

- Añadir validación con Zod en POST y PUT de `/api/courts`.
- Validar: `name`, `basePrice` (número > 0), `isActive`, `description` (opcional).

### 3. Confirmación de eliminación

- Sustituir `confirm()` nativo por un modal/dialog propio.
- Mostrar mensaje claro y botones "Cancelar" y "Eliminar".

### 4. Imagen/foto de cancha

- Campo opcional para imagen representativa.
- Si aplica: subida de archivo, validación de tipo/tamaño y preview en la card.

### 5. Horarios operativos (operatingHours)

- Campo `operatingHours` en Court según el dominio: `{ start, end, slot_duration }`.
- UI para configurar horario de apertura, cierre y duración de slot.
- Default `slot_duration: 90` minutos.

### 6. Consistencia de feedback

- Eliminar `console.log` de producción.
- Usar toasts (ej. sonner) de forma consistente para éxito/error.
- Mostrar loading durante peticiones.

---

## Referencias

- Skill multitenant: `.cursor/skills/turnero-padel-multitenant/SKILL.md`
- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Schema Court: `prisma/schema.prisma`
