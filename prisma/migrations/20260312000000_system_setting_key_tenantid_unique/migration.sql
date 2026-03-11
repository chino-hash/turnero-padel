-- SystemSetting: cambiar unique de (key) a (key, tenantId) para soportar multitenant.
-- Permite que cada tenant tenga sus propios system settings con las mismas keys.
-- Idempotente: si el índice nuevo ya existe (p. ej. aplicado antes), no falla.

DROP INDEX IF EXISTS "public"."SystemSetting_key_key";

CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_tenantId_key" ON "public"."SystemSetting"("key", "tenantId");
