/**
 * Integration tests for GET /api/bookings/user.
 * Verifies that the endpoint returns the user's bookings (including CONFIRMED)
 * and invokes cancelExpiredBookings for the session tenant.
 */

const mockAuth = jest.fn();
const mockGetUserBookings = jest.fn();
const mockCancelExpiredBookings = jest.fn();

jest.mock('../../../../../lib/auth', () => ({
  auth: (...args) => mockAuth(...args),
}));

jest.mock('../../../../../lib/services/bookings', () => ({
  getUserBookings: (...args) => mockGetUserBookings(...args),
}));

jest.mock('../../../../../lib/services/bookings/ExpiredBookingsService', () => ({
  ExpiredBookingsService: jest.fn().mockImplementation(() => ({
    cancelExpiredBookings: mockCancelExpiredBookings,
  })),
}));

const { GET } = require('../../../../../app/api/bookings/user/route');

describe('GET /api/bookings/user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCancelExpiredBookings.mockResolvedValue(0);
  });

  it('returns empty array when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockGetUserBookings).not.toHaveBeenCalled();
  });

  it('returns user bookings including CONFIRMED when authenticated', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'u@test.com', tenantId: 'tenant-1' },
      expires: '2026-12-31',
    });
    const confirmedBooking = {
      id: 'booking-1',
      userId: 'user-1',
      courtId: 'court-1',
      bookingDate: '2026-03-20T00:00:00.000Z',
      startTime: '10:00',
      endTime: '11:30',
      status: 'CONFIRMED',
      paymentStatus: 'DEPOSIT_PAID',
      court: { id: 'court-1', name: 'Cancha 1' },
      user: { id: 'user-1', name: 'User', email: 'u@test.com' },
      players: [],
      payments: [],
    };
    mockGetUserBookings.mockResolvedValue([confirmedBooking]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].status).toBe('CONFIRMED');
    expect(data[0].id).toBe('booking-1');
    expect(mockGetUserBookings).toHaveBeenCalledWith('user-1');
    expect(mockCancelExpiredBookings).toHaveBeenCalledWith('tenant-1');
  });

  it('calls cancelExpiredBookings when session has tenantId', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-2', email: 'u2@test.com', tenantId: 'tenant-2' },
      expires: '2026-12-31',
    });
    mockGetUserBookings.mockResolvedValue([]);

    await GET();

    expect(mockCancelExpiredBookings).toHaveBeenCalledWith('tenant-2');
  });

  it('returns bookings even when cancelExpiredBookings throws', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'u@test.com', tenantId: 'tenant-1' },
      expires: '2026-12-31',
    });
    mockCancelExpiredBookings.mockRejectedValue(new Error('DB error'));
    mockGetUserBookings.mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});
