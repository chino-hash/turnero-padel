'use client'

import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { Clock } from 'lucide-react'

export default function ReservaPendientePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full text-center space-y-6">
        <Clock className="w-16 h-16 mx-auto text-amber-600 dark:text-amber-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pago pendiente</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Tu pago está pendiente de acreditación. Cuando se confirme, la reserva quedará activa. Podés revisar el estado en Mis Turnos.
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
