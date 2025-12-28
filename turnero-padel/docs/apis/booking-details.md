# API de Detalles de Reserva

## Información del Endpoint

**Endpoint**: `GET /api/bookings/[id]`  
**Archivo**: `app/api/bookings/[id]/route.ts`  
**Versión**: `v1.0`  
**Autor**: Equipo de Desarrollo  
**Fecha**: 2024-01-15

## Descripción

Endpoint para obtener los detalles completos de una reserva específica mediante su ID. Retorna información detallada incluyendo datos de la cancha, usuario y jugadores.

## Autenticación

- **Requerida**: ❌ No
- **Tipo**: Público
- **Roles permitidos**: Público (sin restricciones)

> **Nota**: Este endpoint es público para permitir consultas de confirmación y verificación externa.

## Request

### Método HTTP
`GET`

### URL
```
GET /api/bookings/{id}
```

### Parámetros de Ruta

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | `string` | ✅ | ID único de la reserva |

#### Ejemplo de URL
```
GET /api/bookings/booking-456
```

### Headers

No se requieren headers especiales para este endpoint.

## Response

### Respuesta Exitosa (200)

```typescript
interface BookingDetailsResponse {
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
    createdAt: string
    updatedAt: string
  }
  user: {
    id: string
    name?: string
    email: string
    image?: string
    role: 'USER' | 'ADMIN'
    createdAt: string
    updatedAt: string
  }
  players: [
    {
      id: string
      bookingId: string
      position: number
      playerName: string
      createdAt: string
      updatedAt: string
    }
  ]
}
```

#### Ejemplo de Respuesta Exitosa
```json
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
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "user": {
    "id": "user-789",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": "https://lh3.googleusercontent.com/...",
    "role": "USER",
    "createdAt": "2024-01-10T00:00:00.000Z",
    "updatedAt": "2024-01-10T00:00:00.000Z"
  },
  "players": [
    {
      "id": "player-1",
      "bookingId": "booking-456",
      "position": 1,
      "playerName": "Juan Pérez",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "player-2",
      "bookingId": "booking-456",
      "position": 2,
      "playerName": "María García",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "player-3",
      "bookingId": "booking-456",
      "position": 3,
      "playerName": "Carlos López",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "player-4",
      "bookingId": "booking-456",
      "position": 4,
      "playerName": "Ana Martínez",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Respuestas de Error

#### 404 - Not Found
```json
{
  "error": "Not found"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

## Lógica de Negocio

### Búsqueda de Reserva
- Se busca la reserva por ID exacto
- Se incluyen todas las relaciones (court, user, players)
- Se retornan todos los campos disponibles

### Datos Incluidos
- **Información completa de la reserva**: Todos los campos de la tabla Booking
- **Detalles completos de la cancha**: Información, precios, estado
- **Información del usuario**: Datos básicos del usuario que hizo la reserva
- **Lista completa de jugadores**: Todos los jugadores con posiciones
- **Metadatos**: Fechas de creación y actualización de todos los registros

### Privacidad
- Aunque es público, solo expone información necesaria
- No expone datos sensibles como tokens o información de pago
- La información del usuario se limita a datos básicos

## Ejemplos de Uso

### Cliente JavaScript

```javascript
// Obtener detalles de una reserva específica
const getBookingDetails = async (bookingId) => {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Reserva no encontrada')
      }
      throw new Error('Error obteniendo detalles de la reserva')
    }
    
    const booking = await response.json()
    return booking
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// Uso
const booking = await getBookingDetails('booking-456')
console.log(`Reserva para ${booking.court.name} el ${booking.bookingDate}`)
```

### Hook React

```typescript
import { useState, useEffect } from 'react'

interface UseBookingDetailsReturn {
  booking: any | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBookingDetails(bookingId: string): UseBookingDetailsReturn {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = async () => {
    if (!bookingId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reserva no encontrada')
        }
        throw new Error('Error obteniendo detalles')
      }
      
      const data = await response.json()
      setBooking(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  return { booking, loading, error, refetch: fetchBooking }
}
```

### Componente React

```typescript
import { useBookingDetails } from '@/hooks/useBookingDetails'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BookingDetailsProps {
  bookingId: string
}

export function BookingDetails({ bookingId }: BookingDetailsProps) {
  const { booking, loading, error } = useBookingDetails(bookingId)
  
  if (loading) return <div className="animate-pulse">Cargando detalles...</div>
  if (error) return <div className="text-red-600">Error: {error}</div>
  if (!booking) return <div>Reserva no encontrada</div>
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="border-b pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {booking.court.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {booking.court.description}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {booking.status}
          </div>
        </div>
      </div>
      
      {/* Información de la Reserva */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Detalles de la Reserva</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ID de Reserva:</span>
              <span className="font-mono">{booking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span>{format(new Date(booking.bookingDate), 'PPP', { locale: es })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Horario:</span>
              <span>{booking.startTime} - {booking.endTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duración:</span>
              <span>90 minutos</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Información de Pago</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Precio Total:</span>
              <span className="font-semibold">${(booking.totalPrice / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Depósito:</span>
              <span>${(booking.depositAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado de Pago:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                booking.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                booking.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {booking.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Información del Usuario */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Reservado por</h3>
        <div className="flex items-center space-x-3">
          {booking.user.image && (
            <img 
              src={booking.user.image} 
              alt={booking.user.name} 
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <p className="font-medium">{booking.user.name}</p>
            <p className="text-sm text-gray-600">{booking.user.email}</p>
          </div>
        </div>
      </div>
      
      {/* Jugadores */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Jugadores</h3>
        <div className="grid grid-cols-2 gap-3">
          {booking.players.map((player: any) => (
            <div key={player.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {player.position}
              </div>
              <span className="text-sm">{player.playerName}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t text-xs text-gray-500">
        <p>Reserva creada el {format(new Date(booking.createdAt), 'PPpp', { locale: es })}</p>
        {booking.updatedAt !== booking.createdAt && (
          <p>Última actualización: {format(new Date(booking.updatedAt), 'PPpp', { locale: es })}</p>
        )}
      </div>
    </div>
  )
}
```

### Página de Confirmación

```typescript
// pages/booking/[id]/confirmation.tsx
import { useRouter } from 'next/router'
import { useBookingDetails } from '@/hooks/useBookingDetails'
import { BookingDetails } from '@/components/BookingDetails'

export default function BookingConfirmationPage() {
  const router = useRouter()
  const { id } = router.query
  
  if (!id || typeof id !== 'string') {
    return <div>ID de reserva inválido</div>
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Confirmación de Reserva</h1>
          <p className="text-gray-600 mt-2">Detalles de tu reserva de pádel</p>
        </div>
        
        <BookingDetails bookingId={id} />
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
```

## Dependencias

- `@/lib/services/bookings` - Función `getBookingById`
- `next/server` - Utilidades de Next.js

## Base de Datos

### Consulta Ejecutada

El endpoint utiliza la función `getBookingById(id)` que ejecuta una consulta con JOINs:

```sql
SELECT 
  b.*,
  c.id as court_id,
  c.name as court_name,
  c.description as court_description,
  c.basePrice as court_basePrice,
  c.priceMultiplier as court_priceMultiplier,
  c.isActive as court_isActive,
  c.createdAt as court_createdAt,
  c.updatedAt as court_updatedAt,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.image as user_image,
  u.role as user_role,
  u.createdAt as user_createdAt,
  u.updatedAt as user_updatedAt,
  bp.id as player_id,
  bp.position as player_position,
  bp.playerName as player_name,
  bp.createdAt as player_createdAt,
  bp.updatedAt as player_updatedAt
FROM "Booking" b
JOIN "Court" c ON b."courtId" = c.id
JOIN "User" u ON b."userId" = u.id
LEFT JOIN "BookingPlayer" bp ON b.id = bp."bookingId"
WHERE b.id = $1
ORDER BY bp.position ASC
```

### Índices Recomendados

```sql
-- Índice primario (ya existe)
CREATE UNIQUE INDEX idx_booking_id ON "Booking"(id);

-- Índices para JOINs
CREATE INDEX idx_booking_court_id ON "Booking"("courtId");
CREATE INDEX idx_booking_user_id ON "Booking"("userId");
CREATE INDEX idx_booking_player_booking_id ON "BookingPlayer"("bookingId");
```

## Performance

### Optimizaciones

1. **Consulta Única**: Todos los datos se obtienen en una sola consulta
2. **Índices Optimizados**: Índices en todas las claves foráneas
3. **Caché Potencial**: El endpoint es cacheable por ID

### Métricas de Performance

- **Tiempo de Respuesta**: < 50ms para consultas con índices
- **Consultas de BD**: 1 consulta principal con JOINs
- **Memoria**: Mínima, datos específicos de una reserva

## Testing

### Tests Unitarios

```typescript
describe('GET /api/bookings/[id]', () => {
  it('should return booking details successfully', async () => {
    const mockBooking = {
      id: 'booking-123',
      court: { name: 'Cancha 1' },
      user: { name: 'Test User' },
      players: []
    }
    
    jest.mocked(getBookingById).mockResolvedValue(mockBooking)
    
    const response = await GET(
      new Request('http://localhost/api/bookings/booking-123'),
      { params: { id: 'booking-123' } }
    )
    
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result).toEqual(mockBooking)
  })
  
  it('should return 404 for non-existent booking', async () => {
    jest.mocked(getBookingById).mockResolvedValue(null)
    
    const response = await GET(
      new Request('http://localhost/api/bookings/invalid-id'),
      { params: { id: 'invalid-id' } }
    )
    
    expect(response.status).toBe(404)
  })
})
```

### Tests de Integración

```typescript
describe('Booking Details Integration', () => {
  it('should return complete booking data', async () => {
    const user = await createTestUser()
    const court = await createTestCourt()
    const booking = await createTestBooking({ 
      userId: user.id, 
      courtId: court.id 
    })
    
    const response = await fetch(`/api/bookings/${booking.id}`)
    
    expect(response.status).toBe(200)
    
    const result = await response.json()
    expect(result).toMatchObject({
      id: booking.id,
      court: expect.objectContaining({
        id: court.id,
        name: court.name
      }),
      user: expect.objectContaining({
        id: user.id,
        email: user.email
      }),
      players: expect.arrayContaining([
        expect.objectContaining({
          bookingId: booking.id,
          position: expect.any(Number)
        })
      ])
    })
  })
})
```

## Casos de Uso

### Confirmación de Reserva
```typescript
// Mostrar confirmación después de crear reserva
const showBookingConfirmation = (bookingId: string) => {
  router.push(`/booking/${bookingId}/confirmation`)
}
```

### Compartir Reserva
```typescript
// Generar enlace para compartir reserva
const shareBooking = (bookingId: string) => {
  const shareUrl = `${window.location.origin}/booking/${bookingId}`
  navigator.clipboard.writeText(shareUrl)
}
```

### Verificación Externa
```typescript
// Verificar reserva desde sistema externo
const verifyBooking = async (bookingId: string) => {
  const booking = await getBookingDetails(bookingId)
  return booking.status === 'CONFIRMED'
}
```

### Impresión de Comprobante
```typescript
// Generar comprobante para imprimir
const printBookingReceipt = (booking: any) => {
  const printWindow = window.open('', '_blank')
  printWindow?.document.write(`
    <html>
      <head><title>Comprobante de Reserva</title></head>
      <body>
        <h1>Comprobante de Reserva</h1>
        <p>ID: ${booking.id}</p>
        <p>Cancha: ${booking.court.name}</p>
        <p>Fecha: ${booking.bookingDate}</p>
        <p>Horario: ${booking.startTime} - ${booking.endTime}</p>
        <p>Total: $${(booking.totalPrice / 100).toFixed(2)}</p>
      </body>
    </html>
  `)
  printWindow?.print()
}
```

## Monitoreo y Logging

### Eventos Registrados

```typescript
// Logging de consultas
console.log(`Consulta de detalles de reserva: ${params.id}`)

// Logging de errores
console.error('GET /api/bookings/[id] error:', error)
```

### Métricas Sugeridas

- Reservas más consultadas
- Tiempo promedio de respuesta por consulta
- Tasa de consultas de reservas no existentes
- Patrones de acceso (horarios, días)

## Problemas Conocidos

1. **Endpoint Público**: No hay restricciones de acceso, cualquiera puede consultar
2. **Información Sensible**: Expone emails y datos de usuarios
3. **Sin Caché**: No implementa caché para consultas repetidas
4. **Sin Rate Limiting**: Vulnerable a consultas masivas

## Mejoras Futuras

1. **Autenticación Opcional**: Mostrar más detalles si está autenticado
2. **Caché de Respuestas**: Implementar caché con TTL
3. **Rate Limiting**: Limitar consultas por IP
4. **Versionado de Datos**: Incluir versión de la estructura de datos
5. **Campos Opcionales**: Permitir seleccionar qué campos incluir
6. **Audit Trail**: Registrar quién consulta qué reservas
7. **Privacidad Mejorada**: Ofuscar datos sensibles para consultas no autenticadas

---

**Última actualización**: 2024-01-15  
**Versión**: 1.0  
**Runtime**: Node.js