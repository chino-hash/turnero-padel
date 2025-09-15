import { 
  Booking, 
  BookingStatus, 
  BookingFormData, 
  BookingValidationError, 
  BookingValidationResult,
  TIME_SLOTS 
} from '../../types/booking'

// Utilidades de fecha y hora
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export const formatTime = (time: string): string => {
  return time.slice(0, 5) // HH:mm
}

export const formatDateTime = (date: Date | string, time: string): string => {
  return `${formatDate(date)} ${formatTime(time)}`
}

export const formatDateTimeRange = (date: Date | string, startTime: string, endTime: string): string => {
  return `${formatDate(date)} ${formatTime(startTime)} - ${formatTime(endTime)}`
}

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export const isTomorrow = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return d.toDateString() === tomorrow.toDateString()
}

export const isThisWeek = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6))
  return d >= weekStart && d <= weekEnd
}

export const getRelativeDateLabel = (date: Date | string): string => {
  if (isToday(date)) return 'Hoy'
  if (isTomorrow(date)) return 'Mañana'
  if (isThisWeek(date)) {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('es-ES', { weekday: 'long' })
  }
  return formatDate(date)
}

// Utilidades de tiempo
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export const addMinutesToTime = (time: string, minutes: number): string => {
  const totalMinutes = timeToMinutes(time) + minutes
  return minutesToTime(totalMinutes)
}

export const getTimeDifference = (startTime: string, endTime: string): number => {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

export const isTimeInRange = (time: string, startTime: string, endTime: string): boolean => {
  const timeMinutes = timeToMinutes(time)
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes
}

// Generar slots de tiempo disponibles
export const generateTimeSlots = (startHour = 8, endHour = 22, intervalMinutes = 30): string[] => {
  const slots: string[] = []
  let currentMinutes = startHour * 60
  const endMinutes = endHour * 60

  while (currentMinutes <= endMinutes) {
    slots.push(minutesToTime(currentMinutes))
    currentMinutes += intervalMinutes
  }

  return slots
}

// Filtrar slots disponibles basado en reservas existentes
export const getAvailableTimeSlots = (
  date: Date,
  courtId: string,
  existingBookings: Booking[],
  duration = 90 // duración en minutos
): string[] => {
  const allSlots = generateTimeSlots()
  const dateStr = date.toISOString().split('T')[0]
  
  // Filtrar reservas del mismo día y cancha
  const dayBookings = existingBookings.filter(
    booking => 
      booking.courtId === courtId && 
      booking.bookingDate === dateStr &&
      booking.status !== 'CANCELLED'
  )

  return allSlots.filter(slot => {
    const slotStart = timeToMinutes(slot)
    const slotEnd = slotStart + duration

    // Verificar si el slot se superpone con alguna reserva existente
    return !dayBookings.some(booking => {
      const bookingStart = timeToMinutes(booking.startTime)
      const bookingEnd = timeToMinutes(booking.endTime)
      
      // Hay superposición si:
      // - El inicio del slot está dentro de la reserva
      // - El final del slot está dentro de la reserva
      // - El slot contiene completamente la reserva
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      )
    })
  })
}

// Validación de reservas
export const validateBookingData = (data: BookingFormData): BookingValidationResult => {
  const errors: BookingValidationError[] = []

  // Validar cancha
  if (!data.courtId) {
    errors.push({
      field: 'courtId',
      message: 'Debe seleccionar una cancha',
      code: 'REQUIRED'
    })
  }

  // Validar fecha
  if (!data.bookingDate) {
    errors.push({
      field: 'bookingDate',
      message: 'Debe seleccionar una fecha',
      code: 'REQUIRED'
    })
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (data.bookingDate < today) {
      errors.push({
        field: 'bookingDate',
        message: 'No se pueden hacer reservas en fechas pasadas',
        code: 'INVALID_DATE'
      })
    }

    // Validar que no sea más de 30 días en el futuro
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    
    if (data.bookingDate > maxDate) {
      errors.push({
        field: 'bookingDate',
        message: 'No se pueden hacer reservas con más de 30 días de anticipación',
        code: 'DATE_TOO_FAR'
      })
    }
  }

  // Validar horarios
  if (!data.startTime) {
    errors.push({
      field: 'startTime',
      message: 'Debe seleccionar una hora de inicio',
      code: 'REQUIRED'
    })
  }

  if (!data.endTime) {
    errors.push({
      field: 'endTime',
      message: 'Debe seleccionar una hora de fin',
      code: 'REQUIRED'
    })
  }

  if (data.startTime && data.endTime) {
    const startMinutes = timeToMinutes(data.startTime)
    const endMinutes = timeToMinutes(data.endTime)
    
    if (startMinutes >= endMinutes) {
      errors.push({
        field: 'endTime',
        message: 'La hora de fin debe ser posterior a la hora de inicio',
        code: 'INVALID_TIME_RANGE'
      })
    }

    const duration = endMinutes - startMinutes
    if (duration < 60) {
      errors.push({
        field: 'endTime',
        message: 'La reserva debe tener una duración mínima de 1 hora',
        code: 'DURATION_TOO_SHORT'
      })
    }

    if (duration > 180) {
      errors.push({
        field: 'endTime',
        message: 'La reserva no puede exceder las 3 horas',
        code: 'DURATION_TOO_LONG'
      })
    }
  }

  // Validar usuario
  if (!data.userId) {
    errors.push({
      field: 'userId',
      message: 'Debe seleccionar un usuario',
      code: 'REQUIRED'
    })
  }

  // Validar jugadores
  if (data.players && data.players.length > 4) {
    errors.push({
      field: 'players',
      message: 'No se pueden agregar más de 4 jugadores',
      code: 'TOO_MANY_PLAYERS'
    })
  }

  if (data.players) {
    data.players.forEach((player, index) => {
      if (!player.name.trim()) {
        errors.push({
          field: `players.${index}.name`,
          message: `El nombre del jugador ${index + 1} es requerido`,
          code: 'REQUIRED'
        })
      }

      if (player.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player.email)) {
        errors.push({
          field: `players.${index}.email`,
          message: `El email del jugador ${index + 1} no es válido`,
          code: 'INVALID_EMAIL'
        })
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Verificar si una reserva se puede cancelar
export const canCancelBooking = (booking: Booking): boolean => {
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    return false
  }

  // No se puede cancelar si la reserva ya comenzó
  const now = new Date()
  const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`)
  
  return bookingDateTime > now
}

// Verificar si una reserva se puede editar
export const canEditBooking = (booking: Booking): boolean => {
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    return false
  }

  // No se puede editar si la reserva ya comenzó
  const now = new Date()
  const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`)
  
  return bookingDateTime > now
}

// Calcular el estado de una reserva basado en la fecha/hora
export const calculateBookingStatus = (booking: Booking): BookingStatus => {
  const now = new Date()
  const bookingStart = new Date(`${booking.bookingDate}T${booking.startTime}`)
  const bookingEnd = new Date(`${booking.bookingDate}T${booking.endTime}`)

  if (booking.status === 'CANCELLED') {
    return 'CANCELLED'
  }

  if (now < bookingStart) {
    return booking.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING'
  }

  if (now >= bookingStart && now <= bookingEnd) {
    return 'ACTIVE'
  }

  if (now > bookingEnd) {
    return 'COMPLETED'
  }

  return booking.status
}

// Formatear duración en texto legible
export const formatDuration = (startTime: string, endTime: string): string => {
  const duration = getTimeDifference(startTime, endTime)
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}min`
}

// Generar resumen de reserva
export const generateBookingSummary = (booking: Booking): string => {
  const date = getRelativeDateLabel(booking.bookingDate)
  const timeRange = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`
  const duration = formatDuration(booking.startTime, booking.endTime)
  
  return `${date} • ${timeRange} (${duration})`
}

// Verificar conflictos de horario
export const hasTimeConflict = (
  newBooking: { startTime: string; endTime: string; bookingDate: string; courtId: string },
  existingBookings: Booking[],
  excludeBookingId?: string
): boolean => {
  const conflictingBookings = existingBookings.filter(booking => 
    booking.id !== excludeBookingId &&
    booking.courtId === newBooking.courtId &&
    booking.bookingDate === newBooking.bookingDate &&
    booking.status !== 'CANCELLED'
  )

  const newStart = timeToMinutes(newBooking.startTime)
  const newEnd = timeToMinutes(newBooking.endTime)

  return conflictingBookings.some(booking => {
    const existingStart = timeToMinutes(booking.startTime)
    const existingEnd = timeToMinutes(booking.endTime)

    // Hay conflicto si hay cualquier superposición
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    )
  })
}

// Obtener el próximo slot disponible
export const getNextAvailableSlot = (
  date: Date,
  courtId: string,
  existingBookings: Booking[],
  preferredTime?: string,
  duration = 90
): string | null => {
  const availableSlots = getAvailableTimeSlots(date, courtId, existingBookings, duration)
  
  if (availableSlots.length === 0) {
    return null
  }

  if (preferredTime) {
    // Buscar el slot más cercano al tiempo preferido
    const preferredMinutes = timeToMinutes(preferredTime)
    let closestSlot = availableSlots[0]
    let minDifference = Math.abs(timeToMinutes(closestSlot) - preferredMinutes)

    for (const slot of availableSlots) {
      const difference = Math.abs(timeToMinutes(slot) - preferredMinutes)
      if (difference < minDifference) {
        minDifference = difference
        closestSlot = slot
      }
    }

    return closestSlot
  }

  return availableSlots[0]
}