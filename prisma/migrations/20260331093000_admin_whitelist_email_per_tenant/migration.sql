-- Permite reutilizar el mismo email admin en distintos tenants.
-- Antes existía unique(email) global en AdminWhitelist, lo que impedía multi-tenant real.

DROP INDEX IF EXISTS "public"."AdminWhitelist_email_key";

CREATE UNIQUE INDEX IF NOT EXISTS "AdminWhitelist_email_tenantId_key"
ON "public"."AdminWhitelist"("email", "tenantId");
