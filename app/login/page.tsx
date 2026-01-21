import { GoogleLoginForm } from '../../components/auth/GoogleLoginForm'
import { auth } from '../../lib/auth'
import { redirect } from 'next/navigation'
import { saveTenantSlug, extractTenantSlugFromUrl } from '@/lib/utils/tenant-slug-storage'
import { getTenantBySlug } from '@/lib/services/tenants'

interface LoginPageProps {
  searchParams: Promise<{
    error?: string
    callbackUrl?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const params = await searchParams

  if (session) {
    // Redirigir directamente a dashboard para evitar bucle con página principal
    const callbackUrl = params.callbackUrl || '/dashboard'
    redirect(callbackUrl)
  }

  // Extraer tenantSlug del callbackUrl si existe
  const tenantSlug = extractTenantSlugFromUrl(params.callbackUrl)
  
  // Si viene tenantSlug, validar que el tenant existe y está activo
  if (tenantSlug) {
    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) {
      // Si el tenant no existe o está inactivo, redirigir con error
      redirect('/?error=tenant-not-found')
    }
    
    // Guardar tenantSlug en cookie para persistir durante OAuth
    await saveTenantSlug(tenantSlug)
  }

  return (
    <GoogleLoginForm
      callbackUrl={params.callbackUrl}
      error={params.error}
    />
  )
}
