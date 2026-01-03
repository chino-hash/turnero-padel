'use client'

import { ReactNode } from "react"
import Link from "next/link"
import { Settings, Users, Calendar, BarChart3, Package, Sun, Moon, Trophy, Home } from "lucide-react"
import AdminTitleButton from "./AdminTitleButton"
import { useAppState } from "../../../components/providers/AppStateProvider"
import { useRouter, usePathname } from "next/navigation"

interface AdminLayoutContentProps {
  children: ReactNode
}

export default function AdminLayoutContent({ children }: AdminLayoutContentProps) {
  const { isDarkMode, setIsDarkMode } = useAppState()
  const router = useRouter()
  const pathname = usePathname()
  const baseClasses = "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
  const darkClasses = "text-gray-300 hover:text-blue-400 hover:bg-gray-700"
  const lightClasses = "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
  const activeDark = " text-blue-400 bg-gray-700"
  const activeLight = " text-blue-600 bg-blue-50"
  const linkClass = (href: string) =>
    `${baseClasses} ${isDarkMode ? darkClasses : lightClasses}${pathname.startsWith(href) ? (isDarkMode ? activeDark : activeLight) : ""}`

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#090E1A]' : 'bg-gray-50'}`}>
      {/* Header principal con navegación integrada */}
      <header
        className={`shadow-lg border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        role="banner"
        aria-label="Navegación del panel de administración"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <AdminTitleButton />
              </div>
            </div>

            {/* Navegación principal en el header */}
            <nav
              className="flex flex-1 items-center space-x-1 overflow-x-auto"
              role="navigation"
              aria-labelledby="admin-nav-title"
              data-testid="admin-navigation"
            >
              <h2 id="admin-nav-title" className="sr-only">Navegación administrativa</h2>

              <Link
                href="/admin-panel/admin/canchas"
                className={linkClass("/admin-panel/admin/canchas")}
                aria-current={pathname.startsWith("/admin-panel/admin/canchas") ? "page" : undefined}
                data-testid="admin-courts-link"
              >
                <Settings className="w-5 h-5" />
                <div>Canchas</div>
              </Link>

              <Link
                href="/admin-panel/admin/turnos"
                className={linkClass("/admin-panel/admin/turnos")}
                aria-current={pathname.startsWith("/admin-panel/admin/turnos") ? "page" : undefined}
                data-testid="admin-bookings-link"
              >
                <Calendar className="w-5 h-5" />
                <div>Turnos</div>
              </Link>

              <Link
                href="/admin-panel/admin/usuarios"
                className={linkClass("/admin-panel/admin/usuarios")}
                aria-current={pathname.startsWith("/admin-panel/admin/usuarios") ? "page" : undefined}
                data-testid="admin-users-link"
              >
                <Users className="w-5 h-5" />
                <div>Usuarios</div>
              </Link>

              <Link
                href="/admin-panel/estadisticas"
                className={linkClass("/admin-panel/estadisticas")}
                aria-current={pathname.startsWith("/admin-panel/estadisticas") ? "page" : undefined}
                data-testid="admin-stats-link"
              >
                <BarChart3 className="w-5 h-5" />
                <div>Estadísticas</div>
              </Link>

              <Link
                href="/admin-panel/admin/productos"
                className={linkClass("/admin-panel/admin/productos")}
                aria-current={pathname.startsWith("/admin-panel/admin/productos") ? "page" : undefined}
                data-testid="admin-products-link"
              >
                <Package className="w-5 h-5" />
                <div>Productos</div>
              </Link>

              <Link
                href="/admin-panel/admin/torneos"
                className={linkClass("/admin-panel/admin/torneos")}
                aria-current={pathname.startsWith("/admin-panel/admin/torneos") ? "page" : undefined}
                data-testid="admin-tournaments-link"
              >
                <Trophy className="w-5 h-5" />
                <div>Torneo</div>
              </Link>
            </nav>

            {/* Información del usuario y toggle de modo oscuro */}
            <div className="flex items-center space-x-4">
              {/* Botón Ir a Home */}
              <button
                onClick={() => router.push('/dashboard')}
                className={`transition-all duration-200 shadow-sm p-1.5 sm:p-2 h-8 w-8 border rounded-md flex items-center justify-center hover:scale-105 ${isDarkMode
                    ? 'border-blue-500 text-blue-400 hover:bg-blue-900/20'
                    : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                title="Ir al sitio principal"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Toggle de modo oscuro */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`transition-all duration-200 shadow-sm p-1.5 sm:p-2 h-8 w-8 border rounded-md flex items-center justify-center hover:scale-105 ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
                title={isDarkMode ? "Modo claro" : "Modo oscuro"}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
