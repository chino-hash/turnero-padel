# Referencia Completa de APIs - Turnero de Pádel

## Información General

Esta documentación describe todos los endpoints disponibles en la API del sistema de turnero de pádel, construida con Next.js 15 API Routes.

**Base URL**: `http://localhost:3000/api` (desarrollo) | `https://tu-dominio.com/api` (producción)

## Índice de Endpoints

### 🔐 Autenticación
- [`/api/auth/[...nextauth]`](#autenticación) - Gestión completa de autenticación con NextAuth.js

### 👥 Administración
- [`/api/admin`](#admin-general) - Operaciones administrativas generales
- [`/api/admin/test-event`](#admin-test-event) - Eventos de prueba para administradores

### 📅 Reservas (Bookings)
- [`/api/bookings`](#bookings) - CRUD de reservas
- [`/api/bookings/[id]`](#booking-by-id) - Operaciones sobre reserva específica
- [`/api/bookings/availability`](#booking-availability) - Consulta de disponibilidad
- [`/api/bookings/bulk`](#booking-bulk) - Operaciones masivas de reservas
- [`/api/bookings/stats`](#booking-stats) - Estadísticas de reservas
- [`/api/bookings/user`](#booking-user) - Reservas del usuario actual

### 🏟️ Canchas (Courts)
- [`/api/courts`](#courts) - Gestión de canchas
- [`/api/courts/events`](#court-events) - Eventos de canchas

### 🔧 CRUD Genérico
- [`/api/crud/[...params]`](#crud-generic) - Operaciones CRUD genéricas
- [`/api/crud/stats`](#crud-stats) - Estadísticas generales
- [`/api/crud/transaction`](#crud-transaction) - Transacciones de base de datos

### ⏰ Horarios (Slots)
- [`/api/slots`](#slots) - Gestión de horarios disponibles

### 📊 Estadísticas y Eventos
- [`/api/estadisticas`](#estadisticas) - Estadísticas del sistema
- [`/api/events`](#events) - Gestión de eventos
- [`/api/productos`](#productos) - Gestión de productos

### 🛠️ Utilidades
- [`/api/debug-env`](#debug-env) - Debug de variables de entorno

---

## Endpoints Detallados

### 🔐 Autenticación

#### `/api/auth/[...nextauth]`

**Descripción**: Endpoint dinámico que maneja todas las operaciones de autenticación mediante NextAuth.js.

**Métodos**: `GET`, `POST`

**Rutas automáticas**:
- `GET /api/auth/signin` - Página de inicio de sesión
- `GET /api/auth/signin/google` - Inicio de sesión con Google
- `GET /api/auth/signout` - Cierre de sesión
- `GET /api/auth/session` - Obtener sesión actual
- `GET /api/auth/providers` - Proveedores disponibles
- `GET /api/auth/csrf` - Token CSRF

**Autenticación**: No requerida (maneja la autenticación)

**Ejemplo de uso**:
```typescript
// Obtener sesión actual
const session = await fetch('/api/auth/session').then(res => res.json());

// Iniciar sesión con Google
window.location.href = '/api/auth/signin/google';
```

---

### 👥 Administración

#### `/api/admin`

**Descripción**: Operaciones administrativas generales del sistema.

**Métodos**: `GET`, `POST`, `PUT`, `DELETE`

**Autenticación**: ✅ Requerida (Solo administradores)

**Permisos**: `ADMIN`

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "adminInfo": "Información administrativa",
    "permissions": ["read", "write", "delete"]
  }
}
```

#### `/api/admin/test-event`

**Descripción**: Endpoint para generar eventos de prueba en el sistema administrativo.

**Métodos**: `POST`

**Autenticación**: ✅ Requerida (Solo administradores)

---

### 📅 Reservas (Bookings)

#### `/api/bookings`

**Descripción**: Gestión completa de reservas de canchas.

**Métodos**: `GET`, `POST`

**Autenticación**: ✅ Requerida

##### GET - Listar reservas

**Query Parameters**:
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | `number` | ❌ | `1` | Número de página |
| `limit` | `number` | ❌ | `10` | Elementos por página |
| `status` | `string` | ❌ | - | Filtrar por estado |
| `userId` | `string` | ❌ | - | Filtrar por usuario (solo admins) |

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking-123",
        "courtId": "court-456",
        "userId": "user-789",
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-15T11:30:00Z",
        "status": "confirmed",
        "totalAmount": 5000,
        "court": {
          "name": "Cancha 1",
          "location": "Sector A"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

##### POST - Crear reserva

**Request Body**:
```json
{
  "courtId": "court-456",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:30:00Z",
  "players": [
    {
      "name": "Juan Pérez",
      "email": "juan@email.com"
    }
  ]
}
```

#### `/api/bookings/[id]`

**Descripción**: Operaciones sobre una reserva específica.

**Métodos**: `GET`, `PUT`, `DELETE`

**Autenticación**: ✅ Requerida

**Path Parameters**:
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `string` | ID único de la reserva |

#### `/api/bookings/availability`

**Descripción**: Consulta de disponibilidad de canchas para fechas específicas.

**Métodos**: `GET`

**Autenticación**: ❌ No requerida

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | `string` | ✅ | Fecha en formato YYYY-MM-DD |
| `courtId` | `string` | ❌ | ID de cancha específica |

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "availableSlots": [
      {
        "startTime": "08:00",
        "endTime": "09:30",
        "courtId": "court-1",
        "price": 5000,
        "available": true
      }
    ]
  }
}
```

#### `/api/bookings/bulk`

**Descripción**: Operaciones masivas sobre múltiples reservas.

**Métodos**: `POST`, `PUT`, `DELETE`

**Autenticación**: ✅ Requerida (Solo administradores)

#### `/api/bookings/stats`

**Descripción**: Estadísticas detalladas de reservas.

**Métodos**: `GET`

**Autenticación**: ✅ Requerida

#### `/api/bookings/user`

**Descripción**: Reservas del usuario autenticado actual.

**Métodos**: `GET`

**Autenticación**: ✅ Requerida

---

### 🏟️ Canchas (Courts)

#### `/api/courts`

**Descripción**: Gestión completa de canchas de pádel.

**Métodos**: `GET`, `POST`, `PUT`, `DELETE`

**Autenticación**: 
- `GET`: ❌ No requerida
- `POST`, `PUT`, `DELETE`: ✅ Requerida (Solo administradores)

##### GET - Listar canchas

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "court-1",
      "name": "Cancha 1",
      "location": "Sector A",
      "type": "indoor",
      "pricePerHour": 5000,
      "amenities": ["lighting", "sound", "air_conditioning"],
      "isActive": true,
      "images": [
        "/images/courts/court-1-1.jpg"
      ]
    }
  ]
}
```

##### POST - Crear cancha

**Request Body**:
```json
{
  "name": "Cancha Nueva",
  "location": "Sector B",
  "type": "outdoor",
  "pricePerHour": 4500,
  "amenities": ["lighting"],
  "description": "Cancha al aire libre con iluminación LED"
}
```

#### `/api/courts/events`

**Descripción**: Eventos relacionados con canchas (mantenimiento, torneos, etc.).

**Métodos**: `GET`, `POST`

**Autenticación**: ✅ Requerida

---

### ⏰ Horarios (Slots)

#### `/api/slots`

**Descripción**: Gestión de horarios disponibles y generación automática de slots.

**Métodos**: `GET`, `POST`

**Autenticación**: 
- `GET`: ❌ No requerida
- `POST`: ✅ Requerida (Solo administradores)

**Query Parameters para GET**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `date` | `string` | ❌ | Fecha específica (YYYY-MM-DD) |
| `courtId` | `string` | ❌ | ID de cancha específica |
| `available` | `boolean` | ❌ | Solo slots disponibles |

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "slot-123",
      "courtId": "court-1",
      "startTime": "2024-01-15T08:00:00Z",
      "endTime": "2024-01-15T09:30:00Z",
      "price": 5000,
      "isAvailable": true,
      "court": {
        "name": "Cancha 1",
        "type": "indoor"
      }
    }
  ]
}
```

---

### 🔧 CRUD Genérico

#### `/api/crud/[...params]`

**Descripción**: Sistema CRUD genérico para operaciones de base de datos.

**Métodos**: `GET`, `POST`, `PUT`, `DELETE`

**Autenticación**: ✅ Requerida (Solo administradores)

**Path Parameters**:
- Parámetros dinámicos que definen la tabla y operación

#### `/api/crud/stats`

**Descripción**: Estadísticas generales del sistema.

**Métodos**: `GET`

**Autenticación**: ✅ Requerida

#### `/api/crud/transaction`

**Descripción**: Manejo de transacciones de base de datos.

**Métodos**: `POST`

**Autenticación**: ✅ Requerida (Solo administradores)

---

### 📊 Estadísticas y Eventos

#### `/api/estadisticas`

**Descripción**: Estadísticas generales del sistema de turnero.

**Métodos**: `GET`

**Autenticación**: ✅ Requerida

#### `/api/events`

**Descripción**: Gestión de eventos del sistema.

**Métodos**: `GET`, `POST`, `PUT`, `DELETE`

**Autenticación**: ✅ Requerida

#### `/api/productos`

**Descripción**: Gestión de productos adicionales (equipamiento, bebidas, etc.).

**Métodos**: `GET`, `POST`, `PUT`, `DELETE`

**Autenticación**: 
- `GET`: ❌ No requerida
- Otros: ✅ Requerida (Solo administradores)

---

### 🛠️ Utilidades

#### `/api/debug-env`

**Descripción**: Endpoint para debug de variables de entorno (solo desarrollo).

**Métodos**: `GET`

**Autenticación**: ✅ Requerida (Solo administradores)

**Nota**: Solo disponible en modo desarrollo.

---

## Códigos de Estado HTTP

| Código | Descripción | Uso Común |
|--------|-------------|-----------|
| `200` | OK | Operación exitosa |
| `201` | Created | Recurso creado |
| `400` | Bad Request | Datos inválidos |
| `401` | Unauthorized | No autenticado |
| `403` | Forbidden | Sin permisos |
| `404` | Not Found | Recurso no encontrado |
| `405` | Method Not Allowed | Método HTTP no permitido |
| `422` | Unprocessable Entity | Error de validación |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Error del servidor |

## Formato de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {},
  "message": "Operación completada exitosamente",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "details": {
    "field": "Campo específico con error",
    "message": "Mensaje detallado"
  }
}
```

## Autenticación y Autorización

### Headers Requeridos

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Roles de Usuario

- **USER**: Usuario estándar con acceso a reservas propias
- **ADMIN**: Administrador con acceso completo al sistema

### Obtener Token de Autenticación

```typescript
import { getSession } from 'next-auth/react';

const session = await getSession();
const token = session?.accessToken;
```

## Rate Limiting

- **Usuarios autenticados**: 100 requests/minuto
- **Usuarios no autenticados**: 20 requests/minuto
- **Endpoints de autenticación**: 10 requests/minuto

## Ejemplos de Uso

### JavaScript/TypeScript

```typescript
// Función helper para llamadas a la API
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Error en la API');
  }
  
  return data;
}

// Ejemplo: Obtener canchas disponibles
const courts = await apiCall('/courts');

// Ejemplo: Crear una reserva
const booking = await apiCall('/bookings', {
  method: 'POST',
  body: JSON.stringify({
    courtId: 'court-1',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T11:30:00Z',
  }),
});
```

### React Hook Personalizado

```typescript
import { useState, useEffect } from 'react';

function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await apiCall(endpoint);
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Uso del hook
function CourtsList() {
  const { data: courts, loading, error } = useApi<Court[]>('/courts');

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {courts?.map(court => (
        <div key={court.id}>{court.name}</div>
      ))}
    </div>
  );
}
```

---

**Última actualización**: 2024-12-28  
**Versión**: 2.0  
**Mantenido por**: Equipo de Desarrollo

Para más información, consulta:
- [Guía de Desarrollo](../guides/development.md)
- [Arquitectura del Sistema](../architecture/system-architecture.md)
- [Testing de APIs](../guides/testing.md)