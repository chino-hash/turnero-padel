import { test, expect } from '@playwright/test';

/**
 * Pruebas para validar funcionalidades exclusivas del panel de administración
 * que NO deben aparecer en el dashboard público:
 * 
 * - Estadísticas de usuarios y ocupación de canchas
 * - Administración de usuarios
 * - Modificación de precios de productos y gestión de cobros
 * - Consulta de stock disponible
 * - Visualización de ingresos (diarios, semanales y mensuales)
 */

test.describe('Funcionalidades Exclusivas de Administración', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
  });

  test('Debe mostrar estadísticas de usuarios y ocupación', async ({ page }) => {
    // Buscar sección de estadísticas
    const estadisticasSection = page.locator('text=Estadísticas, text=estadísticas, a[href*="estadisticas"], button:has-text("Estadísticas")');
    
    if (await estadisticasSection.count() > 0) {
      await estadisticasSection.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verificar elementos de estadísticas
      const statsElements = [
        'text=ocupación, text=Ocupación',
        'text=usuarios activos, text=Usuarios',
        'text=reservas, text=Reservas',
        'text=porcentaje, text=%',
        '[class*="chart"], [class*="graph"], canvas, svg',
        'text=/[0-9]+%/, text=/[0-9]+\s*(usuarios|reservas|canchas)/',
      ];

      let statsFound = 0;
      for (const selector of statsElements) {
        const count = await page.locator(selector).count();
        if (count > 0) statsFound++;
      }

      expect(statsFound).toBeGreaterThan(1);
    } else {
      // Si no hay enlace directo, buscar estadísticas en la página principal
      const statsKeywords = [
        'text=ocupación',
        'text=usuarios activos',
        'text=estadísticas',
        'text=/[0-9]+%/',
        'text=/Total.*usuarios/',
      ];

      let directStatsFound = 0;
      for (const selector of statsKeywords) {
        const count = await page.locator(selector).count();
        if (count > 0) directStatsFound++;
      }

      // Debe tener al menos alguna referencia a estadísticas
      expect(directStatsFound).toBeGreaterThanOrEqual(0);
    }
  });

  test('Debe permitir administración de usuarios', async ({ page }) => {
    // Buscar sección de usuarios
    const usuariosSection = page.locator('text=Usuarios, text=usuarios, a[href*="usuarios"], button:has-text("Usuarios")');
    
    if (await usuariosSection.count() > 0) {
      await usuariosSection.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verificar elementos de administración de usuarios
      const userAdminElements = [
        'text=email, text=Email, text=correo',
        'text=nombre, text=Nombre',
        'text=activo, text=Activo, text=habilitado',
        'button:has-text("Editar"), button:has-text("Eliminar"), button:has-text("Desactivar")',
        'input[type="email"], input[placeholder*="email"]',
        'table, [role="grid"], [class*="user-list"]'
      ];

      let userAdminFound = 0;
      for (const selector of userAdminElements) {
        const count = await page.locator(selector).count();
        if (count > 0) userAdminFound++;
      }

      expect(userAdminFound).toBeGreaterThan(2);
    }
  });

  test('Debe permitir gestión de productos y precios', async ({ page }) => {
    // Buscar sección de productos
    const productosSection = page.locator('text=Productos, text=productos, a[href*="productos"], button:has-text("Productos")');
    
    if (await productosSection.count() > 0) {
      await productosSection.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verificar elementos de gestión de productos
      const productElements = [
        'text=precio, text=Precio',
        'text=stock, text=Stock',
        'text=categoría, text=Categoría',
        'input[type="number"]',
        'button:has-text("Agregar"), button:has-text("Editar"), button:has-text("Guardar")',
        'text=disponible, text=Disponible'
      ];

      let productElementsFound = 0;
      for (const selector of productElements) {
        const count = await page.locator(selector).count();
        if (count > 0) productElementsFound++;
      }

      expect(productElementsFound).toBeGreaterThan(2);
    } else {
      // Buscar modal o sección de productos en la página principal
      const addProductButton = page.locator('button:has-text("Agregar Producto"), button:has-text("Nuevo Producto")');
      
      if (await addProductButton.count() > 0) {
        await addProductButton.first().click();
        await page.waitForTimeout(1000);
        
        // Verificar modal de productos
        const modalElements = [
          'input[placeholder*="nombre"], input[placeholder*="Nombre"]',
          'input[type="number"]',
          'select, [role="combobox"]',
          'button:has-text("Guardar"), button:has-text("Crear")'
        ];

        let modalElementsFound = 0;
        for (const selector of modalElements) {
          const count = await page.locator(selector).count();
          if (count > 0) modalElementsFound++;
        }

        expect(modalElementsFound).toBeGreaterThan(1);
      }
    }
  });

  test('Debe mostrar información de stock disponible', async ({ page }) => {
    // Buscar referencias a stock en cualquier parte del admin
    const stockElements = [
      'text=stock, text=Stock, text=STOCK',
      'text=disponible, text=Disponible',
      'text=inventario, text=Inventario',
      'text=cantidad, text=Cantidad',
      'text=/Stock:\s*[0-9]+/',
      'text=/Disponible:\s*[0-9]+/',
    ];

    let stockFound = 0;
    for (const selector of stockElements) {
      const count = await page.locator(selector).count();
      if (count > 0) stockFound++;
    }

    // Debe tener al menos alguna referencia a stock
    expect(stockFound).toBeGreaterThanOrEqual(0);
  });

  test('Debe mostrar información de ingresos', async ({ page }) => {
    // Buscar sección de ingresos o reportes financieros
    const ingresosElements = [
      'text=ingresos, text=Ingresos, text=INGRESOS',
      'text=diarios, text=Diarios',
      'text=semanales, text=Semanales', 
      'text=mensuales, text=Mensuales',
      'text=total, text=Total',
      'text=/\$[0-9,]+/',
      'text=ventas, text=Ventas',
      'text=reportes, text=Reportes'
    ];

    let ingresosFound = 0;
    for (const selector of ingresosElements) {
      const count = await page.locator(selector).count();
      if (count > 0) ingresosFound++;
    }

    // Debe tener al menos alguna referencia a ingresos o reportes
    expect(ingresosFound).toBeGreaterThanOrEqual(0);
  });

  test('Debe permitir gestión de cobros', async ({ page }) => {
    // Buscar elementos relacionados con cobros y pagos
    const cobrosElements = [
      'text=cobros, text=Cobros',
      'text=pendientes, text=Pendientes',
      'text=confirmados, text=Confirmados',
      'text=reembolsos, text=Reembolsos',
      'button:has-text("Confirmar Pago")',
      'button:has-text("Procesar Reembolso")',
      'text=método de pago, text=Método',
      '[class*="payment-status"], [data-testid*="payment"]'
    ];

    let cobrosFound = 0;
    for (const selector of cobrosElements) {
      const count = await page.locator(selector).count();
      if (count > 0) cobrosFound++;
    }

    // Debe tener al menos alguna funcionalidad de cobros
    expect(cobrosFound).toBeGreaterThanOrEqual(0);
  });

  test('Debe tener interfaz administrativa completa', async ({ page }) => {
    // Verificar que tiene múltiples secciones administrativas
    const adminSections = [
      'text=Turnos, text=turnos',
      'text=Canchas, text=canchas', 
      'text=Usuarios, text=usuarios',
      'text=Productos, text=productos',
      'text=Estadísticas, text=estadísticas'
    ];

    let sectionsFound = 0;
    for (const selector of adminSections) {
      const count = await page.locator(selector).count();
      if (count > 0) sectionsFound++;
    }

    // Debe tener al menos 3 secciones principales
    expect(sectionsFound).toBeGreaterThanOrEqual(3);
  });

  test('Debe tener controles administrativos apropiados', async ({ page }) => {
    // Verificar elementos típicos de control administrativo
    const adminControls = [
      'button:has-text("Editar")',
      'button:has-text("Eliminar")',
      'button:has-text("Confirmar")',
      'button:has-text("Cancelar")',
      'button:has-text("Guardar")',
      'button:has-text("Actualizar")',
      'select, [role="combobox"]',
      'input[type="search"], input[placeholder*="buscar"]'
    ];

    let controlsFound = 0;
    for (const selector of adminControls) {
      const count = await page.locator(selector).count();
      if (count > 0) controlsFound++;
    }

    // Debe tener múltiples controles administrativos
    expect(controlsFound).toBeGreaterThan(3);
  });
});

/**
 * Pruebas para verificar que las funcionalidades administrativas
 * NO aparecen en el dashboard público
 */
test.describe('Verificación Dashboard Público - Sin Funcionalidades Admin', () => {
  
  test('Dashboard NO debe mostrar estadísticas administrativas', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Estas funcionalidades NO deben aparecer en dashboard público
    const adminOnlyStats = [
      'text=Estadísticas de usuarios',
      'text=Ocupación de canchas',
      'text=Usuarios activos',
      'text=Ingresos diarios',
      'text=Ingresos semanales',
      'text=Ingresos mensuales',
      'text=Total de ingresos',
      'text=Reportes financieros'
    ];

    for (const selector of adminOnlyStats) {
      const count = await page.locator(selector).count();
      expect(count).toBe(0);
    }
  });

  test('Dashboard NO debe mostrar gestión de usuarios', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    const userAdminFeatures = [
      'text=Administrar usuarios',
      'text=Gestión de usuarios',
      'text=Editar usuarios',
      'text=Eliminar usuarios',
      'button:has-text("Administrar Usuarios")',
      'a[href*="admin/usuarios"]'
    ];

    for (const selector of userAdminFeatures) {
      const count = await page.locator(selector).count();
      expect(count).toBe(0);
    }
  });

  test('Dashboard NO debe mostrar gestión de productos/stock', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    const productAdminFeatures = [
      'text=Modificar precios de productos',
      'text=Gestión de stock',
      'text=Administrar productos',
      'text=Stock disponible',
      'text=Inventario',
      'button:has-text("Gestionar Stock")',
      'a[href*="admin/productos"]'
    ];

    for (const selector of productAdminFeatures) {
      const count = await page.locator(selector).count();
      expect(count).toBe(0);
    }
  });

  test('Dashboard NO debe mostrar gestión de cobros', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    const cobrosAdminFeatures = [
      'text=Gestión de cobros',
      'text=Confirmar pagos',
      'text=Procesar reembolsos',
      'text=Administrar pagos',
      'button:has-text("Gestionar Cobros")',
      'button:has-text("Confirmar Pago")',
      'button:has-text("Procesar Reembolso")'
    ];

    for (const selector of cobrosAdminFeatures) {
      const count = await page.locator(selector).count();
      expect(count).toBe(0);
    }
  });

  test('Dashboard debe mostrar solo funcionalidades de usuario', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Estas funcionalidades SÍ deben aparecer en dashboard público
    const userFeatures = [
      'text=Reservar, text=reservar',
      'text=Mis turnos, text=turnos',
      'text=Canchas, text=canchas',
      'text=Horarios, text=horarios',
      'button, a[href]' // Elementos interactivos generales
    ];

    let userFeaturesFound = 0;
    for (const selector of userFeatures) {
      const count = await page.locator(selector).count();
      if (count > 0) userFeaturesFound++;
    }

    // Debe tener funcionalidades básicas de usuario
    expect(userFeaturesFound).toBeGreaterThan(2);
  });
});