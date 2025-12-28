'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserBookings } from '../lib/services/bookings'
import { useRealTimeUpdates } from './useRealTimeUpdates'
import type { BookingWithDetails } from '../lib/services/bookings'

interface UseUserBookingsReturn {
  bookings: BookingWithDetails[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook personalizado para manejar las reservas del usuario con sincronización en tiempo real
 * 
 * @returns {UseUserBookingsReturn} Objeto con reservas, estado de carga, errores y función de recarga
 * 
 * @example
 * ```typescript
 * const { bookings, loading, error, refetch } = useUserBookings()
 * 
 * if (loading) return <div>Cargando reservas...</div>
 * if (error) return <div>Error: {error}</div>
 * 
 * return (
 *   <div>
 *     {bookings.map(booking => (
 *       <BookingCard key={booking.id} booking={booking} />
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useUserBookings(): UseUserBookingsReturn {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!session?.user?.id) {
      setBookings([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const userBookings = await getUserBookings(session.user.id)
      setBookings(userBookings)
    } catch (err: any) {
      console.error('Error fetching user bookings:', err)
      setError(err.message || 'Error cargando reservas')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Configurar actualizaciones en tiempo real
  useRealTimeUpdates({
    onBookingsUpdated: useCallback((data: any) => {
      console.log('Actualizando reservas del usuario por evento SSE:', data)
      // Refrescar las reservas cuando hay cambios
      fetchBookings()
    }, [fetchBookings]),
    
    onSlotsUpdated: useCallback((data: any) => {
      console.log('Slots actualizados, verificando impacto en reservas del usuario:', data)
      // Los cambios en slots pueden afectar las reservas del usuario
      fetchBookings()
    }, [fetchBookings]),
    
    onCourtsUpdated: useCallback((data: any) => {
      console.log('Canchas actualizadas, verificando impacto en reservas del usuario:', data)
      // Los cambios en canchas pueden afectar las reservas del usuario
      fetchBookings()
    }, [fetchBookings])
  })

  // Cargar reservas inicialmente
  useEffect(() => {
    if (session?.user?.id) {
      fetchBookings()
    }
  }, [session?.user?.id, fetchBookings])



  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings
  }
}

/**
 * Hook simplificado para obtener solo las reservas actuales del usuario
 * Sin sincronización en tiempo real para casos donde no se necesita
 */
export function useUserBookingsStatic(): Omit<UseUserBookingsReturn, 'refetch'> {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) {
      setBookings([])
      return
    }
    
    const fetchBookings = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const userBookings = await getUserBookings(session.user.id)
        setBookings(userBookings)
      } catch (err: any) {
        console.error('Error fetching user bookings:', err)
        setError(err.message || 'Error cargando reservas')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [session?.user?.id])

  return {
    bookings,
    loading,
    error
  }
}