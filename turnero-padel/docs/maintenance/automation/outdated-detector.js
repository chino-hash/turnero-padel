#!/usr/bin/env node

/**
 * Detector de Contenido Obsoleto
 * 
 * Este script analiza la documentación para identificar contenido
 * que puede estar desactualizado basado en cambios en el código,
 * dependencias y fechas de modificación.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONFIG = {
  docsDir: path.join(__dirname, '../../../docs'),
  projectRoot: path.join(__dirname, '../../..'),
  maxAge: {
    critical: 30,    // días para documentación crítica
    important: 90,   // días para documentación importante
    general: 180     // días para documentación general
  },
  criticalFiles: [
    'README.md',
    'quick-start.md',
    'deployment.md',
    'api/README.md'
  ],
  importantFiles: [
    'contributing.md',
    'development.md',
    'architecture/',
    'components/'
  ],
  codePatterns: {
    // Patrones que indican referencias a código
    imports: /import\s+.*?from\s+['"]([^'"]+)['"]/g,
    functions: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    components: /<([A-Z][a-zA-Z0-9]*)/g,
    apis: /\/api\/([a-zA-Z0-9\/-]+)/g,
    files: /`([a-zA-Z0-9\/.\-_]+\.(ts|tsx|js|jsx|json|md))`/g
  }
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Obtener información de Git sobre un archivo
function getGitInfo(filePath) {
  try {
    const relativePath = path.relative(CONFIG.projectRoot, filePath);
    
    // Última modificación
    const lastCommit = execSync(
      `git log -1 --format="%H|%ad|%s" --date=iso -- "${relativePath}"`,
      { cwd: CONFIG.projectRoot, encoding: 'utf8' }
    ).trim();
    
    if (!lastCommit) {
      return null;
    }
    
    const [hash, date, message] = lastCommit.split('|');
    
    // Número de commits en los últimos 30 días
    const recentCommits = execSync(
      `git log --since="30 days ago" --oneline -- "${relativePath}"`,
      { cwd: CONFIG.projectRoot, encoding: 'utf8' }
    ).trim().split('\n').filter(line => line.length > 0).length;
    
    return {
      lastCommitHash: hash,
      lastCommitDate: new Date(date),
      lastCommitMessage: message,
      recentCommits
    };
  } catch (error) {
    return null;
  }
}

// Obtener información del package.json
function getPackageInfo() {
  try {
    const packagePath = path.join(CONFIG.projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
      return null;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      version: packageJson.version
    };
  } catch (error) {
    return null;
  }
}

// Verificar si un archivo referenciado existe
function checkReferencedFile(referencePath, baseFile) {
  try {
    const basePath = path.dirname(baseFile);
    let targetPath;
    
    if (referencePath.startsWith('/')) {
      targetPath = path.join(CONFIG.projectRoot, referencePath.substring(1));
    } else if (referencePath.startsWith('./') || referencePath.startsWith('../')) {
      targetPath = path.resolve(basePath, referencePath);
    } else {
      // Buscar en directorios comunes
      const commonDirs = ['src', 'app', 'components', 'lib', 'hooks', 'pages'];
      for (const dir of commonDirs) {
        const candidate = path.join(CONFIG.projectRoot, dir, referencePath);
        if (fs.existsSync(candidate)) {
          targetPath = candidate;
          break;
        }
      }
      
      if (!targetPath) {
        targetPath = path.resolve(basePath, referencePath);
      }
    }
    
    return fs.existsSync(targetPath) ? targetPath : null;
  } catch (error) {
    return null;
  }
}

// Analizar referencias en el contenido
function analyzeReferences(content, filePath) {
  const references = {
    imports: [],
    functions: [],
    components: [],
    apis: [],
    files: [],
    broken: []
  };
  
  // Extraer diferentes tipos de referencias
  for (const [type, pattern] of Object.entries(CONFIG.codePatterns)) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const reference = match[1] || match[0];
      references[type].push(reference);
      
      // Verificar si archivos referenciados existen
      if (type === 'files') {
        const referencedFile = checkReferencedFile(reference, filePath);
        if (!referencedFile) {
          references.broken.push({
            type: 'file',
            reference,
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }
  }
  
  return references;
}

// Determinar la criticidad de un archivo
function getFileCriticality(filePath) {
  const relativePath = path.relative(CONFIG.docsDir, filePath);
  
  for (const criticalFile of CONFIG.criticalFiles) {
    if (relativePath.includes(criticalFile)) {
      return 'critical';
    }
  }
  
  for (const importantFile of CONFIG.importantFiles) {
    if (relativePath.includes(importantFile)) {
      return 'important';
    }
  }
  
  return 'general';
}

// Analizar un archivo de documentación
function analyzeDocumentationFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(CONFIG.docsDir, filePath);
  const criticality = getFileCriticality(filePath);
  const gitInfo = getGitInfo(filePath);
  
  const analysis = {
    path: relativePath,
    fullPath: filePath,
    criticality,
    fileAge: Math.floor((Date.now() - fs.statSync(filePath).mtime) / (1000 * 60 * 60 * 24)),
    gitInfo,
    references: analyzeReferences(content, filePath),
    issues: [],
    score: 100 // Empezar con puntuación perfecta
  };
  
  // Verificar edad según criticidad
  const maxAge = CONFIG.maxAge[criticality];
  if (analysis.fileAge > maxAge) {
    const severity = analysis.fileAge > maxAge * 2 ? 'critical' : 'warning';
    analysis.issues.push({
      type: 'age',
      severity,
      message: `Archivo ${severity === 'critical' ? 'muy' : ''} antiguo (${analysis.fileAge} días, máximo ${maxAge})`,
      impact: severity === 'critical' ? 30 : 15
    });
  }
  
  // Verificar referencias rotas
  if (analysis.references.broken.length > 0) {
    analysis.issues.push({
      type: 'broken_references',
      severity: 'error',
      message: `${analysis.references.broken.length} referencias rotas`,
      details: analysis.references.broken,
      impact: analysis.references.broken.length * 5
    });
  }
  
  // Verificar si hay commits recientes en archivos relacionados
  if (gitInfo && gitInfo.recentCommits === 0) {
    const relatedFiles = analysis.references.files.filter(ref => 
      checkReferencedFile(ref, filePath)
    );
    
    if (relatedFiles.length > 0) {
      // Verificar si los archivos relacionados han cambiado
      let hasRecentChanges = false;
      for (const relatedFile of relatedFiles) {
        const fullPath = checkReferencedFile(relatedFile, filePath);
        if (fullPath) {
          const relatedGitInfo = getGitInfo(fullPath);
          if (relatedGitInfo && relatedGitInfo.recentCommits > 0) {
            hasRecentChanges = true;
            break;
          }
        }
      }
      
      if (hasRecentChanges) {
        analysis.issues.push({
          type: 'stale_references',
          severity: 'warning',
          message: 'Archivos relacionados han cambiado recientemente',
          impact: 10
        });
      }
    }
  }
  
  // Verificar dependencias mencionadas
  const packageInfo = getPackageInfo();
  if (packageInfo) {
    const mentionedPackages = [];
    const packageRegex = /`([a-z][a-z0-9-]*)`|\b([a-z][a-z0-9-]*)\b/g;
    let match;
    
    while ((match = packageRegex.exec(content)) !== null) {
      const packageName = match[1] || match[2];
      if (packageInfo.dependencies[packageName] || packageInfo.devDependencies[packageName]) {
        mentionedPackages.push(packageName);
      }
    }
    
    // Verificar si las versiones mencionadas están desactualizadas
    const versionRegex = /version\s*["']?([0-9]+\.[0-9]+\.[0-9]+)/gi;
    const mentionedVersions = [];
    while ((match = versionRegex.exec(content)) !== null) {
      mentionedVersions.push(match[1]);
    }
    
    if (mentionedVersions.length > 0) {
      analysis.issues.push({
        type: 'version_references',
        severity: 'info',
        message: `Contiene ${mentionedVersions.length} referencias a versiones específicas`,
        details: mentionedVersions,
        impact: 5
      });
    }
  }
  
  // Calcular puntuación final
  const totalImpact = analysis.issues.reduce((sum, issue) => sum + (issue.impact || 0), 0);
  analysis.score = Math.max(0, analysis.score - totalImpact);
  
  return analysis;
}

// Obtener todos los archivos Markdown
function getAllMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') {
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

// Generar reporte de contenido obsoleto
function generateReport(analyses) {
  const total = analyses.length;
  const critical = analyses.filter(a => a.issues.some(i => i.severity === 'critical')).length;
  const warnings = analyses.filter(a => a.issues.some(i => i.severity === 'warning')).length;
  const errors = analyses.filter(a => a.issues.some(i => i.severity === 'error')).length;
  const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / total;
  
  log('\n🕐 REPORTE DE CONTENIDO OBSOLETO', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  log(`\n📊 Resumen:`);
  log(`  Total de archivos: ${total}`);
  log(`  🔴 Críticos: ${critical}`, 'red');
  log(`  ❌ Errores: ${errors}`, 'red');
  log(`  ⚠️ Advertencias: ${warnings}`, 'yellow');
  log(`  📈 Puntuación promedio: ${avgScore.toFixed(1)}/100`);
  
  // Archivos críticos que necesitan atención inmediata
  const criticalFiles = analyses.filter(a => 
    a.issues.some(i => i.severity === 'critical')
  );
  
  if (criticalFiles.length > 0) {
    log('\n🚨 ARCHIVOS CRÍTICOS (Atención Inmediata):', 'red');
    criticalFiles.forEach(file => {
      log(`  📄 ${file.path} (${file.score}/100)`);
      file.issues
        .filter(i => i.severity === 'critical')
        .forEach(issue => {
          log(`     🔴 ${issue.message}`, 'red');
        });
      log('');
    });
  }
  
  // Archivos con referencias rotas
  const brokenRefs = analyses.filter(a => 
    a.issues.some(i => i.type === 'broken_references')
  );
  
  if (brokenRefs.length > 0) {
    log('\n🔗 REFERENCIAS ROTAS:', 'red');
    brokenRefs.forEach(file => {
      log(`  📄 ${file.path}`);
      const brokenIssue = file.issues.find(i => i.type === 'broken_references');
      if (brokenIssue && brokenIssue.details) {
        brokenIssue.details.forEach(ref => {
          log(`     ❌ ${ref.reference} (línea ${ref.line})`, 'yellow');
        });
      }
      log('');
    });
  }
  
  // Archivos antiguos por criticidad
  log('\n⏰ ARCHIVOS ANTIGUOS POR CRITICIDAD:');
  
  ['critical', 'important', 'general'].forEach(criticality => {
    const oldFiles = analyses.filter(a => 
      a.criticality === criticality && 
      a.fileAge > CONFIG.maxAge[criticality]
    ).sort((a, b) => b.fileAge - a.fileAge);
    
    if (oldFiles.length > 0) {
      const criticalityLabel = {
        critical: '🔴 CRÍTICA',
        important: '🟡 IMPORTANTE', 
        general: '🟢 GENERAL'
      }[criticality];
      
      log(`\n  ${criticalityLabel} (>${CONFIG.maxAge[criticality]} días):`);
      oldFiles.slice(0, 5).forEach(file => {
        log(`    📄 ${file.path} (${file.fileAge} días)`);
      });
      
      if (oldFiles.length > 5) {
        log(`    ... y ${oldFiles.length - 5} más`);
      }
    }
  });
  
  // Recomendaciones de acción
  log('\n📋 RECOMENDACIONES:', 'magenta');
  
  const actionItems = [];
  
  if (critical > 0) {
    actionItems.push(`🚨 Revisar inmediatamente ${critical} archivo(s) crítico(s)`);
  }
  
  if (errors > 0) {
    actionItems.push(`❌ Corregir ${errors} archivo(s) con errores`);
  }
  
  const staleCritical = analyses.filter(a => 
    a.criticality === 'critical' && a.fileAge > CONFIG.maxAge.critical
  ).length;
  
  if (staleCritical > 0) {
    actionItems.push(`⏰ Actualizar ${staleCritical} archivo(s) crítico(s) desactualizado(s)`);
  }
  
  if (actionItems.length === 0) {
    actionItems.push('✅ No se requieren acciones inmediatas');
  }
  
  actionItems.forEach((item, index) => {
    log(`  ${index + 1}. ${item}`);
  });
  
  return {
    total,
    critical,
    warnings,
    errors,
    avgScore
  };
}

// Guardar reporte detallado
function saveDetailedReport(analyses) {
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: analyses.length,
      critical: analyses.filter(a => a.issues.some(i => i.severity === 'critical')).length,
      warnings: analyses.filter(a => a.issues.some(i => i.severity === 'warning')).length,
      errors: analyses.filter(a => a.issues.some(i => i.severity === 'error')).length,
      avgScore: analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length
    },
    files: analyses.map(a => ({
      path: a.path,
      criticality: a.criticality,
      fileAge: a.fileAge,
      score: a.score,
      issues: a.issues,
      references: {
        total: Object.values(a.references).flat().length,
        broken: a.references.broken.length,
        types: Object.keys(a.references).reduce((acc, key) => {
          if (key !== 'broken' && a.references[key].length > 0) {
            acc[key] = a.references[key].length;
          }
          return acc;
        }, {})
      },
      gitInfo: a.gitInfo ? {
        lastCommitDate: a.gitInfo.lastCommitDate,
        recentCommits: a.gitInfo.recentCommits
      } : null
    }))
  };
  
  const reportPath = path.join(__dirname, '../reports', `outdated-check-${Date.now()}.json`);
  
  // Crear directorio si no existe
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`\n💾 Reporte detallado guardado en: ${reportPath}`, 'blue');
}

// Función principal
function main() {
  try {
    log('🕐 INICIANDO DETECCIÓN DE CONTENIDO OBSOLETO...', 'cyan');
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
    
    const analyses = markdownFiles.map(analyzeDocumentationFile);
    const summary = generateReport(analyses);
    saveDetailedReport(analyses);
    
    // Determinar código de salida
    if (summary.critical > 0) {
      log('\n❌ DETECCIÓN FALLIDA - Contenido crítico obsoleto encontrado', 'red');
      process.exit(1);
    } else if (summary.errors > 0) {
      log('\n⚠️ DETECCIÓN CON ERRORES - Se encontraron problemas', 'yellow');
      process.exit(0);
    } else if (summary.warnings > 0) {
      log('\n⚠️ DETECCIÓN CON ADVERTENCIAS', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ DETECCIÓN EXITOSA - Documentación actualizada', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log(`❌ Error durante la detección: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  analyzeDocumentationFile,
  analyzeReferences,
  getFileCriticality
};