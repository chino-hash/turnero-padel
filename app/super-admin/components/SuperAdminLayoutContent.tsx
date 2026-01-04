'use client'

import { ReactNode } from "react"
import Link from "next/link"
import { Building2, Users, CreditCard, Settings, Sun, Moon, Home } from "lucide-react"
import { useAppState } from "../../../components/providers/AppStateProvider"
import { useRouter, usePathname } from "next/navigation"

interface SuperAdminLayoutContentProps {
  children: ReactNode
}

export default function SuperAdminLayoutContent({ children }: SuperAdminLayoutContentProps) {
  const { isDarkMode, setIsDarkMode } = useAppState()
  const router = useRouter()
  const pathname = usePathname()
  const baseClasses = "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
  const darkClasses = "text-gray-300 hover:text-purple-400 hover:bg-gray-700"
  const lightClasses = "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
  const activeDark = " text-purple-400 bg-gray-700"
  const activeLight = " text-purple-600 bg-purple-50"
  const linkClass = (href: string) =>
    `${baseClasses} ${isDarkMode ? darkClasses : lightClasses}${pathname.startsWith(href) ? (isDarkMode ? activeDark : activeLight) : ""}`

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#090E1A]' : 'bg-gray-50'}`}>
      {/* Header principal con navegación integrada */}
      <header
        className={`shadow-lg border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        role="banner"
        aria-label="Navegación del panel de Super Administrador"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <Link href="/super-admin" className="flex items-center">
                  <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Super Admin
                  </h1>
                </Link>
              </div>
            </div>

            {/* Navegación principal en el header */}
            <nav
              className="flex flex-1 items-center space-x-1 overflow-x-auto"
              role="navigation"
              aria-labelledby="super-admin-nav-title"
            >
              <h2 id="super-admin-nav-title" className="sr-only">Navegación de Super Administrador</h2>

              <Link
                href="/super-admin"
                className={linkClass("/super-admin")}
                aria-current={pathname === "/super-admin" ? "page" : undefined}
              >
                <Building2 className="w-5 h-5" />
                <div>Tenants</div>
              </Link>
            </nav>

            {/* Información del usuario y toggle de modo oscuro */}
            <div className="flex items-center space-x-4">
              {/* Botón Ir a Home */}
              <button
                onClick={() => router.push('/dashboard')}
                className={`transition-all duration-200 shadow-sm p-1.5 sm:p-2 h-8 w-8 border rounded-md flex items-center justify-center hover:scale-105 ${isDarkMode
                    ? 'border-purple-500 text-purple-400 hover:bg-purple-900/20'
                    : 'border-purple-600 text-purple-600 hover:bg-purple-50'
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


