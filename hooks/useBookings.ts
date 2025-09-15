'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Booking, 
  BookingFilters, 
  BookingStats, 
  PaginationInfo, 
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingAvailabilityRequest,
  BookingAvailabilityResponse,
  DEFAULT_PAGINATION
} from '../types/booking'

interface UseBookingsOptions {
  initialFilters?: BookingFilters
  initialPagination?: Partial<PaginationInfo>
  autoFetch?: boolean
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

export function useBookings(options: UseBookingsOptions = {}): UseBookingsReturn {
  const {
    initialFilters = {},
    initialPagination = {},
    autoFetch = true
  } = options

  // Estado principal
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<BookingStats | null>(null)
  
  // Estado de filtros y paginación
  const [filters, setFilters] = useState<BookingFilters>(initialFilters)
  const [pagination, setPagination] = useState<PaginationInfo>({
    ...DEFAULT_PAGINATION,
    ...initialPagination
  })

  // Función para construir query params
  const buildQueryParams = useCallback((customFilters?: BookingFilters, customPagination?: Partial<PaginationInfo>) => {
    const params = new URLSearchParams()
    const currentFilters = customFilters || filters
    const currentPagination = { ...pagination, ...customPagination }

    // Paginación
    params.append('page', currentPagination.page.toString())
    params.append('limit', currentPagination.limit.toString())

    // Filtros
    if (currentFilters.search) params.append('search', currentFilters.search)
    if (currentFilters.courtId) params.append('courtId', currentFilters.courtId)
    if (currentFilters.userId) params.append('userId', currentFilters.userId)
    if (currentFilters.status) params.append('status', currentFilters.status)
    if (currentFilters.dateFrom) params.append('dateFrom', currentFilters.dateFrom.toISOString().split('T')[0])
    if (currentFilters.dateTo) params.append('dateTo', currentFilters.dateTo.toISOString().split('T')[0])
    if (currentFilters.timeFrom) params.append('timeFrom', currentFilters.timeFrom)
    if (currentFilters.timeTo) params.append('timeTo', currentFilters.timeTo)

    return params.toString()
  }, [filters, pagination])

  // Fetch bookings
  const fetchBookings = useCallback(async (customFilters?: BookingFilters, customPagination?: Partial<PaginationInfo>) => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = buildQueryParams(customFilters, customPagination)
      const response = await fetch(`/api/bookings?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      setBookings(data.bookings || [])
      setPagination(data.pagination || DEFAULT_PAGINATION)
      if (data.stats) setStats(data.stats)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar reservas'
      setError(errorMessage)
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams])

  // Crear reserva
  const createBooking = useCallback(async (data: CreateBookingRequest): Promise<Booking | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const newBooking = await response.json()
      
      // Actualizar la lista local
      setBookings(prev => [newBooking, ...prev])
      
      return newBooking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la reserva'
      setError(errorMessage)
      console.error('Error creating booking:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar reserva
  const updateBooking = useCallback(async (id: string, data: UpdateBookingRequest): Promise<Booking | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const updatedBooking = await response.json()
      
      // Actualizar la lista local
      setBookings(prev => prev.map(booking => 
        booking.id === id ? updatedBooking : booking
      ))
      
      return updatedBooking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la reserva'
      setError(errorMessage)
      console.error('Error updating booking:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Eliminar reserva
  const deleteBooking = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      // Remover de la lista local
      setBookings(prev => prev.filter(booking => booking.id !== id))
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la reserva'
      setError(errorMessage)
      console.error('Error deleting booking:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Verificar disponibilidad
  const checkAvailability = useCallback(async (request: BookingAvailabilityRequest): Promise<BookingAvailabilityResponse | null> => {
    try {
      const params = new URLSearchParams({
        courtId: request.courtId,
        date: request.date,
        ...(request.startTime && { startTime: request.startTime }),
        ...(request.endTime && { endTime: request.endTime })
      })

      const response = await fetch(`/api/bookings/availability?${params}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar disponibilidad'
      setError(errorMessage)
      console.error('Error checking availability:', err)
      return null
    }
  }, [])

  // Funciones de utilidad
  const refreshBookings = useCallback(() => fetchBookings(), [fetchBookings])
  
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  // Actualizar filtros y refetch
  const handleSetFilters = useCallback((newFilters: BookingFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset page when filters change
  }, [])

  // Auto-fetch cuando cambian filtros o paginación
  useEffect(() => {
    if (autoFetch) {
      fetchBookings()
    }
  }, [filters, pagination.page, pagination.limit, autoFetch, fetchBookings])

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchBookings()
    }
  }, []) // Solo en el mount inicial

  return {
    // Estado
    bookings,
    loading,
    error,
    pagination,
    stats,
    
    // Filtros
    filters,
    setFilters: handleSetFilters,
    clearFilters,
    
    // Paginación
    setPage,
    setLimit,
    
    // Acciones CRUD
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    
    // Utilidades
    refreshBookings,
    checkAvailability,
  }
}

// Hook específico para una reserva individual
export function useBooking(id: string) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/bookings/${id}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setBooking(data)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar la reserva'
      setError(errorMessage)
      console.error('Error fetching booking:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking
  }
}