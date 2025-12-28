'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

/**
 * ProtectedRoute simplificado para casos donde sea necesario mantenerlo.
 *
 * NOTA: Se recomienda usar layouts de servidor con auth() en lugar de este wrapper.
 * Este componente solo debe usarse para componentes que DEBEN ser client-side.
 *
 * Cambios vs. versión anterior:
 * - ❌ Eliminado: useEffect con navegación (causaba FOUC y dobles redirecciones)
 * - ❌ Eliminado: useRouter.push() (la navegación se maneja en middleware/layouts)
 * - ✅ Simplificado: Solo renderiza o no renderiza contenido
 * - ✅ Mejorado: Usa useSession directamente sin wrapper adicional
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { data: session, status } = useSession()

  // Mostrar loading solo mientras se carga la sesión
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  // No renderizar contenido no autorizado (middleware/layouts manejan redirecciones)
  if (!session?.user || (requireAdmin && !session.user.isAdmin)) {
    return null
  }

  return <>{children}</>
}
