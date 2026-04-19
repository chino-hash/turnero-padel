import { getTenantTimezoneConfig } from '@/lib/config/env'

export function getTenantTimezone(): string {
  return getTenantTimezoneConfig().timezone
}

export function toUtcDayStart(date: Date): Date {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

export function toDateKey(date: Date): string {
  return toUtcDayStart(date).toISOString().slice(0, 10)
}

export function formatDateForTenant(date: Date, timezone?: string): string {
  const tz = timezone || getTenantTimezone()
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
