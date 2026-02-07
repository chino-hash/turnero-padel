/**
 * 🔧 CONFIGURACIÓN CENTRALIZADA DE VARIABLES DE ENTORNO
 * 
 * Este archivo centraliza todas las variables de entorno del proyecto,
 * proporcionando validación, tipos seguros y documentación completa.
 * 
 * @author Sistema de Configuración
 * @version 1.0.0
 */

import { z } from 'zod'

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Esquema para validar URLs
 */
const urlSchema = z.string().url('Debe ser una URL válida')

/**
 * Esquema para validar emails (lista separada por comas)
 */
const emailListSchema = z.string()
  .transform(str => str.split(',').map(email => email.trim().toLowerCase()))
  .refine(emails => emails.every(email => z.string().email().safeParse(email).success), {
    message: 'Todos los emails deben ser válidos'
  })

/**
 * Esquema para validar el entorno de ejecución
 */
const nodeEnvSchema = z.enum(['development', 'production', 'test'])

/**
 * Esquema principal de configuración
 */
const envSchema = z.object({
  // ========================================================================
  // CONFIGURACIÓN DEL ENTORNO
  // ========================================================================
  NODE_ENV: nodeEnvSchema.default('development'),
  
  // ========================================================================
  // AUTENTICACIÓN (NextAuth.js)
  // ========================================================================
  NEXTAUTH_URL: urlSchema.describe('URL base de la aplicación para NextAuth'),
  NEXTAUTH_SECRET: z.string()
    .min(32, 'El secret debe tener al menos 32 caracteres')
    .describe('Clave secreta para firmar tokens JWT'),
  
  // ========================================================================
  // PROVEEDORES OAUTH
  // ========================================================================
  GOOGLE_CLIENT_ID: z.string()
    .min(1, 'Google Client ID es requerido')
    .describe('ID del cliente OAuth de Google'),
  GOOGLE_CLIENT_SECRET: z.string()
    .min(1, 'Google Client Secret es requerido')
    .describe('Secret del cliente OAuth de Google'),
  
  // ========================================================================
  // BASE DE DATOS
  // ========================================================================
  DATABASE_URL: z.string()
    .min(1, 'URL de base de datos es requerida')
    .describe('URL de conexión a la base de datos PostgreSQL'),
  
  // ========================================================================
  // ADMINISTRACIÓN
  // ========================================================================
  SUPER_ADMIN_EMAILS: emailListSchema
    .optional()
    .describe('Lista de emails de super administradores globales separados por comas'),
  ADMIN_EMAILS: emailListSchema
    .optional()
    .describe('Lista de emails de administradores separados por comas (deprecated - usar AdminWhitelist en BD)'),
  
  // ========================================================================
  // VARIABLES OPCIONALES
  // ============================================================================
  
  // Testing
  TEST_DATABASE_URL: z.string().optional()
    .describe('URL de base de datos para testing'),
  PLAYWRIGHT_BASE_URL: urlSchema.optional()
    .describe('URL base para tests de Playwright'),
  CI: z.string().optional()
    .describe('Indica si se ejecuta en entorno CI/CD'),
  TZ: z.string().optional()
    .describe('Zona horaria para tests'),
  
  // Seguridad de Jobs/Cron
  CRON_SECRET: z.string().optional()
    .describe('Token secreto para proteger ejecución de cron jobs en producción'),
  
  // Supabase (Legacy - Migración completada)
  SUPABASE_URL: urlSchema.optional()
    .describe('URL de Supabase (legacy, ya no se usa)'),
  SUPABASE_ANON_KEY: z.string().optional()
    .describe('Clave anónima de Supabase (legacy)'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional()
    .describe('Clave de servicio de Supabase (legacy)'),
  
  // Monitoreo y Notificaciones
  SLACK_WEBHOOK_URL: urlSchema.optional()
    .describe('URL del webhook de Slack para notificaciones'),
  EMAIL_NOTIFICATIONS: z.string().optional()
    .describe('Habilitar notificaciones por email (true/false)'),
  GITHUB_NOTIFICATIONS: z.string().optional()
    .describe('Habilitar notificaciones de GitHub (true/false)'),
  SENTRY_DSN: urlSchema.optional()
    .describe('DSN de Sentry para monitoreo de errores'),
  
  // Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional()
    .describe('ID de Google Analytics'),
  
  // Desarrollo
  ANALYZE: z.string().optional()
    .describe('Habilitar análisis de bundle (true/false)'),
  /** Crea y muestra el tenant de prueba en la API (landing) también en producción/demo */
  SHOW_TEST_TENANT: z.string().optional()
    .describe('Si es "true", el tenant de prueba se crea y se incluye en la lista de clubs'),
  NEXT_PUBLIC_SHOW_TEST_TENANT: z.string().optional()
    .describe('Si es "true", el club de prueba se muestra en la landing aunque no venga del API'),
  
  // Encriptación de Credenciales
  CREDENTIAL_ENCRYPTION_KEY: z.string()
    .regex(/^[0-9a-fA-F]{64}$/, 'Debe ser una clave hexadecimal de 64 caracteres (32 bytes)')
    .optional()
    .describe('Clave de encriptación para credenciales sensibles (32 bytes en hexadecimal)'),
})

// ============================================================================
// VALIDACIÓN Y EXPORTACIÓN
// ============================================================================

/**
 * Valida y parsea las variables de entorno con tolerancia en dev/test.
 * En producción, la validación sigue siendo estricta.
 */
function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProd = nodeEnv === 'production'

  // Intento de parseo directo
  const parsed = envSchema.safeParse(process.env)
  if (parsed.success) {
    return parsed.data
  }

  // Si falla y no estamos en producción, aplicar defaults seguros
  if (!isProd) {
    const defaults = {
      NODE_ENV: nodeEnv as 'development' | 'test' | 'production',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-1234567890-1234567890-1234567890',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/turnero',
      SUPER_ADMIN_EMAILS: process.env.SUPER_ADMIN_EMAILS,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS || 'admin@example.com',
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL,
      CI: process.env.CI,
      TZ: process.env.TZ,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
      EMAIL_NOTIFICATIONS: process.env.EMAIL_NOTIFICATIONS,
      GITHUB_NOTIFICATIONS: process.env.GITHUB_NOTIFICATIONS,
      SENTRY_DSN: process.env.SENTRY_DSN,
      NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
      ANALYZE: process.env.ANALYZE,
      CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY,
      CRON_SECRET: process.env.CRON_SECRET,
    }

    const reParsed = envSchema.safeParse(defaults)
    if (reParsed.success) {
      console.warn('⚠️ Variables de entorno incompletas; usando valores por defecto en modo', nodeEnv)
      return reParsed.data
    }

    // Como último recurso, devolver defaults sin tipado estricto
    console.warn('⚠️ No se pudo validar env; usando defaults no tipados en modo', nodeEnv)
    return defaults as any
  }

  // En producción, informar detalladamente y lanzar
  if (parsed.error instanceof z.ZodError) {
    const errorMessages = parsed.error.issues.map(err => 
      `❌ ${err.path.join('.')}: ${err.message}`
    ).join('\n')
    console.error('🚨 Error en configuración de variables de entorno (producción):\n' + errorMessages)
  }
  throw new Error('Configuración de variables de entorno inválida')
}

/**
 * Configuración validada y tipada
 */
export const env = validateEnv()

/**
 * Tipo de la configuración para uso en TypeScript
 */
export type EnvConfig = z.infer<typeof envSchema>

// ============================================================================
// UTILIDADES DE CONFIGURACIÓN
// ============================================================================

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Verifica si estamos en modo producción
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Verifica si estamos en modo test
 */
export const isTest = env.NODE_ENV === 'test'

/**
 * Verifica si estamos en entorno CI/CD
 */
export const isCI = Boolean(env.CI)

/**
 * Configuración de base de datos según el entorno
 */
export const getDatabaseUrl = () => {
  if (isTest && env.TEST_DATABASE_URL) {
    return env.TEST_DATABASE_URL
  }
  return env.DATABASE_URL
}

/**
 * Configuración de base de datos
 */
export const getDatabaseConfig = () => ({
  url: env.DATABASE_URL
})

/**
 * Configuración de NextAuth según el entorno
 */
export const getAuthConfig = () => ({
  url: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }
})

/**
 * Configuración de administradores
 */
export const getAdminConfig = () => ({
  emails: env.ADMIN_EMAILS || [],
  superAdminEmails: env.SUPER_ADMIN_EMAILS || [],
})

/**
 * @deprecated Usar getAdminConfig().emails en su lugar
 */
export const getAdminEmails = () => env.ADMIN_EMAILS || []

/**
 * Configuración de super administradores
 */
export const getSuperAdminConfig = () => ({
  emails: env.SUPER_ADMIN_EMAILS || [],
})

/**
 * Configuración de notificaciones
 */
export const getNotificationConfig = () => ({
  slack: {
    enabled: Boolean(env.SLACK_WEBHOOK_URL),
    webhookUrl: env.SLACK_WEBHOOK_URL,
  },
  email: {
    enabled: env.EMAIL_NOTIFICATIONS === 'true',
  },
  github: {
    enabled: env.GITHUB_NOTIFICATIONS === 'true',
  },
  sentry: {
    enabled: Boolean(env.SENTRY_DSN),
    dsn: env.SENTRY_DSN,
  }
})

/**
 * Configuración de analytics
 */
export const getAnalyticsConfig = () => ({
  googleAnalytics: {
    enabled: Boolean(env.NEXT_PUBLIC_GA_ID),
    id: env.NEXT_PUBLIC_GA_ID,
  }
})

/**
 * Configuración de encriptación
 */
export const getEncryptionConfig = () => ({
  key: env.CREDENTIAL_ENCRYPTION_KEY,
  isConfigured: Boolean(env.CREDENTIAL_ENCRYPTION_KEY),
})

/**
 * Configuración de jobs/cron
 */
export const getCronConfig = () => ({
  secret: env.CRON_SECRET,
})

// ============================================================================
// LOGGING DE CONFIGURACIÓN (Solo en desarrollo)
// ============================================================================

if (isDevelopment) {
  console.log('🔧 Configuración cargada:', {
    entorno: env.NODE_ENV,
    baseUrl: env.NEXTAUTH_URL,
    database: env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada',
    google: env.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ No configurado',
    admins: env.ADMIN_EMAILS?.length || 0,
    superAdmins: env.SUPER_ADMIN_EMAILS?.length || 0,
  })
}

export default env
