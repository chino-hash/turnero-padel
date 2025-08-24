import { ImprovedLoginForm } from '@/components/auth/ImprovedLoginForm'

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <ImprovedLoginForm callbackUrl="/dashboard" />
    </div>
  )
}