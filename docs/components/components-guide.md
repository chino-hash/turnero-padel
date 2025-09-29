# Guía de Componentes Principales

> **Última actualización**: 2024-12-28  
> **Versión**: 2.0  
> **Estado**: ✅ Completo

## Índice

1. [Introducción](#introducción)
2. [Arquitectura de Componentes](#arquitectura-de-componentes)
3. [Componentes Principales](#componentes-principales)
4. [Hooks Personalizados](#hooks-personalizados)
5. [Providers y Contexto](#providers-y-contexto)
6. [Componentes UI](#componentes-ui)
7. [Patrones de Uso](#patrones-de-uso)
8. [Mejores Prácticas](#mejores-prácticas)

## Introducción

Esta guía documenta los componentes principales del sistema de reservas de pádel, su estructura, funcionalidad y patrones de uso. El proyecto utiliza React 18 con Next.js 15 y TypeScript para crear una aplicación moderna y escalable.

## Arquitectura de Componentes

### Estructura de Directorios

```
components/
├── auth/                    # Componentes de autenticación
│   ├── AuthStatus.tsx      # Estado de autenticación
│   ├── GoogleLoginForm.tsx # Formulario de login con Google
│   ├── ImprovedLoginForm.tsx # Formulario mejorado
│   ├── LoginForm.tsx       # Formulario básico
│   └── ProtectedRoute.tsx  # Protección de rutas
├── providers/              # Providers de contexto
│   ├── AppStateProvider.tsx # Estado global de la app
│   ├── ClientAppStateProvider.tsx # Provider del cliente
│   ├── ClientSessionProvider.tsx # Sesión del cliente
│   ├── ClientToaster.tsx   # Notificaciones
│   └── SessionProvider.tsx # Provider de sesión
├── ui/                     # Componentes UI base (shadcn/ui)
│   ├── button.tsx         # Botones
│   ├── card.tsx           # Tarjetas
│   ├── dialog.tsx         # Diálogos
│   ├── form.tsx           # Formularios
│   └── ...                # Otros componentes UI
├── admin/                  # Componentes de administración
│   └── RealTimeDemo.tsx   # Demo en tiempo real
├── test/                   # Componentes de testing
│   └── SlotsTest.tsx      # Test de slots
├── TurneroApp.tsx         # Aplicación principal
├── AdminTurnos.tsx        # Panel de administración
├── MisTurnos.tsx          # Mis reservas
├── CalendarModal.tsx      # Modal de calendario
├── HomeSection.tsx        # Sección de inicio
├── SlotModal.tsx          # Modal de slots
└── UserBookingsList.tsx   # Lista de reservas
```

## Componentes Principales

### 1. TurneroApp

**Ubicación**: `components/TurneroApp.tsx`  
**Propósito**: Componente principal de la aplicación que maneja la lógica central.

```typescript
interface TurneroAppProps {
  // Sin props específicas, usa contexto global
}
```

**Características**:
- ⚠️ **Archivo protegido** - Requiere autorización para modificaciones
- Maneja el estado de autenticación
- Carga datos de canchas y reservas
- Integra con hooks personalizados

**Uso**:
```tsx
import TurneroApp from '@/components/TurneroApp'

export default function DashboardPage() {
  return <TurneroApp />
}
```

### 2. AdminTurnos

**Ubicación**: `components/AdminTurnos.tsx`  
**Propósito**: Panel de administración para gestión de reservas.

```typescript
interface AdminTurnosProps {
  className?: string
  isDarkMode?: boolean
}

interface Booking {
  id: string
  courtName: string
  date: string
  timeRange: string
  userName: string
  userEmail: string
  status: 'confirmado' | 'pendiente' | 'cancelado' | 'completado'
  paymentStatus: 'pagado' | 'pendiente' | 'parcial'
  totalPrice: number
  createdAt: string
  players: {
    player1: string
    player2?: string
    player3?: string
    player4?: string
  }
  individualPayments: {
    player1: 'pagado' | 'pendiente'
    player2: 'pagado' | 'pendiente'
    player3: 'pagado' | 'pendiente'
    player4: 'pagado' | 'pendiente'
  }
  extras: Extra[]
}
```

**Características**:
- Vista de calendario y lista
- Filtros avanzados de búsqueda
- Gestión de pagos individuales
- Manejo de extras (raquetas, pelotas, etc.)
- Estadísticas en tiempo real

### 3. MisTurnos

**Ubicación**: `components/MisTurnos.tsx`  
**Propósito**: Vista de reservas del usuario autenticado.

```typescript
interface MisTurnosProps {
  isVisible: boolean
  isDarkMode: boolean
  currentBookings: Booking[]
  pastBookings: Booking[]
  isLoading?: boolean
  onBack: () => void
  onStartBooking?: () => void
  onOpenCancelModal: (booking: Booking) => void
  getCurrentBookingStatus: (booking: Booking) => 'active' | 'completed' | 'upcoming'
  getRemainingTime: (booking: Booking) => string
  formatDate: (date: string) => string
  getPaymentStatusColor: (status: string, isDarkMode?: boolean) => string
  getStatusColor: (status: string, type: string, isDarkMode?: boolean) => string
}
```

**Características**:
- ⚠️ **Archivo protegido** - Crítico para usuarios finales
- Separación entre reservas actuales y pasadas
- Estados de reserva en tiempo real
- Gestión de cancelaciones
- Información de pagos y jugadores

### 4. CalendarModal

**Ubicación**: `components/CalendarModal.tsx`  
**Propósito**: Modal interactivo para selección de fechas y visualización de eventos.

```typescript
interface CalendarModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  events?: CalendarEvent[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
}

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  court: string
  status: 'confirmado' | 'pendiente' | 'cancelado' | 'completado'
  players: number
  price: number
}
```

**Características**:
- Navegación por meses
- Visualización de eventos por día
- Accesibilidad mejorada
- Integración con Radix UI

## Hooks Personalizados

### 1. useAuth

**Ubicación**: `hooks/useAuth.ts`  
**Propósito**: Manejo centralizado de autenticación.

```typescript
function useAuth(): {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  profile: Profile | null
}
```

**Características**:
- Integración con NextAuth.js
- Manejo de roles (admin/usuario)
- Estados de carga optimizados
- Funciones de login/logout

**Uso**:
```tsx
const { user, isAuthenticated, isAdmin, signOut } = useAuth()

if (!isAuthenticated) {
  return <LoginForm />
}

return (
  <div>
    <p>Bienvenido, {user?.name}</p>
    {isAdmin && <AdminPanel />}
    <Button onClick={signOut}>Cerrar Sesión</Button>
  </div>
)
```

### 2. useSlots

**Ubicación**: `hooks/useSlots.ts`  
**Propósito**: Gestión de slots de tiempo y disponibilidad.

```typescript
interface Slot {
  id: string
  startTime: string
  endTime: string
  timeRange: string
  isAvailable: boolean
  price: number
  courtId: string
  date: string
}

interface SlotsSummary {
  total: number
  open: number
  rate: number
  date: string
  courtName: string
}
```

**Características**:
- Carga optimizada de slots
- Cache inteligente
- Actualización en tiempo real
- Múltiples canchas simultáneas

### 3. useAppState

**Ubicación**: `components/providers/AppStateProvider.tsx`  
**Propósito**: Estado global de la aplicación.

```typescript
interface AppStateContextType {
  // Estado de navegación
  activeNavItem: string
  setActiveNavItem: (item: string) => void
  
  // Estado de modo oscuro
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
  
  // Estado de canchas
  courts: Court[]
  selectedCourt: string
  setSelectedCourt: (courtId: string) => void
  
  // Estado de fechas
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  
  // Estado de slots
  timeSlots: TimeSlot[]
  loading: boolean
  refreshSlots: () => Promise<void>
}
```

## Providers y Contexto

### AppStateProvider

**Propósito**: Proveedor principal del estado global de la aplicación.

**Características**:
- Estado centralizado
- Optimización con useMemo y useCallback
- Integración con múltiples hooks
- Actualizaciones en tiempo real

**Uso**:
```tsx
import { AppStateProvider, useAppState } from '@/components/providers/AppStateProvider'

// En el layout principal
function Layout({ children }) {
  return (
    <AppStateProvider>
      {children}
    </AppStateProvider>
  )
}

// En componentes hijos
function BookingComponent() {
  const { selectedCourt, timeSlots, loading } = useAppState()
  
  return (
    <div>
      {loading ? <Skeleton /> : <SlotGrid slots={timeSlots} />}
    </div>
  )
}
```

### SessionProvider

**Propósito**: Manejo de sesiones de NextAuth.js en el cliente.

```tsx
import { SessionProvider } from '@/components/providers/SessionProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

## Componentes UI

### Componentes Base (shadcn/ui)

El proyecto utiliza **shadcn/ui** como sistema de componentes base:

```typescript
// Componentes disponibles
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
```

**Características**:
- Totalmente personalizables
- Accesibilidad integrada
- Soporte para modo oscuro
- TypeScript nativo

## Patrones de Uso

### 1. Patrón de Componente Protegido

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

### 2. Patrón de Estado Compartido

```tsx
// Provider en el nivel superior
<AppStateProvider>
  <BookingFlow />
</AppStateProvider>

// Consumo en componentes hijos
function BookingStep() {
  const { selectedCourt, setSelectedCourt } = useAppState()
  
  return (
    <CourtSelector 
      value={selectedCourt}
      onChange={setSelectedCourt}
    />
  )
}
```

### 3. Patrón de Carga Optimizada

```tsx
function BookingList() {
  const { bookings, loading, error, refetch } = useBookings()
  
  if (loading) return <BookingSkeleton />
  if (error) return <ErrorMessage error={error} onRetry={refetch} />
  
  return (
    <div>
      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
```

## Mejores Prácticas

### 1. Estructura de Componentes

```tsx
// ✅ Buena estructura
interface ComponentProps {
  // Props tipadas
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks al inicio
  const { data, loading } = useCustomHook()
  
  // Estados locales
  const [localState, setLocalState] = useState()
  
  // Efectos
  useEffect(() => {
    // Lógica de efectos
  }, [dependencies])
  
  // Funciones de manejo
  const handleAction = useCallback(() => {
    // Lógica de manejo
  }, [dependencies])
  
  // Renderizado condicional temprano
  if (loading) return <Skeleton />
  
  // JSX principal
  return (
    <div>
      {/* Contenido */}
    </div>
  )
}
```

### 2. Manejo de Estados

```tsx
// ✅ Estado optimizado
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data)
}, [data])

const memoizedCallback = useCallback((param) => {
  return handleAction(param)
}, [dependency])
```

### 3. Tipado TypeScript

```tsx
// ✅ Interfaces bien definidas
interface BookingFormData {
  courtId: string
  date: Date
  timeSlot: string
  players: Player[]
}

interface BookingFormProps {
  initialData?: Partial<BookingFormData>
  onSubmit: (data: BookingFormData) => Promise<void>
  onCancel: () => void
}
```

### 4. Manejo de Errores

```tsx
// ✅ Manejo robusto de errores
function BookingForm() {
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async (data: BookingFormData) => {
    try {
      setError(null)
      await submitBooking(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorAlert message={error} />}
      {/* Formulario */}
    </form>
  )
}
```

### 5. Accesibilidad

```tsx
// ✅ Componentes accesibles
<Button
  aria-label="Reservar cancha"
  aria-describedby="booking-help"
  disabled={loading}
>
  {loading ? 'Reservando...' : 'Reservar'}
</Button>

<div id="booking-help" className="sr-only">
  Haz clic para confirmar tu reserva
</div>
```

## Conclusión

Esta guía proporciona una visión completa de los componentes principales del sistema. Para implementaciones específicas, consulta los archivos individuales y la documentación de la API.

**Recursos adicionales**:
- [Arquitectura del Sistema](../architecture/system-architecture.md)
- [Guía de Desarrollo](../guides/development.md)
- [Referencia de API](../api/api-reference.md)
- [Documentación de shadcn/ui](https://ui.shadcn.com/)