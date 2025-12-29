/**
 * Tests unitarios para MercadoPagoProvider
 */

import { MercadoPagoProvider } from '../../../../lib/services/payments/MercadoPagoProvider';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Mock del SDK de MercadoPago
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Preference: jest.fn(),
}));

describe('MercadoPagoProvider', () => {
  const mockAccessToken = 'TEST_ACCESS_TOKEN';
  let mockPreferenceInstance: any;
  let mockPreferenceCreate: jest.Mock;

  beforeEach(() => {
    // Configurar variables de entorno
    process.env.MERCADOPAGO_ACCESS_TOKEN = mockAccessToken;
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';

    // Mock de Preference.create
    mockPreferenceCreate = jest.fn();

    // Mock de instancia de Preference
    mockPreferenceInstance = {
      create: mockPreferenceCreate,
    };

    // Mock del constructor de Preference
    (Preference as jest.Mock).mockImplementation(() => mockPreferenceInstance);

    // Mock de MercadoPagoConfig
    (MercadoPagoConfig as jest.Mock).mockImplementation(() => ({}));

    // Silenciar console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('constructor', () => {
    it('debe inicializar correctamente con access token válido', () => {
      const provider = new MercadoPagoProvider();
      expect(MercadoPagoConfig).toHaveBeenCalledWith({
        accessToken: mockAccessToken,
        options: { timeout: 5000 },
      });
      expect(provider).toBeInstanceOf(MercadoPagoProvider);
    });

    it('debe lanzar error si no hay access token', () => {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;
      expect(() => new MercadoPagoProvider()).toThrow('MERCADOPAGO_ACCESS_TOKEN no está configurado');
    });
  });

  describe('createPreference', () => {
    const mockParams = {
      bookingId: 'booking-123',
      title: 'Reserva Cancha 1',
      description: 'Reserva para 2024-06-15 10:00-11:30',
      amount: 50000, // 500.00 pesos en centavos
      expiresAt: new Date('2024-06-15T12:00:00Z'),
      userId: 'user-123',
    };

    it('debe crear preferencia exitosamente', async () => {
      const mockResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const provider = new MercadoPagoProvider();
      const result = await provider.createPreference(mockParams);

      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: {
          items: [
            {
              id: mockParams.bookingId,
              title: mockParams.title,
              description: mockParams.description,
              quantity: 1,
              unit_price: 500.0, // Convertido de centavos a pesos
              currency_id: 'ARS',
            },
          ],
          external_reference: mockParams.bookingId,
          notification_url: 'https://test.example.com/api/webhooks/payments',
          expires: true,
          expiration_date_to: mockParams.expiresAt.toISOString(),
          back_urls: {
            success: 'https://test.example.com/bookings?status=success',
            failure: 'https://test.example.com/bookings?status=failure',
            pending: 'https://test.example.com/bookings?status=pending',
          },
          auto_return: 'approved',
        },
      });

      expect(result).toEqual({
        preferenceId: 'pref-123456',
        initPoint: mockResponse.init_point,
        sandboxInitPoint: mockResponse.sandbox_init_point,
      });
    });

    it('debe convertir correctamente centavos a pesos', async () => {
      const mockResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const provider = new MercadoPagoProvider();
      const paramsWithAmount = { ...mockParams, amount: 12345 }; // 123.45 pesos

      await provider.createPreference(paramsWithAmount);

      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          items: [
            expect.objectContaining({
              unit_price: 123.45, // Convertido correctamente
            }),
          ],
        }),
      });
    });

    it('debe usar backUrls personalizadas si se proporcionan', async () => {
      const mockResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const provider = new MercadoPagoProvider();
      const customBackUrls = {
        success: 'https://custom.example.com/success',
        failure: 'https://custom.example.com/failure',
        pending: 'https://custom.example.com/pending',
      };

      await provider.createPreference({
        ...mockParams,
        backUrls: customBackUrls,
      });

      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          back_urls: customBackUrls,
        }),
      });
    });

    it('debe usar URL por defecto si NEXT_PUBLIC_APP_URL no está configurado', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXTAUTH_URL = 'https://fallback.example.com';

      const mockResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const provider = new MercadoPagoProvider();
      await provider.createPreference(mockParams);

      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          notification_url: 'https://fallback.example.com/api/webhooks/payments',
        }),
      });
    });

    it('debe usar localhost como fallback final', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXTAUTH_URL;

      const mockResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const provider = new MercadoPagoProvider();
      await provider.createPreference(mockParams);

      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          notification_url: 'http://localhost:3000/api/webhooks/payments',
        }),
      });
    });

    it('debe lanzar error si la respuesta no tiene id', async () => {
      const mockResponse = {
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const provider = new MercadoPagoProvider();

      await expect(provider.createPreference(mockParams)).rejects.toThrow(
        'Respuesta inválida de Mercado Pago: falta id o init_point'
      );
    });

    it('debe lanzar error si la respuesta no tiene init_point', async () => {
      const mockResponse = {
        id: 'pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const provider = new MercadoPagoProvider();

      await expect(provider.createPreference(mockParams)).rejects.toThrow(
        'Respuesta inválida de Mercado Pago: falta id o init_point'
      );
    });

    it('debe manejar errores de la API de MercadoPago', async () => {
      const apiError = new Error('Error de conexión con Mercado Pago');
      mockPreferenceCreate.mockRejectedValue(apiError);

      const provider = new MercadoPagoProvider();

      await expect(provider.createPreference(mockParams)).rejects.toThrow(
        'Error creando preferencia de pago: Error de conexión con Mercado Pago'
      );

      expect(console.error).toHaveBeenCalledWith(
        '[MercadoPagoProvider] Error creando preferencia:',
        apiError
      );
    });

    it('debe manejar errores desconocidos', async () => {
      mockPreferenceCreate.mockRejectedValue('Error desconocido');

      const provider = new MercadoPagoProvider();

      await expect(provider.createPreference(mockParams)).rejects.toThrow(
        'Error creando preferencia de pago: Error desconocido'
      );
    });
  });
});






