import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTenantFromSlug } from '@/lib/tenant/context'
import { canAccessTenant } from '@/lib/utils/permissions'
import SlugDashboardClient from './SlugDashboardClient'

interface SlugPageProps {
  params: Promise<{ slug: string }>
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params

  if (!slug || typeof slug !== 'string') {
    redirect('/?error=tenant-not-found')
  }

  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(slug)) {
    redirect('/?error=tenant-invalid-slug')
  }

  const tenant = await getTenantFromSlug(slug)
  if (!tenant) {
    redirect('/?error=tenant-not-found')
  }
  if (!tenant.isActive) {
    redirect('/?error=tenant-inactive')
  }

  const session = await auth()
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/' + slug)}`)
  }

  const allowed = await canAccessTenant(session.user, tenant.id)
  if (!allowed) {
    redirect('/auth/error?error=AccessDenied')
  }

  return <SlugDashboardClient slug={slug} />
}
