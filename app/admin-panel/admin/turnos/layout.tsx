import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import QuickStatusList from '../../../../components/admin/QuickStatusList'

export default function TurnosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      {children}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Vista rápida: Ocupados / Libres / Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickStatusList />
        </CardContent>
      </Card>
    </div>
  )
}