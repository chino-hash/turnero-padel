import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Configurando entorno E2E con Playwright...');
  
  // Crear directorios necesarios
  const dirs = [
    'test-reports',
    'test-results',
    'test-results/playwright'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Creado directorio: ${dir}`);
    }
  });
  
  // Configurar variables de entorno para E2E
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-e2e-testing';
  process.env.NEXTAUTH_URL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  // Verificar que el servidor esté disponible
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  console.log(`🌐 Verificando servidor en: ${baseURL}`);
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Intentar acceder a la página principal
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Servidor disponible y respondiendo');
    
    // Verificar que los elementos básicos estén presentes
    const title = await page.title();
    console.log(`📄 Título de la página: ${title}`);
    
    await browser.close();
  } catch (error) {
    console.error('❌ Error al verificar el servidor:', error instanceof Error ? error.message : String(error));
    throw new Error(`No se pudo conectar al servidor en ${baseURL}. Asegúrate de que esté ejecutándose.`);
  }
  
  // Crear archivo de estado para tracking
  const stateFile = path.join(process.cwd(), 'test-results', 'e2e-state.json');
  const state = {
    startTime: new Date().toISOString(),
    baseURL,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    browsers: config.projects.map(project => project.name)
  };
  
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    console.log('📊 Estado E2E guardado en test-results/e2e-state.json');
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo guardar el estado E2E:', error instanceof Error ? error.message : String(error));
  }
  
  console.log('✅ Configuración E2E completada');
}

export default globalSetup;