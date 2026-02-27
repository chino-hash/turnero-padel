---
name: Completar sección Canchas
overview: Plan para finalizar la pestaña Canchas del admin panel según la documentación pendiente, incorporando validación Zod, modal de confirmación, horarios operativos, feedback consistente y verificación multitenant. La refactorización auth-middleware no afecta la sección de canchas.
todos: []
isProject: false
---

# Plan: Completar sección Canchas

## Alcance y definición de "terminada"

Se considera terminada la pestaña Canchas cuando:

- Super Admin puede crear canchas (con selector de tenant)
- Admin de tenant puede ver, editar y activar/desactivar solo sus canchas
- Super Admin ve todas las canchas con indicación de tenant
- Validación Zod en POST/PUT
- Modal de confirmación para eliminar (no `confirm()` nativo)
- UI para horarios operativos (start, end, slot_duration)
- Feedback consistente (toasts, loading, sin logs de producción)
- Sin huecos de seguridad multitenant

Correcciones relacionadas (fuera de la sección canchas pero que afectan precios/canchas): basePrice/base_price en useCourtPrices y TurneroApp, manejo de errores GET.

---

## Impacto de la refactorización auth

La refactorización del middleware ([refactor-auth-middleware-reducir-bundle.md](docs/pasos/refactor-auth-middleware-reducir-bundle.md)) **no afecta** la sección de canchas. El middleware usa `lib/auth-middleware.ts` para validar sesión en Edge, mientras que la API `/api/courts` sigue usando `lib/auth.ts`. La estructura de sesión (id, role, tenantId, isAdmin, isSuperAdmin) es idéntica. No se requieren cambios por esta refactorización.

---

## Análisis profundo – Huecos adicionales (iteración 2)

Exploración exhaustiva del flujo de datos, consumidores de la API y servicios relacionados.

### GAP A: `base_price` vs `basePrice` en consumidores (crítico)

La API `/api/courts` devuelve `basePrice` (camelCase) en pesos. Varios consumidores esperan `base_price` o dividen por 100:


| Archivo                                         | Uso actual                                                      | Resultado                         |
| ----------------------------------------------- | --------------------------------------------------------------- | --------------------------------- |
| `hooks/useCourtPrices.ts`                       | Interfaz usa `base_price`; `court.base_price * priceMultiplier` | `undefined * n = NaN` → precios 0 |
| `components/TurneroApp.tsx:107`                 | `(court.base_price`                                             |                                   |
| `components/HomeSection.tsx`                    | `basePrice ?? base_price` (fallback)                            | OK, maneja ambos                  |
| `components/providers/AppStateProvider.tsx:900` | `basePrice ?? base_price ?? 6000`                               | OK                                |


**Solución:** Unificar en `basePrice` (pesos). En `useCourtPrices.ts`: cambiar interfaz a `basePrice` y usar `court.basePrice ?? court.base_price` por compatibilidad. En `TurneroApp.tsx`: usar `court.basePrice` (en pesos) y no dividir por 100. No forma parte directa de la sección canchas pero afecta a los precios mostrados; documentar como corrección relacionada.

### GAP B: Errores de GET enmascarados

En `app/api/courts/route.ts`, el catch devuelve `NextResponse.json([])` con status 200. El cliente no distingue entre "no hay canchas" y "hubo error". Cualquier fallo (BD, permisos, etc.) se interpreta como lista vacía.

**Solución:** En el catch, devolver `NextResponse.json({ error: 'Error al obtener canchas' }, { status: 500 })`. El cliente debe manejar `!response.ok` y mostrar toast de error en lugar de lista vacía silenciosa.

### GAP C: `operatingHours` en PUT

`UpdateCourtData` define `operatingHours?: string` (JSON string). El plan contempla enviar un objeto desde el frontend. El servicio `updateCourt` pasa los datos tal cual a Prisma (que espera string).

**Solución:** En la API o en el servicio, si `updateData.operatingHours` es objeto, hacer `JSON.stringify()` antes de pasar a Prisma. O extender `UpdateCourtData` para aceptar `object | string` y normalizar en el servicio.

### GAP D: GET sin sesión + `view=public`

Cuando no hay sesión, `userTenantId` es null. Se llama `getCourts(undefined)`, que devuelve todas las canchas activas de todos los tenants (sin filtro por tenant). Para vistas de club público (`/club/[slug]`) podría ser conveniente filtrar por tenant, pero actualmente la página club redirige a login, así que la vista pública real es la landing. Marcar como **mejora futura** si se requiere filtro por `tenantSlug` en GET público.

### GAP E: Formato de `operatingHours` (start, end)

Zod debe validar que `start` y `end` tengan formato HH:MM (ej. `z.string().regex(/^\d{1,2}:\d{2}$/)` o usar `OperatingHoursSchema` de `lib/schemas` si existe).

### GAP F: Slots API y `basePrice`

La API de slots usa `getCourtById` → `transformCourtData` → `basePrice` en pesos. Coherente. Fallback 6000 en slots asume centavos/pesos; valor legacy, no bloqueante para canchas.

### GAP G: `priceMultiplier` en formulario

El modelo Court tiene `priceMultiplier` (default 1.0). El formulario actual no lo incluye. Opcional: añadir campo numérico para multiplicador si se quiere permitir precios diferenciados por cancha.

### GAP H: Interface Court en página canchas

La interfaz local solo incluye `id, name, basePrice, isActive, description`. Falta: `tenantId?`, `tenantName?`, `operatingHours?`. Extender según lo que se muestre en la UI.

### GAP I: Validación de precios en frontend

El form valida `basePrice <= 0` con toast. Mantener validación local además de Zod en API para feedback inmediato.

---

## Huecos multitenant (tenant por defecto + tenant B)

Con dos tenants activos (por defecto y tenant B), se identificaron estos huecos:

### GAP 1: Super Admin no puede crear canchas (crítico)

El formulario de canchas **no envía `tenantId`**. La API solo asigna `tenantId` cuando `userTenantId` existe (`if (userTenantId && !data.tenantId)`). El Super Admin típicamente **no tiene** `tenantId` en sesión (no pertenece a un tenant). Resultado: `createCourt` recibe `tenantId` vacío y lanza *"tenantId es requerido para crear una cancha"*.

**Solución:** Añadir selector de tenant en el formulario modal (solo visible para Super Admin). Cargar lista de tenants desde `GET /api/tenants` y enviar `tenantId` en el payload de POST.

### GAP 2: Super Admin ve canchas mezcladas sin contexto

`getAllCourts()` sin filtro devuelve canchas de todos los tenants juntas. No hay indicación de a qué tenant pertenece cada cancha (p. ej. "Cancha 1" existe en ambos tenants).

**Solución:** Incluir `tenantId` y `tenantName` (o `tenantSlug`) en la respuesta cuando el usuario es Super Admin. Opciones: (a) extender `transformCourtData` para incluir tenant cuando `includeTenant=true`, (b) añadir join en `getAllCourts` y devolver objeto extendido. En la UI, mostrar badge o subtítulo con el tenant en cada card cuando `isSuperAdmin`.

### GAP 3: Admin de tenant B sin confusión

El Admin de tenant B tiene `session.user.tenantId` = tenant B. `getAllCourts(userTenantId)` filtra correctamente. No hay cambio necesario; solo verificar con test manual que un admin de tenant B ve únicamente canchas de su tenant.

### GAP 4: API basePrice

El frontend envía `basePrice` en pesos (ej. 5000). El servicio guarda en centavos (`* 100`). La validación Zod debe aceptar `basePrice` como número positivo (en pesos). Coherente con el flujo actual.

### Dependencias

- `GET /api/tenants` solo permite Super Admin; el selector de tenant en el formulario solo funciona para Super Admin, que es correcto.
- `OperatingHoursSchema` existe en `lib/schemas.ts`; reutilizar para validación.
- AlertDialog ya está en `components/ui/alert-dialog.tsx` (shadcn).

---

## Archivos principales

| Archivo                                  | Cambios                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lib/validations/court.ts`               | Nuevo: schemas Zod; reutilizar `OperatingHoursSchema` de `lib/schemas` si existe         |
| `app/api/courts/route.ts`                | Zod POST/PUT; validación tenantId Super Admin; catch devuelve 500                        |
| `lib/services/courts.ts`                 | `getAllCourts` opción includeTenant; `updateCourt` stringify operatingHours si es objeto |
| `app/admin-panel/admin/canchas/page.tsx` | Selector tenant, AlertDialog, operatingHours, badge tenant, feedback, logs               |
| `hooks/useCourtPrices.ts`                | Interfaz `basePrice`; fallback `court.basePrice ?? court.base_price`                     |
| `components/TurneroApp.tsx`              | Usar `court.basePrice` (pesos); no dividir por 100                                       |

---

## Checklist final de verificación

Antes de dar por cerrada la sección canchas:

- Super Admin sin tenantId puede crear cancha tras seleccionar tenant
- Admin de tenant B solo ve canchas de tenant B
- Super Admin ve canchas de todos los tenants con badge de tenant
- Admin de tenant B no puede eliminar (solo Super Admin)
- Admin de tenant B no puede editar cancha de otro tenant (403)
- POST sin tenantId (Super Admin) devuelve 400 con mensaje claro
- PUT con operatingHours como objeto se persiste correctamente
- Zod rechaza basePrice <= 0, name vacío, operatingHours inválido
- Eliminación usa AlertDialog, no confirm()
- No hay console.log en producción en página canchas
- Loading visible durante submit/delete/toggle
- Error en GET courts muestra toast (no lista vacía silenciosa)
- useCourtPrices y TurneroApp muestran precios correctos (basePrice en pesos)
