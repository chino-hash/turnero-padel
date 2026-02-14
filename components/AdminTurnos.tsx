'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Calendar, List, Clock, User, MapPin, DollarSign, Filter, Search, RefreshCw, ChevronDown, ChevronUp, Plus, X, TrendingUp, CheckCircle, AlertCircle, Users, XCircle } from "lucide-react"
import { Input } from "./ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover"
import { splitEven } from "../lib/utils/extras"
import { removeDuplicates } from '../lib/utils/array-utils'
import { useAppState } from './providers/AppStateProvider'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, type BookingStatus } from '../types/booking'
import { useCourtPrices } from '../hooks/useCourtPrices'
import CalendarModal from './CalendarModal'

// Interfaces según especificaciones del documento
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
  type: 'alquiler_raqueta' | 'pelota' | 'toalla' | 'bebida' | 'snack' | 'otro'
  name: string
  cost: number
  assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4'
}

interface AdminTurnosProps {
  className?: string
  isDarkMode?: boolean
}

const AdminTurnos: React.FC<AdminTurnosProps> = ({ className = "", isDarkMode: propIsDarkMode }) => {
  const { isDarkMode: contextIsDarkMode, getPaymentStatusColor } = useAppState()
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : contextIsDarkMode
  const { courts, getCourtTotalPrice, getCourtPrice, isCourtActive } = useCourtPrices()
  
  // Estados del componente según especificaciones
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [extrasOpen, setExtrasOpen] = useState<Record<string, boolean>>({})
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  // Estados para el modal de extras
  const [showExtrasModal, setShowExtrasModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [productos, setProductos] = useState<{ id: number; nombre: string; precio: number; stock: number; activo: boolean }[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [extraAssignedTo, setExtraAssignedTo] = useState<'all' | 'player1' | 'player2' | 'player3' | 'player4'>('all')
  const [addingExtra, setAddingExtra] = useState<boolean>(false)
  const [selectedPlayers, setSelectedPlayers] = useState<("player1"|"player2"|"player3"|"player4")[]>(["player1","player2","player3","player4"])
  const selectedProduct = productos.find(p => p.id === (selectedProductId ?? -1)) || null

  const timedFetch = async (input: RequestInfo | URL, init?: RequestInit, label?: string) => {
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
  }

  // Estados para el modal de excepciones de turno fijo
  const [showExceptionsModal, setShowExceptionsModal] = useState(false)
  const [exceptionType, setExceptionType] = useState<'SKIP' | 'OVERRIDE'>('SKIP')
  const [exceptionReason, setExceptionReason] = useState<string>('')
  const [exceptionNewPrice, setExceptionNewPrice] = useState<number | ''>('')
  const [processingException, setProcessingException] = useState<boolean>(false)

  // Estados para la modal de calendario
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Tiempo en vivo para cálculo de estado EN CURSO y temporizador
  const [now, setNow] = useState<Date>(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  // Doble validación para completar turno
  const [confirmBookingId, setConfirmBookingId] = useState<string | null>(null)
  const [confirmChecked, setConfirmChecked] = useState<boolean>(false)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [inFlightUpdates, setInFlightUpdates] = useState<Record<string, boolean>>({})

  // Utilidades de tiempo para determinar categoría del turno
  const parseTimeRange = (timeRange: string) => {
    const [startStr, endStr] = timeRange.split(' - ').map(s => s.trim())
    return { startStr, endStr }
  }

  const getBookingTimes = (booking: Booking) => {
    const { startStr, endStr } = parseTimeRange(booking.timeRange)
    const [y, m, d] = booking.date.split('-').map(Number)
    const [sh, sm] = startStr.split(':').map(Number)
    const [eh, em] = endStr.split(':').map(Number)
    const start = new Date(y, (m || 1) - 1, d || 1, sh || 0, sm || 0, 0, 0)
    const end = new Date(y, (m || 1) - 1, d || 1, eh || 0, em || 0, 0, 0)
    return { start, end }
  }

  const getCategoryAndRemaining = (booking: Booking) => {
    const { start, end } = getBookingTimes(booking)
    // Completado siempre se muestra como completado
    if (booking.status === 'completado') {
      if (booking.closedAt) {
        return { category: 'closed' as const, remainingMs: 0 }
      }
      return { category: 'completed' as const, remainingMs: 0 }
    }
    // Solo se categorizan las reservas confirmadas por administrador
    if (booking.status !== 'confirmado') {
      return { category: 'other' as const, remainingMs: 0 }
    }
    // Confirmada antes de empezar
    if (now < start) {
      return { category: 'confirmed' as const, remainingMs: start.getTime() - now.getTime() }
    }
    // En curso dentro del rango de horario
    if (now >= start && now < end) {
      return { category: 'in_progress' as const, remainingMs: end.getTime() - now.getTime() }
    }
    // Terminó pero requiere confirmación de cierre (solo si estaba confirmada)
    return { category: 'awaiting_completion' as const, remainingMs: 0 }
  }

  const formatRemaining = (ms: number) => {
    if (ms <= 0) return '00:00'
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
  }

  // Helpers de mapeo desde la API hacia el modelo local del componente
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
    // Ordenar por posición para asignar player1..player4
    const sorted = playersArr
      .slice()
      .sort((a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0))
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
        type: 'otro',
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

  // Normalizar estado en español/inglés a clave BookingStatus (mayúsculas)
  const toBookingStatus = (status: Booking['status']): BookingStatus => {
    const s = status.toLowerCase()
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

  // Funciones de utilidad según especificaciones
  
  // Eliminar declaraciones duplicadas de getPaymentStatusColor y getStatusColor
  // ya que se están importando desde useAppState()
  
  // Convertir reservas al formato de eventos del calendario
  const convertBookingsToCalendarEvents = useMemo(() => {
    return filteredBookings.map(booking => ({
      id: booking.id,
      title: `${booking.userName} - ${booking.courtName}`,
      date: booking.date,
      time: booking.timeRange,
      court: booking.courtName,
      status: booking.status,
      players: Object.values(booking.players).filter(Boolean).length,
      price: booking.totalPrice
    }))
  }, [filteredBookings])
  
  // Función para calcular monto individual de cada jugador (siempre dividir por 4)
  const calculatePlayerAmount = (booking: Booking, playerKey: keyof Booking['players']): number => {
    const totalPlayersFixed = 4
    const baseAmount = booking.totalPrice / totalPlayersFixed

    // Agregar extras asignados al jugador específico
    const playerExtras = booking.extras.filter(
      extra => extra.assignedTo === playerKey || extra.assignedTo === 'all'
    )

    const extrasAmount = playerExtras.reduce((sum, extra) => {
      if (extra.assignedTo === 'all') {
        return sum + extra.cost / totalPlayersFixed
      }
      return sum + extra.cost
    }, 0)

    return baseAmount + extrasAmount
  }

  // Helper para calcular el monto total pagado considerando 4 jugadores fijos
  const computeAmountPaid = (booking: Booking): number => {
    const keys: Array<keyof Booking['players']> = ['player1', 'player2', 'player3', 'player4']
    return keys.reduce((sum, key) => {
      const status = booking.individualPayments[key as keyof Booking['individualPayments']]
      if (status !== 'pagado') return sum
      return sum + calculatePlayerAmount(booking, key)
    }, 0)
  }

  const handleCreateException = async () => {
    if (!selectedBookingId) return
    if (processingException) return
    const booking = bookings.find(b => b.id === selectedBookingId)
    if (!booking || !booking.recurringId) return
    const payload: any = {
      recurringId: booking.recurringId,
      date: booking.date,
      type: exceptionType,
    }
    if (exceptionType === 'OVERRIDE' && exceptionNewPrice !== '' && !Number.isNaN(Number(exceptionNewPrice))) {
      payload.newPrice = Number(exceptionNewPrice)
    }
    if (exceptionReason.trim()) payload.reason = exceptionReason.trim()

    setProcessingException(true)
    try {
      const res = await fetch('/api/recurring-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => {
          if (b.id !== booking.id) return b
          if (exceptionType === 'SKIP') {
            return { ...b, status: 'cancelado' }
          } else {
            const np = typeof payload.newPrice === 'number' ? payload.newPrice : b.totalPrice
            return { ...b, totalPrice: np }
          }
        }))
      }
    } catch (_) {
    } finally {
      setProcessingException(false)
      closeExceptionsModal()
    }
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

  const removeExtra = async (bookingId: string, extraId: string) => {
    try {
      const res = await timedFetch(`/api/bookings/${bookingId}/extras/${extraId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }, 'DELETE /api/bookings/:id/extras/:extraId')
      if (!res.ok) {
        // Fallback: eliminar localmente si falla el backend
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, extras: booking.extras.filter(extra => extra.id !== extraId) }
              : booking
          )
        )
        return
      }
      const data = await res.json()
      const booking = data?.data
      if (booking && booking.id) {
        setBookings(prev => prev.map(b => {
          if (b.id !== booking.id) return b
          const mappedExtras = (booking.extras || [])
            .filter((e: any) => !e.deletedAt)
            .map((e: any) => ({
              id: e.id,
              type: 'otro',
              name: e.producto?.nombre || 'Extra',
              cost: e.totalPrice,
              assignedTo: e.assignedToAll ? 'all' : (e.player?.position ? `player${e.player.position}` : 'player1')
            }))
          return { ...b, extras: mappedExtras }
        }))
      }
    } catch (err) {
      // Fallback silencioso para no romper la UI
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, extras: booking.extras.filter(extra => extra.id !== extraId) }
            : booking
        )
      )
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

  const openExceptionsModal = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setShowExceptionsModal(true)
    setExceptionType('SKIP')
    setExceptionReason('')
    setExceptionNewPrice('')
  }

  const closeExceptionsModal = () => {
    setShowExceptionsModal(false)
    setSelectedBookingId(null)
    setExceptionReason('')
    setExceptionNewPrice('')
  }

  useEffect(() => {
    const loadProductos = async () => {
      const fetchWithRetry = async (retries: number, delayMs: number) => {
        try {
          const res = await timedFetch('/api/productos', undefined, 'GET /api/productos')
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return await res.json()
        } catch (err) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, delayMs))
            return fetchWithRetry(retries - 1, delayMs * 2)
          }
          throw err
        }
      }
      try {
        const data = await fetchWithRetry(2, 300)
        const productosArr = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []

        // Normalizar datos mínimos y evitar fallos de estilos/disabled
        const normalized = productosArr.map((p: any) => ({
          id: Number(p.id),
          nombre: String(p.nombre ?? p.name ?? 'Producto'),
          precio: Number(p.precio ?? p.price ?? 0),
          stock: Number(p.stock ?? 0),
          activo: Boolean(p.activo ?? true),
        }))

        setProductos(normalized)
      } catch (e) {
        // Mantener la lista actual si existe; evitar vaciar en errores intermitentes
        // Registrar evento silencioso
        fetch('/api/admin/test-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ type: 'product_fetch_error', message: 'Fallo obteniendo productos' })
        }).catch(() => {})
      }
    }
    if (showExtrasModal) {
      loadProductos()
    }
  }, [showExtrasModal])

  // Bloqueo de scroll del documento cuando el modal está abierto
  useEffect(() => {
    if (!showExtrasModal) return
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [showExtrasModal])

  useEffect(() => {
    if (!showExceptionsModal) return
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [showExceptionsModal])

  const handleAddExtra = async () => {
    if (!selectedBookingId || !selectedProductId || quantity <= 0) return
    if (addingExtra) return
    if (!selectedProduct || !selectedProduct.activo || selectedProduct.stock <= 0) return
    setAddingExtra(true)

    const producto = productos.find(p => p.id === selectedProductId)
    if (!producto) return

    try {
      if (selectedPlayers.length > 1 && selectedPlayers.length < 4) {
        const total = producto.precio * quantity
        const parts = splitEven(total, selectedPlayers.length)
        selectedPlayers.forEach((p, idx) => {
          const cost = parts[idx]
          addExtra(selectedBookingId, {
            type: 'otro',
            name: producto.nombre,
            cost,
            assignedTo: p
          })
        })
        setExtrasOpen(prev => ({ ...prev, [selectedBookingId]: true }))
      } else {
        const postWithRetry = async (retries: number, delayMs: number): Promise<Response> => {
          const res = await timedFetch(`/api/bookings/${selectedBookingId}/extras`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productoId: selectedProductId,
              quantity,
              assignedToAll: selectedPlayers.length === 4 || extraAssignedTo === 'all',
            })
          }, 'POST /api/bookings/:id/extras')
          if (!res.ok && retries > 0) {
            await new Promise(r => setTimeout(r, delayMs))
            return postWithRetry(retries - 1, delayMs * 2)
          }
          return res
        }
        const res = await postWithRetry(2, 300)
        if (!res.ok) {
          const total = producto.precio * quantity
          const assigned = selectedPlayers.length === 1 ? selectedPlayers[0] : extraAssignedTo
          addExtra(selectedBookingId, {
            type: 'otro',
            name: producto.nombre,
            cost: total,
            assignedTo: assigned
          })
          setExtrasOpen(prev => ({ ...prev, [selectedBookingId]: true }))
        } else {
          const data = await res.json()
          const booking = data?.data
          if (booking && booking.id) {
            setBookings(prev => prev.map(b => {
              if (b.id !== booking.id) return b
              const mappedExtras = (booking.extras || [])
                .filter((e: any) => !e.deletedAt)
                .map((e: any) => ({
                  id: e.id,
                  type: 'otro',
                  name: e.producto?.nombre || 'Extra',
                  cost: e.totalPrice,
                  assignedTo: e.assignedToAll ? 'all' : (
                    e.player?.position === 1
                      ? 'player1'
                      : e.player?.position === 2
                      ? 'player2'
                      : e.player?.position === 3
                      ? 'player3'
                      : e.player?.position === 4
                      ? 'player4'
                      : 'player1'
                  )
                }))
              return { ...b, extras: mappedExtras }
            }))
            setExtrasOpen(prev => ({ ...prev, [booking.id]: true }))
          }
        }
      }
    } catch (err) {
      // Fallback ya aplicado arriba; aquí solo registrar evento silencioso
      fetch('/api/admin/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ type: 'extra_add_error', message: 'Fallo agregando extra' })
      }).catch(() => {})
    } finally {
      setAddingExtra(false)
      closeExtrasModal()
    }
  }

  // Cargar datos reales desde la API
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', '50')
        const fetchWithRetry = async (retries: number, delayMs: number) => {
          try {
            const res = await timedFetch(`/api/bookings?${params.toString()}`, { credentials: 'same-origin' }, 'GET /api/bookings (AdminTurnos)')
            if (!res.ok) throw new Error(String(res.status))
            return await res.json()
          } catch (err) {
            if (retries > 0) {
              await new Promise(r => setTimeout(r, delayMs))
              return fetchWithRetry(retries - 1, delayMs * 2)
            }
            throw err
          }
        }
        const payload = await fetchWithRetry(2, 300)
        const list = Array.isArray(payload?.data) ? payload.data : []
        const mapped: Booking[] = list.map(mapApiBookingToLocal)
        setBookings(mapped)
      } catch (error) {
        // Registrar evento silencioso y mantener estado actual
        fetch('/api/admin/test-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ type: 'bookings_fetch_error', message: 'Fallo obteniendo reservas' })
        }).catch(() => {})
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  // Filtrar reservas con exclusión automática de turnos pendientes
  const [searchTermDebounced, setSearchTermDebounced] = useState(searchTerm)
  useEffect(() => {
    const t = setTimeout(() => setSearchTermDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])
  useEffect(() => {
    let filtered = [...bookings]
    filtered = filtered.filter(booking => booking.status !== 'pendiente')
    if (searchTermDebounced) {
      const term = searchTermDebounced.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.userName.toLowerCase().includes(term) ||
        booking.userEmail.toLowerCase().includes(term) ||
        booking.courtName.toLowerCase().includes(term)
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => {
        const cat = getCategoryAndRemaining(booking).category
        if (statusFilter === 'confirmed') return cat === 'confirmed'
        if (statusFilter === 'in_progress') return cat === 'in_progress'
        if (statusFilter === 'completed') return cat === 'completed' || cat === 'closed'
        return true
      })
    }
    if (dateFilter !== 'all') {
      const base = new Date()
      const target = new Date(base)
      if (dateFilter === 'today') {
        filtered = filtered.filter(b => new Date(b.date).toDateString() === base.toDateString())
      } else if (dateFilter.startsWith('plus')) {
        const offset = Number(dateFilter.replace('plus', '')) || 0
        target.setDate(base.getDate() + offset)
        filtered = filtered.filter(b => new Date(b.date).toDateString() === target.toDateString())
      }
    }
    setFilteredBookings(filtered)
  }, [bookings, searchTermDebounced, statusFilter, dateFilter])

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId)
  }

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    const current = bookings.find(b => b.id === bookingId)
    if (!current) return
    if (newStatus === 'completado' && current.paymentStatus !== 'pagado') {
      return
    }
    const previousStatus = current.status
    setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b)))
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toBookingStatus(newStatus) })
      })
    } catch (err) {
      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: previousStatus } : b)))
    }
  }

  // Cerrar turno definitivamente usando el nuevo endpoint
  const closeBooking = async (bookingId: string) => {
    const current = bookings.find(b => b.id === bookingId)
    if (!current) return
    // Recalcular saldo pendiente para validar client-side
    const totalExtras = current.extras.reduce((sum, extra) => sum + (extra.cost || 0), 0)
    const totalOriginal = current.totalPrice + totalExtras
    const amountPaid = computeAmountPaid(current)
    const pendingBalance = Math.max(0, totalOriginal - amountPaid)
    if (pendingBalance > 0) {
      // No cerrar si hay saldo pendiente
      return
    }
    try {
      const res = await timedFetch(`/api/bookings/${bookingId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      }, 'POST /api/bookings/:id/close')
      if (!res.ok) {
        // Mantener estado si falla
        return
      }
      const data = await res.json()
      const closedAt = new Date().toISOString()
      // Actualizar estado local a completado y marcar closedAt
      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: 'completado', closedAt } : b)))
      // Auditoría
      await fetch('/api/admin/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          type: 'bookings_updated',
          message: `Turno ${bookingId} cerrado definitivamente a las ${new Date(closedAt).toLocaleString('es-ES')}`
        })
      }).catch(() => {})
    } catch (err) {
      // Silencioso para no romper UI
      console.error('Error cerrando turno:', err)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      const delWithRetry = async (retries: number, delayMs: number): Promise<Response> => {
        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
        const res = await fetch(`/api/bookings/${bookingId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        })
        const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
        const ms = Math.round(t1 - t0)
        try {
          if (typeof window !== 'undefined') {
            console.log(`[latency] DELETE /api/bookings/${bookingId} ${ms}ms status ${res.status}`)
            fetch('/api/admin/test-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ type: 'bookings_updated', message: `DELETE /api/bookings/${bookingId} ${ms}ms status ${res.status}` })
            }).catch(() => {})
          }
        } catch {}
        if (!res.ok && retries > 0) {
          await new Promise(r => setTimeout(r, delayMs))
          return delWithRetry(retries - 1, delayMs * 2)
        }
        return res
      }
      const res = await delWithRetry(2, 300)
      if (!res.ok) {
        setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: 'cancelado' } : b)))
        return
      }
      setBookings(prev => prev.filter(b => b.id !== bookingId))
    } catch (err) {
      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: 'cancelado' } : b)))
      fetch('/api/admin/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ type: 'booking_cancel_error', message: `Fallo cancelando turno ${bookingId}` })
      }).catch(() => {})
    }
  }

  const togglePlayerPayment = async (bookingId: string, playerKey: keyof Booking['individualPayments']) => {
    const previousState = bookings.find(b => b.id === bookingId) || null
    if (!previousState) {
      console.error('Reserva no encontrada para toggle', bookingId)
      return
    }
    const position = Number(String(playerKey).replace('player', ''))
    if (!(position >= 1 && position <= 4)) return
    const newPaidStatus = previousState.individualPayments[playerKey] === 'pagado' ? false : true

    // UI optimista: aplicar el cambio localmente de inmediato
    setInFlightUpdates(prev => ({ ...prev, [bookingId]: true }))
    setBookings(prevBookings => prevBookings.map(booking => {
      if (booking.id !== bookingId) return booking
      const newPayments = {
        ...booking.individualPayments,
        [playerKey]: newPaidStatus ? 'pagado' : 'pendiente'
      }
      const paidCount = Object.values(newPayments).filter(status => status === 'pagado').length
      const totalPlayers = 4
      const paymentStatus: Booking['paymentStatus'] = paidCount === 0 ? 'pendiente' : paidCount === totalPlayers ? 'pagado' : 'parcial'
      return { ...booking, individualPayments: newPayments, paymentStatus }
    }))

    const toggledPayments: Booking['individualPayments'] = {
      ...previousState.individualPayments,
      [playerKey]: newPaidStatus ? 'pagado' : 'pendiente'
    }
    const paidCountBackend = Object.values(toggledPayments).filter(s => s === 'pagado').length
    const paymentStatusBackend = paidCountBackend === 0 ? 'PENDING' : paidCountBackend === 4 ? 'FULLY_PAID' : 'DEPOSIT_PAID'
    const playerKeys: Array<keyof Booking['players']> = ['player1', 'player2', 'player3', 'player4']
    const playersPayload = playerKeys.map((key, idx) => {
      const name = (previousState.players[key] || '').trim()
      const displayName = name || (key === 'player1' ? 'Titular' : `Jugador ${key.slice(-1)}`)
      const hasPaid = toggledPayments[key as keyof Booking['individualPayments']] === 'pagado'
      return { playerName: displayName, position: idx + 1, hasPaid }
    })

    const doPutFallback = async (): Promise<Response> => {
      return fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ players: playersPayload, paymentStatus: paymentStatusBackend })
      })
    }

    const isNetworkError = (err: unknown): boolean =>
      err instanceof TypeError && (err.message === 'Failed to fetch' || (err as Error).message?.includes('fetch'))

    const doPatch = () =>
      fetch(`/api/bookings/${bookingId}/players/position/${position}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ hasPaid: newPaidStatus })
      })

    try {
      // PATCH ligero (con reintento ante error de red)
      let patchRes: Response
      try {
        patchRes = await doPatch()
      } catch (patchErr) {
        if (isNetworkError(patchErr)) {
          await new Promise(r => setTimeout(r, 400))
          patchRes = await doPatch()
        } else {
          throw patchErr
        }
      }

      const json = patchRes.ok ? await patchRes.json().catch(() => ({})) : await patchRes.json().catch(() => ({}))
      const errorMsg = json?.error ? String(json.error) : ''

      if (!patchRes.ok) {
        if (patchRes.status === 429 || json?.error === 'RATE_LIMIT_EXCEEDED') {
          fetch('/api/admin/test-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              type: 'bookings_updated',
              message: `RATE_LIMIT al actualizar pago ${bookingId}. Estado optimista mantenido.`
            })
          }).catch(() => {})
          return
        }
        // Fallback: si no existe jugador en esa posición (reserva sin BookingPlayer), actualizar con PUT
        if (patchRes.status === 404 && errorMsg.includes('Jugador no encontrado')) {
          let putRes: Response
          try {
            putRes = await doPutFallback()
          } catch (putErr) {
            if (isNetworkError(putErr)) {
              await new Promise(r => setTimeout(r, 400))
              putRes = await doPutFallback()
            } else {
              throw putErr
            }
          }
          const putJson = putRes.ok ? await putRes.json().catch(() => ({})) : await putRes.json().catch(() => ({}))
          if (!putRes.ok) {
            throw new Error(putJson?.error ? String(putJson.error) : `Error actualizando reserva (HTTP ${putRes.status})`)
          }
          if (putJson?.success && putJson?.data) {
            const mapped = mapApiBookingToLocal(putJson.data)
            setBookings(prev => prev.map(b => (b.id === bookingId ? mapped : b)))
          }
        } else {
          throw new Error(errorMsg || `Error actualizando pago (HTTP ${patchRes.status})`)
        }
      } else {
        if (json?.success && json?.data) {
          const mapped = mapApiBookingToLocal(json.data)
          setBookings(prev => prev.map(b => (b.id === bookingId ? mapped : b)))
        }
      }

      // Registro de transacción en segundo plano (no bloquear la UI)
      const playerAmount = calculatePlayerAmount(previousState, playerKey as keyof Booking['players'])
      fetch('/api/crud/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          operations: [
            {
              operation: 'create',
              model: 'payment',
              data: {
                bookingId,
                amount: playerAmount,
                paymentMethod: 'CASH',
                paymentType: newPaidStatus ? 'PAYMENT' : 'ADJUSTMENT',
                status: newPaidStatus ? 'completed' : 'reversed'
              }
            }
          ]
        })
      }).then(txRes => {
        if (!txRes.ok) {
          fetch('/api/admin/test-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              type: 'bookings_updated',
              message: `Transacción de pago no registrada: booking ${bookingId} jugador ${position}`
            })
          }).catch(() => {})
        }
      }).catch(() => console.warn('Fallo registrando transacción de pago (background)'))
    } catch (err) {
      const isNetwork = err instanceof TypeError && ((err as Error).message === 'Failed to fetch' || (err as Error).message?.includes('fetch'))
      if (isNetwork) {
        console.warn('Error de red al actualizar pago. Estado revertido. Comprueba la conexión e inténtalo de nuevo.')
      } else {
        console.error('Fallo al actualizar pago del jugador:', err)
      }
      if (previousState) {
        setBookings(prevBookings => prevBookings.map(b => (b.id === bookingId ? previousState : b)))
      }
    } finally {
      setInFlightUpdates(prev => ({ ...prev, [bookingId]: false }))
    }
  }

  const renderExpandedContent = (booking: Booking, idx: number) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    const totalExtras = booking.extras.reduce((sum, extra) => sum + (extra.cost || 0), 0)
    const totalOriginal = booking.totalPrice + totalExtras
    const amountPaid = computeAmountPaid(booking)
    const pendingBalance = Math.max(0, totalOriginal - amountPaid)

    return (
      <div className="border-t pt-4 space-y-4">
        <div>
          <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Jugadores y Pagos Individuales</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['player1','player2','player3','player4'] as Array<keyof Booking['players']>).map((playerKey) => {
              const playerName = (booking.players[playerKey] || '').trim()
              const displayName = playerName || (playerKey === 'player1' ? 'Titular' : `Jugador ${playerKey.slice(-1)}`)
              const paymentStatus = booking.individualPayments[playerKey as keyof typeof booking.individualPayments]
              const playerAmount = calculatePlayerAmount(booking, playerKey as keyof Booking['players'])
              const isPaid = paymentStatus === 'pagado'
    const isClosed = booking.status === 'completado' && !!booking.closedAt
    const disableToggle = (isClosed && isPaid && pendingBalance === 0)
              return (
                <div key={playerKey} className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                  <div>
                    <p className="font-medium text-sm">{displayName}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{playerKey === 'player1' ? 'Titular' : `Jugador ${playerKey.slice(-1)}`}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>${playerAmount.toLocaleString()}</p>
                  </div>
                  <Button
                    variant={isPaid ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePlayerPayment(booking.id, playerKey as keyof typeof booking.individualPayments)}
                    className={`text-xs ${
                      isPaid
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : (isDarkMode
                            ? 'border-red-500 text-red-300 bg-red-900/30 hover:bg-red-900/40'
                            : 'border-red-300 text-red-600 hover:bg-red-50')
                    } ${(disableToggle || inFlightUpdates[booking.id]) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={disableToggle || !!inFlightUpdates[booking.id]}
                    aria-disabled={disableToggle || !!inFlightUpdates[booking.id]}
                    data-testid={`admin-player-payment-toggle-${idx + 1}-${playerKey}`}
                  >
                    {isPaid ? (<><CheckCircle className="w-3 h-3 mr-1" />Pagado</>) : (<><AlertCircle className="w-3 h-3 mr-1" />Pendiente</>)}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h4
            className={`font-medium mb-3 flex items-center gap-2 cursor-pointer transition-colors ${isDarkMode ? 'text-gray-200 hover:text-purple-300' : 'text-gray-900 hover:text-purple-600'}`}
            data-testid={`admin-extras-toggle-${idx + 1}`}
            onClick={() => setExtrasOpen(prev => ({ ...prev, [booking.id]: !prev[booking.id] }))}
          >
            {extrasOpen[booking.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {(() => {
              const grouped = (() => {
                const groups: { ids: string[]; name: string; cost: number; label: string }[] = []
                const byKey: Record<string, { ids: string[]; name: string; cost: number; label: string }> = {}
                const playersShort: Record<'player1'|'player2'|'player3'|'player4', string> = { player1: 'J1', player2: 'J2', player3: 'J3', player4: 'J4' }
                const playerExtrasByName: Record<string, { player: 'player1'|'player2'|'player3'|'player4'; extra: Extra }[]> = {}
                booking.extras.forEach(e => {
                  if (e.assignedTo === 'all') {
                    const key = `all|${e.name}|${e.id}`
                    byKey[key] = { ids: [e.id], name: e.name, cost: e.cost, label: 'Todos' }
                  } else {
                    const list = playerExtrasByName[e.name] || []
                    playerExtrasByName[e.name] = [...list, { player: e.assignedTo, extra: e }]
                  }
                })
                Object.entries(playerExtrasByName).forEach(([name, list]) => {
                  const players = Array.from(new Set(list.map(l => l.player))) as ('player1'|'player2'|'player3'|'player4')[]
                  if (players.length > 1) {
                    const key = `multi|${name}|${players.sort().join(',')}`
                    const ids = list.map(l => l.extra.id)
                    const cost = list.reduce((s, l) => s + l.extra.cost, 0)
                    const label = `Compartido por ${players.map(p => playersShort[p]).join(' y ')}`
                    byKey[key] = { ids, name, cost, label }
                  } else {
                    const only = list[0]
                    const key = `single|${name}|${players[0]}|${only.extra.id}`
                    const label = playersShort[players[0]]
                    byKey[key] = { ids: [only.extra.id], name, cost: only.extra.cost, label }
                  }
                })
                groups.push(...Object.values(byKey))
                return groups
              })()
              return `Extras Agregados (${grouped.length})`
            })()}
          </h4>
          {extrasOpen[booking.id] && booking.extras.length > 0 && (
            <div className="space-y-2">
              {(() => {
                const groups: { ids: string[]; name: string; cost: number; label: string }[] = []
                const byKey: Record<string, { ids: string[]; name: string; cost: number; label: string }> = {}
                const playersShort: Record<'player1'|'player2'|'player3'|'player4', string> = { player1: 'J1', player2: 'J2', player3: 'J3', player4: 'J4' }
                const playerExtrasByName: Record<string, { player: 'player1'|'player2'|'player3'|'player4'; extra: Extra }[]> = {}
                booking.extras.forEach(e => {
                  if (e.assignedTo === 'all') {
                    const key = `all|${e.name}|${e.id}`
                    byKey[key] = { ids: [e.id], name: e.name, cost: e.cost, label: 'Todos' }
                  } else {
                    const list = playerExtrasByName[e.name] || []
                    playerExtrasByName[e.name] = [...list, { player: e.assignedTo, extra: e }]
                  }
                })
                Object.entries(playerExtrasByName).forEach(([name, list]) => {
                  const players = Array.from(new Set(list.map(l => l.player))) as ('player1'|'player2'|'player3'|'player4')[]
                  if (players.length > 1) {
                    const key = `multi|${name}|${players.sort().join(',')}`
                    const ids = list.map(l => l.extra.id)
                    const cost = list.reduce((s, l) => s + l.extra.cost, 0)
                    const label = `Compartido por ${players.map(p => playersShort[p]).join(' y ')}`
                    byKey[key] = { ids, name, cost, label }
                  } else {
                    const only = list[0]
                    const key = `single|${name}|${players[0]}|${only.extra.id}`
                    const label = playersShort[players[0]]
                    byKey[key] = { ids: [only.extra.id], name, cost: only.extra.cost, label }
                  }
                })
                groups.push(...Object.values(byKey))
                return groups.map(group => (
                  <div key={group.ids.join('|')} className={`flex items-center justify-between p-3 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{group.name}</span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>({group.label})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(group.cost)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          for (const id of group.ids) {
                            await removeExtra(booking.id, id)
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-live="polite">
          <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Total original</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>${formatCurrency(totalOriginal)}</p>
          </div>
          <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>Pagado</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>${formatCurrency(amountPaid)}</p>
          </div>
        <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          {pendingBalance === 0 ? (
            <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}><span className="inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Sin saldo</span></p>
          ) : (
            <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>Saldo pendiente</p>
          )}
          <p className={`text-xl font-bold ${pendingBalance === 0 ? (isDarkMode ? 'text-green-200' : 'text-green-700') : (isDarkMode ? 'text-yellow-200' : 'text-yellow-700')} animate-in fade-in`}>${formatCurrency(pendingBalance)}</p>
        </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => openExtrasModal(booking.id)} className="text-blue-600 border-blue-600 hover:bg-blue-50" data-testid={`admin-add-extra-btn-${idx + 1}`}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Extra
          </Button>
          {(() => {
            const canClose = pendingBalance === 0 && (booking.status === 'confirmado' || (booking.status === 'completado' && !booking.closedAt))
            const isClosed = booking.status === 'completado' && !!booking.closedAt
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmBookingId(booking.id)}
                className={`text-green-600 border-green-600 hover:bg-green-50 ${(!canClose || isClosed) ? 'opacity-60 cursor-not-allowed' : ''}`}
                data-testid={`admin-complete-btn-${idx + 1}`}
                disabled={!canClose || isClosed}
                aria-disabled={!canClose || isClosed}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {isClosed ? 'Cerrado' : 'Completar'}
              </Button>
            )
          })()}
          {(() => {
            const cat = getCategoryAndRemaining(booking).category
            const disableCancel = !(cat === 'confirmed' || cat === 'in_progress')
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelBookingId(booking.id)}
                className={`text-red-500 dark:text-red-300 border-border hover:bg-red-50 dark:hover:bg-red-900/15 dark:hover:text-red-300 focus-visible:ring-red-500/30 disabled:text-muted-foreground disabled:border-border disabled:opacity-70 ${disableCancel ? 'cursor-not-allowed' : ''}`}
                data-testid={`admin-cancel-btn-${idx + 1}`}
                disabled={disableCancel}
                aria-disabled={disableCancel}
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            )
          })()}
          {booking.recurringId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openExceptionsModal(booking.id)}
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
              data-testid={`admin-exceptions-btn-${idx + 1}`}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Excepciones
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Calcular estadísticas
  const totalBookings = useMemo(() => filteredBookings.length, [filteredBookings])
  const confirmedBookings = useMemo(() => filteredBookings.filter(b => b.status === 'confirmado').length, [filteredBookings])
  const totalRevenue = useMemo(() => filteredBookings.reduce((sum, booking) => {
    const totalAmount = booking.totalPrice + booking.extras.reduce((extraSum, extra) => extraSum + extra.cost, 0)
    return sum + totalAmount
  }, 0), [filteredBookings])
  const totalCollected = useMemo(() => filteredBookings.reduce((sum, booking) => {
    if (booking.paymentStatus === 'pagado') {
      return sum + booking.totalPrice + booking.extras.reduce((extraSum, extra) => extraSum + extra.cost, 0)
    } else if (booking.paymentStatus === 'parcial') {
      const paidPlayers = Object.entries(booking.individualPayments).filter(([_, status]) => status === 'pagado')
      const paidAmount = paidPlayers.reduce((playerSum, [playerKey, _]) => {
        return playerSum + calculatePlayerAmount(booking, playerKey as keyof Booking['players'])
      }, 0)
      return sum + paidAmount
    }
    return sum
  }, 0), [filteredBookings])
  const pendingBalance = useMemo(() => totalRevenue - totalCollected, [totalRevenue, totalCollected])
  const reserveTotal = useMemo(() => filteredBookings.reduce((sum, booking) => sum + booking.totalPrice, 0), [filteredBookings])

  const derivedBookings = useMemo(() => {
    return filteredBookings.map((b) => {
      const totalExtras = b.extras.reduce((sum, extra) => sum + (extra.cost || 0), 0)
      const totalOriginal = b.totalPrice + totalExtras
      const amountPaid = computeAmountPaid(b)
      const pending = Math.max(0, totalOriginal - amountPaid)
      const { category, remainingMs } = getCategoryAndRemaining(b)
      return { booking: b, category, remainingMs, chipValue: pending }
    })
  }, [filteredBookings, now])

  const fixedDerived = useMemo(() => derivedBookings.filter(d => !!d.booking.recurringId), [derivedBookings])
  const confirmedDerived = useMemo(() => derivedBookings.filter(d => d.category === 'confirmed' || d.category === 'awaiting_completion'), [derivedBookings])
  const inProgressDerived = useMemo(() => derivedBookings.filter(d => d.category === 'in_progress'), [derivedBookings])
  const completedDerived = useMemo(() => derivedBookings.filter(d => d.category === 'completed'), [derivedBookings])
  const closedDerived = useMemo(() => derivedBookings.filter(d => d.category === 'closed'), [derivedBookings])

  const [visibleFixed, setVisibleFixed] = useState(30)
  const [visibleConfirmed, setVisibleConfirmed] = useState(30)
  const [visibleInProgress, setVisibleInProgress] = useState(30)
  const [visibleCompleted, setVisibleCompleted] = useState(30)
  const [visibleClosed, setVisibleClosed] = useState(30)
  const [confirmedSectionCollapsed, setConfirmedSectionCollapsed] = useState(false)

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Cargando turnos...</span>
        </div>
      </div>
    )
  }

  return (
    <section className={`space-y-6 ${className}`} role="region" aria-labelledby="turnos-title" data-testid="admin-turnos-section">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 id="turnos-title" className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Turnos</h2>
          <p className="text-gray-600" id="turnos-description">Administra y supervisa todas las reservas</p>
        </div>
        
        <nav className="flex gap-2" role="toolbar" aria-label="Opciones de vista y acciones" data-testid="turnos-toolbar">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            aria-label="Vista de lista"
            data-testid="view-list-button"
          >
            <List className="w-4 h-4 mr-2" aria-hidden="true" />
            Lista
          </Button>
          <Button
            variant={showCalendarModal ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCalendarModal(true)}
            aria-pressed={showCalendarModal}
            aria-label="Abrir vista de calendario"
            data-testid="view-calendar-button"
          >
            <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
            Calendario
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersModal(true)}
            aria-label="Abrir filtros"
            data-testid="filters-button"
          >
            <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
            Filtros
          </Button>
        </nav>
      </header>

      {/* Estadísticas Rápidas - 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{confirmedBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Financiero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-300 font-medium">Total Recaudado</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">${totalCollected.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">Saldo Pendiente</p>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">${pendingBalance.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Total Reserva</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">${reserveTotal.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="hidden">
        <div className="space-y-2">
          <label htmlFor="search-turnos" className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 w-4 h-4" />
            <Input
              id="search-turnos"
              type="text"
              placeholder="Nombre, email o cancha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="status-filter"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmados</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Completados</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
          <select
            id="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="date-filter"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="plus1">Mañana</option>
            <option value="plus2">Pasado mañana</option>
            <option value="plus3">En 3 días</option>
            <option value="plus4">En 4 días</option>
            <option value="plus5">En 5 días</option>
            <option value="plus6">En 6 días</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setDateFilter('all')
            }}
            className="w-full"
            data-testid="clear-filters"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="space-y-8">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay turnos</h3>
              <p className="text-gray-600">No se encontraron reservas con los filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Sección: Turnos fijos (recurrencia) */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-purple-300"></div>
                <span className="text-xs font-bold tracking-widest text-purple-700 bg-purple-50 px-3 py-1 rounded">TURNOS FIJOS</span>
                <div className="flex-1 border-t border-purple-300"></div>
              </div>
              <div className="mt-4 space-y-4">
                {fixedDerived.slice(0, visibleFixed).map((d, idx) => (
                    <Card key={d.booking.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              {d.booking.courtName}
                              {(() => {
                                const statusKey = toBookingStatus(d.booking.status)
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${BOOKING_STATUS_COLORS[statusKey]}`}>
                                    {BOOKING_STATUS_LABELS[statusKey]}
                                  </span>
                                )
                              })()}
                              <span className="px-2 py-1 rounded-full text-xs font-medium border bg-purple-100 text-purple-800 border-purple-200">Fijo</span>
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(d.booking.date).toLocaleDateString('es-ES')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {d.booking.timeRange}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {d.booking.userName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
                              const chipValue = d.chipValue
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(d.booking.paymentStatus, isDarkMode)}`}>
                                  ${formatCurrency(chipValue)}
                                </span>
                              )
                            })()}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBookingExpansion(d.booking.id)}
                              aria-expanded={expandedBooking === d.booking.id}
                              data-testid={`expand-booking-${d.booking.id}`}
                            >
                              {expandedBooking === d.booking.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedBooking === d.booking.id && (
                        <CardContent className="pt-0">
                          {renderExpandedContent(d.booking, idx)}
                        </CardContent>
                      )}
                    </Card>
                  ))}
              {(fixedDerived.length > visibleFixed || visibleFixed > 30) && (
                <div className="flex justify-center gap-2 mt-2">
                  {fixedDerived.length > visibleFixed && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleFixed(v => v + 30)}>Mostrar más</Button>
                  )}
                  {visibleFixed > 30 && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleFixed(30)}>Mostrar menos</Button>
                  )}
                </div>
              )}
              </div>
            </div>
            {/* Sección: Turnos confirmados (no jugados) */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-green-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest text-green-700 bg-green-50 px-3 py-1 rounded">TURNOS CONFIRMADOS</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmedSectionCollapsed(c => !c)}
                    aria-expanded={!confirmedSectionCollapsed}
                    data-testid="expand-confirmed-section"
                    className="h-8 w-8 p-0"
                  >
                    {confirmedSectionCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex-1 border-t border-green-300"></div>
              </div>
              {!confirmedSectionCollapsed && (
              <div className="mt-4 space-y-4">
                {confirmedDerived.slice(0, visibleConfirmed).map((d, idx) => (
                    <Card key={d.booking.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              {d.booking.courtName}
                              {(() => {
                                const statusKey = toBookingStatus(d.booking.status)
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${BOOKING_STATUS_COLORS[statusKey]}`}>
                                    {BOOKING_STATUS_LABELS[statusKey]}
                                  </span>
                                )
                              })()}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(d.booking.date).toLocaleDateString('es-ES')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {d.booking.timeRange}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {d.booking.userName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
                              const chipValue = d.chipValue
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(d.booking.paymentStatus, isDarkMode)}`}>
                                  ${formatCurrency(chipValue)}
                                </span>
                              )
                            })()}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBookingExpansion(d.booking.id)}
                              aria-expanded={expandedBooking === d.booking.id}
                              data-testid={`expand-booking-${d.booking.id}`}
                            >
                              {expandedBooking === d.booking.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedBooking === d.booking.id && (
                        <CardContent className="pt-0">
                          {renderExpandedContent(d.booking, idx)}
                        </CardContent>
                      )}
                    </Card>
                  ))}
              {(confirmedDerived.length > visibleConfirmed || visibleConfirmed > 30) && (
                <div className="flex justify-center gap-2 mt-2">
                  {confirmedDerived.length > visibleConfirmed && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleConfirmed(v => v + 30)}>Mostrar más</Button>
                  )}
                  {visibleConfirmed > 30 && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleConfirmed(30)}>Mostrar menos</Button>
                  )}
                </div>
              )}
              </div>
              )}
            </div>

            {/* Sección: Turnos en curso */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-blue-300"></div>
                <span className="text-xs font-bold tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded">TURNOS EN CURSO</span>
                <div className="flex-1 border-t border-blue-300"></div>
              </div>
              <div className="mt-4 space-y-4">
                {inProgressDerived.slice(0, visibleInProgress).map((d, idx) => (
                    <Card key={d.booking.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              {d.booking.courtName}
                              {(() => {
                                const statusKey = toBookingStatus(d.booking.status)
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${BOOKING_STATUS_COLORS[statusKey]}`}>
                                    {BOOKING_STATUS_LABELS[statusKey]}
                                  </span>
                                )
                              })()}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(d.booking.date).toLocaleDateString('es-ES')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {d.booking.timeRange}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {d.booking.userName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const remainingMs = d.remainingMs
                              return (
                                <span className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                                  EN CURSO · {formatRemaining(remainingMs)}
                                </span>
                              )
                            })()}
                            {(() => {
                              const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
                              const chipValue = d.chipValue
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(d.booking.paymentStatus, isDarkMode)}`}>
                                  ${formatCurrency(chipValue)}
                                </span>
                              )
                            })()}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBookingExpansion(d.booking.id)}
                              aria-expanded={expandedBooking === d.booking.id}
                              data-testid={`expand-booking-${d.booking.id}`}
                            >
                              {expandedBooking === d.booking.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedBooking === d.booking.id && (
                        <CardContent className="pt-0">
                          {renderExpandedContent(d.booking, idx)}
                        </CardContent>
                      )}
                    </Card>
                  ))}
              {(inProgressDerived.length > visibleInProgress || visibleInProgress > 30) && (
                <div className="flex justify-center gap-2 mt-2">
                  {inProgressDerived.length > visibleInProgress && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleInProgress(v => v + 30)}>Mostrar más</Button>
                  )}
                  {visibleInProgress > 30 && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleInProgress(30)}>Mostrar menos</Button>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Sección: Turnos completados */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-xs font-bold tracking-widest text-gray-700 bg-gray-50 px-3 py-1 rounded">TURNOS COMPLETADOS</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              <div className="mt-4 space-y-4">
                {completedDerived.slice(0, visibleCompleted).map((d, idx) => (
                    <Card key={d.booking.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              {d.booking.courtName}
                              {(() => {
                                const statusKey = toBookingStatus(d.booking.status)
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${BOOKING_STATUS_COLORS[statusKey]}`}>
                                    {BOOKING_STATUS_LABELS[statusKey]}
                                  </span>
                                )
                              })()}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(d.booking.date).toLocaleDateString('es-ES')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {d.booking.timeRange}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {d.booking.userName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const cat = d.category
                              if (cat === 'completed') {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">Finalizada · confirmar cierre</span>
                                )
                              }
                              return (
                                <span className="px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">Completada</span>
                              )
                            })()}
                            {(() => {
                              const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
                              const chipValue = d.chipValue
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(d.booking.paymentStatus, isDarkMode)}`}>
                                  ${formatCurrency(chipValue)}
                                </span>
                              )
                            })()}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBookingExpansion(d.booking.id)}
                              aria-expanded={expandedBooking === d.booking.id}
                              data-testid={`expand-booking-${d.booking.id}`}
                            >
                              {expandedBooking === d.booking.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedBooking === d.booking.id && (
                        <CardContent className="pt-0">
                          {renderExpandedContent(d.booking, idx)}
                        </CardContent>
                      )}
                    </Card>
                  ))}
              {(completedDerived.length > visibleCompleted || visibleCompleted > 30) && (
                <div className="flex justify-center gap-2 mt-2">
                  {completedDerived.length > visibleCompleted && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleCompleted(v => v + 30)}>Mostrar más</Button>
                  )}
                  {visibleCompleted > 30 && (
                    <Button variant="outline" size="sm" onClick={() => setVisibleCompleted(30)}>Mostrar menos</Button>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Sección: Turnos cerrados (resumen compacto) */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                <span className="text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded">TURNOS CERRADOS</span>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {closedDerived.slice(0, visibleClosed).map((d) => (
                    <div
                      key={d.booking.id}
                      className="px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">{d.booking.courtName}</span>
                      <span>{new Date(d.booking.date).toLocaleDateString('es-ES')}</span>
                      <span>{d.booking.timeRange}</span>
                      <span className="truncate">{d.booking.userName}</span>
                      {d.booking.closedAt && (
                        <span className="text-gray-500 dark:text-gray-500">
                          cerrado {new Date(d.booking.closedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {(closedDerived.length > visibleClosed || visibleClosed > 30) && (
                  <div className="flex justify-center gap-2 py-2 border-t border-gray-200 dark:border-gray-700">
                    {closedDerived.length > visibleClosed && (
                      <Button variant="outline" size="sm" onClick={() => setVisibleClosed(v => v + 30)}>Mostrar más</Button>
                    )}
                    {visibleClosed > 30 && (
                      <Button variant="outline" size="sm" onClick={() => setVisibleClosed(30)}>Mostrar menos</Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Extras */}
  {showExtrasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
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
                        {p.nombre} (Stock: {p.stock}){!p.activo ? ' - INACTIVO' : ''}{p.stock <= 0 ? ' - SIN STOCK' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-1 text-xs">
                  {selectedProduct ? (
                    selectedProduct.activo && selectedProduct.stock > 0 ? (
                      <span className="text-green-600">Disponible · Stock: {selectedProduct.stock}</span>
                    ) : (
                      <span className="text-gray-500">No disponible · { !selectedProduct.activo ? 'Inactivo' : 'Sin stock' }</span>
                    )
                  ) : (
                    <span className="text-gray-500">Seleccione un producto</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad</label>
                <Input
                  type="number"
                  min={1}
                  max={selectedProduct?.stock ?? undefined}
                  value={quantity}
                  disabled={!selectedProductId}
                  onChange={(e) => {
                    if (!selectedProductId) return
                    const v = Number(e.target.value)
                    const max = selectedProduct?.stock ?? Infinity
                    setQuantity(Math.max(1, Math.min(v, max)))
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Costo total</label>
                <Input
                  type="number"
                  value={selectedProductId ? Number((productos.find(p => p.id === selectedProductId)?.precio ?? 0) * quantity).toFixed(2) : '0.00'}
                  disabled
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
                          ? `Solo ${selectedPlayers[0] === 'player1' ? 'jugador 1' : selectedPlayers[0] === 'player2' ? 'jugador 2' : selectedPlayers[0] === 'player3' ? 'jugador 3' : 'jugador 4'}`
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
                        const label = `Solo jugador ${idx+1}`
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
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={closeExtrasModal} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleAddExtra} 
                className="flex-1"
                disabled={!selectedProductId || quantity <= 0 || addingExtra || !selectedProduct?.activo || (selectedProduct?.stock ?? 0) <= 0}
              >
                {addingExtra ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Procesando...</>) : 'Agregar Extra'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calendario */}
       <CalendarModal
         isOpen={showCalendarModal}
         onOpenChange={setShowCalendarModal}
         events={convertBookingsToCalendarEvents}
         selectedDate={selectedDate}
         onDateSelect={setSelectedDate}
       />

      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label htmlFor="search-turnos" className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 w-4 h-4" />
                <Input
                  id="search-turnos"
                  type="text"
                  placeholder="Nombre, email o cancha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="status-filter"
              >
                <option value="all">Todos los estados</option>
                <option value="confirmed">Confirmados</option>
                <option value="in_progress">En curso</option>
                <option value="completed">Completados</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="date-filter"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="plus1">Mañana</option>
                <option value="plus2">Pasado mañana</option>
                <option value="plus3">En 3 días</option>
                <option value="plus4">En 4 días</option>
                <option value="plus5">En 5 días</option>
                <option value="plus6">En 6 días</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFilter('all')
                }}
                className="w-full"
                data-testid="clear-filters"
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowFiltersModal(false)}>Cancelar</Button>
            <Button onClick={() => setShowFiltersModal(false)}>Aplicar filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de doble validación para completar turno */}
      {confirmBookingId && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setConfirmBookingId(null); setConfirmChecked(false) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar cierre definitivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[var(--accent-foreground)]">Este turno se cerrará definitivamente y quedará en modo solo lectura. Confirma para continuar.</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
                Acepto el cierre definitivo del turno
              </label>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => { setConfirmBookingId(null); setConfirmChecked(false) }}>Cancelar</Button>
              <Button 
                onClick={() => { if (confirmBookingId && confirmChecked) { closeBooking(confirmBookingId); setConfirmBookingId(null); setConfirmChecked(false) } }}
                disabled={!confirmChecked}
                aria-disabled={!confirmChecked}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {cancelBookingId && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setCancelBookingId(null) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar turno</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-[var(--accent-foreground)]">¿Estás seguro de cancelar el turno? Esta acción liberará el horario en el dashboard.</p>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setCancelBookingId(null)}>No</Button>
              <Button onClick={() => { if (cancelBookingId) { cancelBooking(cancelBookingId); setCancelBookingId(null) } }}>
                Sí, cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showExceptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Excepciones de turno fijo</h3>
              <Button variant="ghost" size="sm" onClick={closeExceptionsModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de excepción</label>
                <Select value={exceptionType} onValueChange={(v) => setExceptionType(v as 'SKIP' | 'OVERRIDE')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SKIP">Baja puntual (SKIP)</SelectItem>
                    <SelectItem value="OVERRIDE">Override de precio/nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Motivo (opcional)</label>
                <Input value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} />
              </div>
              {exceptionType === 'OVERRIDE' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Nuevo precio</label>
                  <Input type="number" min={0} value={exceptionNewPrice === '' ? '' : String(exceptionNewPrice)} onChange={(e) => {
                    const v = e.target.value
                    if (v === '') { setExceptionNewPrice(''); return }
                    const n = Number(v)
                    if (!Number.isNaN(n)) setExceptionNewPrice(n)
                  }} />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={closeExceptionsModal} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreateException} className="flex-1" disabled={processingException || (exceptionType === 'OVERRIDE' && (exceptionNewPrice === '' || Number(exceptionNewPrice) < 0))}>
                {processingException ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Procesando...</>) : 'Guardar excepción'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminTurnos
