// Test results processor for Jest
const fs = require('fs')
const path = require('path')

module.exports = (results) => {
  // Crear directorio de reportes si no existe
  const reportDir = path.join(process.cwd(), 'test-reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  // Procesar resultados de tests
  const summary = {
    timestamp: new Date().toISOString(),
    success: results.success,
    numTotalTests: results.numTotalTests,
    numPassedTests: results.numPassedTests,
    numFailedTests: results.numFailedTests,
    numPendingTests: results.numPendingTests,
    numTotalTestSuites: results.numTotalTestSuites,
    numPassedTestSuites: results.numPassedTestSuites,
    numFailedTestSuites: results.numFailedTestSuites,
    numPendingTestSuites: results.numPendingTestSuites,
    testResults: results.testResults.map(testResult => ({
      testFilePath: testResult.testFilePath.replace(process.cwd(), ''),
      numFailingTests: testResult.numFailingTests,
      numPassingTests: testResult.numPassingTests,
      numPendingTests: testResult.numPendingTests,
      perfStats: {
        start: testResult.perfStats.start,
        end: testResult.perfStats.end,
        runtime: testResult.perfStats.runtime
      },
      failureMessage: testResult.failureMessage,
      console: testResult.console ? testResult.console.map(log => ({
        message: log.message,
        origin: log.origin,
        type: log.type
      })) : []
    }))
  }
  
  // Guardar resumen detallado
  const summaryPath = path.join(reportDir, 'test-summary.json')
  try {
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo guardar el resumen de tests:', error.message)
  }
  
  // Generar reporte de tests fallidos si los hay
  if (results.numFailedTests > 0) {
    const failedTests = results.testResults
      .filter(result => result.numFailingTests > 0)
      .map(result => ({
        file: result.testFilePath.replace(process.cwd(), ''),
        failures: result.testResults
          .filter(test => test.status === 'failed')
          .map(test => ({
            title: test.title,
            fullName: test.fullName,
            failureMessages: test.failureMessages,
            duration: test.duration
          }))
      }))
    
    const failedTestsPath = path.join(reportDir, 'failed-tests.json')
    try {
      fs.writeFileSync(failedTestsPath, JSON.stringify(failedTests, null, 2))
      console.log(`❌ ${results.numFailedTests} tests fallaron. Ver detalles en: test-reports/failed-tests.json`)
    } catch (error) {
      console.warn('⚠️  Advertencia: No se pudo guardar el reporte de tests fallidos:', error.message)
    }
  }
  
  // Generar reporte de performance
  const performanceData = results.testResults.map(result => ({
    file: result.testFilePath.replace(process.cwd(), ''),
    runtime: result.perfStats.runtime,
    numTests: result.numPassingTests + result.numFailingTests + result.numPendingTests,
    avgTimePerTest: result.perfStats.runtime / (result.numPassingTests + result.numFailingTests + result.numPendingTests)
  })).sort((a, b) => b.runtime - a.runtime)
  
  const performancePath = path.join(reportDir, 'performance-report.json')
  try {
    fs.writeFileSync(performancePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalRuntime: results.testResults.reduce((sum, result) => sum + result.perfStats.runtime, 0),
      slowestTests: performanceData.slice(0, 10),
      allTests: performanceData
    }, null, 2))
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo guardar el reporte de performance:', error.message)
  }
  
  // Mostrar resumen en consola
  console.log('\n📊 Resumen de Tests:')
  console.log(`  ✅ Pasaron: ${results.numPassedTests}/${results.numTotalTests}`)
  console.log(`  ❌ Fallaron: ${results.numFailedTests}/${results.numTotalTests}`)
  console.log(`  ⏸️  Pendientes: ${results.numPendingTests}/${results.numTotalTests}`)
  console.log(`  📁 Test Suites: ${results.numPassedTestSuites}/${results.numTotalTestSuites} pasaron`)
  
  if (results.numFailedTests === 0) {
    console.log('\n🎉 ¡Todos los tests pasaron exitosamente!')
  }
  
  return results
}