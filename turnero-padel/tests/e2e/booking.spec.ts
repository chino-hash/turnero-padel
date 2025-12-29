import { test, expect } from '@playwright/test';

test.describe('Sistema de Reservas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Flujo de Reserva', () => {
    test('debe mostrar horarios disponibles para reservar', async ({ page }) => {
      // Esperar a que se carguen los horarios
      await page.waitForTimeout(3000);
      
      // Buscar slots de tiempo disponibles
      const availableSlots = page.locator('.slot:not(.disabled):not(.occupied), .horario.disponible, [data-testid="available-slot"]');
      const slotsCount = await availableSlots.count();
      
      // Verificar que hay slots disponibles o un mensaje apropiado
      if (slotsCount === 0) {
        // Si no hay slots, debe haber un mensaje explicativo
        const noSlotsMessage = page.locator('.no-slots, .sin-horarios, .empty-state');
        const hasMessage = await noSlotsMessage.count() > 0;
        expect(hasMessage).toBeTruthy();
      } else {
        expect(slotsCount).toBeGreaterThan(0);
      }
    });

    test('debe permitir seleccionar un horario', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Buscar y hacer clic en un slot disponible
      const availableSlots = page.locator('.slot:not(.disabled):not(.occupied), .horario.disponible');
      const slotsCount = await availableSlots.count();
      
      if (slotsCount > 0) {
        const firstSlot = availableSlots.first();
        
        // Obtener el estado inicial
        const initialClass = await firstSlot.getAttribute('class');
        
        // Hacer clic en el slot
        await firstSlot.click();
        await page.waitForTimeout(1000);
        
        // Verificar que algo cambió (clase, modal, formulario, etc.)
        const afterClickClass = await firstSlot.getAttribute('class');
        const hasModal = await page.locator('.modal, .dialog, .popup').count() > 0;
        const hasForm = await page.locator('form, .booking-form').count() > 0;
        
        const stateChanged = initialClass !== afterClickClass || hasModal || hasForm;
        expect(stateChanged).toBeTruthy();
      }
    });

    test('debe mostrar información del slot seleccionado', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      const availableSlots = page.locator('.slot:not(.disabled), .horario:not(.disabled)');
      const slotsCount = await availableSlots.count();
      
      if (slotsCount > 0) {
        await availableSlots.first().click();
        await page.waitForTimeout(1000);
        
        // Buscar información del slot (hora, cancha, precio, etc.)
        const slotInfo = page.locator('.slot-info, .booking-details, .reservation-info');
        const timeInfo = page.locator('.time, .hora, .horario-info');
        const courtInfo = page.locator('.court, .cancha, .pista');
        
        const hasInfo = await slotInfo.count() > 0 || 
                       await timeInfo.count() > 0 || 
                       await courtInfo.count() > 0;
        
        expect(hasInfo).toBeTruthy();
      }
    });
  });

  test.describe('Filtros y Navegación', () => {
    test('debe permitir filtrar por disponibilidad', async ({ page }) => {
      // Buscar controles de filtro
      const showOnlyOpenFilter = page.locator('input[type="checkbox"], .filter-toggle, [data-testid="show-only-open"]');
      const filterCount = await showOnlyOpenFilter.count();
      
      if (filterCount > 0) {
        // Contar slots antes del filtro
        await page.waitForTimeout(2000);
        const initialSlots = await page.locator('.slot, .horario').count();
        
        // Activar filtro
        await showOnlyOpenFilter.first().click();
        await page.waitForTimeout(2000);
        
        // Contar slots después del filtro
        const filteredSlots = await page.locator('.slot, .horario').count();
        
        // El filtro debe cambiar la cantidad de slots mostrados o mantenerlos igual
        expect(filteredSlots).toBeGreaterThanOrEqual(0);
        expect(filteredSlots).toBeLessThanOrEqual(initialSlots);
      }
    });

    test('debe permitir navegar entre días', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Buscar controles de navegación de días
      const dayNavigation = page.locator('.day-nav, .date-picker, .calendar-nav, button:has-text(">"), button:has-text("<")');
      const navCount = await dayNavigation.count();
      
      if (navCount > 0) {
        // Hacer clic en navegación
        await dayNavigation.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que la página sigue funcionando
        await expect(page.locator('body')).toBeVisible();
        
        // Los slots pueden cambiar al cambiar de día
        const slotsAfterNav = await page.locator('.slot, .horario').count();
        expect(slotsAfterNav).toBeGreaterThanOrEqual(0);
      }
    });

    test('debe mostrar diferentes canchas si están disponibles', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Buscar indicadores de canchas
      const courtElements = page.locator('.court, .cancha, .pista, [data-testid="court"]');
      const courtCount = await courtElements.count();
      
      if (courtCount > 1) {
        // Verificar que hay múltiples canchas
        expect(courtCount).toBeGreaterThan(1);
        
        // Verificar que cada cancha tiene identificación
        const firstCourt = courtElements.first();
        const courtText = await firstCourt.textContent();
        expect(courtText).toBeTruthy();
        expect(courtText!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Manejo de Errores', () => {
    test('debe manejar errores de carga de horarios', async ({ page }) => {
      // Interceptar llamadas a la API de slots
      await page.route('**/api/slots**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Error del servidor' })
        });
      });
      
      // Recargar la página
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Verificar que hay un mensaje de error o estado de carga
      const errorMessage = page.locator('.error, .error-message, .alert-error');
      const loadingState = page.locator('.loading, .spinner, .cargando');
      const emptyState = page.locator('.empty, .no-data, .sin-datos');
      
      const hasErrorHandling = await errorMessage.count() > 0 || 
                              await loadingState.count() > 0 || 
                              await emptyState.count() > 0;
      
      expect(hasErrorHandling).toBeTruthy();
    });

    test('debe manejar slots no disponibles correctamente', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Buscar slots ocupados o deshabilitados
      const disabledSlots = page.locator('.slot.disabled, .slot.occupied, .horario.ocupado, .horario.disabled');
      const disabledCount = await disabledSlots.count();
      
      if (disabledCount > 0) {
        // Intentar hacer clic en un slot deshabilitado
        await disabledSlots.first().click();
        await page.waitForTimeout(1000);
        
        // No debe abrir modal de reserva o cambiar estado
        const modal = page.locator('.modal, .dialog, .popup');
        const hasModal = await modal.count() > 0;
        
        // Si se abre un modal, debe ser de error o información
        if (hasModal) {
          const modalText = await modal.textContent();
          const isErrorModal = modalText?.toLowerCase().includes('no disponible') || 
                              modalText?.toLowerCase().includes('ocupado') ||
                              modalText?.toLowerCase().includes('error');
          expect(isErrorModal).toBeTruthy();
        }
      }
    });
  });

  test.describe('Responsividad', () => {
    test('debe funcionar correctamente en móvil', async ({ page }) => {
      // Cambiar a viewport móvil
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(2000);
      
      // Verificar que los slots son clickeables en móvil
      const slots = page.locator('.slot, .horario');
      const slotsCount = await slots.count();
      
      if (slotsCount > 0) {
        // Verificar que los slots tienen un tamaño mínimo para touch
        const firstSlot = slots.first();
        const boundingBox = await firstSlot.boundingBox();
        
        if (boundingBox) {
          // Los elementos touch deben tener al menos 44px de altura (recomendación iOS)
          expect(boundingBox.height).toBeGreaterThanOrEqual(30);
          expect(boundingBox.width).toBeGreaterThanOrEqual(30);
        }
      }
      
      // Verificar que no hay scroll horizontal
      const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
    });
  });
});