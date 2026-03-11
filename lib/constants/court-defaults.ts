/**
 * Valores por defecto para creación de canchas (tenant nuevo y bootstrap).
 * Una sola fuente para evitar divergencia entre POST /api/tenants y bootstrap.
 */
export const DEFAULT_COURT_VALUES = {
  basePrice: 24000,
  operatingStart: '08:00',
  operatingEnd: '23:00',
  slotDurationMinutes: 90,
} as const

export function getDefaultOperatingHoursJson(): string {
  return JSON.stringify({
    start: DEFAULT_COURT_VALUES.operatingStart,
    end: DEFAULT_COURT_VALUES.operatingEnd,
    slot_duration: DEFAULT_COURT_VALUES.slotDurationMinutes,
  })
}
