/**
 * Endpoint genérico para webhooks de pagos
 * Soporta webhooks de Mercado Pago con validación de firma (si hay secret configurado)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { BookingWebhookHandler } from '@/lib/services/payments/BookingWebhookHandler';
import { prisma } from '@/lib/database/neon-config';
import { getTenantMercadoPagoCredentials } from '@/lib/services/payments/tenant-credentials';

/**
 * Cache simple en memoria para evitar procesamiento duplicado de webhooks
 * Almacena request_id procesados en los últimos 5 minutos
 */
const processedWebhookCache = new Map<string, number>();
const WEBHOOK_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function cleanWebhookCache() {
  const now = Date.now();
  for (const [requestId, timestamp] of processedWebhookCache.entries()) {
    if (now - timestamp > WEBHOOK_CACHE_TTL) {
      processedWebhookCache.delete(requestId);
    }
  }
}

function isWebhookAlreadyProcessed(requestId: string): boolean {
  cleanWebhookCache();
  return processedWebhookCache.has(requestId);
}

function markWebhookAsProcessed(requestId: string): void {
  processedWebhookCache.set(requestId, Date.now());
  if (processedWebhookCache.size > 1000) {
    cleanWebhookCache();
  }
}

/**
 * Valida la firma de Mercado Pago.
 * Mercado Pago envía x-signature y x-request-id en los headers.
 */
function validateMercadoPagoSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  webhookSecret?: string
): { valid: boolean; error?: string } {
  const secret = webhookSecret || process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // Si no hay secret configurado, no validar (modo desarrollo/testing)
  if (!secret) {
    console.warn('[Webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado, omitiendo validación de firma');
    return { valid: true };
  }

  // Protección contra replay
  if (isWebhookAlreadyProcessed(xRequestId)) {
    console.warn(`[Webhook] Webhook con request_id ${xRequestId} ya fue procesado recientemente`);
    return { valid: false, error: 'Webhook ya procesado recientemente' };
  }

  const payload = `id=${dataId}&request_id=${xRequestId}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const signatureValid = expectedSignature === xSignature;

  if (signatureValid) {
    markWebhookAsProcessed(xRequestId);
  }

  return { valid: signatureValid };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Formato de webhook inválido' }, { status: 400 });
    }

    // Validar firma si tenemos headers y algún secret configurado (global o por tenant)
    const signature = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    const dataId = body.data?.id?.toString?.() || body.data?.id;

    if (signature && requestId && dataId) {
      let validation = validateMercadoPagoSignature(signature, requestId, String(dataId));
      let usedGlobalSecret = true;
      let tenantId: string | null = null;

      // Si falla, intentar secret por tenant (si podemos inferir bookingId)
      if (!validation.valid) {
        const bookingId: string | undefined = body.data?.external_reference;
        if (bookingId) {
          try {
            const booking = await prisma.booking.findUnique({
              where: { id: bookingId },
              select: { tenantId: true },
            });
            if (booking?.tenantId) {
              tenantId = booking.tenantId;
              const credentials = await getTenantMercadoPagoCredentials(tenantId);
              if (credentials.webhookSecret) {
                validation = validateMercadoPagoSignature(
                  signature,
                  requestId,
                  String(dataId),
                  credentials.webhookSecret
                );
                usedGlobalSecret = false;
              }
            }
          } catch (error) {
            console.warn('[Webhook] Error obteniendo secret del tenant para validar firma:', error);
          }
        }
      }

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Firma inválida' },
          { status: 401 }
        );
      } else {
        if (!usedGlobalSecret) {
          console.log(`[Webhook] Webhook validado con secret del tenant ${tenantId}`);
        }
      }
    } else if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      console.warn('[Webhook] Headers de firma faltantes para Mercado Pago');
    }

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
      message: result.error || 'Webhook procesado exitosamente',
    });
  } catch (error) {
    console.error('Error en webhook de pagos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint activo',
    provider: 'generic',
  });
}

