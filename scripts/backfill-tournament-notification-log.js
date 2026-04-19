#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const shouldEnqueue = process.argv.includes('--enqueue')

function extractTournamentTitle(reason) {
  if (!reason) return 'Torneo'
  const match = reason.match(/Cancelado por torneo:\s*(.+?)\./i)
  return match?.[1]?.trim() || 'Torneo'
}

function toUtcDayStart(dateValue) {
  const date = new Date(dateValue)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

async function main() {
  const candidates = await prisma.booking.findMany({
    where: {
      status: 'CANCELLED',
      recurringId: { not: null },
      cancellationReason: { contains: 'Cancelado por torneo:' },
      user: { email: { not: null } },
    },
    select: {
      id: true,
      tenantId: true,
      recurringId: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      cancellationReason: true,
      user: { select: { email: true } },
      tenant: { select: { name: true } },
    },
  })

  console.log(`[backfill] Candidatos detectados: ${candidates.length}`)
  if (!shouldEnqueue) {
    console.log('[backfill] Modo dry-run. Use --enqueue para crear NotificationLog PENDING de casos faltantes.')
    return
  }

  let created = 0
  let skipped = 0
  const todayUtc = toUtcDayStart(new Date())

  for (const booking of candidates) {
    const bookingDateUtc = toUtcDayStart(booking.bookingDate)
    if (bookingDateUtc < todayUtc) {
      skipped += 1
      continue
    }

    const notificationKey = `tournament:backfill:booking:${booking.id}:TOURNAMENT_FIXED_BOOKING_CANCELLED`
    const existing = await prisma.notificationLog.findUnique({
      where: { notificationKey },
      select: { id: true },
    })
    if (existing) {
      skipped += 1
      continue
    }

    await prisma.notificationLog.create({
      data: {
        tenantId: booking.tenantId,
        bookingId: booking.id,
        recurringId: booking.recurringId,
        date: bookingDateUtc,
        type: 'TOURNAMENT_FIXED_BOOKING_CANCELLED',
        channel: 'EMAIL',
        status: 'PENDING',
        recipientEmail: booking.user.email,
        payload: JSON.stringify({
          clubName: booking.tenant?.name || 'Club',
          tournamentTitle: extractTournamentTitle(booking.cancellationReason),
          date: bookingDateUtc.toISOString().slice(0, 10),
          startTime: booking.startTime,
          endTime: booking.endTime,
          source: 'backfill',
        }),
        notificationKey,
      },
    })
    created += 1
  }

  console.log(`[backfill] NotificationLog creados: ${created}`)
  console.log(`[backfill] Casos omitidos: ${skipped}`)
}

main()
  .catch((error) => {
    console.error('[backfill] Error:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
