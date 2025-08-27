#!/usr/bin/env node
/**
 * Script de validación de protección del frontend
 * Verifica que los archivos protegidos mantengan sus headers y estructura
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const PROTECTED_FILES = [
  'components/TurneroApp.tsx',
  'components/MisTurnos.tsx',
  'app/(protected)/dashboard/page.tsx',
  'app/(protected)/layout.tsx',
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/input.tsx',
  'hooks/useAuth.ts',
  'lib/auth.ts',
  'middleware.ts'
];

const REQUIRED_HEADER = '⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN';
const ADMIN_HEADER = '✅ ÁREA DE ADMINISTRACIÓN - MODIFICACIONES PERMITIDAS';

// Colores para consola
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function hasProtectionHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const firstLines = content.split('\n').slice(0, 15).join('\n');
    return firstLines.includes(REQUIRED_HEADER);
  } catch (error) {
    log(`Error leyendo archivo ${filePath}: ${error.message}`, 'red');
    return false;
  }
}

function getFileLastModified(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    return null;
  }
}

function getGitLastCommit(filePath) {
  try {
    const result = execSync(`git log -1 --format="%H|%an|%ad" --date=short -- "${filePath}"`, 
      { encoding: 'utf8', stdio: 'pipe' });
    const [hash, author, date] = result.trim().split('|');
    return { hash: hash.substring(0, 8), author, date };
  } catch (error) {
    return null;
  }
}

function checkProtectedFiles() {
  log('🔍 Verificando archivos protegidos...\n', 'blue');
  
  let allValid = true;
  const results = [];
  
  for (const file of PROTECTED_FILES) {
    const filePath = path.resolve(file);
    const exists = checkFileExists(filePath);
    
    if (!exists) {
      log(`⚠️  Archivo no encontrado: ${file}`, 'yellow');
      results.push({ file, status: 'missing', valid: false });
      continue;
    }
    
    const hasHeader = hasProtectionHeader(filePath);
    const lastModified = getFileLastModified(filePath);
    const gitInfo = getGitLastCommit(filePath);
    
    const isValid = hasHeader;
    allValid = allValid && isValid;
    
    results.push({
      file,
      status: isValid ? 'protected' : 'unprotected',
      valid: isValid,
      lastModified,
      gitInfo
    });
    
    if (isValid) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} - Falta header de protección`, 'red');
    }
    
    if (gitInfo) {
      log(`   📝 Último commit: ${gitInfo.hash} por ${gitInfo.author} (${gitInfo.date})`, 'blue');
    }
  }
  
  return { allValid, results };
}

function generateReport(results) {
  log('\n📊 Generando reporte de protección...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      protected: results.filter(r => r.valid).length,
      unprotected: results.filter(r => !r.valid && r.status !== 'missing').length,
      missing: results.filter(r => r.status === 'missing').length
    },
    files: results
  };
  
  // Guardar reporte en archivo
  const reportPath = 'protection-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`📄 Reporte guardado en: ${reportPath}`, 'green');
  
  return report;
}

function displaySummary(report) {
  log('\n📋 Resumen de Protección:', 'bold');
  log(`   Total de archivos: ${report.summary.total}`);
  log(`   ✅ Protegidos: ${report.summary.protected}`, 'green');
  log(`   ❌ Sin protección: ${report.summary.unprotected}`, 'red');
  log(`   ⚠️  No encontrados: ${report.summary.missing}`, 'yellow');
  
  const percentage = Math.round((report.summary.protected / report.summary.total) * 100);
  log(`\n🎯 Nivel de protección: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');
}

function checkRecentChanges() {
  log('\n🕒 Verificando cambios recientes...', 'blue');
  
  try {
    const result = execSync('git log --oneline --since="7 days ago" --name-only', 
      { encoding: 'utf8', stdio: 'pipe' });
    
    const recentChanges = result.split('\n')
      .filter(line => PROTECTED_FILES.some(file => line.includes(file)))
      .filter(line => line.trim() !== '');
    
    if (recentChanges.length > 0) {
      log('⚠️  Cambios recientes en archivos protegidos:', 'yellow');
      recentChanges.forEach(change => {
        log(`   - ${change}`, 'yellow');
      });
    } else {
      log('✅ No hay cambios recientes en archivos protegidos', 'green');
    }
  } catch (error) {
    log('❌ Error verificando cambios recientes', 'red');
  }
}

function main() {
  log('🛡️  VERIFICADOR DE PROTECCIÓN DEL FRONTEND\n', 'bold');
  
  const { allValid, results } = checkProtectedFiles();
  const report = generateReport(results);
  
  displaySummary(report);
  checkRecentChanges();
  
  if (allValid) {
    log('\n🎉 Todos los archivos protegidos están correctamente configurados!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Algunos archivos requieren atención. Revise el reporte para más detalles.', 'red');
    log('\n💡 Para corregir:', 'yellow');
    log('   1. Agregue el header de protección a los archivos faltantes', 'yellow');
    log('   2. Ejecute: npm run setup:protection', 'yellow');
    log('   3. Vuelva a ejecutar esta verificación', 'yellow');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  checkProtectedFiles,
  hasProtectionHeader,
  PROTECTED_FILES,
  REQUIRED_HEADER
};