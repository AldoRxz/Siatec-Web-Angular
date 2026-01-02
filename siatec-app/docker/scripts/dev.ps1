# ============================================================================
# SIATEC Web Angular - Script de Build y Deploy (PowerShell)
# ============================================================================
# Uso: .\dev.ps1 [comando] [opciones]
#
# Comandos:
#   build      - Construir imagen Docker
#   push       - Subir imagen al registry
#   build-push - Construir y subir imagen al registry (para CI/CD)
#   run        - Ejecutar contenedor localmente
#   stop       - Detener contenedor local
#   logs       - Ver logs del contenedor
#   clean      - Limpiar imágenes locales
#
# Ejemplos:
#   .\dev.ps1 build                           # Construir imagen
#   .\dev.ps1 build-push -Tag 1.0.0           # Construir y subir con versión
#   .\dev.ps1 build-push -Tag 1.0.0 -NoPush   # Solo construir, sin subir
#   .\dev.ps1 run                             # Ejecutar localmente
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("build", "push", "build-push", "run", "stop", "logs", "clean", "help")]
    [string]$Command = "help",

    [Parameter()]
    [string]$Tag = "latest",

    [Parameter()]
    [string]$Registry = "192.168.1.221:5050/siatec/ingresos",

    [Parameter()]
    [switch]$NoPush,

    [Parameter()]
    [Alias("f")]
    [switch]$Follow
)

# ============================================================================
# Configuración
# ============================================================================
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DockerPath = Split-Path -Parent $ScriptDir
$RootPath = Split-Path -Parent $DockerPath
$ImageName = "frontend"
$ContainerName = "siatec-frontend-dev"

# ============================================================================
# Funciones de Colores
# ============================================================================
function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Write-Title {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

# ============================================================================
# Funciones de Ayuda
# ============================================================================
function Show-Help {
    $helpText = @"
SIATEC Web Angular - Script de Build y Deploy (PowerShell)

Uso: .\dev.ps1 [comando] [opciones]

Comandos:
  build       Construir imagen Docker
  push        Subir imagen al registry
  build-push  Construir y subir imagen al registry (para CI/CD)
  run         Ejecutar contenedor localmente
  stop        Detener contenedor local
  logs        Ver logs del contenedor
  clean       Limpiar imágenes locales
  help        Mostrar esta ayuda

Opciones:
  -Tag <version>     Version/tag de la imagen (default: latest)
  -Registry <url>    URL del registry (default: $Registry)
  -NoPush            Solo construir, sin subir al registry
  -Follow, -f        Seguir logs en tiempo real

Ejemplos:
  .\dev.ps1 build                              # Construir imagen
  .\dev.ps1 build-push -Tag 1.0.0              # Construir y subir v1.0.0
  .\dev.ps1 build-push -Tag 1.0.0 -NoPush      # Solo construir v1.0.0
  .\dev.ps1 run                                # Ejecutar localmente en puerto 4200
  .\dev.ps1 logs -f                            # Ver logs en tiempo real

"@
    Write-Host $helpText
}

# ============================================================================
# Comando: BUILD
# ============================================================================
function Build-Image {
    Write-Title "🏗️  CONSTRUYENDO IMAGEN: $ImageName"

    Write-Info "📋 Imagen: $Registry/$ImageName`:$Tag"
    Write-Info "📁 Context: $RootPath"
    Write-Info "🐳 Dockerfile: $RootPath\Dockerfile"
    Write-Host ""

    Push-Location $RootPath

    try {
        # Desactivar buildx para compatibilidad con GitLab Registry
        $env:DOCKER_BUILDKIT = "0"

        # Obtener fecha y commit
        $buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        try {
            $vcsRef = git rev-parse --short HEAD 2>$null
            if (-not $vcsRef) { $vcsRef = "unknown" }
        }
        catch {
            $vcsRef = "unknown"
        }

        Write-Info "🔨 Construyendo imagen..."
        docker build `
            -t "$Registry/$ImageName`:$Tag" `
            -t "$Registry/$ImageName`:latest" `
            --build-arg BUILD_DATE="$buildDate" `
            --build-arg VCS_REF="$vcsRef" `
            .

        if ($LASTEXITCODE -ne 0) {
            Write-Error "❌ Error al construir la imagen"
            exit 1
        }

        Write-Success "✅ Imagen construida exitosamente"
        Write-Host ""

        # Verificar imagen
        Write-Info "🔍 Verificando imagen..."
        docker images "$Registry/$ImageName`:$Tag"
    }
    finally {
        Pop-Location
    }
}

# ============================================================================
# Comando: PUSH
# ============================================================================
function Push-Image {
    Write-Title "📤 SUBIENDO IMAGEN: $ImageName"

    Write-Info "📤 Subiendo imagen al registry..."

    docker push "$Registry/$ImageName`:$Tag"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Error al subir la imagen con tag $Tag"
        exit 1
    }

    docker push "$Registry/$ImageName`:latest"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Error al subir la imagen con tag latest"
        exit 1
    }

    Write-Success "✅ Imagen subida exitosamente al registry"
    Write-Info "🎯 $Registry/$ImageName`:$Tag"
    Write-Info "🎯 $Registry/$ImageName`:latest"
}

# ============================================================================
# Comando: BUILD-PUSH
# ============================================================================
function Build-AndPush {
    Write-Title "🏗️  BUILD AND PUSH: $ImageName"

    Build-Image

    Write-Host ""

    if (-not $NoPush) {
        Push-Image

        Write-Host ""

        # Verificar manifest en el registry
        Write-Info "🔍 Verificando imagen en registry..."
        $null = docker manifest inspect "$Registry/$ImageName`:$Tag" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "⚠️  No se pudo inspeccionar el manifest (puede ser normal)"
        }
    }
    else {
        Write-Warning "⚠️  Push omitido (-NoPush)"
    }
}

# ============================================================================
# Comando: RUN
# ============================================================================
function Start-Container {
    Write-Title "🚀 EJECUTANDO CONTENEDOR: $ContainerName"

    # Detener contenedor existente si existe
    $existingContainer = docker ps -a --format '{{.Names}}' | Where-Object { $_ -eq $ContainerName }
    if ($existingContainer) {
        Write-Info "🛑 Deteniendo contenedor existente..."
        docker stop $ContainerName 2>$null | Out-Null
        docker rm $ContainerName 2>$null | Out-Null
    }

    Write-Info "🚀 Iniciando contenedor..."
    docker run -d `
        --name $ContainerName `
        -p 4200:80 `
        -e DEPLOYMENT_MODE=local `
        -e AUTH_API_BASE_URL=http://localhost:5002/api/auth `
        -e CONTRIBUYENTES_API_BASE_URL=http://localhost:5001/api/contribuyentes `
        -e CONTRIBUCIONES_API_BASE_URL=http://localhost:5000/api/contribuciones `
        -e TESORERIA_API_BASE_URL=http://localhost:5003/api/tesoreria `
        -e NOTIFICACIONES_API_BASE_URL=http://localhost:5004/api/notificaciones `
        "$Registry/$ImageName`:$Tag"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Contenedor iniciado exitosamente"
        Write-Info "🌐 URL: http://localhost:4200"
        Write-Info "📋 Logs: .\dev.ps1 logs -f"
    }
    else {
        Write-Error "❌ Error al iniciar el contenedor"
        exit 1
    }
}

# ============================================================================
# Comando: STOP
# ============================================================================
function Stop-Container {
    Write-Title "🛑 DETENIENDO CONTENEDOR: $ContainerName"

    $runningContainer = docker ps --format '{{.Names}}' | Where-Object { $_ -eq $ContainerName }
    if ($runningContainer) {
        docker stop $ContainerName
        docker rm $ContainerName
        Write-Success "✅ Contenedor detenido y eliminado"
    }
    else {
        Write-Warning "⚠️  El contenedor no está ejecutándose"
    }
}

# ============================================================================
# Comando: LOGS
# ============================================================================
function Show-Logs {
    Write-Title "📋 LOGS: $ContainerName"

    if ($Follow) {
        docker logs -f $ContainerName
    }
    else {
        docker logs --tail=100 $ContainerName
    }
}

# ============================================================================
# Comando: CLEAN
# ============================================================================
function Clear-Images {
    Write-Title "🧹 LIMPIEZA DE IMÁGENES"

    Write-Warning "⚠️  Esto eliminará las imágenes locales de $ImageName"
    $confirm = Read-Host "¿Estás seguro? (yes/no)"

    if ($confirm -ne "yes") {
        Write-Info "Operación cancelada"
        return
    }

    # Detener contenedor si está corriendo
    $runningContainer = docker ps --format '{{.Names}}' | Where-Object { $_ -eq $ContainerName }
    if ($runningContainer) {
        Write-Info "🛑 Deteniendo contenedor..."
        docker stop $ContainerName 2>$null | Out-Null
        docker rm $ContainerName 2>$null | Out-Null
    }

    # Eliminar imágenes
    Write-Info "🧹 Eliminando imágenes..."
    docker rmi "$Registry/$ImageName`:$Tag" 2>$null | Out-Null
    docker rmi "$Registry/$ImageName`:latest" 2>$null | Out-Null

    Write-Success "✅ Limpieza completada"
}

# ============================================================================
# Main
# ============================================================================
switch ($Command) {
    "build" { Build-Image }
    "push" { Push-Image }
    "build-push" { Build-AndPush }
    "run" { Start-Container }
    "stop" { Stop-Container }
    "logs" { Show-Logs }
    "clean" { Clear-Images }
    "help" { Show-Help }
    default { Show-Help }
}
