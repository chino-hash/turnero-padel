# Script de migración a PostgreSQL para Turnero de Padel
# Uso: .\scripts\migrate-to-postgresql.ps1 [comando]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("check", "generate", "deploy", "reset", "seed", "full")]
    [string]$Command = "check"
)

function Show-Help {
    Write-Host "Comandos disponibles para migración a PostgreSQL:" -ForegroundColor Green
    Write-Host "  check    - Verificar configuración y conexión"
    Write-Host "  generate - Generar migración de Prisma"
    Write-Host "  deploy   - Aplicar migraciones a la base de datos"
    Write-Host "  reset    - Resetear base de datos (¡CUIDADO!)"
    Write-Host "  seed     - Poblar base de datos con datos iniciales"
    Write-Host "  full     - Proceso completo de migración"
}

function Test-DatabaseConnection {
    Write-Host "Verificando conexión a PostgreSQL..." -ForegroundColor Yellow
    
    # Verificar que existe .env.local
    if (-not (Test-Path ".env.local")) {
        Write-Host "❌ Archivo .env.local no encontrado" -ForegroundColor Red
        Write-Host "Copia .env.example a .env.local y configura DATABASE_URL" -ForegroundColor Yellow
        return $false
    }
    
    # Verificar conexión con Prisma
    try {
        Write-Host "Probando conexión con Prisma..." -ForegroundColor Yellow
        echo "SELECT 1;" | npx prisma db execute --stdin --schema prisma/schema.prisma 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Conexión a PostgreSQL exitosa" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ No se pudo conectar a PostgreSQL" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error al probar conexión: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Show-DatabaseInfo {
    Write-Host "Información de la base de datos:" -ForegroundColor Cyan
    try {
        echo "SELECT version();" | npx prisma db execute --stdin --schema prisma/schema.prisma
        echo "SELECT current_database(), current_user, inet_server_addr(), inet_server_port();" | npx prisma db execute --stdin --schema prisma/schema.prisma
    } catch {
        Write-Host "No se pudo obtener información de la base de datos" -ForegroundColor Red
    }
}

switch ($Command) {
    "check" {
        Write-Host "=== Verificación de Configuración ===" -ForegroundColor Cyan
        
        # Verificar Node.js y npm
        Write-Host "Verificando Node.js..." -ForegroundColor Yellow
        node --version
        npm --version
        
        # Verificar Prisma
        Write-Host "Verificando Prisma..." -ForegroundColor Yellow
        npx prisma --version
        
        # Verificar archivo de configuración
        if (Test-Path ".env.local") {
            Write-Host "✅ Archivo .env.local encontrado" -ForegroundColor Green
        } else {
            Write-Host "❌ Archivo .env.local no encontrado" -ForegroundColor Red
            Write-Host "Ejecuta: Copy-Item .env.example .env.local" -ForegroundColor Yellow
        }
        
        # Probar conexión
        if (Test-DatabaseConnection) {
            Show-DatabaseInfo
        }
    }
    
    "generate" {
        Write-Host "=== Generando Migración ===" -ForegroundColor Cyan
        if (Test-DatabaseConnection) {
            Write-Host "Generando migración de Prisma..." -ForegroundColor Yellow
            npx prisma migrate dev --name "migrate-to-postgresql"
        }
    }
    
    "deploy" {
        Write-Host "=== Aplicando Migraciones ===" -ForegroundColor Cyan
        if (Test-DatabaseConnection) {
            Write-Host "Aplicando migraciones..." -ForegroundColor Yellow
            npx prisma migrate deploy
            Write-Host "Generando cliente Prisma..." -ForegroundColor Yellow
            npx prisma generate
        }
    }
    
    "reset" {
        Write-Host "=== RESETEAR BASE DE DATOS ===" -ForegroundColor Red
        Write-Host "¿Estás seguro de que quieres eliminar TODOS los datos? (s/N)" -ForegroundColor Red
        $confirmation = Read-Host
        if ($confirmation -eq 's' -or $confirmation -eq 'S') {
            Write-Host "Reseteando base de datos..." -ForegroundColor Yellow
            npx prisma migrate reset --force
        } else {
            Write-Host "Operación cancelada" -ForegroundColor Yellow
        }
    }
    
    "seed" {
        Write-Host "=== Poblando Base de Datos ===" -ForegroundColor Cyan
        if (Test-DatabaseConnection) {
            Write-Host "Ejecutando scripts de inicialización..." -ForegroundColor Yellow
            if (Test-Path "scripts\init-admins.js") {
                node scripts\init-admins.js
            }
        }
    }
    
    "full" {
        Write-Host "=== Migración Completa a PostgreSQL ===" -ForegroundColor Cyan
        
        Write-Host "Paso 1: Verificación" -ForegroundColor Yellow
        & $MyInvocation.MyCommand.Path "check"
        
        if (Test-DatabaseConnection) {
            Write-Host "Paso 2: Generando migración" -ForegroundColor Yellow
            & $MyInvocation.MyCommand.Path "generate"
            
            Write-Host "Paso 3: Aplicando migraciones" -ForegroundColor Yellow
            & $MyInvocation.MyCommand.Path "deploy"
            
            Write-Host "Paso 4: Poblando datos iniciales" -ForegroundColor Yellow
            & $MyInvocation.MyCommand.Path "seed"
            
            Write-Host "✅ Migración completa finalizada" -ForegroundColor Green
        } else {
            Write-Host "❌ No se pudo completar la migración" -ForegroundColor Red
        }
    }
    
    default {
        Show-Help
    }
}