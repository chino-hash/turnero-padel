# API de Autenticación - NextAuth.js

## Información del Endpoint

**Endpoint**: `GET/POST /api/auth/[...nextauth]`  
**Archivo**: `app/api/auth/[...nextauth]/route.ts`  
**Versión**: `v1.0`  
**Autor**: Sistema NextAuth.js  
**Fecha**: 2024-01-15

## Descripción

Endpoint dinámico que maneja todas las operaciones de autenticación mediante NextAuth.js, incluyendo inicio de sesión, cierre de sesión, callbacks y gestión de sesiones.

## Autenticación

- **Requerida**: No (este endpoint maneja la autenticación)
- **Tipo**: OAuth 2.0 (Google)
- **Roles**: Público para autenticación, privado para gestión de sesión

## Rutas Dinámicas

NextAuth.js maneja automáticamente las siguientes rutas:

### Inicio de Sesión
```
GET /api/auth/signin
GET /api/auth/signin/google
```

### Cierre de Sesión
```
GET /api/auth/signout
POST /api/auth/signout
```

### Callbacks
```
GET /api/auth/callback/google
```

### Sesión
```
GET /api/auth/session
```

### Providers
```
GET /api/auth/providers
```

### CSRF Token
```
GET /api/auth/csrf
```

## Configuración

### Variables de Entorno Requeridas

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Base de datos
DATABASE_URL=your-database-url
```

## Proveedores de Autenticación

### Google OAuth

**Configuración**:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
})
```

**Scopes**: `openid`, `email`, `profile`

## Callbacks Personalizados

### JWT Callback
```typescript
async jwt({ token, user, account }) {
  if (user) {
    token.role = user.role
    token.isAdmin = user.isAdmin
  }
  return token
}
```

### Session Callback
```typescript
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.sub!
    session.user.role = token.role as 'USER' | 'ADMIN'
    session.user.isAdmin = token.isAdmin as boolean
  }
  return session
}
```

### SignIn Callback
```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === 'google') {
    // Verificar si el usuario existe o crearlo
    const existingUser = await getUserByEmail(user.email!)
    if (!existingUser) {
      await createUser({
        email: user.email!,
        name: user.name,
        image: user.image,
        role: 'USER'
      })
    }
    return true
  }
  return false
}
```

## Respuestas

### GET /api/auth/session

**Respuesta Exitosa (200)**:
```json
{
  "user": {
    "id": "user-123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": "https://lh3.googleusercontent.com/...",
    "role": "USER",
    "isAdmin": false
  },
  "expires": "2024-02-15T10:30:00.000Z"
}
```

**Sin Sesión (200)**:
```json
null
```

### GET /api/auth/providers

**Respuesta (200)**:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "/api/auth/signin/google",
    "callbackUrl": "/api/auth/callback/google"
  }
}
```

### GET /api/auth/csrf

**Respuesta (200)**:
```json
{
  "csrfToken": "abc123def456..."
}
```

## Ejemplos de Uso

### Cliente React

```typescript
import { signIn, signOut, useSession } from 'next-auth/react'

// Obtener sesión
const { data: session, status } = useSession()

// Iniciar sesión con Google
const handleSignIn = () => {
  signIn('google', { callbackUrl: '/dashboard' })
}

// Cerrar sesión
const handleSignOut = () => {
  signOut({ callbackUrl: '/login' })
}

// Verificar autenticación
if (status === 'loading') return <p>Cargando...</p>
if (status === 'unauthenticated') return <p>No autenticado</p>

return (
  <div>
    <p>Bienvenido, {session?.user?.name}</p>
    <button onClick={handleSignOut}>Cerrar Sesión</button>
  </div>
)
```

### Servidor (API Route)

```typescript
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }
  
  // Usuario autenticado
  return NextResponse.json({ user: session.user })
}
```

### Middleware

```typescript
import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.isAdmin || false
  
  // Lógica de protección de rutas
  if (!isLoggedIn && req.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return NextResponse.next()
})
```

## Seguridad

### Características de Seguridad

1. **CSRF Protection**: Tokens CSRF automáticos
2. **Secure Cookies**: Cookies seguras en producción
3. **JWT Signing**: Tokens JWT firmados
4. **State Parameter**: Protección OAuth state
5. **Nonce Validation**: Validación de nonce en OpenID Connect

### Configuración de Cookies

```typescript
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
}
```

## Base de Datos

### Tablas Utilizadas

- `User`: Información del usuario
- `Account`: Cuentas OAuth vinculadas
- `Session`: Sesiones activas
- `VerificationToken`: Tokens de verificación

### Esquema de Usuario

```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
```

## Logging y Monitoreo

### Eventos Registrados

```typescript
events: {
  async signIn({ user, account, profile }) {
    console.log(`Usuario ${user.email} inició sesión con ${account?.provider}`)
    // Registrar en sistema de logging
  },
  async signOut({ session }) {
    console.log(`Usuario ${session?.user?.email} cerró sesión`)
    // Registrar en sistema de logging
  }
}
```

## Manejo de Errores

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Configuration` | Variables de entorno faltantes | Verificar `.env` |
| `OAuthAccountNotLinked` | Email ya existe con otro proveedor | Vincular cuentas |
| `AccessDenied` | Usuario rechazó permisos | Reintentar autorización |
| `Callback` | Error en callback URL | Verificar configuración OAuth |

### Página de Error Personalizada

```typescript
pages: {
  error: '/auth/error',
  signIn: '/login'
}
```

## Testing

### Mocks para Testing

```typescript
// __mocks__/next-auth/react.js
export const useSession = jest.fn(() => ({
  data: {
    user: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      isAdmin: false
    }
  },
  status: 'authenticated'
}))

export const signIn = jest.fn()
export const signOut = jest.fn()
```

### Tests de Integración

```typescript
describe('/api/auth', () => {
  it('should return session for authenticated user', async () => {
    const response = await fetch('/api/auth/session')
    const session = await response.json()
    
    expect(session).toHaveProperty('user')
    expect(session.user).toHaveProperty('email')
  })
  
  it('should return null for unauthenticated user', async () => {
    const response = await fetch('/api/auth/session')
    const session = await response.json()
    
    expect(session).toBeNull()
  })
})
```

## Problemas Conocidos

1. **Sesiones Concurrentes**: No hay límite de sesiones por usuario
2. **Refresh Tokens**: No se implementan refresh tokens automáticos
3. **Rate Limiting**: No hay limitación de intentos de login

## Mejoras Futuras

1. **Multi-Factor Authentication**: Implementar 2FA
2. **Social Logins**: Agregar más proveedores (Facebook, GitHub)
3. **Session Management**: Panel de gestión de sesiones
4. **Audit Logs**: Logging detallado de eventos de seguridad
5. **Rate Limiting**: Protección contra ataques de fuerza bruta

## Referencias

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT Specification](https://tools.ietf.org/html/rfc7519)

---

**Última actualización**: 2024-01-15  
**Versión**: 1.0  
**Runtime**: Node.js