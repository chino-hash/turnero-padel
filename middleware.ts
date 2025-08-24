import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.isAdmin || false

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
    return NextResponse.next()
  }

  // Si no está logueado y no es ruta pública, redirigir a login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Si está logueado y trata de acceder a login, redirigir a home
  if (isLoggedIn && nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  // Rutas de administrador
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => nextUrl.pathname.startsWith(route))

  // Si trata de acceder a ruta de admin sin ser admin
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
