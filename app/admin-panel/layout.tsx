import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import ClientAppStateProvider from "@/components/providers/ClientAppStateProvider"
import AdminLayoutContent from "./components/AdminLayoutContent"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (!session.user?.isAdmin) {
    redirect("/")
  }
  
  return (
    <ClientAppStateProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </ClientAppStateProvider>
  )
}
