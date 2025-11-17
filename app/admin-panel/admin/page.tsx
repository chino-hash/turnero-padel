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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'
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
  Home,
  Package,
  MapPin,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useAppState } from '../../../components/providers/AppStateProvider'
import { useBookings } from '../../../hooks/useBookings'
import { useDashboardRealTimeUpdates } from '../../../hooks/useRealTimeUpdates'

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
}

interface Extra {
  id: string
  type: 'pelotas' | 'bebida' | 'paleta'
  name: string
  cost: number
  assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4'
}

export default function AdminDashboard() {
  const router = useRouter()
  const { courts, slotsForRender, isUnifiedView, selectedDate, setSelectedDate, refreshMultipleSlots, refreshSlots } = useAppState()

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

  const [prefs, setPrefs] = useState<{ mostrarCanchas: boolean; mostrarTurnos: boolean; mostrarUsuarios: boolean; mostrarProductos: boolean; mostrarFinanzas: boolean; orden: string }>(() => {
    if (typeof window === 'undefined') return { mostrarCanchas: true, mostrarTurnos: true, mostrarUsuarios: true, mostrarProductos: true, mostrarFinanzas: true, orden: 'importancia' }
    try {
      const raw = localStorage.getItem('adminSummaryPrefs')
      return raw ? JSON.parse(raw) : { mostrarCanchas: true, mostrarTurnos: true, mostrarUsuarios: true, mostrarProductos: true, mostrarFinanzas: true, orden: 'importancia' }
    } catch {
      return { mostrarCanchas: true, mostrarTurnos: true, mostrarUsuarios: true, mostrarProductos: true, mostrarFinanzas: true, orden: 'importancia' }
    }
  })

  const todayRange = useMemo(() => {
    const start = new Date()
    start.setHours(0,0,0,0)
    const end = new Date()
    end.setHours(23,59,59,999)
    return { start: start.toISOString(), end: end.toISOString() }
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
  const addExtra = (bookingId: string, extra: Omit<Extra, 'id'>) => {
    const newExtra: Extra = {
      ...extra,
      id: `extra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, extras: [...booking.extras, newExtra] }
          : booking
      )
    )
  }

  const removeExtra = (bookingId: string, extraId: string) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, extras: booking.extras.filter(extra => extra.id !== extraId) }
          : booking
      )
    )
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

    const total = producto.precio * quantity
    addExtra(selectedBookingId, {
      type: 'pelotas',
      name: producto.nombre,
      cost: total,
      assignedTo: extraAssignedTo
    })

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

  const togglePlayerPayment = (bookingId: string, playerKey: keyof Booking['individualPayments']) => {
    setBookings(prev => prev.map(booking => {
      if (booking.id === bookingId) {
        const newPayments = { ...booking.individualPayments }
        newPayments[playerKey] = newPayments[playerKey] === 'pagado' ? 'pendiente' : 'pagado'
        return { ...booking, individualPayments: newPayments }
      }
      return booking
    }))
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

  const chartData = useMemo(() => {
    const normalize = (n: string) => {
      const m = String(n).match(/^Cancha\s*\d+/i)
      return m ? m[0].replace(/\s+/g, ' ').trim() : String(n)
    }
    const bases = ['Cancha 1', 'Cancha 2', 'Cancha 3']
    const bookingsSource = Array.isArray(bookings) && bookings.length > 0 ? bookings : mockBookings
    const isSameDay = (dateStr: string, d: Date) => {
      const bd = new Date(dateStr)
      const dd = new Date(d)
      bd.setHours(0,0,0,0)
      dd.setHours(0,0,0,0)
      return bd.getTime() === dd.getTime()
    }
    const selectedDateStr = new Date(selectedDate).toISOString().split('T')[0]
    const dayBookings = (bookingsSource as any[]).filter(b => isSameDay(String(b?.date || ''), selectedDate))
    const effectiveBookings = dayBookings.length > 0 ? dayBookings : buildDemoBookingsForDay(selectedDateStr)
    const totalByCourt = new Map<string, number>(bases.map(b => [b, 0]))
    const parseHM = (hm: string) => {
      const [h, m] = String(hm || '00:00').split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }
    for (const c of courts as any[]) {
      const base = normalize(c?.name || '')
      if (!bases.includes(base)) continue
      const startMin = parseHM(String(c?.operatingHours?.start || '08:00'))
      const endMin = parseHM(String(c?.operatingHours?.end || '22:30'))
      const minutes = Math.max(0, endMin - startMin)
      totalByCourt.set(base, (totalByCourt.get(base) || 0) + (minutes || 0))
    }
    const reservedByCourt = new Map<string, number>(bases.map(b => [b, 0]))
    for (const b of effectiveBookings as any[]) {
      const base = normalize(b?.courtName || '')
      if (!bases.includes(base)) continue
      const { startStr, endStr } = parseTimeRange(String(b?.timeRange || ''))
      const [sh, sm] = (startStr || '00:00').split(':').map(Number)
      const [eh, em] = (endStr || '00:00').split(':').map(Number)
      const minutes = Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
      reservedByCourt.set(base, (reservedByCourt.get(base) || 0) + minutes)
    }
    const entries = bases.map(label => {
      const total = Math.max(1, totalByCourt.get(label) || 0)
      const reserved = Math.min(total, reservedByCourt.get(label) || 0)
      const ratio = reserved / total
      return { key: label, label, total, reserved, pct: Math.round(ratio * 100) }
    })
    return entries
  }, [courts, bookings, selectedDate])

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Visión general del sistema y accesos rápidos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
            <span>Ir a</span>
            <Home className="w-4 h-4 text-blue-600" />
          </Button>
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
            <span>Resumen del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredBookings.length}</div>
              <div className="text-sm text-gray-600">Turnos hoy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{filteredBookings.filter(b => b.status === 'confirmado').length}</div>
              <div className="text-sm text-gray-600">Confirmados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{filteredBookings.filter(b => b.paymentStatus === 'pagado').length}</div>
              <div className="text-sm text-gray-600">Pagados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${filteredBookings.reduce((sum, b) => sum + b.totalPrice + b.extras.reduce((eSum, e) => eSum + e.cost, 0), 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Ingresos estimados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{courts.filter((c: any) => c.isActive !== false).length}</div>
              <div className="text-sm text-gray-600">Canchas activas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Ocupación por cancha</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  bookingsApi.refreshBookings()
                  if (isUnifiedView) { refreshMultipleSlots() } else { refreshSlots() }
                }} className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Recargar
                </Button>
                <Button variant="outline" size="sm" onClick={toggleDay}>{isToday ? 'Ver mañana' : 'Volver a hoy'}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white border rounded">
                {chartData.map((d) => {
                  const color = d.pct >= 66 ? 'bg-red-500' : d.pct >= 33 ? 'bg-orange-400' : 'bg-green-500'
                  return (
                    <div key={d.key} className="flex flex-col items-center">
                      <div className="text-sm font-medium mb-2 text-gray-800">{d.label}</div>
                      <div className="w-full h-36 bg-gray-100 rounded-xl relative overflow-hidden">
                        <div className={`${color} absolute bottom-0 left-0 right-0 rounded-t-xl transition-all`} style={{ height: `${Math.max(4, d.pct)}%` }}></div>
                        <div className="absolute top-2 right-2 text-xs font-semibold text-gray-700 bg-white/70 px-2 py-1 rounded">{d.pct}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin-panel/admin/canchas" className="border rounded-lg px-3 py-4 flex items-center gap-2 hover:bg-blue-50">
                <Settings className="w-5 h-5" />
                <div className="text-sm">Canchas</div>
              </Link>
              <Link href="/admin-panel/admin/turnos" className="border rounded-lg px-3 py-4 flex items-center gap-2 hover:bg-blue-50">
                <Calendar className="w-5 h-5" />
                <div className="text-sm">Turnos</div>
              </Link>
              <Link href="/admin-panel/admin/usuarios" className="border rounded-lg px-3 py-4 flex items-center gap-2 hover:bg-blue-50">
                <Users className="w-5 h-5" />
                <div className="text-sm">Usuarios</div>
              </Link>
              <Link href="/admin-panel/admin/productos" className="border rounded-lg px-3 py-4 flex items-center gap-2 hover:bg-blue-50">
                <Package className="w-5 h-5" />
                <div className="text-sm">Productos</div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>



      
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {prefs.mostrarCanchas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Canchas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activas</p>
                  <p className="text-2xl font-bold">{courts.filter((c: any) => c.isActive !== false).length}</p>
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
                  <p className="text-sm text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold">{filteredBookings.length}</p>
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
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-2xl font-bold">—</p>
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
                  <p className="text-sm text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold">${filteredBookings.reduce((sum, b) => sum + b.totalPrice + b.extras.reduce((eSum, e) => eSum + e.cost, 0), 0).toLocaleString()}</p>
                </div>
                <Button asChild variant="outline" size="sm"><Link href="/admin-panel/admin/estadisticas">Ver</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vista rápida de turnos por categorías (compacta) */}
      <div className="space-y-6" data-testid="admin-bookings-compact">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
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
                  <span className="text-gray-700">{title}</span>
                  <span className="ml-auto text-xs text-gray-500">{groups[key].length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                {groups[key].length === 0 ? (
                  <div className="text-xs text-gray-500">Sin elementos</div>
                ) : (
                  <div className="space-y-2">
                    {groups[key].slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center justify-between px-2 py-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-medium text-gray-900">{b.courtName}</span>
                          <span className="text-[10px] text-gray-600">{b.timeRange}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">{b.userName}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            b.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                            b.status === 'completado' ? 'bg-blue-100 text-blue-800' :
                            b.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>{b.status}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="filters-modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros y Preferencias</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilterModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Campo de búsqueda */}
              <div className="space-y-2">
                <label htmlFor="modal-search-turnos" className="text-sm font-medium text-gray-700">
                  Buscar por nombre, email o cancha
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="modal-search-turnos"
                    type="text"
                    placeholder="Escribe para buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="filters-search-input"
                  />
                </div>
              </div>

              {/* Filtro por estado */}
              <div className="space-y-2">
                <label htmlFor="modal-status-filter" className="text-sm font-medium text-gray-700">
                  Estado del turno
                </label>
                <select
                  id="modal-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="text-sm font-medium text-gray-700">Personalización del resumen</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarCanchas} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarCanchas: e.target.checked }))} />Canchas</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarTurnos} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarTurnos: e.target.checked }))} />Turnos</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarUsuarios} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarUsuarios: e.target.checked }))} />Usuarios</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarProductos} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarProductos: e.target.checked }))} />Productos</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.mostrarFinanzas} onChange={(e) => setPrefs(prev => ({ ...prev, mostrarFinanzas: e.target.checked }))} />Finanzas</label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Orden</label>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Agregar Extra</h3>
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
                <Select
                  value={extraAssignedTo}
                  onValueChange={(value) => setExtraAssignedTo(value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los jugadores</SelectItem>
                    <SelectItem value="player1">Titular</SelectItem>
                    <SelectItem value="player2">Jugador 2</SelectItem>
                    <SelectItem value="player3">Jugador 3</SelectItem>
                    <SelectItem value="player4">Jugador 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedProductId && (
                <div className="text-sm text-gray-700">
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