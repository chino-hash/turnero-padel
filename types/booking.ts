// Tipos para el sistema de reservas

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Court {
  id: string
  name: string
  description?: string
  pricePerHour: number
  isActive: boolean
  features?: string[]
  createdAt: string
  updatedAt: string
}

export interface Player {
  id?: string
  name: string
  email?: string
  phone?: string
}

export type BookingStatus = 
  | 'PENDING'    // Pendiente de confirmación
  | 'CONFIRMED'  // Confirmada
  | 'ACTIVE'     // En curso
  | 'COMPLETED'  // Completada
  | 'CANCELLED'  // Cancelada

export interface Booking {
  id: string
  userId: string
  courtId: string
  bookingDate: string // ISO date string
  startTime: string   // HH:mm format
  endTime: string     // HH:mm format
  status: BookingStatus
  notes?: string
  totalAmount?: number
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED'
  players?: Player[]
  
  // Relaciones
  user?: User
  court?: Court
  
  // Metadatos
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface BookingFormData {
  courtId: string
  bookingDate: Date
  startTime: string
  endTime: string
  userId: string
  status: BookingStatus
  notes?: string
  players?: Player[]
}

export interface BookingFilters {
  search?: string
  courtId?: string
  userId?: string
  status?: BookingStatus
  dateFrom?: Date
  dateTo?: Date
  timeFrom?: string
  timeTo?: string
}

export interface BookingStats {
  total: number
  byStatus: Record<BookingStatus, number>
  byCourt: Record<string, number>
  byHour: Record<string, number>
  byDay: Record<string, number>
  revenue: number
  averagePlayersPerBooking: number
  occupancyRate: number
  trends: Array<{
    month: string
    bookings: number
    revenue: number
  }>
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface BookingResponse {
  bookings: Booking[]
  pagination: PaginationInfo
  stats?: BookingStats
}

// Tipos para la API
export interface CreateBookingRequest {
  courtId: string
  bookingDate: string
  startTime: string
  endTime: string
  userId: string
  notes?: string
  players?: Omit<Player, 'id'>[]
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  status?: BookingStatus
}

export interface BookingAvailabilityRequest {
  courtId: string
  date: string
  startTime?: string
  endTime?: string
}

export interface BookingAvailabilityResponse {
  available: boolean
  availableSlots: Array<{
    startTime: string
    endTime: string
  }>
  conflictingBookings?: Booking[]
}

// Tipos para validación
export interface BookingValidationError {
  field: string
  message: string
  code: string
}

export interface BookingValidationResult {
  valid: boolean
  errors: BookingValidationError[]
}

// Tipos para notificaciones
export interface BookingNotification {
  id: string
  bookingId: string
  type: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'REMINDER'
  title: string
  message: string
  read: boolean
  createdAt: string
}

// Tipos para reportes
export interface BookingReport {
  period: {
    from: string
    to: string
  }
  summary: {
    totalBookings: number
    totalRevenue: number
    averageBookingValue: number
    occupancyRate: number
  }
  breakdown: {
    byStatus: Record<BookingStatus, number>
    byCourt: Record<string, { bookings: number; revenue: number }>
    byDay: Record<string, number>
    byHour: Record<string, number>
  }
  trends: Array<{
    date: string
    bookings: number
    revenue: number
  }>
}

// Constantes útiles
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
]

export const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
}