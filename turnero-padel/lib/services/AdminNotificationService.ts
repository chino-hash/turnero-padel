/**
 * Servicio de Notificaciones para Administradores
 * Gestiona notificaciones críticas del sistema para administradores
 */

import { prisma } from '../database/neon-config';
import { getNotificationConfig } from '../config/env';

export interface CreateNotificationParams {
  type: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Crea una notificación para administradores
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<NotificationResult> {
  try {
    const notification = await prisma.adminNotification.create({
      data: {
        type: params.type,
        severity: params.severity || 'info',
        title: params.title,
        message: params.message,
        metadata: params.metadata ?? undefined,
      },
    });

    // Enviar a canales externos si están configurados
    await sendNotificationChannels(params);

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error) {
    console.error('[AdminNotificationService] Error creando notificación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Notifica sobre un conflicto de pago (PAYMENT_CONFLICT)
 */
export async function notifyPaymentConflict(params: {
  bookingId: string;
  paymentId: string | number;
  conflictingBookingId?: string;
  refundStatus?: 'success' | 'failed' | 'pending';
  refundError?: string;
}): Promise<NotificationResult> {
  const severity = params.refundStatus === 'failed' ? 'critical' : 'error';

  const title = 'Conflicto de Pago - Reembolso Requerido';
  const message = `Se recibió un pago tardío para la reserva ${params.bookingId}, pero la cancha ya está ocupada. ${
    params.refundStatus === 'success'
      ? 'El reembolso se procesó automáticamente.'
      : params.refundStatus === 'failed'
      ? `ERROR: No se pudo procesar el reembolso. ${params.refundError || ''}`
      : 'El reembolso está pendiente.'
  }${params.conflictingBookingId ? ` Conflicto con reserva ${params.conflictingBookingId}.` : ''}`;

  return createNotification({
    type: 'PAYMENT_CONFLICT',
    severity,
    title,
    message,
    metadata: {
      bookingId: params.bookingId,
      paymentId: params.paymentId.toString(),
      conflictingBookingId: params.conflictingBookingId,
      refundStatus: params.refundStatus,
      refundError: params.refundError,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Envía notificaciones a canales externos (Slack, Email) si están configurados
 */
async function sendNotificationChannels(params: CreateNotificationParams): Promise<void> {
  const config = getNotificationConfig();

  // Enviar a Slack si está configurado
  if (config.slack.enabled && config.slack.webhookUrl) {
    try {
      await sendSlackNotification(params, config.slack.webhookUrl);
    } catch (error) {
      console.error('[AdminNotificationService] Error enviando notificación a Slack:', error);
      // No fallar si Slack falla, solo loggear
    }
  }

  // Enviar por email si está configurado
  if (config.email.enabled) {
    try {
      // TODO: Implementar envío de email cuando se configure el servicio de email
      // Por ahora solo loggeamos
      console.log('[AdminNotificationService] Email notifications configurado pero no implementado aún');
    } catch (error) {
      console.error('[AdminNotificationService] Error enviando notificación por email:', error);
    }
  }
}

/**
 * Envía notificación a Slack
 */
async function sendSlackNotification(
  params: CreateNotificationParams,
  webhookUrl: string
): Promise<void> {
  const severityEmoji = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  const severityColor = {
    info: '#36a64f', // verde
    warning: '#ff9900', // naranja
    error: '#ff0000', // rojo
    critical: '#8b0000', // rojo oscuro
  };

  const emoji = severityEmoji[params.severity || 'info'];
  const color = severityColor[params.severity || 'info'];

  const payload = {
    text: `${emoji} ${params.title}`,
    attachments: [
      {
        color,
        title: params.title,
        text: params.message,
        fields: params.metadata
          ? Object.entries(params.metadata).map(([key, value]) => ({
              title: key,
              value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
              short: true,
            }))
          : [],
        footer: 'Turnero de Padel',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook responded with status ${response.status}`);
  }
}

/**
 * Obtiene notificaciones no leídas
 */
export async function getUnreadNotifications(limit: number = 50) {
  try {
    const notifications = await prisma.adminNotification.findMany({
      where: {
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    console.error('[AdminNotificationService] Error obteniendo notificaciones:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
    };
  }
}

/**
 * Marca una notificación como leída
 */
export async function markAsRead(
  notificationId: string,
  readBy: string
): Promise<NotificationResult> {
  try {
    await prisma.adminNotification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
        readBy,
      },
    });

    return {
      success: true,
      notificationId,
    };
  } catch (error) {
    console.error('[AdminNotificationService] Error marcando notificación como leída:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene todas las notificaciones (leídas y no leídas) con paginación
 */
export async function getAllNotifications(params: {
  page?: number;
  limit?: number;
  type?: string;
  severity?: string;
  read?: boolean;
}) {
  try {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.severity) where.severity = params.severity;
    if (params.read !== undefined) where.read = params.read;

    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.adminNotification.count({ where }),
    ]);

    return {
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[AdminNotificationService] Error obteniendo notificaciones:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

