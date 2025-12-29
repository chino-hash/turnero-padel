# Changelog: Implementación Defensa en Profundidad para Reservas

Todos los cambios notables de esta implementación serán documentados en este archivo.

## [1.0.0] - 2025-01-XX

### Agregado

#### Base de Datos
- Campo `expiresAt: DateTime?` en model `Booking` para expiración de reservas
- Estado `PAYMENT_CONFLICT` en enum `BookingStatus` para manejo de pagos tardíos
- Índice en `expiresAt` para optimizar consultas

#### Servicios y Lógica de Negocio
- **BookingErrors.ts**: Excepciones personalizadas (`BookingConflictError`, `BookingNotFoundError`)
- **BookingRepository**: 
  - Método `_checkAvailabilityInTransaction()` para verificación atómica
  - Refactorización de `create()` con verificación dentro de transacción
  - Soporte para `expirationMinutes` en creación de reservas
  
- **BookingService**:
  - Método `_getExpirationMinutes()` para obtener configuración
  - Método `createPaymentPreference()` para crear preferencias de pago
  - Integración de reembolsos en `cancelBooking()`
  - Manejo de `BookingConflictError` en `createBooking()`

- **Payment Services** (Abstracciones):
  - `IPaymentProvider` interface y `MockPaymentProvider`
  - `IRefundService` interface y `MockRefundService`
  - `IWebhookHandler` interface y `BookingWebhookHandler`
  - `PaymentProviderFactory` para resolver proveedores
  - `RefundService` con lógica de negocio (políticas de 2 horas)

- **ExpiredBookingsService**: Servicio para cancelar reservas expiradas automáticamente

#### Endpoints API
- `POST /api/webhooks/payments`: Endpoint genérico para webhooks de pagos
- `POST /api/jobs/cancel-expired-bookings`: Job para limpieza automática
- `GET /api/jobs/cancel-expired-bookings`: Estadísticas de reservas expiradas

#### Configuración
- SystemSetting `booking_payment_expiration_minutes` (default: 15 minutos)
- Agregado en scripts de inicialización (`init-admins.js`, `load-data-to-neon.js`)

#### Documentación
- `docs/architecture/payment-integration.md`: Guía completa para integración futura
- `docs/implementacion/defensa-profundidad-reservas.md`: Documentación de esta implementación

### Modificado

- **BookingRepository.checkAvailability()**: Excluye reservas expiradas y PAYMENT_CONFLICT
- **BookingService.createBooking()**: Usa verificación atómica, maneja conflictos
- **BookingService.cancelBooking()**: Integra procesamiento de reembolsos
- **BookingWithDetails**: Agregado campo `expiresAt`

### Mejoras de Seguridad

- Verificación atómica previene race conditions
- Validación de disponibilidad dentro de transacciones garantiza consistencia
- Sistema de expiración evita bloqueos indefinidos de slots

### Arquitectura

- Abstracciones mediante interfaces permiten cambio de proveedores sin afectar lógica
- Implementaciones mock permiten desarrollo sin dependencias externas
- Preparado para integración futura con Mercado Pago

## [Próximas Versiones]

### Planeado para v1.1.0

- Implementación de `MercadoPagoProvider`
- Implementación de `MercadoPagoRefundService`
- Validación de firma en webhooks de Mercado Pago
- Notificaciones automáticas para administradores en casos PAYMENT_CONFLICT
- Tests unitarios y de integración completos


