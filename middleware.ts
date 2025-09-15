/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */

import { auth } from "./lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.isAdmin || false

  console.log(`🔍 Middleware: ${nextUrl.pathname} | Logged: ${isLoggedIn} | Admin: ${isAdmin}`)

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/auth/error', '/test']
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)

  // Rutas de API de autenticación
  const isAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  
  // Rutas de API públicas (que no requieren autenticación)
  const publicApiRoutes = ['/api/courts', '/api/slots']
  const isPublicApiRoute = publicApiRoutes.some(route => nextUrl.pathname.startsWith(route))

  // Permitir rutas de autenticación y APIs públicas
  if (isAuthRoute || isPublicApiRoute) {
    console.log(`✅ Permitiendo ruta de API: ${nextUrl.pathname}`)
    return NextResponse.next()
  }

  // Prevenir bucles de redirección: si ya está en login o error, no redirigir
  if (nextUrl.pathname === '/login' || nextUrl.pathname === '/auth/error') {
    console.log(`✅ Permitiendo ruta pública: ${nextUrl.pathname}`)
    return NextResponse.next()
  }

  // Si no está logueado y no es ruta pública, redirigir a login
  if (!isLoggedIn && !isPublicRoute) {
    console.log(`🔄 Redirigiendo a login desde: ${nextUrl.pathname}`)
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
    console.log(`🔄 Usuario logueado redirigiendo de login a: ${redirectUrl}`)
    return NextResponse.redirect(new URL(redirectUrl, nextUrl))
  }

  // Rutas de administrador
  const adminRoutes = ['/admin', '/dashboard', '/admin-panel']
  const isAdminRoute = adminRoutes.some(route => nextUrl.pathname.startsWith(route))

  // Si trata de acceder a ruta de admin sin ser admin, redirigir con error
  if (isAdminRoute && !isAdmin) {
    const errorUrl = new URL('/auth/error', nextUrl)
    errorUrl.searchParams.set('error', 'AccessDenied')
    return NextResponse.redirect(errorUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
