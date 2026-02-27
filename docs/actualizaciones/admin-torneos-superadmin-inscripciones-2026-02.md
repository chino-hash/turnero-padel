# Admin Torneos: super admin puede crear torneos y gestionar inscripciones

**Fecha:** 24 de febrero de 2026

Documentación de los cambios que permiten al **super administrador** crear torneos (seleccionando el club) y gestionar inscripciones en cualquier torneo, además de las mejoras de robustez en la UI de inscripciones.

---

## Resumen

- **Super admin puede crear torneos:** Debe elegir el club (tenant) en un selector en la pantalla "Crear torneo". La API acepta `tenantId` en el body y valida acceso con `canAccessTenant`.
- **Super admin puede gestionar inscripciones:** Ver lista, agregar parejas/solos y eliminar inscripciones en cualquier torneo; la API resuelve el `tenantId` del torneo y comprueba `canAccessTenant`.
- **UI:** Selector de club para super admin al crear torneo; manejo de errores al cargar inscripciones (Reintentar), mensaje del API al fallar agregar, y aviso "Cupo completo" cuando se alcanza el máximo de parejas.

---

## 1. Crear torneos: super admin

### Comportamiento

- **Admin de un club (tenant):** Crea torneos para su club sin cambios; no ve selector de club y el torneo se asocia al tenant de su sesión.
- **Super admin:** En la vista "Crear torneo" se muestra un **selector "Club (tenant)"** arriba del formulario. Debe elegir un club de la lista antes de publicar. Al enviar el formulario se incluye `tenantId` en el payload. La API valida que el super admin tenga acceso a ese tenant (`canAccessTenant`) y crea el torneo para ese club.

### API POST /api/torneos

**Archivo:** `app/api/torneos/route.ts`

- Se parsea el body y se extrae `tenantId` opcional (`raw.tenantId`).
- Si el usuario es **super admin**:
  - Si no envía `tenantId` → 403 "Seleccione el club para el cual crear el torneo".
  - Si envía `tenantId`: se comprueba `canAccessTenant(user, tenantId)`; si no tiene acceso → 403. Se llama a `createTournament(tenantId, parsed.data)`.
- Si el usuario **no** es super admin: se usa `getUserTenantIdSafe(user)` como hasta ahora; si no tiene tenant o no es admin del club → 403. Se crea el torneo para ese tenant.

Queda explícito: **el super admin sí puede crear torneos**, siempre que indique para qué club y tenga acceso a ese tenant.

### UI Crear torneo

**Archivo:** `app/admin-panel/admin/torneos/page.tsx`

- Se usa `useSession()`; si `session?.user?.isSuperAdmin` se muestra el bloque del selector de club.
- Al montar la vista "crear" y ser super admin, se hace GET a `/api/tenants` (con `credentials: "include"`) y se rellena la lista de clubs.
- El selector usa `Select` de shadcn con `value={selectedTenantId}` y `onValueChange={setSelectedTenantId}`.
- Al publicar (POST), si es super admin y hay `selectedTenantId`, se envía `tenantId: selectedTenantId` en el payload. Si es super admin y no hay club seleccionado, se muestra toast de error y no se envía la petición.

---

## 2. Inscripciones: super admin

### Comportamiento

El super admin puede ver la lista de inscripciones de un torneo, agregar inscripciones (pareja o solo) y eliminar (y editar) inscripciones, igual que el admin del club. La API resuelve el tenant del torneo y comprueba que el super admin tenga acceso a ese tenant.

### API inscripciones

**Archivos:**

- `app/api/torneos/[id]/inscripciones/route.ts` (GET y POST)
- `app/api/torneos/[id]/inscripciones/[registrationId]/route.ts` (PATCH y DELETE)

**Lógica común:**

- Si no hay sesión → 401.
- Se construye el objeto `user` desde la sesión y se determina si es super admin con `isSuperAdminUser(user)`.
- **Super admin:** Se obtiene el torneo por `id` (Prisma `findUnique`); si no existe → 404. Se comprueba `canAccessTenant(user, tournament.tenantId)`; si no → 403. Se usan los servicios de inscripciones con `tournament.tenantId`.
- **Admin de tenant:** Se usa `getUserTenantIdSafe(user)`; si no hay tenant → 403. Se usan los servicios con ese `userTenantId`.

En PATCH/DELETE se reutiliza un helper `resolveTenantIdForInscription(tournamentId, user)` que devuelve el `tenantId` a usar o un error (404/403).

Con esto, **el super admin puede agregar parejas (y solos) al torneo** y gestionar todas las inscripciones de torneos a los que tenga acceso.

---

## 3. UI inscripciones: errores y cupo

**Archivo:** `app/admin-panel/admin/torneos/page.tsx`

- **Estado `inscripcionesError`:** Si el GET de inscripciones falla (401, 403, 404, 500 o error de red), se guarda el mensaje y se muestra en la pestaña "Gestionar inscripciones" junto con un botón **"Reintentar"** que vuelve a llamar al GET.
- **Al agregar inscripción:** Si el POST falla, el toast muestra el mensaje del API (`json?.message ?? json?.error`), por ejemplo "Cupo completo. Se alcanzó el máximo de parejas."
- **Cupo completo:** Cuando `inscripciones.currentPairs >= inscripciones.maxPairs` se muestra el texto "Cupo completo" y el botón "Agregar" queda deshabilitado.
- Al cambiar de torneo o volver al historial se limpia `inscripcionesError`.

---

## Resumen de archivos tocados

| Archivo | Cambios |
|---------|---------|
| `app/api/torneos/route.ts` | POST: aceptar `tenantId` en body para super admin; `canAccessTenant`; crear torneo para ese tenant. |
| `app/api/torneos/[id]/inscripciones/route.ts` | GET/POST: sesión 401; super admin con tenant del torneo y `canAccessTenant`. |
| `app/api/torneos/[id]/inscripciones/[registrationId]/route.ts` | PATCH/DELETE: super admin con tenant del torneo; helper `resolveTenantIdForInscription`. |
| `app/admin-panel/admin/torneos/page.tsx` | Selector de club para super admin al crear; estado error inscripciones, Reintentar, mensaje API al agregar, cupo completo. |

---

## Conclusión

- **El super admin puede crear torneos:** Debe seleccionar el club en el formulario; la API exige `tenantId` y valida acceso.
- **El super admin puede gestionar inscripciones:** Ver, agregar (parejas y solos) y eliminar/editar en cualquier torneo al que tenga acceso.
- Las reglas de cupo (mín/máx parejas), cancelación de reservas con aviso y bloqueo de canchas del tenant en las franjas del torneo se mantienen y aplican igual para torneos creados por admin del club o por super admin.
