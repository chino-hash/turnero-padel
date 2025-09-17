/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { isAdminEmail, logAdminAccess } from "./admin-system"
import { env, isDevelopment, isProduction, getAuthConfig } from "./config/env"
import type { NextAuthConfig } from "next-auth"

const authConfig = getAuthConfig()

export const config = {
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
          logAdminAccess(user.email || '', false, 'email', 'signIn_rejected_not_google')
          return false
        }

        // Verificar que el email esté verificado en Google
        if (!profile?.email_verified) {
          console.log('❌ SignIn rechazado: Email no verificado')
          logAdminAccess(user.email || '', false, 'google', 'signIn_rejected_email_not_verified')
          return false
        }

        // Verificar si es administrador para logging
        const isAdmin = await isAdminEmail(user.email!)
        console.log(`✅ SignIn exitoso para ${user.email} (Admin: ${isAdmin})`)
        logAdminAccess(user.email!, true, 'google', isAdmin ? 'admin_login' : 'user_login')

        return true
      } catch (error) {
        console.error('❌ Error en signIn callback:', error)
        return false
      }
    },

    async jwt({ token, user, account, trigger }) {
      // Verificar si es un nuevo sign-in o actualización
      if (account && user) {
        // Verificar si el email está en la lista de administradores
        const isAdmin = await isAdminEmail(user.email!)
        
        // Log del acceso de administrador
        if (isAdmin) {
          logAdminAccess(user.email!, true, 'google', 'login')
        }
        
        // Asignar rol basado en si es admin o no
        token.role = isAdmin ? 'ADMIN' : 'USER'
        token.isAdmin = isAdmin
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      
      // Renovar información de admin en cada actualización de token
      if (trigger === 'update' && token.email) {
        try {
          const isAdmin = await isAdminEmail(token.email as string)
          token.role = isAdmin ? 'ADMIN' : 'USER'
          token.isAdmin = isAdmin
        } catch (error) {
          console.error('Error verificando estado de admin:', error)
          // Mantener el estado anterior en caso de error
        }
      }
      
      return token
    },

    async session({ session, token }) {
      // Propagar datos del token a la sesión (compatible con middleware/edge)
      if (session.user) {
        session.user.id = (token.sub as string) || session.user.id
        session.user.role = (token.role as 'ADMIN' | 'USER') || 'USER'
        session.user.isAdmin = Boolean(token.isAdmin)
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
        const isAdmin = await isAdminEmail(user.email!)
        logAdminAccess(user.email!, true, 'google', `new_user_${isAdmin ? 'admin' : 'user'}`)
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
      role: 'USER' | 'ADMIN'
      isAdmin: boolean
    }
  }

  interface User {
    role: 'USER' | 'ADMIN'
    isAdmin: boolean
  }
}
