import { renderHook, act, waitFor } from '@testing-library/react'
import { useBookings } from '../../hooks/useBookings'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockBookings = [
  {
    id: '1',
    courtId: 'court-1',
    userId: 'user-1',
    bookingDate: '2024-06-15',
    startTime: '10:00',
    endTime: '11:30',
    totalPrice: 1500,
    depositAmount: 750,
    status: 'confirmed',
    court: {
      id: 'court-1',
      name: 'Cancha 1',
      basePrice: 1000,
    },
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    players: [],
  },
]

const mockApiResponse = {
  bookings: mockBookings,
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
}

describe('useBookings Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response)
  })

  describe('Fetching bookings', () => {
    it('should fetch bookings successfully', async () => {
      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.bookings).toEqual(mockBookings)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.bookings).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Filters and pagination', () => {
    it('should update filters correctly', async () => {
      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.setFilters({
          search: 'test',
          courtId: 'court-1',
          status: 'confirmed',
        })
      })

      expect(result.current.filters.search).toBe('test')
      expect(result.current.filters.courtId).toBe('court-1')
      expect(result.current.filters.status).toBe('confirmed')
    })

    it('should update pagination correctly', async () => {
      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.setPagination({ page: 2, limit: 20 })
      })

      expect(result.current.pagination.page).toBe(2)
      expect(result.current.pagination.limit).toBe(20)
    })

    it('should clear filters', async () => {
      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.setFilters({
          search: 'test',
          courtId: 'court-1',
        })
      })

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.filters.search).toBe('')
      expect(result.current.filters.courtId).toBe('')
    })
  })

  describe('CRUD operations', () => {
    it('should create booking successfully', async () => {
      const newBooking = {
        courtId: 'court-1',
        bookingDate: '2024-06-16',
        startTime: '14:00',
        endTime: '15:30',
        players: ['Player 1', 'Player 2'],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...newBooking, id: '2' }),
      } as Response)

      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.createBooking(newBooking)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBooking),
      })
    })

    it('should update booking successfully', async () => {
      const updatedData = {
        status: 'cancelled',
        cancellationReason: 'User request',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockBookings[0], ...updatedData }),
      } as Response)

      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.updateBooking('1', updatedData)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/bookings/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })
    })

    it('should delete booking successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.deleteBooking('1')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/bookings/1', {
        method: 'DELETE',
      })
    })
  })

  describe('Availability check', () => {
    it('should check availability successfully', async () => {
      const availabilityData = {
        available: true,
        alternatives: [],
        occupancyStats: {
          totalSlots: 10,
          occupiedSlots: 3,
          occupancyRate: 30,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => availabilityData,
      } as Response)

      const { result } = renderHook(() => useBookings(), {
        wrapper: createWrapper(),
      })

      let availability
      await act(async () => {
        availability = await result.current.checkAvailability({
          courtId: 'court-1',
          date: '2024-06-15',
          startTime: '10:00',
          endTime: '11:30',
        })
      })

      expect(availability).toEqual(availabilityData)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/bookings/availability?courtId=court-1&date=2024-06-15&startTime=10:00&endTime=11:30'
      )
    })
  })
})