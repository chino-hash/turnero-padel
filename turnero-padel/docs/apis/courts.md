# API de Canchas

## Información del Endpoint

**Endpoint**: `GET/POST /api/courts`  
**Archivo**: `app/api/courts/route.ts`  
**Versión**: `v1.0`  
**Autor**: Equipo de Desarrollo  
**Fecha**: 2024-01-15

## Descripción

Endpoint para gestionar las canchas de pádel del sistema. Permite obtener la lista de canchas disponibles y crear nuevas canchas (solo administradores).

---

# GET /api/courts

## Descripción

Obtiene la lista de todas las canchas activas del sistema con su información básica.

## Autenticación

- **Requerida**: ❌ No
- **Tipo**: Público
- **Roles permitidos**: Público (sin restricciones)

## Request

### Método HTTP
`GET`

### URL
```
GET /api/courts
```

### Headers

No se requieren headers especiales para este endpoint.

### Query Parameters

Actualmente no se soportan parámetros de consulta, pero se pueden implementar en el futuro:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `active` | `boolean` | ❌ | Filtrar por estado activo (futuro) |
| `limit` | `number` | ❌ | Límite de resultados (futuro) |
| `offset` | `number` | ❌ | Offset para paginación (futuro) |

## Response

### Respuesta Exitosa (200)

```typescript
interface CourtsResponse {
  courts: Court[]
  total: number
}

interface Court {
  id: string
  name: string
  description?: string
  basePrice: number
  priceMultiplier: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

#### Ejemplo de Respuesta Exitosa
```json
{
  "courts": [
    {
      "id": "court-123",
      "name": "Cancha 1",
      "description": "Cancha principal con iluminación LED",
      "basePrice": 6000,
      "priceMultiplier": 1.0,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "court-456",
      "name": "Cancha 2",
      "description": "Cancha secundaria con césped sintético premium",
      "basePrice": 5500,
      "priceMultiplier": 0.9,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 2
}
```

### Respuestas de Error

#### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

---

# POST /api/courts

## Descripción

Crea una nueva cancha en el sistema. Solo disponible para administradores.

## Autenticación

- **Requerida**: ✅ Sí
- **Tipo**: NextAuth.js Session
- **Roles permitidos**: `ADMIN`

## Request

### Método HTTP
`POST`

### URL
```
POST /api/courts
```

### Headers

| Header | Valor | Requerido | Descripción |
|--------|-------|-----------|-------------|
| `Content-Type` | `application/json` | ✅ | Tipo de contenido |
| `Cookie` | `next-auth.session-token=...` | ✅ | Token de sesión |

### Body

```typescript
interface CreateCourtRequest {
  name: string
  description?: string
  basePrice: number
  priceMultiplier?: number
}
```

#### Ejemplo de Request Body
```json
{
  "name": "Cancha 3",
  "description": "Nueva cancha con tecnología de última generación",
  "basePrice": 7000,
  "priceMultiplier": 1.2
}
```

### Validaciones de Entrada

- `name`: Requerido, string no vacío, máximo 100 caracteres
- `description`: Opcional, string, máximo 500 caracteres
- `basePrice`: Requerido, número positivo, mínimo 1000 (centavos)
- `priceMultiplier`: Opcional, número positivo, por defecto 1.0, rango 0.1-5.0

## Response

### Respuesta Exitosa (201)

```typescript
interface CreateCourtResponse {
  court: Court
  message: string
}
```

#### Ejemplo de Respuesta Exitosa
```json
{
  "court": {
    "id": "court-789",
    "name": "Cancha 3",
    "description": "Nueva cancha con tecnología de última generación",
    "basePrice": 7000,
    "priceMultiplier": 1.2,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Cancha creada exitosamente"
}
```

### Respuestas de Error

#### 400 - Bad Request
```json
{
  "error": "Datos de entrada inválidos",
  "details": {
    "name": "El nombre es requerido",
    "basePrice": "El precio base debe ser mayor a 1000"
  }
}
```

#### 401 - Unauthorized
```json
{
  "error": "No autorizado"
}
```

#### 403 - Forbidden
```json
{
  "error": "Acceso denegado. Se requieren permisos de administrador"
}
```

#### 409 - Conflict
```json
{
  "error": "Ya existe una cancha con ese nombre"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

## Lógica de Negocio

### GET - Obtener Canchas

1. **Filtrado Automático**: Solo retorna canchas activas (`isActive: true`)
2. **Ordenamiento**: Las canchas se ordenan por nombre ascendente
3. **Datos Completos**: Incluye toda la información de cada cancha
4. **Conteo Total**: Incluye el número total de canchas activas

### POST - Crear Cancha

1. **Validación de Autenticación**: Verifica sesión válida
2. **Validación de Permisos**: Solo usuarios con rol `ADMIN`
3. **Validación de Datos**: Valida formato y rangos de todos los campos
4. **Verificación de Unicidad**: Verifica que no exista otra cancha con el mismo nombre
5. **Creación**: Crea la cancha con `isActive: true` por defecto
6. **Respuesta**: Retorna la cancha creada con todos sus datos

### Reglas de Precios

- `basePrice`: Precio base en centavos (ej: 6000 = $60.00)
- `priceMultiplier`: Multiplicador para ajustar precios (ej: 1.2 = +20%)
- Precio final = `basePrice * priceMultiplier`

## Ejemplos de Uso

### Cliente JavaScript - GET

```javascript
// Obtener todas las canchas
const getCourts = async () => {
  try {
    const response = await fetch('/api/courts')
    
    if (!response.ok) {
      throw new Error('Error obteniendo canchas')
    }
    
    const data = await response.json()
    return data.courts
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// Uso
const courts = await getCourts()
console.log(`Encontradas ${courts.length} canchas disponibles`)
```

### Cliente JavaScript - POST

```javascript
// Crear nueva cancha (solo admin)
const createCourt = async (courtData) => {
  try {
    const response = await fetch('/api/courts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courtData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error creando cancha')
    }
    
    const result = await response.json()
    return result.court
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// Uso
const newCourt = await createCourt({
  name: 'Cancha Premium',
  description: 'Cancha con césped natural',
  basePrice: 8000,
  priceMultiplier: 1.5
})
```

### Hook React

```typescript
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UseCourtsReturn {
  courts: Court[]
  loading: boolean
  error: string | null
  createCourt: (data: CreateCourtRequest) => Promise<Court>
  refetch: () => Promise<void>
}

export function useCourts(): UseCourtsReturn {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchCourts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/courts')
      
      if (!response.ok) {
        throw new Error('Error obteniendo canchas')
      }
      
      const data = await response.json()
      setCourts(data.courts)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCourt = async (courtData: CreateCourtRequest): Promise<Court> => {
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new Error('Se requieren permisos de administrador')
    }

    const response = await fetch('/api/courts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courtData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error creando cancha')
    }

    const result = await response.json()
    
    // Actualizar lista local
    setCourts(prev => [...prev, result.court])
    
    return result.court
  }

  useEffect(() => {
    fetchCourts()
  }, [])

  return { courts, loading, error, createCourt, refetch: fetchCourts }
}
```

### Componente React - Lista de Canchas

```typescript
import { useCourts } from '@/hooks/useCourts'
import { useSession } from 'next-auth/react'

export function CourtsList() {
  const { courts, loading, error } = useCourts()
  const { data: session } = useSession()
  
  if (loading) return <div className="animate-pulse">Cargando canchas...</div>
  if (error) return <div className="text-red-600">Error: {error}</div>
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Canchas Disponibles</h2>
        {session?.user?.role === 'ADMIN' && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Agregar Cancha
          </button>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map((court) => (
          <div key={court.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{court.name}</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                Activa
              </span>
            </div>
            
            {court.description && (
              <p className="text-gray-600 mb-4">{court.description}</p>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Precio base:</span>
                <span className="font-semibold">
                  ${(court.basePrice / 100).toFixed(2)}
                </span>
              </div>
              
              {court.priceMultiplier !== 1.0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Multiplicador:</span>
                  <span className={`font-semibold ${
                    court.priceMultiplier > 1 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {court.priceMultiplier}x
                  </span>
                </div>
              )}
              
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Precio final:</span>
                <span className="font-bold text-lg">
                  ${((court.basePrice * court.priceMultiplier) / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Reservar
            </button>
          </div>
        ))}
      </div>
      
      {courts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay canchas disponibles en este momento
        </div>
      )}
    </div>
  )
}
```

### Componente React - Crear Cancha

```typescript
import { useState } from 'react'
import { useCourts } from '@/hooks/useCourts'

interface CreateCourtFormProps {
  onSuccess?: (court: Court) => void
  onCancel?: () => void
}

export function CreateCourtForm({ onSuccess, onCancel }: CreateCourtFormProps) {
  const { createCourt } = useCourts()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: 6000,
    priceMultiplier: 1.0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const court = await createCourt({
        name: formData.name,
        description: formData.description || undefined,
        basePrice: formData.basePrice,
        priceMultiplier: formData.priceMultiplier
      })
      
      onSuccess?.(court)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la Cancha *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Base ($) *
          </label>
          <input
            type="number"
            value={formData.basePrice / 100}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              basePrice: Math.round(parseFloat(e.target.value) * 100) 
            }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="10"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Multiplicador de Precio
          </label>
          <input
            type="number"
            value={formData.priceMultiplier}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              priceMultiplier: parseFloat(e.target.value) 
            }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0.1"
            max="5.0"
            step="0.1"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded">
        <div className="text-sm text-gray-600">Precio Final:</div>
        <div className="text-lg font-bold">
          ${((formData.basePrice * formData.priceMultiplier) / 100).toFixed(2)}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear Cancha'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
```

## Dependencias

- `@/lib/services/courts` - Funciones `getAllCourts`, `createCourt`
- `@/lib/auth` - Función `getServerSession`
- `next/server` - Utilidades de Next.js
- `next-auth` - Sistema de autenticación

## Base de Datos

### Tabla Principal

```sql
CREATE TABLE "Court" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "basePrice" INTEGER NOT NULL,
  "priceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);
```

### Índices Recomendados

```sql
-- Índice para consultas de canchas activas
CREATE INDEX idx_court_active ON "Court"("isActive") WHERE "isActive" = true;

-- Índice único para nombres de cancha
CREATE UNIQUE INDEX idx_court_name_unique ON "Court"("name") WHERE "isActive" = true;

-- Índice para ordenamiento por nombre
CREATE INDEX idx_court_name ON "Court"("name");
```

### Consultas Ejecutadas

#### GET - Obtener Canchas
```sql
SELECT * FROM "Court" 
WHERE "isActive" = true 
ORDER BY "name" ASC;
```

#### POST - Crear Cancha
```sql
-- Verificar unicidad
SELECT COUNT(*) FROM "Court" 
WHERE "name" = $1 AND "isActive" = true;

-- Insertar nueva cancha
INSERT INTO "Court" (
  "id", "name", "description", "basePrice", 
  "priceMultiplier", "isActive", "createdAt", "updatedAt"
) VALUES (
  $1, $2, $3, $4, $5, true, NOW(), NOW()
) RETURNING *;
```

## Performance

### Optimizaciones

1. **Índices Eficientes**: Índices en campos de filtrado y ordenamiento
2. **Consultas Simples**: Sin JOINs complejos
3. **Filtrado en BD**: Filtro de canchas activas en la consulta
4. **Caché Potencial**: Los datos de canchas cambian poco, ideales para caché

### Métricas de Performance

- **GET**: < 20ms para consultas con índices
- **POST**: < 50ms incluyendo validaciones
- **Consultas de BD**: 1-2 consultas por operación
- **Memoria**: Mínima, datos estructurados simples

## Testing

### Tests Unitarios - GET

```typescript
describe('GET /api/courts', () => {
  it('should return all active courts', async () => {
    const mockCourts = [
      { id: '1', name: 'Cancha 1', isActive: true },
      { id: '2', name: 'Cancha 2', isActive: true }
    ]
    
    jest.mocked(getAllCourts).mockResolvedValue(mockCourts)
    
    const response = await GET(new Request('http://localhost/api/courts'))
    
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.courts).toEqual(mockCourts)
    expect(result.total).toBe(2)
  })
  
  it('should handle empty courts list', async () => {
    jest.mocked(getAllCourts).mockResolvedValue([])
    
    const response = await GET(new Request('http://localhost/api/courts'))
    
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.courts).toEqual([])
    expect(result.total).toBe(0)
  })
})
```

### Tests Unitarios - POST

```typescript
describe('POST /api/courts', () => {
  it('should create court successfully for admin', async () => {
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN' }
    }
    const mockCourt = {
      id: 'court-123',
      name: 'Nueva Cancha',
      basePrice: 6000
    }
    
    jest.mocked(getServerSession).mockResolvedValue(mockSession)
    jest.mocked(createCourt).mockResolvedValue(mockCourt)
    
    const response = await POST(
      new Request('http://localhost/api/courts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Nueva Cancha',
          basePrice: 6000
        })
      })
    )
    
    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result.court).toEqual(mockCourt)
  })
  
  it('should reject non-admin users', async () => {
    const mockSession = {
      user: { id: 'user-1', role: 'USER' }
    }
    
    jest.mocked(getServerSession).mockResolvedValue(mockSession)
    
    const response = await POST(
      new Request('http://localhost/api/courts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      })
    )
    
    expect(response.status).toBe(403)
  })
})
```

### Tests de Integración

```typescript
describe('Courts API Integration', () => {
  it('should create and retrieve court', async () => {
    const admin = await createTestUser({ role: 'ADMIN' })
    const courtData = {
      name: 'Cancha Test',
      description: 'Cancha de prueba',
      basePrice: 5000,
      priceMultiplier: 1.1
    }
    
    // Crear cancha
    const createResponse = await fetch('/api/courts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': await getSessionCookie(admin)
      },
      body: JSON.stringify(courtData)
    })
    
    expect(createResponse.status).toBe(201)
    const createResult = await createResponse.json()
    
    // Verificar en lista
    const listResponse = await fetch('/api/courts')
    expect(listResponse.status).toBe(200)
    
    const listResult = await listResponse.json()
    const createdCourt = listResult.courts.find(
      (c: any) => c.id === createResult.court.id
    )
    
    expect(createdCourt).toBeDefined()
    expect(createdCourt.name).toBe(courtData.name)
  })
})
```

## Monitoreo y Logging

### Eventos Registrados

```typescript
// GET - Consulta de canchas
console.log('GET /api/courts - Consultando canchas activas')

// POST - Creación de cancha
console.log(`POST /api/courts - Creando cancha: ${courtData.name} por usuario: ${session.user.id}`)

// Errores
console.error('Courts API error:', error)
```

### Métricas Sugeridas

- Número de consultas de canchas por día
- Canchas más consultadas
- Tiempo promedio de respuesta
- Tasa de creación de nuevas canchas
- Errores de validación más comunes

## Problemas Conocidos

1. **Sin Paginación**: La lista completa se retorna siempre
2. **Sin Filtros**: No se pueden filtrar canchas por criterios específicos
3. **Sin Caché**: Consultas repetidas no se optimizan
4. **Validación Limitada**: Validaciones básicas en el servidor
5. **Sin Soft Delete**: Las canchas se marcan como inactivas pero no se eliminan
6. **Sin Versionado**: No hay control de versiones de los datos

## Mejoras Futuras

### Funcionalidades

1. **Paginación**: Implementar paginación para listas grandes
2. **Filtros Avanzados**: Filtrar por precio, disponibilidad, características
3. **Búsqueda**: Búsqueda por nombre y descripción
4. **Ordenamiento**: Múltiples criterios de ordenamiento
5. **Imágenes**: Soporte para imágenes de canchas
6. **Características**: Sistema de características/amenities
7. **Disponibilidad**: Integración con sistema de horarios

### Performance

1. **Caché**: Implementar caché con invalidación inteligente
2. **CDN**: Caché de respuestas en CDN
3. **Compresión**: Compresión de respuestas JSON
4. **Lazy Loading**: Carga diferida de datos no críticos

### Administración

1. **Soft Delete**: Eliminación lógica con recuperación
2. **Audit Trail**: Registro de cambios
3. **Bulk Operations**: Operaciones en lote
4. **Import/Export**: Importación y exportación de datos
5. **Validaciones Avanzadas**: Validaciones de negocio más complejas

### API

1. **Versionado**: Sistema de versionado de API
2. **Rate Limiting**: Límites de velocidad
3. **Documentación**: Documentación interactiva (Swagger)
4. **Webhooks**: Notificaciones de cambios

---

**Última actualización**: 2024-01-15  
**Versión**: 1.0  
**Runtime**: Node.js