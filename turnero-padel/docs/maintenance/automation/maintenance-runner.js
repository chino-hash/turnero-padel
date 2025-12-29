#!/usr/bin/env node

/**
 * Script Principal de Mantenimiento de Documentación
 * 
 * Este script orquesta todas las tareas de mantenimiento de documentación:
 * - Verificación de calidad
 * - Detección de enlaces rotos
 * - Identificación de contenido obsoleto
 * - Generación de reportes consolidados
 * - Notificaciones automáticas
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { performance } = require('perf_hooks');

// Configuración
const CONFIG = {
  scriptsDir: __dirname,
  reportsDir: path.join(__dirname, '../reports'),
  docsDir: path.join(__dirname, '../../../docs'),
  projectRoot: path.join(__dirname, '../../..'),
  scripts: {
    docChecker: path.join(__dirname, 'doc-checker.js'),
    linkChecker: path.join(__dirname, 'link-checker.js'),
    outdatedDetector: path.join(__dirname, 'outdated-detector.js')
  },
  notifications: {
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.EMAIL_NOTIFICATIONS === 'true',
    github: process.env.GITHUB_NOTIFICATIONS === 'true'
  },
  thresholds: {
    docQuality: 80,      // Puntuación mínima de calidad
    brokenLinks: 5,      // Máximo de enlaces rotos permitidos
    outdatedFiles: 10    // Máximo de archivos obsoletos
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
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Ejecutar script y capturar resultado
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    log(`Ejecutando: ${path.basename(scriptPath)}`, 'blue');
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: CONFIG.projectRoot
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      const result = {
        script: path.basename(scriptPath),
        exitCode: code,
        duration,
        stdout,
        stderr,
        success: code === 0
      };
      
      if (code === 0) {
        log(`✅ ${result.script} completado en ${duration}ms`, 'green');
      } else {
        log(`❌ ${result.script} falló con código ${code} (${duration}ms)`, 'red');
      }
      
      resolve(result);
    });
    
    child.on('error', (error) => {
      log(`❌ Error ejecutando ${path.basename(scriptPath)}: ${error.message}`, 'red');
      reject(error);
    });
  });
}

// Parsear reporte JSON
function parseReport(reportPath) {
  try {
    if (!fs.existsSync(reportPath)) {
      return null;
    }
    
    const content = fs.readFileSync(reportPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`⚠️ Error parseando reporte ${reportPath}: ${error.message}`, 'yellow');
    return null;
  }
}

// Obtener el reporte más reciente de un tipo
function getLatestReport(pattern) {
  try {
    const files = fs.readdirSync(CONFIG.reportsDir)
      .filter(file => file.includes(pattern))
      .map(file => ({
        name: file,
        path: path.join(CONFIG.reportsDir, file),
        mtime: fs.statSync(path.join(CONFIG.reportsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    return files.length > 0 ? files[0].path : null;
  } catch (error) {
    return null;
  }
}

// Generar reporte consolidado
function generateConsolidatedReport(results) {
  const timestamp = new Date().toISOString();
  
  // Obtener reportes más recientes
  const docReport = parseReport(getLatestReport('doc-check'));
  const linkReport = parseReport(getLatestReport('link-check'));
  const outdatedReport = parseReport(getLatestReport('outdated-check'));
  
  const consolidatedReport = {
    timestamp,
    execution: {
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      scriptsRun: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    summary: {
      docQuality: docReport ? {
        avgScore: docReport.summary.avgScore,
        totalFiles: docReport.summary.total,
        issues: docReport.summary.issues,
        passed: docReport.summary.avgScore >= CONFIG.thresholds.docQuality
      } : null,
      linkHealth: linkReport ? {
        totalLinks: linkReport.summary.totalLinks,
        brokenLinks: linkReport.summary.brokenLinks,
        warningLinks: linkReport.summary.warningLinks,
        passed: linkReport.summary.brokenLinks <= CONFIG.thresholds.brokenLinks
      } : null,
      contentFreshness: outdatedReport ? {
        totalFiles: outdatedReport.summary.total,
        criticalIssues: outdatedReport.summary.critical,
        warnings: outdatedReport.summary.warnings,
        errors: outdatedReport.summary.errors,
        passed: outdatedReport.summary.critical === 0
      } : null
    },
    details: {
      docReport,
      linkReport,
      outdatedReport
    },
    recommendations: []
  };
  
  // Generar recomendaciones
  const recommendations = [];
  
  if (consolidatedReport.summary.docQuality && !consolidatedReport.summary.docQuality.passed) {
    recommendations.push({
      priority: 'high',
      category: 'quality',
      message: `Calidad de documentación por debajo del umbral (${consolidatedReport.summary.docQuality.avgScore}/${CONFIG.thresholds.docQuality})`,
      action: 'Revisar y mejorar archivos con puntuación baja'
    });
  }
  
  if (consolidatedReport.summary.linkHealth && !consolidatedReport.summary.linkHealth.passed) {
    recommendations.push({
      priority: 'high',
      category: 'links',
      message: `Demasiados enlaces rotos (${consolidatedReport.summary.linkHealth.brokenLinks}/${CONFIG.thresholds.brokenLinks})`,
      action: 'Corregir enlaces rotos identificados'
    });
  }
  
  if (consolidatedReport.summary.contentFreshness && !consolidatedReport.summary.contentFreshness.passed) {
    recommendations.push({
      priority: 'medium',
      category: 'freshness',
      message: `Contenido crítico obsoleto detectado (${consolidatedReport.summary.contentFreshness.criticalIssues} archivos)`,
      action: 'Actualizar documentación crítica desactualizada'
    });
  }
  
  consolidatedReport.recommendations = recommendations;
  
  // Determinar estado general
  const allPassed = [
    consolidatedReport.summary.docQuality?.passed,
    consolidatedReport.summary.linkHealth?.passed,
    consolidatedReport.summary.contentFreshness?.passed
  ].filter(p => p !== null).every(p => p === true);
  
  consolidatedReport.overallStatus = allPassed ? 'passed' : 'failed';
  
  return consolidatedReport;
}

// Enviar notificación a Slack
async function sendSlackNotification(report) {
  if (!CONFIG.notifications.slack) {
    return;
  }
  
  try {
    const { default: fetch } = await import('node-fetch');
    
    const color = report.overallStatus === 'passed' ? 'good' : 'danger';
    const emoji = report.overallStatus === 'passed' ? '✅' : '❌';
    
    const fields = [];
    
    if (report.summary.docQuality) {
      fields.push({
        title: 'Calidad de Documentación',
        value: `${report.summary.docQuality.avgScore.toFixed(1)}/100 (${report.summary.docQuality.totalFiles} archivos)`,
        short: true
      });
    }
    
    if (report.summary.linkHealth) {
      fields.push({
        title: 'Enlaces',
        value: `${report.summary.linkHealth.brokenLinks} rotos de ${report.summary.linkHealth.totalLinks} total`,
        short: true
      });
    }
    
    if (report.summary.contentFreshness) {
      fields.push({
        title: 'Contenido Obsoleto',
        value: `${report.summary.contentFreshness.criticalIssues} críticos, ${report.summary.contentFreshness.warnings} advertencias`,
        short: true
      });
    }
    
    const payload = {
      attachments: [{
        color,
        title: `${emoji} Reporte de Mantenimiento de Documentación`,
        text: `Estado general: ${report.overallStatus === 'passed' ? 'Aprobado' : 'Requiere atención'}`,
        fields,
        footer: 'Sistema de Mantenimiento de Docs',
        ts: Math.floor(Date.now() / 1000)
      }]
    };
    
    if (report.recommendations.length > 0) {
      payload.attachments[0].text += `\n\n*Recomendaciones:*\n${report.recommendations.map(r => `• ${r.message}`).join('\n')}`;
    }
    
    const response = await fetch(CONFIG.notifications.slack, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      log('📱 Notificación enviada a Slack', 'green');
    } else {
      log('⚠️ Error enviando notificación a Slack', 'yellow');
    }
  } catch (error) {
    log(`⚠️ Error enviando notificación a Slack: ${error.message}`, 'yellow');
  }
}

// Crear issue en GitHub si hay problemas críticos
async function createGitHubIssue(report) {
  if (!CONFIG.notifications.github || report.overallStatus === 'passed') {
    return;
  }
  
  try {
    const criticalRecommendations = report.recommendations.filter(r => r.priority === 'high');
    
    if (criticalRecommendations.length === 0) {
      return;
    }
    
    // Aquí iría la lógica para crear un issue en GitHub
    // usando la API de GitHub o el CLI de GitHub
    log('📝 Issue crítico creado en GitHub (simulado)', 'blue');
  } catch (error) {
    log(`⚠️ Error creando issue en GitHub: ${error.message}`, 'yellow');
  }
}

// Limpiar reportes antiguos
function cleanupOldReports() {
  try {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
    const now = Date.now();
    
    const files = fs.readdirSync(CONFIG.reportsDir);
    let cleaned = 0;
    
    for (const file of files) {
      const filePath = path.join(CONFIG.reportsDir, file);
      const stat = fs.statSync(filePath);
      
      if (now - stat.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      log(`🧹 Limpiados ${cleaned} reportes antiguos`, 'blue');
    }
  } catch (error) {
    log(`⚠️ Error limpiando reportes antiguos: ${error.message}`, 'yellow');
  }
}

// Función principal
async function main() {
  const startTime = performance.now();
  
  log('🚀 INICIANDO MANTENIMIENTO DE DOCUMENTACIÓN', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  // Crear directorio de reportes si no existe
  if (!fs.existsSync(CONFIG.reportsDir)) {
    fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
  }
  
  // Limpiar reportes antiguos
  cleanupOldReports();
  
  const results = [];
  
  try {
    // Ejecutar scripts de mantenimiento
    log('\n📋 Ejecutando scripts de mantenimiento...', 'blue');
    
    // 1. Verificar calidad de documentación
    const docResult = await runScript(CONFIG.scripts.docChecker);
    results.push(docResult);
    
    // 2. Verificar enlaces
    const linkResult = await runScript(CONFIG.scripts.linkChecker);
    results.push(linkResult);
    
    // 3. Detectar contenido obsoleto
    const outdatedResult = await runScript(CONFIG.scripts.outdatedDetector);
    results.push(outdatedResult);
    
    // Generar reporte consolidado
    log('\n📊 Generando reporte consolidado...', 'blue');
    const consolidatedReport = generateConsolidatedReport(results);
    
    // Guardar reporte consolidado
    const reportPath = path.join(CONFIG.reportsDir, `maintenance-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(consolidatedReport, null, 2));
    
    // Mostrar resumen
    log('\n📈 RESUMEN EJECUTIVO', 'magenta');
    log('=' .repeat(40), 'magenta');
    
    const endTime = performance.now();
    const totalDuration = Math.round(endTime - startTime);
    
    log(`⏱️ Duración total: ${totalDuration}ms`);
    log(`📊 Scripts ejecutados: ${results.length}`);
    log(`✅ Exitosos: ${results.filter(r => r.success).length}`);
    log(`❌ Fallidos: ${results.filter(r => !r.success).length}`);
    
    if (consolidatedReport.summary.docQuality) {
      const quality = consolidatedReport.summary.docQuality;
      const status = quality.passed ? '✅' : '❌';
      log(`${status} Calidad: ${quality.avgScore.toFixed(1)}/100 (${quality.totalFiles} archivos)`);
    }
    
    if (consolidatedReport.summary.linkHealth) {
      const links = consolidatedReport.summary.linkHealth;
      const status = links.passed ? '✅' : '❌';
      log(`${status} Enlaces: ${links.brokenLinks} rotos de ${links.totalLinks}`);
    }
    
    if (consolidatedReport.summary.contentFreshness) {
      const freshness = consolidatedReport.summary.contentFreshness;
      const status = freshness.passed ? '✅' : '❌';
      log(`${status} Frescura: ${freshness.criticalIssues} críticos, ${freshness.warnings} advertencias`);
    }
    
    // Mostrar recomendaciones
    if (consolidatedReport.recommendations.length > 0) {
      log('\n📋 RECOMENDACIONES:', 'yellow');
      consolidatedReport.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        log(`  ${index + 1}. ${priority} ${rec.message}`);
        log(`     💡 ${rec.action}`);
      });
    }
    
    // Enviar notificaciones
    log('\n📱 Enviando notificaciones...', 'blue');
    await sendSlackNotification(consolidatedReport);
    await createGitHubIssue(consolidatedReport);
    
    log(`\n💾 Reporte guardado en: ${reportPath}`, 'blue');
    
    // Determinar código de salida
    const overallSuccess = consolidatedReport.overallStatus === 'passed';
    
    if (overallSuccess) {
      log('\n🎉 MANTENIMIENTO COMPLETADO EXITOSAMENTE', 'green');
      process.exit(0);
    } else {
      log('\n⚠️ MANTENIMIENTO COMPLETADO CON PROBLEMAS', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Error durante el mantenimiento: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  log('\n⏹️ Mantenimiento interrumpido por el usuario', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n⏹️ Mantenimiento terminado por el sistema', 'yellow');
  process.exit(143);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    log(`❌ Error fatal: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = {
  runScript,
  generateConsolidatedReport,
  sendSlackNotification
};