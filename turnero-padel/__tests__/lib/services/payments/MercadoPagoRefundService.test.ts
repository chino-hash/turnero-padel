/**
 * Tests unitarios para MercadoPagoRefundService
 */

import { MercadoPagoRefundService } from '../../../../lib/services/payments/MercadoPagoRefundService';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Mock del SDK de MercadoPago
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Payment: jest.fn(),
}));

describe('MercadoPagoRefundService', () => {
  const mockAccessToken = 'TEST_ACCESS_TOKEN';
  let mockPaymentInstance: any;
  let mockPaymentGet: jest.Mock;
  let mockPaymentRefund: jest.Mock;

  beforeEach(() => {
    // Configurar variables de entorno
    process.env.MERCADOPAGO_ACCESS_TOKEN = mockAccessToken;

    // Mock de Payment.get
    mockPaymentGet = jest.fn();

    // Mock de Payment.refund
    mockPaymentRefund = jest.fn();

    // Mock de instancia de Payment
    mockPaymentInstance = {
      get: mockPaymentGet,
      refund: mockPaymentRefund,
    };

    // Mock del constructor de Payment
    (Payment as jest.Mock).mockImplementation(() => mockPaymentInstance);

    // Mock de MercadoPagoConfig
    (MercadoPagoConfig as jest.Mock).mockImplementation(() => ({}));

    // Silenciar console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  });

  describe('constructor', () => {
    it('debe inicializar correctamente con access token válido', () => {
      const service = new MercadoPagoRefundService();
      expect(MercadoPagoConfig).toHaveBeenCalledWith({
        accessToken: mockAccessToken,
        options: { timeout: 5000 },
      });
      expect(service).toBeInstanceOf(MercadoPagoRefundService);
    });

    it('debe lanzar error si no hay access token', () => {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;
      expect(() => new MercadoPagoRefundService()).toThrow('MERCADOPAGO_ACCESS_TOKEN no está configurado');
    });
  });

  describe('processRefund', () => {
    const mockParams = {
      bookingId: 'booking-123',
      paymentId: 'payment-123',
      amount: 50000, // 500.00 pesos en centavos
      externalPaymentId: '123456789',
      reason: 'Cancelación de reserva',
    };

    const createMockPayment = (overrides: any = {}) => ({
      id: 123456789,
      status: 'approved',
      transaction_amount: 500.0,
      date_approved: new Date().toISOString(),
      transaction_details: {
        total_paid_amount: 500.0,
        net_received_amount: 485.0,
      },
      refunds: [],
      ...overrides,
    });

    it('debe procesar reembolso exitosamente', async () => {
      const mockPayment = createMockPayment();
      const mockRefundResponse = {
        id: 'refund-123',
        status: 'approved',
      };

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockResolvedValue(mockRefundResponse);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(mockPaymentGet).toHaveBeenCalledWith({ id: mockParams.externalPaymentId });
      expect(mockPaymentRefund).toHaveBeenCalledWith({
        id: mockParams.externalPaymentId,
        body: {},
      });

      expect(result).toEqual({
        success: true,
        refundId: 'refund-123',
        status: 'COMPLETED',
      });
    });

    it('debe procesar reembolso parcial correctamente', async () => {
      const mockPayment = createMockPayment();
      const mockRefundResponse = {
        id: 'refund-123',
        status: 'approved',
      };

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockResolvedValue(mockRefundResponse);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund({
        ...mockParams,
        amount: 25000, // 250.00 pesos (reembolso parcial)
      });

      expect(mockPaymentRefund).toHaveBeenCalledWith({
        id: mockParams.externalPaymentId,
        body: { amount: 250.0 }, // Convertido a pesos
      });

      expect(result.success).toBe(true);
    });

    it('debe validar que el pago exista', async () => {
      mockPaymentGet.mockResolvedValue(null);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: `Pago no encontrado en Mercado Pago: ${mockParams.externalPaymentId}`,
      });
    });

    it('debe validar que el pago esté aprobado', async () => {
      const mockPayment = createMockPayment({ status: 'pending' });
      mockPaymentGet.mockResolvedValue(mockPayment);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: 'No se puede reembolsar un pago con estado: pending. Solo se pueden reembolsar pagos aprobados.',
      });
    });

    it('debe validar plazo de 180 días', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 181); // 181 días atrás

      const mockPayment = createMockPayment({
        date_approved: oldDate.toISOString(),
      });
      mockPaymentGet.mockResolvedValue(mockPayment);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('180 días');
    });

    it('debe permitir reembolsos dentro de 180 días', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 100); // 100 días atrás

      const mockPayment = createMockPayment({
        date_approved: recentDate.toISOString(),
      });
      const mockRefundResponse = {
        id: 'refund-123',
        status: 'approved',
      };

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockResolvedValue(mockRefundResponse);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result.success).toBe(true);
    });

    it('debe detectar pagos ya reembolsados completamente', async () => {
      const mockPayment = createMockPayment({
        refunds: [
          { id: 'refund-1', amount: 500.0 },
        ],
      });
      mockPaymentGet.mockResolvedValue(mockPayment);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('ya fue reembolsado completamente'),
      });
    });

    it('debe validar monto de reembolso parcial no exceda disponible', async () => {
      const mockPayment = createMockPayment({
        transaction_amount: 500.0,
        refunds: [
          { id: 'refund-1', amount: 300.0 }, // Ya reembolsado 300
        ],
      });
      mockPaymentGet.mockResolvedValue(mockPayment);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund({
        ...mockParams,
        amount: 25000, // Intentando reembolsar 250, pero solo quedan 200 disponibles
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('excede el disponible para reembolsar');
    });

    it('debe manejar error de saldo insuficiente', async () => {
      const mockPayment = createMockPayment();
      const apiError = new Error('Insufficient balance');

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockRejectedValue(apiError);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Saldo insuficiente'),
      });
    });

    it('debe manejar error de pago ya reembolsado', async () => {
      const mockPayment = createMockPayment();
      const apiError = new Error('Payment already refunded');

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockRejectedValue(apiError);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: 'El pago ya fue reembolsado previamente',
      });
    });

    it('debe manejar error de plazo expirado', async () => {
      const mockPayment = createMockPayment();
      const apiError = new Error('Refund expired 180 days');

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockRejectedValue(apiError);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('180 días'),
      });
    });

    it('debe manejar estados de reembolso pendientes', async () => {
      const mockPayment = createMockPayment();
      const mockRefundResponse = {
        id: 'refund-123',
        status: 'pending',
      };

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockResolvedValue(mockRefundResponse);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        status: 'PENDING',
        refundId: 'refund-123',
        error: expect.stringContaining('estado: pending'),
      });
    });

    it('debe manejar errores desconocidos', async () => {
      const mockPayment = createMockPayment();
      const apiError = new Error('Error desconocido');

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockRejectedValue(apiError);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: 'Error desconocido',
      });

      expect(console.error).toHaveBeenCalledWith(
        '[MercadoPagoRefundService] Error procesando reembolso:',
        apiError
      );
    });

    it('debe manejar respuesta sin ID de reembolso', async () => {
      const mockPayment = createMockPayment();
      const mockRefundResponse = {
        status: 'approved',
      };

      mockPaymentGet.mockResolvedValue(mockPayment);
      mockPaymentRefund.mockResolvedValue(mockRefundResponse);

      const service = new MercadoPagoRefundService();
      const result = await service.processRefund(mockParams);

      expect(result).toEqual({
        success: false,
        error: 'El reembolso se procesó pero no se recibió ID de confirmación',
      });
    });
  });
});








