#!/usr/bin/env node

/**
 * Script para ejecutar tests del sistema CRUD
 * Incluye tests unitarios, de integración y de API
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}`, 'cyan');
  log(`Ejecutando: ${command}`, 'yellow');
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`✅ ${description} completado exitosamente`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error en ${description}:`, 'red');
    log(error.message, 'red');
    return false;
  }
}

function checkTestFiles() {
  const testFiles = [
    '__tests__/setup.ts',
    '__tests__/services/crud-service.test.ts',
    '__tests__/api/crud.test.ts',
    '__tests__/integration/crud-integration.test.ts'
  ];
  
  log('\n🔍 Verificando archivos de test...', 'blue');
  
  const missingFiles = testFiles.filter(file => {
    const fullPath = path.join(process.cwd(), file);
    const exists = fs.existsSync(fullPath);
    if (exists) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} - No encontrado`, 'red');
    }
    return !exists;
  });
  
  if (missingFiles.length > 0) {
    log(`\n❌ Faltan ${missingFiles.length} archivos de test`, 'red');
    return false;
  }
  
  log('\n✅ Todos los archivos de test están presentes', 'green');
  return true;
}

function main() {
  log('🚀 Iniciando ejecución de tests del sistema CRUD', 'bright');
  log('=' .repeat(60), 'blue');
  
  // Verificar archivos de test
  if (!checkTestFiles()) {
    log('\n❌ No se pueden ejecutar los tests. Faltan archivos.', 'red');
    process.exit(1);
  }
  
  const testSuites = [
    {
      name: 'Tests Unitarios - CrudService',
      command: 'npx jest __tests__/services/crud-service.test.ts --verbose',
      description: 'Ejecutando tests unitarios del servicio CRUD'
    },
    {
      name: 'Tests API - Endpoints CRUD',
      command: 'npx jest __tests__/api/crud.test.ts --verbose',
      description: 'Ejecutando tests de los endpoints API'
    },
    {
      name: 'Tests de Integración',
      command: 'npx jest __tests__/integration/crud-integration.test.ts --verbose',
      description: 'Ejecutando tests de integración completos'
    }
  ];
  
  let passedTests = 0;
  let totalTests = testSuites.length;
  
  // Ejecutar cada suite de tests
  for (const suite of testSuites) {
    log(`\n${'='.repeat(60)}`, 'blue');
    log(`📋 ${suite.name}`, 'bright');
    log('='.repeat(60), 'blue');
    
    if (runCommand(suite.command, suite.description)) {
      passedTests++;
    }
  }
  
  // Ejecutar todos los tests con cobertura
  log(`\n${'='.repeat(60)}`, 'blue');
  log('📊 Ejecutando todos los tests con reporte de cobertura', 'bright');
  log('='.repeat(60), 'blue');
  
  const coverageCommand = 'npx jest __tests__ --coverage --coverageReporters=text --coverageReporters=html';
  const coverageSuccess = runCommand(coverageCommand, 'Generando reporte de cobertura');
  
  // Resumen final
  log(`\n${'='.repeat(60)}`, 'blue');
  log('📈 RESUMEN DE EJECUCIÓN', 'bright');
  log('='.repeat(60), 'blue');
  
  log(`\n✅ Tests exitosos: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`📊 Cobertura: ${coverageSuccess ? 'Generada' : 'Error'}`, coverageSuccess ? 'green' : 'red');
  
  if (passedTests === totalTests && coverageSuccess) {
    log('\n🎉 ¡Todos los tests pasaron exitosamente!', 'green');
    log('📁 Reporte de cobertura disponible en: coverage/index.html', 'cyan');
    process.exit(0);
  } else {
    log('\n⚠️  Algunos tests fallaron o hubo problemas', 'yellow');
    process.exit(1);
  }
}

// Manejar interrupciones
process.on('SIGINT', () => {
  log('\n\n⏹️  Ejecución interrumpida por el usuario', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n\n⏹️  Ejecución terminada', 'yellow');
  process.exit(1);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { runCommand, checkTestFiles, main };