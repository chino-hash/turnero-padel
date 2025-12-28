-- Configuración de optimización para Neon PostgreSQL
-- Este archivo contiene comandos SQL adicionales para optimizar la base de datos

-- ============================================================================
-- EXTENSIONES DE POSTGRESQL
-- ============================================================================

-- Extensión para búsqueda de texto completo y similitud
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para funciones de texto adicionales
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para búsqueda de texto completo en usuarios
CREATE INDEX IF NOT EXISTS idx_user_name_trgm ON "User" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_email_trgm ON "User" USING gin (email gin_trgm_ops);

-- Índices para búsqueda de texto completo en canchas
CREATE INDEX IF NOT EXISTS idx_court_name_trgm ON "Court" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_court_description_trgm ON "Court" USING gin (description gin_trgm_ops);

-- Índices compuestos adicionales para consultas complejas
CREATE INDEX IF NOT EXISTS idx_booking_complex_search 
ON "Booking" ("courtId", "bookingDate", "status", "paymentStatus") 
WHERE "deletedAt" IS NULL;

-- Índice para consultas de disponibilidad por rango de tiempo
CREATE INDEX IF NOT EXISTS idx_booking_time_range 
ON "Booking" ("courtId", "bookingDate", "startTime", "endTime") 
WHERE "deletedAt" IS NULL AND "status" IN ('CONFIRMED', 'PENDING');

-- Índice para reportes de pagos
CREATE INDEX IF NOT EXISTS idx_payment_reports 
ON "Payment" ("createdAt", "status", "paymentMethod", "amount") 
WHERE "deletedAt" IS NULL;

-- Índice para auditoría de usuarios
CREATE INDEX IF NOT EXISTS idx_user_audit 
ON "User" ("createdAt", "role", "isActive") 
WHERE "deletedAt" IS NULL;

-- ============================================================================
-- CONFIGURACIONES DE RENDIMIENTO
-- ============================================================================

-- Configurar parámetros de trabajo para consultas complejas
-- Nota: Estos comandos pueden requerir permisos de superusuario
-- y pueden no estar disponibles en todos los entornos de Neon

-- Aumentar memoria de trabajo para consultas complejas
-- SET work_mem = '256MB';

-- Configurar memoria compartida para buffers
-- SET shared_buffers = '256MB';

-- Configurar el planificador de consultas
-- SET random_page_cost = 1.1; -- Optimizado para SSD
-- SET effective_cache_size = '1GB';

-- ============================================================================
-- FUNCIONES AUXILIARES PARA OPTIMIZACIÓN
-- ============================================================================

-- Función para limpiar registros soft-deleted antiguos
CREATE OR REPLACE FUNCTION cleanup_soft_deleted_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Limpiar usuarios eliminados hace más de 1 año
    DELETE FROM "User" 
    WHERE "deletedAt" IS NOT NULL 
    AND "deletedAt" < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar canchas eliminadas hace más de 1 año
    DELETE FROM "Court" 
    WHERE "deletedAt" IS NOT NULL 
    AND "deletedAt" < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar reservas eliminadas hace más de 2 años
    DELETE FROM "Booking" 
    WHERE "deletedAt" IS NOT NULL 
    AND "deletedAt" < NOW() - INTERVAL '2 years';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar jugadores de reservas eliminadas hace más de 2 años
    DELETE FROM "BookingPlayer" 
    WHERE "deletedAt" IS NOT NULL 
    AND "deletedAt" < NOW() - INTERVAL '2 years';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar pagos eliminados hace más de 3 años
    DELETE FROM "Payment" 
    WHERE "deletedAt" IS NOT NULL 
    AND "deletedAt" < NOW() - INTERVAL '3 years';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de uso de índices
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    usage_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psi.schemaname::TEXT,
        psi.tablename::TEXT,
        psi.indexname::TEXT,
        psi.idx_scan,
        psi.idx_tup_read,
        psi.idx_tup_fetch,
        CASE 
            WHEN psi.idx_scan = 0 THEN 0
            ELSE ROUND((psi.idx_tup_fetch::NUMERIC / psi.idx_scan), 2)
        END as usage_ratio
    FROM pg_stat_user_indexes psi
    JOIN pg_indexes pi ON psi.indexname = pi.indexname
    WHERE psi.schemaname = 'public'
    ORDER BY psi.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para análisis de rendimiento de consultas
CREATE OR REPLACE FUNCTION analyze_table_performance(table_name TEXT)
RETURNS TABLE(
    metric TEXT,
    value TEXT
) AS $$
BEGIN
    -- Verificar que la tabla existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = analyze_table_performance.table_name) THEN
        RAISE EXCEPTION 'Table % does not exist', table_name;
    END IF;
    
    RETURN QUERY
    SELECT 
        'Total Rows'::TEXT as metric,
        COALESCE(n_live_tup::TEXT, '0') as value
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' AND tablename = analyze_table_performance.table_name
    
    UNION ALL
    
    SELECT 
        'Dead Rows'::TEXT as metric,
        COALESCE(n_dead_tup::TEXT, '0') as value
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' AND tablename = analyze_table_performance.table_name
    
    UNION ALL
    
    SELECT 
        'Table Size'::TEXT as metric,
        pg_size_pretty(pg_total_relation_size('public.' || analyze_table_performance.table_name)) as value
    
    UNION ALL
    
    SELECT 
        'Index Count'::TEXT as metric,
        COUNT(*)::TEXT as value
    FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = analyze_table_performance.table_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA AUDITORÍA Y OPTIMIZACIÓN
-- ============================================================================

-- Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que tienen updatedAt
DROP TRIGGER IF EXISTS update_payment_updated_at ON "Payment";
CREATE TRIGGER update_payment_updated_at
    BEFORE UPDATE ON "Payment"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VISTAS PARA CONSULTAS OPTIMIZADAS
-- ============================================================================

-- Vista para reservas activas con información completa
CREATE OR REPLACE VIEW active_bookings_view AS
SELECT 
    b.id,
    b."courtId",
    c.name as court_name,
    b."userId",
    u.name as user_name,
    u.email as user_email,
    b."bookingDate",
    b."startTime",
    b."endTime",
    b.status,
    b."paymentStatus",
    b."totalPrice",
    b."createdAt",
    b."updatedAt"
FROM "Booking" b
JOIN "Court" c ON b."courtId" = c.id
JOIN "User" u ON b."userId" = u.id
WHERE b."deletedAt" IS NULL
  AND c."deletedAt" IS NULL
  AND u."deletedAt" IS NULL;

-- Vista para estadísticas de uso de canchas
CREATE OR REPLACE VIEW court_usage_stats AS
SELECT 
    c.id,
    c.name,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
    COALESCE(SUM(b."totalPrice"), 0) as total_revenue,
    COALESCE(AVG(b."totalPrice"), 0) as avg_booking_amount,
    MIN(b."bookingDate") as first_booking_date,
    MAX(b."bookingDate") as last_booking_date
FROM "Court" c
LEFT JOIN "Booking" b ON c.id = b."courtId" AND b."deletedAt" IS NULL
WHERE c."deletedAt" IS NULL
GROUP BY c.id, c.name;

-- Vista para estadísticas de usuarios
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u."isActive",
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) as confirmed_bookings,
    COALESCE(SUM(b."totalPrice"), 0) as total_spent,
    MIN(b."bookingDate") as first_booking_date,
    MAX(b."bookingDate") as last_booking_date,
    u."createdAt" as registration_date
FROM "User" u
LEFT JOIN "Booking" b ON u.id = b."userId" AND b."deletedAt" IS NULL
WHERE u."deletedAt" IS NULL
GROUP BY u.id, u.name, u.email, u.role, u."isActive", u."createdAt";

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

-- Agregar comentarios a las tablas principales para documentación
COMMENT ON TABLE "User" IS 'Tabla de usuarios del sistema con soft delete habilitado';
COMMENT ON TABLE "Court" IS 'Tabla de canchas de pádel con información de disponibilidad';
COMMENT ON TABLE "Booking" IS 'Tabla de reservas con información completa de pagos y jugadores';
COMMENT ON TABLE "Payment" IS 'Tabla de pagos con trazabilidad completa y soft delete';
COMMENT ON TABLE "BookingPlayer" IS 'Tabla de jugadores asociados a cada reserva';

-- Comentarios en índices importantes
COMMENT ON INDEX "idx_user_email_role_active" IS 'Índice compuesto para consultas de autenticación y autorización';
COMMENT ON INDEX "idx_booking_court_date_status" IS 'Índice para consultas de disponibilidad de canchas';
COMMENT ON INDEX "idx_booking_user_date" IS 'Índice para historial de reservas por usuario';

-- ============================================================================
-- FINALIZACIÓN
-- ============================================================================

-- Actualizar estadísticas después de crear índices
ANALYZE;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Optimización de base de datos completada exitosamente';
    RAISE NOTICE 'Extensiones instaladas: pg_trgm, uuid-ossp, unaccent';
    RAISE NOTICE 'Índices adicionales creados para búsqueda y rendimiento';
    RAISE NOTICE 'Funciones auxiliares y vistas creadas';
    RAISE NOTICE 'Triggers de auditoría configurados';
END $$;