#!/usr/bin/env node

/**
 * Verificador de Documentación
 * 
 * Este script verifica el estado general de la documentación del proyecto,
 * incluyendo completitud, actualidad y calidad básica.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONFIG = {
  docsDir: path.join(__dirname, '../../../docs'),
  maxAge: 90, // días
  requiredSections: [
    'Descripción',
    'Description',
    'Instalación',
    'Installation',
    'Uso',
    'Usage',
    'Ejemplos',
    'Examples'
  ],
  excludeFiles: ['.DS_Store', 'Thumbs.db'],
  excludeDirs: ['node_modules', '.git']
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utilidades
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getFileAge(filePath) {
  const stats = fs.statSync(filePath);
  const now = new Date();
  const modified = new Date(stats.mtime);
  return Math.floor((now - modified) / (1000 * 60 * 60 * 24));
}

function getAllMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      if (CONFIG.excludeFiles.includes(item) || CONFIG.excludeDirs.includes(item)) {
        continue;
      }
      
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(CONFIG.docsDir, filePath);
  
  const analysis = {
    path: relativePath,
    fullPath: filePath,
    age: getFileAge(filePath),
    wordCount: content.split(/\s+/).length,
    lineCount: lines.length,
    issues: [],
    score: 0
  };
  
  // Verificar estructura básica
  const hasTitle = /^# /.test(content);
  const hasDescription = CONFIG.requiredSections.some(section => 
    content.toLowerCase().includes(section.toLowerCase())
  );
  const hasCodeBlocks = /```/.test(content);
  const hasLinks = /\[.*?\]\(.*?\)/.test(content);
  const hasLastUpdated = /\*\*última actualización\*\*|\*\*last updated\*\*/i.test(content);
  
  // Calcular puntuación
  let score = 0;
  
  if (hasTitle) score += 20;
  else analysis.issues.push('❌ Falta título principal (H1)');
  
  if (hasDescription) score += 20;
  else analysis.issues.push('❌ Falta sección de descripción');
  
  if (hasCodeBlocks) score += 15;
  else analysis.issues.push('⚠️ No tiene ejemplos de código');
  
  if (hasLinks) score += 10;
  else analysis.issues.push('⚠️ No tiene enlaces de referencia');
  
  if (hasLastUpdated) score += 10;
  else analysis.issues.push('⚠️ Falta fecha de última actualización');
  
  // Verificar actualidad
  if (analysis.age > CONFIG.maxAge) {
    analysis.issues.push(`⚠️ Documento antiguo (${analysis.age} días)`);
  } else {
    score += 15;
  }
  
  // Verificar longitud mínima
  if (analysis.wordCount < 50) {
    analysis.issues.push('❌ Documento muy corto (< 50 palabras)');
  } else if (analysis.wordCount < 200) {
    analysis.issues.push('⚠️ Documento corto (< 200 palabras)');
    score += 5;
  } else {
    score += 10;
  }
  
  analysis.score = score;
  return analysis;
}

function generateReport(analyses) {
  const totalFiles = analyses.length;
  const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / totalFiles;
  const oldFiles = analyses.filter(a => a.age > CONFIG.maxAge).length;
  const lowQualityFiles = analyses.filter(a => a.score < 60).length;
  
  log('\n📊 REPORTE DE DOCUMENTACIÓN', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  log(`\n📁 Archivos analizados: ${totalFiles}`);
  log(`📈 Puntuación promedio: ${avgScore.toFixed(1)}/100`);
  log(`⏰ Archivos antiguos (>${CONFIG.maxAge} días): ${oldFiles}`);
  log(`⚠️ Archivos de baja calidad (<60): ${lowQualityFiles}`);
  
  // Distribución de puntuaciones
  const excellent = analyses.filter(a => a.score >= 90).length;
  const good = analyses.filter(a => a.score >= 70 && a.score < 90).length;
  const fair = analyses.filter(a => a.score >= 50 && a.score < 70).length;
  const poor = analyses.filter(a => a.score < 50).length;
  
  log('\n📊 Distribución de Calidad:', 'blue');
  log(`  🟢 Excelente (90-100): ${excellent}`);
  log(`  🟡 Bueno (70-89): ${good}`);
  log(`  🟠 Regular (50-69): ${fair}`);
  log(`  🔴 Pobre (<50): ${poor}`);
  
  // Top 5 mejores
  log('\n🏆 TOP 5 MEJORES DOCUMENTOS:', 'green');
  const topFiles = analyses
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  topFiles.forEach((file, index) => {
    log(`  ${index + 1}. ${file.path} (${file.score}/100)`);
  });
  
  // Top 5 que necesitan mejora
  log('\n🔧 TOP 5 QUE NECESITAN MEJORA:', 'red');
  const worstFiles = analyses
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
  
  worstFiles.forEach((file, index) => {
    log(`  ${index + 1}. ${file.path} (${file.score}/100)`);
    if (file.issues.length > 0) {
      file.issues.slice(0, 3).forEach(issue => {
        log(`     ${issue}`, 'yellow');
      });
    }
  });
  
  // Archivos antiguos
  if (oldFiles > 0) {
    log('\n⏰ ARCHIVOS ANTIGUOS:', 'yellow');
    analyses
      .filter(a => a.age > CONFIG.maxAge)
      .sort((a, b) => b.age - a.age)
      .slice(0, 10)
      .forEach(file => {
        log(`  📄 ${file.path} (${file.age} días)`);
      });
  }
  
  return {
    totalFiles,
    avgScore,
    oldFiles,
    lowQualityFiles,
    distribution: { excellent, good, fair, poor }
  };
}

function generateActionItems(analyses) {
  log('\n📋 ACCIONES RECOMENDADAS:', 'magenta');
  log('=' .repeat(30), 'magenta');
  
  const actionItems = [];
  
  // Archivos críticos
  const criticalFiles = analyses.filter(a => a.score < 40);
  if (criticalFiles.length > 0) {
    log('\n🚨 CRÍTICO - Requiere atención inmediata:');
    criticalFiles.forEach(file => {
      log(`  📄 ${file.path}`);
      actionItems.push(`Revisar y mejorar: ${file.path}`);
    });
  }
  
  // Archivos antiguos importantes
  const oldImportantFiles = analyses.filter(a => 
    a.age > CONFIG.maxAge && 
    (a.path.includes('README') || a.path.includes('quick-start') || a.path.includes('api'))
  );
  
  if (oldImportantFiles.length > 0) {
    log('\n⏰ URGENTE - Documentación crítica desactualizada:');
    oldImportantFiles.forEach(file => {
      log(`  📄 ${file.path} (${file.age} días)`);
      actionItems.push(`Actualizar documentación crítica: ${file.path}`);
    });
  }
  
  // Archivos sin ejemplos
  const noExamples = analyses.filter(a => 
    !fs.readFileSync(a.fullPath, 'utf8').includes('```') &&
    (a.path.includes('guide') || a.path.includes('tutorial'))
  );
  
  if (noExamples.length > 0) {
    log('\n💻 MEJORA - Agregar ejemplos de código:');
    noExamples.slice(0, 5).forEach(file => {
      log(`  📄 ${file.path}`);
      actionItems.push(`Agregar ejemplos: ${file.path}`);
    });
  }
  
  return actionItems;
}

function saveReport(report, analyses) {
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: report,
    files: analyses.map(a => ({
      path: a.path,
      score: a.score,
      age: a.age,
      wordCount: a.wordCount,
      issues: a.issues
    }))
  };
  
  const reportPath = path.join(__dirname, '../reports', `doc-check-${Date.now()}.json`);
  
  // Crear directorio si no existe
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`\n💾 Reporte guardado en: ${reportPath}`, 'blue');
}

// Función principal
function main() {
  try {
    log('🔍 INICIANDO VERIFICACIÓN DE DOCUMENTACIÓN...', 'cyan');
    log(`📁 Directorio: ${CONFIG.docsDir}\n`);
    
    if (!fs.existsSync(CONFIG.docsDir)) {
      log('❌ Error: Directorio de documentación no encontrado', 'red');
      process.exit(1);
    }
    
    const markdownFiles = getAllMarkdownFiles(CONFIG.docsDir);
    
    if (markdownFiles.length === 0) {
      log('⚠️ No se encontraron archivos Markdown', 'yellow');
      return;
    }
    
    log(`📄 Analizando ${markdownFiles.length} archivos...\n`);
    
    const analyses = markdownFiles.map(analyzeMarkdownFile);
    const report = generateReport(analyses);
    const actionItems = generateActionItems(analyses);
    
    // Guardar reporte
    saveReport(report, analyses);
    
    // Determinar código de salida
    const criticalIssues = analyses.filter(a => a.score < 40).length;
    const oldCriticalFiles = analyses.filter(a => 
      a.age > CONFIG.maxAge && 
      (a.path.includes('README') || a.path.includes('quick-start'))
    ).length;
    
    if (criticalIssues > 0 || oldCriticalFiles > 0) {
      log('\n❌ VERIFICACIÓN FALLIDA - Se encontraron problemas críticos', 'red');
      process.exit(1);
    } else if (report.avgScore < 70) {
      log('\n⚠️ VERIFICACIÓN CON ADVERTENCIAS - Calidad promedio baja', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ VERIFICACIÓN EXITOSA - Documentación en buen estado', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log(`❌ Error durante la verificación: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  analyzeMarkdownFile,
  generateReport,
  getAllMarkdownFiles
};