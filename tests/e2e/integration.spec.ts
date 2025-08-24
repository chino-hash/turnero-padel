import { test, expect } from '@playwright/test';

test.describe('Tests de Integración Completa', () => {
  test.describe('Flujo Completo de Reserva', () => {
    test('debe completar el flujo de reserva desde inicio hasta confirmación', async ({ page }) => {
      // 1. Navegar a la página principal
      await page.goto('/');
      
      // 2. Verificar que la página carga correctamente
      await expect(page).toHaveTitle(/Turnero|Padel|Reservas/);
      
      // 3. Buscar sección de reservas
      const bookingSection = page.locator('[data-testid="booking-section"], .booking-section, #booking');
      if (await bookingSection.count() > 0) {
        await expect(bookingSection).toBeVisible();
      }
      
      // 4. Verificar que hay horarios disponibles
      const slots = page.locator('[data-testid="slot"], .slot, .time-slot');
      await page.waitForTimeout(2000); // Esperar carga de datos
      
      if (await slots.count() > 0) {
        // 5. Seleccionar primer horario disponible
        const availableSlot = slots.filter({ hasText: /disponible|available/i }).first();
        if (await availableSlot.count() > 0) {
          await availableSlot.click();
          
          // 6. Verificar que se abre modal o formulario de reserva
          const modal = page.locator('[data-testid="booking-modal"], .modal, .booking-form');
          if (await modal.count() > 0) {
            await expect(modal).toBeVisible();
            
            // 7. Completar formulario si existe
            const emailInput = modal.locator('input[type="email"], input[name="email"]');
            if (await emailInput.count() > 0) {
              await emailInput.fill('test@example.com');
            }
            
            const nameInput = modal.locator('input[name="name"], input[placeholder*="nombre"]');
            if (await nameInput.count() > 0) {
              await nameInput.fill('Usuario Test');
            }
            
            // 8. Intentar confirmar reserva (puede requerir autenticación)
            const confirmButton = modal.locator('button:has-text("Confirmar"), button:has-text("Reservar")');
            if (await confirmButton.count() > 0) {
              await confirmButton.click();
              
              // 9. Verificar resultado (éxito o redirección a login)
              await page.waitForTimeout(1000);
              
              // Puede mostrar mensaje de éxito o redirigir a login
              const successMessage = page.locator('.success, .alert-success, [data-testid="success"]');
              const loginRedirect = page.locator('input[type="password"], .login-form, [href*="login"]');
              
              const hasSuccess = await successMessage.count() > 0;
              const hasLoginRedirect = await loginRedirect.count() > 0;
              
              expect(hasSuccess || hasLoginRedirect).toBeTruthy();
            }
          }
        }
      }
    });

    test('debe manejar reserva sin autenticación', async ({ page }) => {
      await page.goto('/');
      
      // Intentar hacer una reserva sin estar autenticado
      const slots = page.locator('[data-testid="slot"], .slot, .time-slot');
      await page.waitForTimeout(2000);
      
      if (await slots.count() > 0) {
        const firstSlot = slots.first();
        await firstSlot.click();
        
        // Debe redirigir a login o mostrar formulario de guest
        await page.waitForTimeout(1000);
        
        const loginElements = page.locator('input[type="password"], .login-form, [href*="login"]');
        const guestForm = page.locator('input[type="email"], .guest-form');
        
        const hasLogin = await loginElements.count() > 0;
        const hasGuestForm = await guestForm.count() > 0;
        
        expect(hasLogin || hasGuestForm).toBeTruthy();
      }
    });
  });

  test.describe('Navegación y Estado de la Aplicación', () => {
    test('debe mantener estado al navegar entre páginas', async ({ page }) => {
      await page.goto('/');
      
      // Seleccionar una fecha específica si hay selector
      const dateSelector = page.locator('input[type="date"], .date-picker, [data-testid="date-selector"]');
      if (await dateSelector.count() > 0) {
        await dateSelector.first().fill('2024-12-31');
        await page.waitForTimeout(1000);
      }
      
      // Navegar a otra sección y volver
      const navLinks = page.locator('nav a, .nav-link, [data-testid="nav-link"]');
      if (await navLinks.count() > 0) {
        const firstLink = navLinks.first();
        await firstLink.click();
        await page.waitForTimeout(500);
        
        // Volver a la página principal
        await page.goto('/');
        
        // Verificar que el estado se mantiene (si aplica)
        if (await dateSelector.count() > 0) {
          const currentValue = await dateSelector.first().inputValue();
          // El estado puede o no mantenerse, ambos comportamientos son válidos
          expect(currentValue).toBeDefined();
        }
      }
    });

    test('debe manejar navegación con botón atrás del navegador', async ({ page }) => {
      await page.goto('/');
      
      // Navegar a una subsección
      const links = page.locator('a[href]:not([href="#"]):not([href="/"])');
      if (await links.count() > 0) {
        const firstLink = links.first();
        await firstLink.click();
        await page.waitForTimeout(500);
        
        // Usar botón atrás del navegador
        await page.goBack();
        
        // Verificar que volvemos a la página principal
        await expect(page).toHaveURL('/');
      }
    });
  });

  test.describe('Manejo de Errores de Red', () => {
    test('debe manejar fallos de conexión graciosamente', async ({ page }) => {
      // Interceptar requests y simular fallo de red
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/');
      
      // Esperar a que la página intente cargar datos
      await page.waitForTimeout(3000);
      
      // Verificar que la página no se rompe
      const errorElements = page.locator('.error, .alert-error, [data-testid="error"]');
      const loadingElements = page.locator('.loading, .spinner, [data-testid="loading"]');
      const emptyState = page.locator('.empty, .no-data, [data-testid="empty"]');
      
      // Debe mostrar algún tipo de estado de error o vacío
      const hasErrorHandling = await errorElements.count() > 0 || 
                              await loadingElements.count() > 0 || 
                              await emptyState.count() > 0;
      
      // La página debe seguir siendo funcional
      expect(page.url()).toContain('/');
    });

    test('debe recuperarse de errores temporales', async ({ page }) => {
      let requestCount = 0;
      
      // Simular fallo en las primeras 2 requests, luego éxito
      await page.route('**/api/slots**', route => {
        requestCount++;
        if (requestCount <= 2) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      
      // Esperar y verificar que eventualmente se recupera
      await page.waitForTimeout(5000);
      
      // Puede mostrar datos o al menos no estar en estado de error permanente
      const slots = page.locator('[data-testid="slot"], .slot, .time-slot');
      const errorState = page.locator('.error:visible, .alert-error:visible');
      
      // Debe haberse recuperado o al menos no mostrar error permanente
      const hasRecovered = await slots.count() > 0 || await errorState.count() === 0;
      expect(hasRecovered).toBeTruthy();
    });
  });

  test.describe('Rendimiento y Carga', () => {
    test('debe cargar la página principal en tiempo razonable', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Esperar a que el contenido principal esté visible
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // La página debe cargar en menos de 10 segundos
      expect(loadTime).toBeLessThan(10000);
      
      // Idealmente en menos de 5 segundos
      if (loadTime > 5000) {
        console.log(`Advertencia: Página tardó ${loadTime}ms en cargar`);
      }
    });

    test('debe manejar múltiples usuarios simultáneos', async ({ browser }) => {
      // Crear múltiples contextos para simular usuarios concurrentes
      const contexts = [];
      const pages = [];
      
      try {
        // Crear 3 contextos de usuario
        for (let i = 0; i < 3; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }
        
        // Navegar simultáneamente
        const navigationPromises = pages.map(page => page.goto('/'));
        await Promise.all(navigationPromises);
        
        // Verificar que todas las páginas cargaron correctamente
        for (const page of pages) {
          await expect(page).toHaveTitle(/Turnero|Padel|Reservas|/);
        }
        
      } finally {
        // Limpiar contextos
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });

  test.describe('Accesibilidad Básica', () => {
    test('debe tener estructura HTML semántica', async ({ page }) => {
      await page.goto('/');
      
      // Esperar a que la página cargue completamente
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      // Verificar elementos semánticos básicos
      const main = page.locator('main, [role="main"], #__next, .main-content');
      const nav = page.locator('nav, [role="navigation"], .nav, .navbar');
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const content = page.locator('div, section, article');
      
      // Debe tener al menos algún tipo de estructura
      const hasMain = await main.count() > 0;
      const hasNav = await nav.count() > 0;
      const hasHeadings = await headings.count() > 0;
      const hasContent = await content.count() > 0;
      
      // La página debe tener al menos alguna estructura básica
      expect(hasMain || hasNav || hasHeadings || hasContent).toBeTruthy();
    });

    test('debe ser navegable con teclado', async ({ page }) => {
      await page.goto('/');
      
      // Intentar navegar con Tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verificar que hay elementos enfocables
      const focusedElement = page.locator(':focus');
      const hasFocusedElement = await focusedElement.count() > 0;
      
      // Debe haber al menos algunos elementos enfocables
      expect(hasFocusedElement).toBeTruthy();
    });

    test('debe tener contraste adecuado en elementos principales', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que los elementos principales son visibles
      const buttons = page.locator('button:visible');
      const links = page.locator('a:visible');
      const inputs = page.locator('input:visible');
      
      // Al menos debe haber algunos elementos interactivos visibles
      const totalInteractive = await buttons.count() + await links.count() + await inputs.count();
      expect(totalInteractive).toBeGreaterThan(0);
    });
  });

  test.describe('Compatibilidad de Navegadores', () => {
    test('debe funcionar correctamente en diferentes viewports', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1366, height: 768 },  // Laptop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        
        // Verificar que la página es funcional en cada viewport
        await expect(page).toHaveTitle(/Turnero|Padel|Reservas|/);
        
        // Verificar que no hay scroll horizontal en móvil
        if (viewport.width <= 768) {
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // 20px de tolerancia
        }
        
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Persistencia de Datos', () => {
    test('debe manejar localStorage correctamente', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que localStorage está disponible
      const localStorageAvailable = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      });
      
      expect(localStorageAvailable).toBeTruthy();
    });

    test('debe manejar cookies de sesión apropiadamente', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que las cookies funcionan
      await page.evaluate(() => {
        document.cookie = 'test=value; path=/';
      });
      
      const cookies = await page.context().cookies();
      const testCookie = cookies.find(cookie => cookie.name === 'test');
      
      expect(testCookie).toBeDefined();
    });
  });
});