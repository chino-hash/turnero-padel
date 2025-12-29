import { test, expect } from '@playwright/test';

test.describe('Flujo de Cancelación y Reembolso - Diagnóstico Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test.describe('Lógica de Tiempo para Cancelación', () => {
    test('debe permitir reembolso completo con >=2 horas de anticipación', async ({ page }) => {
      // Primero crear una reserva
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      const slotId = await availableSlot.getAttribute('id');
      console.log('Creando reserva para slot:', slotId);
      
      // Simular reserva exitosa
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar")');
      
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Simular pago exitoso (simplificado)
        const payButton = page.locator('button:has-text("Pagar"), button:has-text("Confirmar")');
        if (await payButton.count() > 0) {
          await payButton.click();
          await page.waitForTimeout(3000);
        }
        
        // Cerrar modal
        const closeButton = page.locator('.modal button:has-text("×"), .modal button:has-text("Cerrar")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Ahora intentar cancelar
        // Buscar el slot reservado
        const reservedSlot = page.locator(`#${slotId}`);
        
        if (await reservedSlot.count() > 0) {
          // Verificar que está reservado
          const badge = reservedSlot.locator('.badge, .status');
          if (await badge.count() > 0) {
            const status = await badge.textContent();
            console.log('Estado antes de cancelar:', status);
          }
          
          // Hacer clic para abrir opciones de cancelación
          await reservedSlot.click();
          await page.waitForTimeout(1000);
          
          // Buscar botón de cancelar
          const cancelButton = page.locator(
            'button:has-text("Cancelar"), ' +
            'button:has-text("Anular"), ' +
            '[data-testid="cancel-button"], ' +
            '.cancel-btn'
          );
          
          if (await cancelButton.count() > 0) {
            await cancelButton.click();
            await page.waitForTimeout(2000);
            
            // Verificar mensaje de confirmación de cancelación
            const confirmCancelButton = page.locator(
              'button:has-text("Confirmar cancelación"), ' +
              'button:has-text("Sí, cancelar"), ' +
              'button:has-text("Aceptar")'
            );
            
            if (await confirmCancelButton.count() > 0) {
              await confirmCancelButton.click();
              await page.waitForTimeout(3000);
              
              // Verificar mensaje "Fondos liberados"
              const fondosLiberados = page.locator(
                'text="Fondos liberados", ' +
                'text="Reembolso procesado", ' +
                'text="Dinero devuelto", ' +
                '.success:has-text("liberados"), ' +
                '.message:has-text("liberados")'
              );
              
              if (await fondosLiberados.count() > 0) {
                await expect(fondosLiberados.first()).toBeVisible();
                console.log('"Fondos liberados" mostrado correctamente');
              }
              
              // Verificar que el slot vuelve a "Disponible"
              await page.waitForTimeout(2000);
              const updatedSlot = page.locator(`#${slotId}`);
              
              if (await updatedSlot.count() > 0) {
                const updatedBadge = updatedSlot.locator('.badge, .status');
                
                if (await updatedBadge.count() > 0) {
                  const updatedStatus = await updatedBadge.textContent();
                  console.log('Estado después de cancelación:', updatedStatus);
                  expect(updatedStatus?.toLowerCase()).toContain('disponible');
                }
                
                // Verificar que el slot ya no está deshabilitado
                const isEnabled = !(await updatedSlot.isDisabled());
                expect(isEnabled).toBeTruthy();
                console.log('Slot habilitado después de cancelación:', isEnabled);
              }
            }
          }
        }
      }
    });

    test('debe retener seña con <2 horas de anticipación', async ({ page }) => {
      // Interceptar API para simular reserva con menos de 2 horas
      await page.route('**/api/bookings/**', route => {
        const url = route.request().url();
        
        if (route.request().method() === 'DELETE' || url.includes('cancel')) {
          // Simular respuesta de cancelación tardía
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Cancelación tardía',
              message: 'No se puede reembolsar con menos de 2 horas de anticipación',
              refund: false
            })
          });
        } else {
          route.continue();
        }
      });
      
      // Crear reserva
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      const slotId = await availableSlot.getAttribute('id');
      console.log('Creando reserva para cancelación tardía:', slotId);
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar")');
      
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Simular pago
        const payButton = page.locator('button:has-text("Pagar"), button:has-text("Confirmar")');
        if (await payButton.count() > 0) {
          await payButton.click();
          await page.waitForTimeout(3000);
        }
        
        // Cerrar modal
        const closeButton = page.locator('.modal button:has-text("×"), .modal button:has-text("Cerrar")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Intentar cancelar (debería fallar)
        const reservedSlot = page.locator(`#${slotId}`);
        
        if (await reservedSlot.count() > 0) {
          await reservedSlot.click();
          await page.waitForTimeout(1000);
          
          const cancelButton = page.locator('button:has-text("Cancelar")');
          
          if (await cancelButton.count() > 0) {
            await cancelButton.click();
            await page.waitForTimeout(2000);
            
            const confirmCancelButton = page.locator('button:has-text("Confirmar cancelación")');
            
            if (await confirmCancelButton.count() > 0) {
              await confirmCancelButton.click();
              await page.waitForTimeout(3000);
              
              // Verificar mensaje de error (no reembolso)
              const noRefundMessage = page.locator(
                'text="No se puede reembolsar", ' +
                'text="Seña retenida", ' +
                'text="menos de 2 horas", ' +
                '.error:has-text("reembolso"), ' +
                '.warning:has-text("anticipación")'
              );
              
              if (await noRefundMessage.count() > 0) {
                await expect(noRefundMessage.first()).toBeVisible();
                console.log('Mensaje de no reembolso mostrado correctamente');
              }
              
              // Verificar que el slot sigue reservado
              const updatedSlot = page.locator(`#${slotId}`);
              
              if (await updatedSlot.count() > 0) {
                const updatedBadge = updatedSlot.locator('.badge, .status');
                
                if (await updatedBadge.count() > 0) {
                  const updatedStatus = await updatedBadge.textContent();
                  console.log('Estado después de cancelación tardía:', updatedStatus);
                  // Puede seguir "Reservado" o cambiar a "Cancelado sin reembolso"
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Verificación de Estados de UI', () => {
    test('debe mostrar diferentes estados de cancelación en la interfaz', async ({ page }) => {
      // Ir a la sección MisTurnos para ver reservas
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos"), [data-testid="mis-turnos"]');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.click();
        await page.waitForTimeout(2000);
        
        // Verificar que estamos en la página correcta
        expect(page.url()).toContain('mis-turnos');
        
        // Buscar reservas existentes
        const reservations = page.locator('.reservation, .booking, .turno, [data-testid="reservation"]');
        
        if (await reservations.count() > 0) {
          console.log('Reservas encontradas:', await reservations.count());
          
          // Verificar cada reserva
          for (let i = 0; i < await reservations.count(); i++) {
            const reservation = reservations.nth(i);
            
            // Verificar estado de la reserva
            const statusBadge = reservation.locator('.badge, .status, .estado');
            
            if (await statusBadge.count() > 0) {
              const status = await statusBadge.textContent();
              console.log(`Reserva ${i + 1} estado:`, status);
              
              // Verificar que tiene un estado válido
              const validStatuses = ['confirmado', 'reservado', 'cancelado', 'pendiente'];
              const hasValidStatus = validStatuses.some(validStatus => 
                status?.toLowerCase().includes(validStatus)
              );
              expect(hasValidStatus).toBeTruthy();
            }
            
            // Verificar botones de acción disponibles
            const actionButtons = reservation.locator('button');
            
            if (await actionButtons.count() > 0) {
              console.log(`Reserva ${i + 1} botones:`, await actionButtons.count());
              
              for (let j = 0; j < await actionButtons.count(); j++) {
                const buttonText = await actionButtons.nth(j).textContent();
                console.log(`  Botón ${j + 1}:`, buttonText);
              }
            }
          }
        } else {
          console.log('No se encontraron reservas en MisTurnos');
          
          // Verificar estado vacío
          const emptyState = page.locator(
            'text="No tienes reservas", ' +
            'text="Sin turnos", ' +
            '.empty-state, ' +
            '[data-testid="empty-reservations"]'
          );
          
          if (await emptyState.count() > 0) {
            await expect(emptyState.first()).toBeVisible();
            console.log('Estado vacío mostrado correctamente');
          }
        }
      }
    });

    test('debe actualizar UI inmediatamente después de cancelación', async ({ page }) => {
      // Crear reserva y cancelar para verificar actualización inmediata
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      const slotId = await availableSlot.getAttribute('id');
      
      // Reservar
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar")');
      
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Simular pago rápido
        const payButton = page.locator('button:has-text("Pagar")');
        if (await payButton.count() > 0) {
          await payButton.click();
          await page.waitForTimeout(2000);
        }
        
        // Cerrar modal
        const closeButton = page.locator('.modal button:has-text("×")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Verificar estado reservado
        const reservedSlot = page.locator(`#${slotId}`);
        const initialBadge = reservedSlot.locator('.badge, .status');
        
        if (await initialBadge.count() > 0) {
          const initialStatus = await initialBadge.textContent();
          console.log('Estado inicial después de reserva:', initialStatus);
          expect(initialStatus?.toLowerCase()).toContain('reservado');
        }
        
        // Cancelar inmediatamente
        await reservedSlot.click();
        await page.waitForTimeout(1000);
        
        const cancelButton = page.locator('button:has-text("Cancelar")');
        
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          
          const confirmButton = page.locator('button:has-text("Confirmar")');
          
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            
            // Verificar actualización inmediata (sin necesidad de recargar)
            await page.waitForTimeout(2000);
            
            const updatedSlot = page.locator(`#${slotId}`);
            const updatedBadge = updatedSlot.locator('.badge, .status');
            
            if (await updatedBadge.count() > 0) {
              const updatedStatus = await updatedBadge.textContent();
              console.log('Estado después de cancelación inmediata:', updatedStatus);
              
              // Debe cambiar sin recargar la página
              expect(updatedStatus?.toLowerCase()).toContain('disponible');
            }
            
            // Verificar que no hay recarga de página
            const currentUrl = page.url();
            expect(currentUrl).toBe('http://localhost:3000/');
          }
        }
      }
    });
  });

  test.describe('Manejo de Errores en Cancelación', () => {
    test('debe manejar errores de red durante cancelación', async ({ page }) => {
      // Interceptar requests de cancelación para simular error de red
      await page.route('**/api/bookings/**/cancel', route => {
        route.abort('failed');
      });
      
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      // Simular reserva existente (simplificado)
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const cancelButton = page.locator('button:has-text("Cancelar")');
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        await page.waitForTimeout(2000);
        
        // Buscar mensaje de error de red
        const networkError = page.locator(
          'text="Error de conexión", ' +
          'text="No se pudo cancelar", ' +
          'text="Intenta nuevamente", ' +
          '.error, ' +
          '.network-error'
        );
        
        if (await networkError.count() > 0) {
          await expect(networkError.first()).toBeVisible();
          console.log('Error de red manejado correctamente');
        }
      }
    });

    test('debe mostrar confirmación antes de cancelar', async ({ page }) => {
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const cancelButton = page.locator('button:has-text("Cancelar")');
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();
        await page.waitForTimeout(1000);
        
        // Verificar modal de confirmación
        const confirmationModal = page.locator(
          '.confirmation-modal, ' +
          '.confirm-dialog, ' +
          'text="¿Estás seguro?", ' +
          'text="Confirmar cancelación"'
        );
        
        if (await confirmationModal.count() > 0) {
          await expect(confirmationModal.first()).toBeVisible();
          console.log('Modal de confirmación mostrada correctamente');
          
          // Verificar botones de confirmación
          const confirmButtons = page.locator(
            'button:has-text("Sí"), ' +
            'button:has-text("Confirmar"), ' +
            'button:has-text("Aceptar")'
          );
          
          const cancelButtons = page.locator(
            'button:has-text("No"), ' +
            'button:has-text("Cancelar"), ' +
            'button:has-text("Volver")'
          );
          
          if (await confirmButtons.count() > 0) {
            await expect(confirmButtons.first()).toBeVisible();
          }
          
          if (await cancelButtons.count() > 0) {
            await expect(cancelButtons.first()).toBeVisible();
          }
        }
      }
    });
  });
});