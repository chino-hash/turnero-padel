# Canchas por plan, ensureCourtsForPlan, precio base editable y migración SystemSetting (2026-03)

**Fecha:** Marzo 2026  
**Referencia:** Plan [canchas-por-plan-y-colores-iterado.plan.md](.cursor/plans/canchas-por-plan-y-colores-iterado.plan.md)

Documentación de los cambios realizados para que las canchas de un tenant se creen o actualicen automáticamente según el plan al guardar (sin depender de "Ejecutar bootstrap"), el campo precio base sea editable como texto, y la tabla `SystemSetting` soporte multitenant.

---

## 1. Resumen

- **ensureCourtsForPlan**: Función exportada en el servicio de bootstrap que asegura que un tenant tenga exactamente 3, 6 o 9 canchas (Cancha 1…N) según su `subscriptionPlan` (BASIC / MEDIUM / PREMIUM). Idempotente por nombre.
- **PUT tenant**: Tras actualizar un tenant, se llama siempre a `ensureCourtsForPlan(tenantId)`, de modo que al cambiar el plan (p. ej. a Intermedio) y guardar, se crean las canchas faltantes sin tener que ejecutar bootstrap.
- **Bootstrap**: El flujo de canchas de `bootstrapTenant` se reemplazó por una única llamada a `ensureCourtsForPlan(tenantId)`.
- **Precio base**: El input de precio base en la sección Canchas del super admin pasó de `type="number"` a `type="text"` con `inputMode="decimal"` y validación al enviar, para poder borrar y escribir el valor con libertad.
- **SystemSetting**: Migración para cambiar el índice único de `(key)` a `(key, tenantId)` y permitir que cada tenant tenga sus propios system settings.

---

## 2. ensureCourtsForPlan (lib/services/tenants/bootstrap.ts)

### Función

```ts
export async function ensureCourtsForPlan(tenantId: string): Promise<number>
```

- Obtiene el tenant (solo `subscriptionPlan`).
- Calcula `numCourts = getPlanDefaultCourts(tenant.subscriptionPlan)` (3, 6 o 9 según BASIC / MEDIUM / PREMIUM).
- Para cada `n` de 1 a `numCourts`:
  - Nombre `Cancha ${n}`.
  - Si no existe cancha con ese nombre en el tenant: `prisma.court.create` con nombre, description, `basePrice` (desde `DEFAULT_COURT_VALUES`), `operatingHours` (desde `getDefaultOperatingHoursJson()`), `features: JSON.stringify(getCourtFeaturesByIndex(n))`, `priceMultiplier: 1`, `isActive: true`.
  - Si existe: `prisma.court.update` con los mismos datos (descripción, basePrice, operatingHours, features, isActive).
- Retorna el número de canchas aseguradas.

Usa constantes de [lib/constants/court-defaults.ts](lib/constants/court-defaults.ts) y [lib/court-colors.ts](lib/court-colors.ts).

### Uso en bootstrapTenant

- El bucle que creaba/actualizaba canchas según `courtDefs` fue reemplazado por:
  - `const courtsEnsured = await ensureCourtsForPlan(tenantId)`
- El resultado se sigue exponiendo en `ensured.courts` del `BootstrapTenantResult`.

---

## 3. PUT /api/tenants/[id] – Sincronizar canchas al guardar

**Archivo:** [app/api/tenants/[id]/route.ts](app/api/tenants/[id]/route.ts)

- Tras `prisma.tenant.update` y (si aplica) actualización de `AdminWhitelist`, se llama **siempre** a `ensureCourtsForPlan(id)`.
- No se condiciona a que `subscriptionPlan` venga en el body: en cada guardado del tenant se asegura que las canchas coincidan con el plan actual del tenant en BD.
- Con esto, al editar Metro 360, cambiar el plan a Intermedio y guardar, se crean las 6 canchas si no existían (o se actualizan las existentes) sin usar "Ejecutar bootstrap".

**Import añadido:** `ensureCourtsForPlan` desde `@/lib/services/tenants/bootstrap`.

---

## 4. Input precio base editable (super admin – Canchas)

**Archivo:** [app/super-admin/tenants/[id]/page.tsx](app/super-admin/tenants/[id]/page.tsx)

### Cambio en el input

- **Antes:** `<Input name="courtBasePrice" type="number" min={1} defaultValue={24000} className="w-24" />`
- **Después:** `<Input name="courtBasePrice" type="text" inputMode="decimal" defaultValue="24000" placeholder="24000" className="w-24" />`

Así el usuario puede borrar todo el valor y escribir otro número con el teclado, sin depender de las flechas del `type="number"`.

### Validación en handleAddCourt

- Se lee el valor como texto y se parsea con `parseFloat`.
- Si el resultado es `NaN` o menor que 1, se muestra `toast.error('Precio base debe ser un número mayor a 0')` y no se envía el POST.
- Si es válido, se envía el número al API (el backend espera `basePrice` en pesos).

---

## 5. Migración SystemSetting (key + tenantId)

**Problema:** La tabla `SystemSetting` tenía en BD un índice único solo sobre `key`, mientras que el schema de Prisma define `@@unique([key, tenantId])`. Al ejecutar bootstrap para un segundo tenant, el upsert de system settings fallaba con "Unique constraint failed on the fields: (key)".

**Migración:** [prisma/migrations/20260312000000_system_setting_key_tenantid_unique/migration.sql](prisma/migrations/20260312000000_system_setting_key_tenantid_unique/migration.sql)

- `DROP INDEX IF EXISTS "public"."SystemSetting_key_key";`
- `CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_tenantId_key" ON "public"."SystemSetting"("key", "tenantId");`

Idempotente: si el índice nuevo ya existía (p. ej. por un intento previo), la migración no falla.

**Recuperación tras fallo previo:** Si la migración llegó a fallar antes de ser idempotente:

```bash
npx prisma migrate resolve --rolled-back 20260312000000_system_setting_key_tenantid_unique
npx prisma migrate deploy
```

---

## 6. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/services/tenants/bootstrap.ts` | Nueva función `ensureCourtsForPlan(tenantId)`; `bootstrapTenant` usa esa función para canchas. |
| `app/api/tenants/[id]/route.ts` | Import de `ensureCourtsForPlan`; llamada a `ensureCourtsForPlan(id)` tras actualizar tenant en PUT. |
| `app/super-admin/tenants/[id]/page.tsx` | Input precio base: `type="text"`, `inputMode="decimal"`, validación en `handleAddCourt`. |
| `prisma/migrations/20260312000000_system_setting_key_tenantid_unique/migration.sql` | Nuevo: unique de SystemSetting pasa de `(key)` a `(key, tenantId)`. |

---

## 7. Comportamiento esperado

- **Crear tenant:** Sigue igual: POST `/api/tenants` crea 3, 6 o 9 canchas según el plan elegido (ya estaba implementado).
- **Editar tenant y guardar:** Siempre se ejecuta `ensureCourtsForPlan`; si el plan es Intermedio y había 0 o 3 canchas, pasan a ser 6.
- **Bootstrap:** Sigue creando/actualizando canchas según el plan del tenant; internamente usa `ensureCourtsForPlan`. Los system settings se crean por tenant sin conflicto de unique una vez aplicada la migración.
- **Precio base en Canchas:** Se puede editar como texto (borrar y escribir); se valida que sea número > 0 al agregar cancha.
