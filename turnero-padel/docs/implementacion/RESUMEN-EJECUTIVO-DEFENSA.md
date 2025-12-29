# Resumen Ejecutivo: Defensa en Profundidad para Reservas

## ¿Qué se implementó?

Un sistema de **dos capas de protección** para evitar que dos usuarios reserven el mismo turno simultáneamente (race conditions), y una infraestructura completa preparada para integrar pagos con Mercado Pago.

## El Problema que Resuelve

**Antes:** Si dos usuarios intentaban reservar el mismo slot al mismo tiempo, ambos podían ver que estaba disponible y ambos podían intentar crear la reserva, causando conflictos.

**Ahora:** La verificación de disponibilidad se hace dentro de una transacción atómica, garantizando que solo una reserva se puede crear para un slot específico.

## Componentes Principales

### 1. Bloqueo Transaccional
- Verificación de disponibilidad **dentro de una transacción de base de datos**
- Garantiza atomicidad: o se crea la reserva completa, o no se crea nada
- Previene condiciones de carrera completamente

### 2. Expiración Sincronizada
- Cada reserva tiene un `expiresAt` (15 minutos por defecto)
- Las reservas expiradas se cancelan automáticamente
- Preparado para sincronizar con Mercado Pago cuando se integre

### 3. Manejo de Pagos Tardíos
- Estado `PAYMENT_CONFLICT` para casos donde un pago llega tarde
- Re-verificación de disponibilidad antes de reactivar reservas
- Procesamiento automático de reembolsos cuando corresponde

## Archivos Clave Creados

### Interfaces (Preparadas para Mercado Pago)
- `IPaymentProvider` - Para crear preferencias de pago
- `IRefundService` - Para procesar reembolsos  
- `IWebhookHandler` - Para procesar notificaciones de pago

### Servicios
- `BookingWebhookHandler` - Lógica de negocio para webhooks
- `ExpiredBookingsService` - Limpieza automática de reservas expiradas
- `RefundService` - Manejo de reembolsos con políticas de negocio

### Endpoints
- `/api/webhooks/payments` - Recibe notificaciones de pagos
- `/api/jobs/cancel-expired-bookings` - Job de limpieza (ejecutar cada 5 min)

## Cambios en Base de Datos

```sql
-- Nuevo campo
ALTER TABLE Booking ADD COLUMN expiresAt DATETIME;

-- Nuevo estado
ALTER TYPE BookingStatus ADD VALUE 'PAYMENT_CONFLICT';

-- Nuevo índice
CREATE INDEX idx_booking_expires_at ON Booking(expiresAt);
```

## Configuración Necesaria

### 1. Ejecutar Migración
```bash
npx prisma migrate dev --name add_expires_at_and_payment_conflict
npx prisma generate
```

### 2. Configurar Cron Job
Configurar un job que ejecute cada 5 minutos:
```
POST /api/jobs/cancel-expired-bookings
```

**Ejemplo Vercel:**
Agregar en `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/jobs/cancel-expired-bookings",
    "schedule": "*/5 * * * *"
  }]
}
```

### 3. SystemSetting (Opcional)
El sistema usa 15 minutos por defecto, pero se puede configurar:
- Key: `booking_payment_expiration_minutes`
- Valor: Número de minutos (default: 15)

## Flujo de Uso

### Reserva Normal
1. Usuario selecciona turno
2. Sistema crea reserva con `expiresAt` = ahora + 15 min
3. Sistema verifica disponibilidad (dentro de transacción)
4. Si disponible → Reserva creada
5. Si no disponible → Error `BookingConflictError`

### Pago Tardío
1. Usuario completa pago después de expiración
2. Webhook recibe notificación
3. Sistema re-verifica disponibilidad
4. Si libre → Reactiva reserva
5. Si ocupada → Marca `PAYMENT_CONFLICT` y reembolsa

### Limpieza Automática
1. Job ejecuta cada 5 minutos
2. Busca reservas con `expiresAt < now()` y `status = 'PENDING'`
3. Las cancela automáticamente

## Estado Actual

✅ **Completado:**
- Verificación atómica
- Sistema de expiración
- Manejo de PAYMENT_CONFLICT
- Abstracciones para pagos
- Job de limpieza
- Sistema de reembolsos (mock)

🔄 **Pendiente (Futuro):**
- Integración real con Mercado Pago
- Validación de firmas en webhooks
- Notificaciones a administradores

## Próximos Pasos

1. **Ejecutar migración de Prisma** (ver arriba)
2. **Configurar cron job** para limpieza automática
3. **Probar el sistema** creando reservas simultáneas
4. **Cuando se implemente Mercado Pago**, seguir la guía en:
   `docs/architecture/payment-integration.md`

## Documentación Completa

Para más detalles, ver:
- [Documentación Completa](./defensa-profundidad-reservas.md)
- [Guía de Integración de Pagos](../architecture/payment-integration.md)
- [Changelog](../../CHANGELOG-DEFENSA-PROFUNDIDAD.md)


