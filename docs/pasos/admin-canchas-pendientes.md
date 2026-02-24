# Pendientes - Pestaña Canchas

**Ruta:** `/admin-panel/admin/canchas`  
**Archivo principal:** `app/admin-panel/admin/canchas/page.tsx`  
**Estado:** COMPLETADA (Feb 2026)

---

## Estado actual

La pestaña Canchas permite gestionar canchas del club: crear, editar, eliminar, activar/desactivar, ver precios base y por persona. Incluye soporte multitenant completo, selector de tenant para Super Admin, horarios operativos y validación Zod.

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
- [x] **Multitenant**: API filtra por `tenantId`; Admin solo ve sus canchas; Super Admin ve todas con badge de tenant
- [x] **Selector de tenant** para Super Admin al crear canchas
- [x] **Validación Zod** en POST y PUT (`lib/validations/court.ts`)
- [x] **Confirmación de eliminación** con AlertDialog (sin `confirm()` nativo)
- [x] **Horarios operativos** (operatingHours): UI para apertura, cierre y duración de slot (default 90 min)
- [x] **Consistencia de feedback**: toasts, loading durante peticiones, sin `console.log` de producción

---

## Pendiente (opcional / fase 2)

### Imagen/foto de cancha

- Campo opcional para imagen representativa.
- Requiere: migración Prisma (`imageUrl String?`), storage (Vercel Blob/S3), UI de subida, preview en card.

---

## Changelog – Completado Feb 2026

### Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `lib/validations/court.ts` | Nuevo: schemas `courtCreateSchema`, `courtUpdateSchema` con validación de operatingHours |
| `app/api/courts/route.ts` | Validación Zod POST/PUT; 500 en error GET; tenant info para Super Admin; validación tenantId |
| `lib/services/courts.ts` | `getAllCourts(tenantId?, { includeTenant })`; `updateCourt` acepta operatingHours como objeto |
| `app/admin-panel/admin/canchas/page.tsx` | Selector tenant, AlertDialog eliminación, horarios operativos, badge tenant, loading |
| `hooks/useCourtPrices.ts` | Uso de `basePrice ?? base_price` para compatibilidad |
| `components/TurneroApp.tsx` | Precio por persona = `basePrice / 4` (basePrice en pesos) |

### Funcionalidades añadidas

1. **Super Admin** puede crear canchas seleccionando el tenant desde el modal.
2. **Badge de tenant** en cada card cuando el usuario es Super Admin.
3. **Horarios operativos**: campos apertura (start), cierre (end), slot_duration (30–180 min).
4. **Modal de confirmación** para eliminar en lugar de `confirm()` nativo.
5. **Errores GET** devuelven 500 con mensaje; el cliente muestra toast.
6. **Corrección basePrice**: consumidores usan `basePrice` (pesos) correctamente.

---

## Referencias

- Skill multitenant: `.cursor/skills/turnero-padel-multitenant/SKILL.md`
- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Schema Court: `prisma/schema.prisma`
- Plan de implementación: `docs/plans/admin-canchas-completado-2026-02.md`
