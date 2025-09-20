/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */

import { ReactNode } from "react"
import { auth } from "../../lib/auth"
import { redirect } from "next/navigation"
import ClientAppStateProvider from "../../components/providers/ClientAppStateProvider"

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return (
    <ClientAppStateProvider>
      {children}
    </ClientAppStateProvider>
  )
}
