/**
 * Configuración específica para producción con Neon PostgreSQL
 * 
 * Este archivo contiene configuraciones optimizadas para el entorno de producción,
 * incluyendo connection pooling, configuraciones de seguridad y monitoreo.
 */

import { PrismaClient } from '@prisma/client'
import { neonConfig } from './neon-config'

// Configuración específica para producción
const PRODUCTION_CONFIG = {
  // Connection pooling optimizado para Neon
  connectionPool: {
    maxConnections: 20, // Límite conservador para Neon
    minConnections: 2,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000, // 10 minutos
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    createTimeoutMillis: 30000,
  },
  
  // Configuración de timeouts
  timeouts: {
    query: 30000, // 30 segundos
    transaction: 60000, // 1 minuto
    connection: 10000, // 10 segundos
  },
  
  // Configuración de reintentos
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
    maxDelay: 10000,
  },
  
  // Configuración de logs
  logging: {
    level: 'warn', // Solo warnings y errores en producción
    slowQueryThreshold: 5000, // 5 segundos
    enableMetrics: true,
  },
  
  // Configuración de cache
  cache: {
    ttl: 300000, // 5 minutos
    maxSize: 1000,
    enableQueryCache: true,
  }
}

/**
 * Cliente Prisma optimizado para producción
 */
export const productionPrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Event listeners para monitoreo
productionPrisma.$on('query', (e) => {
  if (e.duration > PRODUCTION_CONFIG.logging.slowQueryThreshold) {
    console.warn(`🐌 Slow query detected (${e.duration}ms):`, {
      query: e.query.substring(0, 200) + '...',
      params: e.params,
      duration: e.duration,
      timestamp: new Date().toISOString(),
    })
  }
})

productionPrisma.$on('error', (e) => {
  console.error('🚨 Database error:', {
    message: e.message,
    timestamp: new Date().toISOString(),
  })
})

productionPrisma.$on('warn', (e) => {
  console.warn('⚠️ Database warning:', {
    message: e.message,
    timestamp: new Date().toISOString(),
  })
})

/**
 * Configuración de métricas para monitoreo
 */
interface DatabaseMetrics {
  totalQueries: number
  slowQueries: number
  errors: number
  averageQueryTime: number
  connectionPoolStats: {
    active: number
    idle: number
    total: number
  }
  lastHealthCheck: Date
  uptime: number
}

class MetricsCollector {
  private metrics: DatabaseMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    errors: 0,
    averageQueryTime: 0,
    connectionPoolStats: {
      active: 0,
      idle: 0,
      total: 0,
    },
    lastHealthCheck: new Date(),
    uptime: Date.now(),
  }
  
  private queryTimes: number[] = []
  
  recordQuery(duration: number) {
    this.metrics.totalQueries++
    this.queryTimes.push(duration)
    
    if (duration > PRODUCTION_CONFIG.logging.slowQueryThreshold) {
      this.metrics.slowQueries++
    }
    
    // Mantener solo las últimas 1000 consultas para el promedio
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000)
    }
    
    this.metrics.averageQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
  }
  
  recordError() {
    this.metrics.errors++
  }
  
  updateHealthCheck() {
    this.metrics.lastHealthCheck = new Date()
  }
  
  getMetrics(): DatabaseMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
    }
  }
  
  reset() {
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      errors: 0,
      averageQueryTime: 0,
      connectionPoolStats: {
        active: 0,
        idle: 0,
        total: 0,
      },
      lastHealthCheck: new Date(),
      uptime: Date.now(),
    }
    this.queryTimes = []
  }
}

export const metricsCollector = new MetricsCollector()

// Configurar recolección de métricas
productionPrisma.$on('query', (e) => {
  metricsCollector.recordQuery(e.duration)
})

productionPrisma.$on('error', () => {
  metricsCollector.recordError()
})

/**
 * Funciones de monitoreo y salud
 */
export async function performHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    database: boolean
    responseTime: number
    metrics: DatabaseMetrics
    timestamp: string
  }
}> {
  const startTime = Date.now()
  
  try {
    // Verificar conexión básica
    await productionPrisma.$queryRaw`SELECT 1`
    
    // Verificar que las tablas principales existen
    const tableCheck = await productionPrisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Court', 'Booking', 'Payment')
    `
    
    const responseTime = Date.now() - startTime
    metricsCollector.updateHealthCheck()
    
    const isHealthy = Array.isArray(tableCheck) && 
                     tableCheck[0] && 
                     (tableCheck[0] as any).count >= 4 &&
                     responseTime < 5000
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      details: {
        database: isHealthy,
        responseTime,
        metrics: metricsCollector.getMetrics(),
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return {
      status: 'unhealthy',
      details: {
        database: false,
        responseTime,
        metrics: metricsCollector.getMetrics(),
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * Función para obtener estadísticas de rendimiento
 */
export async function getDatabaseStats(): Promise<{
  tables: Array<{
    name: string
    rowCount: number
    size: string
    indexCount: number
  }>
  indexes: Array<{
    name: string
    table: string
    size: string
    scans: number
  }>
  connections: {
    active: number
    idle: number
    total: number
  }
  performance: {
    slowQueries: number
    averageQueryTime: number
    totalQueries: number
  }
}> {
  try {
    // Estadísticas de tablas
    const tableStats = await productionPrisma.$queryRaw`
      SELECT 
        schemaname,
        tablename as name,
        n_live_tup as "rowCount",
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    ` as Array<{ name: string; rowCount: number; size: string }>
    
    // Contar índices por tabla
    const indexCounts = await productionPrisma.$queryRaw`
      SELECT 
        tablename,
        COUNT(*) as index_count
      FROM pg_indexes 
      WHERE schemaname = 'public'
      GROUP BY tablename
    ` as Array<{ tablename: string; index_count: number }>
    
    // Combinar estadísticas de tablas con conteo de índices
    const tables = tableStats.map(table => ({
      ...table,
      indexCount: indexCounts.find(ic => ic.tablename === table.name)?.index_count || 0
    }))
    
    // Estadísticas de índices
    const indexStats = await productionPrisma.$queryRaw`
      SELECT 
        indexname as name,
        tablename as "table",
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
        idx_scan as scans
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
    ` as Array<{ name: string; table: string; size: string; scans: number }>
    
    // Estadísticas de conexiones
    const connectionStats = await productionPrisma.$queryRaw`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as Array<{ total: number; active: number; idle: number }>
    
    const connections = connectionStats[0] || { total: 0, active: 0, idle: 0 }
    const metrics = metricsCollector.getMetrics()
    
    return {
      tables,
      indexes: indexStats,
      connections,
      performance: {
        slowQueries: metrics.slowQueries,
        averageQueryTime: Math.round(metrics.averageQueryTime),
        totalQueries: metrics.totalQueries,
      },
    }
  } catch (error) {
    console.error('Error getting database stats:', error)
    throw error
  }
}

/**
 * Función para limpiar conexiones inactivas
 */
export async function cleanupIdleConnections(): Promise<number> {
  try {
    const result = await productionPrisma.$queryRaw`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'idle'
        AND state_change < NOW() - INTERVAL '30 minutes'
        AND pid <> pg_backend_pid()
    ` as Array<{ pg_terminate_backend: boolean }>
    
    const terminatedCount = result.filter(r => r.pg_terminate_backend).length
    console.log(`🧹 Cleaned up ${terminatedCount} idle connections`)
    
    return terminatedCount
  } catch (error) {
    console.error('Error cleaning up idle connections:', error)
    return 0
  }
}

/**
 * Función para optimizar tablas (VACUUM y ANALYZE)
 */
export async function optimizeTables(): Promise<void> {
  try {
    console.log('🔧 Starting table optimization...')
    
    // Ejecutar ANALYZE en todas las tablas
    await productionPrisma.$executeRaw`ANALYZE`
    
    console.log('✅ Table optimization completed')
  } catch (error) {
    console.error('❌ Error optimizing tables:', error)
    throw error
  }
}

/**
 * Configurar tareas de mantenimiento automático
 */
export function setupMaintenanceTasks() {
  // Health check cada 5 minutos
  setInterval(async () => {
    try {
      const health = await performHealthCheck()
      if (health.status === 'unhealthy') {
        console.warn('🚨 Database health check failed:', health.details)
      }
    } catch (error) {
      console.error('❌ Health check error:', error)
    }
  }, 5 * 60 * 1000)
  
  // Limpiar conexiones inactivas cada 30 minutos
  setInterval(async () => {
    try {
      await cleanupIdleConnections()
    } catch (error) {
      console.error('❌ Connection cleanup error:', error)
    }
  }, 30 * 60 * 1000)
  
  // Optimizar tablas cada 6 horas
  setInterval(async () => {
    try {
      await optimizeTables()
    } catch (error) {
      console.error('❌ Table optimization error:', error)
    }
  }, 6 * 60 * 60 * 1000)
  
  console.log('🔄 Maintenance tasks configured')
}

/**
 * Función para cerrar conexiones de manera segura
 */
export async function gracefulShutdown(): Promise<void> {
  try {
    console.log('🔄 Starting graceful database shutdown...')
    
    // Esperar a que terminen las consultas activas
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Cerrar conexiones de Prisma
    await productionPrisma.$disconnect()
    
    console.log('✅ Database connections closed gracefully')
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error)
    throw error
  }
}

// Configurar manejo de señales para cierre graceful
if (typeof process !== 'undefined') {
  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
  process.on('beforeExit', gracefulShutdown)
}

const neonProductionDatabase = {
  client: productionPrisma,
  config: PRODUCTION_CONFIG,
  metrics: metricsCollector,
  healthCheck: performHealthCheck,
  getStats: getDatabaseStats,
  cleanup: cleanupIdleConnections,
  optimize: optimizeTables,
  setupMaintenance: setupMaintenanceTasks,
  shutdown: gracefulShutdown,
}

export default neonProductionDatabase