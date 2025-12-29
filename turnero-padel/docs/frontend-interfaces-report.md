# Reporte Detallado de Interfaces del Frontend

## URLs Analizadas
- **Dashboard de Usuario**: `http://localhost:3000/dashboard`
- **Panel de Administración**: `http://localhost:3000/admin`

---

## 1. Dashboard de Usuario (`/dashboard`)

### 1.1 Estructura General

#### Ruta y Protección
- **Archivo**: `app/(protected)/dashboard/page.tsx`
- **Layout**: `app/(protected)/layout.tsx`
- **Protección**: Requiere autenticación (redirección a `/login` si no autenticado)
- **Componente Principal**: `PadelBookingPage` (importado dinámicamente)

#### Características de Seguridad
- ⚠️ **ARCHIVO PROTEGIDO**: Marcado como crítico para usuarios finales
- Requiere proceso formal de revisión para modificaciones
- Importación dinámica sin SSR para evitar errores de hidratación

### 1.2 Funcionalidades del Dashboard

#### Componente Principal: `PadelBookingPage`
**Archivo**: `padel-booking.tsx`

##### Navegación Principal
- **Inicio**: Vista principal con calendario y slots disponibles
- **Mis Turnos**: Gestión de reservas del usuario
- **Configuración**: Ajustes de usuario y preferencias

##### Características de la Interfaz
1. **Selector de Canchas**
   - Visualización de canchas disponibles
   - Información de precios por cancha
   - Estado de disponibilidad en tiempo real

2. **Calendario de Reservas**
   - Selector de fechas interactivo
   - Vista de próximos días disponibles
   - Integración con componente Calendar de shadcn/ui

3. **Gestión de Horarios**
   - Slots de tiempo disponibles
   - Vista unificada/individual de horarios
   - Filtros por disponibilidad
   - Expansión de detalles por slot

4. **Sistema de Reservas**
   - Modal de confirmación de reserva
   - Selección de jugadores
   - Cálculo automático de precios
   - Estados de reserva (confirmado, pendiente, cancelado)

##### Componentes de UI Utilizados
- `Button`, `Card`, `Popover`, `AlertDialog` (shadcn/ui)
- `Calendar` component para selección de fechas
- `Switch` y `Label` para configuraciones
- Iconos de Lucide React

##### Estados y Contexto
- Integración con `AppStateProvider` para estado global
- Hook `useAuth` para autenticación
- Estados locales para UI (modo oscuro, navegación activa, etc.)

### 1.3 Componentes Específicos

#### MisTurnos Component
- **Archivo**: `components/MisTurnos.tsx`
- **Función**: Gestión de reservas del usuario
- **Características**:
  - Lista de reservas actuales y pasadas
  - Estados de pago y confirmación
  - Opciones de cancelación

#### HomeSection Component
- **Archivo**: `components/HomeSection.tsx`
- **Función**: Página de inicio del dashboard
- **Características**:
  - Resumen de actividad
  - Accesos rápidos
  - Información general

---

## 2. Panel de Administración (`/admin`)

### 2.1 Estructura General

#### Ruta y Protección
- **Layout**: `app/(admin)/layout.tsx`
- **Página Principal**: `app/(admin)/admin/page.tsx`
- **Protección Doble**:
  1. Requiere autenticación
  2. Requiere permisos de administrador (`session.user?.isAdmin`)
- **Redirección**: A `/login` si no autenticado, a `/` si no es admin

### 2.2 Layout del Panel de Administración

#### Header Principal
- **Logo y Título**: "Admin" con icono de BarChart3
- **Navegación Horizontal** (desktop):
  - Canchas (`/admin/canchas`)
  - Turnos (`/admin/turnos`)
  - Usuarios (`/admin/usuarios`)
  - Estadísticas (`/admin/estadisticas`)
  - Productos (`/admin/productos`)

#### Navegación Móvil
- **Layout Responsivo**: Navegación inferior en dispositivos móviles
- **Iconos y Etiquetas**: Mismas secciones con iconos Lucide
- **Data Testids**: Elementos identificados para testing

#### Información del Usuario
- **Avatar Circular**: Iniciales del usuario administrador
- **Gradiente**: Azul (blue-600 a blue-700)
- **Información**: Nombre/email del usuario logueado

### 2.3 Dashboard Principal de Admin

#### Archivo: `app/(admin)/admin/page.tsx`

##### Funcionalidades Principales
1. **Gestión de Turnos**
   - Lista completa de reservas
   - Filtros por estado, fecha, usuario
   - Búsqueda por términos
   - Estados: confirmado, pendiente, cancelado, completado

2. **Gestión de Pagos**
   - Estados de pago: pagado, pendiente, parcial
   - Pagos individuales por jugador
   - Seguimiento de extras y servicios adicionales

3. **Sistema de Extras**
   - Tipos: pelotas, bebidas, paletas, alquiler raqueta, toallas, snacks
   - Asignación por jugador o grupal
   - Gestión de costos adicionales

##### Interfaces de Datos
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

interface Extra {
  id: string
  type: 'pelotas' | 'bebida' | 'paleta'
  name: string
  cost: number
  assignedTo: 'all' | 'player1' | 'player2' | 'player3' | 'player4'
}
```

##### Estados de la Aplicación
- **Filtros**: Búsqueda, estado, fecha
- **Modales**: Gestión de extras, filtros avanzados
- **Expansión**: Detalles de reservas y extras
- **Carga**: Estados de loading para operaciones asíncronas

### 2.4 Secciones Administrativas

#### Canchas (`/admin/canchas`)
- Gestión de canchas disponibles
- Configuración de precios
- Estados de mantenimiento

#### Turnos (`/admin/turnos`)
- Vista completa de reservas
- Gestión de estados
- Confirmaciones y cancelaciones

#### Usuarios (`/admin/usuarios`)
- Administración de usuarios
- Permisos y roles
- Historial de actividad

#### Estadísticas (`/admin/estadisticas`)
- Reportes de ocupación
- Ingresos por período
- Métricas de uso

#### Productos (`/admin/productos`)
- Gestión de extras y servicios
- Inventario y precios
- Configuración de productos

---

## 3. Diferencias Clave entre Interfaces

### 3.1 Dashboard de Usuario vs Panel Admin

| Aspecto | Dashboard Usuario | Panel Admin |
|---------|-------------------|-------------|
| **Propósito** | Reservar y gestionar turnos propios | Administrar todo el sistema |
| **Navegación** | Tabs simples (Inicio, Mis Turnos) | Navegación completa por secciones |
| **Datos** | Solo reservas del usuario | Todas las reservas del sistema |
| **Permisos** | Usuario autenticado | Administrador verificado |
| **Funciones** | Crear/cancelar reservas | CRUD completo + reportes |
| **UI** | Enfocada en experiencia de usuario | Enfocada en gestión y control |

### 3.2 Protecciones de Seguridad

#### Dashboard de Usuario
- Archivos marcados como PROTEGIDOS
- Proceso formal para modificaciones
- Crítico para experiencia del usuario final

#### Panel de Admin
- Verificación de permisos de administrador
- Acceso a datos sensibles del sistema
- Funcionalidades de gestión completa

---

## 4. Tecnologías y Dependencias

### 4.1 Framework y Librerías
- **Next.js 14**: App Router, Server Components
- **React 18**: Hooks, Context API
- **TypeScript**: Tipado estricto
- **Tailwind CSS**: Estilos utilitarios
- **shadcn/ui**: Componentes de UI
- **Lucide React**: Iconografía

### 4.2 Autenticación y Estado
- **NextAuth.js**: Sistema de autenticación
- **Context API**: Estado global (AppStateProvider)
- **Custom Hooks**: useAuth, useCourtPrices

### 4.3 Base de Datos y APIs
- **Prisma**: ORM para base de datos
- **API Routes**: Endpoints RESTful
- **Middleware**: Protección de rutas

---

## 5. Recomendaciones de Mantenimiento

### 5.1 Dashboard de Usuario
- ⚠️ **NO MODIFICAR** sin autorización explícita
- Seguir proceso formal de revisión
- Mantener compatibilidad con usuarios existentes
- Testing exhaustivo antes de cambios

### 5.2 Panel de Administración
- ✅ **MODIFICABLE** según necesidades
- Agregar nuevas funcionalidades administrativas
- Mejorar reportes y estadísticas
- Optimizar flujos de trabajo admin

### 5.3 Seguridad
- Mantener verificaciones de permisos
- Validar datos en cliente y servidor
- Implementar logs de auditoría
- Proteger endpoints sensibles

---

## 6. Testing y Validación

### 6.1 Tests E2E Existentes
- `tests/e2e/admin.spec.ts`: Funcionalidades básicas admin
- `tests/e2e/admin-navegacion.spec.ts`: Navegación del panel
- `tests/e2e/admin-usuarios.spec.ts`: Gestión de usuarios
- `tests/e2e/admin-gestion-canchas.spec.ts`: Gestión de canchas

### 6.2 Cobertura de Testing
- Autenticación y autorización
- Navegación entre secciones
- Funcionalidades CRUD
- Responsividad móvil
- Protección de rutas

---

*Reporte generado el: $(date)*
*Versión del proyecto: Turnero de Pádel v1.0*