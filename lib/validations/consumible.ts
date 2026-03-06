import { z } from 'zod'

const tipoBeneficioSchema = z.enum(['descuento', 'consumible']).optional().nullable()

export const consumibleCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  requisitos: z.string().optional(),
  discountPercent: z.number().int().min(0).max(100).optional().nullable(),
  tipoBeneficio: tipoBeneficioSchema,
  productoId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
})

export const consumibleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  requisitos: z.string().optional().nullable(),
  discountPercent: z.number().int().min(0).max(100).optional().nullable(),
  tipoBeneficio: tipoBeneficioSchema,
  productoId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type ConsumibleCreateInput = z.infer<typeof consumibleCreateSchema>
export type ConsumibleUpdateInput = z.infer<typeof consumibleUpdateSchema>
