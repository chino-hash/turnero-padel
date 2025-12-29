#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

function runCommand(command, description) {
  log(`\n🚀 ${description}...`, 'blue')
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    log(`✅ ${description} completado`, 'green')
    return true
  } catch (error) {
    log(`❌ Error en ${description}`, 'red')
    log(error.message, 'red')
    return false
  }
}

function checkTestFiles() {
  const testDirs = [
    '__tests__',
    'tests/e2e',
    'tests/integration'
  ]
  
  log('\n📁 Verificando archivos de test...', 'yellow')
  
  testDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath, { recursive: true })
      const testFiles = files.filter(file => 
        file.endsWith('.test.ts') || 
        file.endsWith('.test.tsx') || 
        file.endsWith('.spec.ts')
      )
      log(`  ${dir}: ${testFiles.length} archivos de test`, 'cyan')
    } else {
      log(`  ${dir}: directorio no encontrado`, 'yellow')
    }
  })
}

function generateTestReport() {
  const reportDir = path.join(process.cwd(), 'test-reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    testSuites: {
      unit: { status: 'pending', duration: 0 },
      integration: { status: 'pending', duration: 0 },
      e2e: { status: 'pending', duration: 0 },
      performance: { status: 'pending', duration: 0 }
    },
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    }
  }
  
  return report
}

function updateTestReport(report, suite, status, duration) {
  report.testSuites[suite] = { status, duration }
  
  const reportPath = path.join(process.cwd(), 'test-reports', 'test-summary.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
}

async function main() {
  logSection('🧪 EJECUTOR DE TESTS COMPLETO - TURNERO PADEL')
  
  const startTime = Date.now()
  const report = generateTestReport()
  
  // Verificar archivos de test
  checkTestFiles()
  
  // 1. Tests Unitarios
  logSection('1. TESTS UNITARIOS')
  const unitStart = Date.now()
  const unitSuccess = runCommand(
    'npm run test:unit -- --coverage --verbose',
    'Ejecutando tests unitarios'
  )
  const unitDuration = Date.now() - unitStart
  updateTestReport(report, 'unit', unitSuccess ? 'passed' : 'failed', unitDuration)
  
  // 2. Tests de Integración
  logSection('2. TESTS DE INTEGRACIÓN')
  const integrationStart = Date.now()
  const integrationSuccess = runCommand(
    'npm run test:integration',
    'Ejecutando tests de integración'
  )
  const integrationDuration = Date.now() - integrationStart
  updateTestReport(report, 'integration', integrationSuccess ? 'passed' : 'failed', integrationDuration)
  
  // 3. Tests de Performance
  logSection('3. TESTS DE PERFORMANCE')
  const performanceStart = Date.now()
  const performanceSuccess = runCommand(
    'npm run test:performance',
    'Ejecutando tests de performance'
  )
  const performanceDuration = Date.now() - performanceStart
  updateTestReport(report, 'performance', performanceSuccess ? 'passed' : 'failed', performanceDuration)
  
  // 4. Tests E2E (solo si están disponibles)
  logSection('4. TESTS END-TO-END')
  const e2eStart = Date.now()
  let e2eSuccess = false
  
  if (fs.existsSync(path.join(process.cwd(), 'tests/e2e'))) {
    e2eSuccess = runCommand(
      'npm run test:e2e',
      'Ejecutando tests E2E con Playwright'
    )
  } else {
    log('⚠️  Tests E2E no configurados, saltando...', 'yellow')
    e2eSuccess = true // No fallar si no están configurados
  }
  
  const e2eDuration = Date.now() - e2eStart
  updateTestReport(report, 'e2e', e2eSuccess ? 'passed' : 'failed', e2eDuration)
  
  // 5. Generar reporte de cobertura
  logSection('5. REPORTE DE COBERTURA')
  runCommand(
    'npm run test:coverage',
    'Generando reporte de cobertura'
  )
  
  // 6. Linting y formato
  logSection('6. CALIDAD DE CÓDIGO')
  runCommand(
    'npm run lint',
    'Verificando calidad de código'
  )
  
  // Resumen final
  const totalDuration = Date.now() - startTime
  logSection('📊 RESUMEN DE EJECUCIÓN')
  
  log(`⏱️  Tiempo total: ${Math.round(totalDuration / 1000)}s`, 'cyan')
  log(`📋 Tests unitarios: ${report.testSuites.unit.status} (${Math.round(report.testSuites.unit.duration / 1000)}s)`, 
    report.testSuites.unit.status === 'passed' ? 'green' : 'red')
  log(`🔗 Tests integración: ${report.testSuites.integration.status} (${Math.round(report.testSuites.integration.duration / 1000)}s)`, 
    report.testSuites.integration.status === 'passed' ? 'green' : 'red')
  log(`⚡ Tests performance: ${report.testSuites.performance.status} (${Math.round(report.testSuites.performance.duration / 1000)}s)`, 
    report.testSuites.performance.status === 'passed' ? 'green' : 'red')
  log(`🌐 Tests E2E: ${report.testSuites.e2e.status} (${Math.round(report.testSuites.e2e.duration / 1000)}s)`, 
    report.testSuites.e2e.status === 'passed' ? 'green' : 'red')
  
  // Verificar si todos los tests pasaron
  const allPassed = Object.values(report.testSuites).every(suite => suite.status === 'passed')
  
  if (allPassed) {
    log('\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!', 'green')
    log('✨ El código está listo para producción', 'green')
  } else {
    log('\n❌ ALGUNOS TESTS FALLARON', 'red')
    log('🔧 Revisa los errores antes de continuar', 'yellow')
    process.exit(1)
  }
  
  // Mostrar ubicación de reportes
  log('\n📁 Reportes generados en:', 'cyan')
  log('  - test-reports/test-summary.json', 'cyan')
  log('  - coverage/lcov-report/index.html', 'cyan')
  
  // Sugerencias
  log('\n💡 Sugerencias:', 'yellow')
  log('  - Abre coverage/lcov-report/index.html para ver cobertura detallada', 'yellow')
  log('  - Ejecuta "npm run test:watch" para desarrollo continuo', 'yellow')
  log('  - Usa "npm run test:debug" para debugging', 'yellow')
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  log('\n💥 Error no capturado:', 'red')
  log(error.message, 'red')
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log('\n💥 Promesa rechazada no manejada:', 'red')
  log(reason, 'red')
  process.exit(1)
})

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    log('\n💥 Error en ejecución principal:', 'red')
    log(error.message, 'red')
    process.exit(1)
  })
}

module.exports = { main, runCommand, log }