import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { config as authOptions } from '@/lib/auth';

// Configurar Redis para rate limiting
// En desarrollo, usar memoria local; en producción, usar Upstash Redis
const redis = process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

// Rate limiters para diferentes operaciones
export const bookingCreateRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  analytics: true,
  prefix: 'booking_create',
});

export const bookingUpdateRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
  prefix: 'booking_update',
});

export const bookingReadRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
  analytics: true,
  prefix: 'booking_read',
});

export const bookingBulkRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(2, '1 m'), // 2 requests per minute for bulk operations
  analytics: true,
  prefix: 'booking_bulk',
});

// Rate limiter general para APIs
export const generalApiRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'api_general',
});

// Función helper para obtener identificador único del usuario
export const getUserIdentifier = async (request: NextRequest): Promise<string> => {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return `user_${session.user.id}`;
    }
  } catch (error) {
    console.warn('Error getting session for rate limiting:', error);
  }
  
  // Fallback a IP si no hay sesión
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return `ip_${ip}`;
};

// Función helper para aplicar rate limiting
export const applyRateLimit = async (
  rateLimit: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> => {
  try {
    const result = await rateLimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset)
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // En caso de error, permitir la request (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date()
    };
  }
};

// Middleware helper para rate limiting
export const withRateLimit = (
  rateLimit: Ratelimit,
  options: {
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (request: NextRequest) => Promise<string>;
  } = {}
) => {
  return async (request: NextRequest) => {
    const identifier = options.keyGenerator 
      ? await options.keyGenerator(request)
      : await getUserIdentifier(request);
    
    const result = await applyRateLimit(rateLimit, identifier);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
          error: 'RATE_LIMIT_EXCEEDED',
          meta: {
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset.toISOString()
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.getTime().toString(),
            'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    return null; // Continue with the request
  };
};

// Configuraciones específicas por endpoint
export const rateLimitConfigs = {
  'POST /api/bookings': bookingCreateRateLimit,
  'PUT /api/bookings': bookingUpdateRateLimit,
  'GET /api/bookings': bookingReadRateLimit,
  'PATCH /api/bookings/bulk': bookingBulkRateLimit,
  'DELETE /api/bookings': bookingUpdateRateLimit,
} as const;

// Función para obtener el rate limiter apropiado
export const getRateLimiter = (method: string, path: string): Ratelimit => {
  const key = `${method} ${path}` as keyof typeof rateLimitConfigs;
  return rateLimitConfigs[key] || generalApiRateLimit;
};

// Tipos
export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
};

export type RateLimitConfig = {
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => Promise<string>;
};