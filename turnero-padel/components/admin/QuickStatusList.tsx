'use client'
import useSWR from 'swr'
import { cn } from '@/lib/utils'

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

export default function QuickStatusList() {
  const { data, error, isLoading } = useSWR<IAvailabilityResponse>('/api/admin/availability', fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: true,
  })

  if (isLoading) return <div className={cn('text-sm text-gray-600')}>Cargando...</div>
  if (error) return <div className={cn('text-sm text-red-600')}>Error al cargar</div>
  if (!data || !data.timeSlots?.length) return <div className={cn('text-sm text-gray-600')}>Sin datos</div>

  const todayYmd = new Date().toISOString().split('T')[0]

  const buildList = (status: CourtStatus) => {
    const items: Array<{ label: string; count: number }> = []
    for (const slot of data.timeSlots) {
      const day = slot.days.find(d => d.date === todayYmd)
      if (!day) continue
      const count = day.courts.filter(c => c.status === status).length
      if (count > 0) items.push({ label: slot.timeLabel, count })
    }
    return items
  }

  const occupied = buildList('booked')
  const free = buildList('free')
  const pending = buildList('pending')

  const Section = ({ title, items, color }: { title: string; items: Array<{ label: string; count: number }>; color: string }) => (
    <div className={cn('space-y-2')}> 
      <h4 className={cn('text-sm font-semibold', color)}>{title}</h4>
      <ul className={cn('space-y-1')}> 
        {items.length === 0 ? (
          <li className={cn('text-xs text-gray-500')}>Sin elementos</li>
        ) : (
          items.slice(0, 12).map(it => (
            <li key={`${title}-${it.label}`} className={cn('text-xs text-gray-800 flex items-center justify-between')}> 
              <span>{it.label}</span>
              <span className={cn('text-[11px] text-gray-500')}>{it.count} cancha{it.count > 1 ? 's' : ''}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  )

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4')}> 
      <Section title="Ocupados" items={occupied} color="text-red-600" />
      <Section title="Libres" items={free} color="text-green-600" />
      <Section title="Pendientes" items={pending} color="text-yellow-600" />
    </div>
  )
}