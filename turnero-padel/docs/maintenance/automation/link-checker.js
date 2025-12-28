#!/usr/bin/env node

/**
 * Verificador de Enlaces
 * 
 * Este script verifica todos los enlaces en la documentación,
 * tanto internos como externos, reportando enlaces rotos o inaccesibles.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuración
const CONFIG = {
  docsDir: path.join(__dirname, '../../../docs'),
  timeout: 10000, // 10 segundos
  retries: 2,
  excludePatterns: [
    /^mailto:/,
    /^tel:/,
    /^#/, // Anclas locales
    /localhost/,
    /127\.0\.0\.1/,
    /\$\{.*\}/, // Variables de template
    /example\.com/,
    /placeholder/
  ],
  userAgent: 'Mozilla/5.0 (compatible; DocLinkChecker/1.0)'
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

// Cache para evitar verificar el mismo enlace múltiples veces
const linkCache = new Map();

// Extraer enlaces de un archivo Markdown
function extractLinks(content, filePath) {
  const links = [];
  const relativePath = path.relative(CONFIG.docsDir, filePath);
  
  // Regex para enlaces Markdown: [texto](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [fullMatch, text, url] = match;
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    links.push({
      text: text.trim(),
      url: url.trim(),
      line: lineNumber,
      file: relativePath,
      fullMatch
    });
  }
  
  // También buscar URLs directas (http/https)
  const urlRegex = /https?:\/\/[^\s<>"'`]+/g;
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[0];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // Evitar duplicados de enlaces ya capturados por el regex de Markdown
    const alreadyCaptured = links.some(link => link.url === url);
    if (!alreadyCaptured) {
      links.push({
        text: url,
        url: url,
        line: lineNumber,
        file: relativePath,
        fullMatch: url
      });
    }
  }
  
  return links;
}

// Verificar si un enlace interno existe
function checkInternalLink(url, baseFile) {
  try {
    const basePath = path.dirname(path.join(CONFIG.docsDir, baseFile));
    let targetPath;
    
    if (url.startsWith('/')) {
      // Ruta absoluta desde la raíz del proyecto
      targetPath = path.join(path.dirname(CONFIG.docsDir), url.substring(1));
    } else if (url.startsWith('./') || url.startsWith('../')) {
      // Ruta relativa
      targetPath = path.resolve(basePath, url);
    } else {
      // Ruta relativa sin ./
      targetPath = path.resolve(basePath, url);
    }
    
    // Manejar anclas (#section)
    const [filePath, anchor] = targetPath.split('#');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return {
        status: 'error',
        message: `Archivo no encontrado: ${filePath}`
      };
    }
    
    // Si hay ancla, verificar que existe en el archivo
    if (anchor) {
      const content = fs.readFileSync(filePath, 'utf8');
      const anchorRegex = new RegExp(`#+\\s+.*${anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const idRegex = new RegExp(`id=["']${anchor}["']`, 'i');
      
      if (!anchorRegex.test(content) && !idRegex.test(content)) {
        return {
          status: 'warning',
          message: `Ancla '${anchor}' no encontrada en ${path.relative(CONFIG.docsDir, filePath)}`
        };
      }
    }
    
    return { status: 'success' };
    
  } catch (error) {
    return {
      status: 'error',
      message: `Error verificando enlace interno: ${error.message}`
    };
  }
}

// Verificar enlace externo con reintentos
function checkExternalLink(url, retries = CONFIG.retries) {
  return new Promise((resolve) => {
    // Verificar cache
    if (linkCache.has(url)) {
      resolve(linkCache.get(url));
      return;
    }
    
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD', // Usar HEAD para ser más eficiente
      timeout: CONFIG.timeout,
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': '*/*'
      }
    };
    
    const req = client.request(options, (res) => {
      const result = {
        status: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'error',
        statusCode: res.statusCode,
        message: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined
      };
      
      linkCache.set(url, result);
      resolve(result);
    });
    
    req.on('error', (error) => {
      if (retries > 0) {
        // Reintentar después de un breve delay
        setTimeout(() => {
          checkExternalLink(url, retries - 1).then(resolve);
        }, 1000);
      } else {
        const result = {
          status: 'error',
          message: error.message
        };
        linkCache.set(url, result);
        resolve(result);
      }
    });
    
    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        setTimeout(() => {
          checkExternalLink(url, retries - 1).then(resolve);
        }, 1000);
      } else {
        const result = {
          status: 'error',
          message: 'Timeout'
        };
        linkCache.set(url, result);
        resolve(result);
      }
    });
    
    req.end();
  });
}

// Verificar un enlace individual
async function checkLink(link) {
  const { url, file } = link;
  
  // Verificar patrones excluidos
  for (const pattern of CONFIG.excludePatterns) {
    if (pattern.test(url)) {
      return {
        ...link,
        status: 'skipped',
        message: 'Excluido por configuración'
      };
    }
  }
  
  try {
    // Determinar tipo de enlace
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Enlace externo
      const result = await checkExternalLink(url);
      return {
        ...link,
        type: 'external',
        ...result
      };
    } else {
      // Enlace interno
      const result = checkInternalLink(url, file);
      return {
        ...link,
        type: 'internal',
        ...result
      };
    }
  } catch (error) {
    return {
      ...link,
      status: 'error',
      message: error.message
    };
  }
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

// Generar reporte de resultados
function generateReport(results) {
  const total = results.length;
  const successful = results.filter(r => r.status === 'success').length;
  const errors = results.filter(r => r.status === 'error');
  const warnings = results.filter(r => r.status === 'warning');
  const skipped = results.filter(r => r.status === 'skipped').length;
  
  log('\n🔗 REPORTE DE ENLACES', 'cyan');
  log('=' .repeat(40), 'cyan');
  
  log(`\n📊 Resumen:`);
  log(`  Total de enlaces: ${total}`);
  log(`  ✅ Exitosos: ${successful}`, 'green');
  log(`  ❌ Errores: ${errors.length}`, 'red');
  log(`  ⚠️ Advertencias: ${warnings.length}`, 'yellow');
  log(`  ⏭️ Omitidos: ${skipped}`, 'blue');
  
  const successRate = total > 0 ? ((successful / (total - skipped)) * 100).toFixed(1) : 0;
  log(`  📈 Tasa de éxito: ${successRate}%`);
  
  // Mostrar errores
  if (errors.length > 0) {
    log('\n❌ ENLACES ROTOS:', 'red');
    errors.forEach(error => {
      log(`  📄 ${error.file}:${error.line}`);
      log(`     🔗 ${error.url}`);
      log(`     💬 ${error.message}`, 'yellow');
      log('');
    });
  }
  
  // Mostrar advertencias
  if (warnings.length > 0) {
    log('\n⚠️ ADVERTENCIAS:', 'yellow');
    warnings.forEach(warning => {
      log(`  📄 ${warning.file}:${warning.line}`);
      log(`     🔗 ${warning.url}`);
      log(`     💬 ${warning.message}`);
      log('');
    });
  }
  
  // Estadísticas por tipo
  const internal = results.filter(r => r.type === 'internal');
  const external = results.filter(r => r.type === 'external');
  
  log('\n📊 Por Tipo de Enlace:');
  log(`  🏠 Internos: ${internal.length} (${internal.filter(r => r.status === 'success').length} exitosos)`);
  log(`  🌐 Externos: ${external.length} (${external.filter(r => r.status === 'success').length} exitosos)`);
  
  // Top dominios externos
  const externalDomains = external
    .filter(r => r.status === 'success')
    .map(r => {
      try {
        return new URL(r.url).hostname;
      } catch {
        return 'unknown';
      }
    })
    .reduce((acc, domain) => {
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {});
  
  const topDomains = Object.entries(externalDomains)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  if (topDomains.length > 0) {
    log('\n🌐 Top Dominios Externos:');
    topDomains.forEach(([domain, count]) => {
      log(`  ${domain}: ${count} enlaces`);
    });
  }
  
  return {
    total,
    successful,
    errors: errors.length,
    warnings: warnings.length,
    skipped,
    successRate: parseFloat(successRate)
  };
}

// Guardar reporte detallado
function saveDetailedReport(results) {
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      errors: results.filter(r => r.status === 'error').length,
      warnings: results.filter(r => r.status === 'warning').length,
      skipped: results.filter(r => r.status === 'skipped').length
    },
    results: results.map(r => ({
      file: r.file,
      line: r.line,
      text: r.text,
      url: r.url,
      type: r.type,
      status: r.status,
      message: r.message,
      statusCode: r.statusCode
    }))
  };
  
  const reportPath = path.join(__dirname, '../reports', `link-check-${Date.now()}.json`);
  
  // Crear directorio si no existe
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`\n💾 Reporte detallado guardado en: ${reportPath}`, 'blue');
}

// Función principal
async function main() {
  try {
    log('🔍 INICIANDO VERIFICACIÓN DE ENLACES...', 'cyan');
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
    
    log(`📄 Analizando ${markdownFiles.length} archivos...`);
    
    // Extraer todos los enlaces
    const allLinks = [];
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const links = extractLinks(content, file);
      allLinks.push(...links);
    }
    
    log(`🔗 Encontrados ${allLinks.length} enlaces`);
    log('⏳ Verificando enlaces...');
    
    // Verificar enlaces con progreso
    const results = [];
    const batchSize = 10; // Procesar en lotes para evitar sobrecarga
    
    for (let i = 0; i < allLinks.length; i += batchSize) {
      const batch = allLinks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(link => checkLink(link))
      );
      results.push(...batchResults);
      
      // Mostrar progreso
      const progress = Math.min(i + batchSize, allLinks.length);
      const percentage = ((progress / allLinks.length) * 100).toFixed(1);
      process.stdout.write(`\r⏳ Progreso: ${progress}/${allLinks.length} (${percentage}%)`);
    }
    
    console.log(''); // Nueva línea después del progreso
    
    // Generar reporte
    const summary = generateReport(results);
    saveDetailedReport(results);
    
    // Determinar código de salida
    if (summary.errors > 0) {
      log('\n❌ VERIFICACIÓN FALLIDA - Se encontraron enlaces rotos', 'red');
      process.exit(1);
    } else if (summary.warnings > 0) {
      log('\n⚠️ VERIFICACIÓN CON ADVERTENCIAS', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ VERIFICACIÓN EXITOSA - Todos los enlaces funcionan', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log(`❌ Error durante la verificación: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  extractLinks,
  checkLink,
  checkInternalLink,
  checkExternalLink
};