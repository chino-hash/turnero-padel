/**
 * ✅ PÁGINA DE GESTIÓN DE TURNOS - MODIFICACIONES PERMITIDAS
 * 
 * Esta página está dedicada exclusivamente a la gestión de turnos/reservas
 * del sistema. Cambios permitidos incluyen:
 * - Mejoras en la interfaz de gestión de turnos
 * - Nuevas funcionalidades de filtrado y búsqueda
 * - Optimizaciones de rendimiento
 * - Integración de nuevas herramientas de gestión
 * 
 * Última actualización: 2024-12-19
 */
'use client'

import { useState, useEffect } from 'react'
import AdminTurnos from '../../../../components/AdminTurnos'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Textarea } from '../../../../components/ui/textarea'
import { Calendar, Clock, Users, TrendingUp, Plus, User, Mail, Phone, FileText, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useRealTimeUpdates } from '../../../../hooks/useRealTimeUpdates'

export default function TurnosPage() {
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [availabilityData, setAvailabilityData] = useState({
    'Cancha 1': [true, false, true, false, true],
    'Cancha 2': [false, true, false, true, false],
    'Cancha 3': [true, true, false, false, true]
  })
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    courtName: '',
    date: '',
    timeRange: '',
    players: {
      player1: '',
      player2: '',
      player3: '',
      player4: ''
    },
    notes: ''
  })

  const courts = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4']
  const allTimeSlots = [
    '08:00 - 09:30', '09:30 - 11:00', '11:00 - 12:30',
    '12:30 - 14:00', '14:00 - 15:30', '15:30 - 17:00',
    '17:00 - 18:30', '18:30 - 20:00', '20:00 - 21:30',
    '21:30 - 23:00'
  ]

  // Función para obtener horarios disponibles
  const getAvailableTimeSlots = async (courtName: string, date: string) => {
    try {
      // Aquí iría la lógica real para consultar disponibilidad
      // Por ahora simulamos que algunos horarios están ocupados
      const occupiedSlots = ['09:30 - 11:00', '15:30 - 17:00', '20:00 - 21:30']
      const available = allTimeSlots.filter(slot => !occupiedSlots.includes(slot))
      setAvailableTimeSlots(available)
    } catch (error) {
      console.error('Error al obtener horarios disponibles:', error)
      setAvailableTimeSlots(allTimeSlots) // Fallback: mostrar todos
    }
  }

  // Función para actualizar disponibilidad de turnos
  const updateAvailability = async () => {
    setIsUpdating(true)
    try {
      // Simular llamada a API para obtener disponibilidad actualizada
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simular datos actualizados con cambios aleatorios
      const newAvailability = {
        'Cancha 1': Array.from({length: 5}, () => Math.random() > 0.4),
        'Cancha 2': Array.from({length: 5}, () => Math.random() > 0.4),
        'Cancha 3': Array.from({length: 5}, () => Math.random() > 0.4)
      }
      
      setAvailabilityData(newAvailability)
      setLastUpdated(new Date())
      
      // Mostrar notificación de actualización exitosa
      console.log('Disponibilidad actualizada exitosamente')
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Configurar actualizaciones en tiempo real
  useRealTimeUpdates({
    onSlotsUpdated: (data) => {
      console.log('Slots actualizados en tiempo real:', data)
      // Actualizar datos de disponibilidad automáticamente
      if (data && data.availability) {
        setAvailabilityData(data.availability)
        setLastUpdated(new Date())
      }
    },
    onConnect: () => {
      setIsRealTimeConnected(true)
      console.log('Conexión en tiempo real establecida')
    },
    onDisconnect: () => {
      setIsRealTimeConnected(false)
      console.log('Conexión en tiempo real perdida')
    },
    onError: (error) => {
      setIsRealTimeConnected(false)
      console.error('Error en conexión en tiempo real:', error)
    }
  })

  // Efecto para actualizar horarios disponibles cuando cambia cancha o fecha
  useEffect(() => {
    if (formData.courtName && formData.date) {
      getAvailableTimeSlots(formData.courtName, formData.date)
    } else {
      setAvailableTimeSlots([])
    }
  }, [formData.courtName, formData.date])

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('players.')) {
      const playerField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [playerField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleCreateBooking = async () => {
    try {
      // Aquí iría la lógica para crear la reserva
      console.log('Creando reserva:', formData)
      
      // Simular creación exitosa
      alert('Reserva creada exitosamente')
      setShowCreateBookingModal(false)
      
      // Resetear formulario
      setFormData({
        userName: '',
        userEmail: '',
        userPhone: '',
        courtName: '',
        date: '',
        timeRange: '',
        players: {
          player1: '',
          player2: '',
          player3: '',
          player4: ''
        },
        notes: ''
      })
    } catch (error) {
      console.error('Error al crear reserva:', error)
      alert('Error al crear la reserva')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header de la página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600 mt-2">
            Administra todas las reservas y turnos del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowCreateBookingModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ayer
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Turnos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              En las próximas 2 horas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">
              Promedio del día
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Con reservas activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Componente principal de gestión de turnos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lista de Turnos y Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTurnos />
        </CardContent>
      </Card>

      {/* Modal para crear nueva reserva */}
      <Dialog open={showCreateBookingModal} onOpenChange={setShowCreateBookingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5" />
              Nueva Reserva - Administrador
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8 px-1">
            {/* Información del cliente */}
            <div className="space-y-5 bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <User className="w-5 h-5" />
                Información del Cliente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-sm font-medium text-gray-700">Nombre Completo *</Label>
                  <Input
                    id="userName"
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="userEmail" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) => handleInputChange('userEmail', e.target.value)}
                    placeholder="juan@email.com"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="userPhone" className="text-sm font-medium text-gray-700">Teléfono *</Label>
                  <Input
                    id="userPhone"
                    value={formData.userPhone}
                    onChange={(e) => handleInputChange('userPhone', e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    required
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Información de la reserva */}
            <div className="space-y-5 bg-blue-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-800">
                <Calendar className="w-5 h-5" />
                Detalles de la Reserva
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="courtName" className="text-sm font-medium text-gray-700">Cancha *</Label>
                  <Select value={formData.courtName} onValueChange={(value) => handleInputChange('courtName', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccionar cancha" />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map((court) => (
                        <SelectItem key={court} value={court}>
                          {court}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeRange" className="text-sm font-medium text-gray-700">
                    Horario * 
                    {availableTimeSlots.length === 0 && formData.courtName && formData.date && (
                      <span className="text-xs text-orange-600 ml-1">(Selecciona cancha y fecha)</span>
                    )}
                  </Label>
                  <Select 
                    value={formData.timeRange} 
                    onValueChange={(value) => handleInputChange('timeRange', value)}
                    disabled={availableTimeSlots.length === 0}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={
                        availableTimeSlots.length === 0 
                          ? "Primero selecciona cancha y fecha" 
                          : "Seleccionar horario disponible"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          <div className="flex items-center justify-between w-full">
                            <span>{slot}</span>
                            <span className="text-xs text-green-600 ml-2">✓ Disponible</span>
                          </div>
                        </SelectItem>
                      ))}
                      {availableTimeSlots.length === 0 && formData.courtName && formData.date && (
                        <SelectItem value="" disabled>
                          <span className="text-gray-500">No hay horarios disponibles</span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Jugadores */}
            <div className="space-y-5 bg-green-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-800">
                <Users className="w-5 h-5" />
                Jugadores
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="player1" className="text-sm font-medium text-gray-700">Jugador 1 *</Label>
                  <Input
                    id="player1"
                    value={formData.players.player1}
                    onChange={(e) => handleInputChange('players.player1', e.target.value)}
                    placeholder="Nombre del jugador 1"
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="player2" className="text-sm font-medium text-gray-700">Jugador 2</Label>
                  <Input
                    id="player2"
                    value={formData.players.player2}
                    onChange={(e) => handleInputChange('players.player2', e.target.value)}
                    placeholder="Nombre del jugador 2"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="player3" className="text-sm font-medium text-gray-700">Jugador 3</Label>
                  <Input
                    id="player3"
                    value={formData.players.player3}
                    onChange={(e) => handleInputChange('players.player3', e.target.value)}
                    placeholder="Nombre del jugador 3"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="player4" className="text-sm font-medium text-gray-700">Jugador 4</Label>
                  <Input
                    id="player4"
                    value={formData.players.player4}
                    onChange={(e) => handleInputChange('players.player4', e.target.value)}
                    placeholder="Nombre del jugador 4"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Notas adicionales */}
            <div className="space-y-5 bg-yellow-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-800">
                <FileText className="w-5 h-5" />
                Notas adicionales
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Observaciones</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Agregar notas o comentarios sobre la reserva..."
                  rows={3}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateBookingModal(false)}
                className="px-6 py-2.5 h-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateBooking}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 h-auto"
                disabled={!formData.userName || !formData.userPhone || !formData.courtName || !formData.date || !formData.timeRange || !formData.players.player1}
              >
                Crear Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sección de Disponibilidad de Turnos */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Disponibilidad de Turnos - Próximos 4 Días
              </div>
              <div className="flex items-center gap-3">
                {/* Indicador de conexión en tiempo real */}
                <div className="flex items-center gap-2 text-xs">
                  {isRealTimeConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span className="text-green-600">En vivo</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-orange-500" />
                      <span className="text-orange-600">Desconectado</span>
                    </>
                  )}
                </div>
                
                {/* Indicador de última actualización */}
                {lastUpdated && (
                  <span className="text-xs text-gray-500">
                    Actualizado: {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                
                {/* Botón de actualización manual */}
                <button
                  onClick={updateAvailability}
                  disabled={isUpdating}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isUpdating
                      ? 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                      : isRealTimeConnected
                      ? 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                      : 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300'
                  }`}
                  title={isRealTimeConnected ? 'Actualizar manualmente' : 'Actualizar (conexión perdida)'}
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                  {isUpdating ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-4 min-w-[800px]">
                {/* Columna de horarios */}
                <div className="space-y-3">
                  <div className="h-12 flex items-center justify-center font-semibold text-gray-700 bg-gray-100 rounded-lg">
                    Horarios
                  </div>
                  {[
                    '14:00 - 15:30',
                    '15:30 - 17:00', 
                    '17:00 - 18:30',
                    '18:30 - 20:00',
                    '20:00 - 21:30'
                  ].map((time, index) => (
                    <div key={index} className="h-16 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-50 rounded-lg border">
                      {time}
                    </div>
                  ))}
                </div>

                {/* Columnas de días */}
                {(() => {
                  const today = new Date()
                  const days = []
                  
                  for (let i = 0; i < 4; i++) {
                    const date = new Date(today)
                    date.setDate(today.getDate() + i)
                    
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' })
                    const dayNumber = date.getDate()
                    const month = date.toLocaleDateString('es-ES', { month: 'short' })
                    
                    days.push(
                      <div key={i} className="space-y-3">
                        <div className="h-12 flex flex-col items-center justify-center font-semibold text-gray-700 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-xs uppercase">{dayName}</span>
                          <span className="text-sm">{dayNumber} {month}</span>
                        </div>
                        
                        {/* Slots para cada cancha en este día */}
                        {[
                          { court: 'Cancha 1', slots: availabilityData['Cancha 1'] },
                          { court: 'Cancha 2', slots: availabilityData['Cancha 2'] },
                          { court: 'Cancha 3', slots: availabilityData['Cancha 3'] }
                        ].map((courtData, courtIndex) => (
                          <div key={courtIndex} className="space-y-1">
                            <div className="text-xs font-medium text-gray-600 text-center mb-1">
                              {courtData.court}
                            </div>
                            {courtData.slots.map((isAvailable, slotIndex) => (
                              <div
                                key={slotIndex}
                                className={`h-4 rounded border ${
                                  isAvailable
                                    ? 'bg-green-100 border-green-300'
                                    : 'bg-red-100 border-red-300'
                                } flex items-center justify-center`}
                              >
                                <span className={`text-xs ${
                                  isAvailable ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {isAvailable ? '✓' : '✗'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )
                  }
                  
                  return days
                })()}
              </div>
            </div>
            
            {/* Leyenda */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center">
                  <span className="text-xs text-green-700">✓</span>
                </div>
                <span className="text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                  <span className="text-xs text-red-700">✗</span>
                </div>
                <span className="text-gray-600">Ocupado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}