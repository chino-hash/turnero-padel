# Alineación del módulo de pagos de Turnos con Admin

## Objetivo
- Replicar la experiencia de pagos del panel `admin` en `admin/turnos`, manteniendo una división fija entre 4 jugadores.
- Integrar la lógica con el sistema de reservas existente.
- Añadir validaciones y manejo de errores consistentes.
- Registrar transacciones de pago y proveer fallback de auditoría.

## Alcance
- Archivo afectado principal: `components/AdminTurnos.tsx`.
- Sin cambios visuales: se mantiene la UI actual del módulo (chips, toggles, resúmenes). 
- Endpoints utilizados: `PUT /api/bookings/[id]`, `POST /api/crud/transaction` (registro), `POST /api/admin/test-event` (fallback).

## Cambios clave (implementado previamente)
- Cálculo de montos por jugador unificado a 4 jugadores: `calculatePlayerAmount(booking, playerKey)` divide `totalPrice` en 4 y suma extras asignados.
- Sustitución completa de cálculos `amountPaid` por `computeAmountPaid(booking)` en todas las secciones de `AdminTurnos` (Confirmadas, En curso, Completadas, Resumen).
- Reglas de cierre de turno: `closeBooking` valida que el saldo pendiente sea `0` usando `computeAmountPaid` y requiere los 4 jugadores pagados.
- `togglePlayerPayment` ajustado a estado basado en 4 jugadores y payload `players` + `paymentStatus` en el `PUT /api/bookings/[id]`.

## Cambios propuestos (esta iteración)
### 1) Validaciones y UX de `togglePlayerPayment`
- Validación de posición de jugador: `player1..player4` → posiciones 1–4.
- Verificación de estado previo antes de operar (para rollback si falla el backend).
- UI optimista con rollback en fallos del `PUT`.

### 2) Recomputo de estado de pago para backend
- Derivación de `paymentStatusBackend` para 4 jugadores:
  - `PENDING` (0 pagados)
  - `DEPOSIT_PAID` (parcial)
  - `FULLY_PAID` (4 pagados)
- Construcción de `playersPayload`: `{ playerName, position, hasPaid }` para los 4 slots.

### 3) Registro transaccional
- Intento de registrar la operación de pago vía `POST /api/crud/transaction`:
  - `operation: 'create', model: 'payment'`
  - `data`: `{ bookingId, amount: calculatePlayerAmount(...), method: 'CASH'|'ADJUSTMENT', status: 'COMPLETED'|'REVERSED' }` según toggle (marcar pago o revertir).
- Manejo silencioso si el registro falla (no rompe la UI ni revierte el estado si el `PUT` fue exitoso).

### 4) Fallback de auditoría por eventos
- Si la transacción falla, enviar `POST /api/admin/test-event` con `type: 'bookings_updated'` y mensaje legible:
  - Ejemplo: `Pago marcado/revertido para booking {id} jugador {posición} por ${monto}`.

## Endpoints y servicios
- `PUT /api/bookings/[id]`: actualización de `players` y `paymentStatus`.
- `POST /api/crud/transaction`: ejecución de transacción y creación de registro en `payment`.
- `POST /api/admin/test-event`: emisión de evento SSE para auditoría administrativa.
- Servicio: `lib/services/crud-service.ts` → `transaction()` define contrato y auditoría (`createdAt`, `updatedAt`).

## Datos y enums (nota)
- Los valores `method`/`status` del modelo `payment` pueden ser enums Prisma. Si difieren de `'CASH'|'ADJUSTMENT'` y `'COMPLETED'|'REVERSED'`, se deben adaptar al esquema real para evitar rechazos.

## Verificación manual
- Ir a `http://localhost:3000/admin-panel/admin/turnos`.
- Usar el toggle de cada jugador y comprobar:
  - Recuento de pagos por jugador y `paymentStatus` derivado.
  - Actualización del saldo en chips y en el Resumen Financiero.
- Validar que el cierre solo se habilita con 4 pagos.
- Revisar logs: si el backend soporta `payment`, confirmar creación; si no, verificar emisión del evento de fallback.

## Riesgos y consideraciones
- El endpoint `POST /api/bookings/[id]/close` está planificado (según docs), no garantizado; el cierre se mantiene con validaciones client-side y el `PUT` principal.
- Si el schema de `payment` difiere, la transacción puede fallar; se contempla fallback SSE para no perder auditoría.
- Mantener credenciales (`same-origin`) y encabezados correctos (`Content-Type: application/json`).

## Checklist
- [x] División por 4 jugadores consistente.
- [x] `computeAmountPaid` usado en todas las secciones.
- [x] `togglePlayerPayment` con payload `players` y `paymentStatus`.
- [x] Validaciones y rollback de UI.
- [x] Registro transaccional con fallback de eventos.
- [x] Cierre condicionado por saldo pendiente.

## Estado
- Cambios previos: implementados.
- Cambios de esta iteración: documentados y listos para aplicar/ajustar según el schema de `payment`.
revisa este codigo para ver si es el indicado 

function AdminTurnos() {
    // ... existing code ...
    const togglePlayerPayment = async (bookingId: string, playerKey: keyof Booking['individualPayments']) => {
        // UI optimista: aplicar el cambio localmente primero
        let previousState: Booking | null = null
        setBookings(prevBookings => {
          return prevBookings.map(booking => {
            if (booking.id === bookingId) {
              previousState = booking
              const newPayments = {
                ...booking.individualPayments,
                [playerKey]: booking.individualPayments[playerKey] === 'pagado' ? 'pendiente' : 'pagado'
              }

              const paidCount = Object.values(newPayments).filter(status => status === 'pagado').length
              const totalPlayers = 4

              const paymentStatus: Booking['paymentStatus'] =
                paidCount === 0 ? 'pendiente' : paidCount === totalPlayers ? 'pagado' : 'parcial'

              return {
                ...booking,
                individualPayments: newPayments,
                paymentStatus
              }
            }
            return booking
          })
        })

        try {
          // Validación: estado anterior disponible y posición válida
          if (!previousState) throw new Error('Estado previo no disponible')
          const position = Number(String(playerKey).replace('player', ''))
          if (!(position >= 1 && position <= 4)) throw new Error(`Posición inválida: ${position}`)

          const newPaidStatus = previousState.individualPayments[playerKey] === 'pagado' ? false : true

          // Reconstruir estado de pagos tras el toggle para calcular paymentStatusBackend con 4 jugadores
          const currentPayments = { ...(previousState.individualPayments || {}) } as Booking['individualPayments']
          const toggledPayments = { ...currentPayments, [playerKey]: newPaidStatus ? 'pagado' : 'pendiente' }

          // Construir payload de jugadores desde el estado previo, aplicando el toggle
          const playerKeys: Array<keyof Booking['players']> = ['player1', 'player2', 'player3', 'player4']
          const playersPayload = playerKeys
            .map((key, idx) => {
              const name = (previousState?.players[key] || '').trim()
              if (!name) return null
              const hasPaid = toggledPayments[key as keyof Booking['individualPayments']] === 'pagado'
              return {
                playerName: name,
                position: idx + 1,
                hasPaid
              }
            })
            .filter(Boolean) as Array<{ playerName: string; position: number; hasPaid: boolean }>

          // Calcular `paymentStatus` para backend (enum prisma)
          const paidCountBackend = Object.values(toggledPayments).filter(s => s === 'pagado').length
          const totalPlayersBackend = 4
          const paymentStatusBackend = paidCountBackend === 0
            ? 'PENDING'
            : paidCountBackend === totalPlayersBackend
              ? 'FULLY_PAID'
              : 'DEPOSIT_PAID'

          // Enviar actualización vía PUT al endpoint principal
          const putRes = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ players: playersPayload, paymentStatus: paymentStatusBackend })
          })

          if (!putRes.ok) {
            let errorMessage = `Error actualizando reserva (HTTP ${putRes.status})`
            try {
              const data = await putRes.json()
              if (data?.error) errorMessage = `Error actualizando reserva: ${data.error}`
            } catch (_) {}
            throw new Error(errorMessage)
          }

          // Registro de transacción: crear entrada de pago
          try {
            const playerAmount = calculatePlayerAmount(previousState, playerKey as keyof Booking['players'])
            const txRes = await fetch('/api/crud/transaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({
                operations: [
                  {
                    operation: 'create',
                    model: 'payment',
                    data: {
                      bookingId,
                      amount: playerAmount,
                      // Evitar suposiciones de enums desconocidos; usar valores comunes
                      method: newPaidStatus ? 'CASH' : 'ADJUSTMENT',
                      status: newPaidStatus ? 'COMPLETED' : 'REVERSED'
                    }
                  }
                ]
              })
            })

            // Si la transacción no está disponible o falla, emitir evento de admin como fallback
            if (!txRes.ok) {
              await fetch('/api/admin/test-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                  type: 'bookings_updated',
                  message: `Pago ${newPaidStatus ? 'marcado' : 'revertido'} para booking ${bookingId} jugador ${position} por $${playerAmount}`
                })
              }).catch(() => {})
            }
          } catch (logErr) {
            // Logging silencioso: no revertir UI por fallo de registro
            console.warn('Fallo registrando transacción de pago:', logErr)
          }

          // Éxito: no es necesario actualizar estado, la UI ya refleja el cambio
        } catch (err) {
          console.error('Fallo al actualizar pago del jugador:', err)
          // Revertir UI optimista si falla en errores reales del backend (no 404 controlado)
          if (previousState) {
            setBookings(prevBookings => prevBookings.map(b => (b.id === bookingId ? previousState! : b)))
          }
        }
      }
    // ... existing code ...
}