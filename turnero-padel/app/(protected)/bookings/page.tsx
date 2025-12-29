/**
 * Página de gestión de reservas
 */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { BookingList } from './components/BookingList'
import { BookingForm } from './components/BookingForm'
import { BookingFilters } from './components/BookingFilters'
import { BookingStats } from './components/BookingStats'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Plus, Calendar, BarChart3, Filter } from 'lucide-react'
import { toast } from 'sonner'
import type { Booking } from '../../../types/booking'
import type { BookingFilters as BookingFiltersType } from './components/BookingFilters'

export default function BookingsPage() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [courts, setCourts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [filters, setFilters] = useState<BookingFiltersType>({
    courtId: '',
    search: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Cargar reservas
  const loadBookings = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== 'all')
        ),
      })

      const response = await fetch(`/api/bookings?${queryParams}`)
      if (!response.ok) throw new Error('Error al cargar reservas')

      const data = await response.json()
      setBookings(data.bookings || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }))
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }

  // Efectos
  useEffect(() => {
    loadBookings()
  }, [pagination.page, pagination.limit, filters])

  // Handlers
  const handleCreateBooking = () => {
    setSelectedBooking(null)
    setShowForm(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowForm(true)
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reserva?')) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al eliminar reserva')

      toast.success('Reserva eliminada exitosamente')
      loadBookings()
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('Error al eliminar la reserva')
    }
  }

  const handleFormSuccess = async (data: any) => {
    try {
      const url = selectedBooking 
        ? `/api/bookings/${selectedBooking.id}`
        : '/api/bookings'
      
      const method = selectedBooking ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Error al guardar reserva')

      setShowForm(false)
      setSelectedBooking(null)
      loadBookings()
      toast.success(
        selectedBooking ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente'
      )
    } catch (error) {
      console.error('Error saving booking:', error)
      toast.error('Error al guardar la reserva')
      throw error
    }
  }

  const handleFiltersChange = (newFilters: BookingFiltersType) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Requerido</CardTitle>
            <CardDescription>
              Debes iniciar sesión para acceder a la gestión de reservas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Reservas</h1>
          <p className="text-muted-foreground">
            Administra las reservas de canchas de pádel
          </p>
        </div>
        <Button onClick={handleCreateBooking} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Reserva
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Lista</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estadísticas</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </TabsTrigger>
        </TabsList>

        {/* Lista de Reservas */}
        <TabsContent value="list" className="space-y-6">
          <BookingFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            courts={courts}
            users={users}
            loading={loading}
            className="lg:hidden" // Solo visible en móvil
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filtros laterales en desktop */}
            <div className="hidden lg:block">
              <BookingFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                courts={courts}
                users={users}
                loading={loading}
              />
            </div>
            
            {/* Lista principal */}
            <div className="lg:col-span-3">
              <BookingList
                bookings={bookings}
                loading={loading}
                pagination={pagination}
                onEdit={handleEditBooking}
                onDelete={handleDeleteBooking}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </TabsContent>

        {/* Estadísticas */}
        <TabsContent value="stats">
          <BookingStats bookings={bookings} loading={loading} />
        </TabsContent>

        {/* Filtros (móvil) */}
        <TabsContent value="filters" className="lg:hidden">
          <BookingFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            courts={courts}
            users={users}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Formulario */}
      {showForm && (
        <BookingForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open)
            if (!open) {
              setSelectedBooking(null)
            }
          }}
          booking={selectedBooking}
          courts={courts}
          users={users}
          onSubmit={handleFormSuccess}
          loading={loading}
        />
      )}
    </div>
  )
}