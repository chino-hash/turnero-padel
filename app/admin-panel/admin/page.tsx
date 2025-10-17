/**
 * Página principal del panel de administración de turnos
 * Permite gestionar reservas, usuarios y estadísticas
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
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
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  Receipt,
  Package,
  ShoppingCart,
  Coffee,
  Utensils,
  Shirt,
  Zap,
  MoreHorizontal,
  BarChart3,
  Settings,
  X,
  Home
} from 'lucide-react'

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
  
  // Estados para los turnos
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [expandedExtras, setExpandedExtras] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const router = useRouter()
  
  // Estados para el modal de extras
  const [showExtrasModal, setShowExtrasModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedExtraType, setSelectedExtraType] = useState<'alquiler_raqueta' | 'pelota' | 'toalla' | 'bebida' | 'snack' | 'otro' | null>(null)
  const [extraCost, setExtraCost] = useState('')
  const [extraAssignedTo, setExtraAssignedTo] = useState<'todos' | 'titular' | 'jugador2' | 'jugador3' | 'jugador4'>('todos')

  // Datos mock para desarrollo
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
    setSelectedExtraType(null)
    setExtraCost('')
    setExtraAssignedTo('todos')
  }

  const closeExtrasModal = () => {
    setShowExtrasModal(false)
    setSelectedBookingId(null)
    setSelectedExtraType(null)
    setExtraCost('')
    setExtraAssignedTo('todos')
  }

  const handleAddExtra = () => {
    if (!selectedBookingId || !selectedExtraType || !extraCost || parseFloat(extraCost) <= 0) return
    
    const extraNames = {
      alquiler_raqueta: 'Alquiler de Raqueta',
      pelota: 'Pelota de Pádel',
      toalla: 'Toalla',
      bebida: 'Bebida',
      snack: 'Snack',
      otro: 'Otro'
    }
    
    const assignedToMapping = {
      todos: 'all' as const,
      titular: 'player1' as const,
      jugador2: 'player2' as const,
      jugador3: 'player3' as const,
      jugador4: 'player4' as const
    }
    
    addExtra(selectedBookingId, {
      type: selectedExtraType as 'pelotas' | 'bebida' | 'paleta',
      name: extraNames[selectedExtraType],
      cost: parseFloat(extraCost),
      assignedTo: assignedToMapping[extraAssignedTo]
    })
    
    closeExtrasModal()
  }

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

  // Cargar datos mock
  useEffect(() => {
    setBookings(mockBookings)
    setFilteredBookings(mockBookings)
  }, [])

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

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona todos los aspectos de tu sistema de turnos de pádel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          <span>Ir a</span>
          <Home className="w-4 h-4 text-blue-600" />
        </Button>
      </div>

      {/* Resumen del Sistema - Movido a la parte superior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Resumen del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredBookings.length}</div>
              <div className="text-sm text-gray-600">Turnos Totales</div>
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
              <div className="text-sm text-gray-600">Ingresos Totales</div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Lista completa de turnos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Lista Completa de Turnos
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
        
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                        booking.status === 'completado' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.paymentStatus === 'pagado' ? 'bg-green-100 text-green-800' :
                      booking.paymentStatus === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      ${(booking.totalPrice + booking.extras.reduce((sum, extra) => sum + extra.cost, 0)).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookingExpansion(booking.id)}
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
                    {/* Información de jugadores y pagos */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Jugadores y Pagos Individuales</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(booking.players).map(([playerKey, playerName]) => {
                          if (!playerName) return null
                          const paymentStatus = booking.individualPayments[playerKey as keyof typeof booking.individualPayments]
                          const playerAmount = calculatePlayerAmount(booking, playerKey as keyof Booking['players'])
                          return (
                            <div key={playerKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{playerName}</p>
                                <p className="text-xs text-gray-600">
                                  {playerKey === 'player1' ? 'Titular' : `Jugador ${playerKey.slice(-1)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ${playerAmount.toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant={paymentStatus === 'pagado' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => togglePlayerPayment(booking.id, playerKey as keyof typeof booking.individualPayments)}
                                className={`text-xs ${
                                  paymentStatus === 'pagado' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'border-red-300 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {paymentStatus === 'pagado' ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" />Pagado</>
                                ) : (
                                  <><AlertCircle className="w-3 h-3 mr-1" />Pendiente</>
                                )}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Sección de extras */}
                    {booking.extras.length > 0 && (
                      <div>
                        <h4 
                          className="font-medium text-gray-900 mb-3 flex items-center gap-2 cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => toggleExtrasExpansion(booking.id)}
                        >
                          {expandedExtras === booking.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          Extras Agregados ({booking.extras.length})
                        </h4>
                        {expandedExtras === booking.id && (
                          <div className="space-y-2">
                            {booking.extras.map((extra) => (
                              <div key={extra.id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  <span className="text-sm font-medium">{extra.name}</span>
                                  <span className="text-xs text-gray-500">({extra.type})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    Asignado a: {extra.assignedTo === 'all' ? 'Todos' : `Jugador ${extra.assignedTo.slice(-1)}`}
                                  </span>
                                  <span className="text-sm font-medium">${extra.cost.toLocaleString()}</span>
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
                        )}
                      </div>
                    )}
                    
                    {/* Sección de Acciones de Administración */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openExtrasModal(booking.id)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar Extra
                        </Button>
                        
                        {booking.status === 'confirmado' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        )}
                        
                        {booking.status !== 'cancelado' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal de Filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h3>
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
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              {/* Filtro por fecha */}
              <div className="space-y-2">
                <label htmlFor="modal-date-filter" className="text-sm font-medium text-gray-700">
                  Período de tiempo
                </label>
                <select
                  id="modal-date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Solo hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFilter('all')
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                className="flex-1"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  onChange={(e) => setSelectedExtraType(e.target.value as 'alquiler_raqueta' | 'pelota' | 'toalla' | 'bebida' | 'snack' | 'otro')}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="alquiler_raqueta">Alquiler de Raqueta</option>
                  <option value="pelota">Pelota</option>
                  <option value="toalla">Toalla</option>
                  <option value="bebida">Bebida</option>
                  <option value="snack">Snack</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Costo</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={extraCost}
                  onChange={(e) => setExtraCost(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Asignado a</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={extraAssignedTo}
                  onChange={(e) => setExtraAssignedTo(e.target.value as any)}
                >
                  <option value="todos">Todos los jugadores</option>
                  <option value="titular">Solo titular</option>
                  <option value="jugador2">Solo jugador 2</option>
                  <option value="jugador3">Solo jugador 3</option>
                  <option value="jugador4">Solo jugador 4</option>
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

    </div>
  )
}