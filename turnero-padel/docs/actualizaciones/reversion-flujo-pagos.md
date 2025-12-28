# Reversión del flujo de pagos (toggle individual → PUT /api/bookings/[id])

Este cambio restaura el comportamiento original para actualizar pagos individuales de jugadores mediante una única actualización de la reserva usando `PUT /api/bookings/[id]`, en lugar de los endpoints `PATCH` por jugador.

## Cambios clave
- El botón de toggle de pago ahora construye un `payload` con el arreglo `players` (nombre, posición, `hasPaid`) y recalcula el `paymentStatus` del turno en el cliente.
- Se envía todo en una sola llamada `PUT` al endpoint principal de reservas.
- Se mantiene la **UI optimista** y **rollback** si el backend responde con error.

## Archivo afectado
- `components/AdminTurnos.tsx`: función `togglePlayerPayment` modificada para:
  - Mapear la clave de jugador (`player1..player4`) a posición.
  - Construir `players[]` desde el estado local aplicando el toggle.
  - Calcular `paymentStatus` del backend (`PENDING` | `DEPOSIT_PAID` | `FULLY_PAID`).
  - Hacer `PUT /api/bookings/[id]` con `{ players, paymentStatus }`.

## Consideraciones
- El backend (`updateBookingSchema`) soporta `players` con `hasPaid` y `paidAmount` opcional; aquí enviamos `hasPaid` y omitimos montos.
- El botón de toggle sigue deshabilitado si el turno está `completado` (para respetar la regla de cierre definitivo).
- SSE o futuras recargas sincronizarán el estado; la UI ya muestra el cambio de manera optimista.

## Motivación
- Evitar dependencia de `playerId` y desajustes por posición.
- Simplificar la actualización de pagos manteniendo coherencia con el contrato general de reserva.

## Próximos pasos (opcional)
- Si se requiere monto por jugador, extender el `payload` con `paidAmount` desde UI.
- Añadir pruebas e2e sobre el flujo PUT para garantizar consistencia en cierres de turno.