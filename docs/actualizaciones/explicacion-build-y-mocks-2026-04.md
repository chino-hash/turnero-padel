# Build en Vercel y mapa de mocks

**Fecha:** 28 de abril de 2026  
**Contexto:** explicación consolidada del error de deploy y de los archivos mock/fixture del proyecto.

---

## 1) Qué pasó en el build

Durante el deploy en Vercel, el build compiló pero falló en el chequeo de tipos de TypeScript con este error:

- `Property 'courtType' is missing ... but required in type 'Court'`
- Archivo afectado: `components/test/SlotsTest.tsx`

Esto ocurrió porque el tipo `Court` (definido en `types/types.ts`) ahora exige `courtType` como campo obligatorio.

---

## 2) Causa raíz

En `components/test/SlotsTest.tsx`, los mocks `testCourts` no incluían `courtType`.

Como Next/TypeScript valida tipos en build de producción, un mock con shape incompleto también puede romper el deploy aunque no sea código de runtime principal.

---

## 3) Corrección aplicada

Se agregó `courtType` en los 3 objetos de `testCourts`:

- Cancha 1: `OUTDOOR`
- Cancha 2: `INDOOR`
- Cancha 3: `OUTDOOR`

Archivo corregido:

- `components/test/SlotsTest.tsx`

---

## 4) Sobre los warnings de nodemailer

Los warnings de `peer dependency` (`@auth/core` esperando `nodemailer ^6.8.0` y proyecto usando `7.x`) **no fueron la causa del fallo**.

- Son advertencias de resolución de dependencias.
- El build se detuvo por error de tipos (`courtType` faltante), no por esos warnings.

---

## 5) Mapa de mocks y fixtures del proyecto

### 5.1 Mocks/fixtures principales

- `components/test/SlotsTest.tsx`
  - Mocks inline: `testCourts`.
- `lib/services/test-data.ts`
  - Fixtures de dominio: `testUsers`, `testCourts`, `testBookings`, `testPayments`, etc.
- `__tests__/mocks/handlers.js`
  - Mock data base para pruebas (`mockCourts`, `mockBookings`, `mockUser`).
- `__tests__/mocks/server.js`
  - Utilidades para mock de `fetch`: `mockFetch`, `mockApiError`, `mockApiSuccess`, `mockApiDelay`.

### 5.2 Mocks de flujos/pagos o simulación

- `lib/services/payments/MockPaymentProvider.ts`
- `lib/services/payments/MockRefundService.ts`
- `app/api/bookings/[id]/mock-confirm/route.ts`
- `app/payments/mock-success/page.tsx`
- `cypress/fixtures/auth/session.json`

### 5.3 Mocks inline en tests

Hay múltiples tests que usan `jest.mock(...)` directamente dentro de cada archivo (además de los mocks centralizados).

---

## 6) Nota operativa

Si vuelve a cambiar el tipo `Court` (u otros tipos compartidos), hay que revisar también:

- mocks inline en componentes de test
- fixtures en `lib/services/test-data.ts`
- mocks de `__tests__/mocks/*`

Esto evita fallas de tipo en build de CI/CD.

