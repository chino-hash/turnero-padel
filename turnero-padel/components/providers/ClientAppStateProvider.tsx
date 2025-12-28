'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const AppStateProvider = dynamic(
  () => import('./AppStateProvider').then(mod => ({ default: mod.AppStateProvider })),
  { ssr: false }
)

interface ClientAppStateProviderProps {
  children: ReactNode
}

export default function ClientAppStateProvider({ children }: ClientAppStateProviderProps) {
  return <AppStateProvider>{children}</AppStateProvider>
}