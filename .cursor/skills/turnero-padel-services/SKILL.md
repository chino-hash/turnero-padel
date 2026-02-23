---
name: turnero-padel-services
description: Service layer patterns for Turnero de Padel including CRUD services, booking availability logic, and integration with Prisma. Use when implementing business logic, creating new services, or modifying booking/court/availability logic.
---

# Turnero Padel - Service Layer

## Database Access

Usar el cliente Prisma desde `lib/database/neon-config`:

```typescript
import { prisma } from '@/lib/database/neon-config';
```

## Tenant Context

Todos los servicios que tocan datos por tenant deben recibir `tenantId` explícito o el usuario (de donde se extrae el tenant). No asumir tenant desde contexto global.

## CRUD Service

El proyecto tiene un CRUD genérico en `lib/services/crud-service.ts`:

- Modelos con tenant: User, Court, Booking, Payment, SystemSetting, Producto, RecurringBooking, AdminWhitelist
- Opciones: `user`, `tenantId`, `include`, `where`, etc.
- Validación de permisos integrada (`canAccessTenant`, `canPerformOperation`)

Para operaciones CRUD estándar, preferir usar o extender este servicio.

## Servicios Específicos

- `BookingService` – lógica de reservas, disponibilidad
- `BookingWebhookHandler` – webhooks de Mercado Pago
- Servicios en `lib/services/` y subcarpetas (payments, courts, etc.)

## Integración con API Routes

1. Obtener `tenantId` y validar permisos en el route handler
2. Llamar al servicio pasando `tenantId` y datos validados (Zod)
3. El servicio usa `prisma` con `where: { tenantId }` cuando aplica

## Documentación

Plantilla para documentar servicios: `docs/templates/SERVICE-TEMPLATE.md`
