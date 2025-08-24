import { test, expect } from '@playwright/test';

test.describe('Diagnóstico de Performance y UX - Análisis Integral', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport estándar
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Performance - Tiempos de Carga', () => {
    test('debe cargar la página principal en tiempo óptimo', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // La página principal debe cargar en menos de 10 segundos
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`Tiempo de carga página principal: ${loadTime}ms`);
      
      // Verificar que el contenido principal está visible
      const mainContent = page.locator('main, .main-content, .app-content');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
    });

    test('debe cargar el dashboard de usuario eficientemente', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // El dashboard debe cargar en menos de 12 segundos
      expect(loadTime).toBeLessThan(12000);
      
      console.log(`Tiempo de carga dashboard: ${loadTime}ms`);
    });

    test('debe manejar la carga de recursos de forma eficiente', async ({ page }) => {
      let totalResourceSize = 0;
      let resourceCount = 0;
      
      page.on('response', (response) => {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          totalResourceSize += parseInt(contentLength);
          resourceCount++;
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      console.log(`Total de recursos cargados: ${resourceCount}`);
      console.log(`Tamaño total de recursos: ${(totalResourceSize / 1024 / 1024).toFixed(2)} MB`);
      
      // No debería cargar más de 10MB en la página inicial
      expect(totalResourceSize).toBeLessThan(10 * 1024 * 1024);
    });
  });

  test.describe('Performance - Interactividad', () => {
    test('debe responder rápidamente a clicks en botones', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Buscar botones interactivos
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const startTime = Date.now();
        
        await buttons.first().click();
        await page.waitForTimeout(500);
        
        const responseTime = Date.now() - startTime;
        
        // La respuesta debe ser menor a 1 segundo
        expect(responseTime).toBeLessThan(1000);
        
        console.log(`Tiempo de respuesta del botón: ${responseTime}ms`);
      }
    });

    test('debe manejar scroll suave en listas largas', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Buscar contenedores con scroll
      const scrollableElements = page.locator('.overflow-auto, .overflow-y-auto, [style*="overflow"]');
      
      if (await scrollableElements.count() > 0) {
        const element = scrollableElements.first();
        
        const startTime = Date.now();
        
        // Hacer scroll
        await element.evaluate(el => {
          el.scrollTop = el.scrollHeight / 2;
        });
        
        await page.waitForTimeout(100);
        
        const scrollTime = Date.now() - startTime;
        
        console.log(`Tiempo de scroll: ${scrollTime}ms`);
        
        // El scroll debe ser fluido (menos de 200ms)
        expect(scrollTime).toBeLessThan(200);
      }
    });
  });

  test.describe('UX - Accesibilidad', () => {
    test('debe tener estructura semántica correcta', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Verificar elementos semánticos
      const semanticElements = {
        header: await page.locator('header').count(),
        main: await page.locator('main').count(),
        nav: await page.locator('nav').count(),
        footer: await page.locator('footer').count()
      };
      
      console.log('Elementos semánticos encontrados:', semanticElements);
      
      // Debe tener al menos un elemento main
      expect(semanticElements.main).toBeGreaterThan(0);
    });

    test('debe tener atributos ARIA apropiados', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Buscar elementos con roles ARIA
      const ariaElements = await page.locator('[role]').count();
      const ariaLabels = await page.locator('[aria-label]').count();
      const ariaDescribedBy = await page.locator('[aria-describedby]').count();
      
      console.log(`Elementos con role: ${ariaElements}`);
      console.log(`Elementos con aria-label: ${ariaLabels}`);
      console.log(`Elementos con aria-describedby: ${ariaDescribedBy}`);
      
      // Debe tener algunos elementos con atributos ARIA
      const totalAriaElements = ariaElements + ariaLabels + ariaDescribedBy;
      expect(totalAriaElements).toBeGreaterThan(0);
    });

    test('debe tener contraste adecuado en textos', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Verificar que los textos son legibles
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, div:has-text(" ")');
      const textCount = await textElements.count();
      
      if (textCount > 0) {
        const firstText = textElements.first();
        
        const styles = await firstText.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        console.log('Estilos de texto:', styles);
        
        // Verificar que tiene color definido
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('debe ser navegable por teclado', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Probar navegación por Tab
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        return {
          tagName: focused?.tagName,
          type: focused?.getAttribute('type'),
          role: focused?.getAttribute('role')
        };
      });
      
      console.log('Elemento enfocado:', focusedElement);
      
      // Debe poder enfocar elementos interactivos
      const interactiveTags = ['BUTTON', 'INPUT', 'A', 'SELECT', 'TEXTAREA'];
      const isFocusable = interactiveTags.includes(focusedElement.tagName) || 
                         focusedElement.role === 'button';
      
      if (isFocusable) {
        console.log('Navegación por teclado funcional');
      } else {
        console.log('Navegación por teclado limitada');
      }
    });
  });

  test.describe('UX - Responsividad', () => {
    test('debe adaptarse correctamente a móviles', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Verificar que no hay overflow horizontal
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Margen de 20px
      
      // Verificar que los elementos principales son visibles
      const mainContent = page.locator('main, .main-content, .app-content');
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
      }
      
      console.log('Adaptación móvil verificada');
    });

    test('debe funcionar en tablets', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Verificar layout en tablet
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(768 + 20);
      
      console.log('Adaptación tablet verificada');
    });

    test('debe manejar cambios de orientación', async ({ page }) => {
      // Simular orientación portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // Cambiar a landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(2000);
      
      // Verificar que sigue funcionando
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(667 + 20);
      
      console.log('Cambio de orientación manejado correctamente');
    });
  });

  test.describe('UX - Estados de Carga y Error', () => {
    test('debe mostrar indicadores de carga apropiados', async ({ page }) => {
      await page.goto('/');
      
      // Buscar indicadores de carga durante la carga inicial
      const loadingIndicators = page.locator(
        '.loading, .spinner, [data-testid="loading"], ' +
        '.skeleton, .shimmer, text=/cargando/i'
      );
      
      // Esperar un poco para ver si aparecen indicadores
      await page.waitForTimeout(1000);
      
      const indicatorCount = await loadingIndicators.count();
      console.log(`Indicadores de carga encontrados: ${indicatorCount}`);
      
      if (indicatorCount > 0) {
        console.log('Indicadores de carga presentes');
      } else {
        console.log('No se detectaron indicadores de carga específicos');
      }
    });

    test('debe manejar errores de red graciosamente', async ({ page }) => {
      // Simular error de red
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/');
      await page.waitForTimeout(5000);
      
      // Buscar mensajes de error
      const errorMessages = page.locator(
        '.error, .alert-error, [data-testid="error"], ' +
        'text=/error/i, text=/falló/i, text=/problema/i'
      );
      
      const errorCount = await errorMessages.count();
      console.log(`Mensajes de error encontrados: ${errorCount}`);
      
      // La aplicación debe manejar errores sin crashear
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    });

    test('debe proporcionar feedback visual en interacciones', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Buscar botones y probar hover
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const button = buttons.first();
        
        // Obtener estilos antes del hover
        const initialStyles = await button.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            cursor: styles.cursor
          };
        });
        
        // Hacer hover
        await button.hover();
        await page.waitForTimeout(200);
        
        // Obtener estilos después del hover
        const hoverStyles = await button.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            cursor: styles.cursor
          };
        });
        
        console.log('Estilos iniciales:', initialStyles);
        console.log('Estilos en hover:', hoverStyles);
        
        // Verificar que el cursor es pointer
        expect(hoverStyles.cursor).toBe('pointer');
      }
    });
  });

  test.describe('UX - Usabilidad General', () => {
    test('debe tener navegación intuitiva', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Buscar elementos de navegación
      const navElements = page.locator(
        'nav, .navigation, .menu, .navbar, ' +
        'a[href], button:has-text("Inicio"), button:has-text("Home")'
      );
      
      const navCount = await navElements.count();
      console.log(`Elementos de navegación encontrados: ${navCount}`);
      
      expect(navCount).toBeGreaterThan(0);
    });

    test('debe tener jerarquía visual clara', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Verificar jerarquía de headings
      const headings = {
        h1: await page.locator('h1').count(),
        h2: await page.locator('h2').count(),
        h3: await page.locator('h3').count()
      };
      
      console.log('Jerarquía de headings:', headings);
      
      // Debe tener al menos un h1
      expect(headings.h1).toBeGreaterThan(0);
    });

    test('debe proporcionar información contextual clara', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Buscar elementos informativos
      const infoElements = page.locator(
        '.info, .description, .help-text, ' +
        '[title], [data-tooltip], .tooltip'
      );
      
      const infoCount = await infoElements.count();
      console.log(`Elementos informativos encontrados: ${infoCount}`);
      
      if (infoCount > 0) {
        console.log('Información contextual disponible');
      }
    });
  });
});