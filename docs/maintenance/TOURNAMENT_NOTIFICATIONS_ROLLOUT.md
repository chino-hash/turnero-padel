# Rollout de notificaciones por torneo

## Variables de entorno

- `EMAIL_NOTIFICATIONS=true`
- `TOURNAMENT_EMAIL_NOTIFICATIONS=true`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `TENANT_DEFAULT_TIMEZONE` (fallback recomendado: `America/Argentina/Buenos_Aires`)

## Secuencia recomendada

1. Ejecutar migraciones en staging.
2. Dejar `TOURNAMENT_EMAIL_NOTIFICATIONS=false` y validar que:
   - se crean `CourtBlock`,
   - se cancela `Booking`,
   - se crea `RecurringBookingException (SKIP)`.
3. Activar `TOURNAMENT_EMAIL_NOTIFICATIONS=true` en staging.
4. Verificar endpoint admin de retry:
   - `POST /api/admin/notifications/retry?limit=50`.
5. Revisar métricas operativas:
   - `emailsScheduled`,
   - `emailsAttempted`,
   - cantidad de `NotificationLog` en `FAILED`.
6. Activar gradualmente en producción.

## Rollback funcional

Si aparece incidente en entrega SMTP:

1. Desactivar `TOURNAMENT_EMAIL_NOTIFICATIONS=false`.
2. Mantener operativos:
   - cancelación por torneo,
   - creación de excepciones `SKIP`.
3. Corregir SMTP y reactivar.
4. Reprocesar pendientes/fallidos con endpoint de retry.

## Backfill opcional

Script disponible:

- `node scripts/backfill-tournament-notification-log.js` (dry-run)
- `node scripts/backfill-tournament-notification-log.js --enqueue` (crea pendientes futuras)
