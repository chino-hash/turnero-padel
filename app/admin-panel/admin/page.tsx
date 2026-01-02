/**
 * Página principal del panel de administración de turnos
 * Permite gestionar reservas, usuarios y estadísticas
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '../../../components/ui/popover'
import { splitEven } from '../../../lib/utils/extras'
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  BarChart3,
  Settings,
  RefreshCcw,
  X,
  MapPin,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useAppState } from '../../../components/providers/AppStateProvider'
import { useBookings } from '../../../hooks/useBookings'
import { useDashboardRealTimeUpdates } from '../../../hooks/useRealTimeUpdates'
import { toast } from 'react-hot-toast'

// Funciones auxiliares para colores
const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'Fully Paid':
      return 'bg-green-100 text-green-800'
    case 'Deposit Paid':
      return 'bg-yellow-100 text-yellow-800'
    case 'Pending':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800'
    case 'Upcoming':
      return 'bg-blue-100 text-blue-800'
    case 'Completed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Interfaces para los turnos
interface Booking {
  id: string
  courtName: string
  date: string
  timeRange: string
  userName: string
  userEmail: string
  status: 'confirmado' | 'pendiente' | 'cancelado' | 'completado'
  paymentStatus: 'pagado' | 'pendiente' | 'parcial'
  totalPrice: number
  createdAt: string
  closedAt?: string | null
  recurringId?: string | null
  players: {
    player1: string
    player2?: string
    player3?: string
    player4?: string
  }
  individualPayments: {
    player1: 'pagado' | 'pendiente'
    player2: 'pagado' | 'pendiente'
    player3: 'pagado' | 'pendiente'
    player4: 'pagado' | 'pendiente'
  }
  extras: Extra[]
  playerIds?: {
    player1?: string
    player2?: string
    player3?: string
    player4?: string
  }
}

interface Extra {
  id: string
  type: 'pelotas' | 'bebida' | 'paleta' | 'otro'
  name: string
  cost: number
  assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4'
}

export default function AdminDashboard() {
  const router = useRouter()
  const { courts, slotsForRender, isUnifiedView, selectedDate, setSelectedDate, refreshMultipleSlots, refreshSlots, isDarkMode } = useAppState()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [expandedExtras, setExpandedExtras] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)

  const [showExtrasModal, setShowExtrasModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [productos, setProductos] = useState<{ id: number; nombre: string; precio: number; stock: number; activo: boolean }[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [extraAssignedTo, setExtraAssignedTo] = useState<'all' | 'player1' | 'player2' | 'player3' | 'player4'>('all')
  const [selectedPlayers, setSelectedPlayers] = useState<("player1"|"player2"|"player3"|"player4")[]>(["player1","player2","player3","player4"])
  const [usersSummary, setUsersSummary] = useState<{ inactive30d: number; avgBookingsPerUser: number; upcoming7dUsers: number } | null>(null)

  const [prefs, setPrefs] = useState<{ mostrarCanchas: boolean; mostrarTurnos: boolean; mostrarUsuarios: boolean; mostrarProductos: boolean; mostrarFinanzas: boolean; orden: string }>(() => {
    if (typeof window === 'undefined') return { mostrarCanchas: true, mostrarTurnos: true, mostrarUsuarios: true, mostrarProductos: true, mostrarFinanzas: true, orden: 'importancia' }
    try {
      const raw = localStorage.getItem('adminSummaryPrefs')
      return raw ? JSON.parse(raw) : { mostrarCanchas: true, mostrarTurnos: true, mostrarUsuarios: true, mostrarProductos: true, mostrarFinanzas: true, orden: 'importancia' }
    } catch {
      return { mostrarCanchas: true, mostrarTurnos: true, mostrarUsuarios: true, mostrarProductos: true, mostrarFinanzas: true, orden: 'importancia' }
    }
  })

  const [showEditDashboardModal, setShowEditDashboardModal] = useState(false)
  const [dashboardSettingsId, setDashboardSettingsId] = useState<string | null>(null)
  const [dashboardTitle, setDashboardTitle] = useState('Resumen del Sistema')
  const [labelTurnosHoy, setLabelTurnosHoy] = useState('Turnos hoy')
  const [labelConfirmados, setLabelConfirmados] = useState('Confirmados')
  const [labelPagados, setLabelPagados] = useState('Pagados')
  const [labelIngresos, setLabelIngresos] = useState('Ingresos estimados')
  const [labelCanchas, setLabelCanchas] = useState('Canchas activas')
  const [currencyPrefix, setCurrencyPrefix] = useState('$')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [homeSettingsId, setHomeSettingsId] = useState<string | null>(null)
  const [homeLabelCourtName, setHomeLabelCourtName] = useState(() => {
    if (typeof window === 'undefined') return 'Nombre de la cancha'
    try {
      const raw = localStorage.getItem('home_card_settings_latest')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.labelCourtName || 'Nombre de la cancha'
      }
    } catch {}
    return 'Nombre de la cancha'
  })
  const [homeLocationName, setHomeLocationName] = useState(() => {
    if (typeof window === 'undefined') return 'Downtown Sports Center'
    try {
      const raw = localStorage.getItem('home_card_settings_latest')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.locationName || 'Downtown Sports Center'
      }
    } catch {}
    return 'Downtown Sports Center'
  })
  const [homeMapUrl, setHomeMapUrl] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const raw = localStorage.getItem('home_card_settings_latest')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.mapUrl || ''
      }
    } catch {}
    return ''
  })
  const [homeSessionText, setHomeSessionText] = useState(() => {
    if (typeof window === 'undefined') return '1:30 hour sessions'
    try {
      const raw = localStorage.getItem('home_card_settings_latest')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.sessionText || '1:30 hour sessions'
      }
    } catch {}
    return '1:30 hour sessions'
  })
  const [homeDescriptionText, setHomeDescriptionText] = useState(() => {
    if (typeof window === 'undefined') return 'Visualiza la disponibilidad del día actual para las tres canchas. Selecciona una para ver sus horarios y características.'
    try {
      const raw = localStorage.getItem('home_card_settings_latest')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.descriptionText || 'Visualiza la disponibilidad del día actual para las tres canchas. Selecciona una para ver sus horarios y características.'
      }
    } catch {}
    return 'Visualiza la disponibilidad del día actual para las tres canchas. Selecciona una para ver sus horarios y características.'
  })
  const [homeIconImage, setHomeIconImage] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      const raw = localStorage.getItem('home_card_settings_latest')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.iconImage || ''
      }
    } catch {}
    return ''
  })

  const todayRange = useMemo(() => {
    const start = new Date()
    start.setHours(0,0,0,0)
    const end = new Date()
    end.setHours(23,59,59,999)
    return { start: start.toISOString(), end: end.toISOString() }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date()
        const end7 = new Date(now)
        end7.setDate(now.getDate() + 7)
        const [estadRes, crudRes, upcomingRes] = await Promise.all([
          fetch('/api/estadisticas'),
          fetch('/api/crud/stats?model=user'),
          fetch(`/api/bookings?dateFrom=${encodeURIComponent(now.toISOString())}&dateTo=${encodeURIComponent(end7.toISOString())}&limit=200&sortOrder=asc`)
        ])
        const estad = await estadRes.json()
        const crud = await crudRes.json()
        const upcoming = await upcomingRes.json()
        const usuariosActivos = Number(estad?.data?.usuariosActivos || 0)
        const avg = Number(estad?.data?.promedioReservasPorUsuario || 0)
        const total = Number(
          crud?.data?.counts?.total ??
          crud?.data?.models?.user?.total ??
          0
        )
        const inactive30d = Math.max(0, total - usuariosActivos)
        const bookingsArr = Array.isArray(upcoming?.data)
          ? upcoming.data
          : Array.isArray(upcoming?.data?.data)
          ? upcoming.data.data
          : []
        const userIds = new Set(
          bookingsArr.map((b: any) => b?.user?.id ?? b?.userId).filter(Boolean)
        )
        const upcoming7dUsers = userIds.size
        setUsersSummary({ inactive30d, avgBookingsPerUser: avg, upcoming7dUsers })
      } catch {
        setUsersSummary({ inactive30d: 0, avgBookingsPerUser: 0, upcoming7dUsers: 0 })
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/crud/systemSetting?key=dashboard_settings&limit=1')
        const json = await res.json()
        const item = Array.isArray(json?.data?.items) ? json.data.items[0] : Array.isArray(json?.data) ? json.data[0] : null
        if (item) {
          setDashboardSettingsId(String(item.id))
          const valStr = String(item.value || '')
          try {
            const parsed = JSON.parse(valStr)
            setDashboardTitle(parsed?.title || 'Resumen del Sistema')
            setLabelTurnosHoy(parsed?.labels?.today || 'Turnos hoy')
            setLabelConfirmados(parsed?.labels?.confirmed || 'Confirmados')
            setLabelPagados(parsed?.labels?.paid || 'Pagados')
            setLabelIngresos(parsed?.labels?.incomes || 'Ingresos estimados')
            setLabelCanchas(parsed?.labels?.courts || 'Canchas activas')
            setCurrencyPrefix(parsed?.currencyPrefix || '$')
          } catch {}
        }
      } catch {}
      try {
        const res2 = await fetch('/api/crud/systemSetting?key=home_card_settings&limit=1')
        const json2 = await res2.json()
        const item2 = Array.isArray(json2?.data?.items) ? json2.data.items[0] : Array.isArray(json2?.data) ? json2.data[0] : null
        if (item2) {
          setHomeSettingsId(String(item2.id))
          const valStr2 = String(item2.value || '')
          try {
            const parsed2 = JSON.parse(valStr2)
            setHomeLabelCourtName(parsed2?.labelCourtName || 'Nombre de la cancha')
            setHomeLocationName(parsed2?.locationName || 'Downtown Sports Center')
            setHomeMapUrl(parsed2?.mapUrl || '')
            setHomeSessionText(parsed2?.sessionText || '1:30 hour sessions')
            setHomeDescriptionText(parsed2?.descriptionText || 'Visualiza la disponibilidad del día actual para las tres canchas. Selecciona una para ver sus horarios y características.')
            setHomeIconImage(parsed2?.iconImage || '')
          } catch {}
        }
      } catch {}
    }
    loadSettings()
  }, [])

  const bookingsApi = useBookings({ initialFilters: { limit: 50 }, autoFetch: true })

  useDashboardRealTimeUpdates({
    enabled: false,
    onDataUpdate: () => {
      bookingsApi.refreshBookings()
    }
  })

  const mockBookings: Booking[] = [
    {
      id: '1',
      courtName: 'Cancha 1',
      date: '2024-01-20',
      timeRange: '10:00 - 11:30',
      userName: 'Juan Pérez',
      userEmail: 'juan@email.com',
      status: 'confirmado',
      paymentStatus: 'parcial',
      totalPrice: 8000,
      createdAt: '2024-01-19T10:00:00Z',
      players: {
        player1: 'Juan Pérez',
        player2: 'María García',
        player3: 'Carlos López',
        player4: 'Ana Martín'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pagado',
        player3: 'pendiente',
        player4: 'pagado'
      },
      extras: [
        {
          id: 'extra1',
          type: 'pelotas',
          name: 'Pelotas Wilson',
          cost: 1500,
          assignedTo: 'all'
        }
      ]
    },
    {
      id: '2',
      courtName: 'Cancha 2',
      date: '2024-01-20',
      timeRange: '14:00 - 15:30',
      userName: 'Laura Sánchez',
      userEmail: 'laura@email.com',
      status: 'completado',
      paymentStatus: 'pagado',
      totalPrice: 9000,
      createdAt: '2024-01-19T14:00:00Z',
      closedAt: '2024-01-20T16:00:00Z',
      recurringId: null,
      players: {
        player1: 'Laura Sánchez',
        player2: 'Pedro Ruiz',
        player3: 'Sofia Torres',
        player4: 'Miguel Herrera'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pagado',
        player3: 'pagado',
        player4: 'pagado'
      },
      extras: []
    }
  ]



  // Funciones utilitarias
  const parseTimeRange = (timeRange: string) => {
    const [startStr, endStr] = timeRange.split(' - ').map(s => s.trim())
    return { startStr, endStr }
  }

  const getTimes = (booking: Booking) => {
    const { startStr, endStr } = parseTimeRange(booking.timeRange)
    const [y, m, d] = booking.date.split('-').map(Number)
    const [sh, sm] = (startStr || '00:00').split(':').map(Number)
    const [eh, em] = (endStr || '00:00').split(':').map(Number)
    const start = new Date(y || 1970, (m || 1) - 1, d || 1, sh || 0, sm || 0)
    const end = new Date(y || 1970, (m || 1) - 1, d || 1, eh || 0, em || 0)
    return { start, end }
  }

  const getCategory = (booking: Booking) => {
    const now = new Date()
    if (booking.recurringId) return 'fixed'
    if (booking.status === 'completado') {
      return booking.closedAt ? 'closed' : 'completed'
    }
    if (booking.status === 'confirmado') {
      const { start, end } = getTimes(booking)
      if (now < start) return 'confirmed'
      if (now >= start && now < end) return 'in_progress'
      return 'completed'
    }
    return 'other'
  }

  const groupByCategory = (list: Booking[]) => {
    const groups: Record<string, Booking[]> = { fixed: [], confirmed: [], in_progress: [], completed: [], closed: [], other: [] }
    list.forEach(b => {
      const c = getCategory(b)
      groups[c].push(b)
    })
    return groups
  }

  const mapStatusToSpanish = (status: string): Booking['status'] => {
    const s = String(status || '').toUpperCase()
    switch (s) {
      case 'CONFIRMED':
        return 'confirmado'
      case 'PENDING':
        return 'pendiente'
      case 'CANCELLED':
        return 'cancelado'
      case 'COMPLETED':
        return 'completado'
      case 'ACTIVE':
        return 'confirmado'
      default:
        return 'pendiente'
    }
  }

  const mapPaymentStatusToSpanish = (paymentStatus: string | null | undefined): Booking['paymentStatus'] => {
    const s = String(paymentStatus || '').toUpperCase()
    switch (s) {
      case 'FULLY_PAID':
      case 'PAID':
        return 'pagado'
      case 'DEPOSIT_PAID':
      case 'PARTIAL':
        return 'parcial'
      case 'PENDING':
      default:
        return 'pendiente'
    }
  }

  const mapApiBookingToLocal = (apiBooking: any): Booking => {
    const playersArr: Array<any> = Array.isArray(apiBooking?.players) ? apiBooking.players : []
    const sorted = playersArr.slice().sort((a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0))
    const playersObj: Booking['players'] = {
      player1: String(sorted[0]?.playerName || ''),
      player2: String(sorted[1]?.playerName || ''),
      player3: String(sorted[2]?.playerName || ''),
      player4: String(sorted[3]?.playerName || ''),
    }
    const playerIdsObj: Booking['playerIds'] = {
      player1: String(sorted[0]?.id || ''),
      player2: String(sorted[1]?.id || ''),
      player3: String(sorted[2]?.id || ''),
      player4: String(sorted[3]?.id || ''),
    }
    const individualPayments: Booking['individualPayments'] = {
      player1: sorted[0]?.hasPaid ? 'pagado' : 'pendiente',
      player2: sorted[1]?.hasPaid ? 'pagado' : 'pendiente',
      player3: sorted[2]?.hasPaid ? 'pagado' : 'pendiente',
      player4: sorted[3]?.hasPaid ? 'pagado' : 'pendiente',
    }
    const extrasArr: Array<any> = Array.isArray(apiBooking?.extras) ? apiBooking.extras : []
    const extrasMapped: Extra[] = extrasArr
      .filter(e => !e?.deletedAt)
      .map(e => ({
        id: String(e.id),
        type: 'pelotas',
        name: String(e?.producto?.nombre || 'Extra'),
        cost: Number(e.totalPrice || 0),
        assignedTo: e.assignedToAll
          ? 'all'
          : (e?.player?.position === 1
              ? 'player1'
              : e?.player?.position === 2
              ? 'player2'
              : e?.player?.position === 3
              ? 'player3'
              : e?.player?.position === 4
              ? 'player4'
              : 'player1')
      }))

    const dateStr = String(apiBooking?.bookingDate || '').split('T')[0] || String(apiBooking?.bookingDate || '')
    const start = String(apiBooking?.startTime || '').trim()
    const end = String(apiBooking?.endTime || '').trim()

    return {
      id: String(apiBooking?.id || ''),
      courtName: String(apiBooking?.court?.name || 'Cancha'),
      date: dateStr,
      timeRange: `${start} - ${end}`,
      userName: String(apiBooking?.user?.name || 'Usuario'),
      userEmail: String(apiBooking?.user?.email || ''),
      status: mapStatusToSpanish(apiBooking?.status),
      paymentStatus: mapPaymentStatusToSpanish(apiBooking?.paymentStatus),
      totalPrice: Number(apiBooking?.totalPrice || 0),
      createdAt: String(apiBooking?.createdAt || new Date().toISOString()),
      closedAt: apiBooking?.closedAt ? String(apiBooking.closedAt) : null,
      recurringId: apiBooking?.recurringId ? String(apiBooking.recurringId) : null,
      players: playersObj,
      playerIds: playerIdsObj,
      individualPayments,
      extras: extrasMapped,
    }
  }
  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId)
  }

  const toggleExtrasExpansion = (bookingId: string) => {
    setExpandedExtras(expandedExtras === bookingId ? null : bookingId)
  }

  // Funciones para gestión de extras
  const addExtra = async (bookingId: string, productoId: number, quantity: number, assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4', notes?: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return
    const assignedToAll = assignedTo === 'all'
    const playerKey = assignedTo === 'all' ? undefined : assignedTo
    const playerId = playerKey ? booking.playerIds?.[playerKey] || undefined : undefined
    const res = await fetch(`/api/bookings/${bookingId}/extras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId, quantity, assignedToAll, playerId, notes })
    })
    const data = await res.json()
    if (res.ok && data?.success && data?.data) {
      const mapped = mapApiBookingToLocal(data.data)
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b))
      setFilteredBookings(prev => prev.map(b => b.id === bookingId ? mapped : b))
    }
  }

  const removeExtra = async (bookingId: string, extraId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/extras/${extraId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok && data?.success && data?.data) {
      const mapped = mapApiBookingToLocal(data.data)
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b))
      setFilteredBookings(prev => prev.map(b => b.id === bookingId ? mapped : b))
    }
  }

  const openExtrasModal = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setShowExtrasModal(true)
    setSelectedProductId(null)
    setQuantity(1)
    setExtraAssignedTo('all')
  }

  const closeExtrasModal = () => {
    setShowExtrasModal(false)
    setSelectedBookingId(null)
    setSelectedProductId(null)
    setQuantity(1)
    setExtraAssignedTo('all')
  }

  // Bloqueo de scroll del documento cuando hay modales abiertos
  useEffect(() => {
    const hasOpenModal = showExtrasModal || showFilterModal
    if (hasOpenModal) {
      const prevDocOverflow = document.documentElement.style.overflow
      const prevBodyOverflow = document.body.style.overflow
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'

      return () => {
        document.documentElement.style.overflow = prevDocOverflow || ''
        document.body.style.overflow = prevBodyOverflow || ''
      }
    }
  }, [showExtrasModal, showFilterModal])

  const handleAddExtra = () => {
    if (!selectedBookingId || !selectedProductId || quantity <= 0) return
    const producto = productos.find(p => p.id === selectedProductId)
    if (!producto) return
    if (selectedPlayers.length > 1 && selectedPlayers.length < 4) {
      const total = producto.precio * quantity
      const parts = splitEven(total, selectedPlayers.length)
      setBookings(prev => prev.map(b => {
        if (b.id !== selectedBookingId) return b
        const newExtras = selectedPlayers.map((p, idx) => ({
          id: `${Date.now()}-${p}-${idx}`,
          type: 'otro' as const,
          name: producto.nombre,
          cost: parts[idx],
          assignedTo: p as any
        }))
        return { ...b, extras: [...b.extras, ...newExtras] }
      }))
      setFilteredBookings(prev => prev.map(b => {
        if (b.id !== selectedBookingId) return b
        const newExtras = selectedPlayers.map((p, idx) => ({
          id: `${Date.now()}-${p}-${idx}`,
          type: 'otro' as const,
          name: producto.nombre,
          cost: parts[idx],
          assignedTo: p as any
        }))
        return { ...b, extras: [...b.extras, ...newExtras] }
      }))
      closeExtrasModal()
      return
    }
    addExtra(selectedBookingId, selectedProductId, quantity, selectedPlayers.length === 4 ? 'all' : extraAssignedTo)
    closeExtrasModal()
  }

  // Cargar productos al abrir el modal de extras
  useEffect(() => {
    const loadProductos = async () => {
      try {
        const res = await fetch('/api/productos')
        const data = await res.json()
        const productosArr = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []

        const normalized = productosArr.map((p: any) => ({
          id: Number(p.id),
          nombre: String(p.nombre ?? p.name ?? 'Producto'),
          precio: Number(p.precio ?? p.price ?? 0),
          stock: Number(p.stock ?? 0),
          activo: Boolean(p.activo ?? true),
        }))
        setProductos(normalized)
      } catch (e) {
        console.warn('No se pudieron cargar productos en /api/productos')
        setProductos([])
      }
    }
    if (showExtrasModal) loadProductos()
  }, [showExtrasModal])

  const togglePlayerPayment = async (bookingId: string, playerKey: keyof Booking['individualPayments']) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return
    const position = playerKey === 'player1' ? 1 : playerKey === 'player2' ? 2 : playerKey === 'player3' ? 3 : 4
    const current = booking.individualPayments[playerKey]
    const hasPaid = current !== 'pagado'
    const res = await fetch(`/api/bookings/${bookingId}/players/position/${position}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasPaid })
    })
    const json = await res.json()
    if (res.ok && json?.success && json?.data) {
      const mapped = mapApiBookingToLocal(json.data)
      setBookings(prev => prev.map(b => b.id === bookingId ? mapped : b))
      setFilteredBookings(prev => prev.map(b => b.id === bookingId ? mapped : b))
    }
  }

  const calculatePlayerAmount = (booking: Booking, playerKey: keyof Booking['players']) => {
    const baseAmount = booking.totalPrice / 4
    const playerExtras = booking.extras.filter(extra => 
      extra.assignedTo === 'all' || extra.assignedTo === playerKey
    )
    const extrasAmount = playerExtras.reduce((sum, extra) => {
      return sum + (extra.assignedTo === 'all' ? extra.cost / 4 : extra.cost)
    }, 0)
    return baseAmount + extrasAmount
  }

  useEffect(() => {
    const list = Array.isArray(bookingsApi.bookings) ? bookingsApi.bookings : []
    if (list.length > 0) {
      const mapped = list.map(mapApiBookingToLocal)
      setBookings(mapped as any)
      setFilteredBookings(mapped as any)
    } else {
      setBookings(mockBookings)
      setFilteredBookings(mockBookings)
    }
  }, [bookingsApi.bookings])

  useEffect(() => {
    try {
      localStorage.setItem('adminSummaryPrefs', JSON.stringify(prefs))
    } catch {}
  }, [prefs])

  // Filtrar reservas
  useEffect(() => {
    let filtered = bookings

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.courtName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    if (dateFilter !== 'all') {
      const today = new Date()
      const bookingDate = new Date()
      
      filtered = filtered.filter(booking => {
        const bDate = new Date(booking.date)
        switch (dateFilter) {
          case 'today':
            return bDate.toDateString() === today.toDateString()
          case 'week':
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            return bDate >= weekStart && bDate <= weekEnd
          case 'month':
            return bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear()
          default:
            return true
        }
      })
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, dateFilter])

  const buildDemoBookingsForDay = (dateStr: string): Booking[] => {
    const d = dateStr
    return [
      { id: 'd1', courtName: 'Cancha 1', date: d, timeRange: '08:00 - 09:30', userName: 'Demo 1', userEmail: '', status: 'confirmado', paymentStatus: 'parcial', totalPrice: 0, createdAt: d + 'T00:00:00Z', players: { player1: '', player2: '', player3: '', player4: '' }, individualPayments: { player1: 'pendiente', player2: 'pendiente', player3: 'pendiente', player4: 'pendiente' }, extras: [] },
      { id: 'd2', courtName: 'Cancha 1', date: d, timeRange: '11:00 - 12:30', userName: 'Demo 2', userEmail: '', status: 'confirmado', paymentStatus: 'pendiente', totalPrice: 0, createdAt: d + 'T00:00:00Z', players: { player1: '', player2: '', player3: '', player4: '' }, individualPayments: { player1: 'pendiente', player2: 'pendiente', player3: 'pendiente', player4: 'pendiente' }, extras: [] },
      { id: 'd3', courtName: 'Cancha 2', date: d, timeRange: '09:30 - 11:00', userName: 'Demo 3', userEmail: '', status: 'confirmado', paymentStatus: 'pendiente', totalPrice: 0, createdAt: d + 'T00:00:00Z', players: { player1: '', player2: '', player3: '', player4: '' }, individualPayments: { player1: 'pendiente', player2: 'pendiente', player3: 'pendiente', player4: 'pendiente' }, extras: [] },
      { id: 'd4', courtName: 'Cancha 2', date: d, timeRange: '14:00 - 15:30', userName: 'Demo 4', userEmail: '', status: 'confirmado', paymentStatus: 'pendiente', totalPrice: 0, createdAt: d + 'T00:00:00Z', players: { player1: '', player2: '', player3: '', player4: '' }, individualPayments: { player1: 'pendiente', player2: 'pendiente', player3: 'pendiente', player4: 'pendiente' }, extras: [] },
      { id: 'd5', courtName: 'Cancha 3', date: d, timeRange: '16:30 - 18:00', userName: 'Demo 5', userEmail: '', status: 'confirmado', paymentStatus: 'pendiente', totalPrice: 0, createdAt: d + 'T00:00:00Z', players: { player1: '', player2: '', player3: '', player4: '' }, individualPayments: { player1: 'pendiente', player2: 'pendiente', player3: 'pendiente', player4: 'pendiente' }, extras: [] },
      { id: 'd6', courtName: 'Cancha 3', date: d, timeRange: '19:30 - 21:00', userName: 'Demo 6', userEmail: '', status: 'confirmado', paymentStatus: 'pendiente', totalPrice: 0, createdAt: d + 'T00:00:00Z', players: { player1: '', player2: '', player3: '', player4: '' }, individualPayments: { player1: 'pendiente', player2: 'pendiente', player3: 'pendiente', player4: 'pendiente' }, extras: [] }
    ] as any
  }


  const isToday = useMemo(() => {
    const t = new Date(); t.setHours(0,0,0,0)
    const d = new Date(selectedDate); d.setHours(0,0,0,0)
    return d.getTime() === t.getTime()
  }, [selectedDate])

  const toggleDay = () => {
    const base = new Date(selectedDate)
    const next = new Date(base)
    next.setDate(base.getDate() + (isToday ? 1 : -1))
    next.setHours(0,0,0,0)
    setSelectedDate(next)
  }


  return (
    <div className="p-6 space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Panel de Administración</h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">Resumen general y accesos rápidos a todas las secciones.</p>
          <p className="text-muted-foreground mt-1">Última actualización: {new Date().toLocaleString('es-ES')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilterModal(true)} className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Preferencias
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{dashboardTitle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#55C5FF] dark:text-[#55C5FF]">{filteredBookings.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{labelTurnosHoy}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4ECDC4] dark:text-[#4ECDC4]">{filteredBookings.filter(b => b.status === 'confirmado').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{labelConfirmados}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#AE88D7] dark:text-[#AE88D7]">{filteredBookings.filter(b => b.paymentStatus === 'pagado').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{labelPagados}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FFB347] dark:text-[#FFB347]">{currencyPrefix}{filteredBookings.reduce((sum, b) => sum + b.totalPrice + b.extras.reduce((eSum, e) => eSum + e.cost, 0), 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{labelIngresos}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#A7D7C5] dark:text-[#A7D7C5]">{courts.filter((c: any) => c.isActive !== false).length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{labelCanchas}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Editar información del dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="mb-2" htmlFor="home-label-court">Nombre de la cancha (etiqueta)</Label>
              <Input id="home-label-court" value={homeLabelCourtName} onChange={(e) => setHomeLabelCourtName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="mb-2" htmlFor="home-location-name">Dirección / Nombre del lugar</Label>
                <Input id="home-location-name" value={homeLocationName} onChange={(e) => setHomeLocationName(e.target.value)} />
              </div>
              <div>
                <Label className="mb-2" htmlFor="home-map-url">URL de Google Maps</Label>
                <Input id="home-map-url" value={homeMapUrl} onChange={(e) => setHomeMapUrl(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="mb-2" htmlFor="home-session-text">Horarios / Duración</Label>
              <Input id="home-session-text" value={homeSessionText} onChange={(e) => setHomeSessionText(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2" htmlFor="home-description-text">Información visible</Label>
              <Input id="home-description-text" value={homeDescriptionText} onChange={(e) => setHomeDescriptionText(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="mb-2" htmlFor="home-icon-file">Imagen del icono</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const result = reader.result
                    if (typeof result === 'string') setHomeIconImage(result)
                  }
                  reader.readAsDataURL(file)
                }}
                id="home-icon-file"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {homeIconImage && (
                <div className="mt-2">
                  <img src={homeIconImage} alt="Previsualización" className="w-16 h-16 object-cover rounded-md border" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={async () => {
                  const homePayload = {
                    labelCourtName: homeLabelCourtName.trim(),
                    locationName: homeLocationName.trim(),
                    mapUrl: homeMapUrl.trim(),
                    sessionText: homeSessionText.trim(),
                    descriptionText: homeDescriptionText.trim(),
                    iconImage: homeIconImage.trim()
                  }
                  try {
                    localStorage.setItem('home_card_settings_latest', JSON.stringify(homePayload))
                    localStorage.setItem('home_card_settings_updated_at', String(Date.now()))
                    window.dispatchEvent(new Event('home_card_settings_updated'))
                  } catch {}
                  try {
                    let resHome
                    if (homeSettingsId) {
                      resHome = await fetch(`/api/crud/systemSetting/${homeSettingsId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          value: JSON.stringify(homePayload),
                          dataType: 'JSON',
                          description: 'Configuración de tarjeta principal',
                          category: 'home_card'
                        })
                      })
                    } else {
                      resHome = await fetch('/api/crud/systemSetting', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          key: 'home_card_settings',
                          value: JSON.stringify(homePayload),
                          dataType: 'JSON',
                          description: 'Configuración de tarjeta principal',
                          category: 'home_card',
                          isPublic: true
                        })
                      })
                    }
                    const jsonHome = await resHome.json()
                    if (resHome.ok && jsonHome?.success) {
                      if (!homeSettingsId && jsonHome?.data?.id) setHomeSettingsId(String(jsonHome.data.id))
                      try {
                        const homePayload = {
                          labelCourtName: homeLabelCourtName.trim(),
                          locationName: homeLocationName.trim(),
                          mapUrl: homeMapUrl.trim(),
                          sessionText: homeSessionText.trim(),
                          descriptionText: homeDescriptionText.trim(),
                          iconImage: homeIconImage.trim()
                        }
                        localStorage.setItem('home_card_settings_latest', JSON.stringify(homePayload))
                        localStorage.setItem('home_card_settings_updated_at', String(Date.now()))
                        window.dispatchEvent(new Event('home_card_settings_updated'))
                        fetch('/api/admin/test-event', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'admin_change', message: 'home_card_settings updated', key: 'home_card_settings' })
                        }).catch(() => {})
                      } catch {}
                      toast.success('Cambios guardados')
                    } else {
                      toast.error(String(jsonHome?.error || 'Error al guardar tarjeta principal'))
                    }
                  } catch (e) {
                    toast.error('Error de conexión al guardar')
                  }
                }} 
              >
                Guardar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>



      
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {prefs.mostrarCanchas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Canchas</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Activas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{courts.filter((c: any) => c.isActive !== false).length}</p>
                  <div className="mt-2 space-y-1">
                    {courts.map((c: any) => (
                      <div key={c.id} className="text-xs text-muted-foreground">{c.name}: ${Math.round(((c.basePrice ?? 0) * (c.priceMultiplier ?? 1))).toLocaleString()}</div>
                    ))}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm"><Link href="/admin-panel/admin/canchas">Ver</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
        {prefs.mostrarTurnos && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Turnos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredBookings.length}</p>
                </div>
                <Button asChild variant="outline" size="sm"><Link href="/admin-panel/admin/turnos">Ver</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
        {prefs.mostrarUsuarios && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{usersSummary ? usersSummary.avgBookingsPerUser.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}</p>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">Inactivos 30d: {usersSummary ? usersSummary.inactive30d : '—'}</div>
                    <div className="text-xs text-muted-foreground">Próximos 7d: {usersSummary ? usersSummary.upcoming7dUsers : '—'}</div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm"><Link href="/admin-panel/admin/usuarios">Ver</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
        {prefs.mostrarFinanzas && (
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currencyPrefix}{filteredBookings.reduce((sum, b) => sum + b.totalPrice + b.extras.reduce((eSum, e) => eSum + e.cost, 0), 0).toLocaleString()}</p>
              </div>
              <Button asChild variant="outline" size="sm"><Link href="/admin-panel/estadisticas">Ver</Link></Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Vista rápida de turnos por categorías (compacta) */}
      <div className="space-y-6" data-testid="admin-bookings-compact">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Vista rápida de turnos
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilterModal(true)} className="flex items-center gap-2" data-testid="admin-filters-open-btn">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin-panel/admin/turnos">Ver sección de turnos</Link></Button>
          </div>
        </div>

        {(() => {
          const groups = groupByCategory(filteredBookings)
          const renderGroup = (title: string, key: keyof typeof groups) => (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-muted-foreground">{title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{groups[key].length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                {groups[key].length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sin elementos</div>
                ) : (
                  <div className="space-y-2">
                    {groups[key].slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center justify-between px-2 py-2 border rounded-md dark:border-gray-800">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{b.courtName}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{b.timeRange}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 dark:text-gray-300">{b.userName}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            key === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            key === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' :
                            b.status === 'confirmado' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            b.status === 'completado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            b.status === 'cancelado' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>{key === 'completed' ? 'completado' : key === 'closed' ? 'finalizado' : b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {renderGroup('TURNOS FIJOS', 'fixed')}
              {renderGroup('TURNOS CONFIRMADOS', 'confirmed')}
              {renderGroup('EN CURSO', 'in_progress')}
              {renderGroup('COMPLETADOS', 'completed')}
              {renderGroup('FINALIZADOS', 'closed')}
            </div>
          )
        })()}
      </div>

      {/* Modal de Filtros y Preferencias */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" data-testid="filters-modal">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Filtros y Preferencias</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilterModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">

                {/* Filtro por estado */}
                <div className="space-y-2">
                <label htmlFor="modal-status-filter" className="text-sm font-medium text-foreground">
                  Estado del turno
                </label>
                <select
                  id="modal-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  data-testid="filters-status-select"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Personalización del resumen</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarCanchas} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarCanchas: e.target.checked }))} />Canchas</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarTurnos} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarTurnos: e.target.checked }))} />Turnos</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarUsuarios} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarUsuarios: e.target.checked }))} />Usuarios</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarProductos} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarProductos: e.target.checked }))} />Productos</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarFinanzas} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarFinanzas: e.target.checked }))} />Finanzas</label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Orden</label>
                <Select value={prefs.orden} onValueChange={(v) => setPrefs(prev => ({ ...prev, orden: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="importancia">Por importancia</SelectItem>
                    <SelectItem value="alfabetico">Alfabético</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Extras */}
      {showExtrasModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Agregar Extra</h3>
              <Button variant="ghost" size="sm" onClick={closeExtrasModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Producto</label>
                <Select
                  value={selectedProductId !== null ? String(selectedProductId) : ""}
                  onValueChange={(value) => setSelectedProductId(value ? Number(value) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)} disabled={!p.activo || p.stock <= 0}>
                        {p.nombre} {p.stock > 0 ? `(Stock: ${p.stock})` : '(Sin stock)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cantidad</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  disabled={!selectedProductId}
                  onChange={(e) => {
                    if (!selectedProductId) return
                    setQuantity(Math.max(1, Number(e.target.value)))
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Asignado a</label>
                <Popover>
                  <PopoverTrigger className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm w-full">
                    <span className="line-clamp-1">
                      {selectedPlayers.length === 4
                        ? 'Todos los jugadores'
                        : selectedPlayers.length === 1
                          ? `${selectedPlayers[0] === 'player1' ? 'Titular' : selectedPlayers[0] === 'player2' ? 'Jugador 2' : selectedPlayers[0] === 'player3' ? 'Jugador 3' : 'Jugador 4'}`
                          : `Compartido por ${selectedPlayers.map(p => (
                              p === 'player1' ? 'J1' : p === 'player2' ? 'J2' : p === 'player3' ? 'J3' : 'J4'
                            )).join(' y ')}`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <button
                        type="button"
                        className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-sm ${selectedPlayers.length === 4 ? 'bg-accent text-accent-foreground' : ''}`}
                        onClick={() => {
                          setSelectedPlayers(selectedPlayers.length === 4 ? [] : ["player1","player2","player3","player4"]) 
                          setExtraAssignedTo(selectedPlayers.length === 4 ? 'player1' : 'all')
                        }}
                      >
                        <span>Todos los jugadores</span>
                        <input type="checkbox" checked={selectedPlayers.length === 4} readOnly className="h-4 w-4" />
                      </button>
                      {(["player1","player2","player3","player4"] as const).map((p, idx) => {
                        const label = idx === 0 ? 'Titular' : `Jugador ${idx+1}`
                        const checked = selectedPlayers.includes(p)
                        return (
                          <button
                            key={p}
                            type="button"
                            className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-sm ${checked ? 'bg-accent text-accent-foreground' : ''}`}
                            onClick={() => {
                              const next = checked ? selectedPlayers.filter(sp => sp !== p) : [...selectedPlayers, p]
                              setSelectedPlayers(next)
                              if (next.length === 4) setExtraAssignedTo('all')
                              else if (next.length === 1) setExtraAssignedTo(next[0])
                            }}
                          >
                            <span>{label}</span>
                            <input type="checkbox" checked={checked} readOnly className="h-4 w-4" />
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedProductId && (
                <div className="text-sm text-muted-foreground">
                  Total: ${(() => {
                    const prod = productos.find(p => p.id === selectedProductId)
                    return ((prod?.precio ?? 0) * quantity).toLocaleString()
                  })()}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={closeExtrasModal} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleAddExtra} 
                className="flex-1"
                disabled={!selectedProductId || quantity <= 0}
              >
                Agregar Extra
              </Button>
            </div>
          </div>
        </div>
      )}

     

    </div>
  )
}
