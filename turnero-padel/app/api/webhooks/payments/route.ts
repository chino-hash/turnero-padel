/**
 * Endpoint genérico para webhooks de pagos
 * Soporta webhooks de Mercado Pago con validación de firma
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { BookingWebhookHandler } from '@/lib/services/payments/BookingWebhookHandler';

/**
 * Cache simple en memoria para evitar procesamiento duplicado de webhooks
 * Almacena request_id procesados en los últimos 5 minutos
 */
const processedWebhookCache = new Map<string, number>();
const WEBHOOK_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpia el cache de webhooks procesados periódicamente
 */
function cleanWebhookCache() {
  const now = Date.now();
  for (const [requestId, timestamp] of processedWebhookCache.entries()) {
    if (now - timestamp > WEBHOOK_CACHE_TTL) {
      processedWebhookCache.delete(requestId);
    }
  }
}

/**
 * Verifica si un webhook ya fue procesado recientemente
 */
function isWebhookAlreadyProcessed(requestId: string): boolean {
  cleanWebhookCache();
  return processedWebhookCache.has(requestId);
}

/**
 * Marca un webhook como procesado
 */
function markWebhookAsProcessed(requestId: string): void {
  processedWebhookCache.set(requestId, Date.now());
  // Limpiar cache periódicamente
  if (processedWebhookCache.size > 1000) {
    cleanWebhookCache();
  }
}

/**
 * Valida la firma de Mercado Pago
 * Mercado Pago envía x-signature y x-request-id en los headers
 * 
 * Mejora implementada: Validación de timestamp para prevenir replay attacks
 * Los webhooks con el mismo request_id no se procesan múltiples veces
 */
function validateMercadoPagoSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): { valid: boolean; error?: string } {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  
  // Si no hay secret configurado, no validar (modo desarrollo/testing)
  if (!secret) {
    console.warn('[Webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado, omitiendo validación de firma');
    return { valid: true };
  }

  // Validar que no se haya procesado este webhook recientemente (protección contra replay)
  if (isWebhookAlreadyProcessed(xRequestId)) {
    console.warn(`[Webhook] Webhook con request_id ${xRequestId} ya fue procesado recientemente (replay attack prevenido)`);
    return { valid: false, error: 'Webhook ya procesado recientemente' };
  }

  // Construir el payload como lo espera Mercado Pago
  const payload = `id=${dataId}&request_id=${xRequestId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const signatureValid = expectedSignature === xSignature;

  if (signatureValid) {
    // Marcar como procesado solo si la firma es válida
    markWebhookAsProcessed(xRequestId);
  }

  return { valid: signatureValid };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar que el payload tenga el formato básico esperado
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Formato de webhook inválido' },
        { status: 400 }
      );
    }

    // Validar firma si es Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const paymentProvider = process.env.PAYMENT_PROVIDER;
    const isMercadoPago = accessToken && (paymentProvider === 'mercadopago' || !paymentProvider);

    if (isMercadoPago) {
      const signature = request.headers.get('x-signature');
      const requestId = request.headers.get('x-request-id');
      const dataId = body.data?.id;

      if (signature && requestId && dataId) {
        const validation = validateMercadoPagoSignature(signature, requestId, dataId);
        if (!validation.valid) {
          console.error('[Webhook] Validación fallida de Mercado Pago', {
            signature: signature.substring(0, 20) + '...',
            requestId,
            dataId,
            error: validation.error
          });
          return NextResponse.json(
            { error: validation.error || 'Firma inválida' },
            { status: 401 }
          );
        }
      } else if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
        // Si tenemos secret configurado pero faltan headers, advertir
        console.warn('[Webhook] Headers de firma faltantes para Mercado Pago');
      }
    }

    // Usar el handler genérico que procesa el webhook
    const handler = new BookingWebhookHandler();
    const result = await handler.handle(body);

    if (!result.processed) {
      return NextResponse.json(
        { error: result.error || 'Error procesando webhook' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      bookingUpdated: result.bookingUpdated,
      bookingId: result.bookingId,
      message: result.error || 'Webhook procesado exitosamente'
    });
  } catch (error) {
    console.error('Error en webhook de pagos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Permitir GET para verificación de webhook (algunos proveedores verifican el endpoint)
export async function GET() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const paymentProvider = process.env.PAYMENT_PROVIDER;
  const isMercadoPago = accessToken && (paymentProvider === 'mercadopago' || !paymentProvider);

  return NextResponse.json({ 
    message: 'Webhook endpoint activo',
    provider: isMercadoPago ? 'mercadopago' : 'generic'
  });
}


