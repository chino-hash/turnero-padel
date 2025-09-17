/**
 * Configuración optimizada para Neon PostgreSQL
 * 
 * Este archivo contiene configuraciones específicas para mejorar el rendimiento
 * con Neon, incluyendo connection pooling, timeouts y optimizaciones de queries.
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig, isDevelopment, isProduction } from '../config/env'

const dbConfig = getDatabaseConfig()

// Configuración de Neon
export const neonConfig = {
  connectionString: dbConfig.url,
  ssl: true,
  // Configuraciones adicionales para Neon
  poolConfig: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}

const sql = neon(dbConfig.url)
export const db = drizzle(sql)

// Configuración específica para diferentes entornos
const getEnvironmentConfig = () => {
  const env = isDevelopment ? 'development' : isProduction ? 'production' : 'test'
  
  switch (env) {
    case 'production':
      return {
        ...neonConfig,
        log: ['error'], // Solo errores en producción
        connectionLimit: 15, // Más conexiones en producción
      }
    
    case 'test':
      return {
        ...neonConfig,
        log: [], // Sin logs en tests
        connectionLimit: 5, // Menos conexiones en tests
      }
    
    default: // development
      return {
        ...neonConfig,
        log: ['query', 'info', 'warn', 'error'], // Logs completos en desarrollo
        connectionLimit: 8,
      }
  }
}

// Singleton pattern para PrismaClient optimizado para Neon
class NeonPrismaClient {
  private static instance: PrismaClient | null = null
  
  static getInstance(): PrismaClient {
    if (!NeonPrismaClient.instance) {
      const config = getEnvironmentConfig()
      
      NeonPrismaClient.instance = new PrismaClient({
        log: config.log as any,
        datasources: config.datasources,
      })
      
      // Event listeners deshabilitados temporalmente por problemas de tipos
      // TODO: Reconfigurar event listeners cuando se resuelvan los tipos de Prisma
      
      // Manejar desconexiones gracefully
      process.on('beforeExit', async () => {
        await NeonPrismaClient.instance?.$disconnect()
      })
    }
    
    return NeonPrismaClient.instance
  }
  
  // Método para verificar la salud de la conexión
  static async healthCheck(): Promise<boolean> {
    try {
      const client = NeonPrismaClient.getInstance()
      await client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
  
  // Método para obtener estadísticas de conexión
  static async getConnectionStats() {
    try {
      const client = NeonPrismaClient.getInstance()
      const result = await client.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `
      return result
    } catch (error) {
      console.error('Failed to get connection stats:', error)
      return null
    }
  }
}

// Exportar instancia singleton
export const prisma = NeonPrismaClient.getInstance()
export { NeonPrismaClient }

// Configuraciones específicas para optimización de queries
export const queryOptimizations = {
  // Configuración para paginación eficiente
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // Configuración para includes optimizados
  includes: {
    booking: {
      court: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          fullName: true,
        }
      },
      players: {
        where: {
          deletedAt: null, // Excluir soft deleted
        }
      },
      payments: {
        where: {
          deletedAt: null, // Excluir soft deleted
        }
      }
    }
  },
  
  // Configuración para soft delete
  softDelete: {
    where: {
      deletedAt: null,
    }
  },
  
  // Configuración para búsquedas de texto completo
  fullTextSearch: {
    // Configuración para búsqueda en nombres de jugadores
    playerSearch: (query: string) => ({
      OR: [
        {
          playerName: {
            contains: query,
            mode: 'insensitive' as const,
          }
        },
        {
          playerEmail: {
            contains: query,
            mode: 'insensitive' as const,
          }
        }
      ]
    }),
    
    // Configuración para búsqueda en notas
    notesSearch: (query: string) => ({
      notes: {
        search: query,
      }
    })
  }
}

// Utilidades para manejo de transacciones optimizadas
export const transactionUtils = {
  // Timeout por defecto para transacciones
  defaultTimeout: 10000, // 10 segundos
  
  // Wrapper para transacciones con retry automático
  async withRetry<T>(
    operation: (tx: any) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.$transaction(operation, {
          timeout: this.defaultTimeout,
        })
      } catch (error) {
        lastError = error as Error
        
        // Solo reintentar en errores de conexión o deadlock
        if (
          error instanceof Error &&
          (error.message.includes('connection') ||
           error.message.includes('deadlock') ||
           error.message.includes('timeout'))
        ) {
          if (attempt < maxRetries) {
            // Esperar antes del siguiente intento (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
            continue
          }
        }
        
        throw error
      }
    }
    
    throw lastError!
  }
}

// Configuración de índices recomendados (para documentación)
export const recommendedIndexes = {
  // Índices ya implementados en schema.prisma
  implemented: [
    'User: email, role, isActive, createdAt, deletedAt',
    'Court: isActive, name, deletedAt',
    'Booking: courtId+bookingDate, userId+bookingDate, status+bookingDate, paymentStatus, bookingDate+startTime, createdAt, deletedAt, courtId+status+bookingDate',
    'BookingPlayer: bookingId, hasPaid, playerEmail, deletedAt',
    'Payment: bookingId, playerId, processedById, paymentMethod, paymentType, status, createdAt, referenceNumber, deletedAt',
    'Account: userId, provider',
    'Session: userId, expires',
    'Producto: categoria, activo',
    'AdminWhitelist: email, isActive'
  ],
  
  // Índices adicionales que se pueden considerar en el futuro
  future: [
    'Booking: totalPrice (para reportes financieros)',
    'Payment: amount (para análisis de montos)',
    'User: lastLogin (para análisis de actividad)',
    'Booking: durationMinutes (para análisis de duración)'
  ]
}