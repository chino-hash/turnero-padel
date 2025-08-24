# API de Reservas de Usuario

## Información del Endpoint

**Endpoint**: `GET /api/bookings/user`  
**Archivo**: `app/api/bookings/user/route.ts`  
**Versión**: `v1.0`  
**Autor**: Equipo de Desarrollo  
**Fecha**: 2024-01-15

## Descripción

Endpoint para obtener todas las reservas del usuario autenticado actualmente. Retorna un listado completo de reservas con información detallada de canchas, jugadores y estado de pago.

## Autenticación

- **Requerida**: ✅ Sí
- **Tipo**: Session (NextAuth.js)
- **Roles permitidos**: `USER`, `ADMIN`

## Request

### Método HTTP
`GET`

### URL
```
GET /api/bookings/user
```

### Headers

| Header | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `Cookie` | `string` | ✅ | Sesión de NextAuth.js |

### Parámetros

Este endpoint no requiere parámetros adicionales. Automáticamente filtra por el usuario de la sesión actual.

## Response

### Respuesta Exitosa (200)

```typescript
interface UserBookingsResponse {
  bookings: [
    {
      id: string
      courtId: string
      userId: string
      bookingDate: string
      startTime: string
      endTime: string
      status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
      paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED'
      totalPrice: number
      depositAmount: number
      createdAt: string
      updatedAt: string
      court: {
        id: string
        name: string
        description?: string
        basePrice: number
        priceMultiplier: number
        isActive: boolean
      }
      players: [
        {
          id: string
          bookingId: string
          position: number
          playerName: string
        }
      ]
    }
  ]
}
```

#### Ejemplo de Respuesta Exitosa
```json
[
  {
    "id": "booking-456",
    "courtId": "court-123",
    "userId": "user-789",
    "bookingDate": "2024-01-20T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "15:30",
    "status": "CONFIRMED",
    "paymentStatus": "COMPLETED",
    "totalPrice": 6000,
    "depositAmount": 3000,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z",
    "court": {
      "id": "court-123",
      "name": "Cancha 1",
      "description": "Cancha principal con iluminación LED",
      "basePrice": 6000,
      "priceMultiplier": 1.0,
      "isActive": true
    },
    "players": [
      {
        "id": "player-1",
        "bookingId": "booking-456",
        "position": 1,
        "playerName": "Juan Pérez"
      },
      {
        "id": "player-2",
        "bookingId": "booking-456",
        "position": 2,
        "playerName": "María García"
      },
      {
        "id": "player-3",
        "bookingId": "booking-456",
        "position": 3,
        "playerName": "Carlos López"
      },
      {
        "id": "player-4",
        "bookingId": "booking-456",
        "position": 4,
        "playerName": "Ana Martínez"
      }
    ]
  },
  {
    "id": "booking-789",
    "courtId": "court-456",
    "userId": "user-789",
    "bookingDate": "2024-01-22T00:00:00.000Z",
    "startTime": "16:00",
    "endTime": "17:30",
    "status": "PENDING",
    "paymentStatus": "PARTIAL",
    "totalPrice": 7200,
    "depositAmount": 3600,
    "createdAt": "2024-01-16T09:15:00.000Z",
    "updatedAt": "2024-01-16T09:15:00.000Z",
    "court": {
      "id": "court-456",
      "name": "Cancha 2",
      "description": "Cancha techada",
      "basePrice": 7200,
      "priceMultiplier": 1.0,
      "isActive": true
    },
    "players": [
      {
        "id": "player-5",
        "bookingId": "booking-789",
        "position": 1,
        "playerName": "Juan Pérez"
      },
      {
        "id": "player-6",
        "bookingId": "booking-789",
        "position": 2,
        "playerName": "Jugador 2"
      },
      {
        "id": "player-7",
        "bookingId": "booking-789",
        "position": 3,
        "playerName": "Jugador 3"
      },
      {
        "id": "player-8",
        "bookingId": "booking-789",
        "position": 4,
        "playerName": "Jugador 4"
      }
    ]
  }
]
```

### Respuestas de Error

#### 401 - Unauthorized
```json
{
  "error": "No autorizado"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

## Lógica de Negocio

### Filtrado Automático
- Las reservas se filtran automáticamente por el `userId` de la sesión actual
- No se requieren parámetros adicionales de filtrado
- Se incluyen todas las reservas independientemente del estado

### Ordenamiento
- Las reservas se ordenan por fecha de creación (más recientes primero)
- Se puede personalizar el ordenamiento en el servicio `getUserBookings`

### Datos Incluidos
- **Información completa de la reserva**: Fechas, horarios, precios, estados
- **Detalles de la cancha**: Nombre, descripción, precios base
- **Lista de jugadores**: Todos los jugadores asignados a cada reserva
- **Metadatos**: Fechas de creación y actualización

## Ejemplos de Uso

### Cliente JavaScript

```javascript
// Obtener reservas del usuario
const getUserBookings = async () => {
  try {
    const response = await fetch('/api/bookings/user')
    
    if (!response.ok) {
      throw new Error('Error obteniendo reservas')
    }
    
    const bookings = await response.json()
    return bookings
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// Uso
const userBookings = await getUserBookings()
console.log(`El usuario tiene ${userBookings.length} reservas`)
```

### Hook React

```typescript
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UseUserBookingsReturn {
  bookings: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUserBookings(): UseUserBookingsReturn {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!session) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bookings/user')
      
      if (!response.ok) {
        throw new Error('Error obteniendo reservas')
      }
      
      const data = await response.json()
      setBookings(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [session])

  return { bookings, loading, error, refetch: fetchBookings }
}
```

### Componente React

```typescript
import { useUserBookings } from '@/hooks/useUserBookings'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function UserBookingsList() {
  const { bookings, loading, error, refetch } = useUserBookings()
  
  if (loading) return <div>Cargando reservas...</div>
  if (error) return <div>Error: {error}</div>
  if (bookings.length === 0) return <div>No tienes reservas</div>
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mis Reservas</h2>
        <button onClick={refetch} className="btn-secondary">
          Actualizar
        </button>
      </div>
      
      {bookings.map((booking) => (
        <div key={booking.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{booking.court.name}</h3>
              <p className="text-gray-600">
                {format(new Date(booking.bookingDate), 'PPP', { locale: es })}
              </p>
              <p className="text-gray-600">
                {booking.startTime} - {booking.endTime}
              </p>
            </div>
            
            <div className="text-right">
              <div className={`px-2 py-1 rounded text-sm ${
                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {booking.status}
              </div>
              <p className="mt-1 font-semibold">
                ${(booking.totalPrice / 100).toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-1">Jugadores:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {booking.players.map((player: any) => (
                <div key={player.id}>
                  {player.position}. {player.playerName}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Filtrado y Búsqueda del Lado Cliente

```typescript
import { useMemo, useState } from 'react'
import { useUserBookings } from '@/hooks/useUserBookings'

export function FilteredBookingsList() {
  const { bookings, loading, error } = useUserBookings()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
      const matchesSearch = booking.court.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [bookings, statusFilter, searchTerm])
  
  return (
    <div>
      <div className="mb-4 flex gap-4">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="CONFIRMED">Confirmado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        
        <input
          type="text"
          placeholder="Buscar por cancha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        Mostrando {filteredBookings.length} de {bookings.length} reservas
      </div>
      
      {/* Renderizar reservas filtradas */}
      {filteredBookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
```

## Dependencias

- `@/lib/auth` - Autenticación con NextAuth.js
- `@/lib/services/bookings` - Servicio `getUserBookings`
- `next/server` - Utilidades de Next.js

## Base de Datos

### Consulta Ejecutada

El endpoint utiliza la función `getUserBookings(userId)` que ejecuta una consulta similar a:

```sql
SELECT 
  b.*,
  c.name as court_name,
  c.description as court_description,
  c.basePrice as court_basePrice,
  c.priceMultiplier as court_priceMultiplier,
  c.isActive as court_isActive,
  bp.id as player_id,
  bp.position as player_position,
  bp.playerName as player_name
FROM "Booking" b
JOIN "Court" c ON b."courtId" = c.id
LEFT JOIN "BookingPlayer" bp ON b.id = bp."bookingId"
WHERE b."userId" = $1
ORDER BY b."createdAt" DESC
```

### Índices Recomendados

```sql
-- Índice para consultas por usuario
CREATE INDEX idx_booking_user_id ON "Booking"("userId");

-- Índice compuesto para ordenamiento
CREATE INDEX idx_booking_user_created ON "Booking"("userId", "createdAt" DESC);

-- Índice para jugadores por reserva
CREATE INDEX idx_booking_player_booking_id ON "BookingPlayer"("bookingId");
```

## Performance

### Optimizaciones Implementadas

1. **Consulta Única**: Se obtienen todos los datos en una sola consulta con JOINs
2. **Índices de Base de Datos**: Índices optimizados para consultas por usuario
3. **Filtrado en Base de Datos**: El filtrado por usuario se hace a nivel de BD

### Métricas de Performance

- **Tiempo de Respuesta Típico**: < 100ms para usuarios con < 50 reservas
- **Memoria Utilizada**: Proporcional al número de reservas del usuario
- **Consultas de BD**: 1 consulta principal + JOINs

## Testing

### Tests Unitarios

```typescript
describe('GET /api/bookings/user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should return user bookings successfully', async () => {
    const mockSession = {
      user: { id: 'user-123' }
    }
    
    const mockBookings = [
      {
        id: 'booking-1',
        userId: 'user-123',
        court: { name: 'Cancha 1' },
        players: []
      }
    ]
    
    jest.mocked(auth).mockResolvedValue(mockSession)
    jest.mocked(getUserBookings).mockResolvedValue(mockBookings)
    
    const response = await GET()
    
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result).toEqual(mockBookings)
    expect(getUserBookings).toHaveBeenCalledWith('user-123')
  })
  
  it('should return 401 for unauthenticated user', async () => {
    jest.mocked(auth).mockResolvedValue(null)
    
    const response = await GET()
    
    expect(response.status).toBe(401)
  })
})
```

### Tests de Integración

```typescript
describe('User Bookings Integration', () => {
  it('should return bookings with complete data', async () => {
    const user = await createTestUser()
    const court = await createTestCourt()
    const booking = await createTestBooking({ userId: user.id, courtId: court.id })
    
    const response = await fetch('/api/bookings/user', {
      headers: {
        'Cookie': await getAuthCookie(user)
      }
    })
    
    expect(response.status).toBe(200)
    
    const bookings = await response.json()
    expect(bookings).toHaveLength(1)
    expect(bookings[0]).toMatchObject({
      id: booking.id,
      userId: user.id,
      court: expect.objectContaining({
        id: court.id,
        name: court.name
      }),
      players: expect.arrayContaining([
        expect.objectContaining({
          bookingId: booking.id,
          position: expect.any(Number),
          playerName: expect.any(String)
        })
      ])
    })
  })
})
```

## Monitoreo y Logging

### Eventos Registrados

```typescript
// Logging de acceso
console.log(`Usuario ${session.user.id} consultó sus reservas`)

// Logging de errores
console.error('Error en GET /api/bookings/user:', error)
```

### Métricas Sugeridas

- Número de consultas por usuario por día
- Tiempo promedio de respuesta
- Usuarios más activos (más consultas)
- Distribución de número de reservas por usuario

## Problemas Conocidos

1. **Escalabilidad**: Para usuarios con muchas reservas (>100), la respuesta puede ser lenta
2. **Paginación**: No implementa paginación, retorna todas las reservas
3. **Caché**: No implementa caché de respuestas
4. **Filtros**: No permite filtros del lado servidor (fecha, estado, etc.)

## Mejoras Futuras

1. **Paginación**: Implementar paginación para usuarios con muchas reservas
2. **Filtros de Servidor**: Permitir filtros por fecha, estado, cancha
3. **Caché**: Implementar caché con invalidación inteligente
4. **Ordenamiento Configurable**: Permitir diferentes criterios de ordenamiento
5. **Agregaciones**: Incluir estadísticas (total gastado, reservas por mes, etc.)
6. **Lazy Loading**: Cargar jugadores y detalles bajo demanda
7. **Real-time Updates**: Actualizaciones en tiempo real via WebSockets

## Casos de Uso

### Dashboard de Usuario
```typescript
// Mostrar resumen de reservas en dashboard
const { bookings } = useUserBookings()

const stats = useMemo(() => ({
  total: bookings.length,
  confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
  pending: bookings.filter(b => b.status === 'PENDING').length,
  totalSpent: bookings.reduce((sum, b) => sum + b.totalPrice, 0)
}), [bookings])
```

### Historial de Reservas
```typescript
// Mostrar historial completo con filtros
const pastBookings = bookings.filter(b => 
  new Date(b.bookingDate) < new Date()
)

const upcomingBookings = bookings.filter(b => 
  new Date(b.bookingDate) >= new Date()
)
```

### Exportar Datos
```typescript
// Exportar reservas a CSV
const exportBookings = () => {
  const csv = bookings.map(b => ({
    fecha: b.bookingDate,
    cancha: b.court.name,
    horario: `${b.startTime} - ${b.endTime}`,
    estado: b.status,
    precio: b.totalPrice / 100
  }))
  
  downloadCSV(csv, 'mis-reservas.csv')
}
```

---

**Última actualización**: 2024-01-15  
**Versión**: 1.0  
**Runtime**: Node.js