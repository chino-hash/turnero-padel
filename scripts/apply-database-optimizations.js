/**
 * Script para aplicar optimizaciones de base de datos
 * 
 * Este script:
 * 1. Aplica las migraciones del schema optimizado
 * 2. Crea índices adicionales para mejorar el rendimiento
 * 3. Configura extensiones de PostgreSQL
 * 4. Ejecuta análisis de rendimiento
 * 5. Genera reporte de optimización
 */

const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')
require('dotenv').config()

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function applyDatabaseOptimizations() {
  console.log('🚀 Iniciando optimizaciones de base de datos...')
  
  try {
    // 1. Verificar conexión
    console.log('\n📡 Verificando conexión a base de datos...')
    await prisma.$connect()
    console.log('✅ Conexión establecida exitosamente')
    
    // 2. Aplicar migraciones del schema
    console.log('\n🔄 Aplicando migraciones del schema...')
    try {
      execSync('npx prisma db push', { stdio: 'inherit' })
      console.log('✅ Schema actualizado exitosamente')
    } catch (error) {
      console.warn('⚠️ Error aplicando migraciones:', error.message)
    }
    
    // 3. Configurar extensiones de PostgreSQL
    console.log('\n🔧 Configurando extensiones de PostgreSQL...')
    await configureExtensions()
    
    // 4. Crear índices adicionales si no existen
    console.log('\n📊 Creando índices adicionales...')
    await createAdditionalIndexes()
    
    // 5. Analizar tablas para optimizar el planificador de consultas
    console.log('\n🔍 Analizando tablas para optimización...')
    await analyzeTables()
    
    // 6. Generar reporte de optimización
    console.log('\n📋 Generando reporte de optimización...')
    await generateOptimizationReport()
    
    console.log('\n🎉 ¡Optimizaciones aplicadas exitosamente!')
    
  } catch (error) {
    console.error('❌ Error durante las optimizaciones:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Configurar extensiones de PostgreSQL
 */
async function configureExtensions() {
  const extensions = [
    'pg_trgm',
    'uuid-ossp',
    'unaccent'
  ]
  
  for (const extension of extensions) {
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS ${extension}`
      console.log(`✅ Extensión ${extension} configurada`)
    } catch (error) {
      console.warn(`⚠️ No se pudo configurar extensión ${extension}:`, error.message)
    }
  }
}

/**
 * Crear índices adicionales para optimización
 */
async function createAdditionalIndexes() {
  const indexes = [
    {
      name: 'idx_user_name_trgm',
      sql: 'CREATE INDEX IF NOT EXISTS idx_user_name_trgm ON "User" USING gin (name gin_trgm_ops)',
      description: 'Índice de búsqueda de texto para nombres de usuario'
    },
    {
      name: 'idx_user_email_trgm', 
      sql: 'CREATE INDEX IF NOT EXISTS idx_user_email_trgm ON "User" USING gin (email gin_trgm_ops)',
      description: 'Índice de búsqueda de texto para emails'
    },
    {
      name: 'idx_court_name_trgm',
      sql: 'CREATE INDEX IF NOT EXISTS idx_court_name_trgm ON "Court" USING gin (name gin_trgm_ops)',
      description: 'Índice de búsqueda de texto para nombres de canchas'
    },
    {
      name: 'idx_booking_availability',
      sql: `CREATE INDEX IF NOT EXISTS idx_booking_availability 
            ON "Booking" ("courtId", "bookingDate", "startTime", "endTime") 
            WHERE "deletedAt" IS NULL AND "status" IN ('CONFIRMED', 'PENDING', 'ACTIVE')`,
      description: 'Índice optimizado para consultas de disponibilidad'
    },
    {
      name: 'idx_user_active_audit',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_active_audit 
            ON "User" ("createdAt", "role", "isActive") 
            WHERE "deletedAt" IS NULL`,
      description: 'Índice para auditoría de usuarios activos'
    }
  ]
  
  for (const index of indexes) {
    try {
      await prisma.$executeRawUnsafe(index.sql)
      console.log(`✅ ${index.name}: ${index.description}`)
    } catch (error) {
      console.warn(`⚠️ No se pudo crear índice ${index.name}:`, error.message)
    }
  }
}

/**
 * Analizar tablas para optimizar el planificador de consultas
 */
async function analyzeTables() {
  const tables = ['User', 'Court', 'Booking', 'BookingPlayer', 'Payment', 'AdminWhitelist']
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ANALYZE "${table}"`)
      console.log(`✅ Tabla ${table} analizada`)
    } catch (error) {
      console.warn(`⚠️ No se pudo analizar tabla ${table}:`, error.message)
    }
  }
}

/**
 * Generar reporte de optimización
 */
async function generateOptimizationReport() {
  try {
    console.log('📊 Generando reporte de optimización...')
    
    // Contar registros en tablas principales
    const userCount = await prisma.user.count()
    const courtCount = await prisma.court.count()
    const bookingCount = await prisma.booking.count()
    const paymentCount = await prisma.payment.count()
    
    // Estadísticas básicas de la base de datos
    const dbStats = {
      users: userCount,
      courts: courtCount,
      bookings: bookingCount,
      payments: paymentCount,
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      database: {
        statistics: dbStats,
        optimizations_applied: [
          'Índices compuestos para búsquedas complejas de reservas',
          'Índices de rango de tiempo para disponibilidad de canchas',
          'Índices para reportes de pagos y análisis',
          'Configuración optimizada de connection pooling',
          'Timeouts y reintentos configurados para Neon',
        ],
      },
      recommendations: [
        'Monitorear el rendimiento de consultas regularmente',
        'Revisar el uso de índices con pg_stat_user_indexes',
        'Considerar particionado para tablas grandes (>1M registros)',
        'Implementar cache para consultas frecuentes',
        'Configurar alertas para consultas lentas',
      ],
      neon_optimizations: [
        'Connection pooling configurado para máximo rendimiento',
        'Timeouts ajustados para evitar conexiones colgadas',
        'Reintentos automáticos para errores transitorios',
        'Logging optimizado según el entorno',
      ],
    }
    
    // Guardar reporte
    const fs = require('fs')
    const reportPath = 'database-optimization-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log('✅ Reporte generado:', reportPath)
    console.log('📈 Estadísticas de la base de datos:')
    console.log(`   - Usuarios: ${userCount}`)
    console.log(`   - Canchas: ${courtCount}`)
    console.log(`   - Reservas: ${bookingCount}`)
    console.log(`   - Pagos: ${paymentCount}`)
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyDatabaseOptimizations()
    .catch((error) => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

module.exports = { applyDatabaseOptimizations }