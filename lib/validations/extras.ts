import { z } from 'zod'

// Crear extra para una reserva
export const createBookingExtraSchema = z.object({
  productoId: z.number({ required_error: 'Producto requerido' }).int().positive(),
  quantity: z.number({ required_error: 'Cantidad requerida' }).int().min(1, 'Cantidad mínima 1'),
  assignedToAll: z.boolean().default(false),
  playerId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
})

// Eliminación (soft delete) de extra
export const deleteBookingExtraSchema = z.object({
  extraId: z.string({ required_error: 'ID de extra requerido' }).cuid(),
})

export type CreateBookingExtraInput = z.infer<typeof createBookingExtraSchema>
export type DeleteBookingExtraInput = z.infer<typeof deleteBookingExtraSchema>