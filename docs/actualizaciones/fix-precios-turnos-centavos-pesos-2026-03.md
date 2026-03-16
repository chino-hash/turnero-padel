# Corrección: precios en sección de turnos (centavos → pesos) (2026-03)

**Fecha:** Marzo 2026  
**Relación:** Plan "Corregir visualización de precios en sección de turnos"

## Resumen

En las secciones **Mis Turnos**, **admin de turnos** y **dashboard admin**, los precios se mostraban en crudo (centavos) en lugar de en pesos, por lo que aparecía por ejemplo **$2000** en lugar de **$20,00**. Al sacar el turno (modal de confirmación y Mercado Pago) el precio ya se veía bien. Se implementó una utilidad de conversión **centavos → pesos** y se aplicó solo en la **visualización**, sin cambiar la API ni la lógica de negocio.

---

## 1. Causa del problema

- En base de datos, **Booking.totalPrice** y **Booking.depositAmount** están en **centavos** (porque `Court.basePrice` se persiste ×100 en `lib/services/courts.ts` y el cálculo en `BookingService` usa ese valor).
- Al crear la reserva, el precio se calcula bien; **Mercado Pago** recibe pesos porque en `createPaymentPreference` se hace `amountInCentavos / 100`.
- Los **slots** muestran precio correcto porque usan `getCourtById`, que devuelve `basePrice` en pesos (`/ 100`).
- En las **vistas de turnos** (Mis Turnos, admin turnos, dashboard) se mostraba `totalPrice` y `depositAmount` **sin convertir** a pesos, por eso se veía $2000 en lugar de $20.

---

## 2. Enfoque de la solución

- Introducir una **utilidad de conversión centavos → pesos** para uso exclusivo en la **UI**.
- Usarla **solo donde se muestra** el monto al usuario.
- **No** cambiar la API ni la lógica de negocio (comparaciones, cierre de turno, validaciones): todo sigue trabajando en centavos.

---

## 3. Cambios realizados

### 3.1 Utilidad de conversión (nuevo archivo)

**Archivo:** `lib/utils/currency.ts`

- **`centsToPesos(cents: number): number`**  
  Convierte centavos a pesos (`cents / 100`). Solo para visualización; no usar en lógica de negocio.

- **`formatPesosFromCents(cents: number): string`**  
  Convierte centavos a pesos y formatea con `toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` para mostrar en UI de forma consistente.

- Comentario en cabecera: aclara que Booking.totalPrice, Booking.depositAmount, BookingExtra.totalPrice y BookingPlayer.paidAmount vienen en centavos y que estas funciones son solo para **display**.

### 3.2 Mis Turnos (usuario)

**Archivo:** `components/MisTurnos.tsx`

- Precio total de la reserva: se muestra con `formatPesosFromCents(booking.totalPrice)`.
- Pagado (seña): `formatPesosFromCents(booking.deposit ?? 0)`.
- Pendiente: `formatPesosFromCents(booking.totalPrice - (booking.deposit ?? 0))`.

### 3.3 Admin de turnos

**Archivo:** `components/AdminTurnos.tsx`

- **Detalle expandido de cada turno:**  
  Total original, Pagado y Saldo pendiente: se aplica `centsToPesos(...)` antes de formatear con `formatCurrency(...)`.
- **Monto por jugador** en la grilla de pagos: `formatPesosFromCents(playerAmount)`.
- **Coste de extras** (agrupados): `formatPesosFromCents(group.cost)`.
- **Chip de saldo** en las tarjetas (turnos fijos, confirmados, en curso, cerrados): `formatPesosFromCents(chipValue)`.
- **Resumen financiero:** Ingresos, Total recaudado, Saldo pendiente y Total reserva: todos con `formatPesosFromCents(...)`.
- **Exportación CSV:** extras y total de extras mostrados en pesos con `formatPesosFromCents(e.cost)` y `formatPesosFromCents(extrasTotal)`.

La lógica interna (totalOriginal, amountPaid, pendingBalance, validación `pendingBalance > 0` en closeBooking, etc.) sigue en centavos.

### 3.4 Dashboard admin

**Archivo:** `app/admin-panel/admin/page.tsx`

- Tarjeta de **Ingresos** en el resumen superior: total con `formatPesosFromCents(filteredBookings.reduce(...))`.
- Card **Ingresos (Hoy)** en la sección de estadísticas: mismo criterio.

### 3.5 Padel-booking (vista principal / admin)

**Archivo:** `padel-booking.tsx`

- **Ingresos totales** en el resumen de pagos: `formatPesosFromCents(paymentSummary.totalRevenue)`.
- **Pagos pendientes:** `formatPesosFromCents(paymentSummary.pendingPayments)`.
- **Modal de confirmación post-creación** (Total): `formatPesosFromCents(newBooking.totalPrice || 0)`.
- **Modal de cancelación:** Seña pagada con `formatPesosFromCents(selectedBookingForCancel.deposit ?? 0)` y texto de reembolso con `formatPesosFromCents(refundAmount)`.

### 3.6 UserBookingsList

**Archivo:** `components/UserBookingsList.tsx`

- Precio de la reserva: `formatPesosFromCents(booking.totalPrice)`.
- Seña: `formatPesosFromCents(booking.depositAmount)` cuando existe y es > 0.

---

## 4. Resumen de archivos

| Archivo | Cambio |
|---------|--------|
| `lib/utils/currency.ts` | **Nuevo.** `centsToPesos`, `formatPesosFromCents` y documentación. |
| `components/MisTurnos.tsx` | Mostrar totalPrice, deposit y pendiente en pesos. |
| `components/AdminTurnos.tsx` | Todas las visualizaciones de totalPrice, extras, pagado, pendiente, totales y chips en pesos. |
| `app/admin-panel/admin/page.tsx` | Totales e ingresos en pesos. |
| `padel-booking.tsx` | Precios y totales en listado admin, deposit, refund y modal de éxito en pesos. |
| `components/UserBookingsList.tsx` | totalPrice y depositAmount en pesos. |

---

## 5. Comportamiento esperado

- **Al sacar el turno:** El modal "Confirmar Reserva" y Mercado Pago siguen mostrando el precio correcto (ya venían en pesos desde slots / preferencia de pago).
- **Mis Turnos:** El precio total, lo pagado y lo pendiente se ven en pesos (ej. $20,00 en lugar de $2000).
- **Admin de turnos:** Total original, pagado, saldo pendiente, monto por jugador, chips de saldo y resumen financiero en pesos.
- **Dashboard admin y padel-booking:** Ingresos, totales y montos en modales en pesos.
- **Lógica de negocio:** Sigue usando centavos (comparaciones, cierre de turno, APIs); no se modificó.

---

## 6. Notas para desarrolladores

- **Extras y Payment.amount:** Si `BookingExtra.totalPrice` está en centavos, se usa la misma conversión donde se muestre. Si en algún flujo `Payment.amount` se guarda en pesos (p. ej. desde Mercado Pago), no aplicar `/ 100` para ese campo en display.
- **Tests:** Revisar tests que asuman que la UI muestra el valor crudo en centavos y actualizar expectativas o mocks para que esperen valores en pesos donde corresponda.
