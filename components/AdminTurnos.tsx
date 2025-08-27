/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, List, Clock, User, MapPin, DollarSign, Filter, Search, RefreshCw, ChevronDown, ChevronUp, Plus, X, TrendingUp, CheckCircle, AlertCircle, Users, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { removeDuplicates } from '@/lib/utils/array-utils'
import { useAppState } from '@/components/providers/AppStateProvider'
import { useCourtPrices } from '@/hooks/useCourtPrices'

// Interfaces segÃºn especificaciones del documento
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
  paymentDetails: {
    player1: { lastPaymentDate?: string; pendingAmount?: number }
    player2: { lastPaymentDate?: string; pendingAmount?: number }
    player3: { lastPaymentDate?: string; pendingAmount?: number }
    player4: { lastPaymentDate?: string; pendingAmount?: number }
  }
  extras: Extra[]
  lastUpdated?: number
}

interface Extra {
  id: string
  type: 'alquiler_raqueta' | 'pelota' | 'toalla' | 'bebida' | 'snack' | 'otro'
  name: string
  cost: number
  assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4' | 'individual'
  individualEnabled?: boolean
}

interface AdminTurnosProps {
  className?: string
}

const AdminTurnos: React.FC<AdminTurnosProps> = ({ className = "" }) => {
  const { isDarkMode, getPaymentStatusColor, getStatusColor } = useAppState()
  const { courts, getCourtTotalPrice, getCourtPrice, isCourtActive } = useCourtPrices()
  
  // Estados del componente segÃºn especificaciones
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

  // Estados para el modal de extras
  const [showExtrasModal, setShowExtrasModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedExtraType, setSelectedExtraType] = useState<'alquiler_raqueta' | 'pelota' | 'toalla' | 'bebida' | 'snack' | 'otro' | null>(null)
  const [extraCost, setExtraCost] = useState(0)
  const [extraAssignedTo, setExtraAssignedTo] = useState<'all' | 'player1' | 'player2' | 'player3' | 'player4' | 'individual'>('all')
  const [isIndividualEnabled, setIsIndividualEnabled] = useState(false)
  const [extraIndividualEnabled, setExtraIndividualEnabled] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Datos mock para desarrollo segÃºn especificaciones
  const mockBookings: Booking[] = [
    {
      id: '1',
      courtName: 'Cancha 1',
      date: '2024-01-20',
      timeRange: '10:00 - 11:30',
      userName: 'Juan PÃ©rez',
      userEmail: 'juan@email.com',
      status: 'confirmado',
      paymentStatus: 'parcial',
      totalPrice: 8000,
      createdAt: '2024-01-19T10:00:00Z',
      players: {
        player1: 'Juan PÃ©rez',
        player2: 'Jugador 2',
        player3: 'Jugador 3',
        player4: 'Jugador 4'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pagado',
        player3: 'pendiente',
        player4: 'pagado'
      },
      paymentDetails: {
        player1: { lastPaymentDate: '2024-01-19', pendingAmount: 0 },
        player2: { lastPaymentDate: '2024-01-19', pendingAmount: 0 },
        player3: { lastPaymentDate: undefined, pendingAmount: 2375 },
        player4: { lastPaymentDate: '2024-01-19', pendingAmount: 0 }
      },
      extras: [
        {
          id: 'extra1',
          type: 'pelota',
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
      userName: 'Pedro RodrÃ­guez',
      userEmail: 'pedro@email.com',
      status: 'completado',
      paymentStatus: 'pagado',
      totalPrice: 12000,
      createdAt: '2024-01-19T14:00:00Z',
      players: {
        player1: 'Pedro RodrÃ­guez',
        player2: 'Jugador 2',
        player3: 'Jugador 3',
        player4: 'Jugador 4'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pagado',
        player3: 'pagado',
        player4: 'pagado'
      },
      paymentDetails: {
        player1: { lastPaymentDate: '2024-01-20', pendingAmount: 0 },
        player2: { lastPaymentDate: '2024-01-20', pendingAmount: 0 },
        player3: { lastPaymentDate: '2024-01-20', pendingAmount: 0 },
        player4: { lastPaymentDate: '2024-01-20', pendingAmount: 0 }
      },
      extras: [
        {
          id: 'extra2',
          type: 'bebida',
          name: 'Gatorade',
          cost: 800,
          assignedTo: 'player1'
        },
        {
          id: 'extra3',
          type: 'alquiler_raqueta',
          name: 'Paleta Bullpadel',
          cost: 2500,
          assignedTo: 'player3'
        }
      ]
    },
    {
      id: '3',
      courtName: 'Cancha 3',
      date: '2024-01-21',
      timeRange: '16:00 - 17:30',
      userName: 'Ana LÃ³pez',
      userEmail: 'ana@email.com',
      status: 'confirmado',
      paymentStatus: 'pendiente',
      totalPrice: 10000,
      createdAt: '2024-01-20T16:00:00Z',
      players: {
        player1: 'Ana LÃ³pez',
        player2: 'Jugador 2'
      },
      individualPayments: {
        player1: 'pendiente',
        player2: 'pendiente',
        player3: 'pendiente',
        player4: 'pendiente'
      },
      paymentDetails: {
        player1: { lastPaymentDate: undefined, pendingAmount: 5000 },
        player2: { lastPaymentDate: undefined, pendingAmount: 5000 },
        player3: { lastPaymentDate: undefined, pendingAmount: 0 },
        player4: { lastPaymentDate: undefined, pendingAmount: 0 }
      },
      extras: []
    }
  ]

  // Funciones de utilidad según especificaciones
  
  // Eliminar declaraciones duplicadas de getPaymentStatusColor y getStatusColor
  // ya que se están importando desde useAppState()
  
  // Función para determinar el estado del turno basado en la fecha y hora actual
  const getBookingStatus = (booking: Booking): 'Confirmado' | 'Completado' => {
    const now = new Date()
    const bookingDate = new Date(booking.date)
    
    // Extraer la hora de inicio del timeRange (formato: "HH:MM - HH:MM")
    const timeStart = booking.timeRange.split(' - ')[0]
    const [hours, minutes] = timeStart.split(':').map(Number)
    
    // Crear fecha completa del turno con la hora de inicio
    const bookingDateTime = new Date(bookingDate)
    bookingDateTime.setHours(hours, minutes, 0, 0)
    
    // Comparar con la hora actual
    return now >= bookingDateTime ? 'Completado' : 'Confirmado'
  }

  // Función para obtener el nombre del jugador según la nueva lógica
  const getPlayerDisplayName = (playerKey: string, playerName: string): string => {
    if (playerKey === 'player1') {
      return playerName // Usar el nombre real del titular
    }
    // Usar nombres genéricos para los demás jugadores
    const playerNumber = playerKey.slice(-1)
    return `Jugador ${playerNumber}`
  }

  // Función para calcular monto individual de cada jugador
  const calculatePlayerAmount = (booking: Booking, playerKey: keyof Booking['players']): number => {
    const totalPlayers = Object.keys(booking.players).filter(key => booking.players[key as keyof Booking['players']]).length
    const baseAmount = booking.totalPrice / totalPlayers
    
    // Calcular extras
    const extrasAmount = booking.extras.reduce((sum, extra) => {
      if (extra.assignedTo === 'all') {
        // Extras para todos los jugadores se dividen entre todos
        return sum + (extra.cost / totalPlayers)
      } else if (extra.assignedTo === 'individual') {
        // Extras individuales se dividen entre todos los jugadores solo si están habilitados
        if (extra.individualEnabled) {
          return sum + (extra.cost / totalPlayers)
        }
        return sum
      } else if (extra.assignedTo === playerKey) {
        // Extras asignados específicamente a este jugador
        return sum + extra.cost
      }
      return sum
    }, 0)
    
    return baseAmount + extrasAmount
  }

  // Funciones para gestiÃ³n de extras
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

  // Función para calcular precio total considerando extras individuales
  const calculateTotalPrice = (booking: Booking) => {
    const basePrice = booking.totalPrice;
    const extrasPrice = booking.extras.reduce((sum, extra) => {
      // Si es individual y no está habilitado, no se suma al precio
      if (extra.assignedTo === 'individual' && !extra.individualEnabled) {
        return sum;
      }
      return sum + extra.cost;
    }, 0);
    return basePrice + extrasPrice;
  }

  const toggleIndividualExtra = (bookingId: string, extraId: string) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => {
        if (booking.id === bookingId) {
          const updatedExtras = booking.extras.map(extra => {
            if (extra.id === extraId && extra.assignedTo === 'individual') {
              return { ...extra, individualEnabled: !extra.individualEnabled }
            }
            return extra
          })
          
          // Crear booking temporal con extras actualizados para recalcular montos
          const tempBooking = { ...booking, extras: updatedExtras }
          
          // Recalcular paymentDetails para todos los jugadores
          const updatedPaymentDetails = Object.keys(booking.paymentDetails).reduce((acc, key) => {
            const playerKey = key as keyof typeof booking.paymentDetails
            const currentDetails = booking.paymentDetails[playerKey]
            const newPendingAmount = booking.individualPayments[playerKey] === 'pendiente' 
              ? calculatePlayerAmount(tempBooking, playerKey)
              : 0
            
            acc[playerKey] = {
              lastPaymentDate: currentDetails?.lastPaymentDate || '',
              pendingAmount: newPendingAmount
            }
            return acc
          }, {} as typeof booking.paymentDetails)
          
          return { 
            ...booking, 
            extras: updatedExtras,
            paymentDetails: updatedPaymentDetails,
            // Agregar timestamp para forzar re-renderización
            lastUpdated: Date.now()
          }
        }
        return booking
      })
    )
    // Forzar actualización del estado filtrado
    setFilteredBookings(prev => [...prev])
  }

  const openExtrasModal = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setShowExtrasModal(true)
    setSelectedExtraType(null)
    setExtraCost(0)
    setExtraAssignedTo('all')
  }

  const closeExtrasModal = () => {
    setShowExtrasModal(false)
    setSelectedBookingId(null)
    setSelectedExtraType(null)
    setExtraCost(0)
    setExtraAssignedTo('all')
  }

  // Cargar productos desde la API
  const loadProductos = async () => {
    setLoadingProductos(true)
    try {
      const response = await fetch('/api/productos')
      if (response.ok) {
        const result = await response.json()
        // La API devuelve { success: true, data: productos[] }
        if (result.success && Array.isArray(result.data)) {
          setProductos(result.data)
        } else {
          console.warn('API response format unexpected:', result)
          setProductos([])
        }
      } else {
        console.error('Failed to fetch productos:', response.status)
        setProductos([])
      }
    } catch (error) {
      console.error('Error loading productos:', error)
      setProductos([])
    } finally {
      setLoadingProductos(false)
    }
  }

  // Obtener precio del producto según el tipo de extra
  const getProductPrice = (extraType: string) => {
    const productMap = {
      'alquiler_raqueta': 'Alquiler de Raqueta',
      'pelota': 'Pelota de Pádel', 
      'toalla': 'Toalla',
      'bebida': 'Bebida',
      'snack': 'Snack',
      'otro': 'Otro'
    }
    
    // Validar que productos sea un array antes de usar find
    if (!Array.isArray(productos)) {
      console.warn('productos is not an array:', productos)
      return 0
    }
    
    const productName = productMap[extraType]
    const product = productos.find(p => p.nombre === productName && p.activo)
    return product ? product.precio : 0
  }

  // Manejar cambio de tipo de extra y actualizar precio automáticamente
  const handleExtraTypeChange = (type: string) => {
    setSelectedExtraType(type as 'alquiler_raqueta' | 'pelota' | 'toalla' | 'bebida' | 'snack' | 'otro')
    const price = getProductPrice(type)
    setExtraCost(price)
  }

  const handleAddExtra = () => {
    if (!selectedBookingId || !selectedExtraType || extraCost <= 0) return
    
    const extraNames = {
      alquiler_raqueta: 'Alquiler de Raqueta',
      pelota: 'Pelota de Pádel',
      toalla: 'Toalla',
      bebida: 'Bebida',
      snack: 'Snack',
      otro: 'Otro'
    }
    
    const newExtra = {
      type: selectedExtraType,
      name: extraNames[selectedExtraType],
      cost: extraCost,
      assignedTo: extraAssignedTo,
      ...(extraAssignedTo === 'individual' && { individualEnabled: true })
    }
    
    addExtra(selectedBookingId, newExtra)
    
    closeExtrasModal()
  }

  // Cargar datos
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true)
      try {
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 1000))
        setBookings(mockBookings)
      } catch (error) {
        console.error('Error loading bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [])

  // Cargar productos cuando se abre el modal de extras
  useEffect(() => {
    if (showExtrasModal) {
      loadProductos()
    }
  }, [showExtrasModal])

  // Filtrar reservas con exclusiÃ³n automÃ¡tica de turnos pendientes
  useEffect(() => {
    let filtered = [...bookings]

    // Filtro automÃ¡tico: excluir turnos pendientes SIEMPRE
    filtered = filtered.filter(booking => booking.status !== 'pendiente')

    // Filtrar por tÃ©rmino de bÃºsqueda
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.courtName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado especÃ­fico
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const today = new Date()
      const filterDate = new Date(today)
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date)
            return bookingDate.toDateString() === today.toDateString()
          })
          break
        case 'week':
          filterDate.setDate(today.getDate() + 7)
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date)
            return bookingDate >= today && bookingDate <= filterDate
          })
          break
        case 'month':
          filterDate.setMonth(today.getMonth() + 1)
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date)
            return bookingDate >= today && bookingDate <= filterDate
          })
          break
      }
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, dateFilter])

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId)
  }

  const updateBookingStatus = (bookingId: string, newStatus: Booking['status']) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      )
    )
  }

  const togglePlayerPayment = (bookingId: string, playerKey: keyof Booking['individualPayments']) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => {
        if (booking.id === bookingId) {
          const newPaymentStatus = booking.individualPayments[playerKey] === 'pagado' ? 'pendiente' : 'pagado'
          const newPayments = {
            ...booking.individualPayments,
            [playerKey]: newPaymentStatus
          }
          
          // Actualizar paymentDetails
          const playerAmount = calculatePlayerAmount(booking, playerKey as keyof Booking['players'])
          const currentDate = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
          
          const newPaymentDetails = {
            ...booking.paymentDetails,
            [playerKey]: {
              lastPaymentDate: newPaymentStatus === 'pagado' ? currentDate : booking.paymentDetails[playerKey as keyof typeof booking.paymentDetails]?.lastPaymentDate,
              pendingAmount: newPaymentStatus === 'pagado' ? 0 : playerAmount
            }
          }
          
          // Recalcular estado general de pago
          const paidCount = Object.values(newPayments).filter(status => status === 'pagado').length
          const totalPlayers = Object.keys(booking.players).length
          
          let paymentStatus: Booking['paymentStatus']
          if (paidCount === 0) {
            paymentStatus = 'pendiente'
          } else if (paidCount === totalPlayers) {
            paymentStatus = 'pagado'
          } else {
            paymentStatus = 'parcial'
          }
          
          return {
            ...booking,
            individualPayments: newPayments,
            paymentDetails: newPaymentDetails,
            paymentStatus
          }
        }
        return booking
      })
    )
  }

  // Calcular estadÃ­sticas
  const totalBookings = filteredBookings.length
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmado').length
  const totalRevenue = filteredBookings.reduce((sum, booking) => {
    return sum + calculateTotalPrice(booking)
  }, 0)
  
  const totalCollected = filteredBookings.reduce((sum, booking) => {
    if (booking.paymentStatus === 'pagado') {
      return sum + calculateTotalPrice(booking)
    } else if (booking.paymentStatus === 'parcial') {
      const paidPlayers = Object.entries(booking.individualPayments).filter(([_, status]) => status === 'pagado')
      const paidAmount = paidPlayers.reduce((playerSum, [playerKey, _]) => {
        return playerSum + calculatePlayerAmount(booking, playerKey as keyof Booking['players'])
      }, 0)
      return sum + paidAmount
    }
    return sum
  }, 0)
  
  const pendingBalance = totalRevenue - totalCollected
  const reserveTotal = filteredBookings.reduce((sum, booking) => sum + booking.totalPrice, 0)

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
          <h2 id="turnos-title" className="text-2xl font-bold text-gray-900">GestiÃ³n de Turnos</h2>
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
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            aria-pressed={viewMode === 'calendar'}
            aria-label="Vista de calendario"
            data-testid="view-calendar-button"
          >
            <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
            Calendario
          </Button>
        </nav>
      </header>

      {/* EstadÃ­sticas RÃ¡pidas - 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
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
                <p className="text-2xl font-bold text-gray-900">{confirmedBookings}</p>
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
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Financiero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Recaudado</p>
              <p className="text-xl font-bold text-green-700">${totalCollected.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Saldo Pendiente</p>
              <p className="text-xl font-bold text-yellow-700">${pendingBalance.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Reserva</p>
              <p className="text-xl font-bold text-blue-700">${reserveTotal.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <label htmlFor="search-turnos" className="text-sm font-medium text-gray-700">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Estado</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="status-filter"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
            <option value="completado">Completado</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">Fecha</label>
          <select
            id="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="date-filter"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
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
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay turnos</h3>
              <p className="text-gray-600">No se encontraron reservas con los filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      {booking.courtName}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getBookingStatus(booking).toLowerCase(), 'current', isDarkMode)}`}>
                        {getBookingStatus(booking)}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.date).toLocaleDateString('es-ES')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.timeRange}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {booking.userName}
                      </span>
                    </div>
                    
                    {/* Información adicional de pago en el header */}
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Monto pagado */}
                        <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                          Pagado: ${(() => {
                            const totalAmount = calculateTotalPrice(booking);
                            const pendingAmount = Object.values(booking.paymentDetails).reduce((sum, details) => sum + (details?.pendingAmount || 0), 0);
                            return (totalAmount - pendingAmount).toLocaleString();
                          })()}
                        </span>
                        
                        {/* Monto pendiente */}
                        <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                          Pendiente: ${Object.values(booking.paymentDetails).reduce((sum, details) => sum + (details?.pendingAmount || 0), 0).toLocaleString()}
                        </span>
                        
                        {/* Fecha del último pago si existe */}
                        {booking.paymentStatus === 'pagado' && (
                          <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Último pago: {Object.values(booking.paymentDetails).find(details => details?.lastPaymentDate)?.lastPaymentDate || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus, isDarkMode)}`}>
                      ${calculateTotalPrice(booking).toLocaleString()}
                    </span>
                    
                    {/* Botón toggle de pago general */}
                    <Button
                      variant={booking.paymentStatus === 'pagado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        // Toggle del estado de pago general
                        const newStatus = booking.paymentStatus === 'pagado' ? 'pendiente' : 'pagado'
                        setBookings(prev => prev.map(b => 
                          b.id === booking.id 
                            ? { 
                                ...b, 
                                paymentStatus: newStatus,
                                // Actualizar todos los pagos individuales al mismo estado
                                individualPayments: Object.keys(b.individualPayments).reduce((acc, key) => {
                                  acc[key as keyof typeof b.individualPayments] = newStatus
                                  return acc
                                }, {} as typeof b.individualPayments),
                                // Actualizar paymentDetails para todos los jugadores
                                paymentDetails: Object.keys(b.paymentDetails).reduce((acc, key) => {
                                  const currentDetails = b.paymentDetails[key as keyof typeof b.paymentDetails]
                                  acc[key as keyof typeof b.paymentDetails] = {
                                    lastPaymentDate: newStatus === 'pagado' ? new Date().toISOString().split('T')[0] : currentDetails?.lastPaymentDate || '',
                                    pendingAmount: newStatus === 'pagado' ? 0 : calculatePlayerAmount(b, key as keyof Booking['players'])
                                  }
                                  return acc
                                }, {} as typeof b.paymentDetails)
                              } 
                            : b
                        ))
                      }}
                      className={`text-xs transition-all duration-200 transform hover:scale-105 ${
                        booking.paymentStatus === 'pagado' 
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-md border-2 border-green-600' 
                          : 'border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-white'
                      }`}
                      data-testid={`payment-toggle-${booking.id}`}
                    >
                      {booking.paymentStatus === 'pagado' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Pagado</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 mr-1" />Pendiente</>
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookingExpansion(booking.id)}
                      aria-expanded={expandedBooking === booking.id}
                      data-testid={`expand-booking-${booking.id}`}
                    >
                      {expandedBooking === booking.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedBooking === booking.id && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4 space-y-4">
                    {/* InformaciÃ³n de jugadores y pagos */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Jugadores y Pagos Individuales</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(booking.players).map(([playerKey, playerName]) => {
                          if (!playerName) return null
                          const paymentStatus = booking.individualPayments[playerKey as keyof typeof booking.individualPayments]
                          const playerAmount = calculatePlayerAmount(booking, playerKey as keyof Booking['players'])
                          const paymentDetails = booking.paymentDetails[playerKey as keyof typeof booking.paymentDetails]
                          const pendingAmount = paymentDetails?.pendingAmount || 0
                          const lastPaymentDate = paymentDetails?.lastPaymentDate
                          
                          return (
                            <div key={playerKey} className="flex flex-col p-3 bg-gray-50 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{getPlayerDisplayName(playerKey, playerName)}</p>
                                  <p className="text-xs text-gray-600">
                                    {playerKey === 'player1' ? 'Titular' : `Jugador ${playerKey.slice(-1)}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Total: ${playerAmount.toLocaleString()}
                                  </p>
                                </div>
                                <Button
                                  variant={paymentStatus === 'pagado' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => togglePlayerPayment(booking.id, playerKey as keyof typeof booking.individualPayments)}
                                  className={`text-xs transition-all duration-200 transform hover:scale-105 ${
                                    paymentStatus === 'pagado' 
                                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md border-2 border-green-600' 
                                      : 'border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-white'
                                  }`}
                                  data-testid={`payment-${booking.id}-${playerKey}`}
                                >
                                  {paymentStatus === 'pagado' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" />Pagado</>
                                  ) : (
                                    <><AlertCircle className="w-3 h-3 mr-1" />Pendiente</>
                                  )}
                                </Button>
                              </div>
                              
                              {/* Información adicional de pago */}
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-4">
                                  {paymentStatus === 'pendiente' && pendingAmount > 0 && (
                                    <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                      Debe: ${pendingAmount.toLocaleString()}
                                    </span>
                                  )}
                                  {paymentStatus === 'pagado' && lastPaymentDate && (
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                                      Pagado: {new Date(lastPaymentDate).toLocaleDateString('es-ES')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* SecciÃ³n de extras */}
                    {booking.extras.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Extras Agregados
                        </h4>
                        <div className="space-y-2">
                          {booking.extras.map((extra) => (
                            <div key={extra.id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-sm text-gray-900">{extra.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({extra.assignedTo === 'all' ? 'Todos' : 
                                    extra.assignedTo === 'individual' ? 'Individual' :
                                    Object.entries(booking.players).find(([key]) => key === extra.assignedTo)?.[1] || 'N/A'})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {extra.assignedTo === 'individual' && (
                                  <Button
                                    variant={extra.individualEnabled ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleIndividualExtra(booking.id, extra.id)}
                                    className={`h-6 w-6 p-0 rounded transition-all duration-200 ${
                                      extra.individualEnabled 
                                        ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white shadow-sm' 
                                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                  >
                                    {extra.individualEnabled && (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                                <span className="text-sm font-medium text-gray-900">${extra.cost.toLocaleString()}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExtra(booking.id, extra.id)}
                                  className="text-red-500 hover:text-red-700 p-1 h-auto"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acciones de administraciÃ³n */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openExtrasModal(booking.id)}
                        className="text-purple-600 border-purple-300 hover:bg-purple-50"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar Extra
                      </Button>
                      {booking.status === 'confirmado' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'completado')}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          data-testid={`complete-booking-${booking.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Completar
                        </Button>
                      )}
                      {booking.status !== 'cancelado' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'cancelado')}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          data-testid={`cancel-booking-${booking.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal de Extras */}
      {showExtrasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Agregar Extra</h3>
              <Button variant="ghost" size="sm" onClick={closeExtrasModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Extra</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedExtraType || ''}
                  onChange={(e) => handleExtraTypeChange(e.target.value)}
                  disabled={loadingProductos}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="alquiler_raqueta">Alquiler de Raqueta</option>
                  <option value="pelota">Pelota</option>
                  <option value="toalla">Toalla</option>
                  <option value="bebida">Bebida</option>
                  <option value="snack">Snack</option>
                  <option value="otro">Otro</option>
                </select>
                {loadingProductos && (
                  <p className="text-sm text-gray-500 mt-1">Cargando precios...</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Costo (Solo lectura)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={extraCost}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">El precio se obtiene automáticamente de la base de datos de productos</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Asignado a</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={extraAssignedTo}
                  onChange={(e) => {
                    const value = e.target.value as 'all' | 'player1' | 'player2' | 'player3' | 'player4' | 'individual';
                    setExtraAssignedTo(value);
                    if (value !== 'individual') {
                      setIsIndividualEnabled(false);
                    }
                  }}
                >
                  <option value="all">Todos los jugadores</option>
                  <option value="player1">Solo titular</option>
                  <option value="player2">Solo jugador 2</option>
                  <option value="player3">Solo jugador 3</option>
                  <option value="player4">Solo jugador 4</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={closeExtrasModal} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleAddExtra} 
                className="flex-1"
                disabled={!selectedExtraType || !extraCost}
              >
                Agregar Extra
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminTurnos
