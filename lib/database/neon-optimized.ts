/**
 * Configuración optimizada para Neon PostgreSQL
 * 
 * Este archivo contiene configuraciones específicas para maximizar el rendimiento
 * con Neon PostgreSQL, incluyendo connection pooling, índices y optimizaciones.
 */

import { PrismaClient } from '@prisma/client'

// Configuración optimizada para Neon
const NEON_CONFIG = {
  // Connection pooling optimizado
  connectionPool: {
    maxConnections: process.env.NODE_ENV === 'production' ? 20 : 5,
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
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    slowQueryThreshold: 5000, // 5 segundos
    enableMetrics: true,
  },
}

/**
 * Cliente Prisma optimizado para Neon
 */
export const neonPrisma = new PrismaClient({
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

// Métricas de rendimiento
interface PerformanceMetrics {
  totalQueries: number
  slowQueries: number
  errors: number
  averageQueryTime: number
  lastHealthCheck: Date
}

class MetricsCollector {
  private metrics: PerformanceMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    errors: 0,
    averageQueryTime: 0,
    lastHealthCheck: new Date(),
  }
  
  private queryTimes: number[] = []
  
  recordQuery(duration: number) {
    this.metrics.totalQueries++
    this.queryTimes.push(duration)
    
    if (duration > NEON_CONFIG.logging.slowQueryThreshold) {
      this.metrics.slowQueries++
    }
    
    // Mantener solo las últimas 1000 consultas
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000)
    }
    
    this.metrics.averageQueryTime = 
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
  }
  
  recordError() {
    this.metrics.errors++
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
  
  reset() {
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      errors: 0,
      averageQueryTime: 0,
      lastHealthCheck: new Date(),
    }
    this.queryTimes = []
  }
}

const metricsCollector = new MetricsCollector()

// Event listeners para monitoreo
neonPrisma.$on('query', (e) => {
  metricsCollector.recordQuery(e.duration)
  
  if (e.duration > NEON_CONFIG.logging.slowQueryThreshold) {
    console.warn(`🐌 Consulta lenta detectada (${e.duration}ms):`, {
      query: e.query.substring(0, 200) + '...',
      params: e.params,
      duration: e.duration,
      timestamp: new Date().toISOString(),
    })
  }
})

neonPrisma.$on('error', (e) => {
  metricsCollector.recordError()
  console.error('🚨 Error de base de datos:', {
    message: e.message,
    timestamp: new Date().toISOString(),
  })
})

neonPrisma.$on('warn', (e) => {
  console.warn('⚠️ Advertencia de base de datos:', {
    message: e.message,
    timestamp: new Date().toISOString(),
  })
})

/**
 * Función para verificar el estado de la base de datos
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    connectionTime: number
    queryTime: number
    metrics: PerformanceMetrics
  }
}> {
  const startTime = Date.now()
  
  try {
    // Verificar conexión
    const connectionStart = Date.now()
    await neonPrisma.$connect()
    const connectionTime = Date.now() - connectionStart
    
    // Ejecutar consulta de prueba
    const queryStart = Date.now()
    await neonPrisma.$queryRaw`SELECT 1 as test`
    const queryTime = Date.now() - queryStart
    
    const metrics = metricsCollector.getMetrics()
    
    return {
      status: 'healthy',
      details: {
        connectionTime,
        queryTime,
        metrics,
      },
    }
  } catch (error) {
    console.error('❌ Health check falló:', error)
    return {
      status: 'unhealthy',
      details: {
        connectionTime: Date.now() - startTime,
        queryTime: -1,
        metrics: metricsCollector.getMetrics(),
      },
    }
  }
}

/**
 * Función para obtener estadísticas de rendimiento de la base de datos
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
  }>
  performance: PerformanceMetrics
}> {
  try {
    // Estadísticas de tablas
    const tableStats = await neonPrisma.$queryRaw`
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
    const indexCounts = await neonPrisma.$queryRaw`
      SELECT 
        tablename,
        COUNT(*) as index_count
      FROM pg_indexes 
      WHERE schemaname = 'public'
      GROUP BY tablename
    ` as Array<{ tablename: string; index_count: number }>
    
    // Estadísticas de índices
    const indexStats = await neonPrisma.$queryRaw`
      SELECT 
        indexname as name,
        tablename as table,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
    ` as Array<{ name: string; table: string; size: string }>
    
    // Combinar estadísticas
    const tables = tableStats.map(table => ({
      ...table,
      indexCount: indexCounts.find(ic => ic.tablename === table.name)?.index_count || 0
    }))
    
    return {
      tables,
      indexes: indexStats,
      performance: metricsCollector.getMetrics(),
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    throw error
  }
}

/**
 * Función para optimizar consultas comunes
 */
export const optimizedQueries = {
  // Buscar reservas con filtros optimizados
  async findBookingsOptimized(filters: {
    courtId?: string
    userId?: string
    dateFrom?: Date
    dateTo?: Date
    status?: string[]
    limit?: number
    offset?: number
  }) {
    const { courtId, userId, dateFrom, dateTo, status, limit = 50, offset = 0 } = filters
    
    return neonPrisma.booking.findMany({
      where: {
        AND: [
          courtId ? { courtId } : {},
          userId ? { userId } : {},
          dateFrom ? { bookingDate: { gte: dateFrom } } : {},
          dateTo ? { bookingDate: { lte: dateTo } } : {},
          status ? { status: { in: status as any[] } } : {},
          { deletedAt: null },
        ],
      },
      include: {
        court: { select: { name: true, basePrice: true } },
        user: { select: { name: true, email: true } },
        payments: { select: { amount: true, paymentMethod: true, status: true } },
      },
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'asc' }],
      take: limit,
      skip: offset,
    })
  },
  
  // Verificar disponibilidad optimizada
  async checkAvailabilityOptimized(courtId: string, date: Date, startTime: string, endTime: string) {
    const conflicts = await neonPrisma.booking.findFirst({
      where: {
        courtId,
        bookingDate: date,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        deletedAt: null,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
      select: { id: true },
    })
    
    return !conflicts
  },
  
  // Reportes de pagos optimizados
  async getPaymentReports(dateFrom: Date, dateTo: Date) {
    return neonPrisma.payment.groupBy({
      by: ['paymentMethod', 'paymentType'],
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    })
  },
}

/**
 * Configurar tareas de mantenimiento
 */
export function setupMaintenanceTasks() {
  // Health check cada 5 minutos
  setInterval(async () => {
    try {
      const health = await checkDatabaseHealth()
      if (health.status === 'unhealthy') {
        console.warn('🚨 Health check falló:', health.details)
      }
    } catch (error) {
      console.error('❌ Error en health check:', error)
    }
  }, 5 * 60 * 1000)
  
  console.log('🔄 Tareas de mantenimiento configuradas')
}

// Exportar cliente principal
export default neonPrisma