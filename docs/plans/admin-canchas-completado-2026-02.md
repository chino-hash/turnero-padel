# Plan ejecutado: Completar sección Canchas

**Fecha:** Febrero 2026  
**Estado:** Completado  
**Referencia:** [admin-canchas-pendientes.md](../pasos/admin-canchas-pendientes.md)

---

## Alcance

Se considera terminada la pestaña Canchas cuando:

- [x] Super Admin puede crear canchas (con selector de tenant)
- [x] Admin de tenant puede ver, editar y activar/desactivar solo sus canchas
- [x] Super Admin ve todas las canchas con indicación de tenant
- [x] Validación Zod en POST/PUT
- [x] Modal de confirmación para eliminar (no `confirm()` nativo)
- [x] UI para horarios operativos (start, end, slot_duration)
- [x] Feedback consistente (toasts, loading, sin logs de producción)
- [x] Sin huecos de seguridad multitenant

---

## Huecos multitenant resueltos

### GAP 1: Super Admin no puede crear canchas
**Solución:** Selector de tenant en el formulario (solo Super Admin). Carga de tenants desde `GET /api/tenants`.

### GAP 2: Super Admin ve canchas mezcladas sin contexto
**Solución:** `getAllCourts(undefined, { includeTenant: true })` incluye tenantId, tenantName, tenantSlug. Badge en cada card.

### GAP 3: Admin de tenant B
**Solución:** `getAllCourts(userTenantId)` filtra correctamente. Verificado en pruebas manuales.

### GAP B: Errores GET enmascarados
**Solución:** Catch devuelve 500 con mensaje. Cliente muestra toast si `!response.ok`.

### GAP C: operatingHours en PUT
**Solución:** `updateCourt` acepta operatingHours como objeto y hace `JSON.stringify` antes de Prisma.

### GAP A: base_price vs basePrice
**Solución:** useCourtPrices y TurneroApp usan `basePrice ?? base_price`; precios en pesos.

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `lib/validations/court.ts` | Nuevo: schemas Zod |
| `app/api/courts/route.ts` | Zod POST/PUT; 500 en GET error; tenant info Super Admin |
| `lib/services/courts.ts` | getAllCourts con includeTenant; updateCourt stringify operatingHours |
| `app/admin-panel/admin/canchas/page.tsx` | Selector tenant, AlertDialog, operatingHours, badge, feedback |
| `hooks/useCourtPrices.ts` | basePrice ?? base_price |
| `components/TurneroApp.tsx` | basePrice / 4 para precio por persona |

---

## Orden de implementación realizado

1. Selector de tenant para Super Admin
2. Errores GET courts (500)
3. Validación Zod POST/PUT
4. operatingHours en updateCourt
5. Incluir tenant en respuesta + badge
6. Modal AlertDialog para eliminación
7. UI horarios operativos
8. Feedback consistente (logs, loading)
9. basePrice en useCourtPrices y TurneroApp

---

## Referencias

- Refactor auth: [refactor-auth-middleware-reducir-bundle.md](../pasos/refactor-auth-middleware-reducir-bundle.md) (no afecta canchas)
- Skill API: `.cursor/skills/turnero-padel-api/SKILL.md`
- Skill multitenant: `.cursor/skills/turnero-padel-multitenant/SKILL.md`
