# Guía de Despliegue en Vercel - Turnero de Padel

## 📋 Variables de Entorno Requeridas

### Variables Obligatorias

#### Autenticación NextAuth.js
```bash
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=tu-clave-secreta-minimo-32-caracteres
```

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

#### Base de Datos PostgreSQL
```bash
DATABASE_URL=postgresql://usuario:password@host:puerto/database?sslmode=require
```

#### Administradores
```bash
ADMIN_EMAILS=admin@turnero.com,tu-email@gmail.com
```

#### Configuración de Aplicación
```bash
NODE_ENV=production
```

## 🚀 Pasos para el Despliegue

### 1. Preparación del Repositorio
- ✅ Verificar que el código esté en GitHub
- ✅ Asegurar que `.env*` esté en `.gitignore`
- ✅ Confirmar que `package.json` tiene scripts correctos

### 2. Configuración en Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Conectar con GitHub
3. Importar el repositorio
4. Configurar variables de entorno

### 3. Variables de Entorno en Vercel Dashboard
```
NEXTAUTH_URL → https://tu-proyecto.vercel.app
NEXTAUTH_SECRET → [generar clave segura]
GOOGLE_CLIENT_ID → [desde Google Console]
GOOGLE_CLIENT_SECRET → [desde Google Console]
DATABASE_URL → [URL de tu base de datos PostgreSQL]
ADMIN_EMAILS → [emails separados por comas]
NODE_ENV → production
```

### 4. Configuración de Google OAuth
- Agregar dominio autorizado: `https://tu-proyecto.vercel.app`
- Callback URL: `https://tu-proyecto.vercel.app/api/auth/callback/google`

### 5. Base de Datos
**Opciones recomendadas:**
- **Neon** (gratuito): [neon.tech](https://neon.tech)
- **Supabase** (gratuito): [supabase.com](https://supabase.com)
- **Railway** (pago): [railway.app](https://railway.app)

## 🔧 Comandos de Despliegue

### Usando Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

### Usando GitHub Integration
1. Push a la rama `main`
2. Vercel desplegará automáticamente

## 🛡️ Checklist de Seguridad

- [ ] Variables de entorno configuradas en Vercel (no en código)
- [ ] `NEXTAUTH_SECRET` es una clave fuerte (32+ caracteres)
- [ ] Google OAuth configurado con dominio correcto
- [ ] Base de datos con SSL habilitado
- [ ] Emails de admin configurados correctamente
- [ ] `.env*` en `.gitignore`

## 🔍 Verificación Post-Despliegue

1. **Acceso a la aplicación**: `https://tu-proyecto.vercel.app`
2. **Login con Google**: Verificar autenticación
3. **Panel de admin**: Confirmar acceso con email admin
4. **Base de datos**: Verificar conexión y datos
5. **APIs**: Probar endpoints principales

## 🐛 Troubleshooting

### Error: "Invalid redirect URI"
- Verificar callback URL en Google Console
- Confirmar `NEXTAUTH_URL` en variables de entorno

### Error: "Database connection failed"
- Verificar `DATABASE_URL` en variables de entorno
- Confirmar que la base de datos acepta conexiones SSL

### Error: "Unauthorized access"
- Verificar `ADMIN_EMAILS` en variables de entorno
- Confirmar formato de emails (separados por comas)

## 📞 Soporte

Para problemas específicos:
1. Revisar logs en Vercel Dashboard
2. Verificar variables de entorno
3. Consultar documentación de NextAuth.js
4. Revisar configuración de base de datos

---

**Nota**: Este proyecto usa Next.js 15 con App Router y NextAuth.js v5. Asegurar compatibilidad con las versiones especificadas en `package.json`.