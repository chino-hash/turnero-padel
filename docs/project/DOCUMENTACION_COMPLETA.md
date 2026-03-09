# 📋 Documentación Completa - Sistema de Turnero de Pádel

## 📖 Índice

1. [Información General](#información-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Base de Datos](#base-de-datos)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [APIs y Servicios](#apis-y-servicios)
8. [Componentes Principales](#componentes-principales)
9. [Hooks Personalizados](#hooks-personalizados)
10. [Configuración y Despliegue](#configuración-y-despliegue)
11. [Testing](#testing)
12. [Guías de Uso](#guías-de-uso)
13. [Troubleshooting](#troubleshooting)
14. [Roadmap](#roadmap)

---

## 📋 Información General

### Propósito
Sistema web completo para la gestión de reservas de canchas de pádel, diseñado para facilitar la administración de turnos, pagos y usuarios tanto para administradores como para jugadores.

### Funcionalidades Principales

#### Para Usuarios
- 🔐 **Autenticación segura** con Google OAuth
- 📅 **Reserva de turnos** con selección de horarios disponibles
- 👥 **Gestión de jugadores** por reserva
- 💰 **Sistema de pagos** con seña y pago completo
- 📱 **Interfaz responsive** para móviles y desktop
- 🌙 **Modo oscuro** para mejor experiencia
- 📊 **Historial de reservas** con estado en tiempo real

#### Para Administradores
- 👑 **Panel de administración** completo
- 🏟️ **Gestión de canchas** y configuración de precios
- 📋 **Administración de turnos** con filtros avanzados
- 💳 **Corroboración de pagos** y gestión financiera
- 📊 **Reportes y estadísticas** de uso
- ⚙️ **Configuración del sistema** global

### Características Técnicas
- ⚡ **Tiempo real** con Server-Sent Events (SSE)
- 🔒 **Seguridad robusta** con middleware de autenticación
- 📱 **Progressive Web App** (PWA) ready
- 🎨 **UI moderna** con Tailwind CSS y Shadcn/ui
- 🧪 **Testing completo** E2E e integración
- 🚀 **Despliegue automático** en Vercel

---

## 🏗️ Arquitectura del Sistema

### Patrón Arquitectónico
El sistema sigue una **arquitectura en capas** (Layered Architecture) con separación clara de responsabilidades:

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI["🎨 UI Components"]
        Pages["📄 Pages & Routes"]
        Hooks["🎣 Custom Hooks"]
        State["🔄 State Management"]
    end
    
    subgraph "API Layer"
        AuthAPI["🔐 Auth API"]
        BookingAPI["📅 Booking API"]
        CourtAPI["🏟️ Court API"]
        SlotAPI["⏰ Slot API"]
    end
    
    subgraph "Business Layer"
        AdminSys["👑 Admin System"]
        BookingSvc["📋 Booking Service"]
        AuthSvc["🔐 Auth Service"]
        PricingSvc["💰 Pricing Service"]
    end
    
    subgraph "Data Layer"
        Prisma["🗄️ Prisma ORM"]
        Cache["⚡ Cache Layer"]
    end
    
    subgraph "Database Layer"
        PostgreSQL["🐘 PostgreSQL"]
        Tables["📊 Tables & Relations"]
    end
    
    subgraph "External Services"
        GoogleOAuth["🔍 Google OAuth"]
        EmailSvc["📧 Email Service"]
        PaymentGW["💳 Payment Gateway"]
    end
    
    subgraph "Infrastructure"
        Docker["🐳 Docker"]
        Vercel["▲ Vercel"]
        Monitoring["📊 Monitoring"]
    end
    
    UI --> Pages
    Pages --> Hooks
    Hooks --> State
    
    Pages --> AuthAPI
    Pages --> BookingAPI
    Pages --> CourtAPI
    Pages --> SlotAPI
    
    AuthAPI --> AuthSvc
    BookingAPI --> BookingSvc
    CourtAPI --> AdminSys
    SlotAPI --> PricingSvc
    
    BookingSvc --> Prisma
    AuthSvc --> Prisma
    AdminSys --> Prisma
    PricingSvc --> Cache
    
    Prisma --> PostgreSQL
    Cache --> PostgreSQL
    PostgreSQL --> Tables
    
    AuthSvc --> GoogleOAuth
    BookingSvc --> EmailSvc
    PricingSvc --> PaymentGW
    
    Vercel --> Docker
    Docker --> Monitoring
```

### Flujos de Datos Principales

#### 1. Autenticación de Usuario
```
Usuario → Google OAuth → NextAuth → JWT Token → Session → UI Update
```

#### 2. Creación de Reserva
```
Formulario → Validación → API → BookingService → Prisma → PostgreSQL
```

#### 3. Consulta de Disponibilidad
```
Filtros → SlotAPI → Cache Check → PricingService → Respuesta JSON
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: Shadcn/ui
- **Iconos**: Lucide React
- **Estado**: React Context + Custom Hooks
- **Formularios**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL (Neon)
- **Autenticación**: NextAuth.js
- **Validación**: Zod
- **Tiempo Real**: Server-Sent Events

### DevOps & Tools
- **Despliegue**: Vercel
- **Control de Versiones**: Git
- **Testing**: Playwright (E2E)
- **Linting**: ESLint + Prettier
- **Tipado**: TypeScript estricto
- **Monitoreo**: Vercel Analytics

### Servicios Externos
- **OAuth**: Google OAuth 2.0
- **Base de Datos**: Neon PostgreSQL
- **CDN**: Vercel Edge Network
- **DNS**: Vercel Domains

---

## 📁 Estructura del Proyecto

```
turnero-padel/
├── 📱 app/                    # Next.js App Router
│   ├── (admin)/              # Rutas de administración
│   │   └── admin/
│   │       ├── page.tsx      # Panel principal de admin
│   │       └── layout.tsx    # Layout específico de admin
│   ├── (protected)/          # Rutas protegidas
│   │   └── dashboard/
│   │       └── page.tsx      # Dashboard de usuario
│   ├── api/                  # API Routes
│   │   ├── auth/             # Endpoints de autenticación
│   │   ├── bookings/         # Endpoints de reservas
│   │   ├── courts/           # Endpoints de canchas
│   │   ├── slots/            # Endpoints de horarios
│   │   └── admin/            # Endpoints de administración
│   ├── auth/                 # Páginas de autenticación
│   │   ├── signin/           # Página de login
│   │   └── error/            # Página de errores de auth
│   ├── globals.css           # Estilos globales
│   ├── layout.tsx            # Layout raíz
│   ├── page.tsx              # Página de inicio
│   └── middleware.ts         # Middleware de autenticación
├── 🧩 components/            # Componentes React
│   ├── admin/               # Componentes de administración
│   │   ├── AdminTurnos.tsx  # Gestión de turnos
│   │   ├── AdminStats.tsx   # Estadísticas
│   │   └── AdminSettings.tsx # Configuración
│   ├── auth/                # Componentes de autenticación
│   │   ├── ProtectedRoute.tsx
│   │   ├── LoginForm.tsx
│   │   └── AuthProvider.tsx
│   ├── providers/           # Context Providers
│   │   ├── AppStateProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ToastProvider.tsx
│   ├── ui/                  # Componentes base (Shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── TurneroApp.tsx       # Componente principal
│   ├── MisTurnos.tsx        # Gestión de turnos del usuario
│   ├── HomeSection.tsx      # Sección de reservas
│   └── CalendarModal.tsx    # Modal de calendario
├── 🎣 hooks/                 # Custom React Hooks
│   ├── useAuth.ts           # Hook de autenticación
│   ├── useBookings.ts       # Hook de reservas
│   ├── useSlots.ts          # Hook de horarios
│   ├── useCourtPrices.ts    # Hook de precios
│   ├── useRealTimeUpdates.ts # Hook de tiempo real
│   └── useUserBookings.ts   # Hook de reservas de usuario
├── 📚 lib/                   # Utilidades y servicios
│   ├── services/            # Lógica de negocio
│   │   ├── BookingService.ts
│   │   ├── UserService.ts
│   │   ├── CourtService.ts
│   │   └── crud-service.ts
│   ├── repositories/        # Acceso a datos
│   │   ├── BookingRepository.ts
│   │   ├── UserRepository.ts
│   │   └── CourtRepository.ts
│   ├── validations/         # Esquemas de validación
│   │   ├── booking.ts
│   │   ├── user.ts
│   │   ├── common.ts
│   │   └── schemas.ts
│   ├── utils/               # Utilidades generales
│   │   ├── array-utils.ts
│   │   ├── date-utils.ts
│   │   ├── error-handler.ts
│   │   └── format-utils.ts
│   ├── database/            # Configuración de BD
│   │   └── neon-config.ts
│   ├── auth.ts              # Configuración de NextAuth
│   └── utils.ts             # Utilidades de Tailwind
├── 🗄️ prisma/               # Esquema de BD y migraciones
│   ├── schema.prisma        # Esquema de la base de datos
│   ├── migrations/          # Migraciones de BD
│   └── seed.ts              # Datos de prueba
├── 🧪 tests/                # Testing E2E e integración
│   ├── e2e/                # Tests end-to-end
│   │   ├── auth.spec.ts
│   │   ├── booking.spec.ts
│   │   ├── admin.spec.ts
│   │   └── components.spec.ts
│   └── __tests__/           # Tests unitarios
│       └── app/api/         # Tests de APIs
├── 📋 types/                # Definiciones TypeScript
│   ├── types.ts             # Tipos principales
│   ├── auth.ts              # Tipos de autenticación
│   └── api.ts               # Tipos de API
├── 📖 docs/                 # Documentación
│   ├── architecture/        # Documentación de arquitectura
│   ├── apis/               # Documentación de APIs
│   ├── hooks/              # Documentación de hooks
│   └── services/           # Documentación de servicios
├── 🔧 scripts/              # Scripts de utilidad
│   ├── add-admin.js        # Script para agregar administradores
│   ├── test-migration.js   # Script de verificación
│   └── setup-db.js         # Script de configuración de BD
├── .env                     # Variables de entorno
├── .env.example             # Ejemplo de variables de entorno
├── package.json             # Dependencias del proyecto
├── tsconfig.json            # Configuración de TypeScript
├── tailwind.config.js       # Configuración de Tailwind
├── next.config.js           # Configuración de Next.js
├── playwright.config.ts     # Configuración de Playwright
└── README.md                # Documentación básica
```

---

## 🗄️ Base de Datos

### Esquema de Base de Datos

El sistema utiliza **PostgreSQL** como base de datos principal con **Prisma** como ORM. El esquema está diseñado para soportar:

#### Modelos Principales

##### 👤 User (Usuarios)
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  phone         String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relaciones
  accounts      Account[]
  sessions      Session[]
  bookings      Booking[]
  processedPayments Payment[] @relation("ProcessedBy")
}
```

##### 🏟️ Court (Canchas)
```prisma
model Court {
  id              String   @id @default(cuid())
  name            String
  description     String?
  basePrice       Int      // Precio en centavos
  priceMultiplier Float    @default(1.0)
  features        String   // JSON array de características
  operatingHours  String   // JSON con horarios de operación
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relaciones
  bookings        Booking[]
}
```

##### 📅 Booking (Reservas)
```prisma
model Booking {
  id                String        @id @default(cuid())
  courtId           String
  userId            String
  bookingDate       DateTime
  startTime         String        // Formato HH:MM
  endTime           String        // Formato HH:MM
  durationMinutes   Int
  totalPrice        Int           // Precio en centavos
  depositAmount     Int           @default(0)
  status            BookingStatus @default(PENDING)
  paymentStatus     PaymentStatus @default(PENDING)
  paymentMethod     PaymentMethod?
  notes             String?
  cancellationReason String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  cancelledAt       DateTime?
  
  // Relaciones
  court             Court         @relation(fields: [courtId], references: [id])
  user              User          @relation(fields: [userId], references: [id])
  players           BookingPlayer[]
  payments          Payment[]
}
```

##### 👥 BookingPlayer (Jugadores por Reserva)
```prisma
model BookingPlayer {
  id           String    @id @default(cuid())
  bookingId    String
  playerName   String
  playerPhone  String?
  playerEmail  String?
  hasPaid      Boolean   @default(false)
  paidAmount   Int       @default(0)
  position     Int?
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?
  
  // Relaciones
  booking      Booking   @relation(fields: [bookingId], references: [id])
  payments     Payment[]
}
```

##### 💰 Payment (Pagos)
```prisma
model Payment {
  id              String         @id @default(cuid())
  bookingId       String
  playerId        String?
  processedById   String?
  amount          Int            // Monto en centavos
  paymentMethod   PaymentMethod
  paymentType     PaymentType    @default(PAYMENT)
  referenceNumber String?
  notes           String?
  status          String         @default("completed")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?
  
  // Relaciones
  booking         Booking        @relation(fields: [bookingId], references: [id])
  player          BookingPlayer? @relation(fields: [playerId], references: [id])
  processedBy     User?          @relation("ProcessedBy", fields: [processedById], references: [id])
}
```

##### ⚙️ SystemSetting (Configuración del Sistema)
```prisma
model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

##### 👑 AdminWhitelist (Lista de Administradores)
```prisma
model AdminWhitelist {
  id        String   @id @default(cuid())
  email     String   @unique
  isActive  Boolean  @default(true)
  addedBy   String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Administradores Activos:**
- `agustinagus05@gmail.com` - Administrador principal con permisos completos
  - Acceso al panel de administración
  - Gestión de reservas y canchas
  - Agregar/remover administradores
  - Configuración del sistema

**Scripts de Gestión de Administradores:**
- `scripts/quick-add-admin.js` - Agregar administrador específico
- `scripts/add-admin.js` - Agregar administrador con validaciones
- `scripts/verify-admin.js` - Verificar permisos de administrador
- `scripts/add-admin-direct.js` - Agregar administrador directamente a la BD

#### Enums

```prisma
enum Role {
  USER
  ADMIN
}

enum BookingStatus {
  PENDING      // Pendiente de confirmación
  CONFIRMED    // Confirmada
  ACTIVE       // En curso
  COMPLETED    // Completada
  CANCELLED    // Cancelada
}

enum PaymentStatus {
  PENDING      // Sin pagar
  DEPOSIT_PAID // Seña pagada
  FULLY_PAID   // Totalmente pagado
}

enum PaymentMethod {
  CASH         // Efectivo
  BANK_TRANSFER // Transferencia bancaria
  CARD         // Tarjeta
}

enum PaymentType {
  PAYMENT      // Pago
  REFUND       // Reembolso
  ADJUSTMENT   // Ajuste
}
```

### Relaciones y Índices

El esquema incluye índices optimizados para:
- Consultas por usuario y fecha
- Búsquedas por estado de reserva
- Filtros por método de pago
- Consultas de disponibilidad de canchas
- Reportes administrativos

---

## 🔐 Autenticación y Autorización

### Sistema de Autenticación

El sistema utiliza **NextAuth.js** con **Google OAuth 2.0** para proporcionar autenticación segura y sin fricción.

#### Configuración de NextAuth

```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/database/neon-config'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 días
    updateAge: 4 * 60 * 60,   // 4 horas
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Verificar que el email esté verificado
      if (account?.provider === 'google' && profile?.email_verified) {
        // Verificar si es administrador
        const adminUser = await prisma.adminWhitelist.findUnique({
          where: { email: user.email!, isActive: true }
        })
        
        if (adminUser) {
          console.log(`🔑 Admin access granted: ${user.email}`)
        }
        
        return true
      }
      return false
    },
    
    async jwt({ token, user, trigger }) {
      if (user) {
        // Verificar rol de administrador
        const adminUser = await prisma.adminWhitelist.findUnique({
          where: { email: user.email!, isActive: true }
        })
        
        token.role = adminUser ? 'ADMIN' : 'USER'
        token.isAdmin = !!adminUser
      }
      
      // Renovar información en actualizaciones
      if (trigger === 'update' && token.email) {
        const adminUser = await prisma.adminWhitelist.findUnique({
          where: { email: token.email, isActive: true }
        })
        
        token.role = adminUser ? 'ADMIN' : 'USER'
        token.isAdmin = !!adminUser
      }
      
      return token
    },
    
    async session({ session, token }) {
      // Propagar datos del token a la sesión
      session.user.role = token.role
      session.user.isAdmin = token.isAdmin
      return session
    }
  }
}
```

#### Middleware de Protección de Rutas

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    
    // Rutas de administrador
    const adminRoutes = ['/admin']
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
    
    // Verificar acceso de administrador
    if (isAdminRoute && !token?.isAdmin) {
      return NextResponse.redirect(new URL('/auth/signin?error=AccessDenied', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Rutas públicas
        const publicRoutes = ['/', '/auth/signin', '/auth/error']
        if (publicRoutes.includes(pathname)) return true
        
        // Rutas protegidas requieren token
        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Sistema de Roles

#### Roles Disponibles
- **USER**: Usuario estándar con acceso a reservas
- **ADMIN**: Administrador con acceso completo al sistema

#### Verificación de Permisos

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isAdmin: session?.user?.isAdmin || false,
    role: session?.user?.role || 'USER',
    loading: status === 'loading'
  }
}
```

#### Componente de Ruta Protegida

```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  fallback
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!isAuthenticated) {
    return <LoginPrompt />
  }
  
  if (requireAdmin && !isAdmin) {
    return fallback || <AccessDenied />
  }
  
  return <>{children}</>
}
```

---

## 🌐 APIs y Servicios

### Estructura de APIs

El sistema utiliza **Next.js API Routes** para crear una API RESTful robusta y bien estructurada.

#### Endpoints Principales

##### 🔐 Autenticación (`/api/auth`)
- `GET /api/auth/session` - Obtener sesión actual
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `GET /api/auth/providers` - Obtener proveedores disponibles

##### 📅 Reservas (`/api/bookings`)
- `GET /api/bookings` - Listar todas las reservas (admin)
- `POST /api/bookings` - Crear nueva reserva
- `GET /api/bookings/user` - Obtener reservas del usuario
- `GET /api/bookings/[id]` - Obtener reserva específica
- `PUT /api/bookings/[id]` - Actualizar reserva
- `DELETE /api/bookings/[id]` - Cancelar reserva
- `POST /api/bookings/[id]/payment` - Procesar pago

##### 🏟️ Canchas (`/api/courts`)
- `GET /api/courts` - Listar canchas disponibles
- `POST /api/courts` - Crear nueva cancha (admin)
- `GET /api/courts/[id]` - Obtener cancha específica
- `PUT /api/courts/[id]` - Actualizar cancha (admin)
- `DELETE /api/courts/[id]` - Eliminar cancha (admin)

##### ⏰ Horarios (`/api/slots`)
- `GET /api/slots` - Obtener horarios disponibles
- `GET /api/slots/availability` - Verificar disponibilidad
- `POST /api/slots/bulk-update` - Actualización masiva (admin)

##### 👑 Administración (`/api/admin`)
- `GET /api/admin/stats` - Estadísticas del sistema
- `GET /api/admin/users` - Gestión de usuarios
- `POST /api/admin/whitelist` - Gestionar administradores
- `GET /api/admin/reports` - Generar reportes

### Servicios de Negocio

#### BookingService

Servicio principal para la gestión de reservas:

```typescript
// lib/services/BookingService.ts
export class BookingService {
  private repository: BookingRepository
  
  constructor(prismaClient?: PrismaClient) {
    this.repository = new BookingRepository(prismaClient || prisma)
  }
  
  // Crear nueva reserva
  async createBooking(data: CreateBookingInput): Promise<ApiResponse<BookingWithDetails>> {
    try {
      // Validar disponibilidad
      const isAvailable = await this.checkAvailability({
        courtId: data.courtId,
        date: data.bookingDate,
        startTime: data.startTime,
        endTime: data.endTime
      })
      
      if (!isAvailable) {
        return createErrorResponse('El horario no está disponible', 409)
      }
      
      // Crear reserva
      const booking = await this.repository.create({
        ...data,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      })
      
      return createSuccessResponse(this.transformBookingData(booking))
    } catch (error) {
      return handleError(error)
    }
  }
  
  // Obtener reservas de usuario
  async getUserBookings(userId: string): Promise<ApiResponse<BookingWithDetails[]>> {
    try {
      const bookings = await this.repository.findByUserId(userId)
      const transformedBookings = bookings.map(this.transformBookingData)
      
      return createSuccessResponse(transformedBookings)
    } catch (error) {
      return handleError(error)
    }
  }
  
  // Verificar disponibilidad
  async checkAvailability(input: CheckAvailabilityInput): Promise<boolean> {
    const conflictingBookings = await this.repository.findConflicting({
      courtId: input.courtId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      excludeStatuses: [BookingStatus.CANCELLED]
    })
    
    return conflictingBookings.length === 0
  }
  
  // Cancelar reserva
  async cancelBooking(bookingId: string, reason?: string): Promise<ApiResponse<BookingWithDetails>> {
    try {
      const booking = await this.repository.update(bookingId, {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date()
      })
      
      return createSuccessResponse(this.transformBookingData(booking))
    } catch (error) {
      return handleError(error)
    }
  }
}
```

#### Patrón Repository

Cada servicio utiliza el patrón Repository para abstraer el acceso a datos:

```typescript
// lib/repositories/BookingRepository.ts
export class BookingRepository {
  constructor(private prisma: PrismaClient) {}
  
  async create(data: BookingCreateInput): Promise<BookingWithRelations> {
    return this.prisma.booking.create({
      data: {
        ...data,
        players: {
          create: data.players || []
        }
      },
      include: this.getIncludeRelations()
    })
  }
  
  async findByUserId(userId: string): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      where: { userId },
      include: this.getIncludeRelations(),
      orderBy: { bookingDate: 'desc' }
    })
  }
  
  private getIncludeRelations() {
    return {
      court: true,
      user: true,
      players: { orderBy: { position: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } }
    }
  }
}
```

### Validación de Datos

Todos los endpoints utilizan **Zod** para validación de entrada:

```typescript
// lib/validations/booking.ts
import { z } from 'zod'

export const createBookingSchema = z.object({
  courtId: z.string().cuid(),
  bookingDate: z.string().datetime(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  players: z.array(z.object({
    playerName: z.string().min(1).max(100),
    playerPhone: z.string().optional(),
    playerEmail: z.string().email().optional()
  })).min(1).max(4),
  notes: z.string().max(500).optional()
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
```

### Manejo de Errores

Sistema centralizado de manejo de errores:

```typescript
// lib/utils/error-handler.ts
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export const handleError = (error: unknown): ApiResponse<never> => {
  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, 400)
  }
  
  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, 404)
  }
  
  console.error('Unexpected error:', error)
  return createErrorResponse('Internal server error', 500)
}
```

---

## 🧩 Componentes Principales

### TurneroApp

Componente principal que orquesta toda la aplicación de usuario:

```typescript
// components/TurneroApp.tsx
const TurneroApp: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState<'home' | 'bookings'>('home')
  
  if (!isAuthenticated) {
    return <LoginPrompt />
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
        <Header 
          user={user}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        
        <main className="container mx-auto px-4 py-8">
          {currentView === 'home' && (
            <HomeSection onNavigateToBookings={() => setCurrentView('bookings')} />
          )}
          
          {currentView === 'bookings' && (
            <MisTurnos onBack={() => setCurrentView('home')} />
          )}
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
```

### AdminTurnos

Componente de administración de turnos con funcionalidades avanzadas:

```typescript
// components/AdminTurnos.tsx
const AdminTurnos: React.FC = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filters, setFilters] = useState<BookingFilters>({})
  const [loading, setLoading] = useState(true)
  
  // Cargar reservas con filtros
  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bookings?' + new URLSearchParams(filters))
      const data = await response.json()
      setBookings(data.data || [])
    } catch (error) {
      console.error('Error cargando reservas:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por usuario..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            
            <Select
              value={filters.status || ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchBookings}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de reservas */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Cargando reservas...</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No se encontraron reservas</p>
            </CardContent>
          </Card>
        ) : (
          bookings.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onUpdate={fetchBookings}
              showAdminActions
            />
          ))
        )}
      </div>
    </div>
  )
}
```

### MisTurnos

Componente para gestión de turnos del usuario:

```typescript
// components/MisTurnos.tsx
interface MisTurnosProps {
  isVisible: boolean
  onBack: () => void
  onStartBooking: () => void
}

const MisTurnos: React.FC<MisTurnosProps> = ({ isVisible, onBack, onStartBooking }) => {
  const { bookings, loading, refetch } = useUserBookings()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  
  // Separar reservas actuales y pasadas
  const currentBookings = useMemo(() => 
    bookings.filter(booking => 
      new Date(booking.bookingDate) >= new Date() && 
      booking.status !== 'CANCELLED'
    ), [bookings]
  )
  
  const pastBookings = useMemo(() => 
    bookings.filter(booking => 
      new Date(booking.bookingDate) < new Date() || 
      booking.status === 'CANCELLED'
    ), [bookings]
  )
  
  const handleCancelBooking = async (booking: BookingWithDetails) => {
    setSelectedBooking(booking)
    setCancelModalOpen(true)
  }
  
  const confirmCancellation = async (reason: string) => {
    if (!selectedBooking) return
    
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      
      if (response.ok) {
        await refetch()
        setCancelModalOpen(false)
        setSelectedBooking(null)
      }
    } catch (error) {
      console.error('Error cancelando reserva:', error)
    }
  }
  
  return (
    <div className={`transition-all duration-500 ${
      isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-2xl font-bold">Mis Turnos</h2>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-8">
          {/* Turnos actuales */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Próximos Turnos ({currentBookings.length})
            </h3>
            
            {currentBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">No tienes turnos próximos</p>
                  <Button onClick={onStartBooking}>
                    <Plus className="w-4 h-4 mr-2" />
                    Reservar Turno
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {currentBookings.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => handleCancelBooking(booking)}
                    showCancelButton
                  />
                ))}
              </div>
            )}
          </section>
          
          {/* Historial */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Historial ({pastBookings.length})
            </h3>
            
            <div className="grid gap-4">
              {pastBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  showHistory
                />
              ))}
            </div>
          </section>
        </div>
      )}
      
      {/* Modal de cancelación */}
      <CancelBookingModal
        isOpen={cancelModalOpen}
        booking={selectedBooking}
        onConfirm={confirmCancellation}
        onCancel={() => {
          setCancelModalOpen(false)
          setSelectedBooking(null)
        }}
      />
    </div>
  )
}
```

### Componentes de UI Reutilizables

El sistema utiliza **Shadcn/ui** para componentes base consistentes:

```typescript
// components/ui/booking-card.tsx
interface BookingCardProps {
  booking: BookingWithDetails
  onCancel?: () => void
  onUpdate?: () => void
  showAdminActions?: boolean
  showCancelButton?: boolean
  showHistory?: boolean
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onUpdate,
  showAdminActions,
  showCancelButton,
  showHistory
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.court.name}</CardTitle>
            <p className="text-sm text-gray-600">
              {formatDate(booking.bookingDate)} • {booking.startTime} - {booking.endTime}
            </p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información de jugadores */}
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Jugadores ({booking.players.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {booking.players.map(player => (
              <div key={player.id} className="flex items-center justify-between text-sm">
                <span>{player.playerName}</span>
                <Badge variant={player.hasPaid ? 'success' : 'secondary'}>
                  {player.hasPaid ? 'Pagado' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        {/* Información de pago */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div>
            <p className="text-sm text-gray-600">Total: ${booking.totalPrice / 100}</p>
            <p className="text-sm text-gray-600">Seña: ${booking.depositAmount / 100}</p>
          </div>
          
          <div className="flex gap-2">
            {showCancelButton && (
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            )}
            
            {showAdminActions && (
              <>
                <Button variant="outline" size="sm">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Pagos
                </Button>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🎣 Hooks Personalizados

### useAuth

Hook principal para manejo de autenticación:

```typescript
// hooks/useAuth.ts
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export const useAuth = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const handleSignIn = async (callbackUrl?: string) => {
    await signIn('google', { callbackUrl: callbackUrl || '/dashboard' })
  }
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }
  
  const requireAuth = (callback: () => void) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    callback()
  }
  
  const requireAdmin = (callback: () => void) => {
    if (!session?.user?.isAdmin) {
      router.push('/auth/signin?error=AccessDenied')
      return
    }
    callback()
  }
  
  return {
    // Estado
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isAdmin: session?.user?.isAdmin || false,
    role: session?.user?.role || 'USER',
    loading: status === 'loading',
    
    // Acciones
    signIn: handleSignIn,
    signOut: handleSignOut,
    requireAuth,
    requireAdmin
  }
}
```

### useUserBookings

Hook para gestión de reservas del usuario:

```typescript
// hooks/useUserBookings.ts
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRealTimeUpdates } from './useRealTimeUpdates'

export const useUserBookings = () => {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Configurar actualizaciones en tiempo real
  useRealTimeUpdates({
    endpoint: '/api/bookings/user/updates',
    onUpdate: (data) => {
      if (data.type === 'booking_updated') {
        setBookings(prev => prev.map(booking => 
          booking.id === data.bookingId 
            ? { ...booking, ...data.changes }
            : booking
        ))
      }
    },
    enabled: !!session?.user
  })
  
  const fetchBookings = useCallback(async () => {
    if (!session?.user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bookings/user')
      
      if (!response.ok) {
        throw new Error('Error cargando reservas')
      }
      
      const data = await response.json()
      setBookings(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [session?.user])
  
  // Cargar reservas al montar el componente
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])
  
  const createBooking = async (bookingData: CreateBookingInput) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error creando reserva')
      }
      
      await fetchBookings() // Refrescar lista
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  
  const cancelBooking = async (bookingId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) {
        throw new Error('Error cancelando reserva')
      }
      
      await fetchBookings() // Refrescar lista
    } catch (error) {
      throw error
    }
  }
  
  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    cancelBooking
  }
}
```

### useSlots

Hook para gestión de horarios disponibles:

```typescript
// hooks/useSlots.ts
import { useState, useEffect, useMemo } from 'react'
import { useCourtPrices } from './useCourtPrices'

interface UseSlots {
  courtId: string
  date: string
  enabled?: boolean
}

export const useSlots = ({ courtId, date, enabled = true }: UseSlots) => {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { prices, loading: pricesLoading } = useCourtPrices(courtId)
  
  const fetchSlots = async () => {
    if (!enabled || !courtId || !date) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ courtId, date })
      const response = await fetch(`/api/slots?${params}`)
      
      if (!response.ok) {
        throw new Error('Error cargando horarios')
      }
      
      const data = await response.json()
      setSlots(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchSlots()
  }, [courtId, date, enabled])
  
  // Calcular slots con precios
  const slotsWithPrices = useMemo(() => {
    if (!prices || pricesLoading) return slots
    
    return slots.map(slot => ({
      ...slot,
      price: calculateSlotPrice(slot, prices),
      formattedPrice: formatPrice(calculateSlotPrice(slot, prices))
    }))
  }, [slots, prices, pricesLoading])
  
  // Agrupar slots por disponibilidad
  const groupedSlots = useMemo(() => {
    const available = slotsWithPrices.filter(slot => slot.available)
    const unavailable = slotsWithPrices.filter(slot => !slot.available)
    
    return { available, unavailable }
  }, [slotsWithPrices])
  
  return {
    slots: slotsWithPrices,
    groupedSlots,
    loading: loading || pricesLoading,
    error,
    refetch: fetchSlots
  }
}

// Hook optimizado para múltiples canchas
export const useMultipleSlots = (requests: UseSlots[]) => {
  const [results, setResults] = useState<Record<string, TimeSlot[]>>({})
  const [loading, setLoading] = useState(false)
  
  const fetchMultipleSlots = async () => {
    const enabledRequests = requests.filter(req => req.enabled !== false)
    if (enabledRequests.length === 0) return
    
    setLoading(true)
    
    try {
      const promises = enabledRequests.map(async (req) => {
        const params = new URLSearchParams({ 
          courtId: req.courtId, 
          date: req.date 
        })
        const response = await fetch(`/api/slots?${params}`)
        const data = await response.json()
        return { key: `${req.courtId}-${req.date}`, slots: data.data || [] }
      })
      
      const responses = await Promise.all(promises)
      const newResults = responses.reduce((acc, { key, slots }) => {
        acc[key] = slots
        return acc
      }, {} as Record<string, TimeSlot[]>)
      
      setResults(newResults)
    } catch (error) {
      console.error('Error cargando múltiples horarios:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchMultipleSlots()
  }, [JSON.stringify(requests)])
  
  return { results, loading, refetch: fetchMultipleSlots }
}
```

### useRealTimeUpdates

Hook para actualizaciones en tiempo real con Server-Sent Events:

```typescript
// hooks/useRealTimeUpdates.ts
import { useEffect, useRef } from 'react'

interface UseRealTimeUpdatesOptions {
  endpoint: string
  onUpdate: (data: any) => void
  onError?: (error: Event) => void
  enabled?: boolean
  reconnectInterval?: number
}

export const useRealTimeUpdates = ({
  endpoint,
  onUpdate,
  onError,
  enabled = true,
  reconnectInterval = 5000
}: UseRealTimeUpdatesOptions) => {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const connect = () => {
    if (!enabled) return
    
    // Cerrar conexión existente
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    try {
      const eventSource = new EventSource(endpoint)
      eventSourceRef.current = eventSource
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onUpdate(data)
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        onError?.(error)
        
        // Reconectar automáticamente
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, reconnectInterval)
      }
    } catch (error) {
      console.error('Error creating SSE connection:', error)
    }
  }
  
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }
  
  useEffect(() => {
    connect()
    return disconnect
  }, [endpoint, enabled])
  
  return { disconnect }
}
```

---

## ⚙️ Configuración y Despliegue

### Variables de Entorno

El sistema requiere las siguientes variables de entorno:

```bash
# .env
# Base de Datos
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Administradores del Sistema
ADMIN_EMAILS="agustinagus05@gmail.com"  # Administrador principal activo

# Configuración adicional
NODE_ENV="development"
VERCEL_URL="your-vercel-url" # Solo en producción
```

**Nota**: El sistema de administradores ahora utiliza principalmente la base de datos (tabla `AdminWhitelist`) para gestión dinámica, con `ADMIN_EMAILS` como fallback.

### Instalación Local

#### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- PostgreSQL (local o Neon)
- Cuenta de Google Cloud (para OAuth)

#### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd turnero-padel
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus valores
```

4. **Configurar base de datos**
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma db push

# Opcional: Cargar datos de prueba
npx prisma db seed
```

5. **Agregar administrador inicial**
```bash
node scripts/add-admin.js your-email@gmail.com
```

6. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
```

### Configuración de Google OAuth

1. **Crear proyecto en Google Cloud Console**
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear nuevo proyecto o seleccionar existente
   - Habilitar Google+ API

2. **Configurar OAuth 2.0**
   - Ir a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"
   - Tipo de aplicación: "Aplicación web"
   - Orígenes autorizados: `http://localhost:3000`, `https://tu-dominio.vercel.app`
   - URIs de redirección: `http://localhost:3000/api/auth/callback/google`

3. **Obtener credenciales**
   - Copiar Client ID y Client Secret
   - Agregar a variables de entorno

### Despliegue en Vercel

#### Configuración Automática

1. **Conectar repositorio**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Hacer login
vercel login

# Desplegar
vercel
```

2. **Configurar variables de entorno en Vercel**
```bash
# Agregar variables una por una
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add DATABASE_URL
vercel env add DIRECT_URL

# O usar el dashboard de Vercel
```

3. **Configurar dominio personalizado** (opcional)
   - En el dashboard de Vercel > Settings > Domains
   - Agregar dominio personalizado
   - Actualizar NEXTAUTH_URL

#### Script de Despliegue

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando despliegue..."

# Verificar que estamos en la rama correcta
if [ "$(git branch --show-current)" != "main" ]; then
  echo "❌ Debes estar en la rama main para desplegar"
  exit 1
fi

# Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Hay cambios sin commitear"
  exit 1
fi

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm run test:e2e

if [ $? -ne 0 ]; then
  echo "❌ Los tests fallaron"
  exit 1
fi

# Desplegar a Vercel
echo "📦 Desplegando a Vercel..."
vercel --prod

echo "✅ Despliegue completado"
```

### Configuración de Base de Datos

#### Neon PostgreSQL (Recomendado)

1. **Crear cuenta en Neon**
   - Ir a [neon.tech](https://neon.tech)
   - Crear cuenta gratuita
   - Crear nuevo proyecto

2. **Obtener strings de conexión**
   - Copiar DATABASE_URL (pooled)
   - Copiar DIRECT_URL (direct)

3. **Configurar en el proyecto**
```bash
# Agregar a .env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

#### PostgreSQL Local

```bash
# Instalar PostgreSQL
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Crear base de datos
sudo -u postgres createdb turnero_padel

# Crear usuario
sudo -u postgres createuser --interactive

# String de conexión
DATABASE_URL="postgresql://username:password@localhost:5432/turnero_padel"
```

---

## 🧪 Testing

### Estrategia de Testing

El sistema implementa una estrategia de testing completa:

#### Tipos de Tests
1. **Tests E2E** (End-to-End) con Playwright
2. **Tests de Integración** para APIs
3. **Tests de Componentes** (futuro)
4. **Tests Unitarios** (futuro)

### Tests End-to-End

#### Configuración de Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    }
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

#### Tests de Autenticación

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
  test('debe mostrar página de login para usuarios no autenticados', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Debe redirigir a login
    await expect(page).toHaveURL(/.*auth.*signin/)
    await expect(page.locator('h1')).toContainText('Iniciar Sesión')
  })
  
  test('debe permitir login con Google', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Click en botón de Google
    await page.click('button:has-text("Continuar con Google")')
    
    // Verificar redirección a Google
    await expect(page).toHaveURL(/.*accounts\.google\.com.*/)
  })
  
  test('debe denegar acceso a rutas de admin para usuarios normales', async ({ page }) => {
    // Simular usuario normal autenticado
    await page.goto('/admin')
    
    // Debe mostrar error de acceso denegado
    await expect(page.locator('h1')).toContainText('Acceso Denegado')
    await expect(page.locator('text=No tienes permisos')).toBeVisible()
  })
})
```

#### Tests de Reservas

```typescript
// tests/e2e/booking.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Sistema de Reservas', () => {
  test.beforeEach(async ({ page }) => {
    // Simular usuario autenticado
    await page.goto('/')
    // Agregar cookies de sesión de prueba
  })
  
  test('debe mostrar canchas disponibles', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Verificar que se muestran las canchas
    await expect(page.locator('[data-testid="court-card"]')).toHaveCount(3)
    await expect(page.locator('text=Cancha 1')).toBeVisible()
  })
  
  test('debe permitir crear una reserva', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Seleccionar cancha
    await page.click('[data-testid="court-card"]:first-child')
    
    // Seleccionar fecha
    await page.click('[data-testid="date-picker"]')
    await page.click('text=Mañana')
    
    // Seleccionar horario
    await page.click('[data-testid="time-slot"]:first-child')
    
    // Agregar jugadores
    await page.fill('[data-testid="player-name-0"]', 'Juan Pérez')
    await page.fill('[data-testid="player-phone-0"]', '+54 9 11 1234-5678')
    
    // Confirmar reserva
    await page.click('button:has-text("Confirmar Reserva")')
    
    // Verificar éxito
    await expect(page.locator('text=Reserva creada exitosamente')).toBeVisible()
  })
  
  test('debe mostrar reservas del usuario', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Ir a "Mis Turnos"
    await page.click('button:has-text("Mis Turnos")')
    
    // Verificar que se muestran las reservas
    await expect(page.locator('[data-testid="booking-card"]')).toHaveCountGreaterThan(0)
  })
  
  test('debe permitir cancelar una reserva', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('button:has-text("Mis Turnos")')
    
    // Click en cancelar
    await page.click('[data-testid="cancel-booking"]:first-child')
    
    // Confirmar cancelación
    await page.fill('[data-testid="cancellation-reason"]', 'No puedo asistir')
    await page.click('button:has-text("Confirmar Cancelación")')
    
    // Verificar éxito
    await expect(page.locator('text=Reserva cancelada')).toBeVisible()
  })
})
```

### Comandos de Testing

```json
// package.json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:install": "playwright install"
  }
}
```

### Ejecución de Tests

```bash
# Instalar navegadores
npm run test:install

# Ejecutar todos los tests
npm run test:e2e

# Ejecutar con interfaz visual
npm run test:e2e:ui

# Ejecutar en modo debug
npm run test:e2e:debug

# Ver reporte de resultados
npm run test:e2e:report

# Ejecutar tests específicos
npx playwright test auth.spec.ts

# Ejecutar en navegador específico
npx playwright test --project=chromium
```

---

## 📖 Guías de Uso

### Para Usuarios

#### Crear una Reserva

1. **Acceder al sistema**
   - Ir a la URL del sistema
   - Hacer clic en "Iniciar Sesión"
   - Autenticarse con Google

2. **Seleccionar cancha y horario**
   - En el dashboard, ver las canchas disponibles
   - Hacer clic en "Reservar" en la cancha deseada
   - Seleccionar fecha en el calendario
   - Elegir horario disponible

3. **Agregar jugadores**
   - Completar nombre del jugador principal (automático)
   - Agregar hasta 3 jugadores adicionales
   - Incluir teléfono para coordinación

4. **Confirmar y pagar**
   - Revisar detalles de la reserva
   - Seleccionar método de pago
   - Confirmar reserva

#### Gestionar Reservas

1. **Ver mis turnos**
   - Hacer clic en "Mis Turnos" en el menú
   - Ver turnos próximos y historial
   - Verificar estado de pagos

2. **Cancelar reserva**
   - En "Mis Turnos", hacer clic en "Cancelar"
   - Proporcionar motivo de cancelación
   - Confirmar cancelación

3. **Modificar jugadores**
   - Contactar al administrador
   - Proporcionar detalles de los cambios

### Para Administradores

#### Acceso al Panel de Administración

1. **Obtener permisos de administrador**
   - Contactar al administrador principal
   - Proporcionar email de Google
   - Esperar confirmación de acceso

2. **Acceder al panel**
   - Iniciar sesión normalmente
   - Hacer clic en "Panel de Admin" (solo visible para admins)

#### Gestión de Turnos

1. **Ver todas las reservas**
   - En el panel de admin, ir a "Turnos"
   - Usar filtros para buscar reservas específicas
   - Ver detalles completos de cada reserva

2. **Modificar reservas**
   - Hacer clic en "Editar" en una reserva
   - Cambiar horarios, jugadores o estado
   - Guardar cambios

3. **Gestionar pagos**
   - Hacer clic en "Pagos" en una reserva
   - Marcar pagos como recibidos
   - Agregar notas sobre el pago

#### Configuración del Sistema

1. **Gestionar canchas**
   - Ir a "Configuración" > "Canchas"
   - Agregar nuevas canchas
   - Modificar precios y horarios
   - Activar/desactivar canchas

2. **Administrar usuarios**
   - Ver lista de usuarios registrados
   - Agregar/remover administradores
   - Ver estadísticas de uso

3. **Generar reportes**
   - Ir a "Reportes"
   - Seleccionar período de tiempo
   - Exportar datos en CSV/Excel

---

## 🔧 Troubleshooting

### Problemas Comunes

#### Error de Autenticación

**Síntoma**: "Error de Autenticación" o redirección infinita

**Soluciones**:
1. Verificar variables de entorno:
   ```bash
   # Verificar que estén configuradas
   echo $GOOGLE_CLIENT_ID
   echo $NEXTAUTH_SECRET
   ```

2. Verificar configuración de Google OAuth:
   - URLs de redirección correctas
   - Dominio autorizado
   - API habilitada

3. Limpiar cookies y caché del navegador

#### Error de Base de Datos

**Síntoma**: "Database connection failed" o errores de Prisma

**Soluciones**:
1. Verificar string de conexión:
   ```bash
   # Probar conexión
   npx prisma db pull
   ```

2. Verificar que la base de datos esté accesible:
   ```bash
   # Para Neon
   ping <neon-host>
   ```

3. Regenerar cliente Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

#### Acceso Denegado para Admin

**Síntoma**: "No tienes permisos para acceder a esta aplicación"

**Soluciones**:
1. Verificar que el email esté en la whitelist:
   ```bash
   node scripts/add-admin.js your-email@gmail.com
   ```

2. Verificar en la base de datos:
   ```sql
   SELECT * FROM "AdminWhitelist" WHERE email = 'your-email@gmail.com';
   ```

3. Limpiar sesión y volver a autenticarse

#### Problemas de Despliegue en Vercel

**Síntoma**: Build fails o runtime errors

**Soluciones**:
1. Verificar variables de entorno en Vercel:
   ```bash
   vercel env ls
   ```

2. Verificar logs de build:
   ```bash
   vercel logs <deployment-url>
   ```

3. Verificar configuración de Next.js:
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       serverComponentsExternalPackages: ['@prisma/client']
     }
   }
   ```

### Logs y Debugging

#### Habilitar Logs Detallados

```bash
# Variables de entorno para debugging
NEXTAUTH_DEBUG=true
PRISMA_DEBUG=true
NODE_ENV=development
```

#### Verificar Estado del Sistema

```bash
# Script de verificación
node scripts/test-migration.js
```

#### Monitoreo en Producción

1. **Vercel Analytics**
   - Habilitar en dashboard de Vercel
   - Monitorear performance y errores

2. **Logs de aplicación**
   ```bash
   # Ver logs en tiempo real
   vercel logs --follow
   ```

3. **Alertas personalizadas**
   - Configurar webhooks para errores críticos
   - Monitorear uptime con servicios externos

---

## 🚀 Roadmap

### Versión Actual (v1.0)
- ✅ Autenticación con Google OAuth
- ✅ Sistema básico de reservas
- ✅ Panel de administración
- ✅ Gestión de pagos manual
- ✅ Interfaz responsive
- ✅ Tests E2E básicos

### Próximas Funcionalidades (v1.1)

#### Mejoras de UX
- 🔄 **Notificaciones push** para recordatorios
- 🔄 **Modo offline** con sincronización
- 🔄 **Tema personalizable** (colores del club)
- 🔄 **Búsqueda avanzada** de horarios

#### Funcionalidades de Negocio
- 🔄 **Sistema de membresías** con descuentos
- 🔄 **Reservas recurrentes** (torneos, clases)
- 🔄 **Lista de espera** para horarios completos
- 🔄 **Sistema de puntuación** y rankings

### Funcionalidades Futuras (v2.0)

#### Integración de Pagos
- 📋 **Mercado Pago** integración completa
- 📋 **Pagos automáticos** con tarjeta
- 📋 **Facturación electrónica**
- 📋 **Reembolsos automáticos**

#### Analytics y Reportes
- 📋 **Dashboard de métricas** en tiempo real
- 📋 **Reportes financieros** avanzados
- 📋 **Análisis de ocupación** por horarios
- 📋 **Predicción de demanda** con ML

#### Funcionalidades Sociales
- 📋 **Perfiles de jugadores** públicos
- 📋 **Sistema de amigos** y invitaciones
- 📋 **Chat integrado** para coordinación
- 📋 **Compartir en redes sociales**

#### Integraciones
- 📋 **API pública** para terceros
- 📋 **Integración con calendarios** (Google, Outlook)
- 📋 **Webhooks** para eventos
- 📋 **Integración con sistemas de acceso**

### Mejoras Técnicas

#### Performance
- 📋 **Caché inteligente** con Redis
- 📋 **Optimización de imágenes** automática
- 📋 **Lazy loading** avanzado
- 📋 **Service Workers** para PWA

#### Seguridad
- 📋 **Autenticación multifactor** (2FA)
- 📋 **Auditoría de seguridad** automática
- 📋 **Encriptación de datos** sensibles
- 📋 **Rate limiting** avanzado

#### DevOps
- 📋 **CI/CD pipeline** completo
- 📋 **Tests automatizados** en múltiples entornos
- 📋 **Monitoreo avanzado** con alertas
- 📋 **Backup automático** de base de datos

---

## 📞 Soporte y Contacto

### Documentación Adicional
- 📖 [Guía de APIs](./docs/apis/)
- 🏗️ [Documentación de Arquitectura](./docs/architecture/)
- 🎣 [Documentación de Hooks](./docs/hooks/)
- 🔧 [Guía de Servicios](./docs/services/)

### Recursos de Desarrollo
- 🔗 [Next.js Documentation](https://nextjs.org/docs)
- 🔗 [Prisma Documentation](https://www.prisma.io/docs)
- 🔗 [NextAuth.js Documentation](https://next-auth.js.org/)
- 🔗 [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Contribución
Para contribuir al proyecto:
1. Fork el repositorio
2. Crear branch para la funcionalidad
3. Implementar cambios con tests
4. Crear Pull Request
5. Esperar revisión y aprobación

---

**© 2024 Sistema de Turnero de Pádel - Documentación Completa**

*Esta documentación está en constante actualización. Para la versión más reciente, consultar el repositorio del proyecto.*