import { GoogleLoginForm } from '@/components/auth/GoogleLoginForm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

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
    redirect('/')
  }

  return (
    <GoogleLoginForm
      callbackUrl={params.callbackUrl}
      error={params.error}
    />
  )
}
