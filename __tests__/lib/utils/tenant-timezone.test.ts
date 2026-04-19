const { formatDateForTenant, toDateKey, toUtcDayStart } = require('../../../lib/utils/tenant-timezone')

describe('tenant-timezone utils', () => {
  it('normaliza a inicio de día UTC', () => {
    const date = new Date('2026-04-17T18:45:10.000Z')
    const normalized = toUtcDayStart(date)

    expect(normalized.toISOString()).toBe('2026-04-17T00:00:00.000Z')
    expect(toDateKey(date)).toBe('2026-04-17')
  })

  it('formatea fecha en timezone configurable', () => {
    const date = new Date('2026-04-17T00:00:00.000Z')
    const formatted = formatDateForTenant(date, 'America/Argentina/Buenos_Aires')

    expect(formatted).toMatch(/16\/04\/2026|17\/04\/2026/)
  })
})
