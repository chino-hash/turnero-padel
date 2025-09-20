# Solución Error 404 DEPLOYMENT_NOT_FOUND en Admin Panel de Vercel

## 🚨 Problema Identificado

El error `404 DEPLOYMENT_NOT_FOUND` en la URL `https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app/admin-panel/admin` indica problemas específicos de configuración en Vercel.

## 🔍 Análisis del Problema

### 1. Configuración de Next.js Conflictiva
- **Archivo actual**: `next.config.js` con `output: 'standalone'`
- **Archivo duplicado**: `next.config.ts` con configuración diferente
- **Problema**: Vercel puede estar usando la configuración incorrecta

### 2. Estructura de Rutas
- **Ruta local funcional**: `/admin-panel/admin`
- **Middleware protege**: `/admin-panel` está en `adminRoutes`
- **Estructura existe**: `app/admin-panel/admin/page.tsx` presente

### 3. Variables de Entorno Faltantes
- `NEXTAUTH_URL` no configurada para producción
- `ADMIN_EMAILS` no definida
- Credenciales de Google OAuth incompletas

## 🛠️ Soluciones Paso a Paso

### Paso 1: Limpiar Configuración de Next.js

1. **Eliminar archivo duplicado**:
   ```bash
   # Eliminar next.config.ts (mantener solo next.config.js)
   rm next.config.ts
   ```

2. **Actualizar next.config.js**:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     // Remover output: 'standalone' para Vercel
     experimental: {
       forceSwcTransforms: true,
     },
     webpack: (config, { isServer }) => {
       if (!isServer) {
         config.resolve.fallback = {
           ...config.resolve.fallback,
           fs: false,
           net: false,
           tls: false,
         }
       }
       return config
     },
     trailingSlash: false,
     
     // Configurar redirects para admin
     async redirects() {
       return [
         {
           source: '/admin',
           destination: '/admin-panel/admin',
           permanent: false
         }
       ]
     }
   }
   
   module.exports = nextConfig
   ```

### Paso 2: Configurar Variables de Entorno en Vercel

#### Variables Críticas para Admin Panel:
```bash
# Autenticación
NEXTAUTH_URL=https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app
NEXTAUTH_SECRET=tu_secret_super_seguro_aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Base de datos
DATABASE_URL=tu_database_url_postgresql

# Administradores
ADMIN_EMAILS=tu_email@gmail.com,otro_admin@gmail.com

# Configuración de entorno
NODE_ENV=production
```

### Paso 3: Actualizar Google OAuth

1. **Ir a Google Cloud Console**
2. **Agregar URL autorizada**:
   - `https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app`
3. **Agregar redirect URI**:
   - `https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app/api/auth/callback/google`

### Paso 4: Verificar Configuración de Vercel

#### En vercel.json:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Paso 5: Proceso de Despliegue

1. **Limpiar caché de Vercel**:
   - Ir a Settings → Functions
   - Hacer clic en "Clear Cache"

2. **Redesplegar**:
   - Ir a Deployments
   - Hacer clic en "Redeploy" en el último deployment
   - Seleccionar "Use existing Build Cache: No"

3. **Verificar logs**:
   - Revisar Function Logs durante el despliegue
   - Buscar errores relacionados con rutas o middleware

## 🔧 Comandos de Verificación

### Verificar Variables de Entorno:
```bash
# Endpoint de debug (solo en desarrollo)
curl https://tu-app.vercel.app/api/debug-env \
  -H "Authorization: Bearer debug-token-2024"
```

### Verificar Autenticación:
```bash
# Probar login
curl -X POST https://tu-app.vercel.app/api/auth/signin/google
```

## 🚨 Problemas Comunes y Soluciones

### Error: "DEPLOYMENT_NOT_FOUND"
- **Causa**: Configuración de build incorrecta
- **Solución**: Verificar `next.config.js` y eliminar `output: 'standalone'`

### Error: "Access Denied"
- **Causa**: `ADMIN_EMAILS` no configurada
- **Solución**: Agregar variable con emails de administradores

### Error: "NextAuth Configuration"
- **Causa**: `NEXTAUTH_URL` incorrecta
- **Solución**: Usar URL completa de Vercel

### Error: "Google OAuth"
- **Causa**: Redirect URI no autorizada
- **Solución**: Actualizar configuración en Google Cloud Console

## ✅ Checklist de Verificación

- [ ] Eliminar `next.config.ts` duplicado
- [ ] Actualizar `next.config.js` sin `output: 'standalone'`
- [ ] Configurar todas las variables de entorno en Vercel
- [ ] Actualizar Google OAuth con URLs de Vercel
- [ ] Limpiar caché de Vercel
- [ ] Redesplegar sin caché
- [ ] Verificar acceso a `/admin-panel/admin`
- [ ] Probar login y permisos de admin

## 📞 Soporte Adicional

Si el problema persiste después de seguir estos pasos:

1. **Revisar logs de Vercel** en tiempo real
2. **Verificar Function Logs** para errores específicos
3. **Probar en modo incógnito** para evitar caché del navegador
4. **Verificar que el email esté en ADMIN_EMAILS**

---

**Nota**: El error `DEPLOYMENT_NOT_FOUND` es específico de Vercel y generalmente se resuelve con la configuración correcta de Next.js y las variables de entorno.