'use client'

import { useUserBookings } from '../hooks/useUserBookings'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState, useMemo } from 'react'
import { Calendar, Clock, MapPin, Users, CreditCard, RefreshCw } from 'lucide-react'
import type { BookingWithDetails } from '../lib/services/bookings'

interface UserBookingsListProps {
  className?: string
  showFilters?: boolean
  maxItems?: number
}

type FilterType = 'all' | 'upcoming' | 'past' | 'confirmed' | 'pending' | 'cancelled'

export function UserBookingsList({ 
  className = '', 
  showFilters = true, 
  maxItems 
}: UserBookingsListProps) {
  const { bookings, loading, error, refetch } = useUserBookings()
  const [filter, setFilter] = useState<FilterType>('all')
  const [refreshing, setRefreshing] = useState(false)

  const filteredBookings = useMemo(() => {
    let filtered = bookings
    const now = new Date()

    switch (filter) {
      case 'upcoming':
        filtered = bookings.filter(b => new Date(b.bookingDate) >= now)
        break
      case 'past':
        filtered = bookings.filter(b => new Date(b.bookingDate) < now)
        break
      case 'confirmed':
        filtered = bookings.filter(b => b.status === 'confirmed')
        break
      case 'pending':
        filtered = bookings.filter(b => b.status === 'pending')
        break
      case 'cancelled':
        filtered = bookings.filter(b => b.status === 'cancelled')
        break
      default:
        filtered = bookings
    }

    return maxItems ? filtered.slice(0, maxItems) : filtered
  }, [bookings, filter, maxItems])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <p className="text-lg font-semibold">Error al cargar reservas</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mis Reservas</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 pb-4 border-b">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'upcoming', label: 'Próximas' },
            { key: 'past', label: 'Pasadas' },
            { key: 'confirmed', label: 'Confirmadas' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'cancelled', label: 'Canceladas' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as FilterType)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de reservas */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tienes reservas</p>
            <p className="text-sm">
              {filter === 'all' 
                ? 'Aún no has realizado ninguna reserva'
                : `No hay reservas ${filter === 'upcoming' ? 'próximas' : filter === 'past' ? 'pasadas' : filter}`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Contador */}
          <div className="text-sm text-gray-600">
            Mostrando {filteredBookings.length} de {bookings.length} reservas
          </div>
          
          {/* Reservas */}
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}

// Componente para cada tarjeta de reserva
function BookingCard({ booking }: { booking: BookingWithDetails }) {
  const isUpcoming = new Date(booking.bookingDate) >= new Date()
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-lg">{booking.court.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {booking.status === 'confirmed' ? 'Confirmada' :
               booking.status === 'pending' ? 'Pendiente' : 'Cancelada'}
            </span>
          </div>
          
          {booking.court.description && (
            <p className="text-gray-600 text-sm mb-2">{booking.court.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información de fecha y hora */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {format(new Date(booking.bookingDate), 'EEEE, d MMMM yyyy', { locale: es })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span>{booking.startTime} - {booking.endTime}</span>
            {booking.durationMinutes && (
              <span className="text-sm text-gray-500">({booking.durationMinutes} min)</span>
            )}
          </div>
        </div>

        {/* Información de precio y jugadores */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700">
            <CreditCard className="w-4 h-4" />
            <span className="font-semibold">${booking.totalPrice}</span>
            {booking.depositAmount && (
              <span className="text-sm text-gray-500">
                (Seña: ${booking.depositAmount})
              </span>
            )}
          </div>
          
          {booking.players.length > 0 && (
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {booking.players.length} jugador{booking.players.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Jugadores */}
      {booking.players.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Jugadores:</h4>
          <div className="flex flex-wrap gap-2">
            {booking.players.map((player, index) => (
              <span
                key={player.id || index}
                className={`px-2 py-1 rounded text-xs ${
                  player.hasPaid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {player.playerName}
                {player.hasPaid && ' ✓'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {booking.notes && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notas:</span> {booking.notes}
          </p>
        </div>
      )}

      {/* Indicador de tiempo */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {isUpcoming ? 'Próxima reserva' : 'Reserva pasada'}
          </span>
          <span>
            Creada: {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
          </span>
        </div>
      </div>
    </div>
  )
}