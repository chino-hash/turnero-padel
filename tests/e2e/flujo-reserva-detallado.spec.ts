import { test, expect } from '@playwright/test';

test.describe('Flujo de Reserva Detallado - Diagnóstico Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test.describe('Modal de Detalles de Cancha', () => {
    test('debe abrir modal al hacer clic en Cancha 1 y mostrar detalles correctos', async ({ page }) => {
      // Buscar y hacer clic en Cancha 1
      const cancha1Slot = page.locator('button:has-text("Cancha 1"), [data-testid*="cancha-1"], .slot:has-text("Cancha 1")').first();
      
      // Verificar que existe al menos un slot de Cancha 1
      await expect(cancha1Slot).toBeVisible({ timeout: 10000 });
      
      // Hacer clic para abrir modal
      await cancha1Slot.click();
      await page.waitForTimeout(1000);
      
      // Verificar que se abre la modal
      const modal = page.locator('.modal, .dialog, [role="dialog"], .popup, [data-testid="slot-modal"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Verificar título "Cancha 1" a la izquierda en negrita
      const modalTitle = page.locator('.modal h1, .modal h2, .modal .title, [data-testid="modal-title"]');
      await expect(modalTitle).toBeVisible();
      
      const titleText = await modalTitle.textContent();
      expect(titleText).toContain('Cancha 1');
      
      // Verificar que el título está en negrita
      const titleStyles = await modalTitle.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          fontWeight: styles.fontWeight,
          textAlign: styles.textAlign
        };
      });
      
      console.log('Estilos del título:', titleStyles);
      
      // Verificar que está en negrita (font-weight >= 600 o 'bold')
      const isBold = titleStyles.fontWeight === 'bold' || 
                    titleStyles.fontWeight === '700' || 
                    titleStyles.fontWeight === '600' ||
                    parseInt(titleStyles.fontWeight) >= 600;
      
      expect(isBold).toBeTruthy();
    });

    test('debe mostrar fecha y día dinámicos correctamente posicionados', async ({ page }) => {
      // Buscar cualquier slot disponible
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled]), .slot:not(.disabled)').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      // Verificar que se abre la modal
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Buscar fecha (formato "18 de agosto de 2025" o similar)
      const dateElements = page.locator('.modal .date, .modal .fecha, [data-testid="modal-date"]');
      const dateText = await dateElements.first().textContent();
      
      if (dateText) {
        console.log('Fecha encontrada:', dateText);
        
        // Verificar formato de fecha (debe contener números y mes)
        const hasValidDateFormat = /\d+.*de.*\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(dateText);
        expect(hasValidDateFormat).toBeTruthy();
      }
      
      // Buscar día de la semana ("Lunes", "Martes", etc.)
      const dayElements = page.locator('.modal .day, .modal .dia, [data-testid="modal-day"]');
      const dayText = await dayElements.first().textContent();
      
      if (dayText) {
        console.log('Día encontrado:', dayText);
        
        // Verificar que es un día válido
        const validDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const isValidDay = validDays.some(day => dayText.toLowerCase().includes(day));
        expect(isValidDay).toBeTruthy();
      }
      
      // Verificar posicionamiento (fecha a la derecha, día debajo)
      if (dateElements.count() > 0 && dayElements.count() > 0) {
        const datePosition = await dateElements.first().boundingBox();
        const dayPosition = await dayElements.first().boundingBox();
        
        if (datePosition && dayPosition) {
          // El día debe estar debajo de la fecha (mayor coordenada Y)
          expect(dayPosition.y).toBeGreaterThan(datePosition.y - 10); // 10px de tolerancia
          console.log('Posiciones - Fecha Y:', datePosition.y, 'Día Y:', dayPosition.y);
        }
      }
    });

    test('debe mostrar horario, badge y precio en la modal', async ({ page }) => {
      // Buscar slot disponible
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Verificar horario en la modal
      const timeElements = page.locator('.modal .time, .modal .horario, [data-testid="modal-time"]');
      if (await timeElements.count() > 0) {
        const timeText = await timeElements.first().textContent();
        console.log('Horario en modal:', timeText);
        
        // Verificar formato de horario (HH:MM)
        const hasValidTimeFormat = /\d{1,2}:\d{2}/.test(timeText || '');
        expect(hasValidTimeFormat).toBeTruthy();
      }
      
      // Verificar badge de estado en la modal
      const badgeElements = page.locator('.modal .badge, .modal .status, [data-testid="modal-status"]');
      if (await badgeElements.count() > 0) {
        const badgeText = await badgeElements.first().textContent();
        console.log('Badge en modal:', badgeText);
        
        // Debe ser "Disponible" o "Reservado"
        const validStatuses = ['disponible', 'reservado', 'ocupado'];
        const hasValidStatus = validStatuses.some(status => 
          badgeText?.toLowerCase().includes(status)
        );
        expect(hasValidStatus).toBeTruthy();
      }
      
      // Verificar precio en la modal
      const priceElements = page.locator('.modal .price, .modal .precio, [data-testid="modal-price"]');
      if (await priceElements.count() > 0) {
        const priceText = await priceElements.first().textContent();
        console.log('Precio en modal:', priceText);
        
        // Verificar que contiene números y posiblemente símbolo de moneda
        const hasValidPriceFormat = /\d+|\$/.test(priceText || '');
        expect(hasValidPriceFormat).toBeTruthy();
      }
    });

    test('debe permitir proceder a reservar desde la modal', async ({ page }) => {
      // Buscar slot disponible
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Buscar botón de reservar
      const reserveButton = page.locator('.modal button:has-text("Reservar"), .modal button:has-text("Confirmar"), [data-testid="reserve-button"]');
      
      if (await reserveButton.count() > 0) {
        await expect(reserveButton).toBeVisible();
        await expect(reserveButton).toBeEnabled();
        
        // Hacer clic en reservar
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Verificar que algo cambió (nueva modal, formulario, redirección, etc.)
        const hasPaymentForm = await page.locator('form, .payment-form, .checkout').count() > 0;
        const hasNewModal = await page.locator('.modal:not(:first-child), .payment-modal').count() > 0;
        const hasRedirect = page.url() !== 'http://localhost:3000/';
        
        const hasProgressed = hasPaymentForm || hasNewModal || hasRedirect;
        expect(hasProgressed).toBeTruthy();
        
        console.log('Progreso de reserva:', {
          hasPaymentForm,
          hasNewModal,
          hasRedirect,
          currentUrl: page.url()
        });
      }
    });
  });

  test.describe('Interacción con Diferentes Canchas', () => {
    test('debe abrir modal correcta para Cancha 2', async ({ page }) => {
      const cancha2Slot = page.locator('button:has-text("Cancha 2"), [data-testid*="cancha-2"]').first();
      
      if (await cancha2Slot.count() > 0) {
        await cancha2Slot.click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('.modal, .dialog, [role="dialog"]');
        await expect(modal).toBeVisible();
        
        const modalTitle = page.locator('.modal h1, .modal h2, .modal .title');
        const titleText = await modalTitle.textContent();
        expect(titleText).toContain('Cancha 2');
      }
    });

    test('debe abrir modal correcta para Cancha 3', async ({ page }) => {
      const cancha3Slot = page.locator('button:has-text("Cancha 3"), [data-testid*="cancha-3"]').first();
      
      if (await cancha3Slot.count() > 0) {
        await cancha3Slot.click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('.modal, .dialog, [role="dialog"]');
        await expect(modal).toBeVisible();
        
        const modalTitle = page.locator('.modal h1, .modal h2, .modal .title');
        const titleText = await modalTitle.textContent();
        expect(titleText).toContain('Cancha 3');
      }
    });
  });

  test.describe('Funcionalidad de Modal', () => {
    test('debe cerrar modal al hacer clic en cerrar o fuera de ella', async ({ page }) => {
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Buscar botón de cerrar
      const closeButton = page.locator('.modal button:has-text("×"), .modal button:has-text("Cerrar"), .modal .close, [data-testid="close-modal"]');
      
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(500);
        
        // Verificar que la modal se cerró
        await expect(modal).not.toBeVisible();
      } else {
        // Intentar cerrar haciendo clic fuera de la modal
        await page.click('body', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
        
        // Verificar si se cerró
        const isModalVisible = await modal.isVisible();
        console.log('Modal visible después de clic fuera:', isModalVisible);
      }
    });

    test('debe mantener información consistente entre modal y lista', async ({ page }) => {
      // Obtener información del slot en la lista
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      const slotText = await availableSlot.textContent();
      console.log('Texto del slot en lista:', slotText);
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Comparar información entre lista y modal
      const modalContent = await modal.textContent();
      console.log('Contenido de modal:', modalContent);
      
      // La información debe ser consistente (mismo horario, cancha, etc.)
      if (slotText && modalContent) {
        // Extraer horarios de ambos
        const slotTimeMatch = slotText.match(/\d{1,2}:\d{2}/);
        const modalTimeMatch = modalContent.match(/\d{1,2}:\d{2}/);
        
        if (slotTimeMatch && modalTimeMatch) {
          expect((slotTimeMatch as any)[0]).toBe((modalTimeMatch as any)[0]);
        }
      }
    });
  });
});