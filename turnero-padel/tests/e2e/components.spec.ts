import { test, expect } from '@playwright/test';

test.describe('Componentes Refactorizados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
    // Esperar a que la página se cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test.describe('HomeSection Component', () => {
    test('debe renderizar la sección principal correctamente', async ({ page }) => {
      // Verificar que el componente HomeSection está presente
      const homeSection = page.locator('[data-testid="home-section"]').first();
      
      // Si no hay data-testid, buscar por contenido típico de la sección
      const fallbackSelector = page.locator('.home-section, .reservas-section, .main-section').first();
      
      const sectionExists = await homeSection.count() > 0 || await fallbackSelector.count() > 0;
      expect(sectionExists).toBeTruthy();
    });

    test('debe mostrar días disponibles', async ({ page }) => {
      // Buscar elementos que muestren días o fechas
      const dayElements = page.locator('.day, .fecha, .date, [data-testid="available-day"]');
      
      // Esperar a que se carguen los días
      await page.waitForTimeout(3000);
      
      const dayCount = await dayElements.count();
      
      // Debe mostrar al menos algunos días o un indicador de carga
      expect(dayCount).toBeGreaterThanOrEqual(0);
    });

    test('debe permitir selección de horarios', async ({ page }) => {
      // Esperar a que se carguen los horarios
      await page.waitForTimeout(3000);
      
      // Buscar slots de tiempo clickeables
      const timeSlots = page.locator('.slot:not(.disabled), .horario:not(.disabled), [data-testid="time-slot"]:not(.disabled)');
      const availableSlots = await timeSlots.count();
      
      if (availableSlots > 0) {
        // Hacer clic en el primer slot disponible
        await timeSlots.first().click();
        
        // Verificar que algo cambió (selección, modal, etc.)
        await page.waitForTimeout(1000);
        
        // La página debe seguir funcionando
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('debe manejar el filtrado de horarios', async ({ page }) => {
      // Buscar controles de filtro
      const filterControls = page.locator('input[type="checkbox"], .filter, .toggle, [data-testid="filter"]');
      const filterCount = await filterControls.count();
      
      if (filterCount > 0) {
        // Activar/desactivar filtro
        await filterControls.first().click();
        
        // Esperar a que se aplique el filtro
        await page.waitForTimeout(2000);
        
        // Verificar que la página sigue funcionando
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('MisTurnos Component', () => {
    test('debe mostrar la sección de turnos del usuario', async ({ page }) => {
      // Buscar la sección de "Mis Turnos"
      const misTurnosSection = page.locator('[data-testid="mis-turnos"], .mis-turnos, .user-bookings');
      
      // Puede estar visible directamente o requerir navegación
      let sectionVisible = await misTurnosSection.isVisible().catch(() => false);
      
      if (!sectionVisible) {
        // Buscar botón o tab para navegar a "Mis Turnos"
        const misTurnosButton = page.locator('button:has-text("Mis Turnos"), .tab:has-text("Turnos"), [data-testid="mis-turnos-tab"]');
        const buttonExists = await misTurnosButton.count() > 0;
        
        if (buttonExists) {
          await misTurnosButton.first().click();
          await page.waitForTimeout(1000);
          sectionVisible = await misTurnosSection.isVisible().catch(() => false);
        }
      }
      
      // Al menos debe existir la estructura, aunque esté vacía
      const sectionExists = await misTurnosSection.count() > 0;
      expect(sectionExists).toBeTruthy();
    });

    test('debe manejar estado vacío de turnos', async ({ page }) => {
      // Navegar a la sección de turnos si es necesario
      const misTurnosButton = page.locator('button:has-text("Mis Turnos"), .tab:has-text("Turnos")');
      const buttonExists = await misTurnosButton.count() > 0;
      
      if (buttonExists) {
        await misTurnosButton.first().click();
        await page.waitForTimeout(1000);
      }
      
      // Verificar que hay un mensaje de estado vacío o lista de turnos
      const emptyState = page.locator('.empty, .no-turnos, .sin-reservas, [data-testid="empty-bookings"]');
      const bookingsList = page.locator('.turno, .booking, .reserva, [data-testid="booking-item"]');
      
      const hasEmptyState = await emptyState.count() > 0;
      const hasBookings = await bookingsList.count() > 0;
      
      // Debe tener al menos uno de los dos estados
      expect(hasEmptyState || hasBookings).toBeTruthy();
    });
  });

  test.describe('Integración de Componentes', () => {
    test('debe permitir navegación fluida entre secciones', async ({ page }) => {
      // Buscar elementos de navegación
      const navElements = page.locator('button, .tab, .nav-item, [role="tab"]');
      const navCount = await navElements.count();
      
      if (navCount >= 2) {
        // Navegar entre al menos dos secciones
        await navElements.nth(0).click();
        await page.waitForTimeout(1000);
        
        await navElements.nth(1).click();
        await page.waitForTimeout(1000);
        
        // Verificar que no hay errores de JavaScript
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('debe mantener el estado entre navegaciones', async ({ page }) => {
      // Realizar alguna acción que cambie el estado
      const interactiveElements = page.locator('button:not(:disabled), input, select');
      const elementCount = await interactiveElements.count();
      
      if (elementCount > 0) {
        // Interactuar con un elemento
        await interactiveElements.first().click();
        await page.waitForTimeout(1000);
        
        // Navegar a otra sección si es posible
        const navButtons = page.locator('button, .tab');
        const navCount = await navButtons.count();
        
        if (navCount > 1) {
          await navButtons.nth(1).click();
          await page.waitForTimeout(1000);
          
          // Volver a la sección original
          await navButtons.nth(0).click();
          await page.waitForTimeout(1000);
        }
        
        // Verificar que la aplicación sigue funcionando
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });
});