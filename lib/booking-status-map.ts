import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, type BookingStatus } from '@/types/booking'

// Mapa combinado para consumo directo por componentes
export const BOOKING_STATUS_MAP: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: BOOKING_STATUS_LABELS.PENDING, className: BOOKING_STATUS_COLORS.PENDING },
  CONFIRMED: { label: BOOKING_STATUS_LABELS.CONFIRMED, className: BOOKING_STATUS_COLORS.CONFIRMED },
  ACTIVE: { label: BOOKING_STATUS_LABELS.ACTIVE, className: BOOKING_STATUS_COLORS.ACTIVE },
  COMPLETED: { label: BOOKING_STATUS_LABELS.COMPLETED, className: BOOKING_STATUS_COLORS.COMPLETED },
  CANCELLED: { label: BOOKING_STATUS_LABELS.CANCELLED, className: BOOKING_STATUS_COLORS.CANCELLED },
}

// Claves de estado para iteraciones en selects o tablas
export const STATUS_KEYS: BookingStatus[] = Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]

// Reexports para mantener fuente única de verdad
export { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types/booking'