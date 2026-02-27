import { GoogleLoginForm } from '../../components/auth/GoogleLoginForm'
import { auth } from '../../lib/auth'
import { redirect } from 'next/navigation'
import { extractTenantSlugFromUrl } from '@/lib/utils/tenant-slug-storage'
import { getTenantBySlug } from '@/lib/services/tenants'

interface LoginPageProps {
  searchParams: Promise<{
    error?: string
    callbackUrl?: string
    _cookieSet?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const params = await searchParams

  if (session) {
    const callbackUrl = params.callbackUrl ?? '/'
    redirect(callbackUrl)
  }

  // Si _cookieSet está presente, la cookie ya fue establecida por el Route Handler
  if (params._cookieSet) {
    return (
      <GoogleLoginForm
        callbackUrl={params.callbackUrl}
        error={params.error}
      />
    )
  }

  // Extraer tenantSlug del callbackUrl si existe
  const tenantSlug = extractTenantSlugFromUrl(params.callbackUrl)
  
  // Si viene tenantSlug, validar y redirigir al Route Handler para establecer la cookie
  // (las cookies solo pueden modificarse en Server Actions o Route Handlers en Next.js 15)
  if (tenantSlug) {
    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) {
      redirect('/?error=tenant-not-found')
    }
    
    const callbackUrlEncoded = encodeURIComponent(params.callbackUrl || '/dashboard')
    redirect(`/api/auth/set-tenant-slug?tenantSlug=${encodeURIComponent(tenantSlug)}&callbackUrl=${callbackUrlEncoded}`)
  }

  return (
    <GoogleLoginForm
      callbackUrl={params.callbackUrl}
      error={params.error}
    />
  )
}
