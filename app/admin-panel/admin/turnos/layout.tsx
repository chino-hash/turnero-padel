import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import AdminAvailabilityGrid from '../../../../components/admin/AdminAvailabilityGrid'
import QuickStatusList from '../../../../components/admin/QuickStatusList'

export default function TurnosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Ocupación y Disponibilidad (Próximos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAvailabilityGrid />
        </CardContent>
      </Card>

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