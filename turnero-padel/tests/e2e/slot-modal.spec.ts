import { test, expect } from '@playwright/test';

test.describe('Slot Modal Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de prueba donde está HomeSection
    await page.goto('http://localhost:3000/test');
    
    // Esperar a que la página se cargue completamente
    await page.waitForTimeout(3000);
    
    // Esperar a que aparezca el contenido de HomeSection
    await page.waitForSelector('h1:has-text("Reserva tu Cancha de Padel")', { timeout: 10000 });
  });

  test('debe mostrar la página de test correctamente', async ({ page }) => {
    // Verificar que la página se carga
    await expect(page.locator('h1:has-text("Página de Test - Componentes")')).toBeVisible();
    
    // Verificar que el botón para mostrar HomeSection está presente
    await expect(page.locator('button:has-text("HomeSection")')).toBeVisible();
    
    // Hacer clic para mostrar HomeSection si no está visible
    const homeSectionButton = page.locator('button:has-text("Mostrar HomeSection")');
    if (await homeSectionButton.isVisible()) {
      await homeSectionButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verificar que HomeSection se muestra
    await expect(page.locator('h1:has-text("Reserva tu Cancha de Padel")')).toBeVisible();
  });

  test('debe abrir el modal al hacer clic en un turno disponible', async ({ page }) => {
    // Esperar a que los slots se carguen
    await page.waitForSelector('button[id^="slot-"]', { timeout: 10000 });
    
    // Contar cuántos botones hay
    const allButtons = page.locator('button[id^="slot-"]');
    const buttonCount = await allButtons.count();
    console.log(`Total buttons found: ${buttonCount}`);
    
    // Buscar botones disponibles (no deshabilitados)
    const availableButtons = page.locator('button[id^="slot-"]:not([disabled])');
    const availableCount = await availableButtons.count();
    console.log(`Available buttons found: ${availableCount}`);
    
    // Verificar que hay al menos un botón disponible
    await expect(availableButtons.first()).toBeVisible({ timeout: 10000 });
    
    // Hacer clic en el primer botón disponible
    await availableButtons.first().click();
    
    // Esperar un momento para que el estado se actualice
    await page.waitForTimeout(500);
    
    // Verificar que el modal se abre
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect(page.locator('.modal-title')).toBeVisible();
  });

  test('debe mostrar la información correcta del turno en el modal', async ({ page }) => {
    // Hacer clic en un slot disponible
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal contiene la información esperada
    await expect(page.locator('.modal-content')).toBeVisible();
    
    // Verificar que se muestran los campos de información
    await expect(page.locator('.info-label').filter({ hasText: 'Cancha:' })).toBeVisible();
    await expect(page.locator('.info-label').filter({ hasText: 'Horario:' })).toBeVisible();
    await expect(page.locator('.info-label').filter({ hasText: 'Fecha:' })).toBeVisible();
    await expect(page.locator('.info-label').filter({ hasText: 'Precio por persona:' })).toBeVisible();
    await expect(page.locator('.info-label').filter({ hasText: 'Total cancha (4 personas):' })).toBeVisible();
    await expect(page.locator('.info-label').filter({ hasText: 'Estado:' })).toBeVisible();
    
    // Verificar que hay valores correspondientes
    await expect(page.locator('.info-value')).toHaveCount(6); // 6 campos de información
  });

  test('debe cerrar el modal al hacer clic en el botón de cerrar', async ({ page }) => {
    // Abrir el modal
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal está abierto
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Hacer clic en el botón de cerrar
    await page.locator('.modal-close-btn').click();
    
    // Verificar que el modal se cierra
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('debe cerrar el modal al hacer clic en el botón Cancelar', async ({ page }) => {
    // Abrir el modal
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal está abierto
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Hacer clic en el botón Cancelar
    await page.locator('.btn-secondary').filter({ hasText: 'Cancelar' }).click();
    
    // Verificar que el modal se cierra
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('debe cerrar el modal al hacer clic en el overlay', async ({ page }) => {
    // Abrir el modal
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal está abierto
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Hacer clic en el overlay (fuera del contenido del modal)
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
    
    // Verificar que el modal se cierra
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('debe cerrar el modal al presionar la tecla Escape', async ({ page }) => {
    // Abrir el modal
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal está abierto
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Presionar la tecla Escape
    await page.keyboard.press('Escape');
    
    // Verificar que el modal se cierra
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('debe mostrar el botón "Confirmar Reserva" solo para turnos disponibles', async ({ page }) => {
    // Buscar un slot disponible
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal está abierto
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Verificar que el botón "Confirmar Reserva" está presente para slots disponibles
    await expect(page.locator('.btn-primary').filter({ hasText: 'Confirmar Reserva' })).toBeVisible();
  });

  test('debe mostrar el badge correcto según el estado del turno', async ({ page }) => {
    // Abrir el modal de un slot disponible
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal está abierto
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Verificar que se muestra el badge correcto
    const badge = page.locator('.badge');
    await expect(badge).toBeVisible();
    
    // El badge debe ser "Disponible" o "Reservado"
    const badgeText = await badge.textContent();
    expect(badgeText).toMatch(/^(Disponible|Reservado)$/);
  });

  test('debe ser responsive en dispositivos móviles', async ({ page }) => {
    // Cambiar el viewport a móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Abrir el modal
    const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
    await availableSlot.first().click();
    
    // Verificar que el modal se adapta correctamente
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-content')).toBeVisible();
    
    // Verificar que el contenido es accesible en móvil
    const modalContent = page.locator('.modal-content');
    const boundingBox = await modalContent.boundingBox();
    
    // El modal no debe exceder el ancho de la pantalla
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });
});