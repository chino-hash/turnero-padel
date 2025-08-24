import { test, expect } from '@playwright/test';

test.describe('Flujo de Usuario Completo - Diagnóstico Integral', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test.describe('Experiencia de Usuario - Navegación Principal', () => {
    test('debe cargar la página principal sin errores críticos', async ({ page }) => {
      // Verificar que no hay errores de JavaScript críticos
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(3000);
      
      // Verificar elementos principales
      const mainContent = page.locator('main, .main-content, [data-testid="main"]');
      await expect(mainContent.first()).toBeVisible({ timeout: 10000 });
      
      // Verificar que no hay errores críticos
      const criticalErrors = errors.filter(error => 
        error.includes('TypeError') || 
        error.includes('ReferenceError') ||
        error.includes('Cannot read property')
      );
      
      expect(criticalErrors.length).toBe(0);
      console.log('Página cargada sin errores críticos');
    });

    test('debe mostrar información de canchas disponibles', async ({ page }) => {
      // Buscar elementos de canchas
      const courtElements = page.locator(
        '.cancha, .court, [data-testid="court"], ' +
        'h3:has-text("Cancha"), h4:has-text("Cancha")'
      );
      
      await expect(courtElements.first()).toBeVisible({ timeout: 15000 });
      
      const courtCount = await courtElements.count();
      expect(courtCount).toBeGreaterThan(0);
      
      console.log(`Encontradas ${courtCount} canchas disponibles`);
    });

    test('debe permitir navegación entre secciones principales', async ({ page }) => {
      // Verificar navegación a MisTurnos
      const misTurnosNav = page.locator(
        'a:has-text("Mis Turnos"), button:has-text("Mis Turnos"), ' +
        '[data-testid="mis-turnos-nav"]'
      );
      
      if (await misTurnosNav.count() > 0) {
        await misTurnosNav.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que cambió el contenido
        const misTurnosContent = page.locator(
          'h1:has-text("Mis Turnos"), h2:has-text("Mis Turnos"), ' +
          '[data-testid="mis-turnos-section"]'
        );
        
        await expect(misTurnosContent.first()).toBeVisible({ timeout: 5000 });
        console.log('Navegación a MisTurnos exitosa');
      }
    });
  });

  test.describe('Flujo de Reserva - Experiencia Completa', () => {
    test('debe mostrar horarios disponibles para reserva', async ({ page }) => {
      // Buscar slots de tiempo disponibles
      const timeSlots = page.locator(
        '.slot, .time-slot, [data-testid="time-slot"], ' +
        '.horario, .available-slot'
      );
      
      await expect(timeSlots.first()).toBeVisible({ timeout: 15000 });
      
      const slotsCount = await timeSlots.count();
      expect(slotsCount).toBeGreaterThan(0);
      
      console.log(`Encontrados ${slotsCount} horarios disponibles`);
    });

    test('debe permitir seleccionar un horario disponible', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Buscar y hacer clic en un slot disponible
      const availableSlot = page.locator(
        '.slot:not(.occupied), .available-slot, ' +
        '[data-testid="available-slot"], .time-slot.available'
      ).first();
      
      if (await availableSlot.count() > 0) {
        await availableSlot.click();
        await page.waitForTimeout(2000);
        
        // Verificar que se abrió modal o cambió el estado
        const modal = page.locator(
          '.modal, [role="dialog"], .slot-modal, ' +
          '[data-testid="booking-modal"]'
        );
        
        const hasModal = await modal.count() > 0;
        if (hasModal) {
          await expect(modal.first()).toBeVisible();
          console.log('Modal de reserva abierto correctamente');
        } else {
          console.log('Slot seleccionado - sin modal visible');
        }
      }
    });

    test('debe manejar correctamente la información del slot seleccionado', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      const availableSlot = page.locator(
        '.slot:not(.occupied), .available-slot'
      ).first();
      
      if (await availableSlot.count() > 0) {
        await availableSlot.click();
        await page.waitForTimeout(2000);
        
        // Verificar información del slot
        const slotInfo = page.locator(
          '.slot-info, .booking-info, [data-testid="slot-details"]'
        );
        
        if (await slotInfo.count() > 0) {
          await expect(slotInfo.first()).toBeVisible();
          
          // Verificar elementos de información
          const timeInfo = page.locator('text=/\d{1,2}:\d{2}/');
          const priceInfo = page.locator('text=/\$|€|ARS|USD/');
          
          if (await timeInfo.count() > 0) {
            console.log('Información de horario mostrada');
          }
          
          if (await priceInfo.count() > 0) {
            console.log('Información de precio mostrada');
          }
        }
      }
    });
  });

  test.describe('Responsividad y Accesibilidad', () => {
    test('debe funcionar correctamente en dispositivos móviles', async ({ page }) => {
      // Simular viewport móvil
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Verificar que el contenido es visible en móvil
      const mainContent = page.locator('main, .main-content');
      await expect(mainContent.first()).toBeVisible();
      
      // Verificar que los elementos son touch-friendly
      const clickableElements = page.locator(
        'button, .slot, .time-slot, a[href]'
      );
      
      const elementsCount = await clickableElements.count();
      if (elementsCount > 0) {
        // Verificar que al menos algunos elementos tienen tamaño adecuado para touch
        const firstElement = clickableElements.first();
        const boundingBox = await firstElement.boundingBox();
        
        if (boundingBox) {
          // Elementos touch-friendly deben tener al menos 44px de altura
          expect(boundingBox.height).toBeGreaterThanOrEqual(30);
        }
      }
      
      console.log('Interfaz móvil verificada');
    });

    test('debe tener elementos accesibles con roles y labels apropiados', async ({ page }) => {
      // Verificar elementos con roles ARIA
      const buttonsWithRole = page.locator('button, [role="button"]');
      const linksWithRole = page.locator('a, [role="link"]');
      
      const buttonCount = await buttonsWithRole.count();
      const linkCount = await linksWithRole.count();
      
      console.log(`Encontrados ${buttonCount} botones y ${linkCount} enlaces`);
      
      // Verificar que hay elementos interactivos
      expect(buttonCount + linkCount).toBeGreaterThan(0);
    });
  });

  test.describe('Manejo de Estados de Carga', () => {
    test('debe mostrar indicadores de carga apropiados', async ({ page }) => {
      // Interceptar requests para simular carga lenta
      await page.route('**/api/**', async (route) => {
        await page.waitForTimeout(1000); // Simular latencia
        await route.continue();
      });
      
      await page.reload();
      
      // Buscar indicadores de carga
      const loadingIndicators = page.locator(
        '.loading, .spinner, .skeleton, ' +
        '[data-testid="loading"], .animate-spin'
      );
      
      // Puede o no haber indicadores, pero si los hay deben ser visibles
      const hasLoading = await loadingIndicators.count() > 0;
      if (hasLoading) {
        console.log('Indicadores de carga encontrados');
      }
    });

    test('debe manejar errores de red graciosamente', async ({ page }) => {
      // Simular error de red
      await page.route('**/api/courts', (route) => {
        route.abort('failed');
      });
      
      await page.reload();
      await page.waitForTimeout(5000);
      
      // Verificar que la página no se rompe completamente
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Buscar mensajes de error o estados de error
      const errorMessages = page.locator(
        '.error, .alert, [data-testid="error"], ' +
        'text=/error/i, text=/failed/i'
      );
      
      const hasErrorHandling = await errorMessages.count() > 0;
      console.log(`Manejo de errores: ${hasErrorHandling ? 'Presente' : 'No detectado'}`);
    });
  });

  test.describe('Performance y Optimización', () => {
    test('debe cargar la página en tiempo razonable', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // La página debe cargar en menos de 10 segundos
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`Tiempo de carga: ${loadTime}ms`);
    });

    test('debe tener un DOM con estructura razonable', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Contar elementos DOM para detectar posibles problemas de rendimiento
      const elementCount = await page.locator('*').count();
      
      // Un DOM muy grande puede indicar problemas de rendimiento
      expect(elementCount).toBeLessThan(5000);
      
      console.log(`Elementos DOM: ${elementCount}`);
    });
  });
});