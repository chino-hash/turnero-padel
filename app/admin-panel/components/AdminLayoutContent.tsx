'use client'

import { ReactNode, useState } from "react"
import Link from "next/link"
import { Settings, Users, Calendar, BarChart3, Package, Sun, Moon, Trophy, Home, Building2, Menu } from "lucide-react"
import AdminTitleButton from "./AdminTitleButton"
import { useAppState } from "../../../components/providers/AppStateProvider"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../../components/ui/sheet"

interface AdminLayoutContentProps {
  children: ReactNode
}

const NAV_LINKS = [
  { href: "/admin-panel/admin/canchas", label: "Canchas", icon: Settings, testId: "admin-courts-link" },
  { href: "/admin-panel/admin/turnos", label: "Turnos", icon: Calendar, testId: "admin-bookings-link" },
  { href: "/admin-panel/admin/usuarios", label: "Usuarios", icon: Users, testId: "admin-users-link" },
  { href: "/admin-panel/estadisticas", label: "Estadísticas", icon: BarChart3, testId: "admin-stats-link" },
  { href: "/admin-panel/admin/productos", label: "Productos", icon: Package, testId: "admin-products-link" },
  { href: "/admin-panel/admin/torneos", label: "Torneo", icon: Trophy, testId: "admin-tournaments-link" },
] as const

export default function AdminLayoutContent({ children }: AdminLayoutContentProps) {
  const { isDarkMode, setIsDarkMode } = useAppState()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.isSuperAdmin || false
  const [openMobileNav, setOpenMobileNav] = useState(false)

  const baseClasses = "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
  const darkClasses = "text-gray-300 hover:text-blue-400 hover:bg-gray-700"
  const lightClasses = "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
  const activeDark = " text-blue-400 bg-gray-700"
  const activeLight = " text-blue-600 bg-blue-50"
  const linkClass = (href: string) =>
    `${baseClasses} ${isDarkMode ? darkClasses : lightClasses}${pathname.startsWith(href) ? (isDarkMode ? activeDark : activeLight) : ""}`

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#090E1A]' : 'bg-gray-50'}`}>
      <header
        className={`shadow-lg border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        role="banner"
        aria-label="Navegación del panel de administración"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 lg:gap-4 h-14 lg:h-20">
            {/* Logo y título: shrink-0 para que no invada el nav */}
            <div className="flex items-center gap-2 lg:gap-4 shrink-0 min-w-0">
              <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <AdminTitleButton />
              </div>
            </div>

            {/* Navegación desktop: justify-start + padding para que el icono de Canchas no se recorte */}
            <nav
              className="hidden lg:flex flex-1 items-center justify-start gap-1 overflow-x-auto min-w-0 pl-2"
              role="navigation"
              aria-labelledby="admin-nav-title"
              data-testid="admin-navigation"
            >
              <h2 id="admin-nav-title" className="sr-only">Navegación administrativa</h2>
              {NAV_LINKS.map(({ href, label, icon: Icon, testId }) => (
                <Link
                  key={href}
                  href={href}
                  className={`${linkClass(href)} shrink-0`}
                  aria-current={pathname.startsWith(href) ? "page" : undefined}
                  data-testid={testId}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden />
                  <span>{label}</span>
                </Link>
              ))}
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  className={`${linkClass("/super-admin")} shrink-0`}
                  aria-current={pathname.startsWith("/super-admin") ? "page" : undefined}
                  data-testid="super-admin-link"
                >
                  <Building2 className="w-5 h-5 shrink-0" aria-hidden />
                  <span>Super Admin</span>
                </Link>
              )}
            </nav>

            {/* Hamburger (móvil/tablet) + acciones */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Botón menú: visible solo < lg, área táctil >= 44px */}
              <button
                type="button"
                onClick={() => setOpenMobileNav(true)}
                className="lg:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200"
                aria-label="Abrir menú de navegación"
                data-testid="admin-mobile-menu-button"
              >
                <Menu className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              </button>

              {/* Botón Ir a Home */}
              <button
                onClick={() => router.push('/dashboard')}
                className={`flex items-center justify-center min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 rounded-md border transition-all duration-200 hover:scale-105 ${isDarkMode
                  ? 'border-blue-500 text-blue-400 hover:bg-blue-900/20'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
                title="Ir al sitio principal"
                aria-label="Ir al sitio principal"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Toggle de modo oscuro */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex items-center justify-center min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 rounded-md border transition-all duration-200 hover:scale-105 ${isDarkMode
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

      {/* Sheet: menú móvil/tablet (< lg) */}
      <Sheet open={openMobileNav} onOpenChange={setOpenMobileNav}>
        <SheetContent side="left" className="w-[280px] sm:max-w-sm flex flex-col p-0">
          <SheetHeader className="border-b px-4 py-4 text-left">
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4" aria-label="Navegación móvil">
            {NAV_LINKS.map(({ href, label, icon: Icon, testId }) => (
              <Link
                key={href}
                href={href}
                className={linkClass(href) + " min-h-[44px] justify-start"}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                data-testid={testId}
                onClick={() => setOpenMobileNav(false)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className={linkClass("/super-admin") + " min-h-[44px] justify-start"}
                aria-current={pathname.startsWith("/super-admin") ? "page" : undefined}
                data-testid="super-admin-link"
                onClick={() => setOpenMobileNav(false)}
              >
                <Building2 className="w-5 h-5 shrink-0" />
                <span>Super Admin</span>
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
