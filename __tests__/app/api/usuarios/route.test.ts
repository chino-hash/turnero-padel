/// <reference types="@types/jest" />

import { NextRequest } from 'next/server'
import { GET } from '../../../../../app/api/usuarios/route'
import { auth } from '../../../../../lib/auth'
import { getUserTenantIdSafe, isSuperAdminUser } from '../../../../../lib/utils/permissions'
import { getUmbralesCategoria, getCategoriaFromReservas } from '../../../../../lib/services/categorias-usuario'

jest.mock('../../../../../lib/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('../../../../../lib/utils/permissions', () => ({
  getUserTenantIdSafe: jest.fn(),
  isSuperAdminUser: jest.fn(),
}))

jest.mock('../../../../../lib/tenant/context', () => ({
  getTenantFromSlug: jest.fn(),
}))

jest.mock('../../../../../lib/services/categorias-usuario', () => ({
  getUmbralesCategoria: jest.fn(),
  getCategoriaFromReservas: jest.fn(),
}))

const mockPrisma = {
  user: {
    findMany: jest.fn(),
  },
}

jest.mock('../../../../../lib/database/neon-config', () => ({
  prisma: mockPrisma,
}))

const mockAuth = jest.mocked(auth)
const mockGetUserTenantIdSafe = jest.mocked(getUserTenantIdSafe)
const mockIsSuperAdminUser = jest.mocked(isSuperAdminUser)
const mockGetUmbralesCategoria = jest.mocked(getUmbralesCategoria)
const mockGetCategoriaFromReservas = jest.mocked(getCategoriaFromReservas)

describe('GET /api/usuarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('retorna 401 cuando no hay sesión', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/usuarios')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('retorna listado sin campo discountPercent', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@club.com',
      },
      expires: '',
    })
    mockIsSuperAdminUser.mockResolvedValue(false)
    mockGetUserTenantIdSafe.mockResolvedValue('tenant-1')
    mockGetUmbralesCategoria.mockResolvedValue({ vipMinReservas: 20, premiumMinReservas: 10 })
    mockGetCategoriaFromReservas.mockReturnValue('Premium')

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'u-1',
        name: 'Maria',
        fullName: null,
        email: 'maria@club.com',
        phone: null,
        role: 'USER',
        isActive: true,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        _count: { bookings: 11 },
        bookings: [{ bookingDate: new Date('2026-04-10T00:00:00.000Z') }],
      },
    ])

    const req = new NextRequest('http://localhost/api/usuarios?page=1&limit=10')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({
      id: 'u-1',
      email: 'maria@club.com',
      categoria: 'Premium',
      reservas: 11,
    })
    expect(body.data[0]).not.toHaveProperty('discountPercent')
  })
})
