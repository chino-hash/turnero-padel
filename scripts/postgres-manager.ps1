# Script de gestión de PostgreSQL para Turnero de Padel
# Uso: .\scripts\postgres-manager.ps1 [comando]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "connect", "reset")]
    [string]$Command
)

$ContainerName = "turnero-postgres"
$DatabaseName = "turnero_padel"
$Username = "turnero_user"

function Show-Help {
    Write-Host "Comandos disponibles:" -ForegroundColor Green
    Write-Host "  start    - Iniciar el contenedor PostgreSQL"
    Write-Host "  stop     - Detener el contenedor PostgreSQL"
    Write-Host "  restart  - Reiniciar el contenedor PostgreSQL"
    Write-Host "  status   - Mostrar estado del contenedor"
    Write-Host "  logs     - Mostrar logs del contenedor"
    Write-Host "  connect  - Conectar a la base de datos"
    Write-Host "  reset    - Eliminar y recrear el contenedor"
}

switch ($Command) {
    "start" {
        Write-Host "Iniciando PostgreSQL..." -ForegroundColor Yellow
        docker-compose up -d postgres
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PostgreSQL iniciado correctamente" -ForegroundColor Green
            Write-Host "Conexión: postgresql://turnero_user:turnero_password@localhost:5432/turnero_padel"
        }
    }
    
    "stop" {
        Write-Host "Deteniendo PostgreSQL..." -ForegroundColor Yellow
        docker-compose stop postgres
        Write-Host "PostgreSQL detenido" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "Reiniciando PostgreSQL..." -ForegroundColor Yellow
        docker-compose restart postgres
        Write-Host "PostgreSQL reiniciado" -ForegroundColor Green
    }
    
    "status" {
        Write-Host "Estado del contenedor:" -ForegroundColor Yellow
        docker ps -f name=$ContainerName
        Write-Host "`nEstado de salud:" -ForegroundColor Yellow
        docker exec $ContainerName pg_isready -U $Username -d $DatabaseName
    }
    
    "logs" {
        Write-Host "Logs de PostgreSQL:" -ForegroundColor Yellow
        docker-compose logs -f postgres
    }
    
    "connect" {
        Write-Host "Conectando a PostgreSQL..." -ForegroundColor Yellow
        docker exec -it $ContainerName psql -U $Username -d $DatabaseName
    }
    
    "reset" {
        Write-Host "¿Estás seguro de que quieres eliminar y recrear el contenedor? (s/N)" -ForegroundColor Red
        $confirmation = Read-Host
        if ($confirmation -eq 's' -or $confirmation -eq 'S') {
            Write-Host "Eliminando contenedor y volúmenes..." -ForegroundColor Yellow
            docker-compose down -v
            docker volume prune -f
            Write-Host "Recreando contenedor..." -ForegroundColor Yellow
            docker-compose up -d postgres
            Write-Host "Contenedor recreado" -ForegroundColor Green
        } else {
            Write-Host "Operación cancelada" -ForegroundColor Yellow
        }
    }
    
    default {
        Show-Help
    }
}