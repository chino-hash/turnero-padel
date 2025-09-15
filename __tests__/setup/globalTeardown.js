// Global teardown for Jest tests
const fs = require('fs')
const path = require('path')

module.exports = async () => {
  console.log('🧹 Limpiando entorno de testing...')
  
  // Generar reporte final de tests
  const reportPath = path.join(process.cwd(), 'test-reports', 'final-report.json')
  const finalReport = {
    timestamp: new Date().toISOString(),
    testRun: 'completed',
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    coverage: {
      reportGenerated: fs.existsSync(path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html'))
    }
  }
  
  try {
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2))
    console.log('📊 Reporte final generado en test-reports/final-report.json')
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo generar el reporte final:', error.message)
  }
  
  // Limpiar archivos temporales de test
  const tempFiles = [
    '.jest-cache',
    'test-results'
  ]
  
  tempFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file)
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`🗑️  Eliminado: ${file}`)
      } catch (error) {
        console.warn(`⚠️  Advertencia: No se pudo eliminar ${file}:`, error.message)
      }
    }
  })
  
  // Mostrar resumen de archivos generados
  console.log('\n📁 Archivos de reporte disponibles:')
  
  const reportFiles = [
    { path: 'coverage/lcov-report/index.html', description: 'Reporte de cobertura HTML' },
    { path: 'coverage/lcov.info', description: 'Datos de cobertura LCOV' },
    { path: 'test-reports/test-summary.json', description: 'Resumen de tests' },
    { path: 'test-reports/final-report.json', description: 'Reporte final' }
  ]
  
  reportFiles.forEach(({ path: filePath, description }) => {
    const fullPath = path.join(process.cwd(), filePath)
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${description}: ${filePath}`)
    } else {
      console.log(`  ❌ ${description}: No generado`)
    }
  })
  
  console.log('\n✅ Limpieza de testing completada')
}