import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Limpiando entorno E2E...');
  
  // Leer estado inicial si existe
  const stateFile = path.join(process.cwd(), 'test-results', 'e2e-state.json');
  let initialState = null;
  
  try {
    if (fs.existsSync(stateFile)) {
      initialState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo leer el estado inicial:', error instanceof Error ? error.message : String(error));
  }
  
  // Generar reporte final de E2E
  const reportPath = path.join(process.cwd(), 'test-reports', 'e2e-final-report.json');
  const endTime = new Date().toISOString();
  
  const finalReport = {
    startTime: initialState?.startTime || 'unknown',
    endTime,
    duration: initialState?.startTime ? 
      new Date(endTime).getTime() - new Date(initialState.startTime).getTime() : 0,
    testRun: 'completed',
    environment: initialState?.environment || {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    browsers: initialState?.browsers || config.projects.map(project => project.name),
    baseURL: initialState?.baseURL || config.projects[0].use.baseURL,
    artifacts: {
      screenshots: fs.existsSync(path.join(process.cwd(), 'test-results', 'playwright')),
      videos: fs.existsSync(path.join(process.cwd(), 'test-results', 'playwright')),
      traces: fs.existsSync(path.join(process.cwd(), 'test-results', 'playwright')),
      htmlReport: fs.existsSync(path.join(process.cwd(), 'test-reports', 'playwright-report', 'index.html'))
    }
  };
  
  try {
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    console.log('📊 Reporte final E2E generado en test-reports/e2e-final-report.json');
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo generar el reporte final E2E:', error instanceof Error ? error.message : String(error));
  }
  
  // Mostrar resumen de archivos generados
  console.log('\n📁 Archivos de reporte E2E disponibles:');
  
  const reportFiles = [
    { 
      path: 'test-reports/playwright-report/index.html', 
      description: 'Reporte HTML de Playwright' 
    },
    { 
      path: 'test-reports/playwright-results.json', 
      description: 'Resultados JSON de Playwright' 
    },
    { 
      path: 'test-reports/playwright-junit.xml', 
      description: 'Reporte JUnit de Playwright' 
    },
    { 
      path: 'test-reports/e2e-final-report.json', 
      description: 'Reporte final E2E' 
    }
  ];
  
  reportFiles.forEach(({ path: filePath, description }) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${description}: ${filePath}`);
    } else {
      console.log(`  ❌ ${description}: No generado`);
    }
  });
  
  // Mostrar información sobre artifacts
  const artifactsDir = path.join(process.cwd(), 'test-results', 'playwright');
  if (fs.existsSync(artifactsDir)) {
    try {
      const files = fs.readdirSync(artifactsDir, { recursive: true });
      const screenshots = files.filter(f => f.toString().endsWith('.png')).length;
      const videos = files.filter(f => f.toString().endsWith('.webm')).length;
      const traces = files.filter(f => f.toString().endsWith('.zip')).length;
      
      console.log('\n🎬 Artifacts generados:');
      console.log(`  📸 Screenshots: ${screenshots}`);
      console.log(`  🎥 Videos: ${videos}`);
      console.log(`  🔍 Traces: ${traces}`);
    } catch (error) {
      console.warn('⚠️  Advertencia: No se pudieron contar los artifacts:', error instanceof Error ? error.message : String(error));
    }
  }
  
  // Limpiar archivos temporales
  try {
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
      console.log('🗑️  Estado temporal limpiado');
    }
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo limpiar el estado temporal:', error instanceof Error ? error.message : String(error));
  }
  
  console.log('\n✅ Limpieza E2E completada');
  
  // Mostrar comando para ver reportes
  const htmlReportPath = path.join(process.cwd(), 'test-reports', 'playwright-report', 'index.html');
  if (fs.existsSync(htmlReportPath)) {
    console.log('\n🌐 Para ver el reporte HTML, ejecuta:');
    console.log('  npx playwright show-report test-reports/playwright-report');
  }
}

export default globalTeardown;