'use client'

import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function ReservaErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full text-center space-y-6">
        <AlertCircle className="w-16 h-16 mx-auto text-red-600 dark:text-red-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Error en el pago</h1>
        <p className="text-gray-600 dark:text-gray-300">
          No se pudo completar el pago. Podés intentar de nuevo desde Mis Turnos o contactar al club.
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
