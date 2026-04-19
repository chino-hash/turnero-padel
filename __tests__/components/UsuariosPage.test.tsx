import React from 'react'
import { render, screen } from '@testing-library/react'
import UsuariosPage from '../../app/admin-panel/admin/usuarios/page'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        isSuperAdmin: false,
      },
    },
  })),
}))

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => '/admin-panel/admin/usuarios'),
}))

jest.mock('../../hooks/useAnalisisUsuarios', () => ({
  useAnalisisUsuarios: jest.fn(() => ({
    analisis: {
      metricas: {
        totalUsuarios: 20,
        usuariosActivos: 10,
        nuevosEsteMes: 3,
        retencion: 60,
      },
      clientesMasFrecuentes: [
        {
          id: 'u-1',
          nombre: 'Juan',
          email: 'juan@club.com',
          reservas: 15,
          reservasMes: 4,
          frecuencia: 'Semanal',
          canchaPreferida: 'Cancha 1',
          ultimaReserva: '2026-04-10',
          categoria: 'VIP',
        },
      ],
      clientesNuevosVsRecurrentes: { nuevos: 3, recurrentes: 7 },
      valorPromedioPorCliente: 12000,
      distribucionCategorias: { VIP: 1, Premium: 2, Regular: 3 },
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('../../hooks/useUsuariosList', () => ({
  useUsuariosList: jest.fn(() => ({
    data: [
      {
        id: 'u-1',
        name: 'Juan',
        fullName: null,
        email: 'juan@club.com',
        phone: null,
        role: 'USER',
        isActive: true,
        createdAt: '2026-03-01T00:00:00.000Z',
        reservas: 15,
        ultimaReserva: '2026-04-10',
        categoria: 'VIP',
      },
    ],
    meta: { page: 1, totalPages: 1, total: 1, limit: 10 },
    loading: false,
    error: null,
    refetch: jest.fn(),
  })),
}))

describe('UsuariosPage', () => {
  it('renderiza análisis de clientes sin bloque de descuentos', () => {
    render(React.createElement(UsuariosPage))

    expect(screen.getByText('Análisis de Clientes')).toBeInTheDocument()
    expect(screen.getByText('Listado de clientes')).toBeInTheDocument()
    expect(screen.getByText('Clientes Frecuentes')).toBeInTheDocument()
    expect(screen.queryByText('Programa de Descuentos para Usuarios Regulares')).not.toBeInTheDocument()
  })
})
