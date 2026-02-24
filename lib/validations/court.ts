import { z } from 'zod'

const operatingHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  slot_duration: z.number().int().min(30).max(180).default(90),
}).optional()

export const courtCreateSchema = z.object({
  tenantId: z.string().cuid().optional(),
  name: z.string().min(1, 'Nombre requerido'),
  basePrice: z.number().positive('El precio debe ser mayor a 0'),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  operatingHours: operatingHoursSchema,
})

export const courtUpdateSchema = courtCreateSchema.partial().extend({
  id: z.string().cuid('ID de cancha inválido'),
})

export type CourtCreateInput = z.infer<typeof courtCreateSchema>
export type CourtUpdateInput = z.infer<typeof courtUpdateSchema>
