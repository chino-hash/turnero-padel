# Especificación del Panel de Inicio - Turnero de Pádel

## Descripción General

Este documento especifica la funcionalidad y diseño del **Panel de Inicio** del sistema de turnos de pádel "Padel Listo". El panel sirve como punto de entrada principal para usuarios que desean reservar canchas de pádel, proporcionando una interfaz intuitiva para la selección de canchas, fechas y horarios.

## Propósito y Audiencia

### Propósito
- **Reserva de Turnos**: Facilitar la reserva de canchas de pádel
- **Visualización de Disponibilidad**: Mostrar horarios disponibles en tiempo real
- **Gestión de Reservas**: Permitir a usuarios gestionar sus reservas
- **Información de Canchas**: Proporcionar detalles sobre cada cancha disponible

### Audiencia Objetivo
- **Jugadores de Pádel**: Usuarios finales que desean reservar canchas
- **Administradores**: Personal que gestiona las reservas y canchas
- **Invitados**: Usuarios no registrados que pueden ver disponibilidad

## Estructura de la Página

### Layout Principal

#### Contenedor Principal
- **Clase CSS**: `container mx-auto p-6 space-y-6`
- **Responsividad**: Adaptable a móviles, tablets y desktop
- **Espaciado**: Padding de 24px, espaciado vertical de 24px entre secciones

#### Header de la Página
- **Título Principal**: "Padel Listo" con tipografía destacada
- **Navegación**: Enlaces a secciones principales
- **Usuario**: Información de sesión y opciones de cuenta

### Jerarquía Visual

#### Nivel 1: Título Principal
```tsx
<h1 className="text-3xl font-bold text-center mb-8">
  Padel Listo
</h1>
```

#### Nivel 2: Selección de Cancha
- **Componente**: Dropdown/Select para elegir cancha
- **Información Mostrada**: Nombre de cancha y precio por persona
- **Estado**: Indicador visual de disponibilidad

#### Nivel 3: Controles de Fecha y Vista
- **Navegación de Fechas**: Botones anterior/siguiente
- **Selector de Vista**: Opciones de visualización (día/semana)
- **Fecha Actual**: Indicador claro de la fecha seleccionada

### Tarjeta de Información de Cancha

#### Estructura
```tsx
<Card className="mb-6">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">{cancha.nombre}</h2>
        <p className="text-gray-600">{cancha.descripcion}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-green-600">
          ${precioPersona}
        </p>
        <p className="text-sm text-gray-500">por persona</p>
      </div>
    </div>
  </CardContent>
</Card>
```

#### Información Mostrada
- **Nombre de la Cancha**: Título principal
- **Descripción**: Detalles adicionales de la cancha
- **Precio por Persona**: Calculado como `(precioBase * multiplicador) / 4`
- **Estado**: Indicador visual de disponibilidad

### Selección de Canchas

#### Componente Select
```tsx
<Select value={selectedCourt} onValueChange={setSelectedCourt}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Selecciona una cancha" />
  </SelectTrigger>
  <SelectContent>
    {courts.map((court) => (
      <SelectItem key={court.id} value={court.id}>
        {court.name} - ${(court.basePrice * court.priceMultiplier / 4).toFixed(2)} por persona
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Funcionalidad
- **Carga Dinámica**: Lista actualizada desde base de datos
- **Filtrado**: Solo canchas activas son mostradas
- **Información de Precio**: Precio por persona calculado en tiempo real
- **Selección Persistente**: Mantiene selección durante la sesión

### Controles de Vista

#### Navegación de Fechas
```tsx
<div className="flex items-center justify-between mb-4">
  <Button 
    variant="outline" 
    onClick={() => changeDate(-1)}
    disabled={isToday}
  >
    <ChevronLeft className="h-4 w-4" />
    Anterior
  </Button>
  
  <h2 className="text-xl font-semibold">
    {formatDate(selectedDate)}
  </h2>
  
  <Button 
    variant="outline" 
    onClick={() => changeDate(1)}
  >
    Siguiente
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

#### Funcionalidades
- **Navegación**: Botones para cambiar fecha
- **Restricciones**: No permite fechas pasadas
- **Formato**: Fecha mostrada en formato legible
- **Límites**: Máximo 30 días hacia el futuro

### Layout de Dos Columnas

#### Estructura Desktop
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="space-y-4">
    {/* Información de cancha y controles */}
  </div>
  <div>
    {/* Grid de horarios */}
  </div>
</div>
```

#### Responsividad
- **Móvil**: Una columna, elementos apilados verticalmente
- **Tablet**: Transición gradual a dos columnas
- **Desktop**: Dos columnas completas con espaciado óptimo

## Elementos Gráficos

### Iconografía

#### Iconos Utilizados (Lucide React)
- **ChevronLeft/Right**: Navegación de fechas
- **Calendar**: Selector de fecha
- **Clock**: Indicador de horarios
- **Users**: Información de jugadores
- **MapPin**: Ubicación de cancha
- **Check**: Confirmación de reserva
- **X**: Cancelar/cerrar

#### Tamaños Estándar
- **Iconos Pequeños**: 16px (h-4 w-4)
- **Iconos Medianos**: 20px (h-5 w-5)
- **Iconos Grandes**: 24px (h-6 w-6)

### Logo y Branding

#### Logo Principal
- **Posición**: Header superior centrado
- **Tipografía**: Font bold, tamaño 3xl
- **Color**: Texto principal del tema

### Ilustraciones de Canchas

#### Representación Visual
- **Placeholder**: Imagen genérica de cancha de pádel
- **Dimensiones**: Aspect ratio 16:9
- **Calidad**: Optimizada para web (WebP/AVIF)

### Indicadores Visuales

#### Estados de Horarios
- **Disponible**: Fondo verde claro, texto verde oscuro
- **Ocupado**: Fondo gris, texto gris oscuro
- **Seleccionado**: Fondo azul, texto blanco
- **Reservado por Usuario**: Fondo amarillo, texto amarillo oscuro

#### Colores de Estado
```css
.available { @apply bg-green-100 text-green-800 hover:bg-green-200; }
.occupied { @apply bg-gray-100 text-gray-500 cursor-not-allowed; }
.selected { @apply bg-blue-600 text-white; }
.user-booked { @apply bg-yellow-100 text-yellow-800; }
```

### Efectos Visuales

#### Transiciones
- **Hover**: Transición suave de 150ms
- **Click**: Efecto de escala sutil
- **Loading**: Skeleton loaders para carga de datos

#### Animaciones
```css
.transition-all { transition: all 150ms ease-in-out; }
.hover:scale-105 { transform: scale(1.05); }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

## Diseño y Estilo

### Paleta de Colores

#### Colores Principales
- **Primario**: Azul (#3B82F6) - Botones principales, enlaces
- **Secundario**: Verde (#10B981) - Precios, disponibilidad
- **Acento**: Amarillo (#F59E0B) - Alertas, destacados
- **Neutro**: Grises (#6B7280, #9CA3AF, #D1D5DB)

#### Colores de Estado
- **Éxito**: Verde (#10B981)
- **Error**: Rojo (#EF4444)
- **Advertencia**: Amarillo (#F59E0B)
- **Información**: Azul (#3B82F6)

### Tipografía

#### Jerarquía de Texto
```css
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* Títulos principales */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }     /* Subtítulos */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }   /* Títulos de sección */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* Texto destacado */
.text-base { font-size: 1rem; line-height: 1.5rem; }     /* Texto normal */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* Texto secundario */
```

#### Pesos de Fuente
- **font-bold**: Títulos principales
- **font-semibold**: Subtítulos y destacados
- **font-medium**: Texto importante
- **font-normal**: Texto regular

### Efectos Visuales

#### Sombras
```css
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
```

#### Bordes Redondeados
```css
.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
```

### Responsividad

#### Breakpoints
```css
/* Móvil: < 640px */
.container { padding: 1rem; }
.grid { grid-template-columns: 1fr; }

/* Tablet: 640px - 1024px */
@media (min-width: 640px) {
  .container { padding: 1.5rem; }
}

/* Desktop: > 1024px */
@media (min-width: 1024px) {
  .grid { grid-template-columns: 1fr 1fr; }
  .container { padding: 2rem; }
}
```

#### Adaptaciones Móviles
- **Navegación**: Menú hamburguesa en móviles
- **Tarjetas**: Stack vertical en pantallas pequeñas
- **Botones**: Tamaño táctil mínimo de 44px
- **Texto**: Tamaños ajustados para legibilidad

### Accesibilidad

#### Estándares WCAG 2.1
- **Contraste**: Mínimo 4.5:1 para texto normal
- **Navegación por Teclado**: Todos los elementos interactivos
- **Screen Readers**: Etiquetas ARIA apropiadas
- **Focus Visible**: Indicadores claros de foco

#### Implementación
```tsx
// Ejemplo de botón accesible
<Button
  aria-label="Reservar turno para las 14:00"
  className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
  tabIndex={0}
>
  14:00
</Button>
```

## Funcionalidad

### Selección de Cancha

#### Proceso de Selección
1. **Carga Inicial**: Obtener lista de canchas activas
2. **Mostrar Opciones**: Dropdown con canchas disponibles
3. **Selección**: Usuario elige una cancha
4. **Actualización**: Cargar horarios para la cancha seleccionada
5. **Persistencia**: Mantener selección durante la sesión

#### Lógica de Negocio
```typescript
const handleCourtSelection = (courtId: string) => {
  setSelectedCourt(courtId)
  setLoading(true)
  
  // Cargar horarios para la cancha seleccionada
  fetchSlotsForCourt(courtId, selectedDate)
    .then(slots => {
      setAvailableSlots(slots)
      setLoading(false)
    })
    .catch(error => {
      console.error('Error loading slots:', error)
      setLoading(false)
    })
}
```

### Navegación de Fechas

#### Controles de Fecha
- **Fecha Actual**: Mostrada prominentemente
- **Navegación**: Botones anterior/siguiente
- **Restricciones**: No fechas pasadas, máximo 30 días futuro
- **Formato**: Día de semana, día, mes, año

#### Implementación
```typescript
const changeDate = (direction: number) => {
  const newDate = new Date(selectedDate)
  newDate.setDate(newDate.getDate() + direction)
  
  // Validar que no sea fecha pasada
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (newDate >= today) {
    setSelectedDate(newDate)
    // Recargar horarios para nueva fecha
    fetchSlotsForCourt(selectedCourt, newDate)
  }
}
```

### Gestión de Horarios

#### Estados de Horarios
- **Disponible**: Puede ser reservado
- **Ocupado**: Ya reservado por otro usuario
- **Seleccionado**: Elegido por el usuario actual
- **Reservado por Usuario**: Reserva existente del usuario

#### Lógica de Reserva
```typescript
const handleSlotSelection = (slotId: string) => {
  if (selectedSlot === slotId) {
    // Deseleccionar si ya está seleccionado
    setSelectedSlot(null)
  } else {
    // Seleccionar nuevo horario
    setSelectedSlot(slotId)
  }
}

const confirmBooking = async () => {
  if (!selectedSlot || !selectedCourt) return
  
  try {
    const booking = await createBooking({
      courtId: selectedCourt,
      slotId: selectedSlot,
      date: selectedDate,
      userId: session.user.id
    })
    
    // Actualizar UI y mostrar confirmación
    setBookings([...bookings, booking])
    setSelectedSlot(null)
    toast.success('Reserva confirmada')
  } catch (error) {
    toast.error('Error al crear la reserva')
  }
}
```

### Sistema de Reservas

#### Flujo de Reserva
1. **Selección de Cancha**: Usuario elige cancha
2. **Selección de Fecha**: Usuario navega a fecha deseada
3. **Selección de Horario**: Usuario elige horario disponible
4. **Confirmación**: Modal de confirmación con detalles
5. **Procesamiento**: Crear reserva en base de datos
6. **Confirmación**: Mostrar confirmación y actualizar UI

#### Validaciones
- **Autenticación**: Usuario debe estar logueado
- **Disponibilidad**: Horario debe estar disponible
- **Límites**: Máximo de reservas por usuario
- **Tiempo**: No reservas en horarios pasados

### Controles de Vista

#### Opciones de Visualización
- **Vista Día**: Horarios de un día específico
- **Vista Semana**: Horarios de toda la semana
- **Vista Mes**: Calendario mensual con disponibilidad

#### Implementación de Vistas
```typescript
const ViewSelector = () => {
  return (
    <div className="flex space-x-2 mb-4">
      <Button
        variant={view === 'day' ? 'default' : 'outline'}
        onClick={() => setView('day')}
      >
        Día
      </Button>
      <Button
        variant={view === 'week' ? 'default' : 'outline'}
        onClick={() => setView('week')}
      >
        Semana
      </Button>
    </div>
  )
}
```

### Estados de la Aplicación

#### Estados Globales
```typescript
interface AppState {
  selectedCourt: string | null
  selectedDate: Date
  selectedSlot: string | null
  availableSlots: Slot[]
  userBookings: Booking[]
  loading: boolean
  error: string | null
}
```

#### Gestión de Estado
- **React State**: Para estado local de componentes
- **Context API**: Para estado compartido entre componentes
- **Local Storage**: Para persistencia de preferencias
- **Session Storage**: Para datos temporales de sesión

### Interacciones del Usuario

#### Eventos de Click
- **Selección de Cancha**: Actualizar horarios disponibles
- **Navegación de Fecha**: Cargar horarios para nueva fecha
- **Selección de Horario**: Marcar como seleccionado
- **Confirmación de Reserva**: Procesar reserva

#### Eventos de Hover
- **Horarios**: Mostrar información adicional
- **Botones**: Efectos visuales de hover
- **Tarjetas**: Elevación sutil

#### Eventos de Teclado
- **Tab**: Navegación secuencial
- **Enter/Space**: Activar elementos seleccionados
- **Escape**: Cerrar modales/dropdowns
- **Flechas**: Navegación en grids

## Validaciones y Restricciones

### Reglas de Negocio

#### Restricciones Temporales
- **Horario Mínimo**: No reservas con menos de 1 hora de anticipación
- **Horario Máximo**: Máximo 30 días de anticipación
- **Duración**: Turnos de 90 minutos estándar
- **Horarios de Operación**: 8:00 AM a 11:00 PM

#### Restricciones de Usuario
- **Máximo de Reservas**: 3 reservas activas por usuario
- **Cancelación**: Hasta 2 horas antes del turno
- **Modificación**: Hasta 4 horas antes del turno
- **No-show**: Penalización por no presentarse

### Validaciones de Entrada

#### Validación de Fechas
```typescript
const validateDate = (date: Date): boolean => {
  const today = new Date()
  const maxDate = new Date()
  maxDate.setDate(today.getDate() + 30)
  
  return date >= today && date <= maxDate
}
```

#### Validación de Horarios
```typescript
const validateSlot = (slot: Slot, date: Date): boolean => {
  const slotDateTime = new Date(date)
  const [hours, minutes] = slot.time.split(':').map(Number)
  slotDateTime.setHours(hours, minutes, 0, 0)
  
  const now = new Date()
  const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hora
  
  return slotDateTime > minBookingTime && slot.isAvailable
}
```

## Navegación

### Estructura de Navegación

#### Navegación Principal
```tsx
<nav className="flex items-center justify-between p-4">
  <div className="flex items-center space-x-4">
    <Link href="/" className="text-xl font-bold">
      Padel Listo
    </Link>
  </div>
  
  <div className="flex items-center space-x-4">
    <Link href="/mis-reservas">Mis Reservas</Link>
    <Link href="/perfil">Perfil</Link>
    <Button onClick={signOut}>Cerrar Sesión</Button>
  </div>
</nav>
```

#### Enlaces Principales
- **Inicio**: Panel principal de reservas
- **Mis Reservas**: Lista de reservas del usuario
- **Perfil**: Configuración de cuenta
- **Admin**: Panel administrativo (solo admins)

### Breadcrumbs

#### Implementación
```tsx
<nav className="flex mb-4" aria-label="Breadcrumb">
  <ol className="flex items-center space-x-2">
    <li>
      <Link href="/" className="text-blue-600 hover:text-blue-800">
        Inicio
      </Link>
    </li>
    <li className="text-gray-500">/</li>
    <li className="text-gray-900">
      Reservar Cancha
    </li>
  </ol>
</nav>
```

### Navegación Modal

#### Modal de Confirmación
```tsx
<Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar Reserva</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <p><strong>Cancha:</strong> {selectedCourtName}</p>
      <p><strong>Fecha:</strong> {formatDate(selectedDate)}</p>
      <p><strong>Horario:</strong> {selectedSlotTime}</p>
      <p><strong>Precio:</strong> ${totalPrice}</p>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirmation(false)}>
        Cancelar
      </Button>
      <Button onClick={confirmBooking}>
        Confirmar Reserva
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Navegación Responsiva

#### Menú Móvil
```tsx
const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg">
          <nav className="flex flex-col p-4 space-y-2">
            <Link href="/mis-reservas">Mis Reservas</Link>
            <Link href="/perfil">Perfil</Link>
            <Button onClick={signOut} variant="ghost">
              Cerrar Sesión
            </Button>
          </nav>
        </div>
      )}
    </div>
  )
}
```

### Estados de Navegación

#### Indicadores de Página Activa
```css
.nav-link {
  @apply px-3 py-2 rounded-md text-sm font-medium transition-colors;
}

.nav-link.active {
  @apply bg-blue-100 text-blue-700;
}

.nav-link:hover {
  @apply bg-gray-100 text-gray-900;
}
```

---

# Panel de Gestión de Canchas

## Descripción General

El **Panel de Gestión de Canchas** es una interfaz administrativa completa que permite a los administradores del sistema gestionar todas las canchas de pádel disponibles. Proporciona funcionalidades CRUD (Crear, Leer, Actualizar, Desactivar) para el mantenimiento de canchas, incluyendo configuración de precios, estados y características.

## Propósito y Audiencia

### Propósito
- **Gestión Centralizada**: Administrar todas las canchas desde una sola interfaz
- **Control de Precios**: Configurar precios base y multiplicadores por cancha
- **Estado de Canchas**: Activar/desactivar canchas según disponibilidad
- **Información Detallada**: Mantener descripciones y características de cada cancha

### Audiencia Objetivo
- **Administradores del Sistema**: Personal autorizado para gestionar canchas
- **Gerentes de Instalaciones**: Responsables de la configuración de precios
- **Personal de Mantenimiento**: Para actualizar estados de disponibilidad

## Arquitectura y Estructura

### Componente Principal
**Archivo**: `app/(admin)/admin/canchas/page.tsx`
**Tipo**: Client Component (Next.js 14)
**Autenticación**: Requerida (Solo administradores)

### Estructura de Datos

```typescript
interface Court {
  id: string                // Identificador único
  name: string             // Nombre de la cancha
  basePrice: number        // Precio base en pesos
  priceMultiplier: number  // Multiplicador de precio
  isActive: boolean        // Estado activo/inactivo
  description?: string     // Descripción opcional
}
```

### Estados del Componente

```typescript
const [courts, setCourts] = useState<Court[]>([])           // Lista de canchas
const [loading, setLoading] = useState(true)                // Estado de carga
const [editingCourt, setEditingCourt] = useState<Court | null>(null) // Cancha en edición
const [showAddForm, setShowAddForm] = useState(false)       // Mostrar formulario
const [formData, setFormData] = useState({...})             // Datos del formulario
```

## Funcionalidades Principales

### 1. Visualización de Canchas

#### Lista de Canchas
- **Layout**: Grid responsivo (1 columna móvil, 2-3 columnas desktop)
- **Información Mostrada**:
  - Nombre de la cancha
  - Precio base
  - Precio por persona (calculado: `basePrice / 4`)
  - Estado (Activa/Inactiva)
  - Descripción (si existe)

#### Indicadores Visuales
- **Estado Activo**: Colores normales, switch activado
- **Estado Inactivo**: Opacidad reducida (60%), switch desactivado
- **Precio por Persona**: Destacado en verde para fácil identificación

### 2. Creación de Canchas

#### Formulario de Creación
- **Campos Requeridos**:
  - Nombre de la cancha
  - Precio base ($)
- **Campos Opcionales**:
  - Descripción
  - Estado inicial (activa por defecto)
- **Campo Automático**:
  - Divisor fijo: 4 (para cálculo de precio por persona)

#### Validaciones
- **Nombre**: No vacío, máximo 100 caracteres
- **Precio Base**: Número positivo, mínimo recomendado $1000
- **Descripción**: Máximo 500 caracteres

### 3. Edición de Canchas

#### Modo de Edición
- **Activación**: Click en botón de editar (ícono Edit2)
- **Formulario Pre-poblado**: Datos actuales de la cancha
- **Cálculo Dinámico**: Precio por persona se actualiza automáticamente
- **Divisor Fijo**: Campo de solo lectura con valor 4

#### Funcionalidades Especiales
- **Precio por Persona**: Mostrado como `basePrice / 4` con 2 decimales
- **Actualización en Tiempo Real**: Cálculos se actualizan al cambiar precio base
- **Indicador Visual**: Texto "Precio por persona: $X.XX" debajo del divisor

### 4. Gestión de Estados

#### Activar/Desactivar Canchas
- **Control**: Switch toggle en cada tarjeta de cancha
- **Acción Inmediata**: Cambio de estado sin confirmación
- **Feedback Visual**: Toast notification de confirmación
- **Persistencia**: Cambio guardado inmediatamente en base de datos

## Diseño y Experiencia de Usuario

### Layout Principal

#### Header de Página
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center space-x-4">
    <Button variant="outline" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4" />
      <span>Volver</span>
    </Button>
    <h1 className="text-2xl font-bold">Gestión de Canchas</h1>
  </div>
  <Button onClick={() => setShowAddForm(true)}>
    <Plus className="h-4 w-4" />
    <span>Agregar Cancha</span>
  </Button>
</div>
```

#### Formulario de Creación/Edición
- **Contenedor**: Card component con header y content
- **Layout**: Grid responsivo 1-2 columnas según pantalla
- **Campos**: Input components con labels descriptivos
- **Acciones**: Botones Cancelar y Guardar/Actualizar

#### Tarjetas de Cancha
- **Estructura**: Card con header (nombre + controles) y content (detalles)
- **Controles**: Botón editar + switch de estado
- **Información**: Precio base, precio por persona, estado, descripción

### Estilos y Componentes UI

#### Componentes Utilizados
- **Card, CardContent, CardHeader, CardTitle**: Contenedores principales
- **Button**: Acciones (variants: default, outline, ghost)
- **Input**: Campos de entrada de datos
- **Label**: Etiquetas de campos
- **Switch**: Control de estado activo/inactivo
- **Icons**: ArrowLeft, Save, Plus, Edit2 (Lucide React)

#### Clases CSS Principales
```css
.container mx-auto p-6 space-y-6          /* Contenedor principal */
.grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  /* Grid de canchas */
.flex items-center justify-between        /* Header layout */
.space-y-4                               /* Espaciado vertical */
.text-2xl font-bold                      /* Título principal */
.text-sm text-gray-600                   /* Texto secundario */
.font-bold text-green-600                /* Precio destacado */
```

## Integración con APIs

### Endpoints Utilizados

#### GET /api/courts
- **Propósito**: Obtener lista de todas las canchas
- **Autenticación**: Requerida (sesión válida)
- **Respuesta**: Array de objetos Court
- **Uso**: Carga inicial y refetch después de cambios

#### POST /api/courts
- **Propósito**: Crear nueva cancha
- **Autenticación**: Requerida (rol ADMIN)
- **Body**: Datos de la nueva cancha
- **Respuesta**: Cancha creada con ID generado

#### PUT /api/courts
- **Propósito**: Actualizar cancha existente
- **Autenticación**: Requerida (rol ADMIN)
- **Body**: ID + datos a actualizar
- **Respuesta**: Cancha actualizada

### Manejo de Errores

#### Estrategias de Error
- **Toast Notifications**: Mensajes de error/éxito usando Sonner
- **Loading States**: Indicadores de carga durante operaciones
- **Fallback UI**: Mensaje cuando no hay canchas registradas
- **Validación Client-Side**: Prevención de envíos inválidos

#### Mensajes de Error Comunes
```typescript
"Error al cargar las canchas"           // Fallo en GET
"Error al guardar la cancha"            // Fallo en POST/PUT
"Error al actualizar el estado"         // Fallo en toggle
"Cancha actualizada"                    // Éxito en edición
"Cancha creada"                         // Éxito en creación
```

## Lógica de Negocio

### Cálculo de Precios

#### Fórmula Principal
```typescript
// Precio por persona (con divisor fijo = 4)
const pricePerPerson = basePrice / 4
```

#### Reglas de Precios
- **Precio Base**: Valor en pesos argentinos
- **Divisor**: Fijo en 4 (número de jugadores por cancha)
- **Multiplicador**: Actualmente fijo en 1.0, preparado para futuras variaciones
- **Formato**: Mostrado con 2 decimales usando `toFixed(2)`

### Estados de Cancha

#### Estados Posibles
- **Activa** (`isActive: true`): Disponible para reservas
- **Inactiva** (`isActive: false`): No disponible, oculta para usuarios

#### Transiciones de Estado
- **Activar**: Cancha pasa a estar disponible inmediatamente
- **Desactivar**: Cancha se oculta de selección, reservas existentes se mantienen
- **Sin Confirmación**: Cambios de estado son inmediatos

### Validaciones de Datos

#### Validaciones Frontend
```typescript
// Validación de nombre
if (!formData.name.trim()) {
  // Error: Nombre requerido
}

// Validación de precio
if (formData.basePrice <= 0) {
  // Error: Precio debe ser positivo
}

// Validación de longitud
if (formData.description && formData.description.length > 500) {
  // Error: Descripción muy larga
}
```

#### Validaciones Backend
- **Unicidad**: Verificación de nombres únicos
- **Tipos de Datos**: Validación de tipos TypeScript
- **Rangos**: Validación de rangos de precios
- **Permisos**: Verificación de rol de administrador

## Flujos de Usuario

### Flujo de Creación de Cancha

1. **Inicio**: Click en "Agregar Cancha"
2. **Formulario**: Se muestra formulario vacío
3. **Entrada de Datos**: Usuario completa campos requeridos
4. **Validación**: Validación client-side en tiempo real
5. **Envío**: Click en "Crear"
6. **Procesamiento**: POST a /api/courts
7. **Confirmación**: Toast de éxito + actualización de lista
8. **Cierre**: Formulario se oculta automáticamente

### Flujo de Edición de Cancha

1. **Inicio**: Click en botón editar de una cancha
2. **Pre-población**: Formulario se llena con datos actuales
3. **Modificación**: Usuario edita campos necesarios
4. **Cálculo Dinámico**: Precio por persona se actualiza automáticamente
5. **Validación**: Validación en tiempo real
6. **Envío**: Click en "Actualizar"
7. **Procesamiento**: PUT a /api/courts
8. **Confirmación**: Toast de éxito + actualización de lista
9. **Cierre**: Modo edición se desactiva

### Flujo de Cambio de Estado

1. **Inicio**: Click en switch de estado
2. **Procesamiento Inmediato**: PUT a /api/courts
3. **Actualización Visual**: Switch cambia estado
4. **Confirmación**: Toast notification
5. **Refetch**: Lista se actualiza desde servidor

## Consideraciones Técnicas

### Performance

#### Optimizaciones Implementadas
- **Client Component**: Interactividad optimizada
- **Estado Local**: Gestión eficiente con useState
- **Refetch Selectivo**: Solo después de cambios exitosos
- **Loading States**: UX mejorada durante operaciones

#### Métricas de Performance
- **Carga Inicial**: < 500ms para lista de canchas
- **Operaciones CRUD**: < 200ms para crear/actualizar
- **Cambio de Estado**: < 100ms para toggle
- **Renderizado**: Optimizado para listas de hasta 50 canchas

### Seguridad

#### Medidas de Seguridad
- **Autenticación**: Verificación de sesión en cada request
- **Autorización**: Solo usuarios con rol ADMIN
- **Validación Dual**: Client-side y server-side
- **Sanitización**: Prevención de XSS en inputs

#### Controles de Acceso
```typescript
// Verificación en API
if (!session || !session.user.isAdmin) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
```

### Escalabilidad

#### Preparación para Crecimiento
- **Paginación**: Preparado para implementar cuando sea necesario
- **Filtros**: Estructura lista para filtros avanzados
- **Búsqueda**: Interfaz preparada para búsqueda por nombre
- **Bulk Operations**: Arquitectura permite operaciones en lote

## Testing y Calidad

### Estrategias de Testing

#### Tests Unitarios
- **Servicios**: Tests para getCourts, createCourt, updateCourt
- **Componentes**: Tests de renderizado y interacciones
- **Validaciones**: Tests de validaciones de formulario
- **Cálculos**: Tests de cálculo de precios

#### Tests de Integración
- **API Endpoints**: Tests completos de flujos CRUD
- **Autenticación**: Tests de permisos y acceso
- **Base de Datos**: Tests de persistencia

#### Tests E2E
- **Flujos Completos**: Cypress tests para flujos de usuario
- **Responsive**: Tests en diferentes tamaños de pantalla
- **Accesibilidad**: Tests de navegación por teclado

### Métricas de Calidad

#### Cobertura de Tests
- **Servicios**: 95%+ cobertura
- **Componentes**: 90%+ cobertura
- **APIs**: 100% cobertura de endpoints

#### Estándares de Código
- **TypeScript**: Tipado estricto
- **ESLint**: Reglas de calidad de código
- **Prettier**: Formateo consistente
- **Husky**: Pre-commit hooks

## Monitoreo y Mantenimiento

### Logging y Monitoreo

#### Eventos Registrados
```typescript
// Operaciones CRUD
console.log('Cancha creada:', courtData.name)
console.log('Cancha actualizada:', courtId)
console.log('Estado cambiado:', { courtId, newState })

// Errores
console.error('Error en gestión de canchas:', error)
```

#### Métricas Sugeridas
- **Uso**: Número de canchas creadas/editadas por día
- **Performance**: Tiempo de respuesta de operaciones
- **Errores**: Tasa de errores por tipo de operación
- **Usuarios**: Administradores más activos

### Mantenimiento Preventivo

#### Tareas Regulares
- **Limpieza de Datos**: Verificación de integridad
- **Performance**: Monitoreo de tiempos de respuesta
- **Seguridad**: Auditoría de permisos
- **Backups**: Respaldo de configuraciones

## Roadmap y Mejoras Futuras

### Funcionalidades Planificadas

#### Corto Plazo (1-3 meses)
- **Imágenes**: Subida y gestión de imágenes de canchas
- **Características**: Sistema de amenities/características
- **Horarios**: Configuración de horarios de operación
- **Precios Dinámicos**: Precios por horario/día

#### Mediano Plazo (3-6 meses)
- **Disponibilidad**: Integración con sistema de reservas
- **Reportes**: Dashboard de uso por cancha
- **Mantenimiento**: Sistema de programación de mantenimiento
- **Notificaciones**: Alertas de estado de canchas

#### Largo Plazo (6+ meses)
- **IA**: Optimización automática de precios
- **IoT**: Integración con sensores de cancha
- **Mobile App**: Aplicación móvil para administradores
- **Analytics**: Análisis predictivo de demanda

### Mejoras Técnicas

#### Performance
- **Caché**: Implementación de caché Redis
- **CDN**: Optimización de assets estáticos
- **Lazy Loading**: Carga diferida de componentes
- **Service Workers**: Funcionalidad offline

#### UX/UI
- **Drag & Drop**: Reordenamiento de canchas
- **Bulk Actions**: Operaciones masivas
- **Advanced Filters**: Filtros y búsqueda avanzada
- **Dark Mode**: Soporte para tema oscuro

---

## Notas Adicionales

### Consideraciones Técnicas
- **Compatibilidad**: Compatible con navegadores modernos (Chrome 90+, Firefox 88+, Safari 14+)
- **Performance**: Optimizado para cargas rápidas con lazy loading de componentes
- **SEO**: Meta tags optimizados para cada página
- **Analytics**: Integración con Google Analytics para tracking de uso

### Futuras Mejoras
- **Notificaciones Push**: Sistema de notificaciones en tiempo real
- **Modo Offline**: Funcionalidad básica sin conexión
- **Temas**: Soporte para tema oscuro/claro
- **Internacionalización**: Soporte multi-idioma

### Mantenimiento y Actualizaciones
- **Versionado**: Sistema de versionado semántico
- **Testing**: Suite completa de tests automatizados
- **CI/CD**: Pipeline de integración y despliegue continuo
- **Monitoreo**: Logging y monitoreo de errores en producción

### Compatibilidad
- **Dispositivos**: Responsive design para móviles, tablets y desktop
- **Navegadores**: Soporte para navegadores modernos
- **Accesibilidad**: Cumple con estándares WCAG 2.1 AA

### Documentación
- **API**: Documentación completa de endpoints
- **Componentes**: Storybook para componentes UI
- **Guías**: Guías de usuario y administrador
- **Changelog**: Registro detallado de cambios