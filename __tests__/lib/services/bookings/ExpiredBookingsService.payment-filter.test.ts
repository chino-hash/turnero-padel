/**
 * Unit tests for ExpiredBookingsService cancelExpiredBookings behavior:
 * - The findMany where clause must include payments: { none: {} } so that
 *   PENDING expired bookings that have at least one payment are NOT cancelled.
 * We test the where-clause builder (JS) used by the service contract.
 */

const { buildExpiredPendingWithoutPaymentsWhere } = require('../../../../lib/services/bookings/expired-bookings-where.js');

describe('ExpiredBookingsService cancelExpiredBookings (where clause contract)', () => {
  it('where clause includes payments: { none: {} } so bookings with payments are not cancelled', () => {
    const now = new Date();
    const where = buildExpiredPendingWithoutPaymentsWhere(now, 'tenant-1');

    expect(where.status).toBe('PENDING');
    expect(where.expiresAt).toEqual({ lt: now });
    expect(where.payments).toEqual({ none: {} });
    expect(where.tenantId).toBe('tenant-1');
  });

  it('when tenantId is null, where clause does not include tenantId', () => {
    const now = new Date();
    const where = buildExpiredPendingWithoutPaymentsWhere(now, null);

    expect(where.payments).toEqual({ none: {} });
    expect(where).not.toHaveProperty('tenantId');
  });
});
