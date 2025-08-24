-- Inicialización de la base de datos PostgreSQL para Turnero de Padel
-- Este script se ejecuta automáticamente cuando se crea el contenedor

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone por defecto
SET timezone = 'America/Argentina/Buenos_Aires';

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS public;

-- Otorgar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE turnero_padel TO turnero_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO turnero_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO turnero_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO turnero_user;

-- Configurar permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO turnero_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO turnero_user;

-- Mensaje de confirmación
SELECT 'Base de datos PostgreSQL inicializada correctamente para Turnero de Padel' as mensaje;