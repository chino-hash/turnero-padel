'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../../components/ui/button'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

type Status = 'loading' | 'success' | 'error' | 'no_booking_id'

function MockSuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')?.trim() || null
  const [status, setStatus] = useState<Status>(bookingId ? 'loading' : 'no_booking_id')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (!bookingId || calledRef.current) return
    calledRef.current = true

    const confirm = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/mock-confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          setStatus('success')
        } else {
          setStatus('error')
          setErrorMessage(data?.error || 'No se pudo confirmar la reserva')
        }
      } catch {
        setStatus('error')
        setErrorMessage('Error de conexión')
      }
    }

    confirm()
  }, [bookingId])

  if (status === 'no_booking_id') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 mx-auto text-amber-600 dark:text-amber-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Falta información de la reserva</h1>
          <p className="text-gray-600 dark:text-gray-300">
            No se encontró el identificador de la reserva. Volvé al inicio e intentá de nuevo.
          </p>
          <Button asChild variant="default">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full text-center space-y-6">
          <Loader2 className="w-16 h-16 mx-auto text-slate-600 dark:text-slate-400 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Confirmando reserva...</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Un momento, estamos confirmando tu pago simulado.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 mx-auto text-red-600 dark:text-red-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Algo salió mal</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {errorMessage}
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pago simulado</h1>
        <p className="text-gray-600 dark:text-gray-300">
          La reserva quedó confirmada. En modo demo el pago es simulado; tu turno ya está en Mis Turnos.
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

export default function MockSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
          <Loader2 className="w-16 h-16 text-slate-600 dark:text-slate-400 animate-spin" />
        </div>
      }
    >
      <MockSuccessContent />
    </Suspense>
  )
}
