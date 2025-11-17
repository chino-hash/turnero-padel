'use client'
import { cn } from '@/lib/utils'

type Status = 'free' | 'booked' | 'pending'

interface Props {
  status: Status
}

const labels: Record<Status, string> = {
  free: 'Libre',
  booked: 'Ocupado',
  pending: 'Bloqueado',
}

export default function CourtStatusIndicator({ status }: Props) {
  const base = 'w-4 h-4 rounded-full'
  const color =
    status === 'free' ? 'bg-green-500' :
    status === 'booked' ? 'bg-red-500' :
    'bg-yellow-500'
  const animation = status === 'pending' ? 'animate-pulse' : ''

  return <div className={cn(base, color, animation)} title={labels[status]} aria-label={labels[status]} />
}