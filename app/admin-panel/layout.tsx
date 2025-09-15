import { auth } from "../../lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Settings, Users, Calendar, BarChart3, Package } from "lucide-react"
import AdminTitleButton from "./components/AdminTitleButton"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (!session.user?.isAdmin) {
    redirect("/")
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header principal con navegación integrada */}
      <header 
        className="bg-white shadow-lg border-b border-gray-200" 
        role="banner"
        aria-label="Navegación del panel de administración"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <AdminTitleButton />
              </div>
            </div>
            
            {/* Navegación principal en el header */}
            <nav 
              className="hidden md:flex items-center space-x-1" 
              role="navigation"
              aria-labelledby="admin-nav-title"
              data-testid="admin-navigation"
            >
              <h2 id="admin-nav-title" className="sr-only">Navegación administrativa</h2>
              
              <Link 
                href="/admin-panel/admin/canchas" 
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                data-testid="admin-courts-link"
              >
                <Settings className="w-5 h-5" />
                <div>Canchas</div>
              </Link>
              
              <Link 
                href="/admin-panel/admin/turnos" 
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                data-testid="admin-bookings-link"
              >
                <Calendar className="w-5 h-5" />
                <div>Turnos</div>
              </Link>
              
              <Link 
                href="/admin-panel/admin/usuarios" 
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                data-testid="admin-users-link"
              >
                <Users className="w-5 h-5" />
                <div>Usuarios</div>
              </Link>
              
              <Link 
                href="/admin-panel/admin/estadisticas" 
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                data-testid="admin-stats-link"
              >
                <BarChart3 className="w-5 h-5" />
                <div>Estadísticas</div>
              </Link>
              
              <Link 
                href="/admin-panel/admin/productos" 
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                data-testid="admin-products-link"
              >
                <Package className="w-5 h-5" />
                <div>Productos</div>
              </Link>
            </nav>
            
            {/* Información del usuario */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                <div className="font-medium">
                  {(() => {
                    const name = session.user?.name || session.user?.email || 'A';
                    const words = name.split(' ');
                    if (words.length > 1) {
                      return words.map(word => word.charAt(0).toUpperCase()).join('');
                    }
                    return name.charAt(0).toUpperCase() + (name.charAt(1) || '').toUpperCase();
                  })()}
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                <div className="text-white text-sm font-medium">
                  {(() => {
                    const name = session.user?.name || session.user?.email || 'A';
                    const words = name.split(' ');
                    if (words.length > 1) {
                      return words.map(word => word.charAt(0).toUpperCase()).join('');
                    }
                    return name.charAt(0).toUpperCase() + (name.charAt(1) || '').toUpperCase();
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navegación móvil */}
      <nav 
        className="md:hidden bg-white border-b border-gray-200 shadow-sm" 
        role="navigation"
        aria-label="Navegación móvil administrativa"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around py-3">
            <Link 
              href="/admin-panel/admin/canchas" 
              className="flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
              data-testid="admin-courts-link-mobile"
            >
              <Settings className="w-6 h-6" />
              <div>Canchas</div>
            </Link>
            
            <Link 
              href="/admin-panel/admin/turnos" 
              className="flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
              data-testid="admin-bookings-link-mobile"
            >
              <Calendar className="w-6 h-6" />
              <div>Turnos</div>
            </Link>
            
            <Link 
              href="/admin-panel/admin/usuarios" 
              className="flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
              data-testid="admin-users-link-mobile"
            >
              <Users className="w-6 h-6" />
              <div>Usuarios</div>
            </Link>
            
            <Link 
              href="/admin-panel/admin/estadisticas" 
              className="flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
              data-testid="admin-stats-link-mobile"
            >
              <BarChart3 className="w-6 h-6" />
              <div>Estadísticas</div>
            </Link>
            
            <Link 
              href="/admin-panel/admin/productos" 
              className="flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
              data-testid="admin-products-link-mobile"
            >
              <Package className="w-6 h-6" />
              <div>Productos</div>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Contenido principal */}
      <main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
        role="main"
        aria-labelledby="admin-title"
        data-testid="admin-main-content"
      >
        {children}
      </main>
    </div>
  )
}
