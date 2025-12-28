import { NextRequest } from 'next/server'
import { auth } from './auth'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

type RateLimitResult = { success: boolean; limit: number; remaining: number; reset: Date }

const kvReady = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

const ipLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:ip', limiter: Ratelimit.slidingWindow(30, '1 m') })
  : null

const userLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:user', limiter: Ratelimit.slidingWindow(5, '1 m') })
  : null

const readIpLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:read:ip', limiter: Ratelimit.slidingWindow(60, '1 m') })
  : null

const readUserLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:read:user', limiter: Ratelimit.slidingWindow(20, '1 m') })
  : null

const updateIpLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:update:ip', limiter: Ratelimit.slidingWindow(15, '1 m') })
  : null

const updateUserLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:update:user', limiter: Ratelimit.slidingWindow(3, '1 m') })
  : null

const bulkLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:bulk', limiter: Ratelimit.slidingWindow(3, '1 m') })
  : null

async function limitWith(limiter: Ratelimit | null, identifier: string): Promise<RateLimitResult> {
  if (!limiter) return { success: true, limit: 0, remaining: 0, reset: new Date() }
  const r = await limiter.limit(identifier)
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: new Date(r.reset) }
}

async function limitIp(identifier: string): Promise<RateLimitResult> {
  const raw = identifier.startsWith('ip_') ? identifier.slice(3) : identifier
  return limitWith(ipLimiter, raw)
}

async function limitUser(identifier: string): Promise<RateLimitResult> {
  const raw = identifier.startsWith('user_') ? identifier.slice(5) : identifier
  return limitWith(userLimiter, raw)
}

export const rateLimitByIp = {
  limit: async (identifier: string): Promise<RateLimitResult> => limitIp(identifier)
}

export const rateLimitByUserId = {
  limit: async (identifier: string): Promise<RateLimitResult> => limitUser(identifier)
}

export const generalApiRateLimit = {
  limit: async (identifier: string): Promise<RateLimitResult> => {
    if (identifier.startsWith('user_')) return limitUser(identifier)
    return limitIp(identifier)
  }
}

export const bookingCreateRateLimit = generalApiRateLimit

export const bookingReadRateLimit = {
  limit: async (identifier: string): Promise<RateLimitResult> => {
    if (identifier.startsWith('user_')) {
      const raw = identifier.slice(5)
      return limitWith(readUserLimiter, raw)
    }
    const raw = identifier.startsWith('ip_') ? identifier.slice(3) : identifier
    return limitWith(readIpLimiter, raw)
  }
}

export const bookingUpdateRateLimit = {
  limit: async (identifier: string): Promise<RateLimitResult> => {
    if (identifier.startsWith('user_')) {
      const raw = identifier.slice(5)
      return limitWith(updateUserLimiter, raw)
    }
    const raw = identifier.startsWith('ip_') ? identifier.slice(3) : identifier
    return limitWith(updateIpLimiter, raw)
  }
}

export const bookingBulkRateLimit = {
  limit: async (identifier: string): Promise<RateLimitResult> => {
    const raw = identifier.startsWith('user_') ? identifier.slice(5) : identifier.startsWith('ip_') ? identifier.slice(3) : identifier
    return limitWith(bulkLimiter, raw)
  }
}

export const getUserIdentifier = async (request: NextRequest): Promise<string> => {
  try {
    const session = await auth()
    if (session?.user?.id) return `user_${session.user.id}`
  } catch {}
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `ip_${ip}`
}

export const applyRateLimit = async (
  limiter: { limit: (identifier: string) => Promise<RateLimitResult> },
  identifier: string
): Promise<RateLimitResult> => {
  const result = await limiter.limit(identifier)
  return result
}

export const withRateLimit = (
  limiter: { limit: (identifier: string) => Promise<RateLimitResult> },
  options: { keyGenerator?: (request: NextRequest) => Promise<string> } = {}
) => {
  return async (request: NextRequest) => {
    const identifier = options.keyGenerator ? await options.keyGenerator(request) : await getUserIdentifier(request)
    const result = await applyRateLimit(limiter, identifier)
    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'RATE_LIMIT_EXCEEDED', meta: { limit: result.limit, remaining: result.remaining, reset: result.reset.toISOString() } }),
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
      )
    }
    return null
  }
}

export type { RateLimitResult }