import { prisma } from '../database/neon-config'
import type {
  TournamentCreateInput,
  TournamentUpdateInput,
  TournamentMatchCreateInput,
  TournamentMatchUpdateInput,
} from '../validations/tournament'
import type { TournamentStatus } from '@prisma/client'
import { queueAndSendTournamentCancellationNotification } from './notifications/TournamentCancellationNotificationService'
import { toUtcDayStart } from '@/lib/utils/tenant-timezone'

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
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  })

  const courts = await prisma.court.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true },
  })
  const courtIds = courts.map((c) => c.id)
  if (courtIds.length === 0) return

  const cancellationReason = `Cancelado por torneo: ${title}. Contacte al club si tiene dudas.`

  for (const row of schedule) {
    let emailsScheduled = 0
    let emailsAttempted = 0
    const dateOnly = row.date instanceof Date ? row.date : new Date(row.date)
    const dayStart = toUtcDayStart(dateOnly)
    const weekday = dayStart.getUTCDay()
    const pendingNotifications: Array<{
      date: Date
      startTime: string
      endTime: string
      recipientEmail: string
      bookingId?: string
      recurringId?: string
    }> = []

    await prisma.$transaction(async (tx) => {
      const overlapping = await tx.booking.findMany({
        where: {
          tenantId,
          courtId: { in: courtIds },
          bookingDate: dayStart,
          status: { not: 'CANCELLED' },
          startTime: { lt: row.endTime },
          endTime: { gt: row.startTime },
        },
        select: {
          id: true,
          recurringId: true,
          bookingDate: true,
          startTime: true,
          endTime: true,
          user: { select: { email: true } },
        },
      })

      const recurringRules = await tx.recurringBooking.findMany({
        where: {
          tenantId,
          courtId: { in: courtIds },
          status: 'ACTIVE',
          weekday,
          startsAt: { lte: dayStart },
          OR: [{ endsAt: null }, { endsAt: { gte: dayStart } }],
          startTime: { lt: row.endTime },
          endTime: { gt: row.startTime },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          user: { select: { email: true } },
        },
      })

      for (const booking of overlapping) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason,
          },
        })

        if (booking.recurringId) {
          await tx.recurringBookingException.upsert({
            where: {
              recurringId_date: {
                recurringId: booking.recurringId,
                date: dayStart,
              },
            },
            create: {
              recurringId: booking.recurringId,
              date: dayStart,
              type: 'SKIP',
              reason: cancellationReason,
            },
            update: {
              type: 'SKIP',
              reason: cancellationReason,
            },
          })
        }

        const recipientEmail = booking.user?.email?.trim().toLowerCase()
        if (recipientEmail) {
          pendingNotifications.push({
            date: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            recipientEmail,
            bookingId: booking.id,
            recurringId: booking.recurringId || undefined,
          })
        }
      }

      const recurringIdsWithBooking = new Set(
        overlapping
          .map((booking) => booking.recurringId)
          .filter((recurringId): recurringId is string => Boolean(recurringId))
      )

      for (const recurring of recurringRules) {
        if (recurringIdsWithBooking.has(recurring.id)) continue

        await tx.recurringBookingException.upsert({
          where: {
            recurringId_date: {
              recurringId: recurring.id,
              date: dayStart,
            },
          },
          create: {
            recurringId: recurring.id,
            date: dayStart,
            type: 'SKIP',
            reason: cancellationReason,
          },
          update: {
            type: 'SKIP',
            reason: cancellationReason,
          },
        })

        const recipientEmail = recurring.user?.email?.trim().toLowerCase()
        if (recipientEmail) {
          pendingNotifications.push({
            date: dayStart,
            startTime: recurring.startTime,
            endTime: recurring.endTime,
            recipientEmail,
            recurringId: recurring.id,
          })
        }
      }

      await tx.courtBlock.createMany({
        data: courtIds.map((courtId) => ({
          tenantId,
          courtId,
          tournamentId,
          date: dayStart,
          startTime: row.startTime,
          endTime: row.endTime,
        })),
        skipDuplicates: true,
      })
    })

    for (const payload of pendingNotifications) {
      emailsScheduled += 1
      await queueAndSendTournamentCancellationNotification({
        tenantId,
        tournamentId,
        tournamentTitle: title,
        clubName: tenant?.name || 'Club',
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
        recipientEmail: payload.recipientEmail,
        bookingId: payload.bookingId,
        recurringId: payload.recurringId,
      })
      emailsAttempted += 1
    }

    console.info('[TournamentNotifications] processed schedule row', {
      tournamentId,
      tenantId,
      date: dayStart.toISOString().slice(0, 10),
      emailsScheduled,
      emailsAttempted,
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
  tournamentFormat: string
  prizeIsMonetary: boolean
  prizeFirst: number
  prizeSecond: number
  prizeFirstDescription: string | null
  prizeSecondDescription: string | null
  minPairs: number
  maxPairs: number
  numberOfGroups: number | null
  prizeGoldFirst: number | null
  prizeGoldSecond: number | null
  prizeSilverFirst: number | null
  prizeSilverSecond: number | null
  prizeGoldFirstDescription: string | null
  prizeGoldSecondDescription: string | null
  prizeSilverFirstDescription: string | null
  prizeSilverSecondDescription: string | null
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

function toTournamentWithSchedule(
  t: {
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
    schedule: Array<{ date: Date; startTime: string; endTime: string }>
  } & Record<string, unknown>,
): TournamentWithSchedule {
  return {
    id: t.id,
    tenantId: t.tenantId,
    title: t.title,
    category: t.category,
    tournamentFormat: (t.tournamentFormat as string) ?? 'DIRECT_ELIMINATION',
    prizeIsMonetary: t.prizeIsMonetary !== false,
    prizeFirst: t.prizeFirst,
    prizeSecond: t.prizeSecond,
    prizeFirstDescription: (t.prizeFirstDescription as string | null) ?? null,
    prizeSecondDescription: (t.prizeSecondDescription as string | null) ?? null,
    minPairs: t.minPairs,
    maxPairs: t.maxPairs,
    numberOfGroups: (t.numberOfGroups as number | null) ?? null,
    prizeGoldFirst: (t.prizeGoldFirst as number | null) ?? null,
    prizeGoldSecond: (t.prizeGoldSecond as number | null) ?? null,
    prizeSilverFirst: (t.prizeSilverFirst as number | null) ?? null,
    prizeSilverSecond: (t.prizeSilverSecond as number | null) ?? null,
    prizeGoldFirstDescription: (t.prizeGoldFirstDescription as string | null) ?? null,
    prizeGoldSecondDescription: (t.prizeGoldSecondDescription as string | null) ?? null,
    prizeSilverFirstDescription: (t.prizeSilverFirstDescription as string | null) ?? null,
    prizeSilverSecondDescription: (t.prizeSilverSecondDescription as string | null) ?? null,
    status: t.status,
    publishedAt: t.publishedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    dayBlocks: scheduleToDayBlocks(t.schedule),
  }
}

export async function getTournamentsByTenant(tenantId: string): Promise<TournamentWithSchedule[]> {
  const list = await prisma.tournament.findMany({
    where: { tenantId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      schedule: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
    },
  })
  return list.map((t) => toTournamentWithSchedule(t))
}

/** Torneos con inscripciones abiertas para listado público. Opcionalmente filtrados por tenantId. */
export async function getPublicTournaments(tenantId?: string): Promise<TournamentWithSchedule[]> {
  const list = await prisma.tournament.findMany({
    where: {
      status: 'OPEN_REGISTRATION',
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      schedule: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
    },
  })
  return list.map((t) => toTournamentWithSchedule(t))
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
  return toTournamentWithSchedule(t)
}

export async function createTournament(
  tenantId: string,
  input: TournamentCreateInput,
): Promise<TournamentWithSchedule> {
  const scheduleCreate = input.dayBlocks.flatMap((block) =>
    block.ranges.map((r) => ({
      date: new Date(block.date + 'T00:00:00'),
      startTime: r.start,
      endTime: r.end,
    })),
  )
  const tournament = await prisma.tournament.create({
    data: {
      tenantId,
      title: input.title,
      category: input.category,
      tournamentFormat: (input.tournamentFormat ?? 'DIRECT_ELIMINATION') as 'DIRECT_ELIMINATION' | 'GROUPS_DOUBLE_ELIMINATION',
      prizeIsMonetary: input.prizeIsMonetary !== false,
      prizeFirst: input.prizeFirst,
      prizeSecond: input.prizeSecond,
      prizeFirstDescription: input.prizeFirstDescription ?? null,
      prizeSecondDescription: input.prizeSecondDescription ?? null,
      numberOfGroups: input.numberOfGroups ?? null,
      prizeGoldFirst: input.prizeGoldFirst ?? null,
      prizeGoldSecond: input.prizeGoldSecond ?? null,
      prizeSilverFirst: input.prizeSilverFirst ?? null,
      prizeSilverSecond: input.prizeSilverSecond ?? null,
      prizeGoldFirstDescription: input.prizeGoldFirstDescription ?? null,
      prizeGoldSecondDescription: input.prizeGoldSecondDescription ?? null,
      prizeSilverFirstDescription: input.prizeSilverFirstDescription ?? null,
      prizeSilverSecondDescription: input.prizeSilverSecondDescription ?? null,
      minPairs: input.minPairs,
      maxPairs: input.maxPairs,
      status: 'DRAFT',
      schedule: { create: scheduleCreate },
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

  return toTournamentWithSchedule(tournament)
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
  if (input.tournamentFormat != null) updateData.tournamentFormat = input.tournamentFormat as 'DIRECT_ELIMINATION' | 'GROUPS_DOUBLE_ELIMINATION'
  if (input.prizeIsMonetary !== undefined) updateData.prizeIsMonetary = input.prizeIsMonetary
  if (input.prizeFirst != null) updateData.prizeFirst = input.prizeFirst
  if (input.prizeSecond != null) updateData.prizeSecond = input.prizeSecond
  if (input.prizeFirstDescription !== undefined) updateData.prizeFirstDescription = input.prizeFirstDescription ?? null
  if (input.prizeSecondDescription !== undefined) updateData.prizeSecondDescription = input.prizeSecondDescription ?? null
  if (input.numberOfGroups !== undefined) updateData.numberOfGroups = input.numberOfGroups
  if (input.prizeGoldFirst !== undefined) updateData.prizeGoldFirst = input.prizeGoldFirst
  if (input.prizeGoldSecond !== undefined) updateData.prizeGoldSecond = input.prizeGoldSecond
  if (input.prizeSilverFirst !== undefined) updateData.prizeSilverFirst = input.prizeSilverFirst
  if (input.prizeSilverSecond !== undefined) updateData.prizeSilverSecond = input.prizeSilverSecond
  if (input.prizeGoldFirstDescription !== undefined) updateData.prizeGoldFirstDescription = input.prizeGoldFirstDescription
  if (input.prizeGoldSecondDescription !== undefined) updateData.prizeGoldSecondDescription = input.prizeGoldSecondDescription
  if (input.prizeSilverFirstDescription !== undefined) updateData.prizeSilverFirstDescription = input.prizeSilverFirstDescription
  if (input.prizeSilverSecondDescription !== undefined) updateData.prizeSilverSecondDescription = input.prizeSilverSecondDescription
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

  return toTournamentWithSchedule(tournament)
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

// --- Sorteo (Fase 4) ---
function nextPowerOf2(n: number): number {
  if (n <= 1) return 1
  let p = 1
  while (p < n) p *= 2
  return p
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export type RunSorteoResult =
  | { ok: true; matchesCreated: number }
  | { ok: false; error: string }

/** Genera el fixture (partidos) por sorteo aleatorio. Solo eliminatoria directa por ahora. */
export async function runSorteo(
  tournamentId: string,
  tenantId: string,
  _options?: { numberOfGroups?: number },
): Promise<RunSorteoResult> {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, tenantId },
    select: {
      id: true,
      tournamentFormat: true,
      minPairs: true,
      numberOfGroups: true,
    },
  })
  if (!tournament) return { ok: false, error: 'Torneo no encontrado' }

  const existingMatches = await prisma.tournamentMatch.count({
    where: { tournamentId },
  })
  if (existingMatches > 0) {
    return { ok: false, error: 'Ya se realizó el sorteo para este torneo. No se puede regenerar.' }
  }

  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, status: { not: 'CANCELLED' } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, type: true },
  })
  const currentPairs = computeCurrentPairs(registrations)
  if (currentPairs < tournament.minPairs) {
    return {
      ok: false,
      error: `Se necesitan al menos ${tournament.minPairs} parejas. Hay ${currentPairs} inscritas.`,
    }
  }

  const format = (tournament.tournamentFormat as string) ?? 'DIRECT_ELIMINATION'
  if (format === 'GROUPS_DOUBLE_ELIMINATION') {
    return runSorteoGroupsDoubleElimination(tournamentId, registrations, tournament.numberOfGroups ?? 4)
  }

  return runSorteoDirectElimination(tournamentId, registrations)
}

async function runSorteoDirectElimination(
  tournamentId: string,
  registrations: Array<{ id: string; type: string }>,
): Promise<RunSorteoResult> {
  const pairIds = registrations.filter((r) => r.type === 'PAIR').map((r) => r.id)
  if (pairIds.length < 2) {
    return { ok: false, error: 'Se necesitan al menos 2 parejas (inscripciones tipo Pareja) para el sorteo.' }
  }
  const shuffled = shuffle(pairIds)
  const slots = nextPowerOf2(shuffled.length)
  const slotArray: (string | null)[] = [...shuffled, ...Array(slots - shuffled.length).fill(null)]

  const numFirstRoundMatches = slots / 2
  const roundNames: Array<'ROUND_1' | 'ROUND_2' | 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL'> =
    numFirstRoundMatches >= 4 ? ['QUARTERFINAL', 'SEMIFINAL', 'FINAL'] : numFirstRoundMatches === 2 ? ['SEMIFINAL', 'FINAL'] : ['FINAL']

  const rounds: Array<{ round: 'ROUND_1' | 'ROUND_2' | 'QUARTERFINAL' | 'SEMIFINAL' | 'FINAL'; positions: Array<[string | null, string | null]> }> = []
  rounds.push({
    round: roundNames[0],
    positions: Array.from({ length: numFirstRoundMatches }, (_, i) => [
      slotArray[2 * i] ?? null,
      slotArray[2 * i + 1] ?? null,
    ]),
  })
  for (let r = 1; r < roundNames.length; r++) {
    const numMatches = numFirstRoundMatches / Math.pow(2, r)
    rounds.push({
      round: roundNames[r],
      positions: Array.from({ length: numMatches }, () => [null, null] as [string | null, string | null]),
    })
  }

  let created = 0
  for (const { round, positions } of rounds) {
    for (let pos = 0; pos < positions.length; pos++) {
      const [r1, r2] = positions[pos]
      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          round,
          positionInRound: pos,
          registration1Id: r1,
          registration2Id: r2,
        },
      })
      created++
    }
  }
  return { ok: true, matchesCreated: created }
}

async function runSorteoGroupsDoubleElimination(
  tournamentId: string,
  registrations: Array<{ id: string; type: string }>,
  numberOfGroups: number,
): Promise<RunSorteoResult> {
  const pairIds = registrations.filter((r) => r.type === 'PAIR').map((r) => r.id)
  if (pairIds.length < 2) {
    return { ok: false, error: 'Se necesitan al menos 2 parejas para la fase de grupos.' }
  }
  const shuffled = shuffle(pairIds)
  const groups = new Map<string, string[]>()
  for (let g = 0; g < numberOfGroups; g++) {
    groups.set(String(g + 1), [])
  }
  shuffled.forEach((id, i) => {
    const g = (i % numberOfGroups) + 1
    groups.get(String(g))!.push(id)
  })

  let totalCreated = 0
  for (const [groupId, pairIdsInGroup] of groups) {
    if (pairIdsInGroup.length < 2) continue
    let posInRound = 0
    for (let i = 0; i < pairIdsInGroup.length; i++) {
      for (let j = i + 1; j < pairIdsInGroup.length; j++) {
        await prisma.tournamentMatch.create({
          data: {
            tournamentId,
            round: 'ROUND_1',
            positionInRound: posInRound,
            groupId,
            bracketType: 'GROUP',
            registration1Id: pairIdsInGroup[i],
            registration2Id: pairIdsInGroup[j],
          },
        })
        posInRound++
        totalCreated++
      }
    }
  }
  return { ok: true, matchesCreated: totalCreated }
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
  groupId: string | null
  bracketType: string | null
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
    groupId: (m as { groupId?: string | null }).groupId ?? null,
    bracketType: (m as { bracketType?: string | null }).bracketType ?? null,
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
    groupId: match.groupId ?? null,
    bracketType: match.bracketType ?? null,
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
    groupId: match.groupId ?? null,
    bracketType: match.bracketType ?? null,
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
    groupId: match.groupId ?? null,
    bracketType: match.bracketType ?? null,
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
