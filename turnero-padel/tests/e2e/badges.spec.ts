import { test, expect } from '@playwright/test';

test.describe('Badge Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de test donde se renderiza HomeSection
    await page.goto('http://localhost:3000/test');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Esperar un poco más para que los componentes se rendericen
    await page.waitForTimeout(2000);
  });

  test('debug - verificar elementos en la página', async ({ page }) => {
    // Tomar screenshot para debug
    await page.screenshot({ path: 'debug-page.png', fullPage: true });
    
    // Verificar que la página se carga
    await expect(page).toHaveTitle(/Turnero/);
    
    // Buscar cualquier elemento con texto "Estados:"
    const estadosText = page.locator('text=Estados:');
    console.log('Estados text count:', await estadosText.count());
    
    // Buscar elementos con las clases de badge
    const badgeReservado = page.locator('.badge-reservado');
    const badgeDisponible = page.locator('.badge-disponible');
    
    console.log('Badge reservado count:', await badgeReservado.count());
    console.log('Badge disponible count:', await badgeDisponible.count());
    
    // Verificar si hay algún elemento con texto "Reservado" o "Disponible"
    const reservadoText = page.locator('text=Reservado');
    const disponibleText = page.locator('text=Disponible');
    
    console.log('Reservado text count:', await reservadoText.count());
    console.log('Disponible text count:', await disponibleText.count());
    
    // Al menos debería haber algún elemento con estos textos
    expect(await reservadoText.count() + await disponibleText.count()).toBeGreaterThan(0);
  });

  test('debe mostrar el badge "Reservado" correctamente', async ({ page }) => {
    // Buscar el badge "Reservado" en la sección de demostración
    const reservadoBadge = page.locator('.badge-reservado').first();
    
    // Verificar que el badge existe y es visible
    await expect(reservadoBadge).toBeVisible();
    
    // Verificar el texto del badge
    await expect(reservadoBadge).toHaveText('Reservado');
    
    // Verificar el color de fondo específico
    await expect(reservadoBadge).toHaveCSS('background-color', 'rgb(226, 227, 229)');
    
    // Verificar el color del texto
    await expect(reservadoBadge).toHaveCSS('color', 'rgb(0, 0, 0)');
    
    // Verificar el border-radius
    await expect(reservadoBadge).toHaveCSS('border-radius', '20px');
    
    // Verificar el font-weight
    await expect(reservadoBadge).toHaveCSS('font-weight', '700'); // bold
    
    // Verificar el font-size
    await expect(reservadoBadge).toHaveCSS('font-size', '14px');
  });

  test('debe mostrar el badge "Disponible" correctamente', async ({ page }) => {
    // Buscar el badge "Disponible" en la sección de demostración
    const disponibleBadge = page.locator('.badge-disponible').first();
    
    // Verificar que el badge existe y es visible
    await expect(disponibleBadge).toBeVisible();
    
    // Verificar el texto del badge
    await expect(disponibleBadge).toHaveText('Disponible');
    
    // Verificar que tiene los estilos correctos
    await expect(disponibleBadge).toHaveCSS('border-radius', '20px');
    await expect(disponibleBadge).toHaveCSS('font-weight', '700'); // bold
    await expect(disponibleBadge).toHaveCSS('font-size', '14px');
  });

  test('debe mostrar ambos badges en la sección de demostración', async ({ page }) => {
    // Buscar la sección de demostración de badges
    const badgeDemo = page.locator('div:has-text("Estados:")').first();
    
    // Verificar que la sección existe
    await expect(badgeDemo).toBeVisible();
    
    // Verificar que ambos badges están presentes
    const disponibleBadge = badgeDemo.locator('.badge-disponible');
    const reservadoBadge = badgeDemo.locator('.badge-reservado');
    
    await expect(disponibleBadge).toBeVisible();
    await expect(reservadoBadge).toBeVisible();
    
    // Verificar que están uno al lado del otro
    await expect(disponibleBadge).toHaveText('Disponible');
    await expect(reservadoBadge).toHaveText('Reservado');
  });

  test('debe mostrar badges en los slots de tiempo', async ({ page }) => {
    // Esperar a que los slots de tiempo se carguen
    await page.waitForSelector('[data-testid="time-slot"], .slot, button:has-text("Disponible"), button:has-text("Reservado")', { timeout: 10000 });
    
    // Buscar badges en los slots de tiempo
    const badgesInSlots = page.locator('.badge-disponible, .badge-reservado');
    
    // Verificar que hay al menos un badge visible
    await expect(badgesInSlots.first()).toBeVisible();
    
    // Contar cuántos badges hay (debería haber al menos los de la demo + algunos en slots)
    const badgeCount = await badgesInSlots.count();
    expect(badgeCount).toBeGreaterThan(1);
  });

  test('debe mantener la consistencia visual entre badges', async ({ page }) => {
    const disponibleBadge = page.locator('.badge-disponible').first();
    const reservadoBadge = page.locator('.badge-reservado').first();
    
    // Ambos badges deben tener el mismo border-radius
    await expect(disponibleBadge).toHaveCSS('border-radius', '20px');
    await expect(reservadoBadge).toHaveCSS('border-radius', '20px');
    
    // Ambos badges deben tener el mismo font-weight
    await expect(disponibleBadge).toHaveCSS('font-weight', '700');
    await expect(reservadoBadge).toHaveCSS('font-weight', '700');
    
    // Ambos badges deben tener el mismo font-size
    await expect(disponibleBadge).toHaveCSS('font-size', '14px');
    await expect(reservadoBadge).toHaveCSS('font-size', '14px');
  });
});