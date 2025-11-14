# Opción B: PATCH de pago individual de jugador

Este documento especifica la implementación de la opción B para gestionar pagos individuales de jugadores mediante un endpoint dedicado. El objetivo es permitir actualizaciones precisas (por jugador) sin tener que enviar el arreglo completo de `players` del turno.

## Resumen
- Añadir un endpoint: `PATCH /api/bookings/[bookingId]/players/[playerId]/payment`.
- Actualizar únicamente los campos de pago del jugador indicado (`hasPaid`, `paidAmount`, `paidAt`, `notes`).
- Recalcular el `paymentStatus` del turno tras cada operación y emitir `bookings_updated` vía SSE.
- Integrar llamadas desde el panel admin con UI optimista y fallback a refetch por SSE.

## Motivación
- Evitar sobre-escrituras accidentales del arreglo de jugadores al actualizar sólo uno.
- Reducir el payload y el acoplamiento entre UI y backend.
- Mejorar la trazabilidad de pagos individuales y la consistencia del estado del turno.

## Alcance
- Backend: nueva ruta `PATCH`, validación, servicio de negocio, actualización en repositorio y emisión SSE.
- Frontend (Admin): acción de toggle/actualización de pago por jugador, UI optimista y manejo de reconexión.
- Pruebas: unitarias, integración y e2e básicas.

## Contrato de API
- Endpoint: `PATCH /api/bookings/[bookingId]/players/[playerId]/payment`
- Auth: sólo admin (requerir sesión con rol admin/owner).
- Body (todas opcionales, pero se requiere al menos una):
  - `hasPaid: boolean`
  - `paidAmount: number` (monto individual, en la moneda del sistema)
  - `paidAt: string` (ISO 8601). Si `hasPaid=true` y falta, el backend puede setear `now`.
  - `notes: string` (observaciones internas)
- Respuesta (200):
  - `bookingId`
  - `playerId`
  - `playerPayment`: `{ hasPaid, paidAmount, paidAt, notes }`
  - `bookingPaymentStatus`: `"pending" | "partial" | "paid"` (o los estados ya definidos en el sistema)
- Errores comunes:
  - `400`: body inválido (ningún campo/valores fuera de rango).
  - `401/403`: sin sesión o rol insuficiente.
  - `404`: turno o jugador no encontrado/relación inválida.
  - `409`: conflicto de estado (opcional, sólo si definimos reglas de concurrencia).

## Validación (esquema)
- Nueva definición (Zod) sugerida: `updateBookingPlayerPaymentSchema`
- Reglas:
  - Al menos uno de: `hasPaid`, `paidAmount`, `paidAt`, `notes`.
  - `paidAmount` ≥ 0.
  - Si `hasPaid=false`, el backend puede opcionalmente limpiar `paidAt`.

## Lógica de negocio
1. Verificar relación `bookingId` ↔ `playerId` en `BookingPlayer`.
2. Aplicar parches sólo a los campos enviados.
3. Si `hasPaid` cambia:
   - `true`: setear `paidAt` si falta.
   - `false`: opcionalmente limpiar `paidAt`.
4. Recalcular `paymentStatus` del turno:
   - `paid` si todos los jugadores están `hasPaid=true` (y opcionalmente montos válidos).
   - `pending` si ninguno está pago.
   - `partial` en cualquier otro caso.
5. Persistir cambios y emitir `bookings_updated` (payload mínimo: `{ type: 'bookings_updated', bookingId }`).

## Emisión de SSE
- Usar el sistema existente de SSE para notificar `bookings_updated`.
- Alcance: todos los clientes conectados (panel admin, vistas relacionadas).

## Integración Frontend (Admin)
- Archivo: `components/admin/AdminTurnos.tsx` (o el componente que maneja la UI de jugadores).
- Acción: `handlePlayerPaymentToggle(bookingId, playerId, nextState)` → `fetch` al endpoint:

```ts
await fetch(`/api/bookings/${bookingId}/players/${playerId}/payment`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hasPaid: nextState }),
});
```

- UI optimista: actualizar el chip de "Pagado/Pendiente" localmente y revertir si la respuesta falla.
- SSE: mantener suscripción; ante `bookings_updated`, refrescar datos del turno.

## Archivos afectados (sugeridos)
- Backend
  - `turnero-padel/app/api/bookings/[id]/players/[playerId]/payment/route.ts` (nuevo)
  - `turnero-padel/lib/validations/booking.ts` (nuevo esquema: `updateBookingPlayerPaymentSchema`)
  - `turnero-padel/lib/services/bookings.ts` (nuevo servicio: `updatePlayerPaymentAndRecalc`)
  - `turnero-padel/lib/repositories/BookingRepository.ts` (método: `updateBookingPlayerPayment`)
  - `turnero-padel/lib/sse-events.ts` (uso existente para emitir `bookings_updated`)
- Frontend
  - `turnero-padel/components/admin/AdminTurnos.tsx` (llamadas al PATCH y UI optimista)
  - `turnero-padel/hooks/useRealTimeUpdates.ts` (ya maneja `bookings_updated`)
- Tests
  - `turnero-padel/__tests__/api/bookings.player.payment.patch.test.ts`
  - `turnero-padel/__tests__/integration/admin.payments.ui.test.ts`

## Plan de implementación (paso a paso)
1. Ruta API
   - Crear carpeta y archivo de ruta `payment/route.ts` para `PATCH`.
   - Verificar sesión y rol admin.
   - Parsear `bookingId` y `playerId` de params.
   - Validar body con `updateBookingPlayerPaymentSchema`.
2. Servicio
   - Implementar `updatePlayerPaymentAndRecalc(bookingId, playerId, data)`:
     - Actualizar `BookingPlayer` correspondiente.
     - Recalcular `paymentStatus` del turno.
     - Persistir y retornar datos necesarios para la respuesta.
3. Repositorio
   - `updateBookingPlayerPayment(bookingId, playerId, data)` para aplicar patch atómico.
4. SSE
   - Emitir `bookings_updated` tras éxito.
5. Frontend
   - Implementar la acción de toggle/patch.
   - UI optimista + manejo de errores (toast/alerta) + refresco por SSE.
6. Pruebas
   - Unitarias del esquema y servicio.
   - Integración del endpoint.
   - e2e básico: toggle en UI y ver cambio reflejado.

## Reglas de negocio (detalladas)
- `paidAmount` es informativo y no bloquea el estado si se omite.
- `paidAt` se setea automáticamente cuando `hasPaid=true` si no viene en el body.
- `paymentStatus` del turno depende sólo de `hasPaid` de los jugadores (criterio simple). Se puede extender luego para considerar extras/cargos.

## Seguridad
- Requiere rol admin.
- Rate limit básico por IP/usuario en el endpoint.
- Validar que `playerId` pertenece al `bookingId`.

## Manejo de errores
- Respuestas claras con códigos y mensajes.
- Reintentos en frontend sólo si el error es de red/transitorio.
- No repetir la emisión SSE en caso de fallo.

## Despliegue y compatibilidad
- Opción B convive con `PUT /api/bookings/[id]` actual (no se remueve).
- Documentar el nuevo uso en README de admin y guías internas.
- Feature flag opcional: `FEATURE_PLAYER_PAYMENT_PATCH=true` para habilitar la ruta.

## Checklist de entrega
- [ ] Ruta `PATCH` creada y segura
- [ ] Validaciones Zod cubren casos esperados
- [ ] Servicio y repositorio implementados
- [ ] Recalculo de `paymentStatus` probado
- [ ] Emisión `bookings_updated` validada
- [ ] AdminTurnos hace llamadas y maneja UI optimista
- [ ] Pruebas unitarias e integración pasan
- [ ] e2e básico ejecutado localmente
- [ ] Documentación actualizada

## Ejemplos de solicitud/respuesta
Solicitud:
```http
PATCH /api/bookings/123/players/456/payment
Content-Type: application/json

{
  "hasPaid": true,
  "paidAmount": 2375
}
```

Respuesta 200:
```json
{
  "bookingId": 123,
  "playerId": 456,
  "playerPayment": {
    "hasPaid": true,
    "paidAmount": 2375,
    "paidAt": "2024-01-19T10:15:00.000Z"
  },
  "bookingPaymentStatus": "partial"
}
```

---

Este documento sirve como guía para implementar la opción B más adelante, con pasos y contratos claros para backend y frontend.

## Gestión de Extras (Productos)

Objetivo
- Registrar consumos de productos en una reserva, tomándolos del catálogo (`/api/productos`), sin edición de precios desde la UI.
- Permitir asignar el consumo “a todos los jugadores” o a “un jugador específico”.
- Impactar en el cálculo de montos individuales y total con extras, manteniendo el `totalPrice` de la reserva como precio base de la cancha.
- Emitir `bookings_updated` para reflejar cambios en tiempo real.

Modelo de Datos (nuevo)
- Prisma: `BookingExtra`
  - `id: String @id @default(cuid())`
  - `createdAt: DateTime @default(now())`
  - `updatedAt: DateTime @updatedAt`
  - `bookingId: String` → relación `Booking`
  - `playerId: String?` → relación `BookingPlayer` (si se asigna a uno)
  - `productoId: Int` → relación `Producto`
  - `quantity: Int @default(1)` → cantidad consumida
  - `unitPrice: Int` → precio unitario en centavos (se toma de `Producto.precio` conviertiéndolo a entero)
  - `totalPrice: Int` → `unitPrice * quantity`
  - `assignedToAll: Boolean @default(false)` → si se asigna a todos
  - `consumedAt: DateTime @default(now())`
  - `notes: String?`
  - `deletedAt: DateTime?` (soft delete)
  - Índices: `bookingId`, `playerId`, `productoId`, `createdAt`
- Nota conversión precio: `Producto.precio` es `Float`. Convertimos a enteros (centavos) para mantener consistencia con los montos `Int` de `Booking`/`Payment`. Ej.: `unitPrice = Math.round(product.precio * 100)`.

APIs
- Catálogo (existente):
  - `GET /api/productos` → lista productos con `id`, `nombre`, `precio`, `stock`, `categoria`, `activo`.
- Extras por reserva (nueva ruta):
  - `GET /api/bookings/[id]/extras` → listar extras de la reserva.
  - `POST /api/bookings/[id]/extras`
    - Body: `{ productoId: number, quantity: number, assignedTo: 'ALL' | { playerId: string } }`
    - Reglas:
      - `price` se obtiene de DB (no del body).
      - Validar stock disponible y decrementar stock (`Producto.stock -= quantity`).
      - Calcular y guardar `unitPrice` y `totalPrice`.
    - Respuesta: `{ success: true, data: BookingExtra }` y `bookings_updated`.
  - `DELETE /api/bookings/[id]/extras/[extraId]`
    - Soft delete (`deletedAt`), restaurar stock si aplica.
    - Emitir `bookings_updated`.
- Seguridad:
  - Solo `ADMIN` puede crear/eliminar extras en reservas.
  - Validaciones y permisos en middleware/servicios.

Validación (Zod)
- Archivo sugerido: `lib/validations/extras.ts`
  - `createBookingExtraSchema`:
    - `productoId: z.number().int().min(1)`
    - `quantity: z.number().int().min(1).max(100)` (ajustable)
    - `assignedTo: z.union([z.literal('ALL'), z.object({ playerId: z.string().cuid() })])`
  - `deleteBookingExtraSchema`:
    - `extraId: z.string().cuid()`

Lógica de Negocio
- Cálculo de montos:
  - `base = booking.totalPrice`
  - `extrasTotal = sum(BookingExtra.totalPrice)`
  - `totalConExtras = base + extrasTotal`
- Distribución por jugador:
  - Extras `assignedToAll = true`: se prorratean entre `N` jugadores activos: `share = totalPrice / N`.
  - Extras con `playerId`: se suman íntegramente al jugador indicado.
- Stock:
  - Validar `Producto.activo` y `Producto.stock >= quantity`.
  - Descuento y potencial rollback si falla la transacción.
- SSE:
  - Emitir `eventEmitters.bookingsUpdated({ action: 'extras_added' | 'extras_removed', bookingId })`.

UI/UX (nuevo Modal de Productos)
- Nombre: “Agregar Producto”
- Campos:
  - `Producto`:
    - Combobox con búsqueda, agrupado por `categoria`.
    - Fuente: `GET /api/productos`.
  - `Cantidad` (`number`, mínimo 1, por defecto 1).
  - `Asignado a`: `Todos los jugadores` o selección de `Jugador {1..4}` según los que existan en la reserva.
- Mostrar precio:
  - Visualizar `precio` del producto (read-only) y total calculado `precio * cantidad`.
  - No permitir editar precio en UI.
- Acciones:
  - “Agregar” → `POST /api/bookings/[id]/extras`.
  - “Cancelar”.

Integración Frontend
- Componente: `components/admin/AdminTurnos.tsx`
- Cambios:
  - Eliminar estados `selectedExtraType` y `extraCost`.
  - Añadir estados: `selectedProductId`, `quantity`, `productos[]`.
  - Cargar productos al abrir modal o al montar el panel admin.
  - Reemplazar `handleAddExtra` para que llame al `POST /api/bookings/[id]/extras`.
  - Refrescar UI vía SSE (`bookings_updated`) y/o actualizar estado local con la respuesta del `POST`.
  - Cálculo de montos individuales: usar las reglas de distribución definidas arriba.

Contratos de Request/Response (ejemplos)

1) `GET /api/productos`
```json
{
  "success": true,
  "data": [
    { "id": 1, "nombre": "Pelota de Pádel", "precio": 5000, "stock": 50, "categoria": "Pelotas", "activo": true },
    { "id": 2, "nombre": "Gatorade", "precio": 4000, "stock": 30, "categoria": "Bebidas", "activo": true }
  ]
}
```

2) `POST /api/bookings/{bookingId}/extras`
```json
{
  "productoId": 2,
  "quantity": 3,
  "assignedTo": "ALL"
}
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "id": "cuid-xyz",
    "bookingId": "cuid-booking",
    "productoId": 2,
    "quantity": 3,
    "unitPrice": 4000,
    "totalPrice": 12000,
    "assignedToAll": true,
    "consumedAt": "2025-10-30T12:34:56.000Z"
  }
}
```

3) `DELETE /api/bookings/{bookingId}/extras/{extraId}`
```json
{ "success": true }
```

Pasos de Implementación
1. Modelo:
   - Agregar `BookingExtra` a `prisma/schema.prisma` y correr migración.
2. Validaciones:
   - Crear `lib/validations/extras.ts`.
3. API:
   - Crear `app/api/bookings/[id]/extras/route.ts` con `GET`, `POST`, `DELETE`.
   - Validar permisos admin.
   - Resolver stock y calcular montos (`unitPrice`, `totalPrice`).
   - Emitir `bookings_updated`.
4. Servicio/Repositorio:
   - `lib/services/extras.ts`: `addExtraToBooking`, `removeExtra`, `listExtras`.
   - Opcional: helper en `BookingService` para recálculo.
5. Frontend:
   - Reemplazar modal actual por “Agregar Producto”.
   - Integrar `GET /api/productos` y `POST /api/bookings/[id]/extras`.
   - Actualizar cálculo de montos individuales.
6. Testing:
   - Unit de validaciones y servicios de extras.
   - E2E en panel admin: agregar y eliminar producto, ver SSE y montos actualizados.

Checklist
- [ ] `BookingExtra` creado y migrado
- [ ] Validaciones Zod de extras
- [ ] Endpoints de extras funcionando
- [ ] SSE emite `bookings_updated` en altas/bajas de extras
- [ ] Modal con catálogo sin edición de precio
- [ ] Cálculo de montos individuales y total con extras


function AdminTurnos() {
  // ... existing code ...
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string; precio: number; stock: number; categoria: string }>>([])
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [assignedTo, setAssignedTo] = useState<'ALL' | { playerId: string }>('ALL')

  useEffect(() => {
    // Cargar catálogo de productos al abrir panel o modal
    fetch('/api/productos')
      .then(r => r.json())
      .then(json => {
        if (json.success) setProductos(json.data)
      })
      .catch(console.error)
  }, [])
  // ... existing code ...

  const handleAddExtra = async () => {
    if (!selectedBookingId || !selectedProductId || quantity < 1) return

    const body = {
      productoId: selectedProductId,
      quantity,
      assignedTo
    }

    const res = await fetch(`/api/bookings/${selectedBookingId}/extras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      // Opcional: actualizar estado local con la respuesta
      const json = await res.json()
      // setBookings(prev => prev.map(b => b.id === selectedBookingId ? { ...b, extras: [...b.extras, json.data] } : b))
      closeExtrasModal()
      // El SSE `bookings_updated` disparará el refresco global
    } else {
      // Manejo de error y rollback si hay UI optimista
    }
  }
  // ... existing code ...
}