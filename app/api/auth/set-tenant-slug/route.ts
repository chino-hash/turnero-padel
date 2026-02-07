/**
 * Route Handler para establecer la cookie tenant-slug durante el flujo OAuth.
 * Las cookies solo pueden modificarse en Server Actions o Route Handlers (Next.js 15).
 */

import { getTenantBySlug } from '@/lib/services/tenants'
import { NextRequest, NextResponse } from 'next/server'

const TENANT_SLUG_COOKIE_NAME = 'tenant-slug'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantSlug = searchParams.get('tenantSlug')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  if (!tenantSlug) {
    return NextResponse.redirect(new URL('/login?error=missing-tenant', request.url))
  }

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) {
    return NextResponse.redirect(new URL('/?error=tenant-not-found', request.url))
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('callbackUrl', callbackUrl)
  loginUrl.searchParams.set('_cookieSet', '1') // Evita bucle de redirección

  const response = NextResponse.redirect(loginUrl)
  response.cookies.set(TENANT_SLUG_COOKIE_NAME, tenantSlug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutos
  })

  return response
}
