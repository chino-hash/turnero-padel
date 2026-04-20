/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */
'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { ArrowLeft, BookOpen, Calendar, Clock, DollarSign, AlertCircle } from "lucide-react"
import { BOOKING_STATUS_LABELS, type BookingStatus } from '../types/booking'
import { formatPesosFromCents } from '@/lib/utils/currency'

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
  expiresAt?: string | null
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
  onPayDeposit?: (booking: Booking) => void
  /** Si ya pagaste pero sigue en Pendiente, permite sincronizar el estado con Mercado Pago */
  onSyncPayment?: (bookingId: string) => Promise<void>
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
    muted: isDarkMode ? 'text-gray-400' : 'text-gray-600'
  }
  return variants[variant]
}

// Normalizar estado en español/inglés a clave BookingStatus (mayúsculas)
const toBookingStatus = (status: string): BookingStatus => {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'confirmado':
    case 'confirmed':
      return 'CONFIRMED'
    case 'pendiente':
    case 'pending':
      return 'PENDING'
    case 'cancelado':
    case 'cancelled':
      return 'CANCELLED'
    case 'completado':
    case 'completed':
      return 'COMPLETED'
    case 'activa':
    case 'active':
      return 'ACTIVE'
    default:
      return 'PENDING'
  }
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
  onPayDeposit?: (booking: Booking) => void;
  onSyncPayment?: (bookingId: string) => Promise<void>;
  isPast?: boolean;
}>(({ booking, isDarkMode, getCurrentBookingStatus, getRemainingTime, getPaymentStatusColor, formatDate, onCancelBooking, onPayDeposit, onSyncPayment, isPast = false }) => {
  // Memoizar cálculos costosos
  const bookingData = useMemo(() => {
    const bookingStatus = getCurrentBookingStatus(booking);
    const remainingTime = getRemainingTime(booking);
    const isActive = bookingStatus === 'active';
    const isUpcoming = bookingStatus === 'upcoming';
    return { bookingStatus, remainingTime, isActive, isUpcoming };
  }, [booking, getCurrentBookingStatus, getRemainingTime]);
  
  const { isActive, isUpcoming, remainingTime } = bookingData;
  
  const actionBtnClass = 'min-h-11 w-full text-xs sm:min-h-9 sm:w-auto sm:min-w-0'

  return (
    <div className={getCardClasses(isDarkMode, isActive)} data-testid="booking-item">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm sm:text-base ${getTextClasses(isDarkMode, 'primary')}`}>{booking.courtName}</h3>

          <span className={`inline-block px-2 py-1 rounded text-xs mb-2 ${getPaymentStatusColor(booking.paymentStatus, isDarkMode)}`}>
            {booking.paymentStatus === 'Paid' ? 'Pagado' :
             booking.paymentStatus === 'Deposit Paid' ? (isPast ? 'Turno Completado' : 'Seña Pagada') : 'Pendiente'}
          </span>

          <p className={`text-xs sm:text-sm ${getTextClasses(isDarkMode, 'secondary')}`}>
            {formatDate(booking.date)} - {booking.timeRange}
          </p>
          <p className={`text-xs sm:text-sm ${getTextClasses(isDarkMode, 'secondary')}`}>{booking.location}</p>

          {isActive && (
            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  Tiempo restante: {remainingTime}
                </span>
              </div>
            </div>
          )}

          {isUpcoming && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className={`w-3 h-3 shrink-0 ${getTextClasses(isDarkMode, 'muted')}`} />
                <span className={`text-xs ${getTextClasses(isDarkMode, 'muted')}`}>
                  Pagado: ${formatPesosFromCents(booking.deposit ?? 0)}
                </span>
              </div>
              {booking.paymentStatus !== 'Paid' && (
                <div className="flex items-center gap-1">
                  <AlertCircle className={`w-3 h-3 shrink-0 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <span className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    Pendiente: ${formatPesosFromCents(booking.totalPrice - (booking.deposit ?? 0))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 border-t border-gray-200 pt-3 dark:border-gray-600 sm:w-auto sm:shrink-0 sm:border-t-0 sm:pt-0 sm:items-end">
          <div className="text-left sm:text-right">
            <p className={`text-base sm:text-lg font-bold ${getTextClasses(isDarkMode, 'primary')}`}>
              ${formatPesosFromCents(booking.totalPrice)}
            </p>
            <p className={`text-xs ${getTextClasses(isDarkMode, 'muted')}`}>
              {BOOKING_STATUS_LABELS[toBookingStatus(booking.status)]}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            {!isPast && isUpcoming && onCancelBooking && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancelBooking(booking.id)}
                className={`${actionBtnClass} border ${isDarkMode ? 'border-red-600 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
              >
                Cancelar
              </Button>
            )}
            {!isPast && onPayDeposit && booking.paymentStatus === 'Pending' && (!booking.expiresAt || new Date(booking.expiresAt) > new Date()) && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPayDeposit(booking)}
                className={actionBtnClass}
              >
                Pagar seña
              </Button>
            )}
            {!isPast && booking.paymentStatus === 'Pending' && onSyncPayment && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                title="¿Ya pagaste? Sincronizar el estado con Mercado Pago"
                onClick={() => onSyncPayment(booking.id)}
                className={actionBtnClass}
              >
                <span className="sm:hidden">Sincronizar</span>
                <span className="hidden sm:inline">¿Ya pagaste? Sincronizar</span>
              </Button>
            )}
          </div>
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
  getStatusColor,
  onPayDeposit,
  onSyncPayment,
}) => {
  return (
    <div className={`absolute inset-0 transition-all duration-500 ease-in-out mis-turnos user-bookings overflow-y-auto ${
      isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
    } ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gradient-to-br from-blue-50 to-emerald-50"}`} data-testid="mis-turnos">
      <div className="min-h-fit px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-16 sm:pt-20">
        <div className="relative z-20 mb-4 min-h-[3rem] sm:mb-6 sm:min-h-0">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className={`absolute left-0 top-0 z-10 min-h-11 transition-all duration-300 sm:min-h-9 ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="px-14 text-center sm:px-16">
            <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Mis Turnos
            </h2>
            <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Gestiona tus reservas actuales y revisa tu historial
            </p>
          </div>
        </div>

        <Card className={`mb-1 mt-2.5 border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-6">
            <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <BookOpen className="h-5 w-5 shrink-0 text-blue-600" />
              Reservas Actuales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3 sm:px-6">
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
                    onPayDeposit={onPayDeposit}
                    onSyncPayment={onSyncPayment}
                    isPast={false}
                  />
                ))
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"} empty sin-reservas`} data-testid="empty-bookings">
                  <div className="mb-4">
                    <div className={`text-4xl mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>
                      📅
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      No tienes turnos reservados
                    </h3>
                    <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      ¡Reserva tu cancha de pádel y comienza a jugar!
                    </p>
                  </div>
                  {onStartBooking && (
                    <Button
                      type="button"
                      onClick={onStartBooking}
                      className="min-h-11 bg-blue-600 px-6 text-white shadow-md hover:bg-blue-700 hover:shadow-lg"
                    >
                      Reservar Turno
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Past Bookings */}
        <Card className={`mb-6 border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <CardHeader className="px-4 py-3 sm:px-6 sm:py-6">
            <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Calendar className="h-5 w-5 shrink-0 text-gray-600" />
              Historial de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3 sm:px-6">
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
                    onPayDeposit={onPayDeposit}
                    onSyncPayment={onSyncPayment}
                    isPast={true}
                  />
                ))
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"} empty sin-reservas`} data-testid="empty-past-bookings">
                  <div className="mb-4">
                    <div className={`text-4xl mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>
                      📋
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Sin historial de reservas
                    </h3>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
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