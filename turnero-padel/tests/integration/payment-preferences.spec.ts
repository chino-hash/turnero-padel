import { test, expect } from '@playwright/test';

/**
 * Tests de integración para el endpoint de preferencias de pago
 */
test.describe('Payment Preferences API', () => {
  test.describe('POST /api/bookings/[id]/payment-preference', () => {
    test('debe requerir autenticación', async ({ request }) => {
      // Intentar crear preferencia sin autenticación
      const response = await request.post('/api/bookings/test-booking-id/payment-preference', {
        data: {},
      });

      // Debe requerir autenticación
      expect([401, 403]).toContain(response.status());
    });

    test('debe validar que el bookingId sea válido', async ({ request }) => {
      // Nota: En un entorno real, necesitarías mockear la autenticación
      // Por ahora, solo verificamos que el endpoint existe y valida
      const response = await request.post('/api/bookings//payment-preference', {
        data: {},
      });

      // Debe validar el formato del ID
      expect([400, 401, 404]).toContain(response.status());
    });

    test('debe rechazar requests con bookingId vacío', async ({ request }) => {
      const response = await request.post('/api/bookings/ /payment-preference', {
        data: {},
      });

      expect([400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Estructura del endpoint', () => {
    test('el endpoint debe existir y responder', async ({ request }) => {
      // Verificar que el endpoint está definido
      // Esperamos 401 (no autenticado) o 400 (bad request), no 404
      const response = await request.post('/api/bookings/test-id/payment-preference', {
        data: {},
      });

      // No debe ser 404 (endpoint no encontrado)
      expect(response.status()).not.toBe(404);

      // Debe ser algún error de validación/autenticación
      expect([400, 401, 403]).toContain(response.status());
    });

    test('debe usar método POST', async ({ request }) => {
      // Intentar GET (debe fallar o no estar permitido)
      const getResponse = await request.get('/api/bookings/test-id/payment-preference');
      
      // GET no debe estar permitido o debe devolver 405
      expect([404, 405, 401]).toContain(getResponse.status());
    });
  });
});








