'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  court: string
  status: 'confirmado' | 'pendiente' | 'cancelado' | 'completado'
  players: number
  price: number
}

interface CalendarModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  events?: CalendarEvent[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onOpenChange,
  events = [],
  selectedDate = new Date(),
  onDateSelect
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  // Efecto para enfocar automáticamente el contenido principal
  useEffect(() => {
    if (isOpen) {
      // El enfoque automático es manejado por Radix UI Dialog
      const timer = setTimeout(() => {
        const calendarGrid = document.querySelector('[role="grid"]')
        if (calendarGrid) {
          (calendarGrid as HTMLElement).focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Generar días del mes
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setViewDate(newDate)
  }

  // Seleccionar fecha
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    onDateSelect?.(date)
  }

  // Manejar teclas de navegación
  const handleKeyDown = (event: React.KeyboardEvent, date: Date) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleDateSelect(date)
    }
  }

  const calendarDays = generateCalendarDays()
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800 border-green-200'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200'
      case 'completado': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        aria-describedby="calendar-description"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <CalendarIcon className="w-5 h-5" aria-hidden="true" />
            Vista de Calendario
          </DialogTitle>
          <p id="calendar-description" className="text-sm text-muted-foreground">
            Navega por el calendario para ver y gestionar las reservas. Usa las flechas para cambiar de mes.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Navegación del mes */}
          <div className="flex items-center justify-between mb-6 px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              aria-label="Mes anterior"
              className="hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
            
            <h2 className="text-lg font-semibold">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              aria-label="Mes siguiente"
              className="hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 gap-1 mb-4 justify-items-center">
            {/* Encabezados de días */}
            {dayNames.map((day) => (
              <div key={day} className="w-8 h-6 flex items-center justify-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Días del calendario */}
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === viewDate.getMonth()
              const isSelected = date.toDateString() === currentDate.toDateString()
              const isToday = date.toDateString() === new Date().toDateString()
              const dayEvents = getEventsForDate(date)
              
              return (
                <div
                  key={index}
                  className={`
                    h-8 w-8 flex items-center justify-center border border-border rounded cursor-pointer transition-all duration-200 text-sm
                    ${isCurrentMonth ? 'bg-background hover:bg-muted/50' : 'bg-muted/20 text-muted-foreground'}
                    ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                    ${isToday && !isSelected ? 'bg-primary/10 border-primary/30 text-primary font-medium' : ''}
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                  `}
                  onClick={() => handleDateSelect(date)}
                  onKeyDown={(e) => handleKeyDown(e, date)}
                  tabIndex={0}
                  role="gridcell"
                  aria-label={`${date.getDate()} de ${monthNames[date.getMonth()]}, ${dayEvents.length} eventos`}
                >
                  {date.getDate()}
                  {/* Indicador de eventos */}
                  {dayEvents.length > 0 && (
                    <div className="absolute mt-5 ml-5">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detalles del día seleccionado */}
          {currentDate && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  Reservas del {currentDate.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                
                {getEventsForDate(currentDate).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay reservas para este día</p>
                ) : (
                  <div className="space-y-3">
                    {getEventsForDate(currentDate).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.title}</span>
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" aria-hidden="true" />
                              {event.court}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" aria-hidden="true" />
                              {event.players} jugadores
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" aria-hidden="true" />
                              ${event.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CalendarModal