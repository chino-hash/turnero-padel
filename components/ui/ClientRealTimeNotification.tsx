'use client'

import dynamic from 'next/dynamic'

const RealTimeNotification = dynamic(
  () => import('./RealTimeNotification'),
  { ssr: false }
)

export default function ClientRealTimeNotification() {
  return <RealTimeNotification />
}