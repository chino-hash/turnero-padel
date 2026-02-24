/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */

import { auth } from "./lib/auth-middleware"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const user = req.auth?.user
  const isAdmin = user?.isAdmin || false
  const isSuperAdmin = user?.isSuperAdmin || false
  const userTenantId = user?.tenantId || null

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/', '/login', '/auth/error', '/test', '/demo', '/test/slots']
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  
  // Rutas de club (públicas, no requieren autenticación)
  const isClubRoute = nextUrl.pathname.startsWith('/club/')

  // Rutas de API de autenticación
  const isAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  
  // Rutas de API públicas (que no requieren autenticación)
  const publicApiRoutes = [
    '/api/courts',
    '/api/slots',
    '/api/tenants/public',
    '/api/webhooks/payments',
    '/api/system-settings/public',
    '/api/debug-env'
  ]
  const isPublicApiRoute = publicApiRoutes.some(route => nextUrl.pathname.startsWith(route))

  // Rutas de API que requieren autenticación pero deben pasar sin redirección (el endpoint maneja 401)
  const protectedApiRoutes = ['/api/events']
  const isProtectedApiRoute = protectedApiRoutes.some(route => nextUrl.pathname.startsWith(route))

  // Permitir rutas de autenticación, APIs públicas y APIs protegidas (sin redirección)
  if (isAuthRoute || isPublicApiRoute || isProtectedApiRoute) {
    return NextResponse.next()
  }

  // Prevenir bucles de redirección: si ya está en login o error, no redirigir
  if (nextUrl.pathname === '/login' || nextUrl.pathname === '/auth/error') {
    return NextResponse.next()
  }

  // Si no está logueado y no es ruta pública ni ruta de club, redirigir a login
  if (!isLoggedIn && !isPublicRoute && !isClubRoute) {
    // Solo agregar callbackUrl si no es la página principal para evitar bucles
    const loginUrl = new URL('/login', nextUrl)
    if (nextUrl.pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Si está logueado y trata de acceder a login, redirigir según callbackUrl
  if (isLoggedIn && nextUrl.pathname === '/login') {
    const callbackUrl = nextUrl.searchParams.get('callbackUrl')
    // Evitar redirección a la página principal para prevenir bucles
    const redirectUrl = callbackUrl && callbackUrl !== '/login' && callbackUrl !== '/' ? callbackUrl : '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, nextUrl))
  }

  // Si el usuario está logueado pero no tiene tenantId y trata de acceder al dashboard
  // (y no viene de un club), redirigir a la landing page para que seleccione un club
  if (isLoggedIn && !userTenantId && !isSuperAdmin && nextUrl.pathname === '/dashboard') {
    // Verificar si viene tenantSlug en la URL (significa que viene de un club)
    const tenantSlug = nextUrl.searchParams.get('tenantSlug')
    if (!tenantSlug) {
      // No viene de un club, redirigir a landing page
      return NextResponse.redirect(new URL('/', nextUrl))
    }
    // Si viene tenantSlug, dejar que continúe (el callback jwt lo procesará)
  }

  // Rutas de super admin (solo SUPER_ADMIN puede acceder)
  const superAdminRoutes = ['/super-admin']
  const isSuperAdminRoute = superAdminRoutes.some(route => nextUrl.pathname.startsWith(route))

  if (isSuperAdminRoute) {
    if (!isSuperAdmin) {
      const errorUrl = new URL('/auth/error', nextUrl)
      errorUrl.searchParams.set('error', 'AccessDenied')
      return NextResponse.redirect(errorUrl)
    }
    // Super admin puede acceder, agregar header con tenant-id si es necesario
    const response = NextResponse.next()
    if (userTenantId) {
      response.headers.set('x-tenant-id', userTenantId)
    }
    return response
  }

  // Rutas de administrador (compatibilidad con rutas antiguas)
  const adminRoutes = ['/admin', '/admin-panel']
  const isAdminRoute = adminRoutes.some(route => nextUrl.pathname.startsWith(route))

  // Si trata de acceder a ruta de admin sin ser admin, redirigir con error
  if (isAdminRoute && !isAdmin && !isSuperAdmin) {
    const errorUrl = new URL('/auth/error', nextUrl)
    errorUrl.searchParams.set('error', 'AccessDenied')
    return NextResponse.redirect(errorUrl)
  }

  // NOTA: La validación de tenant slug se hace en las rutas API/handlers, no aquí
  // porque el middleware se ejecuta en edge runtime donde Prisma no está disponible.
  // Las rutas individuales validarán el tenant usando las funciones de lib/tenant/context

  // Agregar header x-tenant-id si el usuario tiene tenantId
  const response = NextResponse.next()
  if (userTenantId) {
    response.headers.set('x-tenant-id', userTenantId)
  }
  
  // Extraer tenant slug del path si existe y agregarlo como header para uso en las rutas
  const pathParts = nextUrl.pathname.split('/').filter(Boolean)
  const reservedPaths = ['api', 'auth', 'login', 'dashboard', 'admin', 'admin-panel', 'super-admin', '_next', 'favicon.ico', 'test', 'demo']
  
  if (pathParts.length > 0 && !reservedPaths.includes(pathParts[0].toLowerCase())) {
    response.headers.set('x-tenant-slug', pathParts[0])
  }
  
  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
