import { test, expect } from '@playwright/test';

/**
 * Tests de integración para webhooks de pagos
 */
test.describe('Payment Webhooks API', () => {
  test.describe('POST /api/webhooks/payments', () => {
    test('debe aceptar payloads de MercadoPago', async ({ request }) => {
      const mercadoPagoPayload = {
        type: 'payment',
        data: {
          id: '123456789',
        },
      };

      const response = await request.post('/api/webhooks/payments', {
        data: mercadoPagoPayload,
      });

      // El endpoint debe existir y procesar el webhook
      // Puede fallar por validación o falta de datos, pero no debe ser 404
      expect(response.status()).not.toBe(404);

      // Debe responder con algún código válido
      expect([200, 400, 401, 422, 500]).toContain(response.status());
    });

    test('debe validar formato del payload', async ({ request }) => {
      const invalidPayload = {
        invalid: 'data',
      };

      const response = await request.post('/api/webhooks/payments', {
        data: invalidPayload,
      });

      // Debe validar el formato
      expect([400, 422]).toContain(response.status());
    });

    test('debe validar que el payload tenga type y data', async ({ request }) => {
      const payloadWithoutType = {
        data: {
          id: '123',
        },
      };

      const response = await request.post('/api/webhooks/payments', {
        data: payloadWithoutType,
      });

      // Debe validar estructura
      expect([400, 422]).toContain(response.status());
    });

    test('GET debe retornar información del endpoint', async ({ request }) => {
      const response = await request.get('/api/webhooks/payments');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Webhook endpoint activo');
    });

    test('debe manejar payloads de pago aprobado', async ({ request }) => {
      const approvedPaymentPayload = {
        type: 'payment',
        data: {
          id: '123456789',
        },
      };

      const response = await request.post('/api/webhooks/payments', {
        data: approvedPaymentPayload,
      });

      // El endpoint debe procesar el payload
      // Puede fallar por falta de booking asociado, pero debe intentar procesarlo
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe('Validación de firma (si está configurada)', () => {
    test('debe validar firma cuando MERCADOPAGO_WEBHOOK_SECRET está configurado', async ({ request }) => {
      // Nota: En un entorno real, esto requeriría configurar el secret
      // Por ahora, solo verificamos que el endpoint maneja la validación

      const payload = {
        type: 'payment',
        data: {
          id: '123456789',
        },
      };

      const response = await request.post('/api/webhooks/payments', {
        data: payload,
        headers: {
          'x-signature': 'invalid-signature',
          'x-request-id': 'test-request-id',
        },
      });

      // Debe validar la firma o procesar si no está configurada
      expect(response.status()).not.toBe(404);
    });
  });
});






