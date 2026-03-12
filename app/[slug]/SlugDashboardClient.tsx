'use client'

import dynamic from 'next/dynamic'
import ClientAppStateProvider from '@/components/providers/ClientAppStateProvider'
import { TenantSlugProvider } from '@/lib/tenant/TenantSlugFromPathContext'

const PadelBookingPage = dynamic(() => import('@/padel-booking'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
    </div>
  )
})

interface SlugDashboardClientProps {
  slug: string
}

export default function SlugDashboardClient({ slug }: SlugDashboardClientProps) {
  return (
    <TenantSlugProvider slug={slug}>
      <ClientAppStateProvider>
        <PadelBookingPage />
      </ClientAppStateProvider>
    </TenantSlugProvider>
  )
}
