# Guía de Desarrollo

## 🛠️ Configuración del Entorno de Desarrollo

### Prerrequisitos

- **Node.js** >= 18.17.0
- **pnpm** >= 8.0.0
- **Git** >= 2.30.0
- **PostgreSQL** >= 14.0 (local) o cuenta de **Supabase**
- **VS Code** (recomendado)

### Configuración Inicial

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/turnero-padel.git
cd turnero-padel

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
```

### Variables de Entorno

```bash
# .env.local

# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/turnero_padel"
DIRECT_URL="postgresql://usuario:password@localhost:5432/turnero_padel"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-super-seguro-aqui"

# Providers de autenticación
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# Configuración de la aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Turnero de Pádel"

# Configuración de email (opcional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-app-password"
EMAIL_FROM="noreply@turnero-padel.com"

# Configuración de pagos (opcional)
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Configuración de Base de Datos

#### Opción 1: PostgreSQL Local

```bash
# Instalar PostgreSQL (Windows con Chocolatey)
choco install postgresql

# Crear base de datos
psql -U postgres
CREATE DATABASE turnero_padel;
CREATE USER turnero_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE turnero_padel TO turnero_user;
\q

# Aplicar migraciones
pnpm db:push

# Sembrar datos de prueba
pnpm db:seed
```

#### Opción 2: Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Obtener la URL de conexión
3. Configurar en `.env.local`
4. Ejecutar migraciones:

```bash
pnpm db:push
pnpm db:seed
```

### Iniciar Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev

# La aplicación estará disponible en http://localhost:3000
```

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

```
turnero-padel/
├── app/                    # App Router de Next.js 13+
│   ├── (admin)/           # Rutas de administración
│   ├── (protected)/       # Rutas protegidas
│   ├── api/               # API Routes
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── forms/            # Componentes de formularios
│   ├── layout/           # Componentes de layout
│   └── features/         # Componentes específicos de features
├── hooks/                # Custom hooks
├── lib/                  # Utilidades y configuraciones
│   ├── auth.ts          # Configuración de NextAuth
│   ├── db.ts            # Cliente de Prisma
│   ├── utils.ts         # Utilidades generales
│   └── validations.ts   # Esquemas de validación
├── prisma/              # Configuración de base de datos
│   ├── schema.prisma    # Esquema de la base de datos
│   └── seed.ts          # Datos de prueba
├── public/              # Archivos estáticos
├── docs/                # Documentación
└── scripts/             # Scripts de utilidad
```

### Stack Tecnológico

#### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS utility-first
- **shadcn/ui** - Componentes UI reutilizables
- **Lucide React** - Iconos
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

#### Backend
- **Next.js API Routes** - API endpoints
- **Prisma** - ORM para base de datos
- **NextAuth.js** - Autenticación
- **PostgreSQL** - Base de datos

#### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **TypeScript** - Verificación de tipos
- **Husky** - Git hooks
- **lint-staged** - Linting en staged files

## 🧩 Patrones de Desarrollo

### Componentes React

#### Estructura de Componente

```tsx
// components/features/booking/BookingCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Booking } from "@prisma/client"

interface BookingCardProps {
  booking: Booking & {
    court: { name: string }
    players: { name: string }[]
  }
  onEdit?: (booking: Booking) => void
  onCancel?: (booking: Booking) => void
  className?: string
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onEdit,
  onCancel,
  className
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (time: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(`2000-01-01T${time}`))
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{booking.court.name}</CardTitle>
          <Badge 
            variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}
          >
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(booking.date)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{booking.players.length} jugadores</span>
        </div>
        
        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(booking)}>
              Editar
            </Button>
          )}
          {onCancel && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onCancel(booking)}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Custom Hooks

```tsx
// hooks/useBookings.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { Booking } from '@prisma/client'

interface UseBookingsOptions {
  userId?: string
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  autoRefresh?: boolean
}

export const useBookings = (options: UseBookingsOptions = {}) => {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.userId) params.append('userId', options.userId)
      if (options.status) params.append('status', options.status)
      
      const response = await fetch(`/api/bookings?${params}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar las reservas')
      }
      
      const data = await response.json()
      setBookings(data.bookings)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'))
    } finally {
      setIsLoading(false)
    }
  }

  const createBooking = async (bookingData: CreateBookingData) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      
      if (!response.ok) {
        throw new Error('Error al crear la reserva')
      }
      
      const newBooking = await response.json()
      setBookings(prev => [...prev, newBooking])
      return newBooking
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido')
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      
      if (!response.ok) {
        throw new Error('Error al cancelar la reserva')
      }
      
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CANCELLED' }
            : booking
        )
      )
    } catch (err) {
      throw err instanceof Error ? err : new Error('Error desconocido')
    }
  }

  useEffect(() => {
    if (session) {
      fetchBookings()
    }
  }, [session, options.userId, options.status])

  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(fetchBookings, 30000) // Refresh cada 30s
      return () => clearInterval(interval)
    }
  }, [options.autoRefresh])

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings,
    createBooking,
    cancelBooking
  }
}
```

### API Routes

#### Estructura de API Route

```typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createBookingSchema } from '@/lib/validations/booking'

// GET /api/bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where = {
      ...(userId && { userId }),
      ...(status && { status }),
      // Solo mostrar reservas del usuario actual (excepto admins)
      ...(session.user.role !== 'ADMIN' && { userId: session.user.id })
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          court: { select: { name: true, location: true } },
          players: { select: { name: true, email: true } },
          payment: { select: { status: true, amount: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.booking.count({ where })
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/bookings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // Verificar disponibilidad de la cancha
    const existingBooking = await db.booking.findFirst({
      where: {
        courtId: validatedData.courtId,
        date: validatedData.date,
        status: { not: 'CANCELLED' },
        OR: [
          {
            startTime: { lte: validatedData.startTime },
            endTime: { gt: validatedData.startTime }
          },
          {
            startTime: { lt: validatedData.endTime },
            endTime: { gte: validatedData.endTime }
          },
          {
            startTime: { gte: validatedData.startTime },
            endTime: { lte: validatedData.endTime }
          }
        ]
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'La cancha no está disponible en ese horario' },
        { status: 409 }
      )
    }

    // Crear la reserva en una transacción
    const booking = await db.$transaction(async (tx) => {
      // Crear la reserva
      const newBooking = await tx.booking.create({
        data: {
          ...validatedData,
          userId: session.user.id,
          status: 'PENDING'
        },
        include: {
          court: true,
          players: true
        }
      })

      // Crear los jugadores
      if (validatedData.players?.length > 0) {
        await tx.bookingPlayer.createMany({
          data: validatedData.players.map(player => ({
            bookingId: newBooking.id,
            name: player.name,
            email: player.email
          }))
        })
      }

      return newBooking
    })

    // Enviar email de confirmación (opcional)
    // await sendBookingConfirmationEmail(booking)

    return NextResponse.json({
      success: true,
      booking
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### Validaciones con Zod

```typescript
// lib/validations/booking.ts
import { z } from 'zod'

export const createBookingSchema = z.object({
  courtId: z.string().uuid('ID de cancha inválido'),
  date: z.coerce.date({
    required_error: 'La fecha es requerida',
    invalid_type_error: 'Formato de fecha inválido'
  }).refine(
    (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
    'La fecha no puede ser en el pasado'
  ),
  startTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    'Formato de hora inválido (HH:MM)'
  ),
  endTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    'Formato de hora inválido (HH:MM)'
  ),
  players: z.array(
    z.object({
      name: z.string().min(1, 'El nombre es requerido').max(100),
      email: z.string().email('Email inválido').optional()
    })
  ).min(2, 'Mínimo 2 jugadores').max(4, 'Máximo 4 jugadores'),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional()
}).refine(
  (data) => data.startTime < data.endTime,
  {
    message: 'La hora de inicio debe ser anterior a la hora de fin',
    path: ['endTime']
  }
)

export const updateBookingSchema = createBookingSchema.partial().extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional()
})

export type CreateBookingData = z.infer<typeof createBookingSchema>
export type UpdateBookingData = z.infer<typeof updateBookingSchema>
```

## 🧪 Testing

### Configuración de Testing

```bash
# Instalar dependencias de testing
pnpm add -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testEnvironment: 'jest-environment-jsdom'
}

module.exports = createJestConfig(customJestConfig)
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom'
```

### Tests de Componentes

```tsx
// __tests__/components/BookingCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { BookingCard } from '@/components/features/booking/BookingCard'
import type { Booking } from '@prisma/client'

const mockBooking: Booking & {
  court: { name: string }
  players: { name: string }[]
} = {
  id: '1',
  courtId: '1',
  userId: '1',
  date: new Date('2024-02-01'),
  startTime: '10:00',
  endTime: '11:30',
  status: 'CONFIRMED',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  court: { name: 'Cancha 1' },
  players: [
    { name: 'Juan Pérez' },
    { name: 'María García' }
  ]
}

describe('BookingCard', () => {
  it('renders booking information correctly', () => {
    render(<BookingCard booking={mockBooking} />)
    
    expect(screen.getByText('Cancha 1')).toBeInTheDocument()
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument()
    expect(screen.getByText('2 jugadores')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<BookingCard booking={mockBooking} onEdit={onEdit} />)
    
    fireEvent.click(screen.getByText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(mockBooking)
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(<BookingCard booking={mockBooking} onCancel={onCancel} />)
    
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalledWith(mockBooking)
  })
})
```

### Tests de API

```typescript
// __tests__/api/bookings.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/bookings/route'

// Mock de Prisma
jest.mock('@/lib/db', () => ({
  booking: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  }
}))

// Mock de NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

describe('/api/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns bookings for authenticated user', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      // Mock session
      require('next-auth/next').getServerSession.mockResolvedValue({
        user: { id: '1', role: 'USER' }
      })

      // Mock database response
      require('@/lib/db').booking.findMany.mockResolvedValue([])
      require('@/lib/db').booking.count.mockResolvedValue(0)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('bookings')
      expect(data).toHaveProperty('pagination')
    })

    it('returns 401 for unauthenticated user', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      require('next-auth/next').getServerSession.mockResolvedValue(null)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })
})
```

## 🚀 Scripts de Desarrollo

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:pull": "prisma db pull",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "prepare": "husky install"
  }
}
```

### Scripts Personalizados

```bash
# scripts/setup-dev.sh
#!/bin/bash

echo "🚀 Configurando entorno de desarrollo..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
pnpm install

# Configurar variables de entorno
if [ ! -f .env.local ]; then
    echo "⚙️ Configurando variables de entorno..."
    cp .env.example .env.local
    echo "✏️ Por favor, edita .env.local con tus configuraciones"
fi

# Configurar base de datos
echo "🗄️ Configurando base de datos..."
pnpm db:push
pnpm db:seed

echo "✅ ¡Configuración completada!"
echo "🎯 Ejecuta 'pnpm dev' para iniciar el servidor de desarrollo"
```

## 🔧 Herramientas de Desarrollo

### VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-jest"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

### Git Hooks con Husky

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

## 🐛 Debugging

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Logging

```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.isDevelopment && level === 'debug') return

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    console[level === 'debug' ? 'log' : level](prefix, message, ...args)
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args)
  }
}

export const logger = new Logger()
```

## 📈 Performance

### Optimizaciones de Next.js

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true
}

module.exports = nextConfig
```

### Bundle Analyzer

```bash
# Instalar
pnpm add -D @next/bundle-analyzer

# Configurar en next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer(nextConfig)

# Ejecutar análisis
ANALYZE=true pnpm build
```

---

**Última actualización**: 2024-01-28  
**Versión**: 1.0

Para más información, consulta:
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de NextAuth.js](https://next-auth.js.org/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)