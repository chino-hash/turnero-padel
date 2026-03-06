import { z } from 'zod'
import { paginationSchema } from './common'

export const usuariosListQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  categoria: z.enum(['VIP', 'Premium', 'Regular']).optional(),
  actividad: z.enum(['activos', 'inactivos', 'nuevos']).optional(),
})

export type UsuariosListQuery = z.infer<typeof usuariosListQuerySchema>
