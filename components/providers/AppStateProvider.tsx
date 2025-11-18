'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSlots, useMultipleSlots } from '../../hooks/useSlots'
import { useOptimizedSlots, useOptimizedMultipleSlots } from '../../hooks/useOptimizedSlots'
import { useDashboardRealTimeUpdates } from '../../hooks/useRealTimeUpdates'
import { TimeSlot, Court } from '../../types/types'
import { removeDuplicates, removeDuplicatesByKey } from '../../lib/utils/array-utils'

// Tipos para el estado global
type Player = {
  name: string
  hasPaid: boolean
}

type CourtBooking = {
  id: string
  courtName: string
  players: Player[]
  date: Date
  startTime: string
  endTime: string
  duration: number
  totalPrice: number
  deposit: number
  remainingPayment: number
  status: "Active" | "Upcoming" | "Completed"
  paymentStatus: "Deposit Paid" | "Fully Paid" | "Pending"
  paymentMethod: "Cash" | "Bank Transfer"
  bookingTime: Date
  endBookingTime: Date
}

// Los tipos Court y TimeSlot ahora se importan de @/types/types

// Interface del contexto
interface AppStateContextType {
  // Estado de navegaciÃ³n
  activeNavItem: string
  setActiveNavItem: (item: string) => void
  
  // Estado de modo oscuro
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
  
  // Estado de canchas
  courts: Court[]
  selectedCourt: string
  setSelectedCourt: (courtId: string) => void
  
  // Estado de fecha y slots
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  timeSlots: TimeSlot[]
  filteredTimeSlots: TimeSlot[]
  currentCourtName?: string
  
  // Estado de vista unificada
  isUnifiedView: boolean
  setIsUnifiedView: (unified: boolean) => void
  showOnlyOpen: boolean
  setShowOnlyOpen: (showOpen: boolean) => void
  
  // Estado de reservas
  currentBookings: any[]
  pastBookings: any[]
  adminBookings: CourtBooking[]
  
  // Estado de slots expandidos y seleccionados
  expandedSlot: string | null
  setExpandedSlot: (slotId: string | null) => void
  selectedSlot: TimeSlot | null
  setSelectedSlot: (slot: TimeSlot | null) => void
  
  // Estado de carga
  loading: boolean
  slotsLoading: boolean
  multipleSlotsLoading: boolean
  slotsError: string | null
  multipleSlotsError: string | null
  
  // Funciones auxiliares
  formatDate: (date: string) => string
  getCurrentBookingStatus: (booking: any) => 'active' | 'completed' | 'upcoming'
  getRemainingTime: (booking: any) => string
  getPaymentStatusColor: (status: string, isDarkMode?: boolean) => string
  getStatusColor: (status: string, type: string, isDarkMode?: boolean) => string
  
  // Funciones de slots
  retrySlots: () => void
  retryMultipleSlots: () => void
  refreshSlots: () => Promise<void>
  refreshMultipleSlots: () => Promise<void>
  refreshCourtSlots: (courtId: string) => Promise<void>
  isRefreshingSlots: boolean
  isRefreshingMultipleSlots: boolean
  
  // Datos calculados
  ratesByCourt: Record<string, number>
  slotsForRender: TimeSlot[]
  
  // Funciones de navegaciÃ³n
  scrollToNextAvailable: () => void
  getAvailableDays: () => Date[]
  
  // Funciones de manejo de slots
  handleSlotClick: (slot: TimeSlot) => void
  
  // Estado de actualizaciones en tiempo real
  isRealTimeConnected: boolean
  notification: {message: string, type: 'info' | 'success' | 'warning'} | null
  clearNotification: () => void
}

// Crear el contexto
const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState debe ser usado dentro de un AppStateProvider')
  }
  return context
}

// Datos mock (movidos del componente principal)
const mockBookings = [
  {
    id: "booking-1",
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    timeRange: "2:00 PM - 3:30 PM",
    courtName: "Cancha 1",
    location: "Downtown Sports Center",
    totalPrice: 24000,
    deposit: 12000,
    status: "Confirmed",
    type: "current",
    paymentStatus: "Paid",
  },
  {
    id: "booking-2",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    timeRange: "6:00 PM - 7:30 PM",
    courtName: "Cancha 2",
    location: "Downtown Sports Center",
    totalPrice: 24000,
    deposit: 12000,
    status: "Pending",
    type: "current",
    paymentStatus: "Deposit Paid",
  },
  {
    id: "booking-3",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    timeRange: "4:00 PM - 5:30 PM",
    courtName: "Cancha 3",
    location: "Downtown Sports Center",
    totalPrice: 24000,
    deposit: 12000,
    status: "Completed",
    type: "past",
    paymentStatus: "Paid",
  },
  {
    id: "booking-4",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    timeRange: "10:00 AM - 11:30 AM",
    courtName: "Cancha 1",
    location: "Downtown Sports Center",
    totalPrice: 24000,
    deposit: 12000,
    status: "Completed",
    type: "past",
    paymentStatus: "Paid",
  },
]

// Nota: hooks deben estar dentro del componente; se moverÃ¡n abajo

// Funciones auxiliares
const formatDate = (date: string) => {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCurrentBookingStatus = (booking: any): 'active' | 'completed' | 'upcoming' => {
  const now = new Date()
  const bookingDate = new Date(booking.date)
  const [startHour, startMinute] = booking.timeRange.split(' - ')[0].split(' ')[0].split(':')
  const [endHour, endMinute] = booking.timeRange.split(' - ')[1].split(' ')[0].split(':')
  
  const startTime = new Date(bookingDate)
  startTime.setHours(parseInt(startHour), parseInt(startMinute))
  
  const endTime = new Date(bookingDate)
  endTime.setHours(parseInt(endHour), parseInt(endMinute))
  
  if (now >= startTime && now <= endTime) {
    return 'active'
  } else if (now > endTime) {
    return 'completed'
  } else {
    return 'upcoming'
  }
}

const getRemainingTime = (booking: any) => {
  const now = new Date()
  
  // Convertir la fecha del booking a Date si es string
  const bookingDate = typeof booking.date === 'string' ? new Date(booking.date) : booking.date
  
  // Extraer la hora de fin del timeRange (formato: "2:00 PM - 3:30 PM")
  const timeRange = booking.timeRange || ''
  const endTimeStr = timeRange.split(' - ')[1] || ''
  
  if (!endTimeStr) return 'Hora no disponible'
  
  // Parsear la hora de fin
  const [time, period] = endTimeStr.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  
  let endHours = hours
  if (period === 'PM' && hours !== 12) endHours += 12
  if (period === 'AM' && hours === 12) endHours = 0
  
  // Crear la fecha y hora de fin completa
  const endDateTime = new Date(bookingDate)
  endDateTime.setHours(endHours, minutes, 0, 0)
  
  const diff = endDateTime.getTime() - now.getTime()
  
  if (diff <= 0) return 'Finalizado'
  
  const diffHours = Math.floor(diff / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m restantes`
  } else {
    return `${diffMinutes}m restantes`
  }
}

const getPaymentStatusColor = (paymentStatus: string, isDarkMode: boolean = false) => {
  if (isDarkMode) {
    switch (paymentStatus) {
      case "Fully Paid":
      case "Paid":
        return "text-green-300 bg-green-900/30 border border-green-700/50"
      case "Deposit Paid":
        return "text-yellow-300 bg-yellow-900/30 border border-yellow-700/50"
      case "Pending":
        return "text-red-300 bg-red-900/30 border border-red-700/50"
      default:
        return "text-gray-300 bg-gray-700/50 border border-gray-600/50"
    }
  } else {
    switch (paymentStatus) {
      case "Fully Paid":
      case "Paid":
        return "text-green-700 bg-green-100 border border-green-200"
      case "Deposit Paid":
        return "text-yellow-700 bg-yellow-100 border border-yellow-200"
      case "Pending":
        return "text-red-700 bg-red-100 border border-red-200"
      default:
        return "text-gray-700 bg-gray-100 border border-gray-200"
    }
  }
}

const getStatusColor = (status: string, type: string, isDarkMode: boolean = false) => {
  if (isDarkMode) {
    if (type === "past") {
      return "text-gray-400 bg-gray-700/50 border border-gray-600/50"
    }
    
    switch (status) {
      case "Confirmed":
      case "Active":
        return "text-green-300 bg-green-900/30 border border-green-700/50"
      case "Pending":
      case "Upcoming":
        return "text-yellow-300 bg-yellow-900/30 border border-yellow-700/50"
      case "Completed":
        return "text-blue-300 bg-blue-900/30 border border-blue-700/50"
      default:
        return "text-gray-300 bg-gray-700/50 border border-gray-600/50"
    }
  } else {
    if (type === "past") {
      return "text-gray-600 bg-gray-100 border border-gray-200"
    }
    
    switch (status) {
      case "Confirmed":
      case "Active":
        return "text-green-700 bg-green-100 border border-green-200"
      case "Pending":
      case "Upcoming":
        return "text-yellow-700 bg-yellow-100 border border-yellow-200"
      case "Completed":
        return "text-blue-700 bg-blue-100 border border-blue-200"
      default:
        return "text-gray-700 bg-gray-100 border border-gray-200"
    }
  }
}

// Proveedor del contexto
interface AppStateProviderProps {
  children: ReactNode
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  // Estados bÃ¡sicos
  const [activeNavItem, setActiveNavItem] = useState("inicio")
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState("")
  const [selectedDateState, setSelectedDateState] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  
  // Estabilizar la fecha para evitar re-renderizados
  const selectedDate = useMemo(() => {
    const date = new Date(selectedDateState)
    date.setHours(0, 0, 0, 0)
    return date
  }, [selectedDateState.getTime()])
  
  const setSelectedDate = (date: Date) => {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    setSelectedDateState(newDate)
  }
  const [isUnifiedView, setIsUnifiedView] = useState(true)
  const [showOnlyOpen, setShowOnlyOpen] = useState(true)
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loading] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success' | 'warning'} | null>(null)
  // Estado de canchas y carga inicial desde API
  const [courts, setCourts] = useState<Court[]>([])
  useEffect(() => {
    const controller = new AbortController()
    const loadCourts = async () => {
      try {
        const res = await fetch('/api/courts?view=public', { credentials: 'include', signal: controller.signal })
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data: Court[] = await res.json()
        setCourts(data)
        const firstActive = data.find(c => c.isActive !== false) || data[0]
        if (firstActive) setSelectedCourt(firstActive.id)
      } catch (err) {
        // Ignorar abortos de la peticiÃ³n para evitar ruido en consola durante Fast Refresh
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Error al cargar canchas:', err)
        setNotification({ message: 'Error al cargar canchas', type: 'warning' })
        setTimeout(() => setNotification(null), 3000)
      }
    }
    loadCourts()
    return () => controller.abort()
  }, [])
  
  // Hooks de slots (usando versiÃ³n optimizada)
   const {
     slots: rawSlots,
     loading: slotsLoading,
     error: slotsError,
     refreshSlots,
     isRefreshing: isRefreshingSlots,
     courtName: currentCourtName
   } = useOptimizedSlots(selectedCourt, selectedDate)

  // Convertir Slot[] a TimeSlot[] con useMemo para evitar recreaciÃ³n constante
  const timeSlots: TimeSlot[] = useMemo(() => {
    return rawSlots?.map(slot => ({
      id: slot.id,
      time: slot.startTime || '',
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      timeRange: `${slot.startTime || ''} - ${slot.endTime || ''}`,
      available: slot.isAvailable ?? false,
      isAvailable: slot.isAvailable ?? false,
      price: slot.price || 0,
      courtId: selectedCourt,
      courtName: currentCourtName,
      date: selectedDate,
      duration: 90
    })) || []
  }, [rawSlots, selectedCourt, currentCourtName, selectedDate])
  
  const {
     slotsByCourt: rawSlotsByCourt,
     ratesByCourt: hookRatesByCourt,
     loading: multipleSlotsLoading,
     error: multipleSlotsError,
     refreshAllSlots: refreshMultipleSlots,
     refreshCourtSlots,
     isRefreshing: isRefreshingMultipleSlots
   } = useOptimizedMultipleSlots(courts, selectedDate)
  
  // Manejar actualizaciones en tiempo real usando el hook unificado
  const shouldUseRealTime = true
  const handleNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setNotification({ message, type: type as 'info' | 'success' | 'warning' })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  const { isConnected } = useDashboardRealTimeUpdates({
    enabled: shouldUseRealTime,
    onDataUpdate: () => {
      if (isUnifiedView) {
        refreshMultipleSlots()
      } else {
        refreshSlots()
      }
      setNotification({ message: 'Precios actualizados automáticamente', type: 'success' })
      setTimeout(() => setNotification(null), 3000)
    },
    onNotification: handleNotification
  })
  
  
  
  // Estados derivados
  const [currentBookings, setCurrentBookings] = useState<any[]>([])
  const [pastBookings, setPastBookings] = useState<any[]>([])
  const adminBookings: CourtBooking[] = []

  useEffect(() => {
    const controller = new AbortController()
    const loadUserBookings = async () => {
      try {
        const res = await fetch('/api/bookings/user', { credentials: 'include', signal: controller.signal })
        if (!res.ok) {
          setCurrentBookings([])
          setPastBookings([])
          return
        }
        const data = await res.json()
        const list = Array.isArray(data) ? data : (Array.isArray(data?.bookings) ? data.bookings : (Array.isArray(data?.data) ? data.data : []))
        const now = new Date()
        const current = list.filter((b: any) => {
          const bd = new Date(b.bookingDate)
          const [sh, sm] = String(b.startTime || '00:00').split(':').map(Number)
          const [eh, em] = String(b.endTime || '00:00').split(':').map(Number)
          const start = new Date(bd); start.setHours(sh || 0, sm || 0, 0, 0)
          const end = new Date(bd); end.setHours(eh || 0, em || 0, 0, 0)
          return now <= end
        })
        const past = list.filter((b: any) => {
          const bd = new Date(b.bookingDate)
          const [eh, em] = String(b.endTime || '00:00').split(':').map(Number)
          const end = new Date(bd); end.setHours(eh || 0, em || 0, 0, 0)
          return now > end
        })
        setCurrentBookings(current)
        setPastBookings(past)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setCurrentBookings([])
        setPastBookings([])
      }
    }
    loadUserBookings()
    return () => controller.abort()
  }, [])
  
  // Filtrar slots segÃºn configuraciÃ³n - memoizado para evitar re-renderizados
  const filteredTimeSlots = useMemo(() => {
    const list = timeSlots || []
    if (!showOnlyOpen) return list
    const isToday = new Date().toDateString() === selectedDate.toDateString()
    return list.filter(slot => {
      const available = slot.isAvailable || slot.available
      if (!available) return false
      const start = slot.startTime || slot.time
      if (!isToday) return true
      if (!start) return false
      const [h, m] = String(start).split(':').map(Number)
      const slotDate = new Date(selectedDate)
      slotDate.setHours(h || 0, m || 0, 0, 0)
      return slotDate >= new Date()
    })
  }, [showOnlyOpen, timeSlots, selectedDate])
  
  // Las tarifas por cancha ahora vienen del hook useOptimizedMultipleSlots
  // Si no hay datos de tarifas del hook, usar valores por defecto
  const defaultRatesByCourt = useMemo(() => {
    return courts.reduce((acc, court) => {
      acc[court.id] = 0 // Fallback seguro como 0% mientras carga
      return acc
    }, {} as Record<string, number>)
  }, [courts])
  
  const finalRatesByCourt = Object.keys(hookRatesByCourt).length > 0 ? hookRatesByCourt : defaultRatesByCourt
  
  // Generar slots unificados combinando todas las canchas
  const unifiedTimeSlots = useMemo(() => {
    const allSlots: TimeSlot[] = []
    
    Object.entries(rawSlotsByCourt).forEach(([courtId, slots]) => {
      const court = courts.find(c => c.id === courtId)
      if (court && slots) {
        slots.forEach(slot => {
          allSlots.push({
            id: slot.id,
            time: slot.startTime || '',
            startTime: slot.startTime || '',
            endTime: slot.endTime || '',
            timeRange: `${slot.startTime || ''} - ${slot.endTime || ''}`,
            available: slot.isAvailable ?? false,
            isAvailable: slot.isAvailable ?? false,
            price: slot.price || 0,
            courtId: court.id,
            courtName: court.name,
            date: selectedDate,
            duration: 90
          })
        })
      }
    })
    
    // Ordenar por hora
    return allSlots.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0
      return a.startTime.localeCompare(b.startTime)
    })
  }, [rawSlotsByCourt, courts, selectedDate])

  // Slots para renderizar (unificado o individual) - memoizado para evitar re-renderizados
  const slotsForRender = useMemo(() => {
    if (isUnifiedView) {
      const list = unifiedTimeSlots || []
      if (!showOnlyOpen) return list
      const isToday = new Date().toDateString() === selectedDate.toDateString()
      return list.filter(s => {
        const available = s.isAvailable || s.available
        if (!available) return false
        const start = s.startTime || s.time
        if (!isToday) return true
        if (!start) return false
        const [h, m] = String(start).split(':').map(Number)
        const slotDate = new Date(selectedDate)
        slotDate.setHours(h || 0, m || 0, 0, 0)
        return slotDate >= new Date()
      })
    } else {
      return filteredTimeSlots || []
    }
  }, [isUnifiedView, unifiedTimeSlots, filteredTimeSlots, showOnlyOpen, selectedDate])
  
  // Persistir modo oscuro en localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode)
    }
  }, [isDarkMode])
  
  // Persistir preferencias de filtro en sessionStorage
  useEffect(() => {
    const savedShowOnlyOpen = sessionStorage.getItem('showOnlyOpen')
    if (savedShowOnlyOpen) {
      setShowOnlyOpen(JSON.parse(savedShowOnlyOpen))
    } else {
      setShowOnlyOpen(true)
    }
  }, [])
  
  useEffect(() => {
    sessionStorage.setItem('showOnlyOpen', JSON.stringify(showOnlyOpen))
  }, [showOnlyOpen])

  // Persistir fecha seleccionada en localStorage
  useEffect(() => {
    localStorage.setItem('selectedDate', selectedDate.toISOString())
  }, [selectedDate])
  
  // Funciones auxiliares
const scrollToNextAvailable = () => {
    try {
      const today = new Date().toDateString() === selectedDate.toDateString()
      const list = Array.isArray(slotsForRender) ? slotsForRender : []
      const candidates = (showOnlyOpen ? list.filter(s => s.isAvailable || s.available) : list)
      let target = null as any
      if (today) {
        const now = new Date()
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
        target = candidates.find(s => {
          const start = s.startTime || s.time
          if (!start) return false
          const [h, m] = String(start).split(':').map(Number)
          const startM = (h || 0) * 60 + (m || 0)
          return startM >= nowMinutes && (s.isAvailable || s.available)
        }) || candidates.find(s => s.isAvailable || s.available) || candidates[0]
      } else {
        target = candidates.find(s => s.isAvailable || s.available) || candidates[0]
      }
      if (!target) return
      const el = typeof document !== 'undefined' ? document.getElementById(`slot-${target.id}`) : null
      if (el && 'scrollIntoView' in el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setExpandedSlot(target.id)
      setSelectedSlot(target)
      ;(el as HTMLElement | null)?.focus?.()
      setTimeout(() => {
        setSelectedSlot((curr) => (curr && curr.id === target.id) ? null : curr)
      }, 1500)
    } catch (err) {
      // noop
    }
  }
  
  const getAvailableDays = () => {
    // Generar prÃ³ximos 7 dÃ­as (dÃ­a actual + 6 siguientes)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }
  
  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    // LÃ³gica adicional para manejar click en slot
  }
  
  const clearNotification = () => {
    setNotification(null)
  }
  
  // Valor del contexto
  const contextValue: AppStateContextType = {
    // Estado de navegaciÃ³n
    activeNavItem,
    setActiveNavItem,
    
    // Estado de modo oscuro
    isDarkMode,
    setIsDarkMode,
    
    // Estado de canchas
    courts,
    selectedCourt,
    setSelectedCourt,
    
    // Estado de fecha y slots
    selectedDate,
    setSelectedDate,
    timeSlots: timeSlots || [],
    filteredTimeSlots,
    
    // Estado de vista unificada
    isUnifiedView,
    setIsUnifiedView,
    showOnlyOpen,
    setShowOnlyOpen,
    
    // Estado de reservas
    currentBookings,
    pastBookings,
    adminBookings,
    
    // Estado de slots expandidos y seleccionados
    expandedSlot,
    setExpandedSlot,
    selectedSlot,
    setSelectedSlot,
    
    // Estado de carga
    loading,
    slotsLoading: isUnifiedView ? multipleSlotsLoading : slotsLoading,
    multipleSlotsLoading,
    slotsError: isUnifiedView ? multipleSlotsError : slotsError,
    multipleSlotsError,
    
    // Funciones auxiliares
    formatDate,
    getCurrentBookingStatus,
    getRemainingTime,
    getPaymentStatusColor,
    getStatusColor,
    
    // Funciones de slots
    retrySlots: isUnifiedView ? refreshMultipleSlots : refreshSlots,
     retryMultipleSlots: refreshMultipleSlots,
    refreshSlots,
    refreshMultipleSlots,
    refreshCourtSlots,
    isRefreshingSlots,
    isRefreshingMultipleSlots,
    
    // Datos calculados
    ratesByCourt: finalRatesByCourt,
    slotsForRender,
    
    // Funciones de navegaciÃ³n
    scrollToNextAvailable,
    getAvailableDays,
    
    // Funciones de manejo de slots
    handleSlotClick,
    
    // Nombre de la cancha actual
    currentCourtName,
    
    // Estado de actualizaciones en tiempo real
    isRealTimeConnected: isConnected,
    notification,
    clearNotification,
  }
  
  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  )
}

// Funciones auxiliares adicionales
const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit'
  })
}

const getAdminStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "text-green-600 bg-green-100"
    case "Upcoming":
      return "text-blue-600 bg-blue-100"
    case "Completed":
      return "text-gray-600 bg-gray-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}

const calculateRemainingTime = (endTime: Date) => {
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()
  
  if (diff <= 0) return "Finalizado"
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m restantes`
  }
  return `${minutes}m restantes`
}

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  
  // Horarios reservados de ejemplo para visualizaciÃ³n
  const reservedSlots = [
    '09:00', '10:30', '14:00', '16:30', '18:00', '19:30'
  ]
  
  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 90) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const endHour = minute === 30 ? hour + 2 : hour + 1
      const endMinute = minute === 30 ? 0 : 30
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
      
      // Marcar como no disponible si estÃ¡ en la lista de reservados
      const isReserved = reservedSlots.includes(time)
      const available = !isReserved && Math.random() > 0.2 // Algunos slots adicionales ocupados aleatoriamente
      
      slots.push({
        id: `slot-${hour}-${minute}`,
        time,
        startTime: time,
        endTime,
        timeRange: `${time} - ${endTime}`,
        available,
        isAvailable: available,
        price: 12000,
        courtId: 'cmew6nvsd0001u2jcngxgt8au',
        duration: 90
      })
    }
  }
  return slots
}

// Mapa de horarios reservados por cancha para la generaciÃ³n unificada
const reservedSlotsByCourtId: Record<string, string[]> = {
  'cmew6nvsd0001u2jcngxgt8au': ['09:00', '14:00', '18:00'],
  'cmew6nvsd0002u2jcc24nirbn': ['10:00', '15:30'],
  'cmew6nvi40000u2jcmer3av60': ['11:30', '17:30']
}

const generateUnifiedSlots = (courts: Court[], date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = []
  
  // Horarios completamente diferenciados por cancha
  const courtSchedules = {
    'cmew6nvsd0001u2jcngxgt8au': ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'], // Cancha 1: 6 turnos desde 9:00
    'cmew6nvsd0002u2jcc24nirbn': ['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'], // Cancha 2: 6 turnos desde 8:30
    'cmew6nvi40000u2jcmer3av60': ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30']  // Cancha 3: 6 turnos desde 10:00
  }
  
  courts.forEach(court => {
    const courtTimes = courtSchedules[court.id as keyof typeof courtSchedules] || ['09:00', '10:30', '12:00']
    const reservedTimes = reservedSlotsByCourtId[court.id as keyof typeof reservedSlotsByCourtId] || []
    
    courtTimes.forEach((time) => {
      const [hour, minute] = time.split(':').map(Number)
      const endHour = hour + 1
      const endMinute = minute + 30
      const finalEndHour = endMinute >= 60 ? endHour + 1 : endHour
      const finalEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute
      const endTime = `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`
      
      // Marcar como no disponible si estÃ¡ reservado
      const isReserved = reservedTimes.includes(time)
      const available = !isReserved && Math.random() > 0.1 // Algunos slots adicionales ocupados aleatoriamente
      
      slots.push({
        id: `${court.id}-${time}-${date.toISOString().split('T')[0]}`,
        time,
        startTime: time,
        endTime,
        timeRange: `${time} - ${endTime}`,
        available,
        isAvailable: available,
        price: Math.round(((court as any).basePrice ?? (court as any).base_price ?? 6000) * (court.priceMultiplier || 1)),
        courtId: court.id,
        courtName: court.name,
        date,
        duration: 90
      })
    })
  })
  
  // Ordenar por horario de inicio ascendente
  return slots.sort((a, b) => {
    const timeA = a.startTime || a.time
    const timeB = b.startTime || b.time
    return timeA.localeCompare(timeB)
  })
}

// Exportar funciones auxiliares
export { 
  formatDate,
  formatShortDate,
  getCurrentBookingStatus,
  getRemainingTime,
  getPaymentStatusColor,
  getStatusColor,
  getAdminStatusColor,
  calculateRemainingTime,
  generateUnifiedSlots,
  generateTimeSlots
}

// Exportar tipos
export type { Player, CourtBooking }

// FunciÃ³n getNextDays que faltaba
export const getNextDays = (count: number = 7) => {
  const days = []
  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    days.push(date)
  }
  return days
}
