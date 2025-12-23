# Análisis Exhaustivo: Error 400 redirect_uri_mismatch en Autenticación OAuth

## 1. Descripción Detallada del Error y su Contexto

### Error Principal
**Código de Error**: `400: redirect_uri_mismatch`
**Mensaje**: "No puedes acceder a esta app porque no cumple con la política OAuth 2.0 de Google. Si eres el desarrollador de la app, registra la URI de redireccionamiento en Google Cloud Console."

### Contexto del Sistema
- **Aplicación**: Turnero de Pádel (Next.js 14 con NextAuth.js v5)
- **Proveedor OAuth**: Google Cloud Console
- **Plataforma de Despliegue**: Vercel
- **Entorno Afectado**: Producción

### Manifestación del Error
El error se presenta cuando los usuarios intentan autenticarse con Google en el entorno de producción. La aplicación funciona correctamente en desarrollo local (`localhost:3000`), pero falla consistentemente en producción.

## 2. Soluciones Propuestas con Fundamentación Técnica

### Solución A: Sincronización de Variables de Entorno
**Fundamentación**: Las URLs de Vercel cambian con cada despliegue, causando desincronización entre las variables de entorno y la URL actual.

**Implementación**:
```bash
# Actualizar NEXTAUTH_URL
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
# Valor: https://[nueva-url-vercel].vercel.app

# Actualizar NEXT_PUBLIC_APP_URL
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# Valor: https://[nueva-url-vercel].vercel.app
```

### Solución B: Configuración de Google Cloud Console
**Fundamentación**: Las URIs de redirección autorizadas deben coincidir exactamente con las URLs utilizadas por NextAuth.js.

**Configuración Requerida**:
- **Orígenes de JavaScript autorizados**:
  - `https://[url-actual-vercel].vercel.app`
  - `http://localhost:3000` (desarrollo)

- **URIs de redirección autorizadas**:
  - `https://[url-actual-vercel].vercel.app/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google` (desarrollo)

### Solución C: Implementación de URL Estática
**Fundamentación**: Usar un dominio personalizado para evitar cambios de URL con cada despliegue.

**Implementación**:
1. Configurar dominio personalizado en Vercel
2. Actualizar variables de entorno con URL estática
3. Configurar Google Cloud Console con URL permanente

## 3. Listado de Intentos Realizados y Análisis de Fallos

### Intento 1: Corrección Inicial de Variables de Entorno
**Fecha**: Primera sesión de diagnóstico
**Acciones**:
- Identificación de URLs desactualizadas en `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL`
- Actualización manual de variables de entorno
- Nuevo despliegue a producción

**Resultado**: Éxito temporal
**Causa del Fallo Posterior**: Vercel generó nueva URL en despliegue subsecuente

### Intento 2: Re-corrección de Variables de Entorno
**Fecha**: Segunda sesión de diagnóstico
**Acciones**:
- Detección de nueva desincronización de URLs
- Actualización de variables de entorno con URL más reciente
- Nuevo despliegue forzado

**Resultado**: Éxito temporal
**Causa del Fallo Posterior**: Patrón recurrente de cambio de URLs en Vercel

### Intento 3: Corrección Actual
**Fecha**: Sesión actual
**Acciones**:
- Identificación del patrón recurrente
- Actualización de variables de entorno
- URL actual: `https://turnero-padel-ad3epwv9o-agustinandreslucero-9725s-projects.vercel.app`

**Estado**: Pendiente de verificación
**Riesgo**: Alto potencial de recurrencia del problema

## 4. Recomendaciones para Retomar el Trabajo Posteriormente

### Recomendación Inmediata
1. **Verificar Estado Actual**:
   ```bash
   vercel ls
   vercel env ls
   ```

2. **Actualizar Google Cloud Console** con la URL más reciente:
   - Orígenes JS: `https://turnero-padel-ad3epwv9o-agustinandreslucero-9725s-projects.vercel.app`
   - URI Callback: `https://turnero-padel-ad3epwv9o-agustinandreslucero-9725s-projects.vercel.app/api/auth/callback/google`

### Recomendación a Mediano Plazo
1. **Implementar Dominio Personalizado**:
   - Configurar dominio propio (ej: `turnero-padel.tudominio.com`)
   - Eliminar dependencia de URLs dinámicas de Vercel

2. **Automatización del Proceso**:
   - Script de verificación de sincronización URL-Variables
   - Webhook para actualización automática post-despliegue

### Recomendación a Largo Plazo
1. **Migración a Configuración Estática**:
   - Dominio personalizado permanente
   - Variables de entorno inmutables
   - Documentación de proceso de mantenimiento

## 5. Posibles Causas Raíz del Problema

### Causa Raíz Principal: Arquitectura de URLs Dinámicas de Vercel
**Descripción**: Vercel genera URLs únicas para cada despliegue, causando desincronización automática con la configuración OAuth.

**Evidencia**:
- URLs observadas en diferentes despliegues:
  - `turnero-padel-rmxl7eigm-...`
  - `turnero-padel-pj85rei6s-...`
  - `turnero-padel-ad3epwv9o-...`

### Causa Secundaria: Falta de Sincronización Automática
**Descripción**: No existe mecanismo automático para actualizar Google Cloud Console cuando cambia la URL de Vercel.

**Impacto**: Requiere intervención manual en cada despliegue que genere nueva URL.

### Causa Terciaria: Configuración de NextAuth.js
**Descripción**: NextAuth.js depende de variables de entorno para construir URLs de callback, creando punto de fallo cuando estas no están sincronizadas.

**Archivo Afectado**: `lib/auth.ts`
```typescript
// Configuración actual que depende de variables de entorno
export const authConfig = {
  providers: [
    Google({
      clientId: authConfig.google.clientId,
      clientSecret: authConfig.google.clientSecret,
      // ... resto de configuración
    })
  ],
  // ...
}
```

## 6. Métricas y Monitoreo

### Indicadores de Éxito
- [ ] Autenticación funcional en producción
- [ ] Ausencia de errores 400 en logs
- [ ] Sincronización URL-Variables confirmada

### Puntos de Verificación
1. **Pre-Despliegue**: Verificar URL actual vs variables de entorno
2. **Post-Despliegue**: Confirmar nueva URL y actualizar configuraciones
3. **Post-Configuración**: Probar flujo de autenticación completo

## 7. Archivos y Configuraciones Relevantes

### Archivos de Configuración
- `lib/auth.ts` - Configuración de NextAuth.js
- `lib/config/env.ts` - Validación de variables de entorno
- `vercel.json` - Configuración de despliegue

### Variables de Entorno Críticas
- `NEXTAUTH_URL` - URL base para NextAuth.js
- `NEXT_PUBLIC_APP_URL` - URL pública de la aplicación
- `GOOGLE_CLIENT_ID` - ID del cliente OAuth
- `GOOGLE_CLIENT_SECRET` - Secreto del cliente OAuth

### Comandos de Diagnóstico
```bash
# Verificar despliegues actuales
vercel ls

# Verificar variables de entorno
vercel env ls

# Descargar variables actuales
vercel env pull .env.temp --environment production

# Actualizar variable específica
vercel env rm [VARIABLE] production
vercel env add [VARIABLE] production

# Despliegue forzado
vercel --prod --force
```

## 8. Conclusiones y Próximos Pasos

### Conclusión Principal
El error 400 es un problema sistémico causado por la arquitectura de URLs dinámicas de Vercel combinada con la configuración estática requerida por Google OAuth.

### Próximos Pasos Críticos
1. **Inmediato**: Actualizar Google Cloud Console con URL actual
2. **Corto Plazo**: Implementar dominio personalizado
3. **Mediano Plazo**: Automatizar sincronización de configuraciones
4. **Largo Plazo**: Documentar y estandarizar proceso de mantenimiento

## 9. Resolución aplicada (2025-10-07)

### Causa raíz confirmada
El `redirect_uri_mismatch` ocurría porque `NEXTAUTH_URL` apuntaba a una URL de preview de Vercel que no coincidía con las URIs autorizadas en Google Cloud. NextAuth construye el callback como `NEXTAUTH_URL + /api/auth/callback/google`, por lo que cualquier desajuste provoca el error 400.

### Cambios realizados
- Se fijó `NEXTAUTH_URL` a un dominio estable de producción: `https://turnero-padel.vercel.app`.
- Se verificó que `lib/config/env.ts` lee correctamente `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` mediante `getAuthConfig()`.
- Se confirmó en `lib/auth.ts` que el proveedor de Google usa dichas credenciales y que el callback lo gestiona NextAuth.

### Configuración en Google Cloud Console
- Orígenes autorizados de JavaScript:
  - `http://localhost:3000`
  - `https://turnero-padel.vercel.app`
- URIs de redirección autorizadas:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://turnero-padel.vercel.app/api/auth/callback/google`

### Verificación realizada
- Flujo de login funcionando en producción (`/api/auth/signin`).
- Sesión válida (`/api/auth/session`).
- Se constató que cambios en Google pueden tardar 5–10 minutos en propagarse.

### Buenas prácticas acordadas
- Evitar usar URLs de preview para autenticación; si se necesitan pruebas en previews, añadir temporalmente su callback a Google Cloud y luego removerlo.
- Mantener secretos en `.env.local` y no versionar credenciales reales.

### Variables finales de referencia
```
NEXTAUTH_URL="https://turnero-padel.vercel.app"
NEXTAUTH_SECRET="<clave segura ≥ 32 caracteres>"
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>
```

### Riesgo de Recurrencia
**Alto** - Sin implementación de dominio personalizado, el problema se repetirá en futuros despliegues.

---

**Documento creado**: histórico
**Última actualización**: 2025-10-07
**Estado del problema**: Resuelto en producción (dominio estable + Google OAuth)