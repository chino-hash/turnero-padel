'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select'
import { Input } from '../../../../components/ui/input'
import { Button } from '../../../../components/ui/button'
import { Textarea } from '../../../../components/ui/textarea'
import { Calendar } from '../../../../components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover'
import { Badge } from '../../../../components/ui/badge'
import { Separator } from '../../../../components/ui/separator'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import {
  CalendarIcon,
  Clock,
  Users,
  MapPin,
  Plus,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import type { Booking, Court, User } from '../../../../types/booking'

const bookingSchema = z.object({
  courtId: z.string().min(1, 'Selecciona una cancha'),
  bookingDate: z.date({
    message: 'Selecciona una fecha',
  }),
  startTime: z.string().min(1, 'Selecciona hora de inicio'),
  endTime: z.string().min(1, 'Selecciona hora de fin'),
  userId: z.string().min(1, 'Selecciona un cliente'),
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
  players: z.array(z.object({
    name: z.string().min(1, 'Nombre requerido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
  })).optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking?: Booking | null
  courts: Court[]
  users: User[]
  onSubmit: (data: BookingFormData) => Promise<void>
  loading?: boolean
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
]

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmada', color: 'bg-green-100 text-green-800' },
  { value: 'ACTIVE', label: 'Activa', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Completada', color: 'bg-gray-100 text-gray-800' },
  { value: 'CANCELLED', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
]

export function BookingForm({
  open,
  onOpenChange,
  booking,
  courts,
  users,
  onSubmit,
  loading = false,
}: BookingFormProps) {
  const [players, setPlayers] = useState<Array<{ name: string; email?: string; phone?: string }>>(
    booking?.players || [{ name: '', email: '', phone: '' }]
  )
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      courtId: booking?.courtId || '',
      bookingDate: booking?.bookingDate ? new Date(booking.bookingDate) : undefined,
      startTime: booking?.startTime || '',
      endTime: booking?.endTime || '',
      userId: booking?.userId || '',
      status: booking?.status || 'PENDING',
      notes: booking?.notes || '',
      players: booking?.players || [],
    },
  })

  const watchedDate = form.watch('bookingDate')
  const watchedCourtId = form.watch('courtId')
  const watchedStartTime = form.watch('startTime')

  // Simular verificación de disponibilidad
  useEffect(() => {
    if (watchedDate && watchedCourtId) {
      // Aquí iría la lógica para verificar disponibilidad real
      // Por ahora simulamos que algunos slots están ocupados
      const occupiedSlots = ['10:00', '14:00', '18:00']
      const available = timeSlots.filter(slot => !occupiedSlots.includes(slot))
      setAvailableSlots(available)
    }
  }, [watchedDate, watchedCourtId])

  // Filtrar horarios de fin basados en el horario de inicio
  const getEndTimeOptions = () => {
    if (!watchedStartTime) return []
    
    const startIndex = timeSlots.indexOf(watchedStartTime)
    if (startIndex === -1) return []
    
    // Permitir reservas de 1 a 4 horas
    return timeSlots.slice(startIndex + 1, startIndex + 9).filter(slot => 
      availableSlots.includes(slot)
    )
  }

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, { name: '', email: '', phone: '' }])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, field: string, value: string) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value }
    setPlayers(updatedPlayers)
  }

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setSubmitting(true)
      const formData = {
        ...data,
        players: players.filter(player => player.name.trim() !== ''),
      }
      await onSubmit(formData)
      form.reset()
      setPlayers([{ name: '', email: '', phone: '' }])
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar reserva:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !submitting) {
      form.reset()
      setPlayers([{ name: '', email: '', phone: '' }])
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {booking ? 'Editar Reserva' : 'Nueva Reserva'}
          </DialogTitle>
          <DialogDescription>
            {booking 
              ? 'Modifica los detalles de la reserva existente.'
              : 'Completa los datos para crear una nueva reserva.'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="courtId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Cancha
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una cancha" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courts.map((court) => (
                            <SelectItem key={court.id} value={court.id}>
                              {court.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Cliente
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fecha y horarios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bookingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Fecha
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy', { locale: es })
                              ) : (
                                <span>Selecciona fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Hora inicio
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Hora inicio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora fin</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Hora fin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getEndTimeOptions().map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Estado */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={status.color}>
                                {status.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Jugadores */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Jugadores ({players.length}/4)
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPlayer}
                    disabled={players.length >= 4}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>

                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          placeholder="Nombre *"
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={player.email || ''}
                          onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                        />
                        <Input
                          placeholder="Teléfono"
                          value={player.phone || ''}
                          onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                        />
                      </div>
                      {players.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePlayer(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Información adicional sobre la reserva..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Información adicional o comentarios sobre la reserva.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={submitting || loading}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {booking ? 'Actualizar' : 'Crear'} Reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}