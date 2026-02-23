---
name: turnero-padel-domain
description: Encodes domain knowledge for padel court booking system including entities (Tenant, Court, Booking, User), booking statuses (PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED), and business rules. Use when implementing booking logic, status transitions, availability checks, or discussing padel court reservations.
---

# Turnero Padel - Domain Knowledge

## Entities

| Entity | Description |
|--------|-------------|
| **Tenant** | Club/empresa con sus canchas, usuarios y reservas. Tiene `slug` único para URLs. |
| **Court** | Cancha de pádel. `basePrice`, `priceMultiplier`, `operatingHours` (JSON), `features` (JSON). |
| **Booking** | Reserva. Vincula court, user, fecha, horario, status, paymentStatus. |
| **BookingPlayer** | Jugador asociado a una reserva. `position` (1-4), `hasPaid`, `paidAmount`. |
| **RecurringBooking** | Serie de reservas recurrentes. Genera instancias de Booking. |
| **User** | Usuario del sistema. Pertenece a un Tenant, tiene `role`. |
| **Payment** | Pago asociado a Booking. `paymentMethod`, `paymentType`, `status`. |
| **Venta** | Venta de productos (tienda del club). |
| **Producto** | Productos vendibles por el tenant. |

Schema completo: `prisma/schema.prisma`

## Booking Statuses

| Status | Meaning |
|--------|---------|
| PENDING | Pendiente de confirmación |
| CONFIRMED | Confirmada |
| ACTIVE | En curso |
| COMPLETED | Completada |
| CANCELLED | Cancelada |

Labels y colores centralizados: `lib/booking-status-map.ts`, `types/booking.ts`.

Para UI, usar `BOOKING_STATUS_MAP` para `label` y `className`:

```typescript
import { BOOKING_STATUS_MAP, STATUS_KEYS } from '@/lib/booking-status-map';
```

## Roles

- **USER**: Usuario regular. Ve y gestiona sus reservas.
- **ADMIN**: Administrador del tenant. Gestiona canchas, turnos, ventas.
- **Super Admin**: Gestiona todos los tenants.

## Key Concepts

- **Posiciones de jugadores**: `BookingPlayer.position` (1–4). Cada posición puede pagar individualmente.
- **Extras**: `BookingExtra` – productos/servicios adicionales por reserva.
- **operatingHours**: JSON en Court. `{ start, end, slot_duration }`. Default `slot_duration: 90` minutos.
- **Time slots**: Lista en `TIME_SLOTS` de `types/booking.ts`.
- **RecurringBooking**: Crea múltiples instancias de Booking; cada una con `recurringId` que apunta a la serie.

## PaymentStatus (Booking)

PENDING, PAID, REFUNDED, etc. Ver enum `PaymentStatus` en schema.

## PaymentMethod

Mercado Pago, efectivo, transferencia, etc. Ver enum en schema.
