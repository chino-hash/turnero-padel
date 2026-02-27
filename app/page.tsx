import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { getTenantFromId } from '@/lib/tenant/context'
import LandingPage from '@/components/LandingPage'

export default async function HomePage() {
  const session = await auth()
  let tenantSlug: string | null = null
  let tenantName: string | null = null

  if (session?.user?.tenantId) {
    try {
      const tenant = await getTenantFromId(session.user.tenantId)
      if (tenant?.isActive) {
        tenantSlug = tenant.slug
        tenantName = tenant.name
      }
    } catch {
      // Dejar tenantSlug/tenantName en null
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BEF264]"></div>
      </div>
    }>
      <LandingPage session={session} tenantSlug={tenantSlug} tenantName={tenantName} />
    </Suspense>
  )
}