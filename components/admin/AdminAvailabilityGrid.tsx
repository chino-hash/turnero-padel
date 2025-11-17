'use client'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
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

export default function AdminAvailabilityGrid() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<IAvailabilityResponse>('/api/admin/availability', fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: true,
  })

  if (isLoading) return <div className={cn('text-sm text-gray-600')}>Cargando...</div>
  if (error) return <div className={cn('text-sm text-red-600')}>Error al cargar</div>
  if (!data || !data.timeSlots?.length) return <div className={cn('text-sm text-gray-600')}>Sin datos</div>

  const headerDays = data.timeSlots[0]?.days ?? []

  return (
    <div>
      <div className={cn('mb-2 flex justify-end')}>
        <Button type="button" onClick={() => mutate()} disabled={isValidating} variant="outline" className={cn('h-9 px-3')}>
          <RefreshCcw className={cn('w-4 h-4 mr-2', isValidating ? 'animate-spin' : '')} />
          {isValidating ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>
      <div className={cn('w-full overflow-x-auto rounded-lg border')}> 
      <table className={cn('min-w-[800px] w-full text-sm')}> 
        <thead>
          <tr className={cn('bg-muted/50')}> 
            <th className={cn('px-3 py-2 text-left font-medium text-gray-700')}>Horario</th>
            {headerDays.map((d) => {
              const label = new Date(`${d.date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
              return (
                <th key={d.date} className={cn('px-3 py-2 text-center font-medium text-gray-700')}>{label.toUpperCase()}</th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {data.timeSlots.map((slot) => (
            <tr key={slot.timeLabel} className={cn('border-t')}> 
              <td className={cn('px-3 py-2 whitespace-nowrap font-medium text-gray-800')}>{slot.timeLabel}</td>
              {slot.days.map((day) => (
                <td key={`${slot.timeLabel}-${day.date}`} className={cn('px-3 py-2')}> 
                  <div className={cn('flex items-center gap-2')}> 
                    {day.courts.slice(0, 3).map((court) => (
                      <CourtStatusIndicator key={court.courtId} status={court.status} />
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