'use client'
import { cn } from '@/lib/utils'

type Status = 'free' | 'booked' | 'pending'

interface Props {
  status: Status
  labelNumber?: number
}

const labels: Record<Status, string> = {
  free: 'Libre',
  booked: 'Ocupado',
  pending: 'Bloqueado',
}

export default function CourtStatusIndicator({ status, labelNumber }: Props) {
  const base = 'availability-grid__badge'
  const stateClass =
    status === 'free' ? 'availability-grid__badge--free' :
    status === 'booked' ? 'availability-grid__badge--booked' :
    'availability-grid__badge--pending'
  return (
    <div
      className={cn(base, stateClass)}
      title={labels[status]}
      aria-label={labels[status]}
      data-state={status}
      role="img"
    >
      {status === 'booked' ? (
        <span className={cn('availability-grid__badge-content')}>
          <span className={cn('availability-grid__badge-x')} aria-hidden>×</span>
          <span className={cn('availability-grid__badge-number')}>{labelNumber}</span>
        </span>
      ) : (
        <span className={cn('availability-grid__badge-number opacity-70')}>{labelNumber}</span>
      )}
    </div>
  )
}