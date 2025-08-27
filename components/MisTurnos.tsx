/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */
import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Calendar, Clock, MapPin, Users, DollarSign, AlertCircle } from "lucide-react"

interface Player {
  name: string
  email: string
  phone: string
  isRegistered: boolean
  hasPaid: boolean
}

interface Booking {
  id: string
  courtName: string
  date: string
  timeRange: string
  location: string
  totalPrice: number
  deposit: number
  paymentStatus: 'Paid' | 'Deposit Paid' | 'Pending'
  status: string
  type: 'current' | 'past'
  players: Player[]
}

interface MisTurnosProps {
  isVisible: boolean
  isDarkMode: boolean
  currentBookings: Booking[]
  pastBookings: Booking[]
  isLoading?: boolean
  onBack: () => void
  onStartBooking?: () => void
  onOpenCancelModal: (booking: Booking) => void
  getCurrentBookingStatus: (booking: Booking) => 'active' | 'completed' | 'upcoming'
  getRemainingTime: (booking: Booking) => string
  formatDate: (date: string) => string
  getPaymentStatusColor: (status: string, isDarkMode?: boolean) => string
  getStatusColor: (status: string, type: string, isDarkMode?: boolean) => string
}

// Helper functions para optimizar clases CSS
const getCardClasses = (isDarkMode: boolean, isActive: boolean) => {
  const baseClasses = 'p-3 sm:p-4 border rounded-lg transition-all duration-200'
  const themeClasses = isDarkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-white'
  const activeClasses = isActive ? 'ring-2 ring-green-500 ring-opacity-50 shadow-lg' : 'hover:shadow-md'
  return `${baseClasses} ${themeClasses} ${activeClasses}`
}

const getTextClasses = (isDarkMode: boolean, variant: 'primary' | 'secondary' | 'muted') => {
  const variants = {
    primary: isDarkMode ? 'text-white' : 'text-gray-900',
    secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    muted: isDarkMode ? 'text-gray-400' : 'text-gray-500'
  }
  return variants[variant]
}

// Componente memoizado para las tarjetas de reserva
const BookingCard = React.memo<{
  booking: Booking;
  isDarkMode: boolean;
  getCurrentBookingStatus: (booking: Booking) => string;
  getRemainingTime: (booking: Booking) => string;
  getPaymentStatusColor: (status: string, isDarkMode: boolean) => string;
  formatDate: (date: string) => string;
  onCancelBooking?: (bookingId: string) => void;
  isPast?: boolean;
}>(({ booking, isDarkMode, getCurrentBookingStatus, getRemainingTime, getPaymentStatusColor, formatDate, onCancelBooking, isPast = false }) => {
  // Memoizar cálculos costosos
  const bookingData = useMemo(() => {
    const bookingStatus = getCurrentBookingStatus(booking);
    const remainingTime = getRemainingTime(booking);
    const isActive = bookingStatus === 'active';
    const isUpcoming = bookingStatus === 'upcoming';
    return { bookingStatus, remainingTime, isActive, isUpcoming };
  }, [booking, getCurrentBookingStatus, getRemainingTime]);
  
  const { isActive, isUpcoming, remainingTime } = bookingData;
  
  return (
    <div className={getCardClasses(isDarkMode, isActive)} data-testid="booking-item">
      <div className="flex justify-between items-start gap-4">
        {/* Información principal - lado izquierdo */}
        <div className="flex-1">
          <h3 className={`font-semibold text-sm sm:text-base ${getTextClasses(isDarkMode, 'primary')}`}>{booking.courtName}</h3>
          
          {/* Estado de pago - debajo del nombre de la cancha */}
          <span className={`inline-block px-2 py-1 rounded text-xs mb-2 ${getPaymentStatusColor(booking.paymentStatus, isDarkMode)}`}>
            {booking.paymentStatus === 'Paid' ? 'Pagado' : 
             booking.paymentStatus === 'Deposit Paid' ? 'Seña Pagada' : 'Pendiente'}
          </span>
          
          <p className={`text-xs sm:text-sm ${getTextClasses(isDarkMode, 'secondary')}`}>
            {formatDate(booking.date)} - {booking.timeRange}
          </p>
          <p className={`text-xs sm:text-sm ${getTextClasses(isDarkMode, 'secondary')}`}>{booking.location}</p>
          
          {/* Información en tiempo real para turno activo */}
          {isActive && (
            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  Tiempo restante: {remainingTime}
                </span>
              </div>
            </div>
          )}
          
          {/* Detalles de pago para turnos futuros */}
          {isUpcoming && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className={`w-3 h-3 ${getTextClasses(isDarkMode, 'muted')}`} />
                <span className={`text-xs ${getTextClasses(isDarkMode, 'muted')}`}>
                  Pagado: ${booking.deposit?.toLocaleString() || 0}
                </span>
              </div>
              {booking.paymentStatus !== 'Paid' && (
                <div className="flex items-center gap-1">
                  <AlertCircle className={`w-3 h-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <span className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    Pendiente: ${(booking.totalPrice - (booking.deposit || 0)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Precio y acciones - lado derecho */}
        <div className="flex flex-col items-end gap-2">
          {/* Precio */}
          <div className="text-right">
            <p className={`text-base sm:text-lg font-bold ${getTextClasses(isDarkMode, 'primary')}`}>
              ${booking.totalPrice.toLocaleString()}
            </p>
            
            {/* Estado de confirmación */}
            <p className={`text-xs ${getTextClasses(isDarkMode, 'muted')}`}>
              {booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
            </p>
          </div>
          
          {/* Botón cancelar solo para turnos próximos */}
          {!isPast && isUpcoming && onCancelBooking && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelBooking(booking.id)}
              className={`text-xs px-2 py-1 h-auto border ${isDarkMode ? 'border-red-600 text-red-400 hover:bg-red-900/20' : 'border-red-300 text-red-600 hover:bg-red-50'}`}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

const MisTurnos: React.FC<MisTurnosProps> = ({
  isVisible,
  isDarkMode,
  currentBookings,
  pastBookings,
  isLoading = false,
  onBack,
  onStartBooking,
  onOpenCancelModal,
  getCurrentBookingStatus,
  getRemainingTime,
  formatDate,
  getPaymentStatusColor,
  getStatusColor
}) => {
  return (
    <div className={`absolute inset-0 transition-all duration-500 ease-in-out mis-turnos user-bookings overflow-y-auto ${
      isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
    } ${isDarkMode ? "bg-gradient-to-br from-gray-900 to-gray-800" : "bg-gradient-to-br from-blue-50 to-emerald-50"}`} data-testid="mis-turnos">
      <div className="min-h-fit pb-2.5 px-4">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className={`transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Mis Turnos
            </h2>
            <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Gestiona tus reservas actuales y revisa tu historial
            </p>
          </div>
        </div>

        {/* Current Bookings */}
        <Card className={`mb-1 mt-2.5 border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <BookOpen className="w-5 h-5 text-blue-600" />
              Reservas Actuales
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Cargando tus reservas...
                    </span>
                  </div>
                </div>
              ) : currentBookings.length > 0 ? (
                currentBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isDarkMode={isDarkMode}
                    getCurrentBookingStatus={getCurrentBookingStatus}
                    getRemainingTime={getRemainingTime}
                    getPaymentStatusColor={getPaymentStatusColor}
                    formatDate={formatDate}
                    onCancelBooking={(bookingId) => onOpenCancelModal(booking)}
                    isPast={false}
                  />
                ))
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"} empty sin-reservas`} data-testid="empty-bookings">
                  <div className="mb-4">
                    <div className={`text-4xl mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>
                      📅
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      No tienes turnos reservados
                    </h3>
                    <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      ¡Reserva tu cancha de pádel y comienza a jugar!
                    </p>
                  </div>
                  {onStartBooking && (
                    <button
                      onClick={onStartBooking}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Reservar Turno
                    </button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Past Bookings */}
        <Card className={`mb-6 border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Calendar className="w-5 h-5 text-gray-600" />
              Historial de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Cargando historial...
                    </span>
                  </div>
                </div>
              ) : pastBookings.length > 0 ? (
                pastBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    isDarkMode={isDarkMode}
                    getCurrentBookingStatus={getCurrentBookingStatus}
                    getRemainingTime={getRemainingTime}
                    getPaymentStatusColor={getPaymentStatusColor}
                    formatDate={formatDate}
                    isPast={true}
                  />
                ))
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"} empty sin-reservas`} data-testid="empty-past-bookings">
                  <div className="mb-4">
                    <div className={`text-4xl mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>
                      📋
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Sin historial de reservas
                    </h3>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Aquí aparecerán tus turnos completados
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MisTurnos