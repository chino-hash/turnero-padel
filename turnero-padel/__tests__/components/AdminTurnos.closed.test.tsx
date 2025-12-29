import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AdminTurnos from '../../components/AdminTurnos'

describe('AdminTurnos - categoría TURNOS CERRADOS y bloqueo de toggles', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo) => {
      const url = String(input)
      if (url.startsWith('/api/bookings')) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: 'booking-1',
                court: { name: 'Cancha 1' },
                bookingDate: '2025-11-20T00:00:00.000Z',
                startTime: '08:00',
                endTime: '09:30',
                user: { name: 'Juan Pérez', email: 'juan@example.com' },
                status: 'COMPLETED',
                paymentStatus: 'FULLY_PAID',
                totalPrice: 6000,
                createdAt: '2025-11-20T06:00:00.000Z',
                closedAt: '2025-11-20T10:00:00.000Z',
                players: [
                  { playerName: 'Juan Pérez', position: 1, hasPaid: true },
                  { playerName: 'María García', position: 2, hasPaid: true },
                  { playerName: 'Carlos López', position: 3, hasPaid: true },
                  { playerName: 'Ana Martín', position: 4, hasPaid: true }
                ],
                extras: [],
              }
            ]
          })
        } as any
      }
      return { ok: true, json: async () => ({ success: true }) } as any
    }) as any
  })

  it('muestra la sección TURNOS CERRADOS y deshabilita toggles bajo condiciones', async () => {
    render(<AdminTurnos />)
    await waitFor(() => {
      expect(screen.getByText('TURNOS CERRADOS')).toBeInTheDocument()
    })
    // Los toggles deben estar presentes pero deshabilitados por cierre
    const toggle = await screen.findByTestId('admin-player-payment-toggle-1-player1')
    expect(toggle).toHaveAttribute('aria-disabled', 'true')
  })
})

