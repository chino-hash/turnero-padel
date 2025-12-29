# Documentación Completa: Funcionalidad AdminTurnos

## Resumen General

Este documento detalla exhaustivamente la funcionalidad implementada en el componente `AdminTurnos.tsx`, incluyendo la gestión de pagos individuales, sistema de extras, filtrado automático de turnos y todas las mejoras de interfaz de usuario.

## 1. Estructura General del Componente

### 1.1 Ubicación del Archivo
- **Ruta**: `components/AdminTurnos.tsx`
- **Tipo**: Componente React funcional con TypeScript
- **Dependencias principales**: React, Lucide Icons, componentes UI personalizados

### 1.2 Interfaces de Datos

```typescript
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
    player1: string // titular
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
  extras?: Extra[]
}

interface Extra {
  id: string
  type: 'pelotas' | 'bebida' | 'paleta'
  name: string
  cost: number
  assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4'
}
```

## 2. Filtrado Automático de Turnos

### 2.1 Implementación
- **Ubicación**: Línea 207 en `useEffect` de filtrado
- **Código**: `filtered = filtered.filter(booking => booking.status !== 'pendiente')`

### 2.2 Comportamiento
- Los turnos con estado "pendiente" se excluyen automáticamente de todas las vistas
- El filtro se aplica antes de cualquier otro filtrado (búsqueda, fecha, estado)
- La opción "Pendiente" fue eliminada del selector de filtros

### 2.3 Selector de Estados
- **Ubicación**: Líneas 519-523
- **Opciones disponibles**:
  - "Todos los estados"
  - "Confirmado"
  - "Cancelado"
  - "Completado"

## 3. Sistema de Pagos Individuales

### 3.1 Función de Cálculo de Montos

**Ubicación**: Líneas 378-390

```typescript
const calculatePlayerAmount = (booking: Booking, playerKey: 'player1' | 'player2' | 'player3' | 'player4') => {
  // Monto base por jugador (dividido entre 4)
  const baseAmount = booking.totalPrice / 4
  
  // Calcular extras asignados a este jugador específico
  const playerExtras = booking.extras?.filter(extra => extra.assignedTo === playerKey) || []
  const playerExtrasCost = playerExtras.reduce((sum, extra) => sum + extra.cost, 0)
  
  // Calcular extras divididos entre todos
  const sharedExtras = booking.extras?.filter(extra => extra.assignedTo === 'all') || []
  const sharedExtrasCost = sharedExtras.reduce((sum, extra) => sum + (extra.cost / 4), 0)
  
  return baseAmount + playerExtrasCost + sharedExtrasCost
}
```

### 3.2 Función de Toggle de Pagos

**Ubicación**: Líneas 350-376

**Comportamiento**:
1. Alterna el estado de pago individual del jugador seleccionado
2. Recalcula automáticamente el estado general de la reserva:
   - `'pagado'`: Si todos los jugadores han pagado
   - `'parcial'`: Si al menos uno ha pagado pero no todos
   - `'pendiente'`: Si ninguno ha pagado

### 3.3 Visualización de Pagos Individuales

**Ubicación**: Líneas 685-700 (dentro del menú desplegable de cada reserva)

**Estructura visual**:
- **Columna izquierda**: Lista de 4 jugadores con nombres
- **Columna central**: Monto individual que debe pagar cada jugador
- **Columna derecha**: Botones de toggle para cambiar estado de pago

**Elementos por jugador**:
```html
<div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
  <div className="flex-1">
    <div className="font-medium text-gray-900">{playerName}</div>
    {index === 0 && <span className="text-xs text-blue-600 font-medium">(Titular)</span>}
  </div>
  <div className="flex items-center gap-3">
    <span className="text-sm font-bold text-blue-600">
      ${calculatePlayerAmount(booking, playerKey).toLocaleString()}
    </span>
    <span className={`text-xs font-medium ${statusColor}`}>
      {paymentStatus}
    </span>
  </div>
</div>
```

## 4. Sistema de Extras

### 4.1 Botón de Agregar Extras

**Ubicación**: Línea 764
**Posición**: Debajo de la información financiera en el menú desplegable

```html
<Button
  onClick={() => openExtrasModal(booking.id)}
  variant="outline"
  size="sm"
  className="w-full"
>
  <Plus className="w-4 h-4 mr-2" />
  Agregar Extra
</Button>
```

### 4.2 Modal de Extras

**Ubicación**: Líneas 930-1020
**Estructura**: Modal de dos pasos

#### Paso 1: Selección de Tipo de Extra
**Opciones disponibles**:
1. **Agregar Pelotas**
   - Precio base: $500
   - Descripción: "Precio base: $500"

2. **Agregar Bebida**
   - Precio base: $300
   - Descripción: "Precio base: $300"

3. **Alquilar Paleta**
   - Precio base: $1000
   - Descripción: "Precio base: $1000"

#### Paso 2: Configuración del Extra
**Elementos del formulario**:
1. **Campo de costo**: Input numérico no editable
2. **Selector de asignación**:
   - "Dividir entre todos (4 jugadores)"
   - "Asignar a Jugador 1 (Titular)"
   - "Asignar a Jugador 2"
   - "Asignar a Jugador 3"
   - "Asignar a Jugador 4"

**Botones de acción**:
- **Volver**: Regresa al paso 1
- **Agregar**: Confirma y agrega el extra (deshabilitado si costo ≤ 0)

### 4.3 Visualización de Extras Agregados

**Ubicación**: Líneas 770-800 (dentro del menú desplegable)

**Estructura por extra**:
```html
<div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
  <div className="flex-1">
    <div className="font-medium text-sm">{extra.name}</div>
    <div className="text-xs text-gray-600">
      Asignado a: {assignmentText}
    </div>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-sm font-bold text-green-600">
      ${extra.cost.toLocaleString()}
    </span>
    <button onClick={() => removeExtra(booking.id, extra.id)}>
      <X className="w-4 h-4 text-red-500" />
    </button>
  </div>
</div>
```

## 5. Información Financiera

### 5.1 Sección de Resumen Financiero

**Ubicación**: Líneas 730-760
**Posición**: Dentro del menú desplegable, después de la lista de jugadores

**Estructura**:
```html
<div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
  <!-- Total Recaudado -->
  <div className="text-center">
    <div className="text-sm text-gray-600 mb-1">Total Recaudado</div>
    <div className="text-lg font-bold text-green-600">
      ${montoRecaudado}
    </div>
  </div>
  
  <!-- Saldo Pendiente -->
  <div className="text-center">
    <div className="text-sm text-gray-600 mb-1">Saldo Pendiente</div>
    <div className="text-lg font-bold text-red-600">
      ${saldoPendiente}
    </div>
  </div>
  
  <!-- Total de la Reserva -->
  <div className="text-center">
    <div className="text-sm text-gray-600 mb-1">Total Reserva</div>
    <div className="text-lg font-bold text-blue-600">
      ${totalReserva}
    </div>
  </div>
</div>
```

## 6. Estadísticas Rápidas

### 6.1 Sección Optimizada

**Ubicación**: Líneas 873-930
**Cambios realizados**:
- Eliminada la tarjeta de "Turnos Pendientes"
- Grid cambiado de `lg:grid-cols-4` a `lg:grid-cols-3`

**Tarjetas restantes**:
1. **Total Turnos**: Muestra el conteo total de reservas filtradas
2. **Confirmados**: Muestra conteo y porcentaje de turnos confirmados
3. **Ingresos**: Muestra el total de ingresos de turnos pagados

## 7. Funciones de Estado y Utilidades

### 7.1 Funciones de Color de Estado

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmado': return 'bg-blue-100 text-blue-800'
    case 'pendiente': return 'bg-yellow-100 text-yellow-800'
    case 'cancelado': return 'bg-red-100 text-red-800'
    case 'completado': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'pagado': return 'bg-green-50 text-green-700 border-green-200'
    case 'pendiente': return 'bg-red-50 text-red-700 border-red-200'
    case 'parcial': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}
```

### 7.2 Estados del Componente

```typescript
const [bookings, setBookings] = useState<Booking[]>(mockBookings)
const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
const [loading, setLoading] = useState(false)
const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
const [searchTerm, setSearchTerm] = useState('')
const [statusFilter, setStatusFilter] = useState('all')
const [dateFilter, setDateFilter] = useState('all')
const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

// Estados para el modal de extras
const [showExtrasModal, setShowExtrasModal] = useState(false)
const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
const [selectedExtraType, setSelectedExtraType] = useState<'pelotas' | 'bebida' | 'paleta' | null>(null)
const [extraCost, setExtraCost] = useState(0)
const [extraAssignedTo, setExtraAssignedTo] = useState<'all' | 'player1' | 'player2' | 'player3' | 'player4'>('all')
```

## 8. Flujo de Interacción del Usuario

### 8.1 Gestión de Pagos Individuales

1. **Acceso**: Click en una fila de la tabla para expandir detalles
2. **Visualización**: Se muestra la lista de 4 jugadores con sus montos individuales
3. **Modificación**: Click en el botón de toggle para cambiar estado de pago
4. **Actualización automática**: El estado general se recalcula instantáneamente

### 8.2 Agregar Extras

1. **Inicio**: Click en botón "Agregar Extra" dentro del menú desplegable
2. **Selección**: Elegir tipo de extra (pelotas, bebida, paleta)
3. **Configuración**: 
   - Ajustar costo si es necesario
   - Seleccionar asignación (todos los jugadores o uno específico)
4. **Confirmación**: Click en "Agregar" para confirmar
5. **Visualización**: El extra aparece inmediatamente en la lista
6. **Eliminación**: Click en el ícono X para remover un extra

### 8.3 Filtrado y Búsqueda

1. **Búsqueda por texto**: Campo de búsqueda filtra por usuario, email o cancha
2. **Filtro por estado**: Selector con opciones confirmado, cancelado, completado
3. **Filtro por fecha**: Selector con opciones hoy, esta semana, este mes
4. **Exclusión automática**: Los turnos pendientes nunca aparecen en los resultados

## 9. Consideraciones Técnicas

### 9.1 Rendimiento
- Los cálculos de montos se realizan en tiempo real
- El filtrado se optimiza con `useEffect` y dependencias específicas
- Los estados se actualizan de forma inmutable

### 9.2 Accesibilidad
- Todos los botones tienen labels descriptivos
- Los colores de estado siguen convenciones estándar
- La navegación por teclado está soportada en elementos interactivos

### 9.3 Responsividad
- Grid adaptativo para estadísticas (1 columna en móvil, 2 en tablet, 3 en desktop)
- Modal de extras se adapta al ancho de pantalla
- Tabla de turnos con scroll horizontal en pantallas pequeñas

## 10. Datos de Ejemplo

El componente incluye datos mock para demostración con las siguientes características:
- 3 reservas de ejemplo con diferentes estados
- Jugadores con nombres realistas
- Precios variados ($8000, $12000, $10000)
- Estados de pago mixtos para demostrar funcionalidad
- Algunos extras pre-configurados

## 11. Archivos Relacionados

- **Componente principal**: `components/AdminTurnos.tsx`
- **Página de administración**: `app/(admin)/admin/page.tsx`
- **Componentes UI**: `components/ui/card.tsx`, `components/ui/button.tsx`, `components/ui/input.tsx`
- **Iconos**: Lucide React icons

---

**Nota**: Esta documentación refleja el estado actual del componente después de todas las mejoras implementadas. Para replicar la funcionalidad exacta, seguir las especificaciones de código y posicionamiento detalladas en cada sección.