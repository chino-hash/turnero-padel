### Análisis actualizado del proyecto: chino-hash/turnero-padel

Este repositorio implementa un sistema completo de gestión de reservas para canchas de pádel, con frontend en Next.js y backend en App Router, autenticación con Google OAuth y base de datos PostgreSQL (Neon) usando Prisma. El análisis a continuación está basado en el código actual del proyecto y su documentación interna.

#### Nombre y estado

- Nombre: `turnero-padel`
- Descripción: Gestión de turnos y reservas con panel de administración, calendario interactivo, prevención de conflictos, pagos por jugador y actualizaciones en tiempo real.
- Estado: Operativo y en evolución. Últimas actualizaciones: noviembre 2025. Incluye suites de pruebas (Jest, Playwright, Cypress) y documentación técnica extensa.

#### Estructura principal

- `turnero-padel/app/` Rutas de la aplicación (App Router en Next.js 15)
- `app/(protected)/bookings` Vistas protegidas de reservas, filtros, formularios y estadísticas
- `app/admin-panel` Panel admin con dashboards, gestión de canchas, productos y usuarios
- `app/api` Backend con múltiples endpoints: `auth`, `bookings`, `courts`, `slots`, `crud`, `recurring-bookings`, `recurring-exceptions`, `events`, `estadisticas`
- `app/login` Página de inicio de sesión, `app/auth/error` manejo de errores de auth
- `components/` UI reutilizable (Radix + Tailwind) y componentes de negocio (`AdminTurnos`, `MisTurnos`, `TurneroApp`)
- `components/ui/` Kit de interfaz: `button`, `dialog`, `table`, `calendar`, etc.
- `components/providers/` Proveedores de estado y sesión
- `hooks/` `useAuth`, `useBookings`, `useSlots`, `useRealTimeUpdates`, `useUserBookings`
- `lib/` Servicios, repositorios, validaciones y utilidades
- `lib/auth.ts` Configuración NextAuth v5 con Google y roles, páginas personalizadas
- `lib/services/BookingService.ts` Lógica de reservas (disponibilidad, creación, actualización, cancelación, pagos, estadísticas)
- `lib/repositories/BookingRepository.ts` Acceso optimizado a BD con Prisma
- `lib/database/*` Configuración Neon + Prisma, optimizaciones y utilidades de transacciones
- `lib/validations/*` Esquemas Zod para API y UI
- `lib/sse-events.ts` Emisores SSE para actualizaciones en tiempo real
- `prisma/schema.prisma` Modelos y relaciones (ver sección BD)
- `tests/`, `__tests__/` Suites de pruebas unitarias, integración y rendimiento
- `docs/` Documentación técnica y guías (APIs, arquitectura, despliegue, pruebas)

#### Tecnologías y versiones

- Frontend: `next@15.5.2`, `react@19`, `react-dom@19`, `tailwindcss@^4`, Radix UI, `lucide-react`
- Autenticación: `next-auth@^5.0.0-beta`, `@auth/prisma-adapter`
- Base de datos: `@prisma/client@^6.14.0`, `prisma@^6.14.0`, PostgreSQL (Neon)
- Utilidades: `zod`, `date-fns`, `lodash`, `react-hook-form`, `react-hot-toast`
- Testing: `jest@^30`, `@playwright/test`, `cypress@^14`, `@testing-library/*`

#### Middleware y seguridad

- Middleware de protección de rutas basado en NextAuth v5
- Rutas públicas: `/`, `/login`, `/auth/error`, algunas APIs de lectura
- Rutas admin: `/admin`, `/dashboard`, `/admin-panel` restringidas por `isAdmin`
- Rate limiting por endpoint: creación, lectura, actualización y operaciones masivas
- Headers de seguridad en `next.config.js` y políticas de iframe

#### Backend: endpoints clave

- `GET/POST /api/bookings` Listado filtrado/paginado y creación de reservas con validación Zod y rate limiting
- `GET /api/bookings/availability` Verificación de disponibilidad para rango horario
- `POST /api/bookings/availability/slots` Cálculo de slots disponibles (intervalos de 30 min, duración configurable)
- `PATCH /api/bookings/bulk` Actualizaciones masivas (admin)
- `GET /api/bookings/stats` Métricas de reservas (totales, confirmadas, canceladas, revenue, tasa de ocupación)
- `GET/POST /api/courts` Gestión de canchas y eventos relacionados
- `GET/POST /api/recurring-bookings` Reservas recurrentes
- `GET/POST /api/recurring-exceptions` Excepciones para recurrentes (saltos y overrides)
- `GET/POST /api/auth/[...nextauth]` Autenticación con Google OAuth
- Endpoints de prueba admin para SSE: `POST /api/admin/test-event`

#### Base de datos y modelos (resumen)

- `User`, `Account`, `Session`, `VerificationToken`
- `Court` Canchas, precios base, multiplicadores, horarios operativos, estado
- `Booking` Reservas con estado, método de pago, depósito, relación con jugadores, extras y pagos
- `BookingPlayer` Jugadores de una reserva con pagos individuales y posición
- `Payment` Pagos asociados a reserva o jugador (tipos: pago, reembolso, ajuste)
- `Producto` Catálogo de productos para extras
- `BookingExtra` Extras vinculados a productos y jugadores
- `SystemSetting` Configuración del sistema por clave/categoría
- `AdminWhitelist` Lista blanca de administradores por correo
- `RecurringBooking` Reservas recurrentes por día de semana, con rango de vigencia y estado
- `RecurringBookingException` Excepciones puntuales (saltar/override con precio)
- Índices y optimizaciones: múltiples índices por búsqueda, reportes y soft delete

#### Funcionalidades destacadas

- Prevención de conflictos y verificación de disponibilidad en tiempo real
- Generación de slots por cancha/fecha con cálculo de precio final y por persona
- Pagos por jugador y estado de pago de la reserva (pendiente, depósito, pago total)
- Extras/productos por reserva o jugador con totales y notas
- Operaciones masivas para administración
- Reservas recurrentes y manejo de excepciones
- SSE para actualizaciones en tiempo real de canchas, reservas y slots
- Panel admin con secciones: turnos, canchas, productos, estadísticas, usuarios

#### Rendimiento y optimizaciones

- Configuración Neon con conexión serverless y utilidades de transacción con reintentos
- Repositorio con includes y filtros optimizados, soft delete y búsqueda texto
- Rate limiting por operación (memoria en desarrollo; recomendado Redis en producción)
- Logs controlados por entorno y health check de BD

#### Instalación y scripts

- Desarrollo: `npm run dev`, build: `npm run build`, producción: `npm start`
- Pruebas: `npm run test` (unit), `test:integration`, `test:performance`, `test:e2e`, `test:cypress`, `test:all`
- Lint: `npm run lint`
- Prisma: `npx prisma generate`, `npx prisma db push`

#### Variables de entorno (principales)

- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`, `DIRECT_URL` (Neon)
- `ADMIN_EMAILS` (coma separada)

#### Nota para extracción de módulos

- La lógica de reservas (`lib/services/BookingService.ts` + `lib/repositories/BookingRepository.ts` + validaciones Zod) es candidata a extraerse como paquete reutilizable (por ejemplo `@turnero/reservation-engine`) con adaptadores para Prisma y esquemas tipados.

En síntesis, el proyecto está actualizado a Next.js 15/React 19, usa NextAuth v5 beta con Google, Prisma 6 y Neon. Incorpora pagos por jugador, extras y reservas recurrentes, además de SSE y panel de administración completo.
