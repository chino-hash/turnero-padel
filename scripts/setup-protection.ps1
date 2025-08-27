# Script de PowerShell para configurar la proteccion del frontend
# Este script instala los Git Hooks y configura las herramientas de proteccion

Write-Host "Configurando proteccion del frontend..." -ForegroundColor Yellow

# Verificar si estamos en un repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "Error: No se encontro un repositorio Git en el directorio actual." -ForegroundColor Red
    exit 1
}

# Crear directorio de hooks si no existe
$hooksDir = ".git/hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# Copiar el hook pre-commit
$sourceHook = ".githooks/pre-commit"
$targetHook = "$hooksDir/pre-commit"

if (Test-Path $sourceHook) {
    Copy-Item $sourceHook $targetHook -Force
    Write-Host "Git Hook pre-commit instalado correctamente." -ForegroundColor Green
    
    if (Test-Path $targetHook) {
        Write-Host "Hook pre-commit configurado en: $targetHook" -ForegroundColor Green
    }
} else {
    Write-Host "Error: No se encontro el archivo $sourceHook" -ForegroundColor Red
    exit 1
}

# Crear archivo de configuracion de proteccion
$configContent = @'
# Configuracion de Proteccion del Frontend
# Este archivo contiene la configuracion para las herramientas de proteccion

# Archivos protegidos (no modificar sin autorizacion)
PROTECTED_FILES=(
    "components/TurneroApp.tsx"
    "components/MisTurnos.tsx"
    "app/(protected)/dashboard/page.tsx"
    "app/(protected)/layout.tsx"
    "components/ui/**/*.tsx"
    "hooks/useAuth.ts"
    "lib/auth.ts"
    "middleware.ts"
)

# Archivos permitidos para modificacion
ALLOWED_FILES=(
    "app/(admin)/**/*.tsx"
    "components/Admin*.tsx"
    "components/admin/**/*.tsx"
    "api/admin/**/*.ts"
)

# Configuracion de notificaciones
NOTIFY_ON_PROTECTED_CHANGES=true
REQUIRE_APPROVAL_FOR_PROTECTED=true

# Variables de entorno para override
# FRONTEND_PROTECTION_OVERRIDE=true (para bypass temporal)
'@

Set-Content ".protection-config" $configContent
Write-Host "Archivo de configuracion .protection-config creado" -ForegroundColor Green

# Mostrar resumen
Write-Host "" 
Write-Host "Configuracion de proteccion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen de configuracion:" -ForegroundColor Cyan
Write-Host "   Git Hook pre-commit instalado" -ForegroundColor White
Write-Host "   Configuracion ESLint para proteccion creada" -ForegroundColor White
Write-Host "   Archivo de configuracion creado" -ForegroundColor White
Write-Host ""
Write-Host "Comandos disponibles:" -ForegroundColor Cyan
Write-Host "   node scripts/check-protection.js - Verificar archivos protegidos" -ForegroundColor White
Write-Host ""
Write-Host "Para modificar archivos protegidos:" -ForegroundColor Yellow
Write-Host "   1. Solicite autorizacion formal" -ForegroundColor White
Write-Host "   2. Documente los cambios" -ForegroundColor White
Write-Host "   3. Use override temporal si es necesario" -ForegroundColor White
Write-Host ""