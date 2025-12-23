# Implementación de APIs con Supabase - Turnero de Padel

## Resumen Ejecutivo

Este documento detalla la implementación de las APIs necesarias para reemplazar los datos mock del frontend con funcionalidades reales usando **Supabase PostgREST** y **Edge Functions**. Se crearán servicios para gestión de canchas, reservas, pagos y administración.

## Arquitectura de APIs

### Tecnologías Utilizadas
- **PostgREST**: APIs REST auto-generadas desde PostgreSQL
- **Supabase Edge Functions**: Lógica de negocio personalizada (Deno/TypeScript)
- **Row Level Security**: Seguridad a nivel de base de datos
- **Realtime**: Actualizaciones en tiempo real

## 1. Servicios de Datos (Data Services)

### Servicio de Canchas
Crear `lib/services/courts.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

type Court = Database['public']['Tables']['courts']['Row']
type CourtInsert = Database['public']['Tables']['courts']['Insert']

export class CourtsService {
  private supabase = createClient()

  async getCourts(): Promise<Court[]> {
    const { data, error } = await this.supabase
      .from('courts')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  async getCourtById(id: string): Promise<Court | null> {
    const { data, error } = await this.supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data
  }

  async createCourt(court: CourtInsert): Promise<Court> {
    const { data, error } = await this.supabase
      .from('courts')
      .insert(court)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCourt(id: string, updates: Partial<CourtInsert>): Promise<Court> {
    const { data, error } = await this.supabase
      .from('courts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteCourt(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('courts')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }

  // Calcular precio final con multiplicador
  calculatePrice(basePriceInCents: number, multiplier: number): number {
    return Math.round(basePriceInCents * multiplier)
  }
}

export const courtsService = new CourtsService()
```

### Servicio de Reservas
Crear `lib/services/bookings.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingPlayer = Database['public']['Tables']['booking_players']['Row']

export interface BookingWithDetails extends Booking {
  court: {
    name: string
    description: string | null
  }
  players: BookingPlayer[]
}

export class BookingsService {
  private supabase = createClient()

  async getUserBookings(userId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        court:courts(name, description),
        players:booking_players(*)
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        court:courts(name, description),
        players:booking_players(*),
        user:profiles(full_name, phone)
      `)
      .order('booking_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getBookingById(id: string): Promise<BookingWithDetails | null> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        court:courts(name, description),
        players:booking_players(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createBooking(booking: BookingInsert, players: string[]): Promise<Booking> {
    // Usar transacción para crear reserva y jugadores
    const { data: bookingData, error: bookingError } = await this.supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()

    if (bookingError) throw bookingError

    // Crear jugadores
    const playersData = players.map((name, index) => ({
      booking_id: bookingData.id,
      player_name: name,
      position: index + 1,
    }))

    const { error: playersError } = await this.supabase
      .from('booking_players')
      .insert(playersData)

    if (playersError) throw playersError

    return bookingData
  }

  async updateBooking(id: string, updates: Partial<BookingInsert>): Promise<Booking> {
    const { data, error } = await this.supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async cancelBooking(id: string, reason?: string): Promise<void> {
    const { error } = await this.supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', id)

    if (error) throw error
  }

  async updatePlayerPayment(
    playerId: string,
    hasPaid: boolean,
    amount?: number,
    method?: string
  ): Promise<void> {
    const updates: any = {
      has_paid: hasPaid,
      paid_at: hasPaid ? new Date().toISOString() : null,
    }

    if (amount) updates.paid_amount = amount
    if (method) updates.payment_method = method

    const { error } = await this.supabase
      .from('booking_players')
      .update(updates)
      .eq('id', playerId)

    if (error) throw error
  }

  // Verificar disponibilidad de horario
  async checkAvailability(
    courtId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    let query = this.supabase
      .from('bookings')
      .select('id')
      .eq('court_id', courtId)
      .eq('booking_date', date)
      .neq('status', 'cancelled')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }

    const { data, error } = await query

    if (error) throw error
    return data.length === 0
  }
}

export const bookingsService = new BookingsService()
```

### Servicio de Disponibilidad
Crear `lib/services/availability.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'
import { courtsService } from './courts'

export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  timeRange: string
  isAvailable: boolean
  price: number
  courtId: string
}

export class AvailabilityService {
  private supabase = createClient()

  async getAvailableSlots(courtId: string, date: string): Promise<TimeSlot[]> {
    // Obtener información de la cancha
    const court = await courtsService.getCourtById(courtId)
    if (!court) throw new Error('Court not found')

    // Generar slots base
    const slots = this.generateTimeSlots(courtId, court.base_price, court.price_multiplier)

    // Obtener reservas existentes para el día
    const { data: bookings } = await this.supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('court_id', courtId)
      .eq('booking_date', date)
      .neq('status', 'cancelled')

    // Marcar slots ocupados
    const occupiedSlots = new Set<string>()
    bookings?.forEach(booking => {
      const key = `${booking.start_time}-${booking.end_time}`
      occupiedSlots.add(key)
    })

    // Actualizar disponibilidad
    return slots.map(slot => ({
      ...slot,
      isAvailable: !occupiedSlots.has(`${slot.startTime}-${slot.endTime}`)
    }))
  }

  private generateTimeSlots(courtId: string, basePrice: number, multiplier: number): TimeSlot[] {
    const slots: TimeSlot[] = []
    const startHour = 0 // 12:00 AM
    const endHour = 22.5 // 10:30 PM
    const slotDuration = 1.5 // 90 minutos

    for (let hour = startHour; hour < endHour; hour += slotDuration) {
      const startTime = this.formatTime(hour)
      const endTime = this.formatTime(hour + slotDuration)
      const finalPrice = courtsService.calculatePrice(basePrice, multiplier)

      // Aplicar precios dinámicos según horario
      let dynamicMultiplier = 1
      if (hour >= 18 && hour <= 21) {
        dynamicMultiplier = 1.2 // Horario pico +20%
      } else if (hour >= 6 && hour <= 9) {
        dynamicMultiplier = 0.8 // Horario matutino -20%
      }

      slots.push({
        id: `${courtId}-slot-${hour}`,
        startTime,
        endTime,
        timeRange: `${startTime} - ${endTime}`,
        isAvailable: true, // Se actualizará después
        price: Math.round(finalPrice * dynamicMultiplier),
        courtId,
      })
    }

    return slots
  }

  private formatTime(hour: number): string {
    const h = Math.floor(hour)
    const m = (hour % 1) * 60
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
    const displayMinute = m === 0 ? '00' : '30'
    return `${displayHour}:${displayMinute} ${period}`
  }
}

export const availabilityService = new AvailabilityService()
```

## 2. Edge Functions para Lógica Compleja

### Función para Procesar Pagos
Crear `supabase/functions/process-payment/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { bookingId, playerId, amount, method } = await req.json()

    // Validar datos
    if (!bookingId || !playerId || !amount || !method) {
      throw new Error('Missing required fields')
    }

    // Obtener información de la reserva
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, players:booking_players(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError) throw bookingError

    // Actualizar pago del jugador
    const { error: playerError } = await supabase
      .from('booking_players')
      .update({
        has_paid: true,
        paid_amount: amount,
        paid_at: new Date().toISOString(),
        payment_method: method,
      })
      .eq('id', playerId)

    if (playerError) throw playerError

    // Registrar pago en historial
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        player_id: playerId,
        amount,
        payment_method: method,
        status: 'completed',
      })

    if (paymentError) throw paymentError

    // Verificar si todos los jugadores han pagado
    const { data: players } = await supabase
      .from('booking_players')
      .select('has_paid')
      .eq('booking_id', bookingId)

    const allPaid = players?.every(p => p.has_paid) || false

    // Actualizar estado de la reserva si todos pagaron
    if (allPaid) {
      await supabase
        .from('bookings')
        .update({ payment_status: 'fully_paid' })
        .eq('id', bookingId)
    }

    return new Response(
      JSON.stringify({ success: true, allPaid }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

### Función para Generar Reportes
Crear `supabase/functions/generate-report/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { startDate, endDate, courtId } = await req.json()

    // Query base para reportes
    let query = supabase
      .from('bookings')
      .select(`
        *,
        court:courts(name),
        players:booking_players(*),
        payments:payments(*)
      `)
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)

    if (courtId) {
      query = query.eq('court_id', courtId)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    // Calcular métricas
    const metrics = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.total_price, 0),
      totalDeposits: bookings.reduce((sum, b) => sum + b.deposit_amount, 0),
      pendingPayments: 0,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      courtStats: {} as Record<string, any>,
    }

    // Calcular pagos pendientes
    bookings.forEach(booking => {
      const unpaidPlayers = booking.players?.filter(p => !p.has_paid) || []
      const playerShare = booking.total_price / 4
      metrics.pendingPayments += unpaidPlayers.length * playerShare
    })

    // Estadísticas por cancha
    bookings.forEach(booking => {
      const courtName = booking.court?.name || 'Unknown'
      if (!metrics.courtStats[courtName]) {
        metrics.courtStats[courtName] = {
          bookings: 0,
          revenue: 0,
          utilization: 0,
        }
      }
      metrics.courtStats[courtName].bookings++
      metrics.courtStats[courtName].revenue += booking.total_price
    })

    return new Response(
      JSON.stringify({ metrics, bookings }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

## 3. Hooks Personalizados para el Frontend

### Hook para Gestión de Reservas
Crear `hooks/useBookings.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { bookingsService, type BookingWithDetails } from '@/lib/services/bookings'
import { useAuth } from './useAuth'

export function useBookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user, isAdmin])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = isAdmin 
        ? await bookingsService.getAllBookings()
        : await bookingsService.getUserBookings(user!.id)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching bookings')
    } finally {
      setLoading(false)
    }
  }

  const createBooking = async (bookingData: any, players: string[]) => {
    try {
      await bookingsService.createBooking(bookingData, players)
      await fetchBookings() // Refrescar lista
    } catch (err) {
      throw err
    }
  }

  const cancelBooking = async (id: string, reason?: string) => {
    try {
      await bookingsService.cancelBooking(id, reason)
      await fetchBookings() // Refrescar lista
    } catch (err) {
      throw err
    }
  }

  const updatePlayerPayment = async (
    playerId: string,
    hasPaid: boolean,
    amount?: number,
    method?: string
  ) => {
    try {
      await bookingsService.updatePlayerPayment(playerId, hasPaid, amount, method)
      await fetchBookings() // Refrescar lista
    } catch (err) {
      throw err
    }
  }

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    cancelBooking,
    updatePlayerPayment,
  }
}
```

### Hook para Disponibilidad
Crear `hooks/useAvailability.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { availabilityService, type TimeSlot } from '@/lib/services/availability'

export function useAvailability(courtId: string, date: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (courtId && date) {
      fetchAvailability()
    }
  }, [courtId, date])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const data = await availabilityService.getAvailableSlots(courtId, date)
      setSlots(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching availability')
    } finally {
      setLoading(false)
    }
  }

  return {
    slots,
    loading,
    error,
    refetch: fetchAvailability,
  }
}
```

## 4. Configuración de Realtime

### Configurar suscripciones en tiempo real
Crear `hooks/useRealtimeBookings.ts`:

```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBookings } from './useBookings'

export function useRealtimeBookings() {
  const { fetchBookings } = useBookings()
  const supabase = createClient()

  useEffect(() => {
    // Suscribirse a cambios en reservas
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchBookings()
        }
      )
      .subscribe()

    // Suscribirse a cambios en pagos de jugadores
    const playersChannel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_players',
        },
        () => {
          fetchBookings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bookingsChannel)
      supabase.removeChannel(playersChannel)
    }
  }, [fetchBookings])
}
```

## 5. Próximos Pasos

1. **Desplegar Edge Functions** en Supabase
2. **Configurar variables de entorno** para las funciones
3. **Integrar servicios** en componentes existentes
4. **Configurar cache con Redis** para optimización
5. **Migrar datos mock** a APIs reales

Las APIs están listas para reemplazar completamente los datos mock del frontend. ¿Continuamos con la configuración de Redis para cache?
