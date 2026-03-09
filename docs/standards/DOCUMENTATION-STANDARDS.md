# Estándares de Documentación - Turnero de Padel

## Objetivo
Este documento establece los estándares y convenciones para la documentación del código en el proyecto Turnero de Padel.

## 📝 Estándares JSDoc

### Componentes React

```typescript
/**
 * Componente para mostrar información de una cancha de padel
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Court} props.court - Datos de la cancha
 * @param {boolean} props.isSelected - Si la cancha está seleccionada
 * @param {Function} props.onSelect - Callback cuando se selecciona la cancha
 * @returns {JSX.Element} Elemento JSX del componente
 * 
 * @example
 * ```tsx
 * <CourtCard 
 *   court={courtData} 
 *   isSelected={false}
 *   onSelect={(court) => console.log('Selected:', court)}
 * />
 * ```
 */
export function CourtCard({ court, isSelected, onSelect }: CourtCardProps) {
  // Implementación
}
```

### Funciones y Métodos

```typescript
/**
 * Valida los datos de una reserva antes de crearla
 * 
 * @param {BookingData} bookingData - Datos de la reserva a validar
 * @param {User} user - Usuario que realiza la reserva
 * @returns {Promise<ValidationResult>} Resultado de la validación
 * @throws {ValidationError} Cuando los datos son inválidos
 * 
 * @example
 * ```typescript
 * const result = await validateBooking(bookingData, currentUser);
 * if (result.isValid) {
 *   // Proceder con la reserva
 * }
 * ```
 */
async function validateBooking(bookingData: BookingData, user: User): Promise<ValidationResult> {
  // Implementación
}
```

### Hooks Personalizados

```typescript
/**
 * Hook personalizado para manejar la autenticación del usuario
 * 
 * @hook
 * @returns {Object} Objeto con estado y métodos de autenticación
 * @returns {User | null} returns.user - Usuario autenticado o null
 * @returns {boolean} returns.isLoading - Estado de carga
 * @returns {Function} returns.login - Función para iniciar sesión
 * @returns {Function} returns.logout - Función para cerrar sesión
 * 
 * @example
 * ```typescript
 * const { user, isLoading, login, logout } = useAuth();
 * 
 * if (isLoading) return <Loading />;
 * if (!user) return <LoginForm onLogin={login} />;
 * ```
 */
export function useAuth() {
  // Implementación
}
```

### APIs y Endpoints

```typescript
/**
 * API endpoint para crear una nueva reserva
 * 
 * @route POST /api/bookings
 * @param {NextRequest} request - Request object de Next.js
 * @returns {Promise<NextResponse>} Response con la reserva creada o error
 * 
 * @requestBody {BookingCreateData} Datos para crear la reserva
 * @response {201} {Booking} Reserva creada exitosamente
 * @response {400} {Error} Datos de entrada inválidos
 * @response {401} {Error} Usuario no autenticado
 * @response {409} {Error} Conflicto de horario
 * 
 * @example
 * ```typescript
 * // POST /api/bookings
 * {
 *   "courtId": "court-123",
 *   "startTime": "2024-01-15T10:00:00Z",
 *   "duration": 90,
 *   "players": ["user-1", "user-2"]
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  // Implementación
}
```

## 🏗️ Estándares de Arquitectura

### Servicios y Utilidades

```typescript
/**
 * Servicio para manejar operaciones de reservas
 * 
 * @class BookingService
 * @description Centraliza toda la lógica de negocio relacionada con reservas
 */
export class BookingService {
  /**
   * Crea una nueva reserva verificando disponibilidad
   * 
   * @method
   * @param {BookingCreateData} data - Datos de la reserva
   * @returns {Promise<Booking>} Reserva creada
   * @throws {ConflictError} Cuando hay conflicto de horario
   */
  async createBooking(data: BookingCreateData): Promise<Booking> {
    // Implementación
  }
}
```

### Tipos y Interfaces

```typescript
/**
 * Representa una cancha de padel en el sistema
 * 
 * @interface Court
 * @property {string} id - Identificador único de la cancha
 * @property {string} name - Nombre de la cancha
 * @property {string} description - Descripción de la cancha
 * @property {number} basePrice - Precio base por hora
 * @property {CourtFeatures} features - Características de la cancha
 * @property {boolean} isActive - Si la cancha está activa
 */
interface Court {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  features: CourtFeatures;
  isActive: boolean;
}
```

## 📋 Convenciones de Comentarios

### Comentarios en Línea

```typescript
// ✅ BUENO: Explica el "por qué", no el "qué"
const maxRetries = 3; // Reintentar hasta 3 veces para manejar fallos de red temporales

// ❌ MALO: Explica lo obvio
const maxRetries = 3; // Establece maxRetries a 3
```

### Comentarios de Sección

```typescript
// =============================================================================
// VALIDACIONES DE RESERVA
// =============================================================================

/**
 * Valida que el horario solicitado esté disponible
 */
function validateTimeSlot() {
  // Implementación
}

/**
 * Valida que el usuario tenga permisos para reservar
 */
function validateUserPermissions() {
  // Implementación
}

// =============================================================================
// PROCESAMIENTO DE PAGOS
// =============================================================================
```

### Comentarios TODO y FIXME

```typescript
// TODO: Implementar cache para mejorar rendimiento
// FIXME: Manejar caso edge cuando el usuario no tiene email
// HACK: Solución temporal hasta que se implemente la nueva API
// NOTE: Este comportamiento es requerido por el cliente
```

## 🎯 Estándares de Calidad

### Documentación Obligatoria

- ✅ Todos los componentes React exportados
- ✅ Todas las funciones públicas
- ✅ Todos los hooks personalizados
- ✅ Todos los endpoints de API
- ✅ Todas las interfaces y tipos principales
- ✅ Todas las clases y servicios

### Documentación Opcional

- Funciones internas simples
- Variables con nombres autodescriptivos
- Implementaciones estándar

### Elementos Requeridos en JSDoc

1. **Descripción**: Qué hace la función/componente
2. **Parámetros**: Todos los parámetros con tipos y descripciones
3. **Retorno**: Qué devuelve la función
4. **Ejemplo**: Al menos un ejemplo de uso
5. **Excepciones**: Errores que puede lanzar (si aplica)

## 🔧 Herramientas y Configuración

### Extensiones VSCode Recomendadas

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one"
  ]
}
```

### Configuración TypeScript para JSDoc

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false
  },
  "typedocOptions": {
    "entryPoints": ["./lib", "./components", "./hooks"],
    "out": "docs/api"
  }
}
```

## 📚 Recursos Adicionales

- [JSDoc Official Documentation](https://jsdoc.app/)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

**Nota**: Estos estándares deben ser seguidos por todos los desarrolladores del proyecto. La documentación debe mantenerse actualizada con cada cambio en el código.