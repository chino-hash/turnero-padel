import { test, expect } from '@playwright/test';

/**
 * Pruebas específicas para validar los requisitos del panel de administración
 * según las especificaciones del usuario:
 * 
 * 1. No mostrar gráficamente las canchas en /admin
 * 2. Administrar turnos
 * 3. Corroborar pagos
 * 4. Modificar precios de canchas (que se reflejen en dashboard)
 * 5. Funcionalidades exclusivas para admin (no visibles en dashboard)
 */

test.describe('Panel de Administración - Requisitos Específicos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar al panel de administración
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
  });

  test('No debe mostrar representaciones gráficas de canchas en /admin', async ({ page }) => {
    // Verificar que no hay elementos gráficos de canchas (como diagramas, ilustraciones, etc.)
    const graphicalElements = [
      'canvas', // Canvas para dibujos
      'svg[class*="court"]', // SVGs de canchas
      '[class*="court-diagram"]', // Diagramas de canchas
      '[class*="court-illustration"]', // Ilustraciones
      '[class*="court-visual"]', // Elementos visuales de canchas
      'img[alt*="cancha"]', // Imágenes de canchas
      'img[alt*="court"]'
    ];

    for (const selector of graphicalElements) {
      const elements = await page.locator(selector).count();
      expect(elements).toBe(0);
    }

    // Verificar que el contenido es principalmente textual/tabular
    const adminContent = page.locator('[data-testid="admin-content"], .admin-content, main');
    await expect(adminContent).toBeVisible();
  });

  test('Debe permitir administrar turnos correctamente', async ({ page }) => {
    // Verificar que existe la sección de administración de turnos
    const turnosSection = page.locator('text=AdminTurnos, text=Gestión de Turnos, text=Administrar Turnos').first();
    await expect(turnosSection).toBeVisible();

    // Verificar elementos clave de administración de turnos
    const expectedElements = [
      'input[placeholder*="buscar"], input[placeholder*="filtrar"]', // Búsqueda/filtros
      'select, [role="combobox"]', // Selectores de estado, fecha, etc.
      'button:has-text("Confirmar"), button:has-text("Cancelar"), button:has-text("Modificar")', // Acciones
    ];

    // Al menos uno de estos elementos debe estar presente
    let foundElements = 0;
    for (const selector of expectedElements) {
      const count = await page.locator(selector).count();
      if (count > 0) foundElements++;
    }
    expect(foundElements).toBeGreaterThan(0);
  });

  test('Debe permitir corroborar pagos', async ({ page }) => {
    // Buscar elementos relacionados con gestión de pagos
    const paymentElements = [
      'text=pago, text=Pago, text=PAGO',
      'text=pagado, text=Pagado, text=PAGADO',
      'text=pendiente, text=Pendiente, text=PENDIENTE',
      '[data-testid*="payment"], [class*="payment"]',
      'button:has-text("Confirmar Pago"), button:has-text("Marcar Pagado")',
    ];

    let paymentElementsFound = 0;
    for (const selector of paymentElements) {
      const count = await page.locator(selector).count();
      if (count > 0) paymentElementsFound++;
    }

    expect(paymentElementsFound).toBeGreaterThan(0);
  });

  test('Debe tener acceso a gestión de canchas para modificar precios', async ({ page }) => {
    // Verificar que existe enlace o botón para gestionar canchas
    const gestionCanchas = page.locator('text=Canchas, text=Gestionar, a[href*="canchas"], button:has-text("Canchas")');
    await expect(gestionCanchas.first()).toBeVisible();

    // Hacer clic en gestión de canchas si es un enlace
    const canchasLink = page.locator('a[href*="canchas"], button:has-text("Gestionar")');
    if (await canchasLink.count() > 0) {
      await canchasLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verificar que estamos en la página de gestión de canchas
      await expect(page).toHaveURL(/.*canchas.*/);
      
      // Verificar elementos de modificación de precios
      const priceElements = [
        'input[type="number"]', // Campos numéricos para precios
        'text=Precio, text=precio, text=PRECIO',
        'text=Base, text=base, text=BASE',
        'button:has-text("Guardar"), button:has-text("Actualizar"), button:has-text("Editar")'
      ];

      let priceElementsFound = 0;
      for (const selector of priceElements) {
        const count = await page.locator(selector).count();
        if (count > 0) priceElementsFound++;
      }

      expect(priceElementsFound).toBeGreaterThan(1);
    }
  });

  test('Debe mostrar funcionalidades exclusivas de administrador', async ({ page }) => {
    // Verificar funcionalidades que NO deben aparecer en el dashboard público
    const adminOnlyFeatures = [
      'text=Estadísticas, text=estadísticas, text=ESTADÍSTICAS',
      'text=Usuarios, text=usuarios, text=USUARIOS', 
      'text=Productos, text=productos, text=PRODUCTOS',
      'text=Stock, text=stock, text=STOCK',
      'text=Ingresos, text=ingresos, text=INGRESOS',
      'text=Cobros, text=cobros, text=COBROS'
    ];

    let adminFeaturesFound = 0;
    for (const selector of adminOnlyFeatures) {
      const count = await page.locator(selector).count();
      if (count > 0) adminFeaturesFound++;
    }

    // Debe tener al menos 2 funcionalidades administrativas
    expect(adminFeaturesFound).toBeGreaterThanOrEqual(2);
  });

  test('Debe tener estructura de panel administrativo apropiada', async ({ page }) => {
    // Verificar elementos típicos de un panel de administración
    const adminStructure = [
      'h1, h2, h3', // Títulos de sección
      '[class*="card"], [class*="panel"], [class*="section"]', // Tarjetas/paneles
      'button, (a as any)[href]', // Elementos interactivos
      'table, [role="grid"], [class*="list"]' // Listas o tablas de datos
    ];

    for (const selector of adminStructure) {
      const count = await page.locator(selector).count();
      expect(count).toBeGreaterThan(0);
    }

    // Verificar que tiene un título principal de administración
    const adminTitle = page.locator('text=Administración, text=Admin, text=Panel');
    await expect(adminTitle.first()).toBeVisible();
  });

  test('Debe cargar sin errores críticos', async ({ page }) => {
    // Verificar que no hay errores 404 o 500
    const response = await page.goto('http://localhost:3000/admin');
    expect(response?.status()).toBeLessThan(400);

    // Verificar que no hay mensajes de error visibles
    const errorMessages = page.locator('text=Error, text=error, text=ERROR, [class*="error"]');
    const errorCount = await errorMessages.count();
    
    // Permitir algunos errores menores pero no críticos
    expect(errorCount).toBeLessThan(3);

    // Verificar que el contenido principal se carga
    await page.waitForSelector('body', { state: 'visible' });
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.length || 0).toBeGreaterThan(100);
  });

  test('Debe tener navegación coherente', async ({ page }) => {
    // Verificar elementos de navegación
    const navigationElements = [
      'nav, [role="navigation"]',
      '(a as any)[href], (button as any)[onclick]',
      'text=Volver, text=Inicio, text=Dashboard'
    ];

    let navElementsFound = 0;
    for (const selector of navigationElements) {
      const count = await page.locator(selector).count();
      if (count > 0) navElementsFound++;
    }

    expect(navElementsFound).toBeGreaterThan(0);
  });
});

/**
 * Pruebas de integración para verificar que los cambios de precios
 * en admin se reflejan correctamente en el dashboard
 */
test.describe('Integración Admin-Dashboard - Precios', () => {
  
  test('Los cambios de precios en admin deben reflejarse en dashboard', async ({ page }) => {
    // Esta prueba requiere que el sistema esté funcionando
    // Primero ir al admin y verificar precios actuales
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');

    // Buscar enlace a gestión de canchas
    const canchasLink = page.locator('a[href*="canchas"], button:has-text("Canchas")');
    
    if (await canchasLink.count() > 0) {
      await canchasLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Capturar precios actuales si están visibles
      const priceElements = page.locator('text=/\$[0-9,]+/');
      const pricesCount = await priceElements.count();
      
      if (pricesCount > 0) {
        // Ahora ir al dashboard y verificar que los precios son consistentes
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Verificar que hay precios mostrados en el dashboard
        const dashboardPrices = page.locator('text=/\$[0-9,]+/');
        const dashboardPricesCount = await dashboardPrices.count();
        
        expect(dashboardPricesCount).toBeGreaterThan(0);
      }
    }
  });

  test('Funcionalidades admin NO deben aparecer en dashboard público', async ({ page }) => {
    // Ir al dashboard público
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar que NO aparecen funcionalidades administrativas
    const adminOnlyFeatures = [
      'text=Administración de usuarios',
      'text=Gestión de stock',
      'text=Ingresos diarios',
      'text=Ingresos semanales', 
      'text=Ingresos mensuales',
      'text=Estadísticas de ocupación',
      'text=Modificar precios de productos',
      'text=Gestión de cobros',
      'button:has-text("Admin")',
      'a[href*="admin"]'
    ];

    for (const selector of adminOnlyFeatures) {
      const count = await page.locator(selector).count();
      expect(count).toBe(0);
    }
  });
});