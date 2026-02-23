/**
 * Configuración mínima de NextAuth para el middleware (Edge Runtime).
 * Solo valida JWT y construye la sesión. No incluye providers, Prisma ni Zod.
 *
 * ⚠️ SOLO para middleware.ts. NO importar en rutas API, layouts ni componentes.
 * Para esos usos, importar desde lib/auth.
 */
import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

const config = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [], // Vacío para Edge; el middleware solo valida JWT existente
  session: { strategy: "jwt" }, // Requerido para que NextAuth decodifique el JWT del cookie
  cookies: {
    sessionToken: {
      name: "next-auth.session-token", // DEBE coincidir con lib/auth; v5 default es authjs.session-token
      options: {
        path: "/",
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || session.user.id
        session.user.role = (token.role as "USER" | "ADMIN" | "SUPER_ADMIN") || "USER"
        session.user.isAdmin = Boolean(token.isAdmin)
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin)
        session.user.tenantId = (token.tenantId as string | null) || null
      }
      return session
    },
  },
} satisfies NextAuthConfig

export const { auth } = NextAuth(config)
