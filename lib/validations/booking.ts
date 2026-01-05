import { z } from 'zod';
import { BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// Regex patterns para validaciones
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const PHONE_REGEX = /^[+]?[1-9]?[0-9]{7,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Schema base para validar horarios
const timeSchema = z.string().regex(TIME_REGEX, {
  message: 'El formato de hora debe ser HH:MM (24 horas)'
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
  const [y, m, d] = date.split('-').map(Number)
  const parsedDate = new Date(y as number, (m as number) - 1, d as number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parsedDate >= today
}, {
  message: 'La fecha no puede ser anterior a hoy'
});

// Schema para crear una reserva
export const createBookingSchema = z.object({
  courtId: z.string().cuid({
    message: 'ID de cancha inválido'
  }),
  bookingDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  notes: z.string().max(500, {
    message: 'Las notas no pueden exceder 500 caracteres'
  }).optional(),
  players: z.array(z.object({
    playerName: z.string().min(2, {
      message: 'El nombre del jugador debe tener al menos 2 caracteres'
    }).max(100, {
      message: 'El nombre del jugador no puede exceder 100 caracteres'
    }),
    playerPhone: z.string().regex(PHONE_REGEX, {
      message: 'Formato de teléfono inválido'
    }).optional(),
    playerEmail: z.string().regex(EMAIL_REGEX, {
      message: 'Formato de email inválido'
    }).optional(),
    position: z.number().int().min(1).max(4).optional()
  })).max(4, {
    message: 'Máximo 4 jugadores por reserva'
  }).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD']).optional()
}).refine((data) => {
  // Validar que endTime sea posterior a startTime
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes > startMinutes;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime']
}).refine((data) => {
  // Validar duración mínima (30 minutos) y máxima (4 horas)
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const duration = endMinutes - startMinutes;
  
  return duration >= 30 && duration <= 240;
}, {
  message: 'La duración debe ser entre 30 minutos y 4 horas',
  path: ['endTime']
});

// Schema para actualizar una reserva
export const updateBookingSchema = z.object({
  bookingDate: dateSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'DEPOSIT_PAID', 'FULLY_PAID']).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD']).optional(),
  notes: z.string().max(500, {
    message: 'Las notas no pueden exceder 500 caracteres'
  }).optional(),
  cancellationReason: z.string().max(500, {
    message: 'La razón de cancelación no puede exceder 500 caracteres'
  }).optional(),
  courtId: z.string().cuid('ID de cancha inválido').optional(),
  players: z.array(z.object({
    id: z.string().cuid().optional(),
    playerName: z.string().min(2).max(100),
    playerPhone: z.string().regex(PHONE_REGEX).optional(),
    playerEmail: z.string().regex(EMAIL_REGEX).optional(),
    position: z.number().int().min(1).max(4).optional(),
    hasPaid: z.boolean().optional(),
    paidAmount: z.number().int().min(0).optional()
  })).max(4).optional()
}).refine((data) => {
  // Solo validar horarios si ambos están presentes
  if (data.startTime && data.endTime) {
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    
    return endMinutes > startMinutes && duration >= 30 && duration <= 240;
  }
  return true;
}, {
  message: 'Horarios inválidos: la hora de fin debe ser posterior al inicio y la duración entre 30 minutos y 4 horas',
  path: ['endTime']
});

// Schema para filtros de búsqueda
export const bookingFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  courtId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  tenantId: z.string().cuid().optional(), // Filtro multi-tenant
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'DEPOSIT_PAID', 'FULLY_PAID']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['bookingDate', 'createdAt', 'totalPrice']).default('bookingDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine((data) => {
  // Validar que dateFrom sea anterior a dateTo si ambas están presentes
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateFrom) <= new Date(data.dateTo);
  }
  return true;
}, {
  message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
  path: ['dateTo']
});

// Schema para operaciones bulk
export const bulkUpdateBookingsSchema = z.object({
  bookingIds: z.array(z.string().cuid()).min(1, {
    message: 'Debe seleccionar al menos una reserva'
  }).max(50, {
    message: 'Máximo 50 reservas por operación bulk'
  }),
  updates: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    paymentStatus: z.enum(['PENDING', 'DEPOSIT_PAID', 'FULLY_PAID']).optional(),
    cancellationReason: z.string().max(500).optional()
  }).refine((data) => {
    // Al menos un campo debe estar presente
    return Object.values(data).some(value => value !== undefined);
  }, {
    message: 'Debe especificar al menos un campo para actualizar'
  })
});

// Schema para validar disponibilidad
export const checkAvailabilitySchema = z.object({
  courtId: z.string().min(1),
  bookingDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  excludeBookingId: z.string().cuid().optional() // Para excluir una reserva específica (útil en updates)
}).refine((data) => {
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes > startMinutes;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime']
});

// Schema para reportes
export const bookingReportSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  courtIds: z.array(z.string().cuid()).optional(),
  status: z.array(z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'court']).default('day'),
  includeRevenue: z.boolean().default(true),
  includePlayerStats: z.boolean().default(false)
}).refine((data) => {
  const dateFrom = new Date(data.dateFrom);
  const dateTo = new Date(data.dateTo);
  const diffTime = Math.abs(dateTo.getTime() - dateFrom.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Limitar el rango de fechas para reportes (máximo 1 año)
  return diffDays <= 365;
}, {
  message: 'El rango de fechas no puede exceder 1 año',
  path: ['dateTo']
});

// Schema para actualizar pago individual de un jugador
export const updateBookingPlayerPaymentSchema = z.object({
  hasPaid: z.boolean(),
  paidAmount: z.number().int().min(0, {
    message: 'El monto pagado debe ser 0 o mayor'
  }).optional()
});

// Tipos derivados de los schemas
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type BookingFilters = z.infer<typeof bookingFiltersSchema>;
export type BulkUpdateBookingsInput = z.infer<typeof bulkUpdateBookingsSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type BookingReportInput = z.infer<typeof bookingReportSchema>;
export type UpdateBookingPlayerPaymentInput = z.infer<typeof updateBookingPlayerPaymentSchema>;

// Funciones de validación helper
export const validateBookingTime = (startTime: string, endTime: string): boolean => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const duration = endMinutes - startMinutes;
  
  return endMinutes > startMinutes && duration >= 30 && duration <= 240;
};

export const validateBookingDate = (date: string): boolean => {
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return bookingDate >= today;
};

export const calculateDurationMinutes = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
};
