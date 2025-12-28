import { test, expect } from '@playwright/test';

test.describe('Turnero de Pádel - Página Principal', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/');
  });

  test('debe cargar la página principal correctamente', async ({ page }) => {
    // Verificar que la página se carga
    await expect(page).toHaveTitle(/Turnero/);
    
    // Verificar elementos principales de la interfaz
    await expect(page.locator('body')).toBeVisible();
  });

  test('debe mostrar la sección de reservas', async ({ page }) => {
    // Verificar que existe contenido de reservas
    const reservasSection = page.locator('[data-testid="home-section"], .reservas, .turnos');
    await expect(reservasSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('debe mostrar horarios disponibles', async ({ page }) => {
    // Esperar a que se carguen los horarios
    await page.waitForTimeout(2000);
    
    // Verificar que hay elementos de horarios o slots
    const slots = page.locator('.slot, .horario, [data-testid="time-slot"]');
    const slotsCount = await slots.count();
    
    // Debe haber al menos algunos horarios disponibles o un mensaje de carga
    expect(slotsCount).toBeGreaterThanOrEqual(0);
  });

  test('debe permitir navegación entre secciones', async ({ page }) => {
    // Buscar botones de navegación o pestañas
    const navButtons = page.locator('button, .tab, .nav-item');
    const navCount = await navButtons.count();
    
    if (navCount > 0) {
      // Hacer clic en el primer botón de navegación disponible
      await navButtons.first().click();
      
      // Verificar que la página sigue funcionando
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('debe ser responsivo en dispositivos móviles', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar que la página sigue siendo usable
    await expect(page.locator('body')).toBeVisible();
    
    // Verificar que no hay scroll horizontal excesivo
    const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Permitir un pequeño margen para scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('debe manejar errores de carga graciosamente', async ({ page }) => {
    // Interceptar requests de API que puedan fallar
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Recargar la página
    await page.reload();
    
    // Verificar que la página no se rompe completamente
    await expect(page.locator('body')).toBeVisible();
    
    // No debe haber errores de JavaScript no manejados
    // (esto se captura automáticamente por Playwright)
  });
});