# Guía de Solución de Problemas

## 🚨 Problemas Comunes y Soluciones

### 🔧 Problemas de Configuración

#### Error: "Module not found"

**Síntomas:**
```bash
Error: Cannot resolve module '@/components/ui/button'
Module not found: Can't resolve '@/lib/utils'
```

**Causas:**
- Configuración incorrecta de TypeScript paths
- Dependencias no instaladas
- Estructura de carpetas incorrecta

**Soluciones:**

1. **Verificar tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. **Reinstalar dependencias:**
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

3. **Verificar estructura de carpetas:**
```
turnero-padel/
├── components/
├── lib/
├── app/
└── tsconfig.json
```

#### Error: "Environment variables not loaded"

**Síntomas:**
```bash
Error: Environment variable DATABASE_URL is not defined
NextAuth configuration error
```

**Soluciones:**

1. **Verificar archivo .env.local:**
```bash
# Verificar que existe
ls -la .env.local

# Verificar contenido
cat .env.local
```

2. **Formato correcto de variables:**
```bash
# ✅ Correcto
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
NEXTAUTH_SECRET="your-secret-here"

# ❌ Incorrecto
DATABASE_URL=postgresql://user:pass@localhost:5432/db  # Sin comillas
NEXTAUTH_SECRET=                                      # Vacío
```

3. **Reiniciar servidor de desarrollo:**
```bash
# Detener servidor (Ctrl+C)
# Reiniciar
pnpm dev
```

### 🗄️ Problemas de Base de Datos

#### Error: "Database connection failed"

**Síntomas:**
```bash
PrismaClientInitializationError: Can't reach database server
Error: P1001: Can't reach database server at localhost:5432
```

**Diagnóstico:**
```bash
# Verificar conexión a PostgreSQL
psql -h localhost -p 5432 -U your_user -d your_database

# Verificar si PostgreSQL está corriendo
# Windows
sc query postgresql-x64-14

# macOS/Linux
sudo systemctl status postgresql
# o
brew services list | grep postgresql
```

**Soluciones:**

1. **Iniciar PostgreSQL:**
```bash
# Windows
net start postgresql-x64-14

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

2. **Verificar credenciales:**
```bash
# Probar conexión manual
psql "postgresql://user:password@localhost:5432/database"
```

3. **Usar Supabase como alternativa:**
```bash
# En .env.local
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

#### Error: "Schema out of sync"

**Síntomas:**
```bash
Prisma schema and database are out of sync
Table 'User' doesn't exist
```

**Soluciones:**

1. **Aplicar cambios del schema:**
```bash
pnpm db:push
```

2. **Regenerar cliente de Prisma:**
```bash
pnpm db:generate
```

3. **Reset completo (⚠️ Borra todos los datos):**
```bash
pnpm db:reset
pnpm db:seed
```

#### Error: "Migration failed"

**Síntomas:**
```bash
Migration failed to apply cleanly to the shadow database
Foreign key constraint fails
```

**Soluciones:**

1. **Verificar relaciones en schema.prisma:**
```prisma
model User {
  id       String    @id @default(cuid())
  bookings Booking[] // Relación correcta
}

model Booking {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

2. **Limpiar migraciones:**
```bash
rm -rf prisma/migrations
pnpm db:push --force-reset
```

### 🔐 Problemas de Autenticación

#### Error: "NextAuth session not working"

**Síntomas:**
```bash
Session is null
User not authenticated
Redirect loop in authentication
```

**Diagnóstico:**
```typescript
// Verificar en componente
import { useSession } from 'next-auth/react'

export default function DebugAuth() {
  const { data: session, status } = useSession()
  
  console.log('Session status:', status)
  console.log('Session data:', session)
  
  return (
    <div>
      <p>Status: {status}</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}
```

**Soluciones:**

1. **Verificar configuración de NextAuth:**
```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!
      }
    })
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}
```

2. **Verificar SessionProvider:**
```tsx
// app/layout.tsx
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

3. **Limpiar cookies y storage:**
```javascript
// En DevTools Console
localStorage.clear()
sessionStorage.clear()
// Luego recargar página
```

#### Error: "OAuth provider configuration"

**Síntomas:**
```bash
OAuth account not linked
Google OAuth error
Invalid client configuration
```

**Soluciones:**

1. **Verificar Google Console:**
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services > Credentials
   - Verificar Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://yourdomain.com/api/auth/callback/google` (producción)

2. **Verificar variables de entorno:**
```bash
# .env.local
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### 🎨 Problemas de UI/Styling

#### Error: "Tailwind classes not working"

**Síntomas:**
- Estilos no se aplican
- Clases de Tailwind no tienen efecto
- Build de producción sin estilos

**Soluciones:**

1. **Verificar tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

2. **Verificar globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. **Purgar cache de Tailwind:**
```bash
rm -rf .next
pnpm dev
```

#### Error: "Hydration mismatch"

**Síntomas:**
```bash
Warning: Text content did not match
Hydration failed because the initial UI does not match
```

**Causas comunes:**
- Diferencias entre servidor y cliente
- Uso de `Date.now()` o `Math.random()`
- Condiciones basadas en `window` o `document`

**Soluciones:**

1. **Usar useEffect para código del cliente:**
```tsx
import { useEffect, useState } from 'react'

export default function ClientOnlyComponent() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <div>Loading...</div> // Placeholder para SSR
  }
  
  return (
    <div>
      {/* Contenido que depende del cliente */}
      {new Date().toLocaleString()}
    </div>
  )
}
```

2. **Usar dynamic imports con ssr: false:**
```tsx
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
)

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <ClientOnlyComponent />
    </div>
  )
}
```

### 🚀 Problemas de Performance

#### Problema: "Página carga lentamente"

**Diagnóstico:**
```bash
# Analizar bundle
ANALYZE=true pnpm build

# Verificar métricas en DevTools
# Lighthouse > Performance
# Network tab > Slow 3G
```

**Soluciones:**

1. **Optimizar imágenes:**
```tsx
import Image from 'next/image'

// ✅ Correcto
<Image
  src="/court-image.jpg"
  alt="Cancha de pádel"
  width={400}
  height={300}
  priority // Para imágenes above-the-fold
/>

// ❌ Incorrecto
<img src="/large-image.jpg" alt="Court" />
```

2. **Code splitting:**
```tsx
import dynamic from 'next/dynamic'

// Cargar componente solo cuando se necesite
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <p>Loading...</p> }
)
```

3. **Memoización:**
```tsx
import { memo, useMemo, useCallback } from 'react'

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }))
  }, [data])
  
  const handleClick = useCallback((id) => {
    // Handle click
  }, [])
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  )
})
```

#### Problema: "Muchas re-renderizaciones"

**Diagnóstico:**
```tsx
// Instalar React DevTools Profiler
// Usar React.StrictMode para detectar efectos secundarios

import { StrictMode } from 'react'

export default function App() {
  return (
    <StrictMode>
      <YourApp />
    </StrictMode>
  )
}
```

**Soluciones:**

1. **Evitar crear objetos en render:**
```tsx
// ❌ Malo - crea nuevo objeto en cada render
function Component() {
  return <ChildComponent style={{ margin: 10 }} />
}

// ✅ Bueno - objeto estático
const styles = { margin: 10 }
function Component() {
  return <ChildComponent style={styles} />
}
```

2. **Usar React.memo correctamente:**
```tsx
// ✅ Bueno - comparación personalizada
const MyComponent = memo(({ user, onUpdate }) => {
  return <div>{user.name}</div>
}, (prevProps, nextProps) => {
  return prevProps.user.id === nextProps.user.id
})
```

### 🔍 Problemas de Debugging

#### Problema: "No puedo debuggear el código"

**Soluciones:**

1. **Configurar VS Code debugging:**
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
    }
  ]
}
```

2. **Usar debugger statement:**
```typescript
function problematicFunction(data: any) {
  debugger // Pausa aquí cuando DevTools está abierto
  
  console.log('Data:', data)
  // resto del código
}
```

3. **Logging estructurado:**
```typescript
// lib/logger.ts
export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 [DEBUG] ${message}`, data)
    }
  },
  error: (message: string, error?: Error) => {
    console.error(`❌ [ERROR] ${message}`, error)
  }
}

// Uso
logger.debug('User booking created', { bookingId, userId })
logger.error('Failed to create booking', error)
```

### 📱 Problemas de Responsive Design

#### Problema: "No se ve bien en móvil"

**Diagnóstico:**
```bash
# Usar DevTools
# F12 > Toggle device toolbar
# Probar diferentes tamaños de pantalla
```

**Soluciones:**

1. **Usar breakpoints de Tailwind:**
```tsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {/* Contenido */}
</div>
```

2. **Viewport meta tag:**
```tsx
// app/layout.tsx
export const metadata = {
  viewport: 'width=device-width, initial-scale=1'
}
```

3. **Usar container queries:**
```css
@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

## 🛠️ Herramientas de Diagnóstico

### Scripts de Diagnóstico

```bash
#!/bin/bash
# scripts/diagnose.sh

echo "🔍 Diagnóstico del sistema..."

# Verificar Node.js
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "pnpm version: $(pnpm --version)"

# Verificar dependencias
echo "\n📦 Verificando dependencias..."
pnpm list --depth=0

# Verificar TypeScript
echo "\n🔧 Verificando TypeScript..."
pnpm type-check

# Verificar linting
echo "\n📏 Verificando linting..."
pnpm lint

# Verificar base de datos
echo "\n🗄️ Verificando conexión a base de datos..."
pnpm prisma db pull --preview-feature || echo "❌ Error de conexión a BD"

echo "\n✅ Diagnóstico completado"
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {
      database: 'unknown',
      environment: 'unknown'
    }
  }

  try {
    // Verificar base de datos
    await db.$queryRaw`SELECT 1`
    checks.checks.database = 'ok'
  } catch (error) {
    checks.checks.database = 'error'
    checks.status = 'error'
  }

  // Verificar variables de entorno críticas
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missingEnvVars.length === 0) {
    checks.checks.environment = 'ok'
  } else {
    checks.checks.environment = `missing: ${missingEnvVars.join(', ')}`
    checks.status = 'error'
  }

  return NextResponse.json(checks, {
    status: checks.status === 'ok' ? 200 : 500
  })
}
```

## 📞 Obtener Ayuda

### Antes de Pedir Ayuda

1. **Busca en la documentación**
2. **Revisa issues existentes en GitHub**
3. **Ejecuta el script de diagnóstico**
4. **Reproduce el error en un entorno limpio**

### Información a Incluir

```markdown
## Descripción del Problema
[Descripción clara del problema]

## Pasos para Reproducir
1. Paso 1
2. Paso 2
3. Paso 3

## Comportamiento Esperado
[Qué esperabas que pasara]

## Comportamiento Actual
[Qué está pasando realmente]

## Información del Sistema
- OS: [Windows/macOS/Linux]
- Node.js: [versión]
- pnpm: [versión]
- Browser: [Chrome/Firefox/Safari + versión]

## Logs de Error
```
[Pegar logs aquí]
```

## Configuración
- Variables de entorno (sin valores sensibles)
- Configuración relevante

## Intentos de Solución
[Qué has intentado hacer para solucionarlo]
```

### Canales de Soporte

1. **GitHub Issues** - Para bugs y feature requests
2. **Documentación** - Para guías y referencias
3. **Discord/Slack** - Para chat en tiempo real (si existe)
4. **Stack Overflow** - Para preguntas técnicas generales

---

**Última actualización**: 2024-01-28  
**Versión**: 1.0

¿No encuentras la solución a tu problema? [Crea un issue](https://github.com/tu-usuario/turnero-padel/issues/new) con toda la información relevante.