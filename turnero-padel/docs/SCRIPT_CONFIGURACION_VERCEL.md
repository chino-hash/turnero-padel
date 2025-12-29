# Script de Configuración para Vercel

## Instrucciones Paso a Paso

### Paso 1: Acceder al Dashboard de Vercel

1. Ir a https://vercel.com/dashboard
2. Iniciar sesión con tu cuenta
3. Buscar y seleccionar el proyecto "turnero-padel"

### Paso 2: Configurar Variables de Entorno

1. **Ir a Settings**
   - En el proyecto, hacer clic en "Settings"
   - Seleccionar "Environment Variables" en el menú lateral

2. **Agregar Variables Críticas**

   **Variable 1: NEXTAUTH_URL**
   ```
   Name: NEXTAUTH_URL
   Value: https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

   **Variable 2: NEXTAUTH_SECRET**
   ```
   Name: NEXTAUTH_SECRET
   Value: [Generar con: openssl rand -base64 32]
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

   **Variable 3: GOOGLE_CLIENT_ID**
   ```
   Name: GOOGLE_CLIENT_ID
   Value: [Tu Google Client ID de producción]
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

   **Variable 4: GOOGLE_CLIENT_SECRET**
   ```
   Name: GOOGLE_CLIENT_SECRET
   Value: [Tu Google Client Secret de producción]
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

   **Variable 5: DATABASE_URL**
   ```
   Name: DATABASE_URL
   Value: [Tu URL de PostgreSQL de producción]
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

   **Variable 6: ADMIN_EMAILS**
   ```
   Name: ADMIN_EMAILS
   Value: admin@example.com,admin2@example.com
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

### Paso 3: Configurar Google OAuth

1. **Ir a Google Cloud Console**
   - https://console.cloud.google.com/
   - Seleccionar tu proyecto OAuth

2. **Actualizar Credenciales OAuth**
   - APIs y servicios > Credenciales
   - Seleccionar tu OAuth 2.0 Client ID

3. **Agregar URIs Autorizadas**
   
   **Orígenes JavaScript autorizados:**
   ```
   https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app
   ```

   **URIs de redirección autorizadas:**
   ```
   https://turnero-padel-g8ln6meto-agustinandreslucero-9725s-projects.vercel.app/api/auth/callback/google
   ```

4. **Guardar cambios**

### Paso 4: Redesplegar la Aplicación

1. **En Vercel Dashboard**
   - Ir a "Deployments"
   - Hacer clic en los tres puntos (...) del último deployment
   - Seleccionar "Redeploy"
   - **IMPORTANTE:** Desmarcar "Use existing Build Cache"
   - Hacer clic en "Redeploy"

2. **Esperar el Despliegue**
   - Monitorear el progreso en tiempo real
   - Verificar que no haya errores en los logs

### Paso 5: Verificar la Configuración

1. **Probar Login**
   - Ir a la aplicación en producción
   - Hacer clic en "Iniciar Sesión"
   - Probar login con Google

2. **Verificar Información de Usuario**
   - Comprobar que se muestre el nombre completo
   - Verificar que aparezca el badge "Admin" (si corresponde)
   - Confirmar que el avatar muestre las iniciales correctas

3. **Verificar Funcionalidad Admin**
   - Acceder al panel de administración
   - Verificar que todas las secciones funcionen correctamente

### Paso 6: Monitoreo y Logs

1. **Verificar Logs en Tiempo Real**
   ```bash
   # Si tienes Vercel CLI instalado
   vercel logs --follow
   ```

2. **O desde el Dashboard**
   - Functions > View Function Logs
   - Buscar errores relacionados con autenticación

### Comandos de Verificación (Opcional)

Si tienes Vercel CLI instalado:

```bash
# Verificar variables configuradas
vercel env ls

# Ver logs específicos
vercel logs [deployment-url]

# Redesplegar desde CLI
vercel --prod
```

## Checklist de Verificación Final

### Variables de Entorno
- [ ] NEXTAUTH_URL configurada correctamente
- [ ] NEXTAUTH_SECRET generado y configurado
- [ ] GOOGLE_CLIENT_ID configurado
- [ ] GOOGLE_CLIENT_SECRET configurado
- [ ] DATABASE_URL configurada
- [ ] ADMIN_EMAILS configurado

### Google OAuth
- [ ] Origen JavaScript autorizado agregado
- [ ] URI de redirección autorizada agregada
- [ ] Cambios guardados en Google Cloud Console

### Despliegue
- [ ] Redespliegue realizado sin cache
- [ ] Despliegue completado sin errores
- [ ] Logs revisados sin errores críticos

### Funcionalidad
- [ ] Login con Google funciona
- [ ] Información completa del usuario se muestra
- [ ] Badge "Admin" aparece correctamente
- [ ] Panel de administración accesible
- [ ] Todas las funciones admin operativas

## Solución de Problemas

### Si el login falla:
1. Verificar que NEXTAUTH_URL sea exactamente la URL de Vercel
2. Confirmar que Google OAuth tenga las URIs correctas
3. Revisar logs para errores específicos

### Si no aparece información del usuario:
1. Verificar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
2. Confirmar que DATABASE_URL sea accesible
3. Revisar que NEXTAUTH_SECRET esté configurado

### Si no aparece badge "Admin":
1. Verificar ADMIN_EMAILS tenga el email correcto
2. Confirmar que el usuario esté logueado con email de admin
3. Revisar logs de verificación de admin

---

**Tiempo estimado:** 15-30 minutos  
**Dificultad:** Intermedio  
**Requiere:** Acceso a Vercel Dashboard y Google Cloud Console