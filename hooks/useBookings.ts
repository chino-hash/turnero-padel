import { useState, useCallback, useEffect } from 'react'
import {
  Booking,
  BookingFilters,
  BookingStats,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingAvailabilityRequest,
  BookingAvailabilityResponse,
  PaginationInfo
} from '../types/booking'

interface UseBookingsOptions {
  initialFilters?: BookingFilters
  pageSize?: number
  autoFetch?: boolean
  onUpdated?: () => void
}

interface UseBookingsReturn {
  bookings: Booking[]
  loading: boolean
  error: string | null
  filters: BookingFilters
  stats: BookingStats | null
  pagination: PaginationInfo
  setFilters: (filters: BookingFilters) => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  fetchBookings: () => Promise<void>
  refreshBookings: () => Promise<void>
  createBooking: (data: CreateBookingRequest) => Promise<Booking | null>
  updateBooking: (id: string, data: UpdateBookingRequest) => Promise<Booking | null>
  deleteBooking: (id: string) => Promise<boolean>
  checkAvailability: (request: BookingAvailabilityRequest) => Promise<BookingAvailabilityResponse | null>
  getAvailabilitySlots: (courtId: string, date: string, duration?: number) => Promise<Array<{ startTime: string, endTime: string, available: boolean }> | null>
}

interface UseBookingsReturn {
  // Estado
  bookings: Booking[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo
  stats: BookingStats | null
  
  // Filtros
  filters: BookingFilters
  setFilters: (filters: BookingFilters) => void
  clearFilters: () => void
  
  // Paginación
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  
  // Acciones CRUD
  fetchBookings: () => Promise<void>
  createBooking: (data: CreateBookingRequest) => Promise<Booking | null>
  updateBooking: (id: string, data: UpdateBookingRequest) => Promise<Booking | null>
  deleteBooking: (id: string) => Promise<boolean>
  
  // Utilidades
  refreshBookings: () => Promise<void>
  checkAvailability: (request: BookingAvailabilityRequest) => Promise<BookingAvailabilityResponse | null>
}

// Helpers for filters and pagination state mutations
export function useBookings(options: UseBookingsOptions = {}): UseBookingsReturn {
  const {
    initialFilters = {},
    pageSize = 10,
    autoFetch = false,
    onUpdated
  } = options

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: pageSize,
    ...initialFilters
  })
  const [stats, setStats] = useState<any>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: pageSize, total: 0, totalPages: 0 })

  const timedFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit, label?: string) => {
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    const res = await fetch(input as any, init)
    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    const ms = Math.round(t1 - t0)
    try {
      const urlStr = typeof input === 'string' ? input : (input as URL).toString()
      if (!urlStr.includes('/api/admin/test-event') && typeof window !== 'undefined') {
        console.log(`[latency] ${label || urlStr} ${ms}ms status ${res.status}`)
        fetch('/api/admin/test-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ type: 'admin_change', message: `[latency] ${label || urlStr} ${ms}ms status ${res.status}` })
        }).catch(() => {})
      }
    } catch {}
    return res
  }, [])

  const buildQueryParams = useCallback((filters: BookingFilters) => {
    const params = new URLSearchParams()
    if (filters.page) params.set('page', String(filters.page))
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.status) params.set('status', String(filters.status))
    if (filters.courtId) params.set('courtId', String(filters.courtId))
    if (filters.dateFrom) params.set('dateFrom', String(filters.dateFrom))
    if (filters.dateTo) params.set('dateTo', String(filters.dateTo))
    if (filters.search) params.set('search', String(filters.search))
    if (filters.sortBy) params.set('sortBy', String(filters.sortBy))
    if (filters.sortOrder) params.set('sortOrder', String(filters.sortOrder))
    return params.toString()
  }, [])

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = buildQueryParams(filters)
      const response = await timedFetch(`/api/bookings?${query}`, undefined, 'GET /api/bookings')
      if (!response.ok) {
        try {
          const payload = await response.json()
          const msg = payload?.error || `Error al obtener reservas (${response.status})`
          setError(msg)
        } catch (_) {
          setError(`Error al obtener reservas (${response.status})`)
        }
        setBookings([])
        setPagination({ page: filters.page ?? 1, limit: pageSize, total: 0, totalPages: 0 })
        return
      }
      const result = await response.json()
      const list: Booking[] = result?.data ?? []
      setBookings(list)
      if (result?.meta) {
        setPagination({
          page: Number(result.meta.page ?? filters.page ?? 1),
          limit: Number(result.meta.limit ?? pageSize),
          total: Number(result.meta.total ?? list.length ?? 0),
          totalPages: Number(result.meta.totalPages ?? 0)
        })
      } else {
        setPagination({ page: filters.page ?? 1, limit: pageSize, total: list.length ?? 0, totalPages: 0 })
      }
      if (result?.message || result?.success === false) {
        // optional error message from API; keep UX minimal
      }
    } catch (err: any) {
      console.error('fetchBookings error:', err)
      setError(err.message || 'Error al obtener reservas')
    } finally {
      setLoading(false)
    }
  }, [filters, buildQueryParams, pageSize])

  const createBooking = useCallback(async (bookingData: CreateBookingRequest): Promise<Booking | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await timedFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      }, 'POST /api/bookings')
      if (!response.ok) throw new Error(`Error al crear reserva (${response.status})`)
      const result = await response.json()
      const newBooking: Booking | null = result?.data ?? null
      if (newBooking) {
        setBookings(prev => [newBooking, ...prev])
        onUpdated?.()
      }
      return newBooking
    } catch (err: any) {
      console.error('createBooking error:', err)
      setError(err.message || 'Error al crear reserva')
      return null
    } finally {
      setLoading(false)
    }
  }, [onUpdated])

  const updateBooking = useCallback(async (bookingId: string, bookingData: UpdateBookingRequest): Promise<Booking | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await timedFetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      }, 'PUT /api/bookings/:id')
      if (!response.ok) throw new Error(`Error al actualizar reserva (${response.status})`)
      const result = await response.json()
      const updated: Booking | null = result?.data ?? null
      if (updated) {
        setBookings(prev => prev.map(b => (b.id === bookingId ? updated : b)))
        onUpdated?.()
      }
      return updated
    } catch (err: any) {
      console.error('updateBooking error:', err)
      setError(err.message || 'Error al actualizar reserva')
      return null
    } finally {
      setLoading(false)
    }
  }, [onUpdated])

  const deleteBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await timedFetch(`/api/bookings/${bookingId}`, { method: 'DELETE' }, 'DELETE /api/bookings/:id')
      if (!response.ok) throw new Error(`Error al cancelar reserva (${response.status})`)
      // server may return booking data; we optimistically remove from list
      setBookings(prev => prev.filter(b => b.id !== bookingId))
      onUpdated?.()
      return true
    } catch (err: any) {
      console.error('deleteBooking error:', err)
      setError(err.message || 'Error al cancelar reserva')
      return false
    } finally {
      setLoading(false)
    }
  }, [onUpdated])

  const checkAvailability = useCallback(async (request: BookingAvailabilityRequest): Promise<BookingAvailabilityResponse | null> => {
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('courtId', String(request.courtId))
      if (request.date) params.set('date', String(request.date))
      if (request.startTime) params.set('startTime', String(request.startTime))
      if (request.endTime) params.set('endTime', String(request.endTime))
      const response = await timedFetch(`/api/bookings/availability?${params.toString()}`, undefined, 'GET /api/bookings/availability')
      if (!response.ok) {
        try {
          const payload = await response.json()
          const msg = payload?.error || `Error al verificar disponibilidad (${response.status})`
          setError(msg)
        } catch (_) {
          setError(`Error al verificar disponibilidad (${response.status})`)
        }
        return { available: false, availableSlots: [] }
      }
      const result = await response.json()
      const available = Boolean(result?.data)
      return { available, availableSlots: [] }
    } catch (err: any) {
      console.error('checkAvailability error:', err)
      setError(err.message || 'Error al verificar disponibilidad')
      return null
    }
  }, [])

  const getAvailabilitySlots = useCallback(async (courtId: string, date: string, duration: number = 90): Promise<Array<{ startTime: string, endTime: string, available: boolean }> | null> => {
    setError(null)
    try {
      const response = await timedFetch('/api/bookings/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtId, date, duration })
      }, 'POST /api/bookings/availability')
      if (!response.ok) {
        try {
          const payload = await response.json()
          const msg = payload?.error || `Error al obtener horarios disponibles (${response.status})`
          setError(msg)
        } catch (_) {
          setError(`Error al obtener horarios disponibles (${response.status})`)
        }
        return null
      }
      const result = await response.json()
      const slots = result?.data?.slots ?? null
      return slots
    } catch (err: any) {
      console.error('getAvailabilitySlots error:', err)
      setError(err.message || 'Error al obtener horarios disponibles')
      return null
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchBookings()
    }
  }, [autoFetch, fetchBookings])

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: pageSize })
  }, [pageSize])

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const fetchBookingsWrapper = useCallback(async () => {
    await fetchBookings()
  }, [fetchBookings])

  const refreshBookings = useCallback(async () => {
    await fetchBookings()
  }, [fetchBookings])

  return {
    bookings,
    loading,
    error,
    filters,
    stats,
    pagination,
    setFilters,
    clearFilters,
    setPage,
    setLimit,
    fetchBookings: fetchBookingsWrapper,
    refreshBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    checkAvailability,
    getAvailabilitySlots
  }
}

export function useBooking(bookingId: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (!response.ok) throw new Error(`Error al obtener reserva (${response.status})`)
      const result = await response.json()
      setBooking(result?.data ?? null)
    } catch (err: any) {
      console.error('fetchBooking error:', err)
      setError(err.message || 'Error al obtener la reserva')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  return { booking, loading, error, refresh: fetchBooking }
}
