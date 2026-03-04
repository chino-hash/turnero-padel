# Aplicar esta migración a mano

Si `npx prisma migrate deploy` falla por falta de `DIRECT_URL`, puedes ejecutar el SQL de esta migración directamente en tu base de datos (Neon SQL Editor, psql, etc.).

1. Abre el **SQL Editor** de tu proyecto Neon (o tu cliente PostgreSQL).
2. Copia y pega el contenido de `migration.sql` (en esta misma carpeta).
3. Ejecuta el script.

Después de aplicarlo, reinicia la app. El error "The column `tournamentFormat` does not exist" debería desaparecer.

**Importante:** Si usas `prisma migrate` en el futuro, marca esta migración como aplicada para que Prisma no intente repetirla:

```sql
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  '',
  NOW(),
  '20260303120000_add_tournament_format_prizes_groups_match_bracket',
  NULL,
  NULL,
  NOW(),
  1
);
```

(O ejecuta `npx prisma migrate resolve --applied 20260303120000_add_tournament_format_prizes_groups_match_bracket` si ya tienes DIRECT_URL configurado después.)
