import { auth } from '../lib/auth'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { signOut } from '../lib/auth'

export default async function TurneroAppServer() {
  const session = await auth()
  
  // La autenticación se maneja en el layout, pero obtenemos datos del usuario
  const user = session?.user
  const isAdmin = session?.user?.isAdmin || false
  const isSuperAdmin = session?.user?.isSuperAdmin || false

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎾 Turnero de Padel
              </h1>
              <p className="text-sm text-gray-600">
                Bienvenido, {user?.name || user?.email}
                {isSuperAdmin && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Super Admin</span>}
                {isAdmin && !isSuperAdmin && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Admin</span>}
              </p>
            </div>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline">
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-4 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800">
                  🎉 ¡Migración completada! Ahora usando layouts de servidor con Auth.js v5.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
