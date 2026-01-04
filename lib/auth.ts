/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { env, isDevelopment, isProduction, getAuthConfig } from "./config/env"
import type { NextAuthConfig } from "next-auth"

// Importación dinámica de admin-system para evitar problemas en el middleware
const getUserRoleAndTenant = async (email: string): Promise<{ role: 'USER' | 'ADMIN' | 'SUPER_ADMIN', tenantId: string | null }> => {
  try {
    // Solo importar admin-system cuando no estamos en el middleware
    if (typeof window === 'undefined') {
      const { getUserRole } = await import('./admin-system')
      
      // Obtener usuario de la base de datos para obtener tenantId
      // Usar findFirst porque email ahora es parte de un índice compuesto (email, tenantId)
      const { prisma } = await import('@/lib/database/neon-config')
      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
        select: { id: true, tenantId: true }
      })
      
      const tenantId = user?.tenantId || null
      
      // Obtener rol
      const role = await getUserRole(email, tenantId)
      
      return { role, tenantId }
    }
    
    // Fallback simple para middleware (no ideal, pero necesario)
    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    const emailLower = email.toLowerCase()
    
    if (superAdminEmails.includes(emailLower)) {
      return { role: 'SUPER_ADMIN', tenantId: null }
    }
    if (adminEmails.includes(emailLower)) {
      return { role: 'ADMIN', tenantId: null }
    }
    return { role: 'USER', tenantId: null }
  } catch (error) {
    console.error('Error checking user role:', error)
    // Fallback a USER
    return { role: 'USER', tenantId: null }
  }
}

// Importación dinámica de logAdminAccess para evitar problemas en el middleware
const logAdminAccessSafe = async (email: string, success: boolean, method: 'email' | 'google', action: string) => {
  try {
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      const { logAdminAccess } = await import('./admin-system')
      logAdminAccess(email, success, method, action)
    }
  } catch (error) {
    console.error('Error logging admin access:', error)
  }
}

const authConfig = getAuthConfig()

export const config = {
  secret: authConfig.secret,
  trustHost: true,
  providers: [
    Google({
      clientId: authConfig.google.clientId,
      clientSecret: authConfig.google.clientSecret,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días (reducido para mayor seguridad)
    updateAge: 4 * 60 * 60, // Actualizar cada 4 horas (más frecuente)
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        domain: isProduction ? authConfig.url?.replace(/https?:\/\//, '') : undefined
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: isProduction
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Solo permitir Google OAuth
        if (account?.provider !== 'google') {
          console.log('❌ SignIn rechazado: No es Google OAuth')
          logAdminAccessSafe(user.email || '', false, 'email', 'signIn_rejected_not_google')
          return false
        }

        // Verificar que el email esté verificado en Google
        if (!profile?.email_verified) {
          console.log('❌ SignIn rechazado: Email no verificado')
          logAdminAccessSafe(user.email || '', false, 'google', 'signIn_rejected_email_not_verified')
          return false
        }

        // Verificar rol y tenantId para logging
        const { role, tenantId } = await getUserRoleAndTenant(user.email!)
        const isSuperAdmin = role === 'SUPER_ADMIN'
        const isAdmin = role === 'ADMIN' || isSuperAdmin
        console.log(`✅ SignIn exitoso para ${user.email} (Role: ${role}, Tenant: ${tenantId || 'N/A'})`)
        logAdminAccessSafe(user.email!, true, 'google', isSuperAdmin ? 'super_admin_login' : isAdmin ? 'admin_login' : 'user_login')

        return true
      } catch (error) {
        console.error('❌ Error en signIn callback:', error)
        return false
      }
    },

    async jwt({ token, user, account, trigger }) {
      // Verificar si es un nuevo sign-in o actualización
      if (account && user) {
        // Obtener rol y tenantId
        const { role, tenantId } = await getUserRoleAndTenant(user.email!)
        const isSuperAdmin = role === 'SUPER_ADMIN'
        const isAdmin = role === 'ADMIN' || isSuperAdmin
        
        // Log del acceso
        if (isSuperAdmin || isAdmin) {
          logAdminAccessSafe(user.email!, true, 'google', isSuperAdmin ? 'super_admin_login' : 'admin_login')
        }
        
        // Asignar datos al token
        token.role = role
        token.isAdmin = isAdmin
        token.isSuperAdmin = isSuperAdmin
        token.tenantId = tenantId
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      
      // Renovar información en cada actualización de token
      if (trigger === 'update' && token.email) {
        try {
          const { role, tenantId } = await getUserRoleAndTenant(token.email as string)
          const isSuperAdmin = role === 'SUPER_ADMIN'
          const isAdmin = role === 'ADMIN' || isSuperAdmin
          
          token.role = role
          token.isAdmin = isAdmin
          token.isSuperAdmin = isSuperAdmin
          token.tenantId = tenantId
        } catch (error) {
          console.error('Error verificando estado de usuario:', error)
          // Mantener el estado anterior en caso de error
        }
      }
      
      return token
    },

    async session({ session, token }) {
      // Propagar datos del token a la sesión (compatible con middleware/edge)
      if (session.user) {
        session.user.id = (token.sub as string) || session.user.id
        session.user.role = (token.role as 'USER' | 'ADMIN' | 'SUPER_ADMIN') || 'USER'
        session.user.isAdmin = Boolean(token.isAdmin)
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin)
        session.user.tenantId = (token.tenantId as string | null) || null
      }

      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        const { role } = await getUserRoleAndTenant(user.email!)
        const isSuperAdmin = role === 'SUPER_ADMIN'
        const isAdmin = role === 'ADMIN' || isSuperAdmin
        logAdminAccessSafe(user.email!, true, 'google', `new_user_${isSuperAdmin ? 'super_admin' : isAdmin ? 'admin' : 'user'}`)
      }
    },
    async signOut() {
      console.log('🔓 Usuario cerró sesión')
    },
   },
  logger: {
    error(error) {
      console.error('❌ NextAuth Error:', error)
    },
    warn(code) {
      if (code === 'debug-enabled') return
      console.warn('⚠️ NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (isDevelopment) {
        console.log('🐛 NextAuth Debug:', code, metadata)
      }
    }
  },
  debug: isDevelopment,
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)

// Tipos personalizados para TypeScript
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
      isAdmin: boolean
      isSuperAdmin: boolean
      tenantId?: string | null
    }
  }

  interface User {
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    isAdmin: boolean
    isSuperAdmin: boolean
    tenantId?: string | null
  }
}
