const { buildTournamentCancellationKey } = require('../../../lib/services/notifications/TournamentCancellationNotificationService')

describe('TournamentCancellationNotificationService', () => {
  it('genera clave estable por booking', () => {
    const keyA = buildTournamentCancellationKey({
      tenantId: 't1',
      tournamentId: 'torneo-1',
      tournamentTitle: 'Open',
      clubName: 'Club 1',
      date: new Date('2026-04-17T00:00:00.000Z'),
      startTime: '20:00',
      endTime: '21:30',
      recipientEmail: 'player@example.com',
      bookingId: 'booking-1',
      recurringId: 'rec-1',
    })

    const keyB = buildTournamentCancellationKey({
      tenantId: 't1',
      tournamentId: 'torneo-1',
      tournamentTitle: 'Open',
      clubName: 'Club 1',
      date: new Date('2026-04-17T00:00:00.000Z'),
      startTime: '20:00',
      endTime: '21:30',
      recipientEmail: 'player@example.com',
      bookingId: 'booking-1',
      recurringId: 'rec-1',
    })

    expect(keyA).toBe(keyB)
  })

  it('genera clave estable por recurring/date sin booking', () => {
    const keyA = buildTournamentCancellationKey({
      tenantId: 't1',
      tournamentId: 'torneo-1',
      tournamentTitle: 'Open',
      clubName: 'Club 1',
      date: new Date('2026-04-17T10:00:00.000Z'),
      startTime: '20:00',
      endTime: '21:30',
      recipientEmail: 'player@example.com',
      recurringId: 'rec-1',
    })

    const keyB = buildTournamentCancellationKey({
      tenantId: 't1',
      tournamentId: 'torneo-1',
      tournamentTitle: 'Open',
      clubName: 'Club 1',
      date: new Date('2026-04-17T20:00:00.000Z'),
      startTime: '21:00',
      endTime: '22:30',
      recipientEmail: 'player@example.com',
      recurringId: 'rec-1',
    })

    expect(keyA).toBe(keyB)
  })
})
