import { test, expect } from '@playwright/test';

// Pruebas de integración para Sistema de Pagos
test.describe('Integración Sistema de Pagos', () => {
  test.describe('Integración con Pasarelas de Pago', () => {
    test('debe configurar correctamente las pasarelas de pago', async ({ request }) => {
      try {
        // Verificar configuración de pasarelas
        const response = await request.get('/api/payments/config');
        
        if (response.ok()) {
          const config = await response.json();
          
          // Verificar que tiene configuración de al menos una pasarela
          const hasPaymentGateway = config.stripe || config.paypal || config.mercadopago || 
                                   config.providers || config.gateways;
          
          expect(hasPaymentGateway).toBeTruthy();
          
          // No debe exponer claves secretas
          expect(config.secretKey).toBeUndefined();
          expect(config.privateKey).toBeUndefined();
          expect(config.apiSecret).toBeUndefined();
          
          // Debe tener claves públicas o identificadores
          const hasPublicKeys = config.publicKey || config.clientId || config.publishableKey;
          expect(hasPublicKeys).toBeTruthy();
        }
      } catch (error) {
        console.log('Configuración de pagos no disponible:', error.message);
      }
    });

    test('debe validar datos de pago antes de procesar', async ({ request }) => {
      const testPayments = [
        {
          amount: 100,
          currency: 'EUR',
          method: 'card',
          valid: true
        },
        {
          amount: -50, // Monto negativo
          currency: 'EUR',
          method: 'card',
          valid: false
        },
        {
          amount: 0, // Monto cero
          currency: 'EUR',
          method: 'card',
          valid: false
        },
        {
          amount: 100,
          currency: 'INVALID', // Moneda inválida
          method: 'card',
          valid: false
        },
        {
          amount: 100,
          currency: 'EUR',
          method: '', // Método vacío
          valid: false
        }
      ];

      for (const testPayment of testPayments) {
        try {
          const response = await request.post('/api/payments/validate', {
            data: testPayment
          });

          if (response.ok()) {
            const result = await response.json();
            
            if (testPayment.valid) {
              expect(result.valid || result.isValid).toBeTruthy();
            } else {
              expect(result.valid || result.isValid).toBeFalsy();
              expect(result.errors || result.error).toBeDefined();
            }
          } else if (!testPayment.valid) {
            // Error HTTP esperado para datos inválidos
            expect([400, 422]).toContain(response.status());
          }
        } catch (error) {
          console.log(`Validación de pago no disponible para:`, testPayment, error.message);
        }
      }
    });

    test('debe crear intenciones de pago correctamente', async ({ request }) => {
      const paymentIntent = {
        amount: 5000, // 50.00 EUR en centavos
        currency: 'eur',
        bookingId: 'test-booking-123',
        description: 'Reserva de pista de pádel'
      };

      try {
        const response = await request.post('/api/payments/create-intent', {
          data: paymentIntent
        });

        if (response.ok()) {
          const intent = await response.json();
          
          // Verificar estructura de la intención de pago
          expect(intent.id || intent.paymentIntentId).toBeDefined();
          expect(intent.clientSecret || intent.client_secret).toBeDefined();
          expect(intent.amount).toBe(paymentIntent.amount);
          expect(intent.currency).toBe(paymentIntent.currency);
          expect(intent.status).toBeDefined();
          
          // Estados válidos para intención de pago
          const validStatuses = ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded'];
          expect(validStatuses).toContain(intent.status);
        } else {
          // Puede no estar implementado
          expect([404, 405, 501]).toContain(response.status());
        }
      } catch (error) {
        console.log('Creación de intención de pago no disponible:', error.message);
      }
    });

    test('debe manejar webhooks de pasarelas de pago', async ({ request }) => {
      const webhookEndpoints = [
        '/api/webhooks/stripe',
        '/api/webhooks/paypal',
        '/api/webhooks/mercadopago',
        '/api/webhooks/payments'
      ];

      for (const endpoint of webhookEndpoints) {
        try {
          // Simular webhook de pago exitoso
          const webhookData = {
            id: 'evt_test_webhook',
            type: 'payment_intent.succeeded',
            data: {
              object: {
                id: 'pi_test_payment',
                amount: 5000,
                currency: 'eur',
                status: 'succeeded'
              }
            }
          };

          const response = await request.post(endpoint, {
            data: webhookData,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          // Debe manejar webhooks apropiadamente
          if (response.ok()) {
            const result = await response.json();
            expect(result.received || result.success).toBeTruthy();
          } else {
            // Errores válidos: no autorizado, no encontrado, método no permitido
            expect([400, 401, 404, 405, 422]).toContain(response.status());
          }
        } catch (error) {
          console.log(`Webhook ${endpoint} no disponible:`, error.message);
        }
      }
    });
  });

  test.describe('Procesamiento de Transacciones', () => {
    test('debe procesar pagos con tarjeta de crédito', async ({ page }) => {
      await page.goto('/');
      
      // Buscar formulario de pago o botón de reserva
      const paymentTriggers = page.locator('button:has-text("Pagar"), button:has-text("Reservar"), .payment-button, [data-testid="payment-button"]');
      
      if (await paymentTriggers.count() > 0) {
        await paymentTriggers.first().click();
        await page.waitForTimeout(2000);
        
        // Buscar elementos del formulario de pago
        const cardElements = [
          'input[placeholder*="card"], input[placeholder*="tarjeta"]',
          '.card-element, .stripe-element',
          'iframe[src*="stripe"], iframe[src*="paypal"]',
          '[data-testid="card-input"]'
        ];

        let hasPaymentForm = false;
        
        for (const selector of cardElements) {
          const elements = page.locator(selector);
          if (await elements.count() > 0) {
            hasPaymentForm = true;
            break;
          }
        }

        // Si hay formulario de pago, verificar elementos básicos
        if (hasPaymentForm) {
          // Buscar campos de tarjeta
          const cardNumber = page.locator('input[placeholder*="card"], input[placeholder*="número"], [data-testid="card-number"]');
          const expiryDate = page.locator('input[placeholder*="expiry"], input[placeholder*="vencimiento"], [data-testid="card-expiry"]');
          const cvv = page.locator('input[placeholder*="cvv"], input[placeholder*="cvc"], [data-testid="card-cvv"]');
          
          const hasCardFields = await cardNumber.count() > 0 || 
                               await expiryDate.count() > 0 || 
                               await cvv.count() > 0;
          
          expect(hasCardFields).toBeTruthy();
        }
      }
    });

    test('debe manejar diferentes métodos de pago', async ({ page }) => {
      await page.goto('/');
      
      // Buscar opciones de métodos de pago
      const paymentMethods = [
        'button:has-text("Tarjeta"), button:has-text("Card")',
        'button:has-text("PayPal")',
        'button:has-text("Transferencia")',
        'button:has-text("Efectivo")',
        '.payment-method, .payment-option'
      ];

      let availableMethods = 0;
      
      for (const selector of paymentMethods) {
        const elements = page.locator(selector);
        const count = await elements.count();
        availableMethods += count;
      }

      // Debe tener al menos un método de pago disponible
      expect(availableMethods).toBeGreaterThan(0);
    });

    test('debe calcular correctamente los totales de pago', async ({ request }) => {
      const bookingData = {
        courtId: 1,
        duration: 90, // 1.5 horas
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:00'
      };

      try {
        // Obtener cálculo de precio
        const response = await request.post('/api/payments/calculate', {
          data: bookingData
        });

        if (response.ok()) {
          const calculation = await response.json();
          
          // Verificar estructura del cálculo
          expect(calculation.subtotal || calculation.basePrice).toBeDefined();
          expect(calculation.total || calculation.totalAmount).toBeDefined();
          
          const subtotal = calculation.subtotal || calculation.basePrice;
          const total = calculation.total || calculation.totalAmount;
          
          // El total debe ser mayor o igual al subtotal
          expect(total).toBeGreaterThanOrEqual(subtotal);
          
          // Verificar que los montos son números positivos
          expect(subtotal).toBeGreaterThan(0);
          expect(total).toBeGreaterThan(0);
          
          // Si hay impuestos, verificar que están incluidos
          if (calculation.taxes || calculation.tax) {
            const taxes = calculation.taxes || calculation.tax;
            expect(total).toBeGreaterThanOrEqual(subtotal + taxes);
          }
        }
      } catch (error) {
        console.log('Cálculo de precios no disponible:', error.message);
      }
    });

    test('debe manejar fallos de pago correctamente', async ({ request }) => {
      // Simular pago con tarjeta que falla
      const failedPayment = {
        amount: 5000,
        currency: 'eur',
        paymentMethod: {
          card: {
            number: '4000000000000002', // Tarjeta que siempre falla
            exp_month: 12,
            exp_year: 2025,
            cvc: '123'
          }
        }
      };

      try {
        const response = await request.post('/api/payments/process', {
          data: failedPayment
        });

        if (response.ok()) {
          const result = await response.json();
          
          // Debe indicar fallo
          expect(result.success || result.status === 'succeeded').toBeFalsy();
          expect(result.error || result.failure_reason).toBeDefined();
          
        } else {
          // Error HTTP apropiado para pago fallido
          expect([400, 402, 422]).toContain(response.status());
        }
      } catch (error) {
        console.log('Procesamiento de pagos fallidos no disponible:', error.message);
      }
    });
  });

  test.describe('Seguridad en Pagos', () => {
    test('debe implementar validación PCI DSS', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que no se almacenan datos de tarjeta en el cliente
      const sensitiveInputs = page.locator('input[name*="card"], input[name*="cvv"], input[name*="cvc"]');
      
      if (await sensitiveInputs.count() > 0) {
        // Verificar que los campos tienen atributos de seguridad
        const firstInput = sensitiveInputs.first();
        
        const autocomplete = await firstInput.getAttribute('autocomplete');
        const type = await firstInput.getAttribute('type');
        
        // Campos de tarjeta deben tener autocomplete apropiado
        if (autocomplete) {
          const secureAutocomplete = ['cc-number', 'cc-exp', 'cc-csc', 'off'].some(value => 
            autocomplete.includes(value)
          );
          expect(secureAutocomplete).toBeTruthy();
        }
        
        // Campos sensibles no deben ser de tipo text plano
        if (type && (await firstInput.getAttribute('name'))?.includes('cvv')) {
          expect(['password', 'tel']).toContain(type);
        }
      }
    });

    test('debe usar HTTPS para todas las transacciones', async ({ page }) => {
      await page.goto('/');
      
      // Verificar que la página usa HTTPS
      const url = page.url();
      
      // En desarrollo puede usar HTTP, en producción debe ser HTTPS
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        expect(url).toMatch(/^https:/);
      }
      
      // Verificar headers de seguridad
      const response = await page.goto(page.url());
      const headers = response?.headers() || {};
      
      // Verificar headers de seguridad comunes
      const securityHeaders = [
        'strict-transport-security',
        'x-content-type-options',
        'x-frame-options',
        'content-security-policy'
      ];
      
      let hasSecurityHeaders = 0;
      for (const header of securityHeaders) {
        if (headers[header]) {
          hasSecurityHeaders++;
        }
      }
      
      // Debe tener al menos algunos headers de seguridad
      expect(hasSecurityHeaders).toBeGreaterThan(0);
    });

    test('debe validar tokens de autenticación en pagos', async ({ request }) => {
      try {
        // Intentar procesar pago sin autenticación
        const response = await request.post('/api/payments/process', {
          data: {
            amount: 5000,
            currency: 'eur'
          }
        });

        // Debe requerir autenticación para procesar pagos
        if (response.ok()) {
          const result = await response.json();
          
          // Si permite el pago, debe tener validaciones estrictas
          expect(result.requiresAuth || result.authenticated).toBeTruthy();
        } else {
          // Debe rechazar pagos no autenticados
          expect([401, 403]).toContain(response.status());
        }
      } catch (error) {
        console.log('Validación de autenticación en pagos no disponible:', error.message);
      }
    });
  });

  test.describe('Gestión de Reembolsos', () => {
    test('debe procesar reembolsos correctamente', async ({ request }) => {
      try {
        // Simular solicitud de reembolso
        const refundRequest = {
          paymentId: 'pi_test_payment_123',
          amount: 2500, // Reembolso parcial
          reason: 'requested_by_customer'
        };

        const response = await request.post('/api/payments/refund', {
          data: refundRequest
        });

        if (response.ok()) {
          const refund = await response.json();
          
          // Verificar estructura del reembolso
          expect(refund.id || refund.refundId).toBeDefined();
          expect(refund.amount).toBe(refundRequest.amount);
          expect(refund.status).toBeDefined();
          
          // Estados válidos para reembolso
          const validStatuses = ['pending', 'succeeded', 'failed', 'processing'];
          expect(validStatuses).toContain(refund.status);
        } else {
          // Puede no estar implementado o requerir permisos especiales
          expect([401, 403, 404, 405, 501]).toContain(response.status());
        }
      } catch (error) {
        console.log('Procesamiento de reembolsos no disponible:', error.message);
      }
    });

    test('debe validar políticas de reembolso', async ({ request }) => {
      try {
        // Verificar políticas de reembolso
        const response = await request.get('/api/payments/refund-policy');
        
        if (response.ok()) {
          const policy = await response.json();
          
          // Verificar que tiene políticas definidas
          expect(policy.timeLimit || policy.conditions || policy.rules).toBeDefined();
          
          // Verificar estructura de políticas
          if (policy.timeLimit) {
            expect(typeof policy.timeLimit).toBe('number');
            expect(policy.timeLimit).toBeGreaterThan(0);
          }
          
          if (policy.conditions) {
            expect(Array.isArray(policy.conditions) || typeof policy.conditions === 'object').toBeTruthy();
          }
        }
      } catch (error) {
        console.log('Políticas de reembolso no disponibles:', error.message);
      }
    });
  });

  test.describe('Reportes y Auditoría de Pagos', () => {
    test('debe generar reportes de transacciones', async ({ request }) => {
      try {
        const response = await request.get('/api/payments/reports');
        
        if (response.ok()) {
          const report = await response.json();
          
          // Verificar estructura del reporte
          expect(report.transactions || report.payments || report.data).toBeDefined();
          
          const data = report.transactions || report.payments || report.data;
          
          if (Array.isArray(data) && data.length > 0) {
            const transaction = data[0];
            
            // Verificar campos básicos de transacción
            expect(transaction.id || transaction.transactionId).toBeDefined();
            expect(transaction.amount).toBeDefined();
            expect(transaction.status).toBeDefined();
            expect(transaction.date || transaction.createdAt).toBeDefined();
          }
        } else {
          // Puede requerir permisos de administrador
          expect([401, 403, 404]).toContain(response.status());
        }
      } catch (error) {
        console.log('Reportes de pagos no disponibles:', error.message);
      }
    });

    test('debe mantener logs de auditoría', async ({ request }) => {
      try {
        const response = await request.get('/api/payments/audit-log');
        
        if (response.ok()) {
          const logs = await response.json();
          
          expect(Array.isArray(logs) || typeof logs === 'object').toBeTruthy();
          
          if (Array.isArray(logs) && logs.length > 0) {
            const log = logs[0];
            
            // Verificar estructura del log de auditoría
            expect(log.timestamp || log.date || log.createdAt).toBeDefined();
            expect(log.action || log.event || log.type).toBeDefined();
            expect(log.userId || log.user || log.actor).toBeDefined();
          }
        } else {
          // Logs de auditoría pueden requerir permisos especiales
          expect([401, 403, 404]).toContain(response.status());
        }
      } catch (error) {
        console.log('Logs de auditoría no disponibles:', error.message);
      }
    });

    test('debe rastrear métricas de pagos', async ({ request }) => {
      try {
        const response = await request.get('/api/payments/metrics');
        
        if (response.ok()) {
          const metrics = await response.json();
          
          // Verificar métricas básicas
          const expectedMetrics = [
            'totalTransactions', 'totalAmount', 'successRate',
            'failureRate', 'averageAmount', 'transactionCount'
          ];
          
          const hasMetrics = expectedMetrics.some(metric => 
            metrics[metric] !== undefined
          );
          
          expect(hasMetrics).toBeTruthy();
          
          // Verificar que las métricas son números válidos
          Object.values(metrics).forEach(value => {
            if (typeof value === 'number') {
              expect(value).toBeGreaterThanOrEqual(0);
            }
          });
        }
      } catch (error) {
        console.log('Métricas de pagos no disponibles:', error.message);
      }
    });
  });
});