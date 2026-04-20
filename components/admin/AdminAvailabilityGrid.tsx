'use client'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { buildAdminAvailabilityFetchUrl } from '@/lib/utils/admin-availability-url'
import CourtStatusIndicator from '@/components/admin/CourtStatusIndicator'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

type CourtStatus = 'free' | 'booked' | 'pending'

interface IAvailabilityResponse {
  timeSlots: Array<{
    timeLabel: string
    days: Array<{
      date: string
      courts: Array<{ courtId: string; status: CourtStatus }>
    }>
  }>
}

const fetcher = async (url: string): Promise<IAvailabilityResponse> => {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('Error al cargar disponibilidad')
  return res.json()
}

export type AdminAvailabilityGridProps = {
  tenantId?: string | null
  tenantSlug?: string | null
}

export default function AdminAvailabilityGrid(props: AdminAvailabilityGridProps = {}) {
  const { tenantId: tenantIdProp, tenantSlug: tenantSlugProp } = props
  const [abierta, setAbierta] = useState(false)
  const { data: session } = useSession()
  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin)
  const searchParams = useSearchParams()
  const tenantQueryKey = searchParams.toString()
  const availabilityUrl = useMemo(
    () =>
      buildAdminAvailabilityFetchUrl({
        tenantIdProp: tenantIdProp ?? null,
        tenantSlugProp: tenantSlugProp ?? null,
        searchParams,
        isSuperAdmin,
      }),
    [tenantIdProp, tenantSlugProp, tenantQueryKey, isSuperAdmin]
  )
  const swrKey = abierta ? availabilityUrl : null
  const { data, error, isLoading, isValidating, mutate } = useSWR<IAvailabilityResponse>(swrKey, fetcher, {
    refreshInterval: abierta ? 20000 : 0,
    revalidateOnFocus: abierta,
  })

  if (!abierta) {
    return (
      <div className={cn('flex items-center justify-end mb-2')}>
        <Button type="button" onClick={() => setAbierta(true)} variant="outline" className={cn('h-9 px-3')}>
          Mostrar grilla
        </Button>
      </div>
    )
  }
  if (isLoading) return <div className={cn('text-sm text-gray-600')}>Cargando...</div>
  if (error) return <div className={cn('text-sm text-red-600')}>Error al cargar</div>
  if (!data || !data.timeSlots?.length) return <div className={cn('text-sm text-gray-600')}>Sin datos</div>

  const headerDays = data.timeSlots[0]?.days ?? []

  return (
    <div className={cn('availability-grid')} aria-label="Grilla de disponibilidad de canchas">
      <div className={cn('mb-2 flex justify-between')}>
        <Button type="button" onClick={() => setAbierta(false)} variant="outline" className={cn('h-9 px-3')}>
          Ocultar grilla
        </Button>
        <Button type="button" onClick={() => mutate()} disabled={isValidating} variant="outline" className={cn('h-9 px-3')}>
          <RefreshCcw className={cn('w-4 h-4 mr-2', isValidating ? 'animate-spin' : '')} />
          {isValidating ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>
      <div
        className={cn('availability-grid__scroll w-full overflow-auto rounded-xl border')}
        data-testid="admin-availability-grid"
        aria-label="Tabla de disponibilidad semanal"
      >
        <table className={cn('availability-grid__table min-w-[640px] sm:min-w-[800px] w-full text-xs sm:text-sm')} role="table">
          <thead role="rowgroup" className={cn('availability-grid__head')}> 
            <tr role="row">
              <th
                role="columnheader"
                scope="col"
                className={cn('availability-grid__head-cell sticky top-0 text-left font-medium')}
              >
                Horario
              </th>
              {headerDays.map((d) => {
                const label = new Date(`${d.date}T00:00:00`).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                })
                return (
                  <th
                    key={d.date}
                    role="columnheader"
                    scope="col"
                    className={cn('availability-grid__head-cell sticky top-0 text-center font-medium')}
                    aria-label={`Día ${label}`}
                  >
                    {label.toUpperCase()}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {data.timeSlots.map((slot) => (
              <tr key={slot.timeLabel} role="row" className={cn('availability-grid__row')}> 
                <td role="cell" className={cn('availability-grid__cell availability-grid__cell--time whitespace-nowrap font-medium')}>
                  {(() => {
                    const [start, end] = slot.timeLabel.split(' - ')
                    return (
                      <span className={cn('availability-grid__time-label')}>
                        <span className={cn('availability-grid__time-start')}>{start}</span>
                        <span className={cn('availability-grid__time-sep')}> - </span>
                        <span className={cn('availability-grid__time-end')}>{end ?? ''}</span>
                      </span>
                    )
                  })()}
                </td>
                {slot.days.map((day) => (
                  <td
                    key={`${slot.timeLabel}-${day.date}`}
                    role="cell"
                    className={cn('availability-grid__cell')}
                    data-date={day.date}
                  > 
                    <div className={cn('availability-grid__badges')}> 
                      {day.courts.map((court, idx) => (
                        <CourtStatusIndicator
                          key={court.courtId}
                          status={court.status}
                          labelNumber={idx + 1}
                        />
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}