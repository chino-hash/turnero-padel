import type { BookingWithRelations } from '../../repositories/BookingRepository'

export type PricingSummary = {
  basePrice: number
  extrasTotal: number
  amountPaid: number
  totalCalculated: number
  pendingBalance: number
}

// Calcula precios para un turno en base a basePrice (totalPrice), extras y pagos
export function computePricing(booking: BookingWithRelations): PricingSummary {
  const basePrice = booking.totalPrice || 0

  const extrasTotal = (booking as any).extras
    ? (booking as any).extras
        .filter((e: any) => !e.deletedAt)
        .reduce((sum: number, e: any) => sum + (e.totalPrice ?? (e.unitPrice ?? 0) * (e.quantity ?? 0)), 0)
    : 0

  // Preferir pagos reales si existen, si no, sumar paidAmount de jugadores
  const amountPaidFromPayments = booking.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const amountPaidFromPlayers = booking.players?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0
  const amountPaid = amountPaidFromPayments > 0 ? amountPaidFromPayments : amountPaidFromPlayers

  const totalCalculated = basePrice + extrasTotal
  const pendingBalance = Math.max(totalCalculated - amountPaid, 0)

  return { basePrice, extrasTotal, amountPaid, totalCalculated, pendingBalance }
}