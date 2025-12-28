# Guía Completa de Configuración de Vercel - Turnero de Padel

## 🎯 Objetivo
Configurar correctamente el proyecto en Vercel para que funcione idénticamente a la versión local, incluyendo el acceso completo al admin panel.

## 📋 Checklist Pre-Configuración

### ✅ Cambios Realizados en el Código
- [x] Eliminado `next.config.ts` duplicado
- [x] Actualizado `next.config.js` sin `output: 'standalone'`
- [x] Agregado `serverExternalPackages` para Prisma
- [x] Configurado redirects para admin panel
- [x] Actualizado `vercel.json` con configuración de functions

## 🔧 Paso 1: Configurar Variables de Entorno en Vercel

### Acceder al Dashboard de Vercel:
1. Ir a [vercel.com](https://vercel.com)
2. Seleccionar el proyecto `turnero-padel`
3. Ir a **Settings** → **Environment Variables**

### Variables Críticas a Configurar:

#### 🔐 Autenticación (NextAuth)
```bash
NEXTAUTH_URL=https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app
NEXTAUTH_SECRET=tu_secret_super_seguro_de_32_caracteres_minimo
```

#### 🔑 Google OAuth
```bash
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

#### 🗄️ Base de Datos
```bash
DATABASE_URL=postgresql://usuario:password@host:5432/database_name
```

#### 👨‍💼 Administradores
```bash
ADMIN_EMAILS=tu_email@gmail.com,otro_admin@gmail.com
```

#### 🌍 Configuración de Entorno
```bash
NODE_ENV=production
```

### Configurar Variables por Entorno:
- **Production**: Todas las variables anteriores
- **Preview**: Mismas variables (opcional)
- **Development**: No necesario (usa .env.local)

## 🔧 Paso 2: Configurar Google OAuth

### Acceder a Google Cloud Console:
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Seleccionar tu proyecto
3. Ir a **APIs & Services** → **Credentials**

### Configurar OAuth 2.0 Client:
1. Seleccionar tu OAuth 2.0 Client ID
2. En **Authorized JavaScript origins**, agregar:
   ```
   https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app
   ```
3. En **Authorized redirect URIs**, agregar:
   ```
   https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app/api/auth/callback/google
   ```
4. Hacer clic en **Save**

## 🔧 Paso 3: Verificar Base de Datos

### Si usas Neon/PostgreSQL:
1. Verificar que la base de datos esté activa
2. Confirmar que `DATABASE_URL` sea correcta
3. Verificar que las tablas estén migradas

### Comando de verificación (local):
```bash
npx prisma db push
npx prisma generate
```

## 🔧 Paso 4: Desplegar en Vercel

### Opción A: Desde el Dashboard
1. Ir a **Deployments**
2. Hacer clic en **Redeploy** en el último deployment
3. **IMPORTANTE**: Desmarcar "Use existing Build Cache"
4. Hacer clic en **Redeploy**

### Opción B: Desde Git
1. Hacer commit de los cambios:
   ```bash
   git add .
   git commit -m "fix: configuración Vercel para admin panel"
   git push origin main
   ```
2. Vercel desplegará automáticamente

## 🔧 Paso 5: Verificar el Despliegue

### Verificar Variables de Entorno:
```bash
curl https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app/api/debug-env \
  -H "Authorization: Bearer debug-token-2024"
```

### Verificar Rutas del Admin:
1. **Página principal**: `https://tu-app.vercel.app/`
2. **Login**: `https://tu-app.vercel.app/login`
3. **Admin Panel**: `https://tu-app.vercel.app/admin-panel/admin`

## 🔧 Paso 6: Probar Funcionalidad

### Test de Login:
1. Ir a la aplicación en Vercel
2. Hacer clic en "Iniciar Sesión"
3. Autenticarse con Google
4. Verificar que aparezca la información del usuario

### Test de Admin Panel:
1. Asegurarse de que tu email esté en `ADMIN_EMAILS`
2. Ir a `/admin-panel/admin`
3. Verificar que cargue el dashboard de administración
4. Probar funcionalidades como gestión de canchas, usuarios, etc.

## 🚨 Solución de Problemas Comunes

### Error: "DEPLOYMENT_NOT_FOUND"
**Causa**: Configuración de Next.js incorrecta
**Solución**: 
- Verificar que no exista `output: 'standalone'` en `next.config.js`
- Limpiar caché de Vercel y redesplegar

### Error: "Access Denied" en Admin Panel
**Causa**: Email no está en `ADMIN_EMAILS`
**Solución**:
- Verificar que `ADMIN_EMAILS` esté configurada
- Confirmar que tu email esté incluido en la lista
- Redesplegar después de cambiar variables

### Error: "NextAuth Configuration Error"
**Causa**: `NEXTAUTH_URL` incorrecta o `NEXTAUTH_SECRET` faltante
**Solución**:
- Usar URL completa de Vercel en `NEXTAUTH_URL`
- Generar `NEXTAUTH_SECRET` de al menos 32 caracteres

### Error: "Google OAuth Error"
**Causa**: Redirect URI no autorizada
**Solución**:
- Verificar configuración en Google Cloud Console
- Asegurar que las URLs coincidan exactamente

### Error: "Database Connection"
**Causa**: `DATABASE_URL` incorrecta o base de datos inactiva
**Solución**:
- Verificar conexión a la base de datos
- Confirmar que las migraciones estén aplicadas

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real:
1. Ir a **Functions** en el dashboard de Vercel
2. Seleccionar una función (ej: `/api/auth/[...nextauth]`)
3. Ver logs en tiempo real

### Verificar Performance:
1. Ir a **Analytics** (si está habilitado)
2. Monitorear tiempos de respuesta
3. Verificar errores 404 o 500

## 🎉 Verificación Final

### Checklist de Funcionalidad:
- [ ] Página principal carga correctamente
- [ ] Login con Google funciona
- [ ] Información de usuario se muestra completa
- [ ] Badge "Admin" aparece para administradores
- [ ] Admin panel es accesible en `/admin-panel/admin`
- [ ] Todas las funciones de admin funcionan
- [ ] No hay errores 404 o 500 en las rutas principales

### URLs de Prueba:
```
✅ https://tu-app.vercel.app/
✅ https://tu-app.vercel.app/login
✅ https://tu-app.vercel.app/dashboard
✅ https://tu-app.vercel.app/admin-panel/admin
✅ https://tu-app.vercel.app/admin-panel/usuarios
✅ https://tu-app.vercel.app/admin-panel/canchas
```

## 📞 Soporte Adicional

Si después de seguir todos estos pasos aún hay problemas:

1. **Revisar logs de Vercel** en detalle
2. **Verificar Function Logs** para errores específicos
3. **Probar en modo incógnito** para evitar caché
4. **Comparar con versión local** funcionando

---

## 🔄 Mantenimiento Continuo

### Actualizaciones Futuras:
- Siempre probar cambios localmente primero
- Usar Preview Deployments para cambios importantes
- Mantener variables de entorno actualizadas
- Monitorear logs regularmente

### Backup de Configuración:
- Documentar todas las variables de entorno
- Mantener copia de configuración de Google OAuth
- Respaldar configuración de base de datos

---

**Nota**: Esta guía asume que tienes acceso completo al proyecto en Vercel y a la configuración de Google Cloud Console. Si no tienes acceso, contacta al administrador del proyecto.