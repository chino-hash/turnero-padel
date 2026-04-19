/// <reference types="@types/jest" />

import { NextRequest } from 'next/server'
import { GET } from '../../../../../app/api/usuarios/analisis/route'
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
    count: jest.fn(),
    findMany: jest.fn(),
  },
  booking: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
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

describe('GET /api/usuarios/analisis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('retorna 401 cuando no hay sesión', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/usuarios/analisis')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('retorna análisis sin campo descuento en clientes frecuentes', async () => {
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
    mockGetCategoriaFromReservas.mockReturnValue('VIP')

    mockPrisma.user.count
      .mockResolvedValueOnce(20) // totalUsuarios
      .mockResolvedValueOnce(12) // usuariosActivos
      .mockResolvedValueOnce(4) // nuevosEsteMes
      .mockResolvedValueOnce(10) // usuariosConReservas60d
      .mockResolvedValueOnce(15) // usuariosConReservas90d
      .mockResolvedValueOnce(3) // usuariosNuevos
      .mockResolvedValueOnce(9) // usuariosRecurrentes

    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'u-1',
        name: 'Juan',
        fullName: null,
        email: 'juan@club.com',
        bookings: [],
      },
    ])

    mockPrisma.booking.findMany.mockResolvedValue([
      {
        bookingDate: new Date('2026-04-10T10:00:00.000Z'),
        court: { name: 'Cancha 1' },
      },
      {
        bookingDate: new Date('2026-04-02T10:00:00.000Z'),
        court: { name: 'Cancha 2' },
      },
    ])

    mockPrisma.booking.aggregate.mockResolvedValue({ _sum: { totalPrice: 30000 } })

    const req = new NextRequest('http://localhost/api/usuarios/analisis')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.metricas.totalUsuarios).toBe(20)
    expect(body.data.clientesMasFrecuentes).toHaveLength(1)
    expect(body.data.clientesMasFrecuentes[0]).not.toHaveProperty('descuento')
  })
})
