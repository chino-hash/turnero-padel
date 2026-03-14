'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function ReservaExitoPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams?.get('bookingId')?.trim()

  useEffect(() => {
    if (!bookingId) return
    fetch(`/api/bookings/${bookingId}/sync-payment-status`, { method: 'POST', credentials: 'include' }).catch(() => {})
  }, [bookingId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pago realizado</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Tu seña fue acreditada correctamente. La reserva queda confirmada.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">Ir a Mis Turnos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
