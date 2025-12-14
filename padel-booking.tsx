"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./hooks/useAuth"
import { 
  useAppState, 
  type Player, 
  type CourtBooking,
  formatDate,
  formatShortDate,
  getNextDays,
  getStatusColor,
  getPaymentStatusColor,
  getAdminStatusColor,
  calculateRemainingTime,
  generateUnifiedSlots,
  generateTimeSlots,
  getCurrentBookingStatus,
  getRemainingTime
} from "./components/providers/AppStateProvider"
// import { ProtectedRoute } from "./components/auth/ProtectedRoute" // No necesario, auth se maneja en layout
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Moon,
  Sun,
  Home,
  BookOpen,
  Settings,
  CreditCard,
  X,
  CheckCircle,
  ArrowLeft,
  Check,
  DollarSign,
  Activity,
  TrendingUp,
  AlertCircle,
  BanknoteIcon as BankIcon,
  RefreshCw,
} from "lucide-react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover"
import { Calendar as CalendarComponent } from "./components/ui/calendar" // Renamed to avoid conflict
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog"
import { Switch } from "./components/ui/switch"
import { Label } from "./components/ui/label"
import MisTurnos from "./components/MisTurnos"
import HomeSection from "./components/HomeSection"

// Los tipos ahora están definidos en AppStateProvider

// Los datos mock ahora están definidos en AppStateProvider

// Las funciones auxiliares ahora están definidas en AppStateProvider

function PadelBookingPage() {
  const { user, profile, signOut, isAdmin, loading } = useAuth()
  const router = useRouter()
  
  // Usar el contexto global para el estado compartido
  const {
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    expandedSlot,
    setExpandedSlot,
    isDarkMode,
    setIsDarkMode,
    activeNavItem,
    setActiveNavItem,
    isUnifiedView,
    setIsUnifiedView,
    showOnlyOpen,
    setShowOnlyOpen,
    courts,
    currentBookings,
    pastBookings,
    adminBookings,
    timeSlots,
    filteredTimeSlots,
    slotsForRender,
    ratesByCourt,
    slotsLoading,
    multipleSlotsLoading,
    slotsError,
    multipleSlotsError,
    retrySlots,
    retryMultipleSlots,
    formatDate,
    getCurrentBookingStatus,
    getRemainingTime,
    getPaymentStatusColor,
    getStatusColor,
    scrollToNextAvailable,
    getAvailableDays,
    handleSlotClick,
    currentCourtName
  } = useAppState()
  
  // Estados locales específicos del componente (no compartidos)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [selectedSlotForConfirmation, setSelectedSlotForConfirmation] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [newBooking, setNewBooking] = useState<any | null>(null)
  const [selectedAdminDate, setSelectedAdminDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<'court' | 'unified'>('court')
  
  // Estados para el modal de cancelación mejorado
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<any>(null)
  const [refundAmount, setRefundAmount] = useState(0)
  const [canRefund, setCanRefund] = useState(false)
  
  // Los useEffect de persistencia ahora están en el contexto global

  // Navegación de días
  const goToNextDay = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1))
  const goToPrevDay = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1))

  // Next Available desde la hora actual
  const findNextAvailableFromNow = () => {
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const list = showOnlyOpen ? timeSlots.filter(s => s.isAvailable) : timeSlots
    return list.find(s => {
      if (!s.startTime) return false
      const [sh, sm] = s.startTime.split(':').map(Number)
      const startM = sh * 60 + sm
      return startM >= nowMinutes
    }) || list.find(s => s.isAvailable)
  }

  // Los hooks de slots ahora están en el contexto global

  // Las funciones generateUnifiedSlots y generateTimeSlots ahora están en AppStateProvider
  // slotsForRender y filteredTimeSlots ahora están en el contexto global

  const scrollToNextAvailableFromNow = () => {
    const next = findNextAvailableFromNow()
    if (next) {
      const el = document.getElementById(`slot-${next.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setExpandedSlot(next.id)
        setSelectedSlot(next)
        ;(el as HTMLElement).focus?.()
      }
    }
  }

  // Atajo Prime Time (18:00–22:00)
  const jumpToPrimeTime = () => {
    const target = (showOnlyOpen ? timeSlots.filter(s => s.isAvailable) : timeSlots)
      .find(s => {
        if (!s.startTime) return false
        const [sh] = s.startTime.split(':').map(Number)
        return sh >= 18 && sh < 22
      })
    if (target) {
      const el = document.getElementById(`slot-${target.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setExpandedSlot(target.id)
      setSelectedSlot(target)
      ;(el as HTMLElement).focus?.()
    }
  }


  // scrollToNextAvailable ahora está en el contexto global

  // Fallback seguro para evitar TypeError cuando aún no hay canchas cargadas
  const selectedCourtData =
    courts.find((court) => court.id === selectedCourt) ||
    courts[0] ||
    ({ id: 'unknown', name: 'Cancha' } as any)

  const availableDays = getNextDays(4)
  // getAvailableDays ahora está en el contexto global

  // currentBookings y pastBookings ahora están en el contexto global

  // Real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Calculate payment summaries
  const paymentSummary = {
    totalRevenue: adminBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    totalDeposits: adminBookings.reduce((sum, booking) => sum + booking.deposit, 0),
    pendingPayments: adminBookings.reduce(
      (sum, booking) => booking.players.filter((p) => !p.hasPaid).length * (booking.totalPrice / 4) + sum,
      0,
    ),
    completedBookings: adminBookings.filter((b) => b.status === "Completed").length,
    activeBookings: adminBookings.filter((b) => b.status === "Active").length,
    upcomingBookings: adminBookings.filter((b) => b.status === "Upcoming").length,
  }

  const courtSummary = adminBookings.reduce(
    (acc, booking) => {
      const court = booking.courtName
      if (!acc[court]) {
        acc[court] = { revenue: 0, bookings: 0 }
      }
      acc[court].revenue += booking.totalPrice
      acc[court].bookings += 1
      return acc
    },
    {} as Record<string, { revenue: number; bookings: number }>,
  )

  const handleSlotExpand = (slotId: string) => {
    setExpandedSlot(expandedSlot === slotId ? null : slotId)
    const slot = timeSlots.find(s => s.id === slotId)
    setSelectedSlot(slot || null)
  }

  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const createBookingApi = async (slot: any) => {
    const body = {
      courtId: selectedCourt,
      date: ymd(selectedDate),
      startTime: slot.startTime,
      endTime: slot.endTime,
    }
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  // handleSlotClick ahora está en el contexto global

  const handleConfirmReservation = async () => {
    try {
      if (!selectedSlotForConfirmation) return
      const data = await createBookingApi(selectedSlotForConfirmation)
      setNewBooking(data.booking)
      setShowConfirmationModal(false)
      setShowPaymentModal(true)
    } catch (e) {
      console.error("Error creando reserva:", e)
    }
  }

  const handleBookingClick = async () => {
    try {
      if (!selectedSlot) return
      const slot = selectedSlot
      const data = await createBookingApi(slot)
      setNewBooking(data.booking)
      setShowPaymentModal(true)
    } catch (e) {
      console.error("Error creando reserva:", e)
    }
  }

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false)
    setSelectedSlotForConfirmation(null)
  }

  const handlePayment = async () => {
    setPaymentProcessing(true)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setPaymentProcessing(false)
    setPaymentSuccess(true)

    // Close modal after success
    setTimeout(() => {
      setShowPaymentModal(false)
      setPaymentSuccess(false)
      setExpandedSlot(null)
      setSelectedSlot(null)
    }, 2000)
  }

  const closeModal = () => {
    setShowPaymentModal(false)
    setPaymentSuccess(false)
    setPaymentProcessing(false)
  }

  const navItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: Home,
      color: "text-[color:var(--color-neon-lime)]",
      activeColor: "text-[color:var(--color-neon-lime)]",
    },
    {
      id: "turnos",
      label: "Mis Turnos",
      icon: BookOpen,
      color: "text-[color:var(--electric-teal)]",
      activeColor: "text-[color:var(--electric-teal)]",
    },
  ]

  const handleCancelBooking = (bookingId: string) => {
    // In a real app, this would send a request to the backend to cancel the booking
    console.log(`Cancelling booking: ${bookingId}`)
    // TODO: Implement admin booking cancellation through API
    // Optionally, show a toast notification for success
  }

  const handleCancelUserBooking = (bookingId: string) => {
    // Cancel user booking from bookings
    try {
      // Actualizar el estado local de las reservas
      const updatedCurrentBookings = currentBookings.filter(booking => booking.id !== bookingId)
      const cancelledBooking = currentBookings.find(booking => booking.id === bookingId)
      
      if (cancelledBooking) {
        // Marcar como cancelada y mover al historial
        const cancelledBookingForHistory = {
          ...cancelledBooking,
          status: "Cancelled",
          type: "past"
        }
        
        // En una aplicación real, esto se haría a través de una API
        console.log(`Reserva ${bookingId} cancelada exitosamente`)
        
        // Mostrar notificación de éxito
        alert('Reserva cancelada exitosamente')
      }
    } catch (error) {
      console.error('Error al cancelar la reserva:', error)
      alert('Error al cancelar la reserva. Por favor, inténtalo de nuevo.')
    }
  }

  // Función para calcular si aplica reembolso (2 horas de antelación)
  const calculateRefundInfo = (booking: any) => {
    const now = new Date()
    const bookingDate = new Date(booking.date)
    const [startHour, startMinute] = booking.timeRange.split(' - ')[0].split(' ')[0].split(':')
    
    const bookingStartTime = new Date(bookingDate)
    bookingStartTime.setHours(parseInt(startHour), parseInt(startMinute))
    
    // Calcular diferencia en horas
    const timeDiffMs = bookingStartTime.getTime() - now.getTime()
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60)
    
    const canRefund = timeDiffHours >= 2
    const refundAmount = canRefund ? booking.deposit : 0
    
    return { canRefund, refundAmount, timeDiffHours }
  }

  // Función para abrir el modal de cancelación mejorado
  const handleOpenCancelModal = (booking: any) => {
    const { canRefund, refundAmount } = calculateRefundInfo(booking)
    setSelectedBookingForCancel(booking)
    setCanRefund(canRefund)
    setRefundAmount(refundAmount)
    setShowCancelModal(true)
  }

  // Función para confirmar la cancelación
  const handleConfirmCancellation = () => {
    if (selectedBookingForCancel) {
      // Aquí iría la lógica para cancelar la reserva en el backend
      console.log(`Cancelando reserva ${selectedBookingForCancel.id}`, {
        refundAmount,
        canRefund
      })
      
      // Simular actualización del estado local
      handleCancelUserBooking(selectedBookingForCancel.id)
      
      // Cerrar modal
      setShowCancelModal(false)
      setSelectedBookingForCancel(null)
      setCanRefund(false)
      setRefundAmount(0)
    }
  }

  // Función para cerrar el modal de cancelación
  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setSelectedBookingForCancel(null)
    setCanRefund(false)
    setRefundAmount(0)
  }

  // getCurrentBookingStatus y getRemainingTime ahora están en el contexto global

  const handleModifyBooking = (bookingId: string) => {
    // In a real app, this would open a form to modify the booking details
    console.log(`Modifying booking: ${bookingId}`)
    // For now, just a placeholder
  }

  const handlePlayerPaymentToggle = (bookingId: string, playerIndex: number, newPaidStatus: boolean) => {
    // TODO: Implement player payment toggle through API
    console.log(`Player ${playerIndex} payment status changed to ${newPaidStatus} for booking ${bookingId}`)
  }

  // Administration Panel Component
  const AdministrationPanel = () => {
    const filteredAdminBookings = adminBookings.filter((booking) =>
      selectedAdminDate ? booking.date.toDateString() === selectedAdminDate.toDateString() : true,
    )

    return (
      <div
        className={`min-h-screen pb-8 ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900" : "bg-gradient-to-br from-orange-50 via-white to-red-50"}`}
      >
        <div className="container mx-auto px-4 pt-2 pb-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <Button
              onClick={() => setActiveNavItem("inicio")}
              variant="outline"
              size="sm"
              className={`transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                  : "bg-white border-orange-300 text-orange-700 hover:bg-orange-50"
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Panel de Administración
              </h1>
              <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                Real-time court management and analytics
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <Card className={`border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Ingresos Totales
                    </p>
                    <p className="text-2xl font-bold text-green-600">${paymentSummary.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Reservas Activas
                    </p>
                    <p className="text-2xl font-bold text-blue-600">{paymentSummary.activeBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Pagos Pendientes
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${paymentSummary.pendingPayments.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Completadas Hoy
                    </p>
                    <p className="text-2xl font-bold text-purple-600">{paymentSummary.completedBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Real-time Bookings */}
            <div className="lg:col-span-2">
              <Card className={`border-0 shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    <Activity className="w-5 h-5 text-orange-600" />
                    Court Reservations
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Manage bookings for:{" "}
                      <span className="font-semibold">
                        {selectedAdminDate ? format(selectedAdminDate, "PPP") : "All Dates"}
                      </span>
                    </p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-[200px] justify-start text-left font-normal ${
                            !selectedAdminDate && "text-muted-foreground"
                          } ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                          data-testid="admin-date-picker-trigger"
                        >
                          <Calendar className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                          {selectedAdminDate ? format(selectedAdminDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={selectedAdminDate}
                          onSelect={setSelectedAdminDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3" data-testid="admin-bookings-list">
                    {filteredAdminBookings.length > 0 ? (
                      filteredAdminBookings.map((booking) => {
                        const individualPlayerAmount = booking.totalPrice / 4
                        return (
                          <div
                            key={booking.id}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              booking.status === "Active"
                                ? "border-green-200 bg-green-50"
                                : booking.status === "Upcoming"
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 bg-gray-50"
                            }`}
                            data-testid="admin-booking-item"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      booking.status === "Active"
                                        ? "bg-green-500 animate-pulse"
                                        : booking.status === "Upcoming"
                                          ? "bg-blue-500"
                                          : "bg-gray-400"
                                    }`}
                                  data-testid="admin-booking-status-indicator"
                                  ></div>
                                  <h3 className="font-semibold text-gray-900" data-testid="admin-booking-court">{booking.courtName}</h3>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getAdminStatusColor(booking.status)}`}
                                  data-testid="admin-booking-status"
                                  >
                                    {booking.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span data-testid="admin-booking-time">
                                      {booking.startTime} - {booking.endTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span data-testid="admin-booking-date">{formatShortDate(booking.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <BankIcon className="w-3 h-3" />
                                    <span data-testid="admin-booking-payment">{booking.paymentMethod}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} data-testid="admin-bookings-empty">
                        No bookings found for this date.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return slotsLoading ? (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
    </div>
  ) : (
    <div className="dashboard-theme font-sans">
      {/* Navbar con diseño de notch invertido */}
      <div className="fixed top-0 left-0 right-0 z-[80] bg-transparent">
        {/* Contenedor principal con flexbox */}
        <div className="flex items-start justify-between max-w-7xl mx-auto px-1 sm:px-2">
          
          {/* Sección izquierda: Información del usuario, botón salir y configuración */}
          <div className={`
            flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5
            rounded-b-2xl shadow-lg
            transition-all duration-300 hover:shadow-xl backdrop-blur-xl border border-border text-card-foreground
          `} style={{ backgroundColor: 'var(--navbar-bg)' }}>
            {/* Información del usuario */}
            <div className="text-xs sm:text-sm min-w-0">
              <div className="font-semibold sm:font-bold truncate max-w-[100px] sm:max-w-[150px]">
                {profile?.full_name || user?.email}
              </div>
              {isAdmin && (
                <div className="text-xs text-emerald-600 font-bold mt-0.5 bg-emerald-100 px-1 sm:px-2 py-0.5 rounded-full inline-block">
                  ADMIN
                </div>
              )}
            </div>
            
            {/* Divs de acción con dimensiones exactas de los botones */}
            <div className="flex gap-0.5 sm:gap-1">
              {/* Div Salir - mismas dimensiones que el botón */}
              <div
                className={`text-xs px-2 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-8 transition-all duration-200 border rounded-md flex items-center justify-center cursor-pointer hover:opacity-80 ${
                  isDarkMode 
                    ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" 
                    : "bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100"
                }`}
                aria-label="Cerrar sesión"
                title="Salir"
                onClick={async () => {
                  try {
                    await signOut()
                    router.push('/login')
                  } catch (error) {
                    console.error('Error al cerrar sesión:', error)
                  }
                }}
              >
                <span className="hidden sm:inline">Salir</span>
                <span className="sm:hidden">×</span>
              </div>
              
              {/* Div Configuración (solo para admins) - mismas dimensiones que el botón */}
              {isAdmin && (
                <div
                  className={`text-xs px-2 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-8 transition-all duration-200 border rounded-md flex items-center justify-center cursor-pointer hover:opacity-80 ${
                    isDarkMode 
                      ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" 
                      : "bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100"
                  }`}
                  aria-label="Acceder al panel de administración"
                  title="Panel de Administración"
                  onClick={() => {
                    if (isAdmin) {
                      router.push('/admin-panel/admin')
                    }
                  }}
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--color-neon-lime)' }} />
                </div>
              )}
            </div>
          </div>

          {/* Centro transparente - Efecto notch invertido */}
          <div className="flex-1 min-h-[3rem] sm:min-h-[3.5rem]" aria-hidden="true"></div>

          {/* Sección derecha: Botón de recarga y modo oscuro */}
          <div className={`
            flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5
            rounded-b-2xl shadow-lg
            transition-all duration-300 hover:shadow-xl
            ${isDarkMode ? "bg-gray-800 text-white shadow-gray-900/20" : "bg-white text-gray-900 shadow-gray-900/10"}
          `}>
            <div className="flex items-center gap-1 sm:gap-1.5 mr-1 sm:mr-2">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md overflow-hidden flex items-center justify-center shadow-sm ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <img src="/logo/padellisto.png" alt="PadelListo Logo" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
              </div>
              <span className="text-sm sm:text-base font-bold sm:font-extrabold tracking-tight">PadelListo</span>
            </div>
            {/* Div modo oscuro con dimensiones exactas del botón */}
            <div
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`transition-all duration-300 shadow-sm p-1.5 sm:p-2 h-7 sm:h-8 w-7 sm:w-8 border rounded-md flex items-center justify-center cursor-pointer hover:scale-105 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
              title={isDarkMode ? "Modo claro" : "Modo oscuro"}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsDarkMode(!isDarkMode);
                }
              }}
            >
              {isDarkMode ? (
                <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content with top padding to account for fixed header */}
      <div className="pt-14 sm:pt-16">
        {/* Main Booking Interface */}
        <HomeSection
          isVisible={activeNavItem !== "turnos" && activeNavItem !== "admin"}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}

          selectedCourt={selectedCourt}
          setSelectedCourt={setSelectedCourt}
          courts={courts}
          isUnifiedView={isUnifiedView}
          setIsUnifiedView={setIsUnifiedView}
          showOnlyOpen={showOnlyOpen}
          setShowOnlyOpen={setShowOnlyOpen}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          timeSlots={filteredTimeSlots}
          handleSlotClick={handleSlotClick}
          getAvailableDays={getAvailableDays}
          formatDate={formatDate}
          ratesByCourt={ratesByCourt}
          slotsForRender={slotsForRender}
          expandedSlot={expandedSlot}
          setExpandedSlot={setExpandedSlot}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          scrollToNextAvailable={scrollToNextAvailable}
          currentCourtName={currentCourtName}
          loading={slotsLoading}
          error={slotsError}
          onRetry={retrySlots}
        />









      {/* My Bookings Section */}
      <MisTurnos
        isVisible={activeNavItem === "turnos"}
        isDarkMode={isDarkMode}
        currentBookings={currentBookings}
        pastBookings={pastBookings}
        isLoading={slotsLoading}
        onBack={() => setActiveNavItem("inicio")}
        onStartBooking={() => {
          // Navegar a la sección de reservas para iniciar una nueva reserva
          setActiveNavItem("inicio")
          // Scroll hacia la sección de canchas disponibles
          setTimeout(() => {
            const courtSection = document.getElementById('courts-section')
            if (courtSection) {
              courtSection.scrollIntoView({ behavior: 'smooth' })
            }
          }, 100)
        }}
        onOpenCancelModal={handleOpenCancelModal}
        getCurrentBookingStatus={getCurrentBookingStatus}
        getRemainingTime={getRemainingTime}
        formatDate={formatDate}
        getPaymentStatusColor={getPaymentStatusColor}
        getStatusColor={getStatusColor}
      />

      {/* Administration Panel */}
      {activeNavItem === "admin" && <AdministrationPanel />}

      {/* Navigation */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4">
        <div className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-full shadow-2xl backdrop-blur-xl border border-border`} style={{ backgroundColor: 'var(--navbar-bg)' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNavItem === item.id
            // Ajustar el ancho dinámicamente basado en el número de elementos
            const dynamicWidth = navItems.length === 2 
              ? "min-w-[80px] sm:min-w-[100px] px-3 sm:px-4" 
              : "min-w-[60px] sm:min-w-[80px] px-2 sm:px-3"
            
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNavItem(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 ${dynamicWidth} py-1.5 sm:py-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? `${item.activeColor} bg-opacity-20 shadow-md`
                    : `${item.color} ${isDarkMode ? 'hover:bg-gray-700/40' : 'hover:bg-gray-100 hover:bg-opacity-50'}`
                }`}
                data-testid={`nav-${item.id}-btn`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? item.activeColor : item.color}`} />
                <span className={`text-xs sm:text-xs font-medium text-center leading-tight ${isActive ? item.activeColor : item.color}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={showConfirmationModal} onOpenChange={closeConfirmationModal}>
        <AlertDialogContent className={`max-w-sm sm:max-w-md mx-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Confirmar Reserva
            </AlertDialogTitle>
            <AlertDialogDescription className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              Revisa los detalles de tu reserva antes de continuar
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedSlotForConfirmation && (
            <div className="py-4">
              <div className="space-y-4">
                {/* Información de la cancha */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-center mb-3">
                    <h3 className="font-semibold text-lg">
                      {isUnifiedView && selectedSlotForConfirmation.courtName
                        ? selectedSlotForConfirmation.courtName
                        : courts.find(c => c.id === selectedCourt)?.name || 'Cancha 1'
                      }
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedSlotForConfirmation.timeRange}
                    </div>
                  </div>
                </div>

                {/* Detalles del precio */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fecha</span>
                    <span>{selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Precio por persona</span>
                    <span>${(selectedSlotForConfirmation.pricePerPerson ?? Math.round(((selectedSlotForConfirmation.finalPrice ?? selectedSlotForConfirmation.price ?? 24000) / 4))).toLocaleString()}</span>
                  </div>
                  <hr className={isDarkMode ? "border-gray-600" : "border-gray-200"} />
                  <div className="flex justify-between font-semibold">
                    <span>Total cancha (4 personas)</span>
                    <span className="text-lg">
                      ${(selectedSlotForConfirmation.finalPrice ?? selectedSlotForConfirmation.price ?? 24000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmationModal}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReservation}>
              <CreditCard className="w-4 h-4 mr-2" />
              Confirmar Reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      <AlertDialog open={showPaymentModal} onOpenChange={closeModal}>
        <AlertDialogContent className={`max-w-md ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {paymentSuccess ? "¡Reserva Confirmada!" : "Confirmar Reserva"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              {paymentSuccess ? (
                "Tu reserva ha sido confirmada exitosamente."
              ) : paymentProcessing ? (
                "Procesando pago..."
              ) : (
                `Confirma tu reserva para ${selectedCourtData?.name ?? 'Cancha'}`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!paymentSuccess && !paymentProcessing && newBooking && (
            <div className="py-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{formatDate(selectedDate.toISOString().split('T')[0])}</span>
                </div>
                <div className="flex justify-between">
                  <span>Horario:</span>
                  <span>{newBooking.startTime} - {newBooking.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancha:</span>
                  <span>{selectedCourtData?.name ?? 'Cancha'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${(newBooking.totalPrice || 24000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            {paymentSuccess ? (
              <AlertDialogAction onClick={closeModal}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Entendido
              </AlertDialogAction>
            ) : paymentProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              <>
                <AlertDialogCancel onClick={closeModal}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handlePayment}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirmar Pago
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Cancelación Mejorado */}
      <AlertDialog open={showCancelModal} onOpenChange={handleCloseCancelModal}>
        <AlertDialogContent className={`max-w-md ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <X className="w-5 h-5" />
              Cancelar Turno
            </AlertDialogTitle>
            <AlertDialogDescription className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              ¿Estás seguro de que deseas cancelar este turno?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedBookingForCancel && (
            <div className="py-4 space-y-4">
              {/* Detalles de la reserva */}
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-2">Detalles de la reserva:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Cancha:</span>
                    <span>{selectedBookingForCancel.courtName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{formatDate(selectedBookingForCancel.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Horario:</span>
                    <span>{selectedBookingForCancel.timeRange}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Seña pagada:</span>
                    <span>${selectedBookingForCancel.deposit?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Política de reembolso */}
              <div className={`p-3 rounded-lg border-l-4 ${
                canRefund 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              }`}>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  {canRefund ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  Política de Reembolso
                </h4>
                <p className="text-sm mb-2">
                  Si cancelas al menos 2 horas antes del horario del turno, se te devolverá la seña realizada. 
                  Si cancelas con menos de 2 horas de antelación, no se devolverá nada.
                </p>
                <div className={`font-semibold ${
                  canRefund ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {canRefund ? (
                    `✅ Reembolso: $${refundAmount.toLocaleString()}`
                  ) : (
                    '❌ Sin reembolso disponible'
                  )}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseCancelModal}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancellation}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  )
}

// Exportación nombrada para compatibilidad
export { PadelBookingPage }
export default PadelBookingPage
