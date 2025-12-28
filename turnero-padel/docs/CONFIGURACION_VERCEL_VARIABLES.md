# Configuración de Variables de Entorno para Vercel

## Problema Identificado

Las diferencias visuales en el perfil de usuario entre la versión local y Vercel se deben a la configuración incompleta o incorrecta de variables de entorno en producción.

## Variables de Entorno Críticas para Vercel

### 1. Autenticación NextAuth.js

```bash
# URL base de la aplicación (CRÍTICA)
NEXTAUTH_URL=https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app

# Secreto para firmar tokens JWT (mínimo 32 caracteres)
NEXTAUTH_SECRET=tu_clave_secreta_muy_larga_y_segura_para_produccion_vercel_2025

# Configuración OAuth de Google (CRÍTICAS)
GOOGLE_CLIENT_ID=tu_google_client_id_produccion
GOOGLE_CLIENT_SECRET=tu_google_client_secret_produccion
```

### 2. Base de Datos

```bash
# URL de conexión a PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:puerto/database_produccion

# URL directa para migraciones (si es diferente)
DIRECT_URL=postgresql://usuario:password@host:puerto/database_produccion
```

### 3. Administración

```bash
# Lista de emails de administradores (separados por comas)
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### 4. Variables de Entorno del Sistema

```bash
# Entorno de ejecución
NODE_ENV=production

# Configuración de aplicación
NEXT_PUBLIC_APP_URL=https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app
NEXT_PUBLIC_APP_NAME=Turnero de Pádel
```

## Configuración Específica de Google OAuth

### Actualizar Google Cloud Console

1. **Ir a Google Cloud Console**
   - Proyecto: Tu proyecto de Google OAuth
   - APIs y servicios > Credenciales

2. **Actualizar URIs de redirección autorizadas**
   ```
   https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app/api/auth/callback/google
   ```

3. **Actualizar orígenes JavaScript autorizados**
   ```
   https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app
   ```

## Pasos para Configurar en Vercel

### Opción 1: Dashboard de Vercel (Recomendado)

1. **Acceder al proyecto en Vercel**
   - Ir a https://vercel.com/dashboard
   - Seleccionar el proyecto "turnero-padel"

2. **Configurar variables de entorno**
   - Settings > Environment Variables
   - Agregar cada variable con los valores correctos
   - Marcar para: Production, Preview, Development

3. **Redesplegar**
   - Deployments > Redeploy
   - Seleccionar "Use existing Build Cache" = No

### Opción 2: CLI de Vercel

```bash
# Configurar variables una por una
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add DATABASE_URL production
vercel env add ADMIN_EMAILS production

# Redesplegar
vercel --prod
```

## Verificación de la Configuración

### 1. Verificar Variables en Vercel

```bash
# Listar variables configuradas
vercel env ls
```

### 2. Verificar Logs de Despliegue

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver logs de un despliegue específico
vercel logs [deployment-url]
```

### 3. Probar Autenticación

1. Acceder a la aplicación en producción
2. Intentar login con Google
3. Verificar que se muestre:
   - Nombre completo del usuario
   - Badge "Admin" (si corresponde)
   - Avatar con iniciales correctas

## Solución de Problemas Comunes

### Error: "Invalid redirect_uri"

**Causa:** URI de redirección no configurada en Google OAuth
**Solución:** Agregar la URL de Vercel a Google Cloud Console

### Error: "NEXTAUTH_URL is not set"

**Causa:** Variable NEXTAUTH_URL no configurada o incorrecta
**Solución:** Configurar con la URL exacta de Vercel

### Error: "Session is null"

**Causa:** NEXTAUTH_SECRET no configurado o muy corto
**Solución:** Generar secreto de al menos 32 caracteres

### Usuario muestra solo iniciales

**Causa:** Sesión no se carga correctamente por configuración OAuth
**Solución:** Verificar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET

## Generación de Secretos Seguros

```bash
# Generar NEXTAUTH_SECRET seguro
openssl rand -base64 32

# O usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Checklist de Verificación

- [ ] NEXTAUTH_URL configurada con URL exacta de Vercel
- [ ] NEXTAUTH_SECRET configurado (mínimo 32 caracteres)
- [ ] GOOGLE_CLIENT_ID configurado
- [ ] GOOGLE_CLIENT_SECRET configurado
- [ ] DATABASE_URL configurada y accesible
- [ ] ADMIN_EMAILS configurado con emails correctos
- [ ] Google OAuth actualizado con nueva URL
- [ ] Redespliegue realizado sin usar cache
- [ ] Login funciona correctamente
- [ ] Información de usuario se muestra completa
- [ ] Badge "Admin" aparece para administradores

## Monitoreo Post-Configuración

### Logs a Revisar

```bash
# Logs de autenticación
vercel logs | grep "NextAuth"

# Logs de sesión
vercel logs | grep "session"

# Logs de errores
vercel logs | grep "ERROR"
```

### Métricas a Monitorear

- Tiempo de carga de la página de login
- Tasa de éxito de autenticación
- Errores de configuración OAuth
- Tiempo de respuesta de APIs

---

**Fecha de creación:** Enero 2025  
**Estado:** Listo para implementación  
**Prioridad:** ALTA - Crítico para funcionamiento correcto