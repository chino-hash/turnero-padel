-- Inspección de tabla Venta/venta y columnas relacionadas
-- Ejecutar con:
--   npx prisma db execute --schema prisma/schema.prisma --file scripts/inspect-venta.sql

SELECT
  to_regclass('public."Venta"') AS venta_camelcase,
  to_regclass('public.venta')   AS venta_lowercase;

SELECT
  table_name,
  column_name,
  ordinal_position,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Venta', 'venta')
ORDER BY table_name, ordinal_position;

-- Conteo de filas (evita fallar si no existe la tabla)
DO $$
BEGIN
  IF to_regclass('public."Venta"') IS NOT NULL THEN
    RAISE NOTICE 'Rows in public."Venta": %', (SELECT COUNT(*) FROM public."Venta");
  END IF;
  IF to_regclass('public.venta') IS NOT NULL THEN
    RAISE NOTICE 'Rows in public.venta: %', (SELECT COUNT(*) FROM public.venta);
  END IF;
END $$;

