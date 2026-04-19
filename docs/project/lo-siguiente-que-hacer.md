# Lo siguiente que hacer

Documento de **seguimiento técnico** (no roadmap de producto). Las tareas “alta” del listado histórico ya están resueltas en el código actual; aquí queda lo que sigue teniendo sentido priorizar.

## Ya implementado (referencia)

- **NextAuth en App Router**: `app/api/auth/[...nextauth]/route.ts` expone `GET`/`POST` desde `lib/auth`.
- **PostgreSQL + Prisma**: `schema.prisma` usa `provider = "postgresql"`; migraciones en `prisma/migrations/`.
- **Multitenant**: tenants por slug, super admin, credenciales MP por tenant — ver [MULTITENANT_COMPLETE.md](../multitenant/MULTITENANT_COMPLETE.md).
- **Pagos**: integración Mercado Pago, webhooks y flujos de seña — ver `docs/actualizaciones/` y guías de pagos.
- **Rate limiting con KV**: `lib/rate-limit.ts` usa `@upstash/ratelimit` y `@vercel/kv` cuando las variables KV están definidas; si no, no bloquea (comportamiento permisivo en dev).

## Mejoras recomendadas (prioridad)

### Seguridad y operación

1. **`/api/debug-env`**: sustituir el token fijo por variable de entorno (p. ej. `DEBUG_ENV_TOKEN`) y en producción responder `404` si no hay token válido, o deshabilitar el endpoint por completo. Hoy acepta un valor embebido en código.
2. **Revisión periódica** de rutas y handlers solo para desarrollo (`/api/dev/*`, tests) para que no queden expuestos en producción sin guardas explícitas.

### Observabilidad

3. Integrar **Sentry**, **OpenTelemetry** o logs estructurados en Vercel para latencia, 4xx/5xx y webhooks MP.
4. Métricas SSE: reconexiones, errores de parseo, clientes concurrentes (si la carga crece).

### SSE y UX en tiempo real

5. Heartbeat / backoff de reconexión documentados y probados bajo carga; tests que cubran `useRealTimeUpdates` (reconexión, cleanup).

### Pruebas

6. E2E que cubran flujos críticos: login, reserva con tenant, admin turnos (pagos), donde sea estable en CI.
7. Mantener alineados los umbrales de Jest con lo que realmente se ejecuta en CI (`test:all:ci`).

## Cómo usar este documento

- Para **onboarding**, preferir [../README.md](../README.md), [../guides/installation.md](../guides/installation.md) y [../00-indice-documentacion.md](../00-indice-documentacion.md).
- Para **convenciones de código** en Cursor, ver `.cursor/skills/` (API, componentes, dominio, multitenant, servicios).

**Última actualización**: abril 2026.
