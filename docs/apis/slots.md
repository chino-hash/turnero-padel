# API de Slots de Horarios

## Información del Endpoint

**Endpoint**: `GET /api/slots`  
**Archivo**: `app/api/slots/route.ts`  
**Versión**: `v1.0`  
**Autor**: Equipo de Desarrollo  
**Fecha**: 2024-01-15

## Descripción

Endpoint para obtener los slots de horarios disponibles para reservas de canchas de pádel. Permite consultar la disponibilidad de horarios para una fecha y cancha específica, mostrando qué horarios están libres y cuáles están ocupados.

## Autenticación

- **Requerida**: ❌ No
- **Tipo**: Público
- **Roles permitidos**: Público (sin restricciones)

> **Nota**: Este endpoint es público para permitir que los usuarios vean la disponibilidad antes de autenticarse.

## Request

### Método HTTP
`GET`

### URL
```
GET /api/slots
```

### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | `string` | ✅ | Fecha en formato ISO (YYYY-MM-DD) |
| `courtId` | `string` | ✅ | ID de la cancha |

#### Ejemplo de URL
```
GET /api/slots?date=2024-01-20&courtId=court-123
```

### Headers

No se requieren headers especiales para este endpoint.

### Validaciones de Query Parameters

- `date`: Debe ser una fecha válida en formato ISO (YYYY-MM-DD)
- `date`: No puede ser una fecha pasada
- `courtId`: Debe ser un ID válido de cancha existente

## Response

### Respuesta Exitosa (200)

```typescript
interface SlotsResponse {
  date: string
  courtId: string
  courtName: string
  slots: TimeSlot[]
  totalSlots: number
  availableSlots: number
  occupiedSlots: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  price: number
  bookingId?: string
  duration: number
}
```

#### Ejemplo de Respuesta Exitosa
```json
{
  "date": "2024-01-20",
  "courtId": "court-123",
  "courtName": "Cancha 1",
  "slots": [
    {
      "startTime": "08:00",
      "endTime": "09:30",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    },
    {
      "startTime": "09:30",
      "endTime": "11:00",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    },
    {
      "startTime": "11:00",
      "endTime": "12:30",
      "isAvailable": false,
      "price": 6000,
      "bookingId": "booking-456",
      "duration": 90
    },
    {
      "startTime": "12:30",
      "endTime": "14:00",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    },
    {
      "startTime": "14:00",
      "endTime": "15:30",
      "isAvailable": false,
      "price": 6000,
      "bookingId": "booking-789",
      "duration": 90
    },
    {
      "startTime": "15:30",
      "endTime": "17:00",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    },
    {
      "startTime": "17:00",
      "endTime": "18:30",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    },
    {
      "startTime": "18:30",
      "endTime": "20:00",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    },
    {
      "startTime": "20:00",
      "endTime": "21:30",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    },
    {
      "startTime": "21:30",
      "endTime": "23:00",
      "isAvailable": true,
      "price": 6000,
      "duration": 90
    }
  ],
  "totalSlots": 10,
  "availableSlots": 8,
  "occupiedSlots": 2
}
```

### Respuestas de Error

#### 400 - Bad Request
```json
{
  "error": "Parámetros de consulta inválidos",
  "details": {
    "date": "La fecha es requerida y debe estar en formato YYYY-MM-DD",
    "courtId": "El ID de la cancha es requerido"
  }
}
```

#### 400 - Invalid Date
```json
{
  "error": "Fecha inválida",
  "message": "No se pueden consultar fechas pasadas"
}
```

#### 404 - Court Not Found
```json
{
  "error": "Cancha no encontrada",
  "message": "La cancha especificada no existe o no está activa"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

## Lógica de Negocio

### Generación de Slots

1. **Horarios Fijos**: Se generan slots de 90 minutos desde las 8:00 hasta las 23:00
2. **Intervalos**: Cada slot tiene una duración fija de 90 minutos
3. **Horarios de Operación**: 
   - Inicio: 08:00
   - Fin: 23:00
   - Total: 10 slots por día

### Verificación de Disponibilidad

1. **Consulta de Reservas**: Se consultan las reservas existentes para la fecha y cancha
2. **Comparación de Horarios**: Se compara cada slot con las reservas existentes
3. **Estado de Disponibilidad**: Se marca como ocupado si existe una reserva que se superpone
4. **Información de Reserva**: Para slots ocupados, se incluye el ID de la reserva

### Cálculo de Precios

1. **Precio Base**: Se obtiene de la configuración de la cancha
2. **Multiplicador**: Se aplica el multiplicador de precio de la cancha
3. **Precio Final**: `basePrice * priceMultiplier`
4. **Formato**: Precios en centavos para evitar problemas de precisión

### Reglas de Validación

- **Fecha Futura**: Solo se permiten consultas para fechas actuales o futuras
- **Cancha Activa**: Solo se muestran slots para canchas activas
- **Formato de Fecha**: Debe ser ISO (YYYY-MM-DD)
- **Existencia de Cancha**: La cancha debe existir en la base de datos

## Ejemplos de Uso

### Cliente JavaScript

```javascript
// Obtener slots disponibles para una fecha y cancha
const getAvailableSlots = async (date, courtId) => {
  try {
    const params = new URLSearchParams({
      date: date,
      courtId: courtId
    })
    
    const response = await fetch(`/api/slots?${params}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error obteniendo slots')
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// Uso
const slots = await getAvailableSlots('2024-01-20', 'court-123')
console.log(`${slots.availableSlots} de ${slots.totalSlots} slots disponibles`)

// Filtrar solo slots disponibles
const availableSlots = slots.slots.filter(slot => slot.isAvailable)
console.log('Horarios disponibles:', availableSlots.map(s => `${s.startTime}-${s.endTime}`))
```

### Hook React

```typescript
import { useState, useEffect } from 'react'

interface UseSlotsReturn {
  slots: SlotsResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSlots(date: string, courtId: string): UseSlotsReturn {
  const [slots, setSlots] = useState<SlotsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = async () => {
    if (!date || !courtId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ date, courtId })
      const response = await fetch(`/api/slots?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error obteniendo slots')
      }
      
      const data = await response.json()
      setSlots(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [date, courtId])

  return { slots, loading, error, refetch: fetchSlots }
}
```

### Componente React - Selector de Horarios

```typescript
import { useSlots } from '@/hooks/useSlots'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TimeSlotSelectorProps {
  date: string
  courtId: string
  onSlotSelect: (slot: TimeSlot) => void
  selectedSlot?: TimeSlot | null
}

export function TimeSlotSelector({ 
  date, 
  courtId, 
  onSlotSelect, 
  selectedSlot 
}: TimeSlotSelectorProps) {
  const { slots, loading, error } = useSlots(date, courtId)
  
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-medium">Error cargando horarios</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }
  
  if (!slots) {
    return (
      <div className="text-center py-8 text-gray-500">
        Selecciona una fecha y cancha para ver los horarios disponibles
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header con información */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900">
          {slots.courtName} - {format(new Date(date), 'PPP', { locale: es })}
        </h3>
        <div className="flex space-x-4 text-sm text-blue-700 mt-2">
          <span>Total: {slots.totalSlots} slots</span>
          <span className="text-green-700">Disponibles: {slots.availableSlots}</span>
          <span className="text-red-700">Ocupados: {slots.occupiedSlots}</span>
        </div>
      </div>
      
      {/* Grid de slots */}
      <div className="grid gap-2">
        {slots.slots.map((slot, index) => {
          const isSelected = selectedSlot?.startTime === slot.startTime
          
          return (
            <button
              key={`${slot.startTime}-${slot.endTime}`}
              onClick={() => slot.isAvailable && onSlotSelect(slot)}
              disabled={!slot.isAvailable}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${slot.isAvailable 
                  ? isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  : 'border-red-200 bg-red-50 text-red-600 cursor-not-allowed'
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div className="text-sm text-gray-600">
                    {slot.duration} minutos
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold">
                    ${(slot.price / 100).toFixed(2)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    slot.isAvailable 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {slot.isAvailable ? 'Disponible' : 'Ocupado'}
                  </div>
                </div>
              </div>
              
              {!slot.isAvailable && slot.bookingId && (
                <div className="text-xs text-gray-500 mt-2">
                  Reserva: {slot.bookingId}
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {slots.availableSlots === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-lg font-medium">No hay horarios disponibles</p>
          <p className="text-sm">Todos los slots están ocupados para esta fecha</p>
        </div>
      )}
    </div>
  )
}
```

### Componente React - Calendario con Disponibilidad

```typescript
import { useState } from 'react'
import { useSlots } from '@/hooks/useSlots'
import { format, addDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface AvailabilityCalendarProps {
  courtId: string
  onDateSelect: (date: string) => void
  selectedDate?: string
}

export function AvailabilityCalendar({ 
  courtId, 
  onDateSelect, 
  selectedDate 
}: AvailabilityCalendarProps) {
  const [currentDate] = useState(new Date())
  
  // Generar próximos 14 días
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(startOfDay(currentDate), i)
    return format(date, 'yyyy-MM-dd')
  })
  
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 mb-4">
        Selecciona una fecha
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {dates.map((date) => (
          <DateAvailabilityCard
            key={date}
            date={date}
            courtId={courtId}
            isSelected={selectedDate === date}
            onSelect={() => onDateSelect(date)}
          />
        ))}
      </div>
    </div>
  )
}

interface DateAvailabilityCardProps {
  date: string
  courtId: string
  isSelected: boolean
  onSelect: () => void
}

function DateAvailabilityCard({ 
  date, 
  courtId, 
  isSelected, 
  onSelect 
}: DateAvailabilityCardProps) {
  const { slots, loading } = useSlots(date, courtId)
  
  const dateObj = new Date(date)
  const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  
  return (
    <button
      onClick={onSelect}
      className={`
        p-3 rounded-lg border-2 text-center transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-300'
        }
      `}
    >
      <div className="text-sm font-medium">
        {format(dateObj, 'EEE', { locale: es })}
      </div>
      <div className={`text-lg font-bold ${
        isToday ? 'text-blue-600' : 'text-gray-900'
      }`}>
        {format(dateObj, 'd')}
      </div>
      <div className="text-xs text-gray-600">
        {format(dateObj, 'MMM', { locale: es })}
      </div>
      
      {loading ? (
        <div className="mt-2 h-4 bg-gray-200 rounded animate-pulse" />
      ) : slots ? (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-green-600">
            {slots.availableSlots} libres
          </div>
          {slots.occupiedSlots > 0 && (
            <div className="text-xs text-red-600">
              {slots.occupiedSlots} ocupados
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-400">
          Sin datos
        </div>
      )}
    </button>
  )
}
```

### Integración con Formulario de Reserva

```typescript
import { useState } from 'react'
import { TimeSlotSelector } from '@/components/TimeSlotSelector'
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar'

export function BookingForm() {
  const [selectedCourt, setSelectedCourt] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }
  
  const handleBooking = async () => {
    if (!selectedCourt || !selectedDate || !selectedSlot) {
      alert('Por favor completa todos los campos')
      return
    }
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId: selectedCourt,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        })
      })
      
      if (!response.ok) {
        throw new Error('Error creando reserva')
      }
      
      const booking = await response.json()
      alert('Reserva creada exitosamente!')
      
      // Redirigir a confirmación
      window.location.href = `/booking/${booking.id}/confirmation`
    } catch (error) {
      console.error('Error:', error)
      alert('Error creando la reserva')
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center">Reservar Cancha</h1>
      
      {/* Selector de Cancha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecciona una cancha
        </label>
        <select
          value={selectedCourt}
          onChange={(e) => setSelectedCourt(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Selecciona una cancha...</option>
          <option value="court-123">Cancha 1</option>
          <option value="court-456">Cancha 2</option>
        </select>
      </div>
      
      {/* Calendario */}
      {selectedCourt && (
        <AvailabilityCalendar
          courtId={selectedCourt}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      )}
      
      {/* Selector de Horarios */}
      {selectedCourt && selectedDate && (
        <TimeSlotSelector
          date={selectedDate}
          courtId={selectedCourt}
          selectedSlot={selectedSlot}
          onSlotSelect={handleSlotSelect}
        />
      )}
      
      {/* Resumen y Confirmación */}
      {selectedSlot && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Resumen de Reserva</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{format(new Date(selectedDate), 'PPP', { locale: es })}</span>
            </div>
            <div className="flex justify-between">
              <span>Horario:</span>
              <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Duración:</span>
              <span>{selectedSlot.duration} minutos</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${(selectedSlot.price / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={handleBooking}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Confirmar Reserva
          </button>
        </div>
      )}
    </div>
  )
}
```

## Dependencias

- `@/lib/services/slots` - Función `getAvailableSlots`
- `@/lib/services/courts` - Función `getCourtById`
- `@/lib/services/bookings` - Función `getBookingsByDateAndCourt`
- `next/server` - Utilidades de Next.js
- `date-fns` - Manipulación de fechas

## Base de Datos

### Consultas Ejecutadas

#### Verificar Cancha
```sql
SELECT * FROM "Court" 
WHERE "id" = $1 AND "isActive" = true;
```

#### Obtener Reservas Existentes
```sql
SELECT 
  "id",
  "startTime",
  "endTime",
  "status"
FROM "Booking" 
WHERE "courtId" = $1 
  AND "bookingDate" = $2 
  AND "status" IN ('PENDING', 'CONFIRMED')
ORDER BY "startTime" ASC;
```

### Índices Recomendados

```sql
-- Índice compuesto para consultas de disponibilidad
CREATE INDEX idx_booking_court_date_time ON "Booking"(
  "courtId", 
  "bookingDate", 
  "startTime", 
  "endTime"
) WHERE "status" IN ('PENDING', 'CONFIRMED');

-- Índice para consultas de cancha activa
CREATE INDEX idx_court_active ON "Court"("id") WHERE "isActive" = true;
```

## Performance

### Optimizaciones

1. **Consultas Eficientes**: Índices optimizados para consultas de disponibilidad
2. **Filtrado en BD**: Solo se consultan reservas activas
3. **Generación en Memoria**: Los slots se generan en memoria, no en BD
4. **Caché Potencial**: Respuestas cacheables por fecha y cancha

### Métricas de Performance

- **Tiempo de Respuesta**: < 30ms para consultas con índices
- **Consultas de BD**: 2 consultas (cancha + reservas)
- **Memoria**: Mínima, datos estructurados simples
- **Generación de Slots**: < 1ms para 10 slots

### Estrategias de Caché

```typescript
// Ejemplo de implementación con caché
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const slotsCache = new Map()

const getCachedSlots = (date: string, courtId: string) => {
  const key = `${date}-${courtId}`
  const cached = slotsCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  return null
}

const setCachedSlots = (date: string, courtId: string, data: any) => {
  const key = `${date}-${courtId}`
  slotsCache.set(key, {
    data,
    timestamp: Date.now()
  })
}
```

## Testing

### Tests Unitarios

```typescript
describe('GET /api/slots', () => {
  it('should return available slots for valid date and court', async () => {
    const mockCourt = { id: 'court-123', name: 'Cancha 1', basePrice: 6000 }
    const mockBookings = [
      { startTime: '11:00', endTime: '12:30', status: 'CONFIRMED' }
    ]
    
    jest.mocked(getCourtById).mockResolvedValue(mockCourt)
    jest.mocked(getBookingsByDateAndCourt).mockResolvedValue(mockBookings)
    
    const response = await GET(
      new Request('http://localhost/api/slots?date=2024-01-20&courtId=court-123')
    )
    
    expect(response.status).toBe(200)
    const result = await response.json()
    
    expect(result.totalSlots).toBe(10)
    expect(result.availableSlots).toBe(9)
    expect(result.occupiedSlots).toBe(1)
    
    // Verificar que el slot 11:00-12:30 está ocupado
    const occupiedSlot = result.slots.find(
      (s: any) => s.startTime === '11:00'
    )
    expect(occupiedSlot.isAvailable).toBe(false)
  })
  
  it('should return 400 for missing parameters', async () => {
    const response = await GET(
      new Request('http://localhost/api/slots')
    )
    
    expect(response.status).toBe(400)
  })
  
  it('should return 400 for past dates', async () => {
    const pastDate = '2020-01-01'
    
    const response = await GET(
      new Request(`http://localhost/api/slots?date=${pastDate}&courtId=court-123`)
    )
    
    expect(response.status).toBe(400)
  })
  
  it('should return 404 for non-existent court', async () => {
    jest.mocked(getCourtById).mockResolvedValue(null)
    
    const response = await GET(
      new Request('http://localhost/api/slots?date=2024-01-20&courtId=invalid')
    )
    
    expect(response.status).toBe(404)
  })
})
```

### Tests de Integración

```typescript
describe('Slots API Integration', () => {
  it('should return correct availability after booking', async () => {
    const court = await createTestCourt()
    const user = await createTestUser()
    
    // Verificar disponibilidad inicial
    const initialResponse = await fetch(
      `/api/slots?date=2024-01-20&courtId=${court.id}`
    )
    const initialSlots = await initialResponse.json()
    expect(initialSlots.availableSlots).toBe(10)
    
    // Crear una reserva
    await createTestBooking({
      courtId: court.id,
      userId: user.id,
      bookingDate: '2024-01-20',
      startTime: '14:00',
      endTime: '15:30'
    })
    
    // Verificar disponibilidad actualizada
    const updatedResponse = await fetch(
      `/api/slots?date=2024-01-20&courtId=${court.id}`
    )
    const updatedSlots = await updatedResponse.json()
    
    expect(updatedSlots.availableSlots).toBe(9)
    expect(updatedSlots.occupiedSlots).toBe(1)
    
    // Verificar que el slot específico está ocupado
    const occupiedSlot = updatedSlots.slots.find(
      (s: any) => s.startTime === '14:00'
    )
    expect(occupiedSlot.isAvailable).toBe(false)
  })
})
```

## Casos de Uso

### Consulta de Disponibilidad
```typescript
// Verificar si un horario específico está disponible
const isSlotAvailable = async (date: string, courtId: string, startTime: string) => {
  const slots = await getAvailableSlots(date, courtId)
  const slot = slots.slots.find(s => s.startTime === startTime)
  return slot?.isAvailable || false
}
```

### Búsqueda de Próximo Slot Disponible
```typescript
// Encontrar el próximo slot disponible
const findNextAvailableSlot = async (date: string, courtId: string) => {
  const slots = await getAvailableSlots(date, courtId)
  return slots.slots.find(slot => slot.isAvailable) || null
}
```

### Análisis de Ocupación
```typescript
// Calcular estadísticas de ocupación
const getOccupancyStats = async (date: string, courtId: string) => {
  const slots = await getAvailableSlots(date, courtId)
  
  return {
    occupancyRate: (slots.occupiedSlots / slots.totalSlots) * 100,
    peakHours: slots.slots
      .filter(s => !s.isAvailable)
      .map(s => s.startTime),
    revenue: slots.slots
      .filter(s => !s.isAvailable)
      .reduce((sum, s) => sum + s.price, 0)
  }
}
```

## Monitoreo y Logging

### Eventos Registrados

```typescript
// Consulta de slots
console.log(`GET /api/slots - Fecha: ${date}, Cancha: ${courtId}`)

// Estadísticas de disponibilidad
console.log(`Slots disponibles: ${availableSlots}/${totalSlots} para ${courtName}`)

// Errores
console.error('Slots API error:', error)
```

### Métricas Sugeridas

- Consultas de slots por día/hora
- Canchas más consultadas
- Horarios más solicitados
- Tiempo promedio de respuesta
- Tasa de conversión (consulta → reserva)

## Problemas Conocidos

1. **Sin Caché**: Consultas repetidas no se optimizan
2. **Horarios Fijos**: No permite horarios personalizados
3. **Sin Precios Dinámicos**: Precios fijos por cancha
4. **Sin Reservas Parciales**: No maneja reservas que se superponen parcialmente
5. **Sin Configuración de Horarios**: Horarios de operación hardcodeados
6. **Sin Días Especiales**: No maneja feriados o días con horarios especiales

## Mejoras Futuras

### Funcionalidades

1. **Horarios Configurables**: Permitir configurar horarios de operación por cancha
2. **Precios Dinámicos**: Precios variables por horario (peak/off-peak)
3. **Días Especiales**: Manejo de feriados y horarios especiales
4. **Reservas Flexibles**: Slots de duración variable
5. **Bloqueos de Mantenimiento**: Slots bloqueados por mantenimiento
6. **Reservas Recurrentes**: Mostrar disponibilidad para reservas recurrentes

### Performance

1. **Caché Inteligente**: Caché con invalidación automática
2. **Precarga**: Precarga de datos para fechas próximas
3. **Compresión**: Compresión de respuestas JSON
4. **CDN**: Caché de respuestas en CDN

### UX/UI

1. **Filtros Avanzados**: Filtrar por precio, duración, horario
2. **Vista de Calendario**: Vista mensual con disponibilidad
3. **Notificaciones**: Alertas cuando se liberen slots
4. **Reserva Rápida**: Reserva del próximo slot disponible

### Administración

1. **Dashboard de Ocupación**: Métricas de ocupación en tiempo real
2. **Gestión de Horarios**: Interface para configurar horarios
3. **Análisis de Demanda**: Análisis de patrones de demanda
4. **Optimización de Precios**: Sugerencias de precios basadas en demanda

---

**Última actualización**: 2024-01-15  
**Versión**: 1.0  
**Runtime**: Node.js