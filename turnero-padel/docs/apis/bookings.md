# API de Reservas (Bookings)

## Información del Endpoint

**Endpoint**: `POST /api/bookings`  
**Archivo**: `app/api/bookings/route.ts`  
**Versión**: `v1.0`  
**Autor**: Equipo de Desarrollo  
**Fecha**: 2024-01-15

## Descripción

Endpoint para crear nuevas reservas de canchas de pádel. Maneja la validación de disponibilidad, cálculo de precios, creación de jugadores y gestión de depósitos.

## Autenticación

- **Requerida**: ✅ Sí
- **Tipo**: Session (NextAuth.js)
- **Roles permitidos**: `USER`, `ADMIN`

## Request

### Método HTTP
`POST`

### URL
```
POST /api/bookings
```

### Headers

| Header | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `Content-Type` | `string` | ✅ | `application/json` |
| `Cookie` | `string` | ✅ | Sesión de NextAuth.js |

### Request Body

```typescript
interface CreateBookingRequest {
  courtId: string      // ID de la cancha
  date: string         // Fecha en formato YYYY-MM-DD
  startTime: string    // Hora inicio en formato HH:MM
  endTime: string      // Hora fin en formato HH:MM
}
```

#### Ejemplo de Request Body
```json
{
  "courtId": "court-123",
  "date": "2024-01-20",
  "startTime": "14:00",
  "endTime": "15:30"
}
```

### Validaciones de Entrada

| Campo | Validación | Descripción |
|-------|------------|-------------|
| `courtId` | Requerido, string no vacío | ID válido de cancha existente |
| `date` | Requerido, formato YYYY-MM-DD | Fecha válida, no en el pasado |
| `startTime` | Requerido, formato HH:MM | Hora válida (00:00-23:59) |
| `endTime` | Requerido, formato HH:MM | Hora válida, posterior a startTime |

## Response

### Respuesta Exitosa (201)

```typescript
interface CreateBookingResponse {
  id: string
  booking: {
    id: string
    courtId: string
    userId: string
    bookingDate: string
    startTime: string
    endTime: string
    status: 'PENDING'
    paymentStatus: 'PENDING'
    totalPrice: number
    depositAmount: number
    createdAt: string
    updatedAt: string
    court: {
      id: string
      name: string
      basePrice: number
      priceMultiplier: number
    }
    user: {
      id: string
      name: string
      email: string
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
}
```

#### Ejemplo de Respuesta Exitosa
```json
{
  "id": "booking-456",
  "booking": {
    "id": "booking-456",
    "courtId": "court-123",
    "userId": "user-789",
    "bookingDate": "2024-01-20T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "15:30",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalPrice": 6000,
    "depositAmount": 3000,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "court": {
      "id": "court-123",
      "name": "Cancha 1",
      "basePrice": 6000,
      "priceMultiplier": 1.0
    },
    "user": {
      "id": "user-789",
      "name": "Juan Pérez",
      "email": "juan@example.com"
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
        "playerName": "Jugador 2"
      },
      {
        "id": "player-3",
        "bookingId": "booking-456",
        "position": 3,
        "playerName": "Jugador 3"
      },
      {
        "id": "player-4",
        "bookingId": "booking-456",
        "position": 4,
        "playerName": "Jugador 4"
      }
    ]
  }
}
```

### Respuestas de Error

#### 400 - Bad Request
```json
{
  "error": "Faltan parámetros"
}
```

```json
{
  "error": "Formato de parámetros inválido"
}
```

#### 401 - Unauthorized
```json
{
  "error": "No autorizado"
}
```

#### 404 - Not Found
```json
{
  "error": "Cancha no encontrada"
}
```

#### 409 - Conflict
```json
{
  "error": "El horario no está disponible para la fecha seleccionada"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

## Lógica de Negocio

### Cálculo de Precios

1. **Precio Base**: Se obtiene de `court.basePrice`
2. **Multiplicador**: Se aplica `court.priceMultiplier`
3. **Precio Total**: `Math.round(basePrice * priceMultiplier)`
4. **Depósito**: Porcentaje configurable (default 50%)

```typescript
const totalPrice = Math.round((court.basePrice || 0) * (court.priceMultiplier || 1))
const depositPercentage = Number(setting?.value ?? 50)
const depositAmount = Math.round(totalPrice * (depositPercentage / 100))
```

### Validación de Disponibilidad

- Se verifica que no existan reservas conflictivas en el mismo horario
- Se utiliza la función `checkAvailability` del servicio de reservas
- Los horarios se validan con precisión de minutos

### Creación de Jugadores

Se crean automáticamente 4 jugadores:
- **Posición 1**: Nombre del usuario que hace la reserva
- **Posiciones 2-4**: "Jugador 2", "Jugador 3", "Jugador 4" (placeholders)

## Ejemplos de Uso

### Cliente JavaScript

```javascript
// Crear una nueva reserva
const createBooking = async (bookingData) => {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }
    
    const result = await response.json()
    return result.booking
  } catch (error) {
    console.error('Error creando reserva:', error)
    throw error
  }
}

// Uso
const newBooking = await createBooking({
  courtId: 'court-123',
  date: '2024-01-20',
  startTime: '14:00',
  endTime: '15:30'
})
```

### Hook React

```typescript
import { useState } from 'react'

interface UseCreateBookingReturn {
  createBooking: (data: CreateBookingRequest) => Promise<void>
  loading: boolean
  error: string | null
  booking: any | null
}

export function useCreateBooking(): UseCreateBookingReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState(null)

  const createBooking = async (data: CreateBookingRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error)
      }
      
      setBooking(result.booking)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { createBooking, loading, error, booking }
}
```

### Componente React

```typescript
import { useCreateBooking } from '@/hooks/useCreateBooking'

export function BookingForm({ courtId }: { courtId: string }) {
  const { createBooking, loading, error } = useCreateBooking()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData(e.target as HTMLFormElement)
    
    await createBooking({
      courtId,
      date: formData.get('date') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="date" name="date" required />
      <input type="time" name="startTime" required />
      <input type="time" name="endTime" required />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Reserva'}
      </button>
      
      {error && <p className="error">{error}</p>}
    </form>
  )
}
```

## Dependencias

- `@/lib/auth` - Autenticación con NextAuth.js
- `@/lib/prisma` - Cliente de base de datos
- `@/lib/services/courts` - Servicios de canchas
- `@/lib/services/bookings` - Servicios de reservas
- `next/server` - Utilidades de Next.js

## Base de Datos

### Tablas Afectadas

#### Booking
```sql
CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "courtId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookingDate" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "totalPrice" INTEGER NOT NULL,
  "depositAmount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
```

#### BookingPlayer
```sql
CREATE TABLE "BookingPlayer" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "playerName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingPlayer_pkey" PRIMARY KEY ("id")
);
```

#### SystemSetting
```sql
CREATE TABLE "SystemSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);
```

## Configuración del Sistema

### Settings Utilizados

| Key | Descripción | Valor Default | Tipo |
|-----|-------------|---------------|------|
| `deposit_percentage` | Porcentaje de depósito requerido | `50` | `number` |

## Testing

### Tests Unitarios

```typescript
describe('POST /api/bookings', () => {
  beforeEach(() => {
    // Setup mocks
    jest.clearAllMocks()
  })
  
  it('should create booking successfully', async () => {
    const mockSession = {
      user: { id: 'user-123', name: 'Test User' }
    }
    
    const bookingData = {
      courtId: 'court-123',
      date: '2024-01-20',
      startTime: '14:00',
      endTime: '15:30'
    }
    
    const response = await POST(new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }))
    
    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('booking')
  })
  
  it('should return 401 for unauthenticated user', async () => {
    const response = await POST(new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({})
    }))
    
    expect(response.status).toBe(401)
  })
  
  it('should return 400 for missing parameters', async () => {
    // Mock authenticated session
    const response = await POST(new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ courtId: 'court-123' }) // Missing other fields
    }))
    
    expect(response.status).toBe(400)
  })
})
```

### Tests de Integración

```typescript
describe('Booking Integration Tests', () => {
  it('should create booking with real database', async () => {
    // Setup test database
    const court = await createTestCourt()
    const user = await createTestUser()
    
    const bookingData = {
      courtId: court.id,
      date: '2024-01-20',
      startTime: '14:00',
      endTime: '15:30'
    }
    
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': await getAuthCookie(user)
      },
      body: JSON.stringify(bookingData)
    })
    
    expect(response.status).toBe(201)
    
    // Verify database state
    const booking = await prisma.booking.findFirst({
      where: { courtId: court.id }
    })
    
    expect(booking).toBeTruthy()
    expect(booking?.userId).toBe(user.id)
  })
})
```

## Monitoreo y Logging

### Eventos Registrados

```typescript
// Logging de eventos importantes
console.log(`Nueva reserva creada: ${booking.id} por usuario ${session.user.id}`)
console.error('POST /api/bookings error:', err)
```

### Métricas Sugeridas

- Número de reservas creadas por día
- Tiempo promedio de respuesta
- Tasa de errores por tipo
- Canchas más reservadas
- Horarios más populares

## Problemas Conocidos

1. **Concurrencia**: Posibles condiciones de carrera en reservas simultáneas
2. **Transacciones**: No se usan transacciones para operaciones múltiples
3. **Validación de Horarios**: No valida horarios de operación de la cancha
4. **Notificaciones**: No se envían confirmaciones por email

## Mejoras Futuras

1. **Transacciones Atómicas**: Implementar transacciones para crear reserva + jugadores
2. **Validación Avanzada**: Validar horarios de operación y días disponibles
3. **Sistema de Notificaciones**: Emails de confirmación y recordatorios
4. **Reservas Recurrentes**: Permitir reservas semanales/mensuales
5. **Lista de Espera**: Sistema de lista de espera para horarios ocupados
6. **Integración de Pagos**: Procesar pagos en línea
7. **Optimistic Locking**: Prevenir condiciones de carrera

## Notas de Desarrollo

- El endpoint usa `runtime = 'nodejs'` para compatibilidad con Prisma
- Los precios se manejan en centavos para evitar problemas de precisión
- Los jugadores se crean automáticamente con nombres placeholder
- El sistema de depósitos es configurable via SystemSettings

---

**Última actualización**: 2024-01-15  
**Versión**: 1.0  
**Runtime**: Node.js