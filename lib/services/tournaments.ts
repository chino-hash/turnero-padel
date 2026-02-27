import { prisma } from '../database/neon-config'
import type {
  TournamentCreateInput,
  TournamentUpdateInput,
  TournamentMatchCreateInput,
  TournamentMatchUpdateInput,
} from '../validations/tournament'
import type { TournamentStatus } from '@prisma/client'

/**
 * Cancela reservas que solapan con las franjas del torneo y crea CourtBlocks
 * para todas las canchas del tenant en esas franjas.
 */
export async function applyTournamentCourtBlocks(
  tournamentId: string,
  tenantId: string,
  title: string,
  schedule: Array<{ date: Date; startTime: string; endTime: string }>,
): Promise<void> {
  const courts = await prisma.court.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true },
  })
  const courtIds = courts.map((c) => c.id)
  if (courtIds.length === 0) return

  const cancellationReason = `Cancelado por torneo: ${title}. Contacte al club si tiene dudas.`

  for (const row of schedule) {
    const dateOnly = row.date instanceof Date ? row.date : new Date(row.date)
    const dayStart = new Date(dateOnly)
    dayStart.setUTCHours(0, 0, 0, 0)

    const overlapping = await prisma.booking.findMany({
      where: {
        tenantId,
        courtId: { in: courtIds },
        bookingDate: dayStart,
        status: { not: 'CANCELLED' },
        startTime: { lt: row.endTime },
        endTime: { gt: row.startTime },
      },
      select: { id: true },
    })

    if (overlapping.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: overlapping.map((b) => b.id) } },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason,
        },
      })
    }

    await prisma.courtBlock.createMany({
      data: courtIds.map((courtId) => ({
        tenantId,
        courtId,
        tournamentId,
        date: dayStart,
        startTime: row.startTime,
        endTime: row.endTime,
      })),
    })
  }
}

export async function removeTournamentCourtBlocks(tournamentId: string): Promise<void> {
  await prisma.courtBlock.deleteMany({ where: { tournamentId } })
}

export type TournamentWithSchedule = {
  id: string
  tenantId: string
  title: string
  category: string
  prizeFirst: number
  prizeSecond: number
  minPairs: number
  maxPairs: number
  status: TournamentStatus
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  dayBlocks: Array<{
    date: string
    ranges: Array<{ start: string; end: string }>
  }>
}

function scheduleToDayBlocks(
  schedule: Array<{ date: Date; startTime: string; endTime: string }>,
): TournamentWithSchedule['dayBlocks'] {
  const byDate = new Map<string, Array<{ start: string; end: string }>>()
  for (const row of schedule) {
    const dateStr = row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : String(row.date).slice(0, 10)
    const arr = byDate.get(dateStr) ?? []
    arr.push({ start: row.startTime, end: row.endTime })
    byDate.set(dateStr, arr)
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ranges]) => ({ date, ranges }))
}

export async function getTournamentsByTenant(tenantId: string): Promise<TournamentWithSchedule[]> {
  const list = await prisma.tournament.findMany({
    where: { tenantId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      schedule: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
    },
  })
  return list.map((t) => ({
    id: t.id,
    tenantId: t.tenantId,
    title: t.title,
    category: t.category,
    prizeFirst: t.prizeFirst,
    prizeSecond: t.prizeSecond,
    minPairs: t.minPairs,
    maxPairs: t.maxPairs,
    status: t.status,
    publishedAt: t.publishedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    dayBlocks: scheduleToDayBlocks(t.schedule),
  }))
}

export async function getTournamentById(
  tournamentId: string,
  tenantId: string,
): Promise<TournamentWithSchedule | null> {
  const t = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
    include: {
      schedule: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
    },
  })
  if (!t) return null
  return {
    id: t.id,
    tenantId: t.tenantId,
    title: t.title,
    category: t.category,
    prizeFirst: t.prizeFirst,
    prizeSecond: t.prizeSecond,
    minPairs: t.minPairs,
    maxPairs: t.maxPairs,
    status: t.status,
    publishedAt: t.publishedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    dayBlocks: scheduleToDayBlocks(t.schedule),
  }
}

export async function createTournament(
  tenantId: string,
  input: TournamentCreateInput,
): Promise<TournamentWithSchedule> {
  const tournament = await prisma.tournament.create({
    data: {
      tenantId,
      title: input.title,
      category: input.category,
      prizeFirst: input.prizeFirst,
      prizeSecond: input.prizeSecond,
      minPairs: input.minPairs,
      maxPairs: input.maxPairs,
      status: 'DRAFT',
      schedule: {
        create: input.dayBlocks.flatMap((block) =>
          block.ranges.map((r) => ({
            date: new Date(block.date + 'T00:00:00'),
            startTime: r.start,
            endTime: r.end,
          })),
        ),
      },
    },
    include: {
      schedule: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
    },
  })

  try {
    await applyTournamentCourtBlocks(
      tournament.id,
      tenantId,
      tournament.title,
      tournament.schedule.map((s) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })),
    )
  } catch (err) {
    console.error('applyTournamentCourtBlocks failed (torneo ya creado):', err)
  }

  return {
    id: tournament.id,
    tenantId: tournament.tenantId,
    title: tournament.title,
    category: tournament.category,
    prizeFirst: tournament.prizeFirst,
    prizeSecond: tournament.prizeSecond,
    minPairs: tournament.minPairs,
    maxPairs: tournament.maxPairs,
    status: tournament.status,
    publishedAt: tournament.publishedAt,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
    dayBlocks: scheduleToDayBlocks(tournament.schedule),
  }
}

export async function updateTournament(
  tournamentId: string,
  tenantId: string,
  input: TournamentUpdateInput,
): Promise<TournamentWithSchedule | null> {
  const existing = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
    include: { schedule: true },
  })
  if (!existing) return null

  const updateData: Parameters<typeof prisma.tournament.update>[0]['data'] = {}
  if (input.title != null) updateData.title = input.title
  if (input.category != null) updateData.category = input.category
  if (input.prizeFirst != null) updateData.prizeFirst = input.prizeFirst
  if (input.prizeSecond != null) updateData.prizeSecond = input.prizeSecond
  if (input.minPairs != null) updateData.minPairs = input.minPairs
  if (input.maxPairs != null) updateData.maxPairs = input.maxPairs
  if (input.status != null) updateData.status = input.status
  if (input.publishedAt !== undefined) updateData.publishedAt = input.publishedAt

  if (input.dayBlocks != null && input.dayBlocks.length > 0) {
    await removeTournamentCourtBlocks(tournamentId)
    await prisma.tournamentSchedule.deleteMany({ where: { tournamentId } })
    await prisma.tournamentSchedule.createMany({
      data: input.dayBlocks.flatMap((block) =>
        block.ranges.map((r) => ({
          tournamentId,
          date: new Date(block.date + 'T00:00:00'),
          startTime: r.start,
          endTime: r.end,
        })),
      ),
    })
  }

  const tournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: updateData,
    include: {
      schedule: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
    },
  })

  if (input.dayBlocks != null && input.dayBlocks.length > 0) {
    await applyTournamentCourtBlocks(
      tournamentId,
      tenantId,
      tournament.title,
      tournament.schedule.map((s) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })),
    )
  }

  return {
    id: tournament.id,
    tenantId: tournament.tenantId,
    title: tournament.title,
    category: tournament.category,
    prizeFirst: tournament.prizeFirst,
    prizeSecond: tournament.prizeSecond,
    minPairs: tournament.minPairs,
    maxPairs: tournament.maxPairs,
    status: tournament.status,
    publishedAt: tournament.publishedAt,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
    dayBlocks: scheduleToDayBlocks(tournament.schedule),
  }
}

export async function deleteTournament(
  tournamentId: string,
  tenantId: string,
): Promise<boolean> {
  const t = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
  })
  if (!t) return false
  await prisma.tournamentMatch.deleteMany({ where: { tournamentId } })
  await prisma.courtBlock.deleteMany({ where: { tournamentId } })
  await prisma.tournamentSchedule.deleteMany({ where: { tournamentId } })
  await prisma.tournamentRegistration.deleteMany({ where: { tournamentId } })
  await prisma.tournament.delete({ where: { id: tournamentId } })
  return true
}

// --- Inscripciones ---
/** currentPairs = count(PAIR) + floor(count(SINGLE) / 2) */
function computeCurrentPairs(registrations: Array<{ type: string }>): number {
  const pairCount = registrations.filter((r) => r.type === 'PAIR').length
  const singleCount = registrations.filter((r) => r.type === 'SINGLE').length
  return pairCount + Math.floor(singleCount / 2)
}

export type RegistrationWithCupo = {
  list: Array<{
    id: string
    tournamentId: string
    type: string
    playerName: string
    playerEmail: string | null
    playerPhone: string | null
    partnerName: string | null
    partnerEmail: string | null
    partnerPhone: string | null
    status: string
    createdAt: Date
    updatedAt: Date
  }>
  currentPairs: number
  minPairs: number
  maxPairs: number
}

export async function getRegistrationsWithCupo(
  tournamentId: string,
  tenantId: string,
): Promise<RegistrationWithCupo | null> {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
    select: { minPairs: true, maxPairs: true },
  })
  if (!tournament) return null
  const list = await prisma.tournamentRegistration.findMany({
    where: { tournamentId },
    orderBy: { createdAt: 'asc' },
  })
  const currentPairs = computeCurrentPairs(list)
  return {
    list: list.map((r) => ({
      id: r.id,
      tournamentId: r.tournamentId,
      type: r.type,
      playerName: r.playerName,
      playerEmail: r.playerEmail,
      playerPhone: r.playerPhone,
      partnerName: r.partnerName,
      partnerEmail: r.partnerEmail,
      partnerPhone: r.partnerPhone,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    currentPairs,
    minPairs: tournament.minPairs,
    maxPairs: tournament.maxPairs,
  }
}

export async function createRegistration(
  tournamentId: string,
  tenantId: string,
  input: { type: 'SINGLE' | 'PAIR'; playerName: string; playerEmail?: string; playerPhone?: string; partnerName?: string; partnerEmail?: string; partnerPhone?: string },
): Promise<{ id: string } | { error: string }> {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
    select: { maxPairs: true },
  })
  if (!tournament) return { error: 'Torneo no encontrado' }
  const existing = await prisma.tournamentRegistration.findMany({
    where: { tournamentId },
    select: { type: true },
  })
  const pairContribution = input.type === 'PAIR' ? 1 : 0.5
  const newCurrent = computeCurrentPairs(existing) + pairContribution
  if (newCurrent > tournament.maxPairs) {
    return { error: 'Cupo completo. Se alcanzó el máximo de parejas.' }
  }
  const reg = await prisma.tournamentRegistration.create({
    data: {
      tournamentId,
      type: input.type,
      playerName: input.playerName,
      playerEmail: input.playerEmail || null,
      playerPhone: input.playerPhone || null,
      partnerName: input.type === 'PAIR' ? (input.partnerName || null) : null,
      partnerEmail: input.type === 'PAIR' ? (input.partnerEmail || null) : null,
      partnerPhone: input.type === 'PAIR' ? (input.partnerPhone || null) : null,
    },
  })
  return { id: reg.id }
}

export async function updateRegistration(
  tournamentId: string,
  registrationId: string,
  tenantId: string,
  input: { type?: 'SINGLE' | 'PAIR'; playerName?: string; playerEmail?: string; playerPhone?: string; partnerName?: string; partnerEmail?: string; partnerPhone?: string; status?: string },
): Promise<boolean> {
  const reg = await prisma.tournamentRegistration.findFirst({
    where: { id: registrationId, tournamentId },
  })
  if (!reg) return false
  const data: Record<string, unknown> = {}
  if (input.type != null) data.type = input.type
  if (input.playerName != null) data.playerName = input.playerName
  if (input.playerEmail !== undefined) data.playerEmail = input.playerEmail || null
  if (input.playerPhone !== undefined) data.playerPhone = input.playerPhone || null
  if (input.partnerName !== undefined) data.partnerName = input.partnerName || null
  if (input.partnerEmail !== undefined) data.partnerEmail = input.partnerEmail || null
  if (input.partnerPhone !== undefined) data.partnerPhone = input.partnerPhone || null
  if (input.status != null) data.status = input.status
  await prisma.tournamentRegistration.update({
    where: { id: registrationId },
    data,
  })
  return true
}

export async function deleteRegistration(
  tournamentId: string,
  registrationId: string,
  tenantId: string,
): Promise<boolean> {
  const reg = await prisma.tournamentRegistration.findFirst({
    where: { id: registrationId, tournamentId },
  })
  if (!reg) return false
  await prisma.tournamentRegistration.delete({ where: { id: registrationId } })
  return true
}

// --- Partidos (Fase 4) ---
function registrationDisplayName(r: { type: string; playerName: string; partnerName: string | null }): string {
  if (r.type === 'PAIR' && r.partnerName) {
    return `${r.playerName} / ${r.partnerName}`
  }
  return r.playerName
}

export type TournamentMatchWithDetails = {
  id: string
  tournamentId: string
  round: string
  positionInRound: number
  registration1Id: string | null
  registration2Id: string | null
  winnerRegistrationId: string | null
  score: string | null
  courtId: string | null
  scheduledAt: Date | null
  status: string
  createdAt: Date
  updatedAt: Date
  registration1Label: string | null
  registration2Label: string | null
  winnerLabel: string | null
}

export async function getMatchesByTournament(
  tournamentId: string,
  tenantId: string,
): Promise<TournamentMatchWithDetails[] | null> {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
    select: { id: true },
  })
  if (!tournament) return null

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    orderBy: [{ round: 'asc' }, { positionInRound: 'asc' }],
    include: {
      registration1: true,
      registration2: true,
      winner: true,
    },
  })

  return matches.map((m) => ({
    id: m.id,
    tournamentId: m.tournamentId,
    round: m.round,
    positionInRound: m.positionInRound,
    registration1Id: m.registration1Id,
    registration2Id: m.registration2Id,
    winnerRegistrationId: m.winnerRegistrationId,
    score: m.score,
    courtId: m.courtId,
    scheduledAt: m.scheduledAt,
    status: m.status,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    registration1Label: m.registration1 ? registrationDisplayName(m.registration1) : null,
    registration2Label: m.registration2 ? registrationDisplayName(m.registration2) : null,
    winnerLabel: m.winner ? registrationDisplayName(m.winner) : null,
  }))
}

export async function createMatch(
  tournamentId: string,
  tenantId: string,
  input: TournamentMatchCreateInput,
): Promise<TournamentMatchWithDetails | { error: string }> {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
    select: { id: true },
  })
  if (!tournament) return { error: 'Torneo no encontrado' }

  if (input.registration1Id) {
    const r1 = await prisma.tournamentRegistration.findFirst({
      where: { id: input.registration1Id, tournamentId },
    })
    if (!r1) return { error: 'Inscripción 1 no pertenece a este torneo' }
  }
  if (input.registration2Id) {
    const r2 = await prisma.tournamentRegistration.findFirst({
      where: { id: input.registration2Id, tournamentId },
    })
    if (!r2) return { error: 'Inscripción 2 no pertenece a este torneo' }
  }

  const match = await prisma.tournamentMatch.create({
    data: {
      tournamentId,
      round: input.round as 'ROUND_1' | 'ROUND_2' | 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL',
      positionInRound: input.positionInRound,
      registration1Id: input.registration1Id ?? undefined,
      registration2Id: input.registration2Id ?? undefined,
      courtId: input.courtId ?? undefined,
      scheduledAt: input.scheduledAt ?? undefined,
    },
    include: {
      registration1: true,
      registration2: true,
      winner: true,
    },
  })

  return {
    id: match.id,
    tournamentId: match.tournamentId,
    round: match.round,
    positionInRound: match.positionInRound,
    registration1Id: match.registration1Id,
    registration2Id: match.registration2Id,
    winnerRegistrationId: match.winnerRegistrationId,
    score: match.score,
    courtId: match.courtId,
    scheduledAt: match.scheduledAt,
    status: match.status,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    registration1Label: match.registration1 ? registrationDisplayName(match.registration1) : null,
    registration2Label: match.registration2 ? registrationDisplayName(match.registration2) : null,
    winnerLabel: match.winner ? registrationDisplayName(match.winner) : null,
  }
}

export async function getMatchById(
  tournamentId: string,
  matchId: string,
  tenantId: string,
): Promise<TournamentMatchWithDetails | null> {
  const match = await prisma.tournamentMatch.findFirst({
    where: { id: matchId, tournamentId },
    include: {
      tournament: { select: { tenantId: true } },
      registration1: true,
      registration2: true,
      winner: true,
    },
  })
  if (!match || match.tournament.tenantId !== tenantId) return null
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    round: match.round,
    positionInRound: match.positionInRound,
    registration1Id: match.registration1Id,
    registration2Id: match.registration2Id,
    winnerRegistrationId: match.winnerRegistrationId,
    score: match.score,
    courtId: match.courtId,
    scheduledAt: match.scheduledAt,
    status: match.status,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    registration1Label: match.registration1 ? registrationDisplayName(match.registration1) : null,
    registration2Label: match.registration2 ? registrationDisplayName(match.registration2) : null,
    winnerLabel: match.winner ? registrationDisplayName(match.winner) : null,
  }
}

export async function updateMatch(
  tournamentId: string,
  matchId: string,
  tenantId: string,
  input: TournamentMatchUpdateInput,
): Promise<TournamentMatchWithDetails | null> {
  const existing = await prisma.tournamentMatch.findFirst({
    where: { id: matchId, tournamentId },
    include: { tournament: { select: { tenantId: true } } },
  })
  if (!existing || existing.tournament.tenantId !== tenantId) return null

  if (input.registration1Id != null) {
    const r1 = await prisma.tournamentRegistration.findFirst({
      where: { id: input.registration1Id, tournamentId },
    })
    if (!r1) return null
  }
  if (input.registration2Id != null) {
    const r2 = await prisma.tournamentRegistration.findFirst({
      where: { id: input.registration2Id, tournamentId },
    })
    if (!r2) return null
  }
  if (input.winnerRegistrationId != null) {
    const wr = await prisma.tournamentRegistration.findFirst({
      where: { id: input.winnerRegistrationId, tournamentId },
    })
    if (!wr) return null
  }

  const data: Parameters<typeof prisma.tournamentMatch.update>[0]['data'] = {}
  if (input.round != null) data.round = input.round as 'ROUND_1' | 'ROUND_2' | 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL'
  if (input.positionInRound != null) data.positionInRound = input.positionInRound
  if (input.registration1Id !== undefined) data.registration1Id = input.registration1Id ?? null
  if (input.registration2Id !== undefined) data.registration2Id = input.registration2Id ?? null
  if (input.winnerRegistrationId !== undefined) data.winnerRegistrationId = input.winnerRegistrationId ?? null
  if (input.score !== undefined) data.score = input.score ?? null
  if (input.courtId !== undefined) data.courtId = input.courtId ?? null
  if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt ?? null
  if (input.status != null) data.status = input.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

  const match = await prisma.tournamentMatch.update({
    where: { id: matchId },
    data,
    include: {
      registration1: true,
      registration2: true,
      winner: true,
    },
  })

  return {
    id: match.id,
    tournamentId: match.tournamentId,
    round: match.round,
    positionInRound: match.positionInRound,
    registration1Id: match.registration1Id,
    registration2Id: match.registration2Id,
    winnerRegistrationId: match.winnerRegistrationId,
    score: match.score,
    courtId: match.courtId,
    scheduledAt: match.scheduledAt,
    status: match.status,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    registration1Label: match.registration1 ? registrationDisplayName(match.registration1) : null,
    registration2Label: match.registration2 ? registrationDisplayName(match.registration2) : null,
    winnerLabel: match.winner ? registrationDisplayName(match.winner) : null,
  }
}

export async function deleteMatch(
  tournamentId: string,
  matchId: string,
  tenantId: string,
): Promise<boolean> {
  const match = await prisma.tournamentMatch.findFirst({
    where: { id: matchId, tournamentId },
    include: { tournament: { select: { tenantId: true } } },
  })
  if (!match || match.tournament.tenantId !== tenantId) return false
  await prisma.tournamentMatch.delete({ where: { id: matchId } })
  return true
}
