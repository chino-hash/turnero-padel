# Especificación de la Sección "Mis Turnos"

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Diseño y Estructura](#diseño-y-estructura)
3. [Contenido Principal](#contenido-principal)
4. [Ventana Modal de Cancelación](#ventana-modal-de-cancelación)
5. [Estados y Comportamientos](#estados-y-comportamientos)
6. [Responsive Design](#responsive-design)
7. [Accesibilidad](#accesibilidad)

---

## Descripción General

La sección "Mis Turnos" es una interfaz completa para la gestión de reservas de canchas de pádel que permite a los usuarios visualizar, monitorear y administrar sus turnos actuales y pasados. Esta sección proporciona información detallada sobre el estado de las reservas, pagos, y permite la cancelación de turnos futuros.

### Características Principales
- **Visualización de reservas actuales y pasadas**
- **Información en tiempo real para turnos activos**
- **Gestión de estados de pago**
- **Funcionalidad de cancelación con modal de confirmación**
- **Diseño responsive y soporte para modo oscuro**
- **Estados de carga y mensajes informativos**

---

## Diseño y Estructura

### Layout Principal

La sección utiliza un diseño de tarjetas (cards) organizadas en dos secciones principales:

```
┌─────────────────────────────────────────────────────────┐
│ [← Volver] Mis Turnos                                   │
│ Gestiona tus reservas actuales y revisa tu historial   │
├─────────────────────────────────────────────────────────┤
│ 📖 Reservas Actuales                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Tarjeta de Reserva Actual]                        │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 📅 Historial de Reservas                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Tarjeta de Reserva Pasada]                        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Esquema de Colores

#### Modo Claro
- **Fondo principal**: `bg-white` (#FFFFFF)
- **Texto principal**: `text-gray-900` (#111827)
- **Texto secundario**: `text-gray-600` (#4B5563)
- **Bordes**: `border-gray-200` (#E5E7EB)
- **Sombras**: `shadow-lg`

#### Modo Oscuro
- **Fondo principal**: `bg-gray-800` (#1F2937)
- **Texto principal**: `text-white` (#FFFFFF)
- **Texto secundario**: `text-gray-300` (#D1D5DB)
- **Bordes**: `border-gray-600` (#4B5563)

#### Colores de Estado

**Estados de Pago:**
- **Pagado**: `text-green-600 bg-green-100` (#059669 / #DCFCE7)
- **Seña Pagada**: `text-yellow-600 bg-yellow-100` (#D97706 / #FEF3C7)
- **Pendiente**: `text-red-600 bg-red-100` (#DC2626 / #FEE2E2)

**Estados de Confirmación:**
- **Confirmado/Activo**: `text-green-600 bg-green-100` (#059669 / #DCFCE7)
- **Pendiente/Próximo**: `text-yellow-600 bg-yellow-100` (#D97706 / #FEF3C7)
- **Completado**: `text-blue-600 bg-blue-100` (#2563EB / #DBEAFE)
- **Historial**: `text-gray-600 bg-gray-100` (#4B5563 / #F3F4F6)

**Colores de Acción:**
- **Botón Cancelar**: `border-red-300 text-red-600 hover:bg-red-50` (modo claro)
- **Botón Cancelar**: `border-red-600 text-red-400 hover:bg-red-900/20` (modo oscuro)
- **Indicador EN VIVO**: `bg-green-100 text-green-800` (#DCFCE7 / #166534)

### Iconografía

- **Reservas Actuales**: `BookOpen` (Lucide React) - `text-blue-600`
- **Historial**: `Calendar` (Lucide React) - `text-gray-600`
- **Botón Volver**: `ArrowLeft` (Lucide React)
- **Indicador EN VIVO**: 🔴 (emoji)
- **Tiempo restante**: ⏱️ (emoji)
- **Información de pago**: 💰 (emoji)

---

## Contenido Principal

### Header de la Sección

**Elementos:**
- **Botón "Volver"**: Navegación hacia atrás
  - Tamaño: `size="sm"`
  - Variante: `variant="outline"`
  - Icono: `ArrowLeft`
  - Texto: "Volver" (oculto en móvil)

- **Título Principal**: "Mis Turnos"
  - Tipografía: `text-xl sm:text-2xl font-bold`
  - Color: Dinámico según modo oscuro/claro

- **Subtítulo**: "Gestiona tus reservas actuales y revisa tu historial"
  - Tipografía: `text-xs sm:text-sm`
  - Color: Texto secundario

### Sección de Reservas Actuales

**Título de Sección:**
- Icono: `BookOpen` en azul (`text-blue-600`)
- Texto: "Reservas Actuales"

**Tarjeta de Reserva Actual:**

#### Layout de Tarjeta
```
┌─────────────────────────────────────────────────────────┐
│ Cancha 1                                    $6,000     │
│ [Pagado]                                   [Confirmado] │
│ 15/01/2024 - 14:00-16:00                              │
│ Downtown Sports Center                     [Cancelar]   │
│                                                         │
│ ⏱️ Tiempo restante: 1h 30m (solo activos)             │
│ 💰 Pagado: $3,000 (solo futuros)          🔴 EN VIVO   │
│     Pendiente: $3,000                                  │
└─────────────────────────────────────────────────────────┘
```

#### Información del Lado Izquierdo
1. **Nombre de la Cancha**
   - Tipografía: `font-semibold text-sm sm:text-base`
   - Color: Texto principal

2. **Estado de Pago** (debajo del nombre)
   - Formato: Badge pequeño
   - Tipografía: `text-xs`
   - Colores: Según estado de pago
   - Textos: "Pagado", "Seña Pagada", "Pendiente"

3. **Fecha y Horario**
   - Formato: "DD/MM/YYYY - HH:MM-HH:MM"
   - Tipografía: `text-xs sm:text-sm`
   - Color: Texto secundario

4. **Ubicación**
   - Tipografía: `text-xs sm:text-sm`
   - Color: Texto secundario

5. **Información Contextual** (condicional)
   
   **Para Turnos Activos:**
   - Contenedor: `bg-green-50` (claro) / `bg-green-900/20` (oscuro)
   - Borde izquierdo: `border-l-4 border-green-500`
   - Texto: "⏱️ Tiempo restante: [tiempo]"
   - Color: `text-green-700` (claro) / `text-green-300` (oscuro)

   **Para Turnos Futuros:**
   - Contenedor: `bg-blue-50` (claro) / `bg-blue-900/20` (oscuro)
   - Borde izquierdo: `border-l-4 border-blue-500`
   - Texto principal: "💰 Pagado: $[monto]"
   - Texto secundario: "Pendiente: $[monto]" (si aplica)
   - Color: `text-blue-700` (claro) / `text-blue-300` (oscuro)

#### Información del Lado Derecho
1. **Precio Total**
   - Posición: Esquina superior derecha
   - Formato: "$[monto]"
   - Tipografía: `text-base sm:text-lg font-bold`
   - Color: Texto principal

2. **Estado de Confirmación**
   - Posición: Debajo del precio
   - Formato: Badge
   - Tipografía: `text-xs text-center`
   - Colores: Según estado
   - Alineación: `text-center`

3. **Botón Cancelar** (solo turnos futuros)
   - Posición: Debajo del estado
   - Tamaño: `size="sm"`
   - Variante: `variant="outline"`
   - Texto: "Cancelar"
   - Tipografía: `text-xs px-3 py-1`

4. **Indicador "EN VIVO"** (solo turnos activos)
   - Posición: Parte inferior
   - Formato: Badge
   - Texto: "🔴 EN VIVO"
   - Colores: `bg-green-100 text-green-800`
   - Tipografía: `text-xs font-medium text-center`

#### Estados Especiales de Tarjeta
- **Turno Activo**: Borde adicional `ring-2 ring-green-500 ring-opacity-50`
- **Opacidad Normal**: `opacity-100`

### Sección de Historial de Reservas

**Título de Sección:**
- Icono: `Calendar` en gris (`text-gray-600`)
- Texto: "Historial de Reservas"

**Tarjeta de Reserva Pasada:**
- Layout similar a reservas actuales pero simplificado
- **Opacidad reducida**: `opacity-75`
- **Sin botones de acción**
- **Sin información contextual** (tiempo restante, detalles de pago)
- **Solo información básica**: nombre, estado de pago, fecha, ubicación, precio, estado

### Estados de Carga y Vacío

#### Estado de Carga
- **Indicador**: Spinner animado (`animate-spin`)
- **Icono**: Círculo con borde (`border-b-2 border-blue-600`)
- **Texto**: "Cargando tus reservas..." / "Cargando historial..."
- **Posición**: Centrado verticalmente

#### Estado Vacío - Reservas Actuales
- **Icono**: 📅 (emoji grande)
- **Título**: "No tienes turnos reservados"
- **Descripción**: "¡Reserva tu cancha de pádel y comienza a jugar!"
- **Botón CTA**: "Reservar Turno" (si está disponible)
  - Colores: `bg-blue-600 hover:bg-blue-700 text-white`
  - Efectos: `shadow-md hover:shadow-lg`

#### Estado Vacío - Historial
- **Icono**: 📋 (emoji grande)
- **Título**: "Sin historial de reservas"
- **Descripción**: "Aquí aparecerán tus turnos completados"

---

## Ventana Modal de Cancelación

### Activación del Modal
El modal se activa cuando:
- El usuario hace clic en el botón "Cancelar" de una reserva futura
- Se ejecuta la función `onOpenCancelModal(booking)`

### Estructura del Modal

```
┌─────────────────────────────────────────────────────────┐
│ ❌ Cancelar Turno                              [X]      │
├─────────────────────────────────────────────────────────┤
│ ¿Estás seguro de que deseas cancelar este turno?       │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Detalles de la Reserva                              │ │
│ │ Cancha: [Nombre]                                    │ │
│ │ Fecha: [DD/MM/YYYY]                                 │ │
│ │ Horario: [HH:MM - HH:MM]                           │ │
│ │ Precio: $[monto]                                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Política de Cancelación                             │ │
│ │ ✅ Reembolso: $[monto] / ❌ Sin reembolso          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                           [Cancelar] [Confirmar]       │
└─────────────────────────────────────────────────────────┘
```

### Elementos del Modal

#### Header
- **Título**: "Cancelar Turno"
- **Icono**: `X` (Lucide React) en rojo (`text-red-600`)
- **Descripción**: "¿Estás seguro de que deseas cancelar este turno?"

#### Contenido Principal

**1. Detalles de la Reserva**
- Contenedor: `bg-gray-50` (claro) / `bg-gray-700` (oscuro)
- Padding: `p-3`
- Border radius: `rounded-lg`

Campos mostrados:
- **Cancha**: Nombre de la cancha
- **Fecha**: Formato DD/MM/YYYY
- **Horario**: Formato HH:MM - HH:MM
- **Precio**: Formato $[monto]

**2. Política de Cancelación**
- Contenedor similar al anterior
- **Con reembolso**: "✅ Reembolso: $[monto]"
- **Sin reembolso**: "❌ Sin reembolso disponible"

#### Footer/Acciones
- **Botón Cancelar**: 
  - Función: Cierra el modal sin acción
  - Estilo: `AlertDialogCancel`
  - Texto: "Cancelar"

- **Botón Confirmar**:
  - Función: Ejecuta la cancelación
  - Estilo: `bg-red-600 hover:bg-red-700`
  - Texto: "Confirmar Cancelación"

### Funcionalidad del Modal

#### Cálculo de Reembolso
La función `calculateRefundInfo(booking)` determina:
- **canRefund**: Boolean que indica si hay reembolso
- **refundAmount**: Monto del reembolso

#### Proceso de Cancelación
1. Usuario hace clic en "Cancelar" en una tarjeta
2. Se abre el modal con los detalles de la reserva
3. Se calcula y muestra la información de reembolso
4. Usuario confirma o cancela la acción
5. Si confirma:
   - Se ejecuta `handleConfirmCancellation()`
   - Se actualiza el estado de la reserva
   - Se cierra el modal
   - Se actualiza la lista de reservas

#### Estados del Modal
- **showCancelModal**: Controla la visibilidad
- **selectedBookingForCancel**: Reserva seleccionada para cancelar
- **canRefund**: Si aplica reembolso
- **refundAmount**: Monto del reembolso

---

## Estados y Comportamientos

### Estados de Reserva

#### Por Tiempo
- **Activo**: Turno en curso (hoy)
  - Indicador "EN VIVO"
  - Información de tiempo restante
  - Borde verde destacado

- **Próximo**: Turno futuro
  - Botón de cancelación disponible
  - Información de pagos pendientes
  - Detalles de seña y saldo

- **Completado**: Turno finalizado
  - Aparece en historial
  - Opacidad reducida
  - Sin acciones disponibles

#### Por Estado de Pago
- **Pagado**: Verde - Pago completo realizado
- **Seña Pagada**: Amarillo - Pago parcial realizado
- **Pendiente**: Rojo - Sin pagos realizados

#### Por Estado de Confirmación
- **Confirmado**: Verde - Reserva confirmada
- **Pendiente**: Amarillo - Esperando confirmación
- **Completado**: Azul - Turno finalizado
- **Cancelado**: Gris - Reserva cancelada

### Comportamientos Interactivos

#### Navegación
- **Botón Volver**: Regresa a la sección anterior
- **Auto-scroll**: Mantiene posición al actualizar

#### Acciones de Usuario
- **Cancelar Reserva**: Solo disponible para turnos futuros
- **Reservar Turno**: Disponible cuando no hay reservas actuales

#### Actualizaciones en Tiempo Real
- **Tiempo Restante**: Se actualiza automáticamente para turnos activos
- **Estado de Reservas**: Se sincroniza con el backend
- **Información de Pago**: Se actualiza según transacciones

---

## Responsive Design

### Breakpoints

#### Mobile (< 640px)
- **Texto del botón volver**: Oculto, solo icono
- **Títulos**: `text-xl` → `text-lg`
- **Padding de tarjetas**: `p-3`
- **Ancho mínimo lado derecho**: `min-w-[100px]`
- **Tipografía general**: `text-xs`

#### Desktop (≥ 640px)
- **Texto del botón volver**: Visible
- **Títulos**: `text-2xl`
- **Padding de tarjetas**: `p-4`
- **Ancho mínimo lado derecho**: `min-w-[120px]`
- **Tipografía general**: `text-sm`

### Adaptaciones Móviles
- **Layout de tarjetas**: Se mantiene horizontal pero con espaciado reducido
- **Botones**: Tamaño reducido pero manteniendo usabilidad
- **Modal**: Se adapta al ancho de pantalla
- **Texto**: Jerarquía tipográfica optimizada

---

## Accesibilidad

### Atributos ARIA
- **data-testid**: Identificadores para testing
  - `"mis-turnos"`: Contenedor principal
  - `"booking-item"`: Tarjetas de reservas actuales
  - `"past-booking-item"`: Tarjetas de historial
  - `"empty-bookings"`: Estado vacío de reservas actuales
  - `"empty-past-bookings"`: Estado vacío de historial

### Navegación por Teclado
- **Botones**: Focusables y activables con Enter/Space
- **Modal**: Navegación secuencial, escape para cerrar
- **Estados de foco**: Visibles y contrastados

### Contraste y Legibilidad
- **Colores**: Cumplen WCAG AA para contraste
- **Tipografía**: Tamaños mínimos respetados
- **Estados**: Claramente diferenciados

### Indicadores de Estado
- **Carga**: Spinner con texto descriptivo
- **Errores**: Mensajes claros y accionables
- **Éxito**: Confirmaciones visibles

---

## Consideraciones Técnicas

### Props del Componente
```typescript
interface MisTurnosProps {
  isVisible: boolean                    // Visibilidad del componente
  isDarkMode: boolean                   // Modo oscuro/claro
  currentBookings: Booking[]            // Reservas actuales
  pastBookings: Booking[]               // Historial de reservas
  isLoading?: boolean                   // Estado de carga
  onBack: () => void                    // Función de navegación atrás
  onStartBooking?: () => void           // Función para iniciar reserva
  onOpenCancelModal: (booking: Booking) => void  // Abrir modal de cancelación
  getCurrentBookingStatus: (booking: Booking) => string  // Estado actual
  getRemainingTime: (booking: Booking) => string         // Tiempo restante
  formatDate: (date: string) => string                   // Formato de fecha
  getPaymentStatusColor: (status: string) => string      // Color de pago
  getStatusColor: (status: string, type: string) => string // Color de estado
}
```

### Estructura de Datos
```typescript
interface Booking {
  id: string                           // Identificador único
  courtName: string                    // Nombre de la cancha
  date: string                         // Fecha de la reserva
  timeRange: string                    // Rango horario
  location: string                     // Ubicación
  totalPrice: number                   // Precio total
  deposit: number                      // Seña pagada
  paymentStatus: 'Paid' | 'Deposit Paid' | 'Pending'  // Estado de pago
  status: string                       // Estado de confirmación
  type: 'current' | 'past'            // Tipo de reserva
  players: Player[]                    // Jugadores
}
```

### Dependencias
- **React**: Componente funcional con hooks
- **Lucide React**: Iconografía
- **Tailwind CSS**: Estilos y responsive
- **UI Components**: Card, Button de librería interna

---

## Conclusión

La sección "Mis Turnos" proporciona una experiencia completa y intuitiva para la gestión de reservas de pádel. Su diseño responsive, soporte para modo oscuro, y funcionalidades avanzadas como cancelación con modal y información en tiempo real, la convierten en una herramienta robusta para los usuarios del sistema de reservas.

La implementación sigue las mejores prácticas de UX/UI, accesibilidad y desarrollo React, asegurando una experiencia consistente y profesional en todos los dispositivos y condiciones de uso.