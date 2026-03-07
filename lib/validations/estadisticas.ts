import { z } from 'zod'

export const periodSchema = z
  .enum(['hoy', 'semana', 'mes', 'trimestre', 'ano'])
  .optional()
  .default('mes')

export type Period = z.infer<typeof periodSchema>

export const estadisticasQuerySchema = z.object({
  period: periodSchema,
})

export type EstadisticasQuery = z.infer<typeof estadisticasQuerySchema>
