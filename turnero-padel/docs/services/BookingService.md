# BookingService - Servicio de Gestión de Reservas

## Información del Servicio

**Nombre**: `BookingService`  
**Ubicación**: `lib/bookings.ts`  
**Tipo**: Servicio de Datos  
**Autor**: Equipo de desarrollo  
**Fecha**: 2024-01-28

## Descripción

Servicio centralizado para la gestión de reservas de canchas de pádel. Proporciona funciones para obtener, crear, actualizar y eliminar reservas, así como para gestionar la información de canchas y jugadores. Actúa como capa de abstracción entre los componentes de UI y la base de datos, manejando la lógica de negocio relacionada con las reservas.

## Responsabilidades

- **Gestión de Reservas**: CRUD completo de reservas de canchas
- **Validación de Datos**: Verificar disponibilidad y validez de reservas
- **Transformación de Datos**: Formatear datos entre UI y base de datos
- **Lógica de Negocio**: Aplicar reglas de reservas y restricciones
- **Integración con BD**: Interfaz con Prisma/base de datos

## Tipos de TypeScript

### Interfaces Principales

```typescript
// Jugador individual
interface Player {
  id: string
  name: string
  email?: string
  phone?: string
  isRegistered: boolean // Si está registrado en el sistema
}

// Reserva de cancha completa
interface CourtBooking {
  id: string
  courtId: string
  courtName: string
  date: string // ISO date string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  duration: number // En minutos
  
  // Información del usuario que reserva
  userId: string
  userEmail: string
  userName: string
  
  // Jugadores participantes
  players: Player[]
  maxPlayers: number // Capacidad máxima de la cancha
  
  // Estado de la reserva
  status: BookingStatus
  
  // Información de pago
  price: number
  currency: string
  paymentStatus: PaymentStatus
  paymentMethod?: string
  
  // Metadatos
  createdAt: string
  updatedAt: string
  notes?: string
}

// Estados de reserva
enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// Estados de pago
enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

// Información de cancha
interface Court {
  id: string
  name: string
  description?: string
  capacity: number
  pricePerHour: number
  isActive: boolean
  amenities: string[]
  location?: string
}

// Filtros para búsqueda de reservas
interface BookingFilters {
  userId?: string
  courtId?: string
  date?: string
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  startDate?: string
  endDate?: string
}

// Datos para crear nueva reserva
interface CreateBookingData {
  courtId: string
  date: string
  startTime: string
  endTime: string
  players: Omit<Player, 'id'>[]
  notes?: string
}

// Datos para actualizar reserva
interface UpdateBookingData {
  players?: Player[]
  status?: BookingStatus
  paymentStatus?: PaymentStatus
  notes?: string
}
```

## API del Servicio

### Funciones Principales

#### `getUserBookings(userId: string): Promise<CourtBooking[]>`
Obtiene todas las reservas de un usuario específico.

**Parámetros**:
- `userId: string` - ID del usuario

**Retorna**: `Promise<CourtBooking[]>` - Array de reservas del usuario

**Ejemplo**:
```typescript
const userBookings = await getUserBookings('user-123')
console.log(`Usuario tiene ${userBookings.length} reservas`)
```

#### `getAllBookings(filters?: BookingFilters): Promise<CourtBooking[]>`
Obtiene todas las reservas del sistema con filtros opcionales.

**Parámetros**:
- `filters?: BookingFilters` - Filtros opcionales para la búsqueda

**Retorna**: `Promise<CourtBooking[]>` - Array de todas las reservas

**Ejemplo**:
```typescript
// Todas las reservas
const allBookings = await getAllBookings()

// Reservas de una fecha específica
const todayBookings = await getAllBookings({
  date: '2024-01-28'
})

// Reservas confirmadas de una cancha
const courtBookings = await getAllBookings({
  courtId: 'court-1',
  status: BookingStatus.CONFIRMED
})
```

#### `getBookingById(bookingId: string): Promise<CourtBooking | null>`
Obtiene una reserva específica por su ID.

**Parámetros**:
- `bookingId: string` - ID de la reserva

**Retorna**: `Promise<CourtBooking | null>` - Reserva encontrada o null

#### `createBooking(userId: string, bookingData: CreateBookingData): Promise<CourtBooking>`
Crea una nueva reserva.

**Parámetros**:
- `userId: string` - ID del usuario que hace la reserva
- `bookingData: CreateBookingData` - Datos de la nueva reserva

**Retorna**: `Promise<CourtBooking>` - Reserva creada

**Ejemplo**:
```typescript
const newBooking = await createBooking('user-123', {
  courtId: 'court-1',
  date: '2024-01-30',
  startTime: '14:00',
  endTime: '15:30',
  players: [
    { name: 'Juan Pérez', email: 'juan@example.com', isRegistered: true },
    { name: 'María García', phone: '+1234567890', isRegistered: false }
  ],
  notes: 'Reserva para torneo interno'
})
```

#### `updateBooking(bookingId: string, updateData: UpdateBookingData): Promise<CourtBooking>`
Actualiza una reserva existente.

**Parámetros**:
- `bookingId: string` - ID de la reserva a actualizar
- `updateData: UpdateBookingData` - Datos a actualizar

**Retorna**: `Promise<CourtBooking>` - Reserva actualizada

#### `cancelBooking(bookingId: string, reason?: string): Promise<CourtBooking>`
Cancela una reserva.

**Parámetros**:
- `bookingId: string` - ID de la reserva a cancelar
- `reason?: string` - Motivo opcional de la cancelación

**Retorna**: `Promise<CourtBooking>` - Reserva cancelada

#### `checkAvailability(courtId: string, date: string, startTime: string, endTime: string): Promise<boolean>`
Verifica si una cancha está disponible en un horario específico.

**Parámetros**:
- `courtId: string` - ID de la cancha
- `date: string` - Fecha en formato ISO
- `startTime: string` - Hora de inicio (HH:MM)
- `endTime: string` - Hora de fin (HH:MM)

**Retorna**: `Promise<boolean>` - True si está disponible

### Funciones de Utilidad

#### `calculateBookingPrice(courtId: string, duration: number): Promise<number>`
Calcula el precio de una reserva basado en la cancha y duración.

#### `formatBookingTime(startTime: string, endTime: string): string`
Formatea el horario de una reserva para mostrar en UI.

#### `getBookingDuration(startTime: string, endTime: string): number`
Calcula la duración en minutos entre dos horarios.

#### `isBookingEditable(booking: CourtBooking): boolean`
Determina si una reserva puede ser editada basado en su estado y fecha.

#### `getUpcomingBookings(userId: string, days?: number): Promise<CourtBooking[]>`
Obtiene las próximas reservas de un usuario.

## Implementación

### Estructura del Servicio

```typescript
// lib/bookings.ts
import { prisma } from '@/lib/prisma'
import { CourtBooking, CreateBookingData, UpdateBookingData, BookingFilters } from '@/types/booking'

// Obtener reservas de usuario
export const getUserBookings = async (userId: string): Promise<CourtBooking[]> => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        court: true,
        players: true,
        user: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    return bookings.map(transformBookingData)
  } catch (error) {
    console.error('Error obteniendo reservas del usuario:', error)
    throw new Error('No se pudieron obtener las reservas')
  }
}

// Obtener todas las reservas
export const getAllBookings = async (filters?: BookingFilters): Promise<CourtBooking[]> => {
  try {
    const where = buildWhereClause(filters)
    
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        court: true,
        players: true,
        user: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })
    
    return bookings.map(transformBookingData)
  } catch (error) {
    console.error('Error obteniendo todas las reservas:', error)
    throw new Error('No se pudieron obtener las reservas')
  }
}

// Crear nueva reserva
export const createBooking = async (
  userId: string, 
  bookingData: CreateBookingData
): Promise<CourtBooking> => {
  try {
    // Validar disponibilidad
    const isAvailable = await checkAvailability(
      bookingData.courtId,
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime
    )
    
    if (!isAvailable) {
      throw new Error('La cancha no está disponible en el horario seleccionado')
    }
    
    // Calcular precio
    const duration = getBookingDuration(bookingData.startTime, bookingData.endTime)
    const price = await calculateBookingPrice(bookingData.courtId, duration)
    
    // Crear reserva
    const booking = await prisma.booking.create({
      data: {
        userId,
        courtId: bookingData.courtId,
        date: new Date(bookingData.date),
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        duration,
        price,
        status: 'pending',
        paymentStatus: 'pending',
        notes: bookingData.notes,
        players: {
          create: bookingData.players.map(player => ({
            name: player.name,
            email: player.email,
            phone: player.phone,
            isRegistered: player.isRegistered
          }))
        }
      },
      include: {
        court: true,
        players: true,
        user: true
      }
    })
    
    return transformBookingData(booking)
  } catch (error) {
    console.error('Error creando reserva:', error)
    throw error
  }
}

// Verificar disponibilidad
export const checkAvailability = async (
  courtId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  try {
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        date: new Date(date),
        status: {
          not: 'cancelled'
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    })
    
    return conflictingBookings.length === 0
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    return false
  }
}

// Transformar datos de Prisma a formato de la aplicación
const transformBookingData = (booking: any): CourtBooking => {
  return {
    id: booking.id,
    courtId: booking.courtId,
    courtName: booking.court.name,
    date: booking.date.toISOString().split('T')[0],
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: booking.duration,
    userId: booking.userId,
    userEmail: booking.user.email,
    userName: booking.user.name,
    players: booking.players.map((player: any) => ({
      id: player.id,
      name: player.name,
      email: player.email,
      phone: player.phone,
      isRegistered: player.isRegistered
    })),
    maxPlayers: booking.court.capacity,
    status: booking.status,
    price: booking.price,
    currency: 'USD',
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    notes: booking.notes
  }
}

// Construir cláusula WHERE para filtros
const buildWhereClause = (filters?: BookingFilters) => {
  if (!filters) return {}
  
  const where: any = {}
  
  if (filters.userId) where.userId = filters.userId
  if (filters.courtId) where.courtId = filters.courtId
  if (filters.status) where.status = filters.status
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus
  
  if (filters.date) {
    where.date = new Date(filters.date)
  } else if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) where.date.gte = new Date(filters.startDate)
    if (filters.endDate) where.date.lte = new Date(filters.endDate)
  }
  
  return where
}
```

## Ejemplos de Uso

### En Componentes React

```typescript
// components/BookingList.tsx
import { useEffect, useState } from 'react'
import { getUserBookings, CourtBooking } from '@/lib/bookings'
import { useAuth } from '@/hooks/useAuth'

const BookingList: React.FC = () => {
  const [bookings, setBookings] = useState<CourtBooking[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  
  useEffect(() => {
    const loadBookings = async () => {
      if (!user?.id) return
      
      try {
        const userBookings = await getUserBookings(user.id)
        setBookings(userBookings)
      } catch (error) {
        console.error('Error cargando reservas:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadBookings()
  }, [user?.id])
  
  if (loading) return <div>Cargando reservas...</div>
  
  return (
    <div className="booking-list">
      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
```

### En API Routes

```typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAllBookings, createBooking } from '@/lib/bookings'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      courtId: searchParams.get('courtId') || undefined,
      date: searchParams.get('date') || undefined,
      status: searchParams.get('status') || undefined
    }
    
    const bookings = await getAllBookings(filters)
    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error obteniendo reservas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const bookingData = await request.json()
    const newBooking = await createBooking(session.user.id, bookingData)
    
    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error creando reserva' },
      { status: 400 }
    )
  }
}
```

### En Hooks Personalizados

```typescript
// hooks/useBookings.ts
import { useState, useEffect } from 'react'
import { getUserBookings, CourtBooking } from '@/lib/bookings'
import { useAuth } from '@/hooks/useAuth'

export const useUserBookings = () => {
  const [bookings, setBookings] = useState<CourtBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  const refreshBookings = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      const userBookings = await getUserBookings(user.id)
      setBookings(userBookings)
    } catch (err) {
      setError(err.message || 'Error cargando reservas')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    refreshBookings()
  }, [user?.id])
  
  return {
    bookings,
    loading,
    error,
    refreshBookings
  }
}
```

## Validación y Reglas de Negocio

### Validaciones Implementadas

1. **Disponibilidad de Cancha**: Verificar que no haya conflictos de horario
2. **Horarios Válidos**: Validar formato y lógica de horarios
3. **Capacidad de Jugadores**: No exceder la capacidad máxima de la cancha
4. **Fechas Futuras**: No permitir reservas en fechas pasadas
5. **Duración Mínima**: Reservas de al menos 30 minutos

### Reglas de Negocio

```typescript
// Validaciones de negocio
export const validateBookingData = (bookingData: CreateBookingData): string[] => {
  const errors: string[] = []
  
  // Validar fecha
  const bookingDate = new Date(bookingData.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (bookingDate < today) {
    errors.push('No se pueden hacer reservas en fechas pasadas')
  }
  
  // Validar horarios
  const startTime = parseTime(bookingData.startTime)
  const endTime = parseTime(bookingData.endTime)
  
  if (startTime >= endTime) {
    errors.push('La hora de fin debe ser posterior a la hora de inicio')
  }
  
  // Validar duración mínima (30 minutos)
  const duration = (endTime - startTime) / (1000 * 60)
  if (duration < 30) {
    errors.push('La duración mínima de una reserva es 30 minutos')
  }
  
  // Validar jugadores
  if (bookingData.players.length === 0) {
    errors.push('Debe incluir al menos un jugador')
  }
  
  if (bookingData.players.length > 4) {
    errors.push('Máximo 4 jugadores por reserva')
  }
  
  // Validar información de jugadores
  bookingData.players.forEach((player, index) => {
    if (!player.name.trim()) {
      errors.push(`El nombre del jugador ${index + 1} es requerido`)
    }
    
    if (!player.email && !player.phone) {
      errors.push(`El jugador ${index + 1} debe tener email o teléfono`)
    }
  })
  
  return errors
}

const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return new Date().setHours(hours, minutes, 0, 0)
}
```

## Testing

### Tests Unitarios

```typescript
// __tests__/lib/bookings.test.ts
import { getUserBookings, createBooking, checkAvailability } from '@/lib/bookings'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn()
    },
    court: {
      findUnique: jest.fn()
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserBookings', () => {
    test('should return user bookings', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          userId: 'user-1',
          courtId: 'court-1',
          date: new Date('2024-01-30'),
          startTime: '14:00',
          endTime: '15:30',
          court: { name: 'Cancha 1', capacity: 4 },
          players: [],
          user: { email: 'user@test.com', name: 'Test User' }
        }
      ]
      
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)
      
      const result = await getUserBookings('user-1')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('booking-1')
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          court: true,
          players: true,
          user: true
        },
        orderBy: {
          date: 'desc'
        }
      })
    })
  })

  describe('checkAvailability', () => {
    test('should return true when court is available', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([])
      
      const result = await checkAvailability(
        'court-1',
        '2024-01-30',
        '14:00',
        '15:30'
      )
      
      expect(result).toBe(true)
    })

    test('should return false when court has conflicting booking', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([{ id: 'existing-booking' }])
      
      const result = await checkAvailability(
        'court-1',
        '2024-01-30',
        '14:00',
        '15:30'
      )
      
      expect(result).toBe(false)
    })
  })

  describe('createBooking', () => {
    test('should create booking when court is available', async () => {
      // Mock availability check
      mockPrisma.booking.findMany.mockResolvedValue([])
      
      // Mock court data for price calculation
      mockPrisma.court.findUnique.mockResolvedValue({
        id: 'court-1',
        pricePerHour: 50
      })
      
      // Mock booking creation
      const mockCreatedBooking = {
        id: 'new-booking',
        userId: 'user-1',
        courtId: 'court-1',
        date: new Date('2024-01-30'),
        startTime: '14:00',
        endTime: '15:30',
        duration: 90,
        price: 75,
        court: { name: 'Cancha 1', capacity: 4 },
        players: [],
        user: { email: 'user@test.com', name: 'Test User' }
      }
      
      mockPrisma.booking.create.mockResolvedValue(mockCreatedBooking)
      
      const bookingData = {
        courtId: 'court-1',
        date: '2024-01-30',
        startTime: '14:00',
        endTime: '15:30',
        players: [
          { name: 'Player 1', email: 'player1@test.com', isRegistered: true }
        ]
      }
      
      const result = await createBooking('user-1', bookingData)
      
      expect(result.id).toBe('new-booking')
      expect(mockPrisma.booking.create).toHaveBeenCalled()
    })

    test('should throw error when court is not available', async () => {
      // Mock conflicting booking
      mockPrisma.booking.findMany.mockResolvedValue([{ id: 'existing-booking' }])
      
      const bookingData = {
        courtId: 'court-1',
        date: '2024-01-30',
        startTime: '14:00',
        endTime: '15:30',
        players: []
      }
      
      await expect(createBooking('user-1', bookingData))
        .rejects
        .toThrow('La cancha no está disponible en el horario seleccionado')
    })
  })
})
```

### Tests de Integración

```typescript
// __tests__/integration/bookings.test.ts
import { createBooking, getUserBookings } from '@/lib/bookings'
import { prisma } from '@/lib/prisma'

describe('BookingService Integration', () => {
  beforeEach(async () => {
    // Limpiar base de datos de prueba
    await prisma.booking.deleteMany()
    await prisma.court.deleteMany()
    await prisma.user.deleteMany()
  })

  test('should create and retrieve booking', async () => {
    // Crear datos de prueba
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    const court = await prisma.court.create({
      data: {
        name: 'Test Court',
        capacity: 4,
        pricePerHour: 50,
        isActive: true
      }
    })

    // Crear reserva
    const bookingData = {
      courtId: court.id,
      date: '2024-01-30',
      startTime: '14:00',
      endTime: '15:30',
      players: [
        { name: 'Player 1', email: 'player1@test.com', isRegistered: true }
      ]
    }

    const createdBooking = await createBooking(user.id, bookingData)
    
    // Verificar creación
    expect(createdBooking.id).toBeDefined()
    expect(createdBooking.courtName).toBe('Test Court')
    expect(createdBooking.players).toHaveLength(1)

    // Obtener reservas del usuario
    const userBookings = await getUserBookings(user.id)
    
    expect(userBookings).toHaveLength(1)
    expect(userBookings[0].id).toBe(createdBooking.id)
  })
})
```

## Problemas Conocidos

1. **Concurrencia**: No maneja reservas simultáneas del mismo horario
2. **Transacciones**: Falta manejo de transacciones para operaciones complejas
3. **Cache**: No implementa cache para consultas frecuentes
4. **Validación Avanzada**: Validaciones de negocio limitadas
5. **Notificaciones**: No envía notificaciones de cambios de estado

## Mejoras Futuras

1. **Manejo de Concurrencia**:
   - Implementar locks optimistas
   - Usar transacciones para operaciones críticas
   - Manejo de conflictos de reserva

2. **Performance**:
   - Implementar cache con Redis
   - Paginación para listas grandes
   - Índices optimizados en base de datos

3. **Funcionalidades Avanzadas**:
   - Reservas recurrentes
   - Lista de espera para horarios ocupados
   - Reservas grupales
   - Descuentos y promociones

4. **Integración**:
   - Webhooks para cambios de estado
   - Integración con sistemas de pago
   - Sincronización con calendarios externos

5. **Monitoreo**:
   - Métricas de uso
   - Logs estructurados
   - Alertas de errores

## Notas de Desarrollo

- Todas las fechas se manejan en formato ISO para consistencia
- Los horarios usan formato 24 horas (HH:MM)
- Los precios se almacenan en centavos para evitar problemas de precisión
- Las validaciones se ejecutan tanto en cliente como servidor
- El servicio es stateless y puede ser usado desde cualquier contexto
- Compatible con Prisma ORM y PostgreSQL

## Changelog

### v1.0.0 (2024-01-28)
- Implementación inicial del servicio de reservas
- CRUD completo de reservas
- Validación de disponibilidad de canchas
- Cálculo automático de precios
- Gestión de jugadores y metadatos
- Integración con Prisma ORM
- Tests unitarios y de integración