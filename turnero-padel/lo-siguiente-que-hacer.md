# Lo Siguiente Que Hacer

Objetivo
- Consolidar autenticación, base de datos, seguridad, SSE y pruebas para un sistema más robusto y listo para producción.
- Minimizar riesgos abiertos identificados y establecer un checklist claro de verificación.

Acciones Prioritarias (Alta)
- Implementar la ruta de NextAuth en App Router:
  - Crear `app/api/auth/[...nextauth]/route.ts` y exponer los handlers:
    ```ts
    // app/api/auth/[...nextauth]/route.ts
    import { handlers } from '../../../../lib/auth'
    export const { GET, POST } = handlers
    ```
  - Verificar que `/api/auth/session`, `/api/auth/providers`, `/api/auth/csrf` responden y que el middleware permite `/api/auth/*`.

- Endurecer `app/api/debug-env/route.ts`:
  - Bloquear completamente en producción (`404`) o proteger con token desde env:
    - Usar `DEBUG_ENV_TOKEN` en lugar de un valor fijo.
    - Ejemplo de enfoque:
      ```ts
      if (isProduction) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 })
      }
      const expected = process.env.DEBUG_ENV_TOKEN
      if (expected && authHeader !== `Bearer ${expected}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      ```
  - Documentar su uso solo para debugging local.

- Consolidar migraciones y proveedor de base de datos:
  - Alinear `schema.prisma` con PostgreSQL (Neon) y eliminar ambigüedad con `dev.db` (SQLite).
  - Generar una migración de reconciliación única que:
    - Mantenga `ENUM` (`Role`, `BookingStatus`, etc.) y la tabla `Producto`.
    - Unifique tablas y claves foráneas de las dos “init”.
  - Pasos sugeridos:
    - Revisar `provider` en `schema.prisma` (`postgresql`).
    - Asegurar `DATABASE_URL` apunta a Neon (desarrollo y pruebas).
    - Ejecutar `prisma migrate status` y aplicar `prisma migrate dev` en entorno Postgres.
    - Eliminar o ignorar `dev.db` si no se usa.

Robustez y Observabilidad (Media)
- Rate limiting consistente:
  - Sustituir `Map` en memoria por Redis (Upstash) o KV del proveedor de despliegue.
  - Definir ventanas y límites por endpoint/IP; registrar métricas de rechazos.
  - Objetivo: evitar evasión de límites en múltiples instancias/serverless.

- Fortalecer SSE:
  - Añadir heartbeat controlado, backoff de reconexión y limpieza adecuada de conexiones.
  - Métricas de eventos emitidos/consumidos y errores de parseo.
  - Considerar canales/líneas por ámbito (courts/bookings) si aumenta la carga.

- Observabilidad:
  - Integrar `Sentry` o `OpenTelemetry` para trazas, métricas y alertas.
  - Monitorear latencias de endpoints, ratio de errores y estado SSE.

Pruebas y Calidad (Media)
- Autenticación:
  - Tests de que `GET/POST /api/auth/[...nextauth]` existen y responden 200/401 según sesión.
  - Verificar protección de rutas admin: `/admin`, `/dashboard`, etc., con redirección adecuada en `middleware`.

- SSE:
  - Tests que simulen eventos, reconexión y consumo en `hooks/useRealTimeUpdates`.
  - Validar que UI reacciona sin fugas y sin bloquear render.

- UI y resiliencia:
  - Patrones consistentes de skeleton/carga y mensajes de error para `/api/courts` y otros endpoints.
  - Confirmar que páginas públicas no hacen `fetch('/api/courts')` sin `view=public` salvo admin.

Checklist de Verificación
- Autenticación:
  - `app/api/auth/[...nextauth]` presente; `/api/auth/session` y `/api/auth/providers` responden.
  - `middleware.ts` permite `/api/auth/*` y protege admin; login redirige correcto con `callbackUrl`.

- Base de datos:
  - `prisma migrate status` limpio; migración reconciliada aplicada.
  - `DATABASE_URL` de Neon activa; `ENUM` operativos; tabla `Producto` creada.

- SSE:
  - `/api/events` funciona; eventos `courts_updated`, `bookings_updated`, `slots_updated` emitidos y recibidos.
  - Reconexión y limpieza de conexiones validadas.

- Rate limiting:
  - Límites aplicados con store consistente; métricas de rechazos visibles.

- Seguridad:
  - `debug-env` bloqueado o protegido con `DEBUG_ENV_TOKEN`.
  - Rutas públicas revisadas (`/`, `/login`, `/auth/error`, `/test`, `/demo`, `/test/slots`); no exponen operaciones sensibles.
  - Endpoints dev (`/api/dev/test-event`, `/api/courts/dev/event`) restringidos a desarrollo.

- Pruebas:
  - E2E e integración pasan; cobertura conforme a thresholds definidos.
  - Nuevos tests de auth y SSE integrados.

Notas de Entorno y Variables
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (NextAuth).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth).
- `DATABASE_URL` (PostgreSQL Neon).
- `ADMIN_EMAILS` (coma-separados; usados en `lib/auth.ts`).
- `DEBUG_ENV_TOKEN` (nuevo, solo desarrollo).
- `NODE_ENV` (`development`, `test`, `production`).

Riesgos Mitigados
- Ausencia de ruta NextAuth (404 en `/api/auth/*`).
- Migraciones duplicadas “init” y proveedor mixto (SQLite vs PostgreSQL).
- Rate limiting inconsistente en multi-instancia.
- Exposición involuntaria de endpoints de debug o dev.

Sugerencias de Orden de Ejecución
- 1) Crear `app/api/auth/[...nextauth]/route.ts`.
- 2) Endurecer `debug-env` y revisar rutas públicas.
- 3) Consolidar migraciones y confirmar proveedor DB.
- 4) Adoptar store para rate limiting (Redis/KV).
- 5) Fortalecer SSE y añadir observabilidad básica.
- 6) Agregar tests de auth/SSE y validar cobertura.

Resultado Esperado
- Autenticación estable y segura, DB consolidada, seguridad reforzada, SSE robusto y pruebas alineadas con producción.