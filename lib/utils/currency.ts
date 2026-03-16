/**
 * Utilidades para mostrar montos en la UI.
 *
 * En BD, Booking.totalPrice, Booking.depositAmount, BookingExtra.totalPrice
 * y BookingPlayer.paidAmount están en centavos (Court.basePrice se persiste ×100).
 * Estas funciones son solo para display: convertir centavos → pesos al mostrar.
 */

/**
 * Convierte centavos a pesos para visualización.
 * No usar para lógica de negocio (comparaciones, cierre de turno, etc.).
 */
export function centsToPesos(cents: number): number {
  return cents / 100
}

/**
 * Convierte centavos a pesos y formatea como moneda (es-AR).
 * Para mostrar en UI de forma consistente.
 */
export function formatPesosFromCents(cents: number): string {
  return centsToPesos(cents).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
