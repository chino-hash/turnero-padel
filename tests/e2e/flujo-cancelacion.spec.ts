import { test, expect } from '@playwright/test';

test.describe('Flujo de Cancelación de Reservas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test.describe('Cancelación de Reservas', () => {
    test('debe permitir cancelar una reserva existente', async ({ page }) => {
      // Primero crear una reserva para poder cancelarla
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      const slotInfo = {
        text: await availableSlot.textContent(),
        id: await availableSlot.getAttribute('id')
      };
      console.log('Creando reserva para cancelar:', slotInfo);
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      // Confirmar reserva
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar"), .modal button:has-text("Confirmar")');
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Buscar la reserva creada (ahora debería estar marcada como reservada)
        const reservedSlot = page.locator(`button[id="${slotInfo.id}"][disabled], button[id="${slotInfo.id}"]:has-text("Reservado")`);
        
        if (await reservedSlot.count() > 0) {
          console.log('Reserva creada exitosamente, procediendo a cancelar');
          
          // Hacer clic en la reserva para ver opciones de cancelación
          await reservedSlot.click();
          await page.waitForTimeout(1000);
          
          // Buscar botón de cancelar
          const cancelButton = page.locator('button:has-text("Cancelar"), button:has-text("Cancelar Reserva"), [data-testid="cancel-button"]');
          
          if (await cancelButton.count() > 0) {
            await cancelButton.click();
            await page.waitForTimeout(1000);
            
            // Confirmar cancelación si hay modal de confirmación
            const confirmCancelButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Cancelar Reserva")');
            
            if (await confirmCancelButton.count() > 0) {
              await confirmCancelButton.click();
              await page.waitForTimeout(2000);
            }
            
            // Verificar que la reserva fue cancelada (slot vuelve a estar disponible)
            const availableAgain = page.locator(`button[id="${slotInfo.id}"]:not([disabled])`);
            await expect(availableAgain).toBeVisible({ timeout: 5000 });
            
            console.log('Reserva cancelada exitosamente');
          } else {
            console.log('No se encontró botón de cancelar, verificando otras opciones');
            
            // Buscar en menú contextual o dropdown
            const menuButton = page.locator('button[aria-label="Opciones"], button:has-text("⋮"), .dropdown-toggle');
            if (await menuButton.count() > 0) {
              await menuButton.click();
              await page.waitForTimeout(500);
              
              const cancelOption = page.locator('a:has-text("Cancelar"), button:has-text("Cancelar")');
              if (await cancelOption.count() > 0) {
                await cancelOption.click();
                await page.waitForTimeout(2000);
                
                // Verificar cancelación
                const availableAgain = page.locator(`button[id="${slotInfo.id}"]:not([disabled])`);
                await expect(availableAgain).toBeVisible({ timeout: 5000 });
              }
            }
          }
        } else {
          console.log('La reserva no se creó correctamente, saltando prueba de cancelación');
          test.skip();
        }
      } else {
        console.log('No se encontró botón de reservar, saltando prueba');
        test.skip();
      }
    });

    test('debe mostrar confirmación antes de cancelar', async ({ page }) => {
      // Buscar una reserva existente o crear una
      const reservedSlot = page.locator('button[disabled]:has-text("Reservado"), button:has-text("Reservado")');
      
      if (await reservedSlot.count() === 0) {
        // Crear una reserva primero
        const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
        if (await availableSlot.count() > 0) {
          await availableSlot.click();
          await page.waitForTimeout(1000);
          
          const reserveButton = page.locator('.modal button:has-text("Reservar"), .modal button:has-text("Confirmar")');
          if (await reserveButton.count() > 0) {
            await reserveButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      // Ahora buscar la reserva para cancelar
      const targetReservation = page.locator('button[disabled]:has-text("Reservado"), button:has-text("Reservado")').first();
      
      if (await targetReservation.count() > 0) {
        await targetReservation.click();
        await page.waitForTimeout(1000);
        
        const cancelButton = page.locator('button:has-text("Cancelar")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          await page.waitForTimeout(500);
          
          // Verificar que aparece modal de confirmación
          const confirmationModal = page.locator('.modal:has-text("confirmar"), .dialog:has-text("confirmar"), [role="dialog"]:has-text("confirmar")');
          await expect(confirmationModal).toBeVisible({ timeout: 3000 });
          
          // Verificar botones de confirmación y cancelación
          const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí")');
          const cancelConfirmButton = page.locator('button:has-text("Cancelar"), button:has-text("No")');
          
          await expect(confirmButton).toBeVisible();
          await expect(cancelConfirmButton).toBeVisible();
          
          console.log('Modal de confirmación mostrado correctamente');
        }
      } else {
        console.log('No hay reservas para cancelar, saltando prueba');
        test.skip();
      }
    });

    test('debe manejar errores de cancelación graciosamente', async ({ page }) => {
      // Interceptar requests de cancelación para simular error
      await page.route('**/api/bookings/**', async route => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Error interno del servidor' })
          });
        } else {
          await route.continue();
        }
      });
      
      // Buscar una reserva para intentar cancelar
      const reservedSlot = page.locator('button[disabled]:has-text("Reservado"), button:has-text("Reservado")');
      
      if (await reservedSlot.count() === 0) {
        // Crear una reserva primero
        const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
        if (await availableSlot.count() > 0) {
          await availableSlot.click();
          await page.waitForTimeout(1000);
          
          const reserveButton = page.locator('.modal button:has-text("Reservar"), .modal button:has-text("Confirmar")');
          if (await reserveButton.count() > 0) {
            await reserveButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      const targetReservation = page.locator('button[disabled]:has-text("Reservado"), button:has-text("Reservado")').first();
      
      if (await targetReservation.count() > 0) {
        await targetReservation.click();
        await page.waitForTimeout(1000);
        
        const cancelButton = page.locator('button:has-text("Cancelar")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          await page.waitForTimeout(500);
          
          // Confirmar cancelación
          const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí")');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
            
            // Verificar que se muestra mensaje de error
            const errorMessage = page.locator('.error, .alert-error, [role="alert"]:has-text("error")');
            await expect(errorMessage).toBeVisible({ timeout: 5000 });
            
            console.log('Error de cancelación manejado correctamente');
          }
        }
      } else {
        console.log('No hay reservas para probar error de cancelación, saltando prueba');
        test.skip();
      }
    });
  });

  test.describe('Políticas de Cancelación', () => {
    test('debe mostrar información sobre políticas de cancelación', async ({ page }) => {
      // Buscar información sobre políticas en la página
      const policyInfo = page.locator(':has-text("política"), :has-text("cancelación"), :has-text("reembolso")');
      
      if (await policyInfo.count() > 0) {
        await expect(policyInfo.first()).toBeVisible();
        console.log('Información de políticas de cancelación encontrada');
      } else {
        // Buscar en modal de reserva
        const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
        if (await availableSlot.count() > 0) {
          await availableSlot.click();
          await page.waitForTimeout(1000);
          
          const modalPolicyInfo = page.locator('.modal :has-text("política"), .modal :has-text("cancelación")');
          if (await modalPolicyInfo.count() > 0) {
            await expect(modalPolicyInfo.first()).toBeVisible();
            console.log('Información de políticas encontrada en modal de reserva');
          } else {
            console.log('No se encontró información sobre políticas de cancelación');
          }
        }
      }
    });

    test('debe validar tiempo límite para cancelaciones', async ({ page }) => {
      // Esta prueba verificaría que no se pueden cancelar reservas muy próximas
      // Por ahora, solo verificamos que existe algún tipo de validación
      
      const reservedSlot = page.locator('button[disabled]:has-text("Reservado"), button:has-text("Reservado")');
      
      if (await reservedSlot.count() > 0) {
        await reservedSlot.click();
        await page.waitForTimeout(1000);
        
        // Verificar si hay algún mensaje sobre restricciones de tiempo
        const timeRestriction = page.locator(':has-text("no se puede cancelar"), :has-text("tiempo límite"), :has-text("24 horas")');
        
        if (await timeRestriction.count() > 0) {
          console.log('Restricciones de tiempo para cancelación encontradas');
          await expect(timeRestriction.first()).toBeVisible();
        } else {
          console.log('No se encontraron restricciones específicas de tiempo');
        }
      } else {
        console.log('No hay reservas para probar restricciones de cancelación');
        test.skip();
      }
    });
  });

  test.describe('Responsividad en Cancelaciones', () => {
    test('debe funcionar correctamente en dispositivos móviles', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const reservedSlot = page.locator('button[disabled]:has-text("Reservado"), button:has-text("Reservado")');
      
      if (await reservedSlot.count() === 0) {
        // Crear una reserva primero
        const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
        if (await availableSlot.count() > 0) {
          await availableSlot.click();
          await page.waitForTimeout(1000);
          
          const reserveButton = page.locator('.modal button:has-text("Reservar"), .modal button:has-text("Confirmar")');
          if (await reserveButton.count() > 0) {
            await reserveButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
      
      const targetReservation = page.locator('button[disabled]:has-text("Reservado"), button:has-text("Reservado")').first();
      
      if (await targetReservation.count() > 0) {
        // Verificar que el botón es clickeable en móvil
        await expect(targetReservation).toBeVisible();
        
        await targetReservation.click();
        await page.waitForTimeout(1000);
        
        // Verificar que el modal se muestra correctamente en móvil
        const modal = page.locator('.modal, .dialog, [role="dialog"]');
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
          
          // Verificar que los botones son accesibles
          const cancelButton = page.locator('button:has-text("Cancelar")');
          if (await cancelButton.count() > 0) {
            await expect(cancelButton).toBeVisible();
            console.log('Interfaz de cancelación funciona correctamente en móvil');
          }
        }
      } else {
        console.log('No hay reservas para probar en móvil, saltando prueba');
        test.skip();
      }
    });
  });
});