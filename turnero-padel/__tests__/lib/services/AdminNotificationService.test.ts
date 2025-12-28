/**
 * Tests unitarios para AdminNotificationService
 */

import {
  createNotification,
  notifyPaymentConflict,
  getUnreadNotifications,
  markAsRead,
  getAllNotifications,
} from '../../../lib/services/AdminNotificationService';
import { prisma } from '../../../lib/database/neon-config';
import { getNotificationConfig } from '../../../lib/config/env';

// Mock Prisma
jest.mock('../../../lib/database/neon-config', () => ({
  prisma: {
    adminNotification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock config
jest.mock('../../../lib/config/env', () => ({
  getNotificationConfig: jest.fn(),
}));

// Mock admin-system
jest.mock('../../../lib/admin-system', () => ({
  getAllAdmins: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetNotificationConfig = getNotificationConfig as jest.MockedFunction<typeof getNotificationConfig>;

describe('AdminNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Configuración por defecto
    mockGetNotificationConfig.mockReturnValue({
      slack: {
        enabled: false,
        webhookUrl: undefined,
      },
      email: {
        enabled: false,
      },
      github: {
        enabled: false,
      },
      sentry: {
        enabled: false,
        dsn: undefined,
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createNotification', () => {
    it('debe crear notificación exitosamente', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'PAYMENT_CONFLICT',
        severity: 'error',
        title: 'Test Notification',
        message: 'Test message',
        metadata: null,
        read: false,
        readAt: null,
        readBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.adminNotification.create.mockResolvedValue(mockNotification);

      const result = await createNotification({
        type: 'PAYMENT_CONFLICT',
        severity: 'error',
        title: 'Test Notification',
        message: 'Test message',
      });

      expect(mockPrisma.adminNotification.create).toHaveBeenCalledWith({
        data: {
          type: 'PAYMENT_CONFLICT',
          severity: 'error',
          title: 'Test Notification',
          message: 'Test message',
          metadata: null,
        },
      });

      expect(result).toEqual({
        success: true,
        notificationId: 'notif-123',
      });
    });

    it('debe usar severity por defecto "info" si no se proporciona', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'SYSTEM_ERROR',
        severity: 'info',
        title: 'Test Notification',
        message: 'Test message',
        metadata: null,
        read: false,
        readAt: null,
        readBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.adminNotification.create.mockResolvedValue(mockNotification);

      await createNotification({
        type: 'SYSTEM_ERROR',
        title: 'Test Notification',
        message: 'Test message',
      });

      expect(mockPrisma.adminNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'info',
        }),
      });
    });

    it('debe incluir metadata si se proporciona', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'PAYMENT_CONFLICT',
        severity: 'error',
        title: 'Test Notification',
        message: 'Test message',
        metadata: { bookingId: 'booking-123' },
        read: false,
        readAt: null,
        readBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.adminNotification.create.mockResolvedValue(mockNotification);

      await createNotification({
        type: 'PAYMENT_CONFLICT',
        title: 'Test Notification',
        message: 'Test message',
        metadata: { bookingId: 'booking-123' },
      });

      expect(mockPrisma.adminNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { bookingId: 'booking-123' },
        }),
      });
    });

    it('debe manejar errores al crear notificación', async () => {
      const error = new Error('Database error');
      mockPrisma.adminNotification.create.mockRejectedValue(error);

      const result = await createNotification({
        type: 'SYSTEM_ERROR',
        title: 'Test Notification',
        message: 'Test message',
      });

      expect(result).toEqual({
        success: false,
        error: 'Database error',
      });

      expect(console.error).toHaveBeenCalledWith(
        '[AdminNotificationService] Error creando notificación:',
        error
      );
    });

    it('debe enviar notificación a Slack si está configurado', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'PAYMENT_CONFLICT',
        severity: 'error',
        title: 'Test Notification',
        message: 'Test message',
        metadata: null,
        read: false,
        readAt: null,
        readBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetNotificationConfig.mockReturnValue({
        slack: {
          enabled: true,
          webhookUrl: 'https://hooks.slack.com/services/test',
        },
        email: { enabled: false },
        github: { enabled: false },
        sentry: { enabled: false, dsn: undefined },
      });

      mockPrisma.adminNotification.create.mockResolvedValue(mockNotification);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await createNotification({
        type: 'PAYMENT_CONFLICT',
        severity: 'error',
        title: 'Test Notification',
        message: 'Test message',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Test Notification'),
        })
      );
    });
  });

  describe('notifyPaymentConflict', () => {
    it('debe crear notificación de conflicto de pago con éxito', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'PAYMENT_CONFLICT',
        severity: 'error',
        title: 'Conflicto de Pago - Reembolso Requerido',
        message: expect.any(String),
        metadata: expect.any(Object),
        read: false,
        readAt: null,
        readBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.adminNotification.create.mockResolvedValue(mockNotification);

      const result = await notifyPaymentConflict({
        bookingId: 'booking-123',
        paymentId: 'payment-123',
        conflictingBookingId: 'conflicting-123',
        refundStatus: 'success',
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.adminNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'PAYMENT_CONFLICT',
          severity: 'error',
          title: 'Conflicto de Pago - Reembolso Requerido',
          metadata: expect.objectContaining({
            bookingId: 'booking-123',
            paymentId: 'payment-123',
            conflictingBookingId: 'conflicting-123',
            refundStatus: 'success',
          }),
        }),
      });
    });

    it('debe usar severity "critical" si el reembolso falló', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'PAYMENT_CONFLICT',
        severity: 'critical',
        title: 'Conflicto de Pago - Reembolso Requerido',
        message: expect.any(String),
        metadata: expect.any(Object),
        read: false,
        readAt: null,
        readBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.adminNotification.create.mockResolvedValue(mockNotification);

      await notifyPaymentConflict({
        bookingId: 'booking-123',
        paymentId: 'payment-123',
        refundStatus: 'failed',
        refundError: 'Error al procesar reembolso',
      });

      expect(mockPrisma.adminNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'critical',
        }),
      });
    });

    it('debe incluir información de error de reembolso en el mensaje', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'PAYMENT_CONFLICT',
        severity: 'critical',
        title: 'Conflicto de Pago - Reembolso Requerido',
        message: expect.any(String),
        metadata: expect.any(Object),
        read: false,
        readAt: null,
        readBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.adminNotification.create.mockResolvedValue(mockNotification);

      await notifyPaymentConflict({
        bookingId: 'booking-123',
        paymentId: 'payment-123',
        refundStatus: 'failed',
        refundError: 'Saldo insuficiente',
      });

      const createCall = mockPrisma.adminNotification.create.mock.calls[0][0] as any;
      expect(createCall.data.message).toContain('ERROR:');
      expect(createCall.data.message).toContain('Saldo insuficiente');
    });
  });

  describe('getUnreadNotifications', () => {
    it('debe obtener notificaciones no leídas', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'PAYMENT_CONFLICT',
          severity: 'error',
          title: 'Test 1',
          message: 'Message 1',
          metadata: null,
          read: false,
          readAt: null,
          readBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'notif-2',
          type: 'SYSTEM_ERROR',
          severity: 'warning',
          title: 'Test 2',
          message: 'Message 2',
          metadata: null,
          read: false,
          readAt: null,
          readBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.adminNotification.findMany.mockResolvedValue(mockNotifications);

      const result = await getUnreadNotifications();

      expect(mockPrisma.adminNotification.findMany).toHaveBeenCalledWith({
        where: { read: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      expect(result).toEqual({
        success: true,
        data: mockNotifications,
      });
    });

    it('debe respetar el límite de notificaciones', async () => {
      mockPrisma.adminNotification.findMany.mockResolvedValue([]);

      await getUnreadNotifications(10);

      expect(mockPrisma.adminNotification.findMany).toHaveBeenCalledWith({
        where: { read: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('debe manejar errores al obtener notificaciones', async () => {
      const error = new Error('Database error');
      mockPrisma.adminNotification.findMany.mockRejectedValue(error);

      const result = await getUnreadNotifications();

      expect(result).toEqual({
        success: false,
        error: 'Database error',
        data: [],
      });
    });
  });

  describe('markAsRead', () => {
    it('debe marcar notificación como leída', async () => {
      const mockNotification = {
        id: 'notif-123',
        type: 'PAYMENT_CONFLICT',
        severity: 'error',
        title: 'Test',
        message: 'Message',
        metadata: null,
        read: true,
        readAt: new Date(),
        readBy: 'admin@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.adminNotification.update.mockResolvedValue(mockNotification);

      const result = await markAsRead('notif-123', 'admin@example.com');

      expect(mockPrisma.adminNotification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: {
          read: true,
          readAt: expect.any(Date),
          readBy: 'admin@example.com',
        },
      });

      expect(result).toEqual({
        success: true,
        notificationId: 'notif-123',
      });
    });

    it('debe manejar errores al marcar como leída', async () => {
      const error = new Error('Database error');
      mockPrisma.adminNotification.update.mockRejectedValue(error);

      const result = await markAsRead('notif-123', 'admin@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Database error',
      });
    });
  });

  describe('getAllNotifications', () => {
    it('debe obtener todas las notificaciones con paginación', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'PAYMENT_CONFLICT',
          severity: 'error',
          title: 'Test',
          message: 'Message',
          metadata: null,
          read: false,
          readAt: null,
          readBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.adminNotification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.adminNotification.count.mockResolvedValue(1);

      const result = await getAllNotifications({ page: 1, limit: 10 });

      expect(mockPrisma.adminNotification.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        success: true,
        data: mockNotifications,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('debe filtrar por tipo si se proporciona', async () => {
      mockPrisma.adminNotification.findMany.mockResolvedValue([]);
      mockPrisma.adminNotification.count.mockResolvedValue(0);

      await getAllNotifications({ type: 'PAYMENT_CONFLICT' });

      expect(mockPrisma.adminNotification.findMany).toHaveBeenCalledWith({
        where: { type: 'PAYMENT_CONFLICT' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });

    it('debe filtrar por read si se proporciona', async () => {
      mockPrisma.adminNotification.findMany.mockResolvedValue([]);
      mockPrisma.adminNotification.count.mockResolvedValue(0);

      await getAllNotifications({ read: false });

      expect(mockPrisma.adminNotification.findMany).toHaveBeenCalledWith({
        where: { read: false },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });
  });
});





