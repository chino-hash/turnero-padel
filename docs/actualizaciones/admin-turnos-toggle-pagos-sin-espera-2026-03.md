# Admin Turnos: toggle de pagos sin espera entre jugadores

## Objetivo

Eliminar la espera de 5–10 segundos entre marcar un pago como "Pagado" y poder marcar el siguiente jugador. El usuario puede marcar varios pagos seguidos sin que todos los toggles del turno queden bloqueados hasta que responda el backend.

## Problema

En la sección **Jugadores y Pagos Individuales** de un turno (Admin Turnos):

1. La **UI optimista** ya aplicaba el cambio al instante: al hacer clic en "Pendiente" → "Pagado", el estado local se actualizaba de inmediato con `setBookings(...)`.
2. El **bloqueo** era por turno completo: se usaba `inFlightUpdates[bookingId] = true` al iniciar el toggle y `false` en el `finally` cuando terminaba el `PATCH`. Los **cuatro** botones de ese turno tenían `disabled={... || !!inFlightUpdates[booking.id]}`.
3. Mientras el `PATCH /api/bookings/[id]/players/position/[position]/payment` tardaba (red, cold start, DB), **ningún** otro toggle del mismo turno se podía pulsar, dando la sensación de que "el toggle tarda 5–10 segundos en marcarse y dejarme marcar el otro".

## Solución

**Desbloquear por jugador**, no por turno: solo el botón del jugador cuya petición está en vuelo queda deshabilitado; los otros tres siguen habilitados.

- La clave de `inFlightUpdates` pasó de `bookingId` a **`${bookingId}-${playerKey}`** (ej. `"abc-123-player1"`).
- El usuario puede marcar Pagado en Jugador 1 y, sin esperar la respuesta, marcar Jugador 2, 3 y 4. Cada uno dispara su propia petición PATCH en segundo plano.

## Cambios realizados

Archivo: **`components/AdminTurnos.tsx`**.

### 1. Estado `inFlightUpdates`

- Se mantiene como `Record<string, boolean>`.
- Las claves pasan a ser compuestas: **`bookingId-playerKey`** (ej. `player1`, `player2`, `player3`, `player4`).

### 2. Función `togglePlayerPayment`

- **Al inicio**: `setInFlightUpdates(prev => ({ ...prev, [\`${bookingId}-${playerKey}\`]: true }))`.
- **En el `finally`**: `setInFlightUpdates(prev => ({ ...prev, [\`${bookingId}-${playerKey}\`]: false }))`.

### 3. Render del botón de pago por jugador

- Donde antes se usaba `inFlightUpdates[booking.id]`, se reemplazó por **`inFlightUpdates[\`${booking.id}-${playerKey}\`]`** en:
  - `disabled`
  - `className` (opacidad / cursor)
  - `aria-disabled`

### 4. Indicador "Guardando..." (opcional)

- Cuando la petición de ese jugador está en vuelo (`inFlightUpdates[\`${booking.id}-${playerKey}\`] === true`), el botón muestra **"Guardando..."** con el icono `Loader2` en animación (`animate-spin`), en lugar de "Pagado" o "Pendiente".
- Import añadido: `Loader2` desde `lucide-react`.

## Comportamiento del backend

- No se modifican el endpoint **PATCH** ni el backend. Solo se permite enviar varias actualizaciones seguidas (una por jugador) sin esperar entre ellas.
- Si el backend recibe varias peticiones en paralelo, cada una actualiza una posición distinta; el diseño es seguro para uso concurrente por jugador.

## Resumen

| Aspecto                | Antes                          | Después                                        |
|------------------------|---------------------------------|------------------------------------------------|
| Clave de bloqueo       | `bookingId` (todo el turno)     | `bookingId-playerKey` (solo ese jugador)       |
| Toggles deshabilitados | Los 4 hasta que responda PATCH  | Solo el que acabas de pulsar                   |
| Marcar varios pagos    | Esperar 5–10 s entre cada uno   | Clics seguidos; peticiones en paralelo/cola    |
| Feedback en botón      | Solo deshabilitado              | "Guardando..." + spinner mientras está en vuelo |

## Relación con otra documentación

- Flujo de pagos y uso de PUT/PATCH: [reversion-flujo-pagos.md](reversion-flujo-pagos.md).
- Módulo de pagos Admin Turnos (4 jugadores, `computeAmountPaid`, cierre): [cambios-modulo-pagos-admin-turnos.md](cambios-modulo-pagos-admin-turnos.md).
