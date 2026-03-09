/**
 * Planes de suscripción para tenants.
 * Cada plan define un límite de canchas y una cantidad por defecto al hacer bootstrap.
 */

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'BASIC',
    name: 'Plan Básico',
    maxCourts: 3,
    defaultCourts: 3,
    description: 'Hasta 3 canchas',
  },
  MEDIUM: {
    id: 'MEDIUM',
    name: 'Plan Intermedio',
    maxCourts: 6,
    defaultCourts: 6,
    description: 'Hasta 6 canchas',
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Plan Premium',
    maxCourts: null as number | null,
    defaultCourts: 9,
    description: 'Sin límite de canchas (9 por defecto)',
  },
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[PlanId]

/**
 * Devuelve la cantidad máxima de canchas permitidas para un plan.
 * Si el plan no existe o es null, devuelve 3 (equivalente a BASIC).
 * Si el plan es PREMIUM, devuelve null (sin límite).
 */
export function getPlanMaxCourts(planId: string | null | undefined): number | null {
  if (!planId) return SUBSCRIPTION_PLANS.BASIC.maxCourts
  const plan = SUBSCRIPTION_PLANS[planId as PlanId]
  if (!plan) return SUBSCRIPTION_PLANS.BASIC.maxCourts
  return plan.maxCourts
}

/**
 * Devuelve la cantidad de canchas por defecto al hacer bootstrap para un plan.
 */
export function getPlanDefaultCourts(planId: string | null | undefined): number {
  if (!planId) return SUBSCRIPTION_PLANS.BASIC.defaultCourts
  const plan = SUBSCRIPTION_PLANS[planId as PlanId]
  if (!plan) return SUBSCRIPTION_PLANS.BASIC.defaultCourts
  return plan.defaultCourts
}

/**
 * Devuelve el plan completo por ID, o BASIC si no se encuentra.
 */
export function getPlan(planId: string | null | undefined): SubscriptionPlan {
  if (!planId) return SUBSCRIPTION_PLANS.BASIC
  const plan = SUBSCRIPTION_PLANS[planId as PlanId]
  return plan || SUBSCRIPTION_PLANS.BASIC
}

/**
 * Lista de todos los planes disponibles para mostrar en selectores UI.
 */
export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS)
}
