/**
 * Servicio liviano de notificaciones para administradores.
 *
 * En la app raíz no existe el modelo `AdminNotification` en Prisma, así que por ahora
 * este servicio hace logging (y queda listo para ser extendido con Slack/Email si se desea).
 */

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export async function notifyPaymentConflict(params: {
  bookingId: string;
  paymentId: string | number;
  conflictingBookingId?: string;
  refundStatus?: 'success' | 'failed' | 'pending';
  refundError?: string;
}): Promise<NotificationResult> {
  const severity = params.refundStatus === 'failed' ? 'critical' : 'error';

  console.error('[AdminNotification] PAYMENT_CONFLICT', {
    severity,
    bookingId: params.bookingId,
    paymentId: params.paymentId,
    conflictingBookingId: params.conflictingBookingId,
    refundStatus: params.refundStatus,
    refundError: params.refundError,
    timestamp: new Date().toISOString(),
  });

  return { success: true };
}

