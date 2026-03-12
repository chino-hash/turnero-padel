'use client'

import { createContext, useContext, type ReactNode } from 'react'

const TenantSlugFromPathContext = createContext<string | null>(null)

export function useTenantSlugFromPath(): string | null {
  return useContext(TenantSlugFromPathContext)
}

interface TenantSlugProviderProps {
  slug: string
  children: ReactNode
}

export function TenantSlugProvider({ slug, children }: TenantSlugProviderProps) {
  return (
    <TenantSlugFromPathContext.Provider value={slug}>
      {children}
    </TenantSlugFromPathContext.Provider>
  )
}
