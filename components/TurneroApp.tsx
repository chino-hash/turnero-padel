/*
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * Este archivo es crítico para usuarios finales y no debe modificarse sin autorización.
 * Cualquier cambio requiere un proceso formal de revisión y aprobación.
 * Contacto: Administrador del Sistema
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function TurneroApp() {
  const { user, isAdmin, signOut } = useAuth()
  const [courts, setCourts] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar canchas (vista pública deduplicada incluso si eres admin)
      const courtsResponse = await fetch('/api/courts?view=public')
      if (courtsResponse.ok) {
        const courtsData = await courtsResponse.json()
        setCourts(courtsData)
      }

      // Cargar reservas del usuario
      const bookingsResponse = await fetch('/api/bookings/user')
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        setBookings(bookingsData)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
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
                  {isAdmin && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Admin</span>}
                </p>
              </div>
              <Button onClick={handleSignOut} variant="outline">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Canchas Disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle>🏟️ Canchas Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  {courts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courts.map((court: any) => {
                        let features: string[] = []
                        try {
                          if (Array.isArray(court.features)) features = court.features
                          else if (typeof court.features === 'string') features = JSON.parse(court.features || '[]')
                        } catch {}
                        const isIndoor = features.some((f: string) => /indoor|covered|climate/i.test(f))
                        const basePrice = court.basePrice ?? court.base_price ?? 0
                        const price = Math.round(basePrice / 4)
                        return (
                          <div key={court.id} className="rounded-xl border p-4 flex flex-col gap-2 bg-white">
                            <span className="text-[11px] text-gray-600">{isIndoor ? 'Indoor' : ''}</span>
                            {/* Mini padel court 2:1 */}
                            <div className="relative w-full rounded-md overflow-hidden border" style={{ aspectRatio: '2 / 1' }}>
                              {(() => {
                                // Usar paleta por nombre si existe en el nombre
                                const name: string = (court.name || '').toLowerCase()
                                const palette = name.includes('a') ? { from: '#8b5cf6', to: '#a78bfa' }
                                  : name.includes('b') ? { from: '#ef4444', to: '#f87171' }
                                  : { from: '#22c55e', to: '#4ade80' }
                                const background = `linear-gradient(135deg, ${palette.from}, ${palette.to}),
                                  repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 6px),
                                  repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 8px)`
                                return (
                                  <div className="absolute inset-0" style={{ background }}>
                                    {/* Paredes */}
                                    <div className="absolute inset-1 rounded-sm border-2 border-white/80 shadow-inner" />
                                    {/* Red */}
                                    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px] bg-white/90" />
                                    {/* Líneas: dos horizontales + una vertical central */}
                                    <div className="absolute left-3 right-3 top-1/3 h-[2px] bg-white/70" />
                                    <div className="absolute left-3 right-3 bottom-1/3 h-[2px] bg-white/70" />
                                    <div className="absolute top-3 bottom-3 left-1/2 -translate-x-1/2 w-[2px] bg-white/70" />
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="flex items-end justify-between">
                              <span className="text-xl font-bold text-emerald-600">${price.toLocaleString()}</span>
                              <span className="text-xs text-gray-500">por persona</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay canchas disponibles</p>
                  )}
                </CardContent>
              </Card>

              {/* Mis Reservas */}
              <Card>
                <CardHeader>
                  <CardTitle>📅 Mis Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length > 0 ? (
                    <div className="space-y-2">
                      {bookings.slice(0, 3).map((booking: any) => (
                        <div key={booking.id} className="p-3 bg-gray-50 rounded">
                          <h4 className="font-medium">{booking.court?.name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.startTime} - {booking.endTime}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No tienes reservas</p>
                  )}
                </CardContent>
              </Card>

              {/* Panel de Admin */}
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle>⚙️ Panel de Administración</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        Gestionar Canchas
                      </Button>
                      <Button className="w-full" variant="outline">
                        Ver Todas las Reservas
                      </Button>
                      <Button className="w-full" variant="outline">
                        Gestionar Usuarios
                      </Button>
                      <Button className="w-full" variant="outline">
                        Reportes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>⚡ Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button className="w-full">
                      Nueva Reserva
                    </Button>
                    <Button className="w-full" variant="outline">
                      Ver Calendario
                    </Button>
                    <Button className="w-full" variant="outline">
                      Mi Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Estado de la migración */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>🚀 Estado de la Migración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl">✅</div>
                    <p className="text-sm font-medium">NextAuth.js</p>
                    <p className="text-xs text-gray-600">Configurado</p>
                  </div>
                  <div>
                    <div className="text-2xl">✅</div>
                    <p className="text-sm font-medium">Prisma</p>
                    <p className="text-xs text-gray-600">Configurado</p>
                  </div>
                  <div>
                    <div className="text-2xl">✅</div>
                    <p className="text-sm font-medium">Google OAuth</p>
                    <p className="text-xs text-gray-600">Funcionando</p>
                  </div>
                  <div>
                    <div className="text-2xl">✅</div>
                    <p className="text-sm font-medium">Admin System</p>
                    <p className="text-xs text-gray-600">Activo</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-800">
                    🎉 ¡Migración completada! Supabase ha sido reemplazado exitosamente por NextAuth.js + PostgreSQL + Prisma.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
