import { fireEvent, render, screen } from '@testing-library/react'
import useSWR from 'swr'
import AdminAvailabilityGrid from '@/components/admin/AdminAvailabilityGrid'

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockUseSWR = useSWR as jest.Mock

function buildAvailabilityData(courtsCount: number) {
  return {
    timeSlots: [
      {
        timeLabel: '08:00 - 09:30',
        days: [
          {
            date: '2026-04-20',
            courts: Array.from({ length: courtsCount }, (_, index) => ({
              courtId: `court-${index + 1}`,
              status: 'free' as const,
            })),
          },
        ],
      },
    ],
  }
}

function setupSWR(courtsCount: number) {
  mockUseSWR.mockReturnValue({
    data: buildAvailabilityData(courtsCount),
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  })
}

describe('AdminAvailabilityGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza todas las canchas cuando el tenant tiene 2', () => {
    setupSWR(2)
    render(<AdminAvailabilityGrid />)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar grilla' }))

    const grid = screen.getByTestId('admin-availability-grid')
    expect(grid.querySelectorAll('[data-state]').length).toBe(2)
  })

  it('renderiza todas las canchas cuando el tenant tiene mas de 3', () => {
    setupSWR(9)
    render(<AdminAvailabilityGrid />)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar grilla' }))

    const grid = screen.getByTestId('admin-availability-grid')
    expect(grid.querySelectorAll('[data-state]').length).toBe(9)
    expect(grid.className).toContain('overflow-auto')
  })
})
