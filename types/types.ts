// Tipos principales del sistema de reservas de padel

export interface TimeSlot {
  id: string;
  time: string;
  startTime?: string;
  endTime?: string;
  timeRange?: string;
  available: boolean;
  isAvailable?: boolean;
  price: number;
  finalPrice?: number;
  pricePerPerson?: number;
  courtId: string;
  courtName?: string;
  date?: Date;
  duration?: number;
  bookingId?: string;
}

// Interfaz para el JSON de operatingHours
export interface OperatingHours {
  start: string;
  end: string;
  slot_duration: number;
}

// Interfaz para el JSON de features (configuración de estilos)
export interface CourtFeatures {
  color: string;
  bgColor: string;
  textColor: string;
}

export interface Court {
  id: string;
  name: string;
  description: string | null;
  // Alinear con Prisma: camelCase y obligatorio
  basePrice: number;
  priceMultiplier: number;
  // Estado activo obligatorio para mayor consistencia
  isActive: boolean;
  // Usa las nuevas interfaces en lugar de 'string'
  operatingHours: OperatingHours;
  features: CourtFeatures;
  // Campos de estilo existentes para compatibilidad con UI actual
  color: string;
  bgColor: string;
  textColor: string;
}

export interface Player {
  name: string;
  email: string;
  phone: string;
  isRegistered: boolean;
  hasPaid: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  location: string;
  price: number;
  totalPrice: number;
  deposit: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus: 'Paid' | 'Deposit Paid' | 'Pending';
  type: 'current' | 'past';
  players: Player[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlotsResponse {
  date: string;
  courtId: string;
  courtName: string;
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  summary?: {
    rate: number;
  };
}