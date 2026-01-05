import { redirect } from 'next/navigation'
import { getTenantFromSlug } from '@/lib/tenant/context'

interface ClubPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params
  
  if (!slug || typeof slug !== 'string') {
    redirect('/?error=tenant-not-found')
  }

  // Validar formato de slug (solo letras, números y guiones)
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(slug)) {
    redirect('/?error=tenant-invalid-slug')
  }

  try {
    const tenant = await getTenantFromSlug(slug)

    if (!tenant) {
      redirect('/?error=tenant-not-found')
    }

    if (!tenant.isActive) {
      redirect('/?error=tenant-inactive')
    }

    // Redirigir a login con tenantSlug en el callbackUrl
    const callbackUrl = `/dashboard?tenantSlug=${encodeURIComponent(slug)}`
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  } catch (error) {
    console.error('Error en ClubPage:', error)
    redirect('/?error=tenant-error')
  }
}

