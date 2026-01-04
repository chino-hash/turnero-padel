import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import ClientAppStateProvider from "@/components/providers/ClientAppStateProvider"
import SuperAdminLayoutContent from "./components/SuperAdminLayoutContent"

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (!session.user?.isSuperAdmin) {
    redirect("/")
  }
  
  return (
    <ClientAppStateProvider>
      <SuperAdminLayoutContent>
        {children}
      </SuperAdminLayoutContent>
    </ClientAppStateProvider>
  )
}


