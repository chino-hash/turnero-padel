/// <reference types="@types/jest" />

jest.mock('../../../../lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('../../../../lib/utils/permissions', () => ({
  getUserTenantIdSafe: jest.fn(),
}))

const mockPrisma = {
  booking: {
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  court: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  payment: {
    aggregate: jest.fn(),
  },
}

jest.mock('../../../../lib/database/neon-config', () => ({
  prisma: mockPrisma,
}))

import { GET } from '../../../../app/api/estadisticas/route'
import { auth } from '../../../../lib/auth'
import { getUserTenantIdSafe } from '../../../../lib/utils/permissions'
import { NextRequest } from 'next/server'

const mockAuth = jest.mocked(auth)
const mockGetUserTenantIdSafe = jest.mocked(getUserTenantIdSafe)

describe('GET /api/estadisticas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const adminSession = {
    user: {
      id: 'user-1',
      email: 'admin@tenant.com',
      role: 'ADMIN',
      isAdmin: true,
      isSuperAdmin: false,
      tenantId: 'tenant-1',
    },
    expires: '',
  }

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/estadisticas')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toBeDefined()
  })

  it('returns 401 when user is not admin', async () => {
    mockAuth.mockResolvedValue({
      ...adminSession,
      user: { ...adminSession.user, isAdmin: false },
    })
    const req = new NextRequest('http://localhost/api/estadisticas')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when tenantId cannot be resolved', async () => {
    mockAuth.mockResolvedValue(adminSession)
    mockGetUserTenantIdSafe.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/estadisticas')
    const res = await GET(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when period is invalid', async () => {
    mockAuth.mockResolvedValue(adminSession)
    mockGetUserTenantIdSafe.mockResolvedValue('tenant-1')
    const req = new NextRequest(
      'http://localhost/api/estadisticas?period=invalid'
    )
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 200 and data scoped by tenant when admin has tenantId', async () => {
    mockAuth.mockResolvedValue(adminSession)
    mockGetUserTenantIdSafe.mockResolvedValue('tenant-1')

    mockPrisma.booking.count.mockResolvedValue(5)
    mockPrisma.booking.aggregate.mockResolvedValue({
      _sum: { totalPrice: 1000, amount: 500 },
      _count: { id: 10 },
    })
    mockPrisma.booking.groupBy.mockResolvedValue([
      { bookingDate: new Date(), startTime: '10:00', _count: { id: 2 } },
      { bookingDate: new Date(), _sum: { totalPrice: 200 } },
    ])
    mockPrisma.court.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Cancha 1',
        _count: { bookings: 10 },
      },
    ])
    mockPrisma.court.count.mockResolvedValue(2)
    mockPrisma.user.count.mockResolvedValue(3)
    mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 500 } })

    const req = new NextRequest('http://localhost/api/estadisticas?period=mes')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.message).toBeDefined()
    expect(body.data).toBeDefined()
    expect(body.data.period).toBe('mes')
    expect(body.data.reservasCount).toBeDefined()
    expect(body.data.financiero).toBeDefined()
    expect(typeof body.data.financiero.totalReservas).toBe('number')
    expect(body.data.evolucionReservas).toBeInstanceOf(Array)
    expect(body.data.evolucionIngresos).toBeInstanceOf(Array)
    expect(body.data.canchasMasUsadas).toBeInstanceOf(Array)
    expect(body.data.horariosPico).toBeInstanceOf(Array)

    expect(mockPrisma.booking.count).toHaveBeenCalled()
    const bookingCountCalls = mockPrisma.booking.count.mock.calls
    expect(bookingCountCalls.length).toBeGreaterThan(0)
    expect(bookingCountCalls[0][0].where.tenantId).toBe('tenant-1')
  })
})
