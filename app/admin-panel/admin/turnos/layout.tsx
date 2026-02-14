import { ReactNode } from 'react'

export default function TurnosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      {children}
    </div>
  )
}