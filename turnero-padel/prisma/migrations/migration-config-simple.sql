-- Configuración básica de optimización para Neon PostgreSQL

-- ============================================================================
-- EXTENSIONES DE POSTGRESQL
-- ============================================================================

-- Extensión para búsqueda de texto completo y similitud
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Aplicar trigger a tablas que tienen updatedAt (solo si existe la columna)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Payment' AND column_name = 'updatedAt') THEN
        DROP TRIGGER IF EXISTS update_payment_updated_at ON "Payment";
        CREATE TRIGGER update_payment_updated_at
            BEFORE UPDATE ON "Payment"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

-- Agregar comentarios a las tablas principales para documentación
COMMENT ON TABLE "User" IS 'Tabla de usuarios del sistema con soft delete habilitado';
COMMENT ON TABLE "Court" IS 'Tabla de canchas de pádel con información de disponibilidad';
COMMENT ON TABLE "Booking" IS 'Tabla de reservas con información completa de pagos y jugadores';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Payment') THEN
        COMMENT ON TABLE "Payment" IS 'Tabla de pagos con trazabilidad completa y soft delete';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'BookingPlayer') THEN
        COMMENT ON TABLE "BookingPlayer" IS 'Tabla de jugadores asociados a cada reserva';
    END IF;
END $$;

-- ============================================================================
-- FINALIZACIÓN
-- ============================================================================

-- Actualizar estadísticas después de crear índices
ANALYZE;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Optimización básica de base de datos completada exitosamente';
    RAISE NOTICE 'Extensiones instaladas: pg_trgm, uuid-ossp';
    RAISE NOTICE 'Funciones auxiliares creadas';
    RAISE NOTICE 'Triggers de auditoría configurados';
END $$;