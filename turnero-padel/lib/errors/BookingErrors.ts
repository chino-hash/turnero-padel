/**
 * Excepciones personalizadas para operaciones de reservas
 */

export class BookingConflictError extends Error {
  constructor(
    public readonly courtId: string,
    public readonly bookingDate: Date,
    public readonly startTime: string,
    public readonly endTime: string,
    message?: string
  ) {
    super(
      message ||
        `El horario seleccionado (${bookingDate.toISOString().split('T')[0]} ${startTime}-${endTime}) no está disponible para la cancha ${courtId}`
    );
    this.name = 'BookingConflictError';
    // Mantener el stack trace correcto en V8 (Chrome, Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BookingConflictError);
    }
  }
}

export class BookingNotFoundError extends Error {
  constructor(public readonly bookingId: string) {
    super(`Reserva con ID ${bookingId} no encontrada`);
    this.name = 'BookingNotFoundError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BookingNotFoundError);
    }
  }
}


