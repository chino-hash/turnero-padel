/**
 * Script de optimización de base de datos para Neon PostgreSQL
 * 
 * Este script:
 * 1. Aplica las migraciones del schema optimizado
 * 2. Crea índices adicionales si es necesario
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

async function main() {
  console.log('🚀 Iniciando optimización de base de datos...')
  
  try {
    // 1. Verificar conexión a la base de datos
    console.log('\n📡 Verificando conexión a la base de datos...')
    await prisma.$connect()
    console.log('✅ Conexión exitosa')
    
    // 2. Aplicar migraciones del schema
    console.log('\n📋 Aplicando migraciones del schema...')
    try {
      execSync('npx prisma db push', { stdio: 'inherit' })
      console.log('✅ Schema actualizado correctamente')
    } catch (error) {
      console.error('❌ Error aplicando migraciones:', error.message)
      throw error
    }
    
    // 3. Verificar y crear extensiones de PostgreSQL
    console.log('\n🔧 Configurando extensiones de PostgreSQL...')
    await setupPostgreSQLExtensions()
    
    // 4. Verificar índices existentes
    console.log('\n📊 Verificando índices existentes...')
    await verifyIndexes()
    
    // 5. Ejecutar análisis de estadísticas
    console.log('\n📈 Actualizando estadísticas de la base de datos...')
    await updateDatabaseStats()
    
    // 6. Ejecutar pruebas de rendimiento
    console.log('\n⚡ Ejecutando pruebas de rendimiento...')
    await performanceTests()
    
    // 7. Generar reporte de optimización
    console.log('\n📄 Generando reporte de optimización...')
    await generateOptimizationReport()
    
    console.log('\n🎉 Optimización completada exitosamente!')
    
  } catch (error) {
    console.error('\n❌ Error durante la optimización:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Configurar extensiones de PostgreSQL
async function setupPostgreSQLExtensions() {
  try {
    // Verificar si pg_trgm está disponible
    const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
    `
    
    if (extensions.length === 0) {
      console.log('📦 Instalando extensión pg_trgm...')
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm;`
        console.log('✅ Extensión pg_trgm instalada')
      } catch (error) {
        console.log('⚠️  No se pudo instalar pg_trgm (puede requerir permisos de superusuario)')
      }
    } else {
      console.log('✅ Extensión pg_trgm ya está instalada')
    }
    
    // Verificar otras extensiones útiles
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
      console.log('✅ Extensión uuid-ossp configurada')
    } catch (error) {
      console.log('⚠️  Extensión uuid-ossp no disponible')
    }
    
  } catch (error) {
    console.log('⚠️  Error configurando extensiones:', error.message)
  }
}

// Verificar índices existentes
async function verifyIndexes() {
  try {
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `
    
    console.log(`✅ Se encontraron ${indexes.length} índices en la base de datos`)
    
    // Mostrar índices por tabla
    const indexesByTable = indexes.reduce((acc, index) => {
      if (!acc[index.tablename]) {
        acc[index.tablename] = []
      }
      acc[index.tablename].push(index.indexname)
      return acc
    }, {})
    
    Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
      console.log(`  📋 ${table}: ${tableIndexes.length} índices`)
    })
    
  } catch (error) {
    console.error('❌ Error verificando índices:', error.message)
  }
}

// Actualizar estadísticas de la base de datos
async function updateDatabaseStats() {
  try {
    // Actualizar estadísticas para el optimizador de consultas
    await prisma.$executeRaw`ANALYZE;`
    console.log('✅ Estadísticas de la base de datos actualizadas')
    
    // Obtener información sobre el tamaño de las tablas
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `
    
    console.log('\n📊 Tamaño de las tablas:')
    tableSizes.forEach(table => {
      console.log(`  📋 ${table.tablename}: ${table.size}`)
    })
    
  } catch (error) {
    console.error('❌ Error actualizando estadísticas:', error.message)
  }
}

// Ejecutar pruebas de rendimiento básicas
async function performanceTests() {
  const tests = [
    {
      name: 'Consulta de reservas por fecha',
      query: async () => {
        const start = Date.now()
        await prisma.booking.findMany({
          where: {
            bookingDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31')
            },
            deletedAt: null
          },
          take: 10
        })
        return Date.now() - start
      }
    },
    {
      name: 'Consulta de usuarios activos',
      query: async () => {
        const start = Date.now()
        await prisma.user.findMany({
          where: {
            isActive: true,
            deletedAt: null
          },
          take: 10
        })
        return Date.now() - start
      }
    },
    {
      name: 'Consulta de disponibilidad de cancha',
      query: async () => {
        const start = Date.now()
        await prisma.booking.findMany({
          where: {
            courtId: 'test-court-id',
            bookingDate: new Date('2024-12-01'),
            deletedAt: null
          }
        })
        return Date.now() - start
      }
    }
  ]
  
  for (const test of tests) {
    try {
      const duration = await test.query()
      const status = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴'
      console.log(`  ${status} ${test.name}: ${duration}ms`)
    } catch (error) {
      console.log(`  ❌ ${test.name}: Error - ${error.message}`)
    }
  }
}

// Generar reporte de optimización
async function generateOptimizationReport() {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      database: {
        version: await getDatabaseVersion(),
        size: await getDatabaseSize(),
        connections: await getConnectionInfo()
      },
      tables: await getTableStats(),
      indexes: await getIndexStats(),
      recommendations: getOptimizationRecommendations()
    }
    
    // Guardar reporte en archivo
    const fs = require('fs')
    const path = require('path')
    
    const reportPath = path.join(__dirname, '..', 'reports', 'database-optimization.json')
    
    // Crear directorio si no existe
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`✅ Reporte guardado en: ${reportPath}`)
    
    // Mostrar resumen en consola
    console.log('\n📊 Resumen de optimización:')
    console.log(`  🗄️  Versión de PostgreSQL: ${report.database.version}`)
    console.log(`  💾 Tamaño de la base de datos: ${report.database.size}`)
    console.log(`  🔗 Conexiones activas: ${report.database.connections.active}`)
    console.log(`  📋 Tablas: ${report.tables.length}`)
    console.log(`  📊 Índices: ${report.indexes.total}`)
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error.message)
  }
}

// Funciones auxiliares para el reporte
async function getDatabaseVersion() {
  try {
    const result = await prisma.$queryRaw`SELECT version();`
    return result[0].version
  } catch {
    return 'Unknown'
  }
}

async function getDatabaseSize() {
  try {
    const result = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `
    return result[0].size
  } catch {
    return 'Unknown'
  }
}

async function getConnectionInfo() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `
    return result[0]
  } catch {
    return { total: 0, active: 0, idle: 0 }
  }
}

async function getTableStats() {
  try {
    return await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    `
  } catch {
    return []
  }
}

async function getIndexStats() {
  try {
    const indexes = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `
    return indexes[0]
  } catch {
    return { total: 0 }
  }
}

function getOptimizationRecommendations() {
  return [
    'Monitorear el uso de índices regularmente con pg_stat_user_indexes',
    'Ejecutar VACUUM y ANALYZE periódicamente para mantener estadísticas actualizadas',
    'Considerar particionamiento de tablas si el volumen de datos crece significativamente',
    'Implementar archivado de datos históricos para mantener el rendimiento',
    'Monitorear conexiones activas y configurar connection pooling apropiadamente',
    'Revisar queries lentas con pg_stat_statements si está disponible'
  ]
}

// Ejecutar script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  main,
  setupPostgreSQLExtensions,
  verifyIndexes,
  updateDatabaseStats,
  performanceTests,
  generateOptimizationReport
}