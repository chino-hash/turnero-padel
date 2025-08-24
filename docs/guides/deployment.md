# Guía de Despliegue

## 🚀 Opciones de Despliegue

### Plataformas Recomendadas

| Plataforma | Frontend | Base de Datos | Dificultad | Costo |
|------------|----------|---------------|------------|-------|
| **Vercel + Supabase** | ✅ | ✅ | Fácil | Gratis/Bajo |
| **Netlify + PlanetScale** | ✅ | ✅ | Fácil | Gratis/Bajo |
| **Railway** | ✅ | ✅ | Medio | Bajo |
| **DigitalOcean App Platform** | ✅ | ✅ | Medio | Medio |
| **AWS (Amplify + RDS)** | ✅ | ✅ | Difícil | Variable |
| **Docker + VPS** | ✅ | ✅ | Difícil | Bajo |

## 🎯 Despliegue Recomendado: Vercel + Supabase

### Paso 1: Configurar Supabase

1. **Crear proyecto en Supabase:**
   - Ir a [supabase.com](https://supabase.com)
   - Crear nueva cuenta/proyecto
   - Elegir región más cercana
   - Anotar la URL y API Key

2. **Configurar base de datos:**
```sql
-- Ejecutar en SQL Editor de Supabase
-- Las tablas se crearán automáticamente con Prisma

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

3. **Configurar autenticación:**
   - Authentication > Settings
   - Configurar providers (Google, GitHub, etc.)
   - Configurar redirect URLs:
     - `https://tu-dominio.vercel.app/api/auth/callback/google`

### Paso 2: Preparar el Proyecto

1. **Actualizar variables de entorno:**
```bash
# .env.production
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

NEXTAUTH_URL="https://tu-dominio.vercel.app"
NEXTAUTH_SECRET="tu-secret-super-seguro-para-produccion"

GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
NEXT_PUBLIC_APP_NAME="Turnero de Pádel"
```

2. **Aplicar migraciones:**
```bash
# Con la DATABASE_URL de producción en .env
pnpm db:push

# Opcional: sembrar datos iniciales
pnpm db:seed
```

3. **Verificar build local:**
```bash
pnpm build
pnpm start
```

### Paso 3: Desplegar en Vercel

#### Opción A: Desde GitHub (Recomendado)

1. **Subir código a GitHub:**
```bash
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

2. **Conectar con Vercel:**
   - Ir a [vercel.com](https://vercel.com)
   - "New Project" > Import from GitHub
   - Seleccionar repositorio
   - Configurar variables de entorno
   - Deploy

#### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Para producción
vercel --prod
```

### Paso 4: Configurar Variables de Entorno en Vercel

1. **En el dashboard de Vercel:**
   - Project Settings > Environment Variables
   - Añadir todas las variables de `.env.production`
   - Marcar para Production, Preview, y Development según necesites

2. **Variables críticas:**
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=tu-secret-super-seguro
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

### Paso 5: Configurar Dominio Personalizado (Opcional)

1. **En Vercel:**
   - Project Settings > Domains
   - Add Domain
   - Seguir instrucciones DNS

2. **Actualizar variables:**
```bash
NEXTAUTH_URL=https://tu-dominio.com
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

3. **Actualizar OAuth providers:**
   - Google Console: Authorized redirect URIs
   - Supabase: Authentication settings

## 🐳 Despliegue con Docker

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/turnero_padel
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-here
    depends_on:
      - db
    volumes:
      - ./.env.local:/app/.env.local

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=turnero_padel
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Comandos Docker

```bash
# Build y run
docker-compose up --build

# Solo build
docker build -t turnero-padel .

# Run container
docker run -p 3000:3000 --env-file .env.local turnero-padel

# Aplicar migraciones
docker-compose exec app npx prisma db push
```

## ☁️ Otras Plataformas

### Railway

1. **Conectar repositorio:**
   - Ir a [railway.app](https://railway.app)
   - "New Project" > "Deploy from GitHub repo"

2. **Configurar variables:**
   - Variables tab
   - Añadir todas las variables de entorno

3. **Configurar base de datos:**
   - "New" > "Database" > "PostgreSQL"
   - Copiar DATABASE_URL a variables de la app

### Netlify

```bash
# netlify.toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--version" # Force npm to print version

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: turnero-padel
services:
- name: web
  source_dir: /
  github:
    repo: tu-usuario/turnero-padel
    branch: main
  run_command: pnpm start
  build_command: pnpm build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: NEXTAUTH_SECRET
    value: tu-secret-aqui
  routes:
  - path: /
databases:
- name: db
  engine: PG
  version: "13"
```

## 🔧 Configuración de Producción

### Next.js Config

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client']
  },
  
  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuración de imágenes
  images: {
    domains: [
      'localhost',
      'tu-dominio.com',
      'lh3.googleusercontent.com', // Google avatars
      'avatars.githubusercontent.com' // GitHub avatars
    ],
    formats: ['image/webp', 'image/avif']
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true
      }
    ]
  }
}

module.exports = nextConfig
```

### Variables de Entorno de Producción

```bash
# .env.production

# Base de datos
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="secret-super-seguro-de-32-caracteres-minimo"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# App Configuration
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
NEXT_PUBLIC_APP_NAME="Turnero de Pádel"
NEXT_PUBLIC_ENVIRONMENT="production"

# Email (opcional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-app-password"
EMAIL_FROM="noreply@tu-dominio.com"

# Pagos (opcional)
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Monitoreo (opcional)
SENTRY_DSN="https://..."
ANALYTICS_ID="G-..."
```

### Prisma en Producción

```bash
# Generar cliente para producción
NODE_ENV=production npx prisma generate

# Aplicar schema a producción
NODE_ENV=production npx prisma db push

# Verificar conexión
NODE_ENV=production npx prisma db pull
```

## 📊 Monitoreo y Analytics

### Configurar Sentry (Error Tracking)

```bash
# Instalar Sentry
pnpm add @sentry/nextjs

# Configurar
npx @sentry/wizard -i nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
})
```

### Google Analytics

```tsx
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </body>
    </html>
  )
}
```

### Health Check

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Verificar base de datos
    await db.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 500 }
    )
  }
}
```

## 🔒 Seguridad en Producción

### Checklist de Seguridad

- [ ] **HTTPS habilitado** (automático en Vercel/Netlify)
- [ ] **Variables de entorno seguras** (no hardcodeadas)
- [ ] **NEXTAUTH_SECRET único y seguro** (mínimo 32 caracteres)
- [ ] **Headers de seguridad configurados**
- [ ] **CORS configurado correctamente**
- [ ] **Rate limiting implementado**
- [ ] **Validación de entrada en todas las APIs**
- [ ] **Logs de seguridad configurados**
- [ ] **Backup de base de datos configurado**

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimitMap = new Map()

export function rateLimit(request: NextRequest) {
  const ip = request.ip || 'anonymous'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutos
  const maxRequests = 100

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 0, resetTime: now + windowMs })
  }

  const record = rateLimitMap.get(ip)

  if (now > record.resetTime) {
    record.count = 0
    record.resetTime = now + windowMs
  }

  record.count++

  return {
    success: record.count <= maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime
  }
}
```

## 🚨 Rollback y Recovery

### Estrategia de Rollback

1. **Vercel:**
   - Dashboard > Deployments
   - Click en deployment anterior
   - "Promote to Production"

2. **Base de datos:**
```bash
# Backup antes de cambios importantes
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore si es necesario
psql $DATABASE_URL < backup-20240128.sql
```

3. **Git:**
```bash
# Revertir commit
git revert <commit-hash>
git push origin main

# Rollback a versión anterior
git reset --hard <commit-hash>
git push --force origin main
```

### Monitoreo de Deployments

```bash
# Script de verificación post-deploy
#!/bin/bash

URL="https://tu-dominio.com"

echo "🔍 Verificando deployment..."

# Health check
if curl -f "$URL/api/health" > /dev/null 2>&1; then
  echo "✅ Health check OK"
else
  echo "❌ Health check FAILED"
  exit 1
fi

# Verificar páginas principales
for path in "/" "/auth/signin" "/dashboard"; do
  if curl -f "$URL$path" > /dev/null 2>&1; then
    echo "✅ $path OK"
  else
    echo "❌ $path FAILED"
  fi
done

echo "🎉 Deployment verificado"
```

## 📈 Optimización de Performance

### Configuración de CDN

```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.js'
  }
}
```

```javascript
// lib/image-loader.js
export default function cloudinaryLoader({ src, width, quality }) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`]
  return `https://res.cloudinary.com/tu-cloud-name/image/fetch/${params.join(',')}/${src}`
}
```

### Caching Strategy

```typescript
// app/api/bookings/route.ts
export async function GET() {
  const bookings = await getBookings()
  
  return NextResponse.json(bookings, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

---

**Última actualización**: 2024-01-28  
**Versión**: 1.0

¿Problemas con el despliegue? Consulta la [Guía de Solución de Problemas](./troubleshooting.md) o [crea un issue](https://github.com/tu-usuario/turnero-padel/issues/new).