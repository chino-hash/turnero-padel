'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Badge component not available, using custom spans with Tailwind classes
import { Calendar, List, Clock, User, MapPin, DollarSign, Filter, Search, RefreshCw, ChevronDown, ChevronUp, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
// Select component not available, using native HTML select elements
import { removeDuplicates } from '@/lib/utils/array-utils'
import { useAppState } from '@/components/providers/AppStateProvider'
import { useCourtPrices } from '@/hooks/useCourtPrices'

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
    player1: string // titular
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
  extras?: Extra[]
}

interface Extra {
  id: string
  type: string
  name: string
  cost: number
  assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4' | 'particular'
  particularPaid?: boolean
}

interface AdminTurnosProps {
  className?: string
}

const AdminTurnos: React.FC<AdminTurnosProps> = ({ className = "" }) => {
  const { isDarkMode, getPaymentStatusColor, getStatusColor } = useAppState()
  const { courts, getCourtTotalPrice, getCourtPrice, isCourtActive } = useCourtPrices()
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  
  // Estados para el modal de extras
  const [showExtrasModal, setShowExtrasModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedExtraType, setSelectedExtraType] = useState<string | null>(null)
  const [selectedExtraName, setSelectedExtraName] = useState<string>('')
  const [extraCost, setExtraCost] = useState<number>(0)
  const [extraAssignedTo, setExtraAssignedTo] = useState<'all' | 'player1' | 'player2' | 'player3' | 'player4' | 'particular'>('all')
  const [particularPaid, setParticularPaid] = useState<boolean>(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Datos de productos organizados por categorías
  const productosExtras = {
    'Bebidas': [
      { id: 'agua-pequena', name: 'Agua Pequeña', price: 1500 },
      { id: 'agua-grande', name: 'Agua Grande', price: 2500 },
      { id: 'coca-pequena', name: 'Coca Cola Pequeña', price: 2000 },
      { id: 'coca-grande', name: 'Coca Cola Grande', price: 3000 },
      { id: 'fanta-pequena', name: 'Fanta Pequeña', price: 2000 },
      { id: 'fanta-grande', name: 'Fanta Grande', price: 3000 },
      { id: 'sprite-pequena', name: 'Sprite Pequeña', price: 2000 },
      { id: 'sprite-grande', name: 'Sprite Grande', price: 3000 },
      { id: 'cerveza-lata', name: 'Cerveza Lata', price: 4000 },
      { id: 'cerveza-botella', name: 'Cerveza Botella', price: 4500 },
      { id: 'gatorade-pequeno', name: 'Gatorade Pequeño', price: 3500 },
      { id: 'gatorade-grande', name: 'Gatorade Grande', price: 5000 }
    ],
    'Accesorios': [
      { id: 'grip', name: 'Grip', price: 8000 },
      { id: 'protector-paletas', name: 'Protector de Paletas', price: 12000 },
      { id: 'alquiler-paletas', name: 'Alquiler de Paletas', price: 15000 },
      { id: 'pelotas-x1', name: 'Pelotas x1', price: 5000 },
      { id: 'pelotas-x2', name: 'Pelotas x2', price: 9000 },
      { id: 'pelotas-x3', name: 'Pelotas x3', price: 13000 }
    ],
    'Equipamiento': [
      { id: 'paletas-profesionales', name: 'Paletas Profesionales', price: 85000 },
      { id: 'raquetas-entrenamiento', name: 'Raquetas de Entrenamiento', price: 45000 },
      { id: 'red-portatil', name: 'Red Portátil', price: 25000 }
    ],
    'Consumibles': [
      { id: 'toallas', name: 'Toallas', price: 8000 },
      { id: 'protector-solar', name: 'Protector Solar', price: 12000 },
      { id: 'vendas', name: 'Vendas', price: 3000 },
      { id: 'hielo', name: 'Hielo', price: 2000 }
    ]
  }

  // Datos de ejemplo para jugadores frecuentes
  const jugadoresFrecuentes = removeDuplicates([
    'Juan Pérez', 'María García', 'Carlos López', 'Ana Martín', 'Luis Rodríguez',
    'Carmen Sánchez', 'Pedro González', 'Laura Fernández', 'Miguel Torres', 'Elena Ruiz'
  ])

  const diasSemana = removeDuplicates(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'])

  // Datos de ejemplo para demostración
  const mockBookings: Booking[] = [
    {
      id: '1',
      courtName: 'Cancha 1',
      date: '2024-01-15',
      timeRange: '09:00 - 10:30',
      userName: 'Juan Pérez',
      userEmail: 'juan@email.com',
      status: 'confirmado',
      paymentStatus: 'pagado',
      totalPrice: 2500,
      createdAt: '2024-01-10T10:00:00Z',
      players: {
        player1: 'Juan Pérez',
        player2: 'María González',
        player3: 'Carlos Ruiz',
        player4: 'Ana López'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pendiente',
        player3: 'pagado',
        player4: 'pendiente'
      }
    },
    {
      id: '2',
      courtName: 'Cancha 2',
      date: '2024-01-15',
      timeRange: '11:00 - 12:30',
      userName: 'María García',
      userEmail: 'maria@email.com',
      status: 'pendiente',
      paymentStatus: 'pendiente',
      totalPrice: 2500,
      createdAt: '2024-01-12T14:30:00Z',
      players: {
        player1: 'María García',
        player2: 'Pedro Martínez',
        player3: 'Laura Sánchez'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pendiente',
        player3: 'pendiente',
        player4: 'pendiente'
      }
    },
    {
      id: '3',
      courtName: 'Cancha 1',
      date: '2024-01-16',
      timeRange: '15:00 - 16:30',
      userName: 'Carlos López',
      userEmail: 'carlos@email.com',
      status: 'confirmado',
      paymentStatus: 'parcial',
      totalPrice: 2500,
      createdAt: '2024-01-13T09:15:00Z',
      players: {
        player1: 'Carlos López',
        player2: 'Roberto Silva'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pagado',
        player3: 'pendiente',
        player4: 'pendiente'
      }
    },
    {
      id: '4',
      courtName: 'Cancha 3',
      date: '2024-01-14',
      timeRange: '18:00 - 19:30',
      userName: 'Ana Rodríguez',
      userEmail: 'ana@email.com',
      status: 'completado',
      paymentStatus: 'pagado',
      totalPrice: 2800,
      createdAt: '2024-01-11T16:45:00Z',
      players: {
        player1: 'Ana Rodríguez',
        player2: 'Luis Fernández',
        player3: 'Carmen Díaz',
        player4: 'Miguel Torres'
      },
      individualPayments: {
        player1: 'pagado',
        player2: 'pagado',
        player3: 'pagado',
        player4: 'pagado'
      }
    },
    {
      id: '5',
      courtName: 'Cancha 2',
      date: '2024-01-17',
      timeRange: '20:00 - 21:30',
      userName: 'Roberto Silva',
      userEmail: 'roberto@email.com',
      status: 'cancelado',
      paymentStatus: 'pendiente',
      totalPrice: 2500,
      createdAt: '2024-01-14T11:20:00Z',
      players: {
        player1: 'Roberto Silva'
      },
      individualPayments: {
        player1: 'pendiente',
        player2: 'pendiente',
        player3: 'pendiente',
        player4: 'pendiente'
      }
    }
  ]

  useEffect(() => {
    // Simular carga de datos
    const loadBookings = async () => {
      setLoading(true)
      // Aquí iría la llamada real a la API
      // const response = await fetch('/api/admin/bookings')
      // const data = await response.json()
      
      // Por ahora usamos datos mock
      setTimeout(() => {
        setBookings(mockBookings)
        setFilteredBookings(mockBookings)
        setLoading(false)
      }, 1000)
    }

    loadBookings()
  }, [])

  useEffect(() => {
    let filtered = bookings

    // Excluir automáticamente las reservas pendientes
    filtered = filtered.filter(booking => booking.status !== 'pendiente')

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.courtName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const today = new Date()
      const bookingDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => {
            const bDate = new Date(booking.date)
            return bDate.toDateString() === today.toDateString()
          })
          break
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(booking => {
            const bDate = new Date(booking.date)
            return bDate >= today && bDate <= weekFromNow
          })
          break
        case 'month':
          filtered = filtered.filter(booking => {
            const bDate = new Date(booking.date)
            return bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear()
          })
          break
      }
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, dateFilter])

  // Cleanup del scroll cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Restaurar scroll si el componente se desmonta con el modal abierto
      document.body.style.overflow = 'unset'
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const generateCalendarView = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Obtener primer día del mes y último día
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Empezar desde domingo
    
    const days = []
    const currentDate = new Date(startDate)
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dayBookings = filteredBookings.filter(booking => {
        const bookingDate = new Date(booking.date)
        return bookingDate.toDateString() === currentDate.toDateString()
      })
      
      days.push({
        date: new Date(currentDate),
        bookings: dayBookings,
        isCurrentMonth: currentDate.getMonth() === currentMonth,
        isToday: currentDate.toDateString() === today.toDateString()
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const refreshData = () => {
    setLoading(true)
    // Simular recarga de datos
    setTimeout(() => {
      setBookings([...mockBookings])
      setLoading(false)
    }, 500)
  }

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId)
  }

  const togglePaymentStatus = (bookingId: string) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => {
        if (booking.id === bookingId) {
          const newPaymentStatus = booking.paymentStatus === 'pagado' ? 'pendiente' : 'pagado'
          
          // Si se marca como pagado, actualizar todos los pagos individuales a pagado
          // Si se marca como pendiente, actualizar todos los pagos individuales a pendiente
          const updatedIndividualPayments = {
            player1: newPaymentStatus as 'pagado' | 'pendiente',
            player2: newPaymentStatus as 'pagado' | 'pendiente',
            player3: newPaymentStatus as 'pagado' | 'pendiente',
            player4: newPaymentStatus as 'pagado' | 'pendiente'
          }
          
          return { 
            ...booking, 
            paymentStatus: newPaymentStatus,
            individualPayments: updatedIndividualPayments
          }
        }
        return booking
      })
    )
  }

  const toggleIndividualPayment = (bookingId: string, playerKey: 'player1' | 'player2' | 'player3' | 'player4') => {
    setBookings(prev => prev.map(booking => {
      if (booking.id === bookingId) {
        // Actualizar el pago individual del jugador
        const updatedIndividualPayments = {
          ...booking.individualPayments,
          [playerKey]: booking.individualPayments[playerKey] === 'pagado' ? 'pendiente' : 'pagado'
        }
        
        // Verificar si todos los jugadores están pagados
        const allPlayersPaid = Object.values(updatedIndividualPayments).every(status => status === 'pagado')
        
        // Actualizar el estado general automáticamente
        const updatedPaymentStatus = allPlayersPaid ? 'pagado' : 
          Object.values(updatedIndividualPayments).some(status => status === 'pagado') ? 'parcial' : 'pendiente'
        
        return {
          ...booking,
          individualPayments: updatedIndividualPayments,
          paymentStatus: updatedPaymentStatus
        }
      }
      return booking
    }))
  }



  // Función para calcular el monto total real incluyendo extras
  const calculateTotalAmount = (booking: Booking) => {
    // Obtener el precio real de la cancha desde el hook
    const realCourtPrice = getCourtTotalPrice(booking.courtName)
    const baseAmount = realCourtPrice !== null ? realCourtPrice : booking.totalPrice
    
    // Calcular extras pagados (todos los tipos excepto particulares no pagados)
    const paidExtras = booking.extras?.filter(extra => 
      extra.assignedTo !== 'particular' || extra.particularPaid
    ) || []
    const extrasCost = paidExtras.reduce((sum, extra) => sum + extra.cost, 0)
    
    return baseAmount + extrasCost
  }

  // Función para calcular el monto individual que debe pagar cada jugador
  const calculatePlayerAmount = (booking: Booking, playerKey: 'player1' | 'player2' | 'player3' | 'player4') => {
    // Obtener el precio real por persona de la cancha desde el hook
    const realCourtPricePerPerson = getCourtPrice(booking.courtName)
    const baseAmount = realCourtPricePerPerson !== null ? realCourtPricePerPerson : (booking.totalPrice / 4)
    
    // Calcular extras asignados a este jugador específico
    const playerExtras = booking.extras?.filter(extra => extra.assignedTo === playerKey) || []
    const playerExtrasCost = playerExtras.reduce((sum, extra) => sum + extra.cost, 0)
    
    // Calcular extras divididos entre todos
    const sharedExtras = booking.extras?.filter(extra => extra.assignedTo === 'all') || []
    const sharedExtrasCost = sharedExtras.reduce((sum, extra) => sum + (extra.cost / 4), 0)
    
    return baseAmount + playerExtrasCost + sharedExtrasCost
  }

  // Funciones para manejar extras
  const openExtrasModal = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setShowExtrasModal(true)
    setSelectedExtraType(null)
    setExtraCost(0)
    setExtraAssignedTo('all')
    // Bloquear scroll de la página principal
    document.body.style.overflow = 'hidden'
  }

  const closeExtrasModal = () => {
    setShowExtrasModal(false)
    setSelectedBookingId(null)
    setSelectedExtraType(null)
    setSelectedExtraName('')
    setExtraCost(0)
    setExtraAssignedTo('all')
    setParticularPaid(false)
    setExpandedCategory(null)
    // Restaurar scroll de la página principal
    document.body.style.overflow = 'unset'
  }

  const handleExtraSelect = (category: string, productId: string, productName: string, price: number) => {
    setSelectedExtraType(category)
    setSelectedExtraName(productName)
    setExtraCost(price)
    setExpandedCategory(null) // Cerrar la categoría después de seleccionar
  }

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  const addExtra = () => {
    if (!selectedBookingId || !selectedExtraType || !selectedExtraName || extraCost <= 0) return

    const newExtra: Extra = {
      id: Date.now().toString(),
      type: selectedExtraType,
      name: selectedExtraName,
      cost: extraCost,
      assignedTo: extraAssignedTo,
      particularPaid: extraAssignedTo === 'particular' ? particularPaid : undefined
    }

    setBookings(prev => prev.map(booking => 
      booking.id === selectedBookingId
        ? { 
            ...booking, 
            extras: [...(booking.extras || []), newExtra]
          }
        : booking
    ))

    closeExtrasModal()
  }

  const removeExtra = (bookingId: string, extraId: string) => {
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId
        ? { 
            ...booking, 
            extras: booking.extras?.filter(extra => extra.id !== extraId) || []
          }
        : booking
    ))
  }

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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Turnos</h2>
          <p className="text-gray-600">Administra y supervisa todas las reservas</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendario
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por usuario, email o cancha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
              <option value="completado">Completado</option>
            </select>
            
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Vista de Lista */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Lista de Turnos ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No se encontraron turnos con los filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Hora</th>
                      <th className="text-left py-3 px-4 font-semibold">Usuario</th>
                      <th className="text-left py-3 px-4 font-semibold">Cancha</th>
                      <th className="text-left py-3 px-4 font-semibold">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold">Pago</th>
                      <th className="text-left py-3 px-4 font-semibold">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <React.Fragment key={booking.id}>
                        <tr 
                          className="border-b hover:bg-gray-50 cursor-pointer" 
                          onClick={() => toggleBookingExpansion(booking.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{booking.timeRange}</div>
                                <div className="text-sm text-gray-500">{formatDate(booking.date)}</div>
                              </div>
                              {expandedBooking === booking.id ? 
                                <ChevronUp className="w-4 h-4 text-gray-400 ml-2" /> : 
                                <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
                              }
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{booking.userName}</div>
                                <div className="text-sm text-gray-500">{booking.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{booking.courtName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status, 'booking', isDarkMode)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(booking.paymentStatus, isDarkMode)}`}>
                              {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold">${calculateTotalAmount(booking).toLocaleString()}</span>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Menú desplegable */}
                        {expandedBooking === booking.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 py-6">
                              <div className="bg-white p-6 rounded-lg border shadow-sm">
                                {/* Información del titular y estado general */}
                                <div className="flex justify-between items-start mb-6">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="w-4 h-4 text-blue-500" />
                                      <span className="font-medium text-blue-600">Titular:</span>
                                      <span className="text-gray-900 font-medium">{booking.players?.player1 || booking.userName}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-sm font-medium text-gray-700">Estado General</span>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-sm font-medium ${
                                        booking.paymentStatus === 'pagado' 
                                          ? 'text-green-600' 
                                          : 'text-gray-600'
                                      }`}>
                                        {booking.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          togglePaymentStatus(booking.id)
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                          booking.paymentStatus === 'pagado' 
                                            ? 'bg-green-500' 
                                            : 'bg-gray-400'
                                        }`}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            booking.paymentStatus === 'pagado' 
                                              ? 'translate-x-6' 
                                              : 'translate-x-1'
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Estado de pago individual */}
                                <div className="border-t border-gray-200 pt-4">
                                  <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700">Estado de Pago Individual</h4>
                                  </div>
                                  
                                  {/* Layout reorganizado: jugadores a la izquierda, toggles a la derecha */}
                                   <div className="flex gap-6">
                                     {/* Lista de jugadores en columna vertical alineada a la izquierda */}
                                     <div className="flex-1">
                                       <div className="space-y-3">
                                         {(['player1', 'player2', 'player3', 'player4'] as const).map((playerKey, index) => (
                                           <div key={playerKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border h-[60px]">
                                             <div className="flex items-center gap-2">
                                               <User className="w-4 h-4 text-gray-400" />
                                               <span className="text-sm font-medium text-gray-700">Jugador {index + 1}</span>
                                               {index === 0 && <span className="text-xs text-blue-600 font-medium">(Titular)</span>}
                                             </div>
                                             <div className="flex items-center gap-3">
                                               <span className="text-sm font-bold text-blue-600">
                                                 ${calculatePlayerAmount(booking, playerKey).toLocaleString()}
                                               </span>
                                               <span className={`text-xs font-medium ${
                                                 booking.individualPayments?.[playerKey] === 'pagado' 
                                                   ? 'text-green-600' 
                                                   : 'text-red-600'
                                               }`}>
                                                 {booking.individualPayments?.[playerKey] === 'pagado' ? 'Pagado' : 'Pendiente'}
                                               </span>
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                     
                                     {/* Botones toggle en columna vertical a la derecha - perfectamente alineados */}
                                     <div className="flex flex-col gap-3">
                                       {(['player1', 'player2', 'player3', 'player4'] as const).map((playerKey, index) => (
                                         <div key={playerKey} className="h-[60px] flex items-center justify-center">
                                           <button
                                             onClick={(e) => {
                                               e.stopPropagation()
                                               toggleIndividualPayment(booking.id, playerKey)
                                             }}
                                             className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                               booking.individualPayments?.[playerKey] === 'pagado' 
                                                 ? 'bg-green-500' 
                                                 : 'bg-gray-400'
                                             }`}
                                           >
                                             <span
                                               className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                                 booking.individualPayments?.[playerKey] === 'pagado' 
                                                   ? 'translate-x-5' 
                                                   : 'translate-x-1'
                                               }`}
                                             />
                                           </button>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                </div>
                                
                                {/* Información financiera - Movida debajo de la lista de jugadores */}
                                <div className="bg-blue-50 p-4 rounded-lg mt-6">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 mb-1">Monto Total</div>
                                      <div className="text-lg font-bold text-green-600">${calculateTotalAmount(booking).toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 mb-1">Pagado</div>
                                      <div className="text-lg font-bold text-green-600">
                                        ${(() => {
                                          const paidPlayers = Object.values(booking.individualPayments || {}).filter(status => status === 'pagado').length
                                          const realCourtPricePerPerson = getCourtPrice(booking.courtName)
                                          const amountPerPlayer = realCourtPricePerPerson !== null ? realCourtPricePerPerson : (booking.totalPrice / 4)
                                          const basePayments = paidPlayers * amountPerPlayer
                                          
                                          // Agregar extras particulares pagados
                                          const paidParticularExtras = booking.extras?.filter(extra => 
                                            extra.assignedTo === 'particular' && extra.particularPaid
                                          ) || []
                                          const particularExtrasCost = paidParticularExtras.reduce((sum, extra) => sum + extra.cost, 0)
                                          
                                          // Agregar otros extras (asignados a jugadores o divididos)
                                          const otherExtras = booking.extras?.filter(extra => 
                                            extra.assignedTo !== 'particular'
                                          ) || []
                                          const otherExtrasCost = otherExtras.reduce((sum, extra) => sum + extra.cost, 0)
                                          
                                          return (basePayments + particularExtrasCost + otherExtrasCost).toLocaleString()
                                        })()}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 mb-1">Saldo Pendiente</div>
                                      <div className="text-lg font-bold text-red-600">
                                        ${(() => {
                                          const totalAmount = calculateTotalAmount(booking)
                                          const paidPlayers = Object.values(booking.individualPayments || {}).filter(status => status === 'pagado').length
                                          const realCourtPricePerPerson = getCourtPrice(booking.courtName)
                                          const amountPerPlayer = realCourtPricePerPerson !== null ? realCourtPricePerPerson : (booking.totalPrice / 4)
                                          const basePayments = paidPlayers * amountPerPlayer
                                          
                                          // Agregar extras particulares pagados
                                          const paidParticularExtras = booking.extras?.filter(extra => 
                                            extra.assignedTo === 'particular' && extra.particularPaid
                                          ) || []
                                          const particularExtrasCost = paidParticularExtras.reduce((sum, extra) => sum + extra.cost, 0)
                                          
                                          // Agregar otros extras (asignados a jugadores o divididos)
                                          const otherExtras = booking.extras?.filter(extra => 
                                            extra.assignedTo !== 'particular'
                                          ) || []
                                          const otherExtrasCost = otherExtras.reduce((sum, extra) => sum + extra.cost, 0)
                                          
                                          const totalPaid = basePayments + particularExtrasCost + otherExtrasCost
                                          return (totalAmount - totalPaid).toLocaleString()
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Botón para agregar extras */}
                                <div className="mt-4 flex justify-center">
                                  <Button
                                    onClick={() => openExtrasModal(booking.id)}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 hover:bg-blue-50"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Agregar Extras
                                  </Button>
                                </div>

                                {/* Lista de extras agregados */}
                                {booking.extras && booking.extras.length > 0 && (
                                  <div className="mt-4 border-t border-gray-200 pt-4">
                                    <h5 className="text-sm font-medium text-gray-700 mb-3">Extras Agregados</h5>
                                    <div className="space-y-2">
                                      {booking.extras.map((extra) => (
                                        <div key={extra.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{extra.name}</span>
                                            <span className="text-xs text-gray-500">
                                              ({extra.assignedTo === 'all' ? 'Dividido entre todos' : 
                                                extra.assignedTo === 'particular' ? 'Particular' : 
                                                `Jugador ${extra.assignedTo.slice(-1)}`})
                                            </span>
                                            {extra.assignedTo === 'particular' && (
                                              <div className="flex items-center justify-between w-32">
                                                <span className="text-xs text-gray-600 w-16 text-left">
                                                  {extra.particularPaid ? 'Pagado' : 'No pagado'}
                                                </span>
                                                <button
                                                  onClick={() => {
                                                    setBookings(prev => prev.map(b => 
                                                      b.id === booking.id 
                                                        ? {
                                                            ...b,
                                                            extras: b.extras?.map(e => 
                                                              e.id === extra.id 
                                                                ? { ...e, particularPaid: !e.particularPaid }
                                                                : e
                                                            ) || []
                                                          }
                                                        : b
                                                    ))
                                                  }}
                                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ${
                                                    extra.particularPaid 
                                                      ? 'bg-green-500' 
                                                      : 'bg-gray-300'
                                                  }`}
                                                  title={extra.particularPaid ? 'Pagado - Click para marcar como no pagado' : 'No pagado - Click para marcar como pagado'}
                                                >
                                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                                                    extra.particularPaid ? 'translate-x-6' : 'translate-x-1'
                                                  }`} />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-green-600">${extra.cost.toLocaleString()}</span>
                                            <button
                                              onClick={() => removeExtra(booking.id, extra.id)}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vista de Calendario Simplificada */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendario de Turnos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-100 rounded">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarView().map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {day.bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1 rounded truncate ${getStatusColor(booking.status, 'booking', isDarkMode)}`}
                        title={`${booking.timeRange} - ${booking.userName} (${booking.courtName})`}
                      >
                        {booking.timeRange.split(' - ')[0]} {booking.courtName}
                      </div>
                    ))}
                    {day.bookings.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{day.bookings.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                <p className="text-2xl font-bold">{filteredBookings.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredBookings.filter(b => b.status === 'confirmado').length}
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                {Math.round((filteredBookings.filter(b => b.status === 'confirmado').length / filteredBookings.length) * 100) || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <p className="text-2xl font-bold text-green-600">
                  ${filteredBookings
                    .filter(b => b.paymentStatus === 'pagado')
                    .reduce((sum, b) => sum + b.totalPrice, 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sistema Tiempo Real</p>
                <p className="text-2xl font-bold text-orange-600">Activo</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para agregar extras */}
      {showExtrasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Agregar Extra</h3>
              <button
                onClick={closeExtrasModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedExtraType ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">Selecciona una categoría y luego el producto:</p>
                
                {Object.entries(productosExtras).map(([categoria, productos]) => (
                  <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(categoria)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{categoria}</div>
                        <div className="text-sm text-gray-500">{productos.length} productos disponibles</div>
                      </div>
                      <div className={`transform transition-transform ${
                        expandedCategory === categoria ? 'rotate-180' : ''
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {expandedCategory === categoria && (
                      <div className="border-t border-gray-200">
                        {productos.map((producto) => (
                          <button
                            key={producto.id}
                            onClick={() => handleExtraSelect(categoria, producto.id, producto.name, producto.price)}
                            className="w-full p-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-medium text-gray-900">{producto.name}</div>
                              <div className="text-sm font-semibold text-blue-600">${producto.price.toLocaleString()}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-900">Producto seleccionado:</div>
                  <div className="text-sm text-blue-700">{selectedExtraName} - ${extraCost.toLocaleString()}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo del producto
                  </label>
                  <input
                    type="number"
                    value={extraCost}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    placeholder="Precio fijo del producto"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Los precios se modifican exclusivamente en la sección de productos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asignar costo a:
                  </label>
                  <div className="flex gap-3 items-center">
                    <select
                      value={extraAssignedTo}
                      onChange={(e) => setExtraAssignedTo(e.target.value as 'all' | 'player1' | 'player2' | 'player3' | 'player4' | 'particular')}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Dividir entre todos los jugadores</option>
                      <option value="player1">Jugador 1 (Titular)</option>
                      <option value="player2">Jugador 2</option>
                      <option value="player3">Jugador 3</option>
                      <option value="player4">Jugador 4</option>
                      <option value="particular">Particular</option>
                    </select>
                    {extraAssignedTo === 'particular' && (
                      <div className="flex items-center">
                        <button
                          onClick={() => setParticularPaid(!particularPaid)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            particularPaid 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {particularPaid ? 'Pagado' : 'No pagado'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setSelectedExtraType(null)
                      setSelectedExtraName('')
                      setExtraCost(0)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={addExtra}
                    className="flex-1"
                    disabled={extraCost <= 0}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTurnos