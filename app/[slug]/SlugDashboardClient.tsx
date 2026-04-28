'use client'

import dynamic from 'next/dynamic'
import ClientAppStateProvider from '@/components/providers/ClientAppStateProvider'
import { TenantSlugProvider } from '@/lib/tenant/TenantSlugFromPathContext'
import { Skeleton } from '@/components/ui/skeleton'

function TenantDashboardShellSkeleton() {
  return (
    <div className="dashboard-theme font-sans min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-[80] bg-transparent px-1 sm:px-2 pt-0">
        <div className="flex items-start justify-between max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-b-2xl border border-border shadow-lg flex-1 max-w-[200px] sm:max-w-xs">
            <Skeleton className="h-8 w-28 sm:w-36" />
            <Skeleton className="h-7 w-14 rounded-md" />
          </div>
          <div className="flex-1 min-h-[3rem]" aria-hidden />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-b-2xl border border-border shadow-lg">
            <Skeleton className="h-7 w-24 sm:w-32" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>
      <div className="pt-14 sm:pt-16 px-3 sm:px-4 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg col-span-2 sm:col-span-2" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}

const PadelBookingPage = dynamic(
  async () => {
    const mod = await import('@/padel-booking')
    const Component = mod.default ?? mod.PadelBookingPage
    return { default: Component }
  },
  {
    ssr: false,
    loading: () => <TenantDashboardShellSkeleton />,
  }
)

interface SlugDashboardClientProps {
  slug: string
}

export default function SlugDashboardClient({ slug }: SlugDashboardClientProps) {
  return (
    <TenantSlugProvider slug={slug}>
      <ClientAppStateProvider key={slug}>
        <PadelBookingPage />
      </ClientAppStateProvider>
    </TenantSlugProvider>
  )
}
