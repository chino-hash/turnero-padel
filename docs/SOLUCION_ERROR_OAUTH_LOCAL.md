# Solución: Error 401 invalid_client en Google OAuth (Desarrollo Local)

## 🔴 Problema

Estás viendo el error:
```
Error 401: invalid_client
The OAuth client was not found.
```

Este error ocurre cuando el `GOOGLE_CLIENT_ID` no es válido o no está configurado correctamente en tu entorno local.

## ✅ Solución Paso a Paso

### 1. Crear Credenciales OAuth en Google Cloud Console

1. **Ir a Google Cloud Console:**
   - Visita: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Inicia sesión con tu cuenta de Google

2. **Crear o seleccionar un proyecto:**
   - Si no tienes un proyecto, haz clic en "Crear proyecto"
   - Dale un nombre (ej: "Turnero Padel")
   - Haz clic en "Crear"

3. **Habilitar la API de Google+ o Google Identity:**
   - En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google+ API" o "Google Identity"
   - Haz clic en "Habilitar"

4. **Crear credenciales OAuth 2.0:**
   - Ve a "APIs y servicios" > "Credenciales"
   - Haz clic en "Crear credenciales" > "ID de cliente OAuth 2.0"
   - Si es la primera vez, selecciona "Configurar pantalla de consentimiento":
     - Tipo de usuario: "Externo" (para desarrollo)
     - Completa la información básica
     - Agrega tu email en "Usuarios de prueba"
     - Guarda y continúa
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "Turnero Padel - Desarrollo Local"

5. **Configurar URLs de redirección:**
   
   En "URIs de redirección autorizadas", agrega:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   
   También puedes agregar (opcional):
   ```
   http://127.0.0.1:3000/api/auth/callback/google
   ```

6. **Obtener las credenciales:**
   - Después de crear, verás una ventana con:
     - **ID de cliente** (Client ID): Algo como `123456789-abc123.apps.googleusercontent.com`
     - **Secreto de cliente** (Client Secret): Una cadena de caracteres
   - **¡IMPORTANTE!** Copia estos valores, los necesitarás en el siguiente paso

### 2. Configurar Variables de Entorno Local

1. **Crear o editar el archivo `.env.local` en la raíz del proyecto:**

```bash
# Si no existe, créalo
touch .env.local
```

2. **Agregar las siguientes variables con tus credenciales reales:**

```bash
# 🔐 AUTENTICACIÓN NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-seguro-minimo-32-caracteres-aqui

# 🔑 GOOGLE OAUTH (REEMPLAZA CON TUS CREDENCIALES REALES)
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-client-secret-aqui

# 🗄️ BASE DE DATOS
DATABASE_URL=postgresql://usuario:password@localhost:5432/turnero_padel

# 👥 ADMINISTRADORES
ADMIN_EMAILS=tu-email@gmail.com
```

**⚠️ IMPORTANTE:**
- Reemplaza `GOOGLE_CLIENT_ID` con el ID que copiaste de Google Cloud Console
- Reemplaza `GOOGLE_CLIENT_SECRET` con el Secret que copiaste
- Genera un `NEXTAUTH_SECRET` seguro (mínimo 32 caracteres)
- Reemplaza `DATABASE_URL` con tu conexión real a PostgreSQL
- Reemplaza `ADMIN_EMAILS` con tu email de Google

### 3. Generar un NEXTAUTH_SECRET seguro

Puedes generar uno usando uno de estos métodos:

**Opción 1: Usando OpenSSL (recomendado)**
```bash
openssl rand -base64 32
```

**Opción 2: Usando Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opción 3: Online (menos seguro)**
Visita: https://generate-secret.vercel.app/32

### 4. Reiniciar el Servidor de Desarrollo

Después de configurar las variables de entorno:

1. **Detener el servidor actual** (Ctrl+C en la terminal)
2. **Reiniciar el servidor:**
```bash
npm run dev
```

⚠️ **Nota:** Next.js solo lee las variables de entorno al iniciar, así que **debes reiniciar el servidor** después de cambiar `.env.local`.

### 5. Verificar la Configuración

1. **Verificar variables de entorno (opcional pero recomendado):**
   
   Puedes usar el endpoint de debug para verificar que las variables estén cargadas:
   ```
   http://localhost:3000/api/debug-env
   ```
   
   Deberías ver algo como:
   ```json
   {
     "NODE_ENV": "development",
     "NEXTAUTH_URL": "http://localhost:3000",
     "NEXTAUTH_SECRET": "SET",
     "GOOGLE_CLIENT_ID": "SET",
     "GOOGLE_CLIENT_SECRET": "SET",
     "DATABASE_URL": "SET",
     "GOOGLE_CLIENT_ID_PREVIEW": "123456789-abc123def...",
     "NEXTAUTH_URL_FULL": "http://localhost:3000"
   }
   ```
   
   Si ves "NOT SET" en alguna variable, significa que no se cargó correctamente desde `.env.local`.

2. **Abrir la aplicación:**
   ```
   http://localhost:3000
   ```

3. **Intentar iniciar sesión con Google:**
   - Deberías ser redirigido a la pantalla de consentimiento de Google
   - Si ves el error nuevamente, verifica que:
     - Las credenciales estén correctas en `.env.local`
     - El servidor se haya reiniciado después de cambiar `.env.local`
     - La URL de redirección en Google Console sea exactamente: `http://localhost:3000/api/auth/callback/google`

### 6. Solución de Problemas Adicionales

#### El error persiste después de configurar las credenciales:

1. **Verificar que el archivo `.env.local` esté en la raíz del proyecto** (mismo nivel que `package.json`)

2. **Verificar que no haya espacios extra en las variables:**
   ```bash
   # ❌ INCORRECTO
   GOOGLE_CLIENT_ID = 123456789-abc.apps.googleusercontent.com
   
   # ✅ CORRECTO
   GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   ```

3. **Verificar que no haya comillas innecesarias:**
   ```bash
   # ✅ CORRECTO (sin comillas)
   GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   
   # ✅ TAMBIÉN CORRECTO (con comillas si hay espacios)
   GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
   ```

4. **Limpiar el caché de Next.js:**
   ```bash
   rm -rf .next
   npm run dev
   ```

5. **Verificar en la consola del navegador:**
   - Abre las DevTools (F12)
   - Ve a la pestaña "Console"
   - Busca mensajes de error relacionados con OAuth

#### La pantalla de consentimiento muestra "Esta app no ha sido verificada":

Esto es normal en desarrollo. Para continuar:
1. Haz clic en "Avanzado"
2. Haz clic en "Ir a [nombre de tu app] (no seguro)"
3. Esto te permitirá continuar con el flujo de autenticación

#### Error: "redirect_uri_mismatch"

Verifica que en Google Cloud Console hayas agregado exactamente:
```
http://localhost:3000/api/auth/callback/google
```

Sin barra final, sin espacios, exactamente como se muestra arriba.

## 📝 Checklist Final

Antes de intentar iniciar sesión nuevamente, verifica:

- [ ] Tienes credenciales OAuth creadas en Google Cloud Console
- [ ] El Client ID y Client Secret están en `.env.local`
- [ ] La URL de redirección está configurada en Google Console
- [ ] `NEXTAUTH_URL` está configurado como `http://localhost:3000`
- [ ] `NEXTAUTH_SECRET` tiene al menos 32 caracteres
- [ ] El servidor de desarrollo se reinició después de cambiar `.env.local`
- [ ] No hay errores en la consola del servidor (terminal donde corre `npm run dev`)

## 🔗 Referencias Útiles

- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentación de NextAuth.js](https://next-auth.js.org/providers/google)
- [Documentación de OAuth 2.0 de Google](https://developers.google.com/identity/protocols/oauth2)

## 💡 Notas Adicionales

- El archivo `.env.local` está en `.gitignore` por seguridad, nunca lo subas a Git
- Para producción, necesitarás crear credenciales OAuth separadas con la URL de producción
- Las credenciales de desarrollo funcionan solo con las URLs que configuraste en Google Console
- Si cambias de computadora, necesitarás crear nuevas credenciales o reutilizar las existentes

