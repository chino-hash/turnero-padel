import { z } from 'zod'

// Crear extra para una reserva
export const createBookingExtraSchema = z.object({
  productoId: z.number().int().positive(),
  quantity: z.number().int().min(1, 'Cantidad mínima 1'),
  assignedToAll: z.boolean().default(false),
  playerId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
  paidBefore: z.boolean().optional().default(false),
})

// Eliminación (soft delete) de extra
export const deleteBookingExtraSchema = z.object({
  extraId: z.string().cuid(),
})

export type CreateBookingExtraInput = z.infer<typeof createBookingExtraSchema>
export type DeleteBookingExtraInput = z.infer<typeof deleteBookingExtraSchema>