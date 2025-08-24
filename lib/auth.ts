import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { isAdminEmail, logAdminAccess } from "@/lib/admin-system"
import type { NextAuthConfig } from "next-auth"

export const config = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Solo permitir Google OAuth
      if (account?.provider !== 'google') {
        logAdminAccess(user.email || '', false, 'email', 'signIn_rejected_not_google')
        return false
      }

      // Verificar que el email esté verificado en Google
      if (!profile?.email_verified) {
        logAdminAccess(user.email || '', false, 'google', 'signIn_rejected_email_not_verified')
        return false
      }

      // Verificar si es administrador para logging
      const isAdmin = await isAdminEmail(user.email!)
      logAdminAccess(user.email!, true, 'google', isAdmin ? 'admin_login' : 'user_login')

      return true
    },

    async jwt({ token, user }) {
      // Agregar información del usuario al token en el primer login
      if (user) {
        const isAdmin = await isAdminEmail(user.email!)
        token.role = isAdmin ? 'ADMIN' : 'USER'
        token.isAdmin = isAdmin
        // opcional: mantener name/email/picture en el token
        token.name = user.name
        token.email = user.email
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
      // El callback signOut no recibe parámetros útiles en NextAuth v4
      // El logging de signOut se puede manejar en el cliente si es necesario
    }
  },
  debug: process.env.NODE_ENV === 'development',
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
