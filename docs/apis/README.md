# Documentación de APIs - Turnero de Pádel

## Índice de APIs

Este directorio contiene la documentación completa de todas las APIs del sistema de turnero de pádel.

### Endpoints Disponibles

| Endpoint | Método | Descripción | Documentación |
|----------|--------|-------------|---------------|
| `/api/auth/[...nextauth]` | GET, POST | Autenticación con NextAuth.js | [Auth API](./auth.md) |
| `/api/bookings` | GET, POST | Gestión de reservas | [Bookings API](./bookings.md) |
| `/api/bookings/user` | GET | Reservas del usuario actual | [User Bookings API](./user-bookings.md) |
| `/api/bookings/[id]` | GET | Obtener reserva específica | [Booking Details API](./booking-details.md) |
| `/api/courts` | GET, POST | Gestión de canchas | [Courts API](./courts.md) |
| `/api/slots` | GET | Disponibilidad de horarios | [Slots API](./slots.md) |

### Estructura de Respuestas

Todas las APIs siguen un formato estándar de respuesta:

#### Respuesta Exitosa
```json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa"
}
```

#### Respuesta de Error
```json
{
  "success": false,
  "error": "Mensaje de error",
  "code": "ERROR_CODE"
}
```

### Códigos de Estado HTTP

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | Usuario no autenticado |
| 403 | Forbidden | Usuario sin permisos |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: horario no disponible) |
| 500 | Internal Server Error | Error interno del servidor |

### Autenticación

La mayoría de los endpoints requieren autenticación mediante NextAuth.js. Los usuarios deben estar autenticados para acceder a las APIs.

#### Roles de Usuario
- **USER**: Usuario estándar con permisos básicos
- **ADMIN**: Administrador con permisos completos

### Tipos de Datos Comunes

#### Booking (Reserva)
```typescript
interface Booking {
  id: string
  courtId: string
  userId: string
  bookingDate: Date
  startTime: string // HH:MM format
  endTime: string   // HH:MM format
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED'
  totalPrice: number
  depositAmount: number
  createdAt: Date
  updatedAt: Date
  court: Court
  user: User
  players: BookingPlayer[]
}
```

#### Court (Cancha)
```typescript
interface Court {
  id: string
  name: string
  description?: string
  basePrice: number
  priceMultiplier: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### User (Usuario)
```typescript
interface User {
  id: string
  name?: string
  email: string
  image?: string
  role: 'USER' | 'ADMIN'
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### BookingPlayer (Jugador de Reserva)
```typescript
interface BookingPlayer {
  id: string
  bookingId: string
  position: number // 1-4
  playerName: string
  createdAt: Date
  updatedAt: Date
}
```

### Convenciones

1. **Fechas**: Se usan en formato ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
2. **Horarios**: Se usan en formato HH:MM (24 horas)
3. **IDs**: Strings únicos generados por la base de datos
4. **Precios**: Números enteros en centavos (ej: 6000 = $60.00)

### Manejo de Errores

Todos los endpoints manejan errores de manera consistente:

- **Validación**: Errores 400 con detalles específicos
- **Autenticación**: Errores 401 cuando no hay sesión
- **Autorización**: Errores 403 cuando no hay permisos
- **Recursos**: Errores 404 cuando no se encuentra el recurso
- **Conflictos**: Errores 409 para conflictos de negocio
- **Servidor**: Errores 500 para errores internos

### Testing

Cada API debe incluir:
- Tests unitarios para la lógica de negocio
- Tests de integración para los endpoints
- Tests de validación de esquemas
- Tests de autorización y autenticación

### Versionado

Actualmente todas las APIs están en la versión 1.0. Futuras versiones seguirán el patrón `/api/v2/endpoint`.

---

**Última actualización**: 2024-01-15  
**Versión**: 1.0  
**Mantenido por**: Equipo de Desarrollo