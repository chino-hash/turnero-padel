import { z } from 'zod'

const TIME_REGEX = /^([01]?\d|2[0-3]):[0-5]\d$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const categoryAllowlist = [
  '8va', '7ma', '6ta', '5ta', '4ta', '3ra', '2da', '1ra',
  'Mixto', 'Suma 13', 'Suma',
] as const

const timeSchema = z.string().regex(TIME_REGEX, 'Formato HH:mm')
const dateStringSchema = z.string().regex(DATE_REGEX, 'Formato YYYY-MM-DD')

const dayBlockRangeSchema = z.object({
  start: timeSchema,
  end: timeSchema,
}).refine((r) => r.start < r.end, { message: 'La hora de inicio debe ser anterior a la de fin', path: ['end'] })

const dayBlockSchema = z.object({
  date: dateStringSchema,
  ranges: z.array(dayBlockRangeSchema).min(1, 'Al menos un rango por fecha'),
})

export const tournamentDayBlocksSchema = z.array(dayBlockSchema).min(1, 'Al menos un día con franjas')

function isNotPastDate(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d.getTime() >= today.getTime()
}

export const tournamentCreateSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(200),
  category: z.enum(categoryAllowlist, { message: 'Categoría no válida' }),
  prizeFirst: z.coerce.number().int().min(0, 'Premio primero debe ser >= 0'),
  prizeSecond: z.coerce.number().int().min(0, 'Premio segundo debe ser >= 0'),
  minPairs: z.coerce.number().int().min(1, 'Mínimo 1 pareja').max(128),
  maxPairs: z.coerce.number().int().min(1, 'Máximo de parejas >= 1').max(128),
  dayBlocks: tournamentDayBlocksSchema,
})
  .refine((data) => data.minPairs <= data.maxPairs, {
    message: 'minPairs debe ser menor o igual a maxPairs',
    path: ['maxPairs'],
  })
  .refine(
    (data) => data.dayBlocks.every((b) => isNotPastDate(b.date)),
    { message: 'No se permiten fechas en el pasado', path: ['dayBlocks'] },
  )

export const tournamentUpdateSchema = tournamentCreateSchema.partial().extend({
  status: z.enum(['DRAFT', 'OPEN_REGISTRATION', 'CLOSED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']).optional(),
  publishedAt: z.coerce.date().nullable().optional(),
})
  .refine(
    (data) =>
      data.minPairs == null || data.maxPairs == null || data.minPairs <= data.maxPairs,
    { message: 'minPairs debe ser menor o igual a maxPairs', path: ['maxPairs'] },
  )
  .refine(
    (data) =>
      !data.dayBlocks || data.dayBlocks.every((b) => isNotPastDate(b.date)),
    { message: 'No se permiten fechas en el pasado', path: ['dayBlocks'] },
  )

export const tournamentRegistrationCreateSchema = z.object({
  type: z.enum(['SINGLE', 'PAIR']),
  playerName: z.string().min(1, 'Nombre del jugador requerido'),
  playerEmail: z.string().email().optional().or(z.literal('')),
  playerPhone: z.string().optional(),
  partnerName: z.string().optional(),
  partnerEmail: z.string().email().optional().or(z.literal('')),
  partnerPhone: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'PAIR') {
      return (data.partnerName ?? '').trim().length > 0
    }
    return true
  },
  { message: 'Para pareja se requiere nombre del compañero', path: ['partnerName'] },
)

export const tournamentRegistrationUpdateSchema = tournamentRegistrationCreateSchema.partial().extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
})

// --- Partidos (Fase 4) ---
const matchRoundEnum = z.enum(['ROUND_1', 'ROUND_2', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL'])
const matchStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export const tournamentMatchCreateSchema = z.object({
  round: matchRoundEnum,
  positionInRound: z.coerce.number().int().min(0, 'positionInRound >= 0'),
  registration1Id: z.string().cuid().optional().nullable(),
  registration2Id: z.string().cuid().optional().nullable(),
  courtId: z.string().cuid().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
}).refine(
  (data) => data.registration1Id != null || data.registration2Id != null,
  { message: 'Al menos un participante (registration1 o registration2) debe estar definido', path: ['registration1Id'] },
)

export const tournamentMatchUpdateSchema = z.object({
  round: matchRoundEnum.optional(),
  positionInRound: z.coerce.number().int().min(0).optional(),
  registration1Id: z.string().cuid().optional().nullable(),
  registration2Id: z.string().cuid().optional().nullable(),
  winnerRegistrationId: z.string().cuid().optional().nullable(),
  score: z.string().max(200).optional().nullable(),
  courtId: z.string().cuid().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
  status: matchStatusEnum.optional(),
})

export type TournamentCreateInput = z.infer<typeof tournamentCreateSchema>
export type TournamentUpdateInput = z.infer<typeof tournamentUpdateSchema>
export type TournamentRegistrationCreateInput = z.infer<typeof tournamentRegistrationCreateSchema>
export type TournamentRegistrationUpdateInput = z.infer<typeof tournamentRegistrationUpdateSchema>
export type TournamentMatchCreateInput = z.infer<typeof tournamentMatchCreateSchema>
export type TournamentMatchUpdateInput = z.infer<typeof tournamentMatchUpdateSchema>
