/**
 * Página de gestión de turnos del panel de administración
 * Permite ver, crear, editar y eliminar reservas
 * Incluye funcionalidad de tiempo real para actualizaciones automáticas
 */
'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import AdminAvailabilityGrid from '../../../../components/admin/AdminAvailabilityGrid'
import { Button } from '../../../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../components/ui/dropdown-menu'
import { Calendar, Clock, Users, TrendingUp, Plus, User, FileText } from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { useBookings } from '../../../../hooks/useBookings'
import { useCourtPrices } from '../../../../hooks/useCourtPrices'

// Importación dinámica para evitar problemas de prerenderización
// Se asegura de resolver explícitamente el export default del módulo
const AdminTurnos = dynamic(() => import('../../../../components/AdminTurnos').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
    </div>
  )
})

export default function TurnosPage() {
  const { isAuthenticated, isAdmin, user, loading: authLoading } = useAuth()
  const { bookings, stats, loading: bookingsLoading, checkAvailability, getAvailabilitySlots, createBooking } = useBookings({ autoFetch: isAuthenticated })

  const { courts, loading: courtsLoading } = useCourtPrices({ publicView: true })
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isTimeAvailable, setIsTimeAvailable] = useState<boolean | null>(null)
  
  const formatDateYMD = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const ymdToDate = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number)
    return new Date(y, (m as number) - 1, d as number)
  }
  
  // Anchura exacta de los dropdowns (igual a la casilla de selección)
  const dateTriggerRef = useRef<HTMLButtonElement>(null)
  const timeTriggerRef = useRef<HTMLButtonElement>(null)
  const [dateMenuWidth, setDateMenuWidth] = useState<number | undefined>(undefined)
  const [timeMenuWidth, setTimeMenuWidth] = useState<number | undefined>(undefined)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [recurringWeekday, setRecurringWeekday] = useState<number>(new Date().getDay())
  const [recurringStartsAt, setRecurringStartsAt] = useState<string>(formatDateYMD(new Date()))
  const [recurringEndsAt, setRecurringEndsAt] = useState<string>('')
  const computeNextDateForWeekday = (weekday: number, startYmd: string) => {
    const today = new Date(); today.setHours(0,0,0,0)
    const start = ymdToDate(startYmd)
    const base = today < start ? start : today
    const diff = (weekday - base.getDay() + 7) % 7
    const target = new Date(base); target.setDate(base.getDate() + diff)
    return formatDateYMD(target)
  }

  const handleSkipThisWeek = async () => {
    try {
      if (!isRecurring) return
      if (!formData.courtName || !formData.timeRange) {
        alert('Completa cancha y horario')
        return
      }
      const courtId = findCourtIdByName(formData.courtName)
      if (!courtId) {
        alert('Cancha inválida')
        return
      }
      const [startTime, endTime] = formData.timeRange.split(' - ')
      const startsAt = recurringStartsAt
      const endsAt = recurringEndsAt || undefined
      const weekday = recurringWeekday

      const createRuleRes = await fetch('/api/recurring-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ courtId, userId: user?.id, weekday, startTime, endTime, startsAt, endsAt, notes: formData.notes || undefined })
      })
      if (!createRuleRes.ok) {
        const data = await createRuleRes.json().catch(() => ({}))
        alert(`Error creando turno fijo: ${data?.error || createRuleRes.status}`)
        return
      }
      const ruleData = await createRuleRes.json()
      const recurringId = ruleData?.data?.id as string
      const targetDate = computeNextDateForWeekday(weekday, startsAt)

      const skipRes = await fetch('/api/recurring-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ recurringId, date: targetDate, type: 'SKIP', reason: 'Baja puntual (esta semana)' })
      })
      if (!skipRes.ok) {
        const data = await skipRes.json().catch(() => ({}))
        alert(`Error dando de baja esta semana: ${data?.error || skipRes.status}`)
        return
      }
      alert('Turno fijo creado y dado de baja para esta semana')
      setShowCreateBookingModal(false)
    } catch (err) {
      console.error(err)
      alert('Error procesando baja semanal')
    }
  }

  useEffect(() => {
    const btn = dateTriggerRef.current
    if (!btn) return
    setDateMenuWidth(btn.offsetWidth)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width
        if (w) setDateMenuWidth(w)
      })
      ro.observe(btn)
      return () => ro.disconnect()
    }
  }, [])

  useEffect(() => {
    const btn = timeTriggerRef.current
    if (!btn) return
    setTimeMenuWidth(btn.offsetWidth)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width
        if (w) setTimeMenuWidth(w)
      })
      ro.observe(btn)
      return () => ro.disconnect()
    }
  }, [])

  // Estados del formulario
  const [formData, setFormData] = useState({
  userName: '',
  courtName: '',
  date: formatDateYMD(new Date()),
  timeRange: '',
  players: {
    player1: '',
    player2: '',
    player3: '',
    player4: ''
  },
  notes: ''
})

  // Canchas provistas por useCourtPrices (vista pública)
  // const courts = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4']
  const allTimeSlots = [
    '08:00 - 09:30', '09:30 - 11:00', '11:00 - 12:30',
    '12:30 - 14:00', '14:00 - 15:30', '15:30 - 17:00',
    '17:00 - 18:30', '18:30 - 20:00', '20:00 - 21:30',
    '21:30 - 23:00'
  ]

  const todayKey = new Date().toISOString().split('T')[0]
  const turnosHoy = stats?.byDay?.[todayKey] ?? 0
  const proximosTurnos = useMemo(() => {
    return (bookings || []).filter((b) => {
      try {
        const dt = new Date(`${(b as any).bookingDate}T${(b as any).startTime}:00`)
        const now = new Date()
        const diff = dt.getTime() - now.getTime()
        return diff > 0 && diff <= 2 * 60 * 60 * 1000
      } catch {
        return false
      }
    }).length
  }, [bookings])
  const ocupacionRate = Math.round(((stats?.occupancyRate ?? 0) as number) * 100)

  // Función auxiliar para obtener courtId por nombre
  const findCourtIdByName = (name: string) => courts.find(c => c.name === name)?.id

  const getAvailableTimeSlots = async (courtName: string, date: string) => {
    try {
      const courtId = findCourtIdByName(courtName)
      if (!courtId) {
        setAvailableTimeSlots(allTimeSlots)
        return
      }
      const slots = await getAvailabilitySlots(courtId, date, 90)
      if (slots && Array.isArray(slots)) {
        const available = slots.filter(s => s.available).map(s => `${s.startTime} - ${s.endTime}`)
        setAvailableTimeSlots(available.length ? available : allTimeSlots)
      } else {
        setAvailableTimeSlots(allTimeSlots)
      }
    } catch (error) {
      setAvailableTimeSlots(allTimeSlots)
    }
  }


  


  const handleCreateBooking = async () => {
    try {
      if (!formData.courtName || !formData.date || !formData.timeRange) {
        alert('Completa cancha, fecha y horario')
        return
      }
      const courtId = findCourtIdByName(formData.courtName)
      if (!courtId) {
        alert('Cancha inválida')
        return
      }
      const [startTime, endTime] = formData.timeRange.split(' - ')
      const players = [formData.players.player1, formData.players.player2, formData.players.player3, formData.players.player4]
        .map((name, idx) => name?.trim() ? ({ playerName: name.trim(), position: idx + 1 }) : null)
        .filter(Boolean)
      if (isRecurring) {
        // Crear regla de turno fijo (RecurringBooking)
        const weekday = recurringWeekday
        const startsAt = recurringStartsAt
        const endsAt = recurringEndsAt || undefined
        const res = await fetch('/api/recurring-bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ courtId, userId: user?.id, weekday, startTime, endTime, startsAt, endsAt, notes: formData.notes || undefined })
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          alert(`Error creando turno fijo: ${data?.error || res.status}`)
          return
        }
        alert('Turno fijo creado exitosamente')
        setShowCreateBookingModal(false)
      } else {
        // Crear reserva puntual
        const payload = {
          courtId,
          bookingDate: formData.date,
          startTime,
          endTime,
          notes: formData.notes || undefined,
          userId: user?.id,
          players: players as any
        }
        const created = await createBooking(payload as any)
        if (created) {
          alert('Reserva creada exitosamente')
          setShowCreateBookingModal(false)
          setFormData({
            userName: '',
            courtName: '',
            date: formatDateYMD(new Date()),
            timeRange: '',
            players: { player1: '', player2: '', player3: '', player4: '' },
            notes: ''
          })
        } else {
          alert('No se pudo crear la reserva')
        }
      }
    } catch (error) {
      console.error('Error al crear reserva:', error)
      alert('Error al crear la reserva')
    }
  }

  

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const targetDate = isRecurring ? computeNextDateForWeekday(recurringWeekday, recurringStartsAt) : formData.date
      if (!formData.courtName || !formData.timeRange || (!isRecurring && !formData.date)) {
        if (!cancelled) setIsTimeAvailable(null)
        return
      }
      const courtId = findCourtIdByName(formData.courtName)
      if (!courtId) {
        if (!cancelled) setIsTimeAvailable(null)
        return
      }
      const [start, end] = formData.timeRange.split(' - ')
      try {
        const resp = await checkAvailability({ courtId, date: targetDate, startTime: start, endTime: end })
        if (!cancelled) setIsTimeAvailable(!!resp?.available)
      } catch (e) {
        if (!cancelled) setIsTimeAvailable(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [formData.courtName, formData.date, formData.timeRange, courts, isRecurring, recurringWeekday, recurringStartsAt])

  useEffect(() => {
    let cancelled = false
    const targetDate = isRecurring ? computeNextDateForWeekday(recurringWeekday, recurringStartsAt) : formData.date
    const run = async () => {
      if (formData.courtName && (isRecurring || formData.date)) {
        await getAvailableTimeSlots(formData.courtName, targetDate)
        if (cancelled) return
      } else {
        if (!cancelled) {
          setAvailableTimeSlots([])
          setIsTimeAvailable(null)
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [formData.courtName, formData.date, isRecurring, recurringWeekday, recurringStartsAt])

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



  return (
    <div className="space-y-8">
      {/* Header de la página (misma posición que el resto de pestañas) */}
      <div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">Gestión de Turnos</h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">Crea, edita y administra reservas de canchas.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => setShowCreateBookingModal(true)}
            disabled={!isAdmin}
            title={!isAdmin ? 'Disponible solo para Administradores' : 'Crear nueva reserva'}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
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
            <div className="text-2xl font-bold">{bookingsLoading ? '...' : turnosHoy}</div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {bookingsLoading ? 'Cargando' : '+2 desde ayer'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Turnos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsLoading ? '...' : proximosTurnos}</div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {bookingsLoading ? 'Cargando' : 'En las próximas 2 horas'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsLoading ? '...' : `${ocupacionRate}%`}</div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {bookingsLoading ? 'Cargando' : 'Promedio del día'}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Disponibilidad de canchas (semana)</CardTitle>
          <CardDescription>
            🗓️ Por día verás 3 círculos; cada uno representa una cancha: 1° cancha 1, 2° cancha 2, 3° cancha 3.<br />
            Estado: <span className="text-green-600">🟢 Libre</span>, <span className="text-red-600">🔴 Ocupado</span>, <span className="text-yellow-600">🟡 Pendiente</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAvailabilityGrid />
        </CardContent>
      </Card>

      

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
              
              <div className="grid grid-cols-1 gap-5">
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
              </div>
            </div>

            {/* Opcional: Turno Fijo (Regla recurrente) */}
            <div className="space-y-5 bg-purple-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-800">
                <FileText className="w-5 h-5" />
                Turno Fijo (Opcional)
              </h3>
              <p className="text-xs text-purple-700">Si seleccionas esta opción, se creará una regla recurrente que bloqueará este horario cada semana hasta que se dé de baja.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Activar turno fijo</Label>
                  <Select value={isRecurring ? 'si' : 'no'} onValueChange={(v) => setIsRecurring(v === 'si')}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="si">Sí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Día de la semana</Label>
                  <Select value={String(recurringWeekday)} onValueChange={(v) => setRecurringWeekday(Number(v))} disabled={!isRecurring}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Domingo</SelectItem>
                      <SelectItem value="1">Lunes</SelectItem>
                      <SelectItem value="2">Martes</SelectItem>
                      <SelectItem value="3">Miércoles</SelectItem>
                      <SelectItem value="4">Jueves</SelectItem>
                      <SelectItem value="5">Viernes</SelectItem>
                      <SelectItem value="6">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Inicio</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="h-11 w-full justify-between px-3 rounded-lg" disabled={!isRecurring}>
                        <span>{ymdToDate(recurringStartsAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <Calendar className="w-4 h-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-44 overflow-y-auto p-1">
                      {Array.from({ length: 30 }, (_, i) => {
                        const d = new Date(); d.setDate(d.getDate() + i)
                        const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                        const value = formatDateYMD(d)
                        const isSelected = recurringStartsAt === value
                        return (
                          <DropdownMenuItem key={i} onSelect={() => setRecurringStartsAt(value)} className={`${isSelected ? 'bg-purple-600 text-white' : ''} h-10 px-3 text-sm`}>
                            {label}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-sm font-medium text-gray-700">Fin (opcional)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="h-11 w-full justify-between px-3 rounded-lg" disabled={!isRecurring}>
                        <span>{recurringEndsAt ? ymdToDate(recurringEndsAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha fin'}</span>
                        <Calendar className="w-4 h-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-44 overflow-y-auto p-1">
                      <DropdownMenuItem onSelect={() => setRecurringEndsAt('')} className="h-10 px-3 text-sm">Sin fecha fin</DropdownMenuItem>
                      {Array.from({ length: 180 }, (_, i) => {
                        const d = new Date(); d.setDate(d.getDate() + i + 30)
                        const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                        const value = formatDateYMD(d)
                        const isSelected = recurringEndsAt === value
                        return (
                          <DropdownMenuItem key={i} onSelect={() => setRecurringEndsAt(value)} className={`${isSelected ? 'bg-purple-600 text-white' : ''} h-10 px-3 text-sm`}>
                            {label}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Información de la reserva */}
            <div className={`space-y-5 bg-blue-50 p-5 rounded-lg ${isRecurring ? 'opacity-60' : ''}`} aria-disabled={isRecurring}>
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
                       {courts?.length ? courts.map((court) => (
                         <SelectItem key={court.id} value={court.name}>
                           {court.name}
                         </SelectItem>
                       )) : (
                         <SelectItem value="" disabled>
                           {courtsLoading ? 'Cargando canchas...' : 'No hay canchas activas'}
                         </SelectItem>
                       )}
                     </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">Fecha *</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        ref={dateTriggerRef}
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-between px-3 rounded-lg"
                        aria-haspopup="menu"
                        aria-label="Seleccionar fecha"
                        disabled={isRecurring}
                      >
                        <span>
                          {ymdToDate(formData.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <Calendar className="w-4 h-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent style={{ width: dateMenuWidth }} className="max-h-44 overflow-y-auto p-1">
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() + i)
                        const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                        const value = formatDateYMD(d)
                        const isSelected = formData.date === value
                        return (
                          <DropdownMenuItem
                            key={i}
                            onSelect={() => handleInputChange('date', value)}
                            className={`${isSelected ? 'bg-blue-600 text-white' : ''} h-10 px-3 text-sm`}
                          >
                            {label}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeRange" className="text-sm font-medium text-gray-700">Horario *</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        ref={timeTriggerRef}
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-between px-3 rounded-lg"
                        aria-haspopup="menu"
                        aria-label="Horarios"
                      >
                        <span>Horarios</span>
                        <Clock className="w-4 h-4 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent style={{ width: timeMenuWidth }} className="max-h-44 overflow-y-auto p-1">
                      {availableTimeSlots.length ? (
                        availableTimeSlots.map((slot) => (
                          <DropdownMenuItem
                            key={slot}
                            onSelect={() => handleInputChange('timeRange', slot)}
                            className={`${formData.timeRange === slot ? 'bg-green-600 text-white' : ''} h-10 px-3 text-sm`}
                          >
                            {slot}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          {isRecurring ? (formData.courtName ? 'No hay horarios disponibles' : 'Seleccione cancha') : (formData.courtName && formData.date ? 'No hay horarios disponibles' : 'Seleccione cancha y fecha')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
              {isRecurring && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipThisWeek}
                  className="px-6 py-2.5 h-auto text-purple-700 border-purple-300 hover:bg-purple-50"
                  title="Dar de baja esta semana"
                >
                  Dar baja semana
                </Button>
              )}
              <Button
                 type="button"
                 onClick={handleCreateBooking}
                 disabled={!formData.userName || !formData.courtName || !formData.timeRange || (isRecurring ? false : (!formData.date || isTimeAvailable !== true))}
                 className="w-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
               >
                 {isRecurring ? 'Crear Turno Fijo' : 'Crear Reserva'}
               </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sección de Disponibilidad de Turnos eliminada según requerimiento */}
    </div>
  )
}
