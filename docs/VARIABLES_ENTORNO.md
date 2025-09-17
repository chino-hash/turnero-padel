# Variables de Entorno - Turnero de Pádel

## Descripción General

Este documento describe todas las variables de entorno necesarias para el funcionamiento correcto de la aplicación Turnero de Pádel. La aplicación utiliza un sistema de configuración centralizada que valida y gestiona estas variables de forma segura.

## Variables Requeridas

### Configuración de Entorno
```bash
# Entorno de ejecución (development, production, test)
NODE_ENV=development
```

### Autenticación (NextAuth.js)
```bash
# URL base de la aplicación
NEXTAUTH_URL=http://localhost:3000

# Clave secreta para firmar tokens JWT (mínimo 32 caracteres)
NEXTAUTH_SECRET=tu_clave_secreta_muy_larga_y_segura_aqui

# Configuración OAuth de Google
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
```

### Base de Datos
```bash
# URL de conexión a PostgreSQL (Neon, Supabase, etc.)
DATABASE_URL=postgresql://usuario:password@host:puerto/database
```

### Administración
```bash
# Lista de emails de administradores (separados por comas)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Variables Opcionales

### Testing
```bash
# URL de base de datos para testing
TEST_DATABASE_URL=postgresql://usuario:password@host:puerto/test_database

# URL base para tests de Playwright
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Indica si se ejecuta en entorno CI/CD
CI=true

# Zona horaria para tests
TZ=America/Argentina/Buenos_Aires
```

### Notificaciones
```bash
# URL del webhook de Slack para notificaciones
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Habilitar notificaciones por email
EMAIL_NOTIFICATIONS=true

# Habilitar notificaciones de GitHub
GITHUB_NOTIFICATIONS=true

# DSN de Sentry para monitoreo de errores
SENTRY_DSN=https://...@sentry.io/...
```

### Analytics
```bash
# ID de Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Desarrollo
```bash
# Habilitar análisis de bundle
ANALYZE=true
```

### Variables Legacy (Deprecadas)
```bash
# Estas variables ya no se usan pero pueden estar presentes
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Configuración por Entorno

### Desarrollo Local (.env.local)
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=desarrollo_secret_key_muy_larga
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
DATABASE_URL=postgresql://usuario:password@localhost:5432/turnero_padel
ADMIN_EMAILS=admin@example.com
```

### Producción
```bash
NODE_ENV=production
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=produccion_secret_key_muy_segura_y_larga
GOOGLE_CLIENT_ID=tu_google_client_id_produccion
GOOGLE_CLIENT_SECRET=tu_google_client_secret_produccion
DATABASE_URL=postgresql://usuario:password@host:puerto/turnero_padel_prod
ADMIN_EMAILS=admin@tudominio.com,admin2@tudominio.com
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Testing
```bash
NODE_ENV=test
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test_secret_key_para_testing
DATABASE_URL=postgresql://usuario:password@localhost:5432/turnero_padel_test
TEST_DATABASE_URL=postgresql://usuario:password@localhost:5432/turnero_padel_test
ADMIN_EMAILS=test@example.com
PLAYWRIGHT_BASE_URL=http://localhost:3000
TZ=America/Argentina/Buenos_Aires
```

## Validación de Variables

La aplicación utiliza Zod para validar todas las variables de entorno al inicio. Si alguna variable requerida falta o tiene un formato incorrecto, la aplicación no se iniciará y mostrará un error descriptivo.

### Tipos de Validación

- **URLs**: Deben ser URLs válidas con protocolo
- **Emails**: Deben tener formato de email válido
- **Listas de emails**: Separadas por comas, cada email debe ser válido
- **Strings mínimos**: Algunas variables requieren longitud mínima
- **Enums**: NODE_ENV debe ser uno de los valores permitidos

## Configuración Centralizada

La aplicación utiliza funciones centralizadas para acceder a la configuración:

```typescript
import { 
  getAuthConfig, 
  getDatabaseConfig, 
  getAdminConfig,
  getNotificationConfig,
  getAnalyticsConfig 
} from './lib/config/env'

// Uso de configuraciones
const authConfig = getAuthConfig()
const dbConfig = getDatabaseConfig()
const adminConfig = getAdminConfig()
```

## Seguridad

### Buenas Prácticas

1. **Nunca commitear archivos .env** al repositorio
2. **Usar secretos seguros** de al menos 32 caracteres
3. **Rotar secretos regularmente** en producción
4. **Usar variables específicas por entorno**
5. **Validar todas las variables** antes del uso

### Archivos de Configuración

- `.env.local` - Variables locales (no commitear)
- `.env.example` - Plantilla con variables de ejemplo
- `.env.test` - Variables específicas para testing

## Troubleshooting

### Errores Comunes

1. **"Variable X is required"**: Falta definir una variable requerida
2. **"Invalid URL format"**: La URL no tiene el formato correcto
3. **"Invalid email format"**: El email no es válido
4. **"Secret must be at least 32 characters"**: El secret es muy corto

### Verificación

Para verificar que todas las variables están correctamente configuradas:

```bash
npm run dev
```

Si hay errores de configuración, se mostrarán al inicio de la aplicación.

## Migración desde Configuración Anterior

Si vienes de una versión anterior que usaba `process.env` directamente:

1. Las variables siguen siendo las mismas
2. Ahora se acceden a través de funciones centralizadas
3. Se validan automáticamente al inicio
4. Mejor tipado y autocompletado en el IDE

## Soporte

Para problemas con la configuración de variables de entorno:

1. Verificar que todas las variables requeridas están definidas
2. Comprobar el formato de URLs y emails
3. Revisar los logs de inicio de la aplicación
4. Consultar este documento para referencia

---

*Última actualización: Enero 2025*