# Pendientes - Planes de suscripción por canchas

**Contexto:** Definir planes comerciales para vender el sistema, limitando la cantidad de canchas según el plan contratado.

**Restricción de negocio:** Solo el Super Admin puede crear o eliminar canchas. Los admins del tenant solo editan las existentes (nombre, precio, activar/desactivar).

---

## Modelo de planes propuesto

| Plan     | Canchas      | Precio mensual | Notas                          |
|----------|--------------|----------------|--------------------------------|
| Básico   | 1 a 3        | Por definir    | Plan inicial al bootstrap      |
| Intermedio | 4 a 6      | Por definir    |                                |
| Premium  | 7 o más      | Por definir    | Sin límite máximo (o muy alto) |

---

## Archivos a modificar o crear

| Archivo | Acción |
|---------|--------|
| `lib/subscription-plans.ts` | **Crear** – Constantes y lógica de planes |
| `lib/services/courts.ts` | Modificar `createCourt` – Validar límite antes de crear |
| `app/api/courts/route.ts` | Modificar POST – Propagar error de límite (400) |
| `lib/services/tenants/bootstrap.ts` | Modificar – Asignar `subscriptionPlan: 'BASIC'` al crear tenant |
| `app/super-admin/tenants/[id]/page.tsx` | Modificar – Select de plan en lugar de texto libre |
| `app/admin-panel/admin/canchas/page.tsx` | Opcional – Mostrar límite y estado del plan |

---

## Paso 1: Crear definición de planes

**Archivo:** `lib/subscription-plans.ts` (nuevo)

```typescript
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'BASIC',
    name: 'Plan Básico',
    maxCourts: 3,
    priceMonthly: 0, // Definir luego
    description: 'Hasta 3 canchas',
  },
  MEDIUM: {
    id: 'MEDIUM',
    name: 'Plan Intermedio',
    maxCourts: 6,
    priceMonthly: 0, // Definir luego
    description: 'Entre 4 y 6 canchas',
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Plan Premium',
    maxCourts: null, // Sin límite práctico
    priceMonthly: 0, // Definir luego
    description: '7 o más canchas',
  },
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS

export function getPlanMaxCourts(planId: string | null): number | null {
  const plan = planId && SUBSCRIPTION_PLANS[planId as PlanId]
  if (!plan) return 3
  return plan.maxCourts
}
```

---

## Paso 2: Validar límite al crear cancha

**Archivo:** `lib/services/courts.ts` – función `createCourt`

Antes de `prisma.court.create`:

1. Obtener el tenant con `subscriptionPlan`.
2. Obtener `maxCourts` con `getPlanMaxCourts(tenant.subscriptionPlan)`.
3. Contar canchas activas del tenant donde `deletedAt = null`.
4. Si `maxCourts !== null` y `currentCount >= maxCourts`, lanzar error descriptivo.

```typescript
// Ejemplo de lógica
const tenant = await prisma.tenant.findUnique({
  where: { id: data.tenantId },
  select: { subscriptionPlan: true },
})
const maxCourts = getPlanMaxCourts(tenant?.subscriptionPlan ?? null)
if (maxCourts !== null) {
  const currentCount = await prisma.court.count({
    where: { tenantId: data.tenantId, deletedAt: null },
  })
  if (currentCount >= maxCourts) {
    throw new Error(
      `El plan actual permite hasta ${maxCourts} canchas. Actualiza el plan del tenant para agregar más.`
    )
  }
}
```

**Criterio de conteo:** Contar todas las canchas con `deletedAt = null` (no solo activas), ya que el Super Admin gestiona canchas reales del tenant.

---

## Paso 3: Bootstrap con plan por defecto

**Archivo:** `lib/services/tenants/bootstrap.ts`

Al crear un tenant nuevo, asignar:

```typescript
subscriptionPlan: 'BASIC',
```

Esto asegura que los tenants nuevos arranquen con límite de 3 canchas.

---

## Paso 4: Panel Super Admin – selector de plan

**Archivo:** `app/super-admin/tenants/[id]/page.tsx`

- Reemplazar el input de texto de "Plan de Suscripción" por un `<Select>` con opciones: Básico, Intermedio, Premium.
- Opcional: Mostrar `maxCourts` y `priceMonthly` junto a cada opción.
- Al cambiar de plan, validar que el número actual de canchas del tenant no supere el nuevo `maxCourts`; si supera, advertir o bloquear el cambio.

---

## Paso 5: UI opcional en Canchas (admin tenant)

**Archivo:** `app/admin-panel/admin/canchas/page.tsx`

- Obtener plan y límite del tenant (nuevo endpoint o incluir en respuesta existente).
- Mostrar mensaje: *"X canchas de Y permitidas por tu plan"*.
- No mostrar botón "Agregar cancha" a los admins (ya está limitado en API; el Super Admin usa otra vista). Solo informar si corresponde.

---

## Paso 6: Precios por plan

**Opciones:**

1. **Variables de entorno:** `PLAN_BASIC_PRICE`, `PLAN_MEDIUM_PRICE`, `PLAN_PREMIUM_PRICE`.
2. **Constantes en código:** En `SUBSCRIPTION_PLANS`, definir `priceMonthly` cuando se tengan los valores.
3. **Tabla en BD:** Crear modelo `SubscriptionPlan` con `planId`, `priceMonthly`, `maxCourts` para mayor flexibilidad.

Recomendación inicial: constantes en `lib/subscription-plans.ts`.

---

## Decisiones previas a implementar

| Tema | Opciones | Sugerencia |
|------|----------|------------|
| Conteo de canchas | Solo activas (`isActive: true`) vs todas no eliminadas (`deletedAt: null`) | `deletedAt: null` (considerar todas las canchas creadas) |
| Asignación de plan | Manual (Super Admin) vs automática según canchas | Manual por Super Admin |
| Precios | Dónde guardar | Constantes en `lib/subscription-plans.ts` hasta definir estrategia de cobro |

---

## Referencias

- Schema Tenant: `prisma/schema.prisma` (campos `subscriptionPlan`, `subscriptionExpiresAt`)
- API Courts: `app/api/courts/route.ts` (POST y DELETE solo Super Admin)
- Servicio canchas: `lib/services/courts.ts`
- Bootstrap tenant: `lib/services/tenants/bootstrap.ts`
- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Skill multitenant: `.cursor/skills/turnero-padel-multitenant/SKILL.md`
