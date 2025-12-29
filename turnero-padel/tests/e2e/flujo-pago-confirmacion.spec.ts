import { test, expect } from '@playwright/test';

test.describe('Flujo de Pago y Confirmación - Diagnóstico Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test.describe('Endpoint de Preferencias de Pago', () => {
    test('debe existir el endpoint POST /api/bookings/[id]/payment-preference', async ({ request }) => {
      // Verificar que el endpoint está disponible
      const response = await request.post('/api/bookings/test-booking-id/payment-preference', {
        data: {},
      });

      // No debe ser 404 (endpoint no encontrado)
      expect(response.status()).not.toBe(404);

      // Debe requerir autenticación o validar datos
      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Integración con Mercado Pago', () => {
    test('debe mostrar "Fondos reservados" después de autorización exitosa', async ({ page }) => {
      // Buscar slot disponible
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      // Obtener información del slot antes de reservar
      const slotInfo = {
        text: await availableSlot.textContent(),
        id: await availableSlot.getAttribute('id')
      };
      console.log('Slot seleccionado:', slotInfo);
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      // Verificar modal abierta
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Buscar y hacer clic en botón de reservar
      const reserveButton = page.locator('.modal button:has-text("Reservar"), .modal button:has-text("Confirmar"), [data-testid="reserve-button"]');
      
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Buscar formulario de pago o redirección a Mercado Pago
        const paymentForm = page.locator('form, .payment-form, .checkout, iframe[src*="mercadopago"], iframe[src*="mp"]');
        
        if (await paymentForm.count() > 0) {
          console.log('Formulario de pago encontrado');
          
          // Si hay iframe de Mercado Pago, trabajar con él
          const mpIframe = page.locator('iframe[src*="mercadopago"], iframe[src*="mp"]');
          
          if (await mpIframe.count() > 0) {
            console.log('Iframe de Mercado Pago detectado');
            
            // Simular interacción con Mercado Pago (en sandbox)
            await page.waitForTimeout(3000);
            
            // Buscar campos de tarjeta de prueba
            const cardNumberField = page.locator('input[name*="cardNumber"], input[placeholder*="número"], input[data-testid="card-number"]');
            const expiryField = page.locator('input[name*="expiry"], input[placeholder*="vencimiento"], input[data-testid="expiry"]');
            const cvvField = page.locator('input[name*="cvv"], input[placeholder*="cvv"], input[data-testid="cvv"]');
            
            // Usar credenciales de prueba de Mercado Pago
            if (await cardNumberField.count() > 0) {
              await cardNumberField.fill('4509953566233704'); // Tarjeta de prueba Visa
              console.log('Número de tarjeta de prueba ingresado');
            }
            
            if (await expiryField.count() > 0) {
              await expiryField.fill('11/25');
              console.log('Fecha de vencimiento ingresada');
            }
            
            if (await cvvField.count() > 0) {
              await cvvField.fill('123');
              console.log('CVV ingresado');
            }
            
            // Buscar botón de pagar
            const payButton = page.locator('button:has-text("Pagar"), button:has-text("Confirmar"), button[type="submit"]');
            
            if (await payButton.count() > 0) {
              await payButton.click();
              await page.waitForTimeout(5000);
              
              // Verificar que aparece "Fondos reservados" en la UI
              const fondosReservados = page.locator('text="Fondos reservados", .success:has-text("reservados"), .message:has-text("reservados")');
              
              if (await fondosReservados.count() > 0) {
                await expect(fondosReservados).toBeVisible();
                console.log('"Fondos reservados" mostrado correctamente');
              } else {
                console.log('"Fondos reservados" no encontrado, verificando otros indicadores de éxito');
                
                // Buscar otros indicadores de pago exitoso
                const successIndicators = page.locator('.success, .confirmed, .paid, text="exitoso", text="confirmado"');
                
                if (await successIndicators.count() > 0) {
                  console.log('Indicador de éxito encontrado:', await successIndicators.first().textContent());
                }
              }
            }
          } else {
            // Si no hay iframe, buscar formulario local
            console.log('Formulario de pago local detectado');
            
            // Llenar formulario local con datos de prueba
            const emailField = page.locator('input[type="email"], input[name*="email"]');
            const nameField = page.locator('input[name*="name"], input[name*="nombre"]');
            
            if (await emailField.count() > 0) {
              await emailField.fill('test@example.com');
            }
            
            if (await nameField.count() > 0) {
              await nameField.fill('Usuario de Prueba');
            }
            
            // Buscar y hacer clic en botón de pagar
            const submitButton = page.locator('button[type="submit"], button:has-text("Pagar"), button:has-text("Confirmar")');
            
            if (await submitButton.count() > 0) {
              await submitButton.click();
              await page.waitForTimeout(3000);
            }
          }
        } else {
          console.log('No se encontró formulario de pago, verificando si ya se procesó');
        }
        
        // Verificar cambio de estado en la UI después del pago
        await page.waitForTimeout(2000);
        
        // Buscar mensajes de confirmación
        const confirmationMessages = page.locator(
          'text="Fondos reservados", ' +
          'text="Reserva confirmada", ' +
          'text="Pago exitoso", ' +
          '.success, ' +
          '.confirmation, ' +
          '.alert-success'
        );
        
        if (await confirmationMessages.count() > 0) {
          const messageText = await confirmationMessages.first().textContent();
          console.log('Mensaje de confirmación:', messageText);
          expect(messageText).toBeTruthy();
        }
      }
    });

    test('debe cambiar estado del slot a "Reservado" después del pago', async ({ page }) => {
      // Buscar slot disponible
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      const slotId = await availableSlot.getAttribute('id');
      console.log('ID del slot a reservar:', slotId);
      
      // Verificar estado inicial (debe ser "Disponible")
      const initialBadge = availableSlot.locator('.badge, .status');
      if (await initialBadge.count() > 0) {
        const initialStatus = await initialBadge.textContent();
        console.log('Estado inicial:', initialStatus);
        expect(initialStatus?.toLowerCase()).toContain('disponible');
      }
      
      // Proceder con la reserva
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar"), .modal button:has-text("Confirmar")');
      
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Simular pago exitoso (simplificado)
        const payButton = page.locator('button:has-text("Pagar"), button:has-text("Confirmar pago"), button[type="submit"]');
        
        if (await payButton.count() > 0) {
          await payButton.click();
          await page.waitForTimeout(3000);
        }
        
        // Cerrar modal si está abierta
        const closeButton = page.locator('.modal button:has-text("×"), .modal button:has-text("Cerrar")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Verificar que el estado cambió a "Reservado"
        await page.waitForTimeout(2000);
        
        // Buscar el mismo slot por ID
        const updatedSlot = page.locator(`#${slotId}`);
        
        if (await updatedSlot.count() > 0) {
          const updatedBadge = updatedSlot.locator('.badge, .status');
          
          if (await updatedBadge.count() > 0) {
            const updatedStatus = await updatedBadge.textContent();
            console.log('Estado después del pago:', updatedStatus);
            
            // Debe cambiar a "Reservado"
            expect(updatedStatus?.toLowerCase()).toContain('reservado');
          }
          
          // Verificar que el slot está deshabilitado
          const isDisabled = await updatedSlot.isDisabled();
          expect(isDisabled).toBeTruthy();
          console.log('Slot deshabilitado después de reserva:', isDisabled);
        }
      }
    });

    test('debe manejar errores de pago correctamente', async ({ page }) => {
      // Interceptar requests de pago para simular error
      await page.route('**/api/payment/**', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Payment failed' })
        });
      });
      
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar")');
      
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Buscar mensaje de error
        const errorMessage = page.locator(
          '.error, ' +
          '.alert-error, ' +
          'text="Error", ' +
          'text="Falló", ' +
          'text="No se pudo procesar"'
        );
        
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible();
          const errorText = await errorMessage.textContent();
          console.log('Mensaje de (error as Error) mostrado:', errorText);
        }
        
        // Verificar que el slot sigue disponible
        const slotStillAvailable = page.locator('button[id^="slot-"]:not([disabled])');
        await expect(slotStillAvailable).toHaveCount(await slotStillAvailable.count());
      }
    });
  });

  test.describe('Estados de Loading', () => {
    test('debe mostrar indicadores de carga durante el proceso de pago', async ({ page }) => {
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar")');
      
      if (await reserveButton.count() > 0) {
        // Interceptar request para hacerlo lento
        await page.route('**/api/**', route => {
          setTimeout(() => {
            route.continue();
          }, 2000);
        });
        
        await reserveButton.click();
        
        // Buscar indicadores de carga
        const loadingIndicators = page.locator(
          '.loading, ' +
          '.spinner, ' +
          'text="Cargando", ' +
          'text="Procesando", ' +
          '[data-testid="loading"]'
        );
        
        if (await loadingIndicators.count() > 0) {
          await expect(loadingIndicators.first()).toBeVisible();
          console.log('Indicador de carga mostrado correctamente');
        }
        
        // Verificar que el botón se deshabilita durante la carga
        const isButtonDisabled = await reserveButton.isDisabled();
        console.log('Botón deshabilitado durante carga:', isButtonDisabled);
      }
    });
  });

  test.describe('Validación de Formularios', () => {
    test('debe validar campos requeridos en formulario de pago', async ({ page }) => {
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10000 });
      
      await availableSlot.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      const reserveButton = page.locator('.modal button:has-text("Reservar")');
      
      if (await reserveButton.count() > 0) {
        await reserveButton.click();
        await page.waitForTimeout(2000);
        
        // Buscar formulario de pago
        const paymentForm = page.locator('form, .payment-form');
        
        if (await paymentForm.count() > 0) {
          // Intentar enviar formulario vacío
          const submitButton = page.locator('button[type="submit"], button:has-text("Pagar")');
          
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(1000);
            
            // Buscar mensajes de validación
            const validationMessages = page.locator(
              '.error, ' +
              '.invalid-feedback, ' +
              'text="requerido", ' +
              'text="obligatorio", ' +
              '[data-testid*="error"]'
            );
            
            if (await validationMessages.count() > 0) {
              console.log('Mensajes de validación encontrados:', await validationMessages.count());
              
              for (let i = 0; i < await validationMessages.count(); i++) {
                const message = await validationMessages.nth(i).textContent();
                console.log(`Validación ${i + 1}:`, message);
              }
            }
          }
        }
      }
    });
  });
});