# Configuración de Autenticación con Supabase - Turnero de Padel

## Resumen Ejecutivo

Este documento detalla la implementación completa del sistema de autenticación usando **Supabase Auth** para el turnero de padel. Incluye configuración del proyecto, integración con Next.js, manejo de roles y middleware de protección.

## 1. Configuración Inicial del Proyecto Supabase

### Crear Proyecto en Supabase
1. Ir a [database.new](https://database.new)
2. Crear nuevo proyecto: `turnero-padel-production`
3. Configurar región: `South America (São Paulo)`
4. Guardar credenciales del proyecto

### Variables de Entorno
Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Redis Configuration (para siguiente fase)
REDIS_URL=redis://localhost:6379

# App Configuration
NEXTAUTH_SECRET=tu-secret-muy-seguro
NEXTAUTH_URL=http://localhost:3000
```

## 2. Instalación de Dependencias

```bash
# Instalar dependencias de Supabase
npm install @supabase/supabase-js @supabase/ssr

# Dependencias adicionales para autenticación
npm install @supabase/auth-helpers-nextjs

# Dependencias para validación (opcional pero recomendado)
npm install zod react-hook-form @hookform/resolvers
```

## 3. Configuración de Clientes Supabase

### Cliente para Componentes del Servidor
Crear `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // El método `setAll` fue llamado desde un Server Component.
            // Esto puede ser ignorado si tienes middleware refrescando
            // las sesiones de usuario.
          }
        },
      },
    }
  )
}
```

### Cliente para Componentes del Cliente
Crear `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Cliente para Middleware
Crear `lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: NO remover auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Verificar rol de admin para rutas protegidas
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
```

## 4. Configuración del Middleware

Crear `middleware.ts` en la raíz del proyecto:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - archivos de imagen
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 5. Componentes de Autenticación

### Hook personalizado para autenticación
Crear `hooks/useAuth.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string | null
  role: 'user' | 'admin'
  phone: string | null
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data && !error) {
      setProfile(data)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const isAdmin = profile?.role === 'admin'

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  }
}
```

### Componente de Login
Crear `components/auth/LoginForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

## 6. Protección de Rutas

### Componente de protección
Crear `components/auth/ProtectedRoute.tsx`:

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }

      if (requireAdmin && profile?.role !== 'admin') {
        router.push('/')
        return
      }
    }
  }, [user, profile, loading, requireAdmin, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!user || (requireAdmin && profile?.role !== 'admin')) {
    return null
  }

  return <>{children}</>
}
```

## 7. Configuración de la Base de Datos

### Ejecutar el schema SQL
En el SQL Editor de Supabase, ejecutar el schema completo del documento anterior.

### Configurar Storage para avatares
```sql
-- Crear bucket para avatares
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Política para subir avatares
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para ver avatares
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

## 8. Integración con el Frontend Actual

### Modificar el componente principal
En `padel-booking.tsx`, agregar autenticación:

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function PadelBookingPage() {
  const { user, profile, signOut, isAdmin } = useAuth()
  
  // ... resto del código existente

  // Modificar la navegación para incluir autenticación
  const navItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: Home,
      color: "text-emerald-500",
      activeColor: "text-emerald-600",
    },
    {
      id: "turnos",
      label: "Mis Turnos",
      icon: BookOpen,
      color: "text-blue-500",
      activeColor: "text-blue-600",
    },
    ...(isAdmin ? [{
      id: "admin",
      label: "Administración",
      icon: Settings,
      color: "text-orange-500",
      activeColor: "text-orange-600",
    }] : []),
  ]

  return (
    <ProtectedRoute>
      {/* Contenido existente */}
    </ProtectedRoute>
  )
}
```

## 9. Páginas de Autenticación

### Crear página de login
Crear `app/login/page.tsx`:

```typescript
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
      <LoginForm />
    </div>
  )
}
```

## 10. Testing de Autenticación

### Crear usuario administrador inicial
```sql
-- Insertar en auth.users (esto se hace automáticamente al registrarse)
-- Luego actualizar el rol en profiles
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'uuid-del-usuario-admin';
```

## Próximos Pasos

1. **Ejecutar migraciones** en Supabase
2. **Configurar variables de entorno**
3. **Crear usuario administrador** de prueba
4. **Integrar autenticación** en componentes existentes
5. **Implementar APIs** para reemplazar datos mock

La autenticación está lista para integrarse con el frontend existente. ¿Continuamos con la implementación de las APIs?
