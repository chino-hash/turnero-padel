# Bootstrap de tenant y pagos (Mercado Pago, multitenant)

Este documento resume los cambios implementados para que un tenant nuevo quede operativo y pueda cobrar con Mercado Pago en un esquema **multitenant**.

## Qué se crea/asegura en un tenant nuevo

El bootstrap es **idempotente** (lo podés correr varias veces sin duplicar).

- **Tenant activo**: asegura que el tenant exista y esté `isActive=true`.
- **Admin del tenant**: crea/activa `AdminWhitelist` tenant-scoped para el `ownerEmail`.
- **3 canchas**: `Cancha 1/2/3` activas con horarios base y `slot_duration`.
- **System settings mínimos**:
  - `operating_hours_start`
  - `operating_hours_end`
  - `default_slot_duration`
  - `booking_expiration_minutes`
  - `home_card_settings` (para el home público)
- **Productos iniciales**: set mínimo de productos/stock.

## Cómo ejecutar el bootstrap

### Opción A: API (solo SUPER_ADMIN)

Endpoint:
- `POST /api/tenants/bootstrap`

Body:

```json
{
  "slug": "prueba",
  "ownerEmail": "agustinlucero@soyastor.com",
  "name": "Club prueba"
}
```

### Opción B: Script (sin depender de Next)

```bash
node scripts/bootstrap-tenant.js prueba agustinlucero@soyastor.com "Club prueba"
```

Notas:
- El script intenta cargar variables desde `.env.local`, `.env`, y también desde `turnero-padel/.env*` por compatibilidad.
- Si no hay `CREDENTIAL_ENCRYPTION_KEY`, las credenciales pueden guardarse en claro (el runtime tolera credenciales no encriptadas).

## Expiración de reservas (expiresAt)

Al crear una reserva `PENDING`, se setea `expiresAt` usando:
- System setting `booking_expiration_minutes` (default: 15).

Cuando un pago se confirma via webhook, se limpia:
- `expiresAt = null`.

Además existe el job:
- `POST /api/jobs/cancel-expired-bookings` (cancela reservas expiradas).

## Pagos: preferencia y checkout

Se agregó el endpoint:
- `POST /api/bookings/[id]/payment-preference`

Este endpoint llama a:
- `BookingService.createPaymentPreference(bookingId)`

El provider se resuelve vía:
- `lib/services/payments/PaymentProviderFactory.ts`

## Resolución de credenciales Mercado Pago

Orden de resolución al cobrar:

1. **Credenciales del tenant** (si `mercadoPagoEnabled=true` y tiene `mercadoPagoAccessToken`)
2. **Fallback a credenciales globales** (variables de entorno: `MERCADOPAGO_ACCESS_TOKEN`, etc.)
3. Si no hay nada, **Mock provider** (para desarrollo)

Variables esperadas:

```bash
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_SECRET=...
MERCADOPAGO_PUBLIC_KEY=...           # opcional
MERCADOPAGO_ENVIRONMENT=sandbox|production
PAYMENT_PROVIDER=mercadopago         # opcional
```

## Webhook de Mercado Pago

Endpoint:
- `POST /api/webhooks/payments`

Características:
- Valida firma si existe `MERCADOPAGO_WEBHOOK_SECRET` (global) o si puede resolver el secret del tenant.
- Es una ruta pública: se agregó a allowlist en `middleware.ts`.

## Nota Windows: prisma generate (EPERM)

En algunos entornos Windows, `prisma generate` puede fallar con `EPERM` al renombrar el engine.

Workarounds:
- Detener `npm run dev` antes de correr `npm run build`
- Ejecutar `npx next build` (si el cliente Prisma ya está generado)
- Revisar antivirus/Defender (puede bloquear el `.dll.node`)

