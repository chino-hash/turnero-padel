# Mis Turnos: "Pendiente" aunque ya pagado y botón Sincronizar (2026-03)

**Fecha:** Marzo 2026  
**Relación:** [Pendientes solo en grilla, sync al volver de MP](./pendientes-solo-grilla-sync-pago-2026-03.md), [Mis Turnos pendientes y historial](./mis-turnos-pendientes-expirados-y-historial-2026-03.md)

Documentación de por qué un turno puede mostrarse como **Pendiente** cuando el usuario ya pagó, y del botón **"¿Ya pagaste? Sincronizar"** en Reservas Actuales.

---

## 1. Por qué puede salir "Pendiente" si ya se pagó

La etiqueta **"Pendiente"** en la tarjeta de **Reservas Actuales** (Mis Turnos) viene del **estado de pago** que guarda la aplicación (`Booking.paymentStatus`), no de si el dinero ya fue debitado en Mercado Pago.

Ese estado se actualiza cuando ocurre al menos una de estas dos cosas:

1. **Webhook de Mercado Pago:** Tras aprobar el pago, MP notifica al servidor; el handler actualiza la reserva a `CONFIRMED` y `paymentStatus` a `DEPOSIT_PAID`.
2. **Vuelta por la URL de éxito:** Si el usuario regresa a la app desde la página de éxito de MP (URL con `?section=turnos&bookingId=xxx`), el front llama a `POST /api/bookings/[id]/sync-payment-status`, que consulta MP y, si hay pago aprobado, actualiza la reserva.

Si el usuario pagó pero el turno sigue mostrando "Pendiente", suele deberse a:

- **No volvió por la URL de éxito:** Cerró la pestaña o entró por otro enlace, y el sync al volver no se ejecutó.
- **Webhook no llegó o falló:** Problemas de red, URL de webhook incorrecta o no accesible, etc.

En esos casos la base de datos mantiene `paymentStatus = PENDING` aunque en Mercado Pago el pago esté aprobado.

**Nota sobre "Cancelada":** Si en la misma tarjeta aparece también **"Cancelada"**, eso corresponde al **estado de la reserva** (confirmada / cancelada / completada). Puede darse que la reserva esté cancelada y el estado de pago no se haya actualizado, mostrando ambos textos.

---

## 2. Botón "¿Ya pagaste? Sincronizar"

Para que el usuario pueda recuperar el estado cuando ya pagó pero la app no se actualizó, se añadió un botón en las tarjetas de **Reservas Actuales** cuando el turno sigue en **Pendiente**.

### Comportamiento

- **Dónde se muestra:** En cada tarjeta de reserva actual cuyo `paymentStatus` es `Pending` (junto al botón "Pagar seña" si aplica).
- **Al hacer clic:**
  1. El front llama a `POST /api/bookings/[bookingId]/sync-payment-status`.
  2. El backend consulta en Mercado Pago si existe un pago aprobado con `external_reference = bookingId`.
  3. Si hay pago aprobado: se actualiza la reserva a `CONFIRMED`, `paymentStatus` a `DEPOSIT_PAID`, se crea el registro en `Payment` y se hace refetch de las reservas del usuario.
  4. Si no hay pago aprobado o MP no está configurado: se muestra un mensaje adecuado y se hace refetch de todas formas.

### Archivos tocados

| Archivo | Cambio |
|--------|--------|
| `components/MisTurnos.tsx` | Nueva prop opcional `onSyncPayment?: (bookingId: string) => Promise<void>`. En `BookingCard`, botón "¿Ya pagaste? Sincronizar" cuando `paymentStatus === 'Pending'` y `onSyncPayment` está definido. |
| `padel-booking.tsx` | Uso de `refetchUserBookings` del contexto; nuevo `handleSyncPayment(bookingId)` que llama a sync-payment-status y luego `refetchUserBookings()`; se pasa `onSyncPayment={handleSyncPayment}` a `MisTurnos`. |

El endpoint `POST /api/bookings/[id]/sync-payment-status` ya existía (ver [pendientes-solo-grilla-sync-pago-2026-03](./pendientes-solo-grilla-sync-pago-2026-03.md)); no se modificó.

---

## 3. Resumen para soporte / usuario

- **"Pendiente"** = la app aún no registró un pago para esa reserva (webhook o sync al volver no actualizaron).
- Si **ya pagaste**, entrá a **Mis Turnos → Reservas Actuales** y usá **"¿Ya pagaste? Sincronizar"** en ese turno; la app consultará Mercado Pago y actualizará el estado si el pago está aprobado.
- Si Mercado Pago no está configurado para el club, el botón mostrará un mensaje indicándolo.
