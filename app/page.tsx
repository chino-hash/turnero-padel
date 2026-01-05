import { Suspense } from 'react'
import LandingPage from '@/components/LandingPage'

function LandingPageWrapper() {
  return <LandingPage />
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BEF264]"></div>
      </div>
    }>
      <LandingPageWrapper />
    </Suspense>
  )
}