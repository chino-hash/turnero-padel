import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Implementación simple de rate limiting en memoria para desarrollo
// En producción se debería usar Redis o similar
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Función helper para limpiar entradas expiradas
function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Función para verificar rate limit
function checkRateLimit(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  cleanExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Nueva ventana de tiempo
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true, remaining: limit - 1 };
  }
  
  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }
  
  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

// Rate limiters para diferentes operaciones
export const bookingCreateRateLimit = {
  limit: async (identifier: string) => {
    const result = checkRateLimit(`booking:${identifier}`, 5, 60000); // 5 requests per minute
    return result;
  }
};

export const bookingUpdateRateLimit = {
  limit: async (identifier: string) => {
    const result = checkRateLimit(`booking_update:${identifier}`, 10, 60000); // 10 requests per minute
    return result;
  }
};

export const bookingReadRateLimit = {
  limit: async (identifier: string) => {
    const result = checkRateLimit(`booking_read:${identifier}`, 60, 60000); // 60 requests per minute
    return result;
  }
};

export const bookingBulkRateLimit = {
  limit: async (identifier: string) => {
    const result = checkRateLimit(`booking_bulk:${identifier}`, 2, 60000); // 2 requests per minute for bulk operations
    return result;
  }
};

// Rate limiter general para APIs
export const generalApiRateLimit = {
  limit: async (identifier: string) => {
    const result = checkRateLimit(`general_api:${identifier}`, 100, 60000); // 100 requests per minute
    return result;
  }
};

// Función helper para obtener identificador único del usuario
export const getUserIdentifier = async (request: NextRequest): Promise<string> => {
  try {
    const session = await auth();
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
  rateLimit: { limit: (identifier: string) => Promise<{ success: boolean; remaining: number }> },
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> => {
  try {
    const result = await rateLimit.limit(identifier);
    return {
      success: result.success,
      limit: 100, // Valor por defecto
      remaining: result.remaining,
      reset: new Date(Date.now() + 60000) // 1 minuto desde ahora
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
  rateLimit: { limit: (identifier: string) => Promise<{ success: boolean; remaining: number }> },
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
export const getRateLimiter = (method: string, path: string) => {
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