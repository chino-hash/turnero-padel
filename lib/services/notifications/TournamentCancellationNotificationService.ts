import { prisma } from '@/lib/database/neon-config'
import { getNotificationConfig } from '@/lib/config/env'
import {
  sendRecurringCancelledByTournamentEmail,
  type TournamentCancellationEmailPayload,
} from '@/lib/services/notifications/EmailNotificationService'
import { toDateKey, toUtcDayStart } from '@/lib/utils/tenant-timezone'

const NOTIFICATION_TYPE = 'TOURNAMENT_FIXED_BOOKING_CANCELLED'
const MAX_EMAIL_ATTEMPTS = 3

export interface TournamentCancellationNotificationInput {
  tenantId: string
  tournamentId: string
  tournamentTitle: string
  clubName: string
  date: Date
  startTime: string
  endTime: string
  recipientEmail: string
  bookingId?: string
  recurringId?: string
  timezone?: string
}

export function buildTournamentCancellationKey(input: TournamentCancellationNotificationInput): string {
  if (input.bookingId) {
    return `tournament:${input.tournamentId}:booking:${input.bookingId}:${NOTIFICATION_TYPE}`
  }
  const dateKey = toDateKey(input.date)
  return `tournament:${input.tournamentId}:recurring:${input.recurringId || 'none'}:${dateKey}:${NOTIFICATION_TYPE}`
}

async function sendWithRetries(payload: TournamentCancellationEmailPayload, previousAttempts: number) {
  let attemptsUsed = 0
  let lastError: string | undefined
  const remaining = Math.max(0, MAX_EMAIL_ATTEMPTS - previousAttempts)

  for (let i = 0; i < remaining; i++) {
    attemptsUsed += 1
    const result = await sendRecurringCancelledByTournamentEmail(payload)
    if (result.success) {
      return { success: true as const, attemptsUsed, subject: result.subject }
    }
    lastError = result.error || 'No se pudo enviar el correo'
  }

  return { success: false as const, attemptsUsed, error: lastError || 'Sin detalles de error' }
}

export async function queueAndSendTournamentCancellationNotification(
  input: TournamentCancellationNotificationInput
): Promise<void> {
  const notificationsConfig = getNotificationConfig()
  if (!notificationsConfig.email.tournamentEnabled) {
    return
  }

  const notificationKey = buildTournamentCancellationKey(input)
  const dateUtc = toUtcDayStart(input.date)
  const existing = await prisma.notificationLog.findUnique({
    where: { notificationKey },
    select: { status: true },
  })
  if (existing?.status === 'SENT') {
    return
  }

  const log = await prisma.notificationLog.upsert({
    where: { notificationKey },
    create: {
      tenantId: input.tenantId,
      bookingId: input.bookingId,
      recurringId: input.recurringId,
      tournamentId: input.tournamentId,
      date: dateUtc,
      type: NOTIFICATION_TYPE,
      channel: 'EMAIL',
      status: 'PENDING',
      recipientEmail: input.recipientEmail,
      payload: JSON.stringify({
        clubName: input.clubName,
        tournamentTitle: input.tournamentTitle,
        date: toDateKey(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
      }),
      notificationKey,
    },
    update: {
      tenantId: input.tenantId,
      bookingId: input.bookingId,
      recurringId: input.recurringId,
      tournamentId: input.tournamentId,
      date: dateUtc,
      recipientEmail: input.recipientEmail,
      type: NOTIFICATION_TYPE,
      channel: 'EMAIL',
      payload: JSON.stringify({
        clubName: input.clubName,
        tournamentTitle: input.tournamentTitle,
        date: toDateKey(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
      }),
    },
  })

  const claim = await prisma.notificationLog.updateMany({
    where: {
      id: log.id,
      status: { in: ['PENDING', 'FAILED'] },
    },
    data: { status: 'PROCESSING' },
  })
  if (claim.count === 0) {
    return
  }

  const delivery = await sendWithRetries(
    {
      to: input.recipientEmail,
      clubName: input.clubName,
      tournamentTitle: input.tournamentTitle,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      timezone: input.timezone,
    },
    log.attempts
  )

  if (delivery.success) {
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: 'SENT',
        subject: delivery.subject,
        attempts: log.attempts + delivery.attemptsUsed,
        sentAt: new Date(),
        error: null,
      },
    })
    return
  }

  await prisma.notificationLog.update({
    where: { id: log.id },
    data: {
      status: 'FAILED',
      attempts: log.attempts + delivery.attemptsUsed,
      error: delivery.error,
    },
  })
}

export async function retryFailedTournamentCancellationNotifications(limit = 50): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const notificationsConfig = getNotificationConfig()
  if (!notificationsConfig.email.tournamentEnabled) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  const items = await prisma.notificationLog.findMany({
    where: {
      type: NOTIFICATION_TYPE,
      status: { in: ['PENDING', 'FAILED'] },
      attempts: { lt: MAX_EMAIL_ATTEMPTS },
      recipientEmail: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  let sent = 0
  let failed = 0

  for (const item of items) {
    const claim = await prisma.notificationLog.updateMany({
      where: {
        id: item.id,
        status: { in: ['PENDING', 'FAILED'] },
      },
      data: { status: 'PROCESSING' },
    })
    if (claim.count === 0) {
      continue
    }

    let payloadRaw: Record<string, unknown> = {}
    if (item.payload) {
      try {
        payloadRaw = JSON.parse(item.payload) as Record<string, unknown>
      } catch {
        payloadRaw = {}
      }
    }
    const delivery = await sendWithRetries(
      {
        to: item.recipientEmail!,
        clubName: typeof payloadRaw.clubName === 'string' ? payloadRaw.clubName : 'Club',
        tournamentTitle: typeof payloadRaw.tournamentTitle === 'string' ? payloadRaw.tournamentTitle : 'Torneo',
        date: item.date || new Date(),
        startTime: typeof payloadRaw.startTime === 'string' ? payloadRaw.startTime : '00:00',
        endTime: typeof payloadRaw.endTime === 'string' ? payloadRaw.endTime : '00:00',
        timezone: typeof payloadRaw.timezone === 'string' ? payloadRaw.timezone : undefined,
      },
      item.attempts
    )

    if (delivery.success) {
      sent += 1
      await prisma.notificationLog.update({
        where: { id: item.id },
        data: {
          status: 'SENT',
          subject: delivery.subject,
          attempts: item.attempts + delivery.attemptsUsed,
          sentAt: new Date(),
          error: null,
        },
      })
      continue
    }

    failed += 1
    await prisma.notificationLog.update({
      where: { id: item.id },
      data: {
        status: 'FAILED',
        attempts: item.attempts + delivery.attemptsUsed,
        error: delivery.error,
      },
    })
  }

  return {
    processed: items.length,
    sent,
    failed,
  }
}
