#!/usr/bin/env bash
# ============================================================================
# SIATEC Web Angular - Script de Build y Deploy
# ============================================================================
# Uso: ./dev.sh [comando] [opciones]
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
#   ./dev.sh build                           # Construir imagen
#   ./dev.sh build-push --tag 1.0.0          # Construir y subir con versión
#   ./dev.sh build-push --tag 1.0.0 --no-push # Solo construir, sin subir
#   ./dev.sh run                             # Ejecutar localmente
# ============================================================================

set -e

# ============================================================================
# Configuración
# ============================================================================
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DOCKER_PATH="$(dirname "$SCRIPT_DIR")"
ROOT_PATH="$(dirname "$DOCKER_PATH")"

# Variables por defecto
COMMAND=""
TAG="latest"
REGISTRY="192.168.1.221:5050/siatec/ingresos"
IMAGE_NAME="frontend"
CONTAINER_NAME="siatec-frontend-dev"
NO_PUSH=false
FOLLOW=false

# ============================================================================
# Funciones de Colores
# ============================================================================
write_success() { echo -e "\033[0;32m$*\033[0m"; }
write_info() { echo -e "\033[0;36m$*\033[0m"; }
write_warning() { echo -e "\033[0;33m$*\033[0m"; }
write_error() { echo -e "\033[0;31m$*\033[0m"; }
write_title() {
    echo ""
    echo -e "\033[0;36m═══════════════════════════════════════════════════════════════════════════\033[0m"
    echo -e "\033[0;36m $*\033[0m"
    echo -e "\033[0;36m═══════════════════════════════════════════════════════════════════════════\033[0m"
}

# ============================================================================
# Funciones de Ayuda
# ============================================================================
show_help() {
    cat << EOF
SIATEC Web Angular - Script de Build y Deploy

Uso: ./dev.sh [comando] [opciones]

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
  --tag <version>   Versión/tag de la imagen (default: latest)
  --registry <url>  URL del registry (default: $REGISTRY)
  --no-push         Solo construir, sin subir al registry
  --follow, -f      Seguir logs en tiempo real

Ejemplos:
  ./dev.sh build                              # Construir imagen
  ./dev.sh build-push --tag 1.0.0             # Construir y subir v1.0.0
  ./dev.sh build-push --tag 1.0.0 --no-push   # Solo construir v1.0.0
  ./dev.sh run                                # Ejecutar localmente en puerto 4200
  ./dev.sh logs -f                            # Ver logs en tiempo real

EOF
}

# ============================================================================
# Comando: BUILD
# ============================================================================
build_image() {
    write_title "🏗️  CONSTRUYENDO IMAGEN: ${IMAGE_NAME}"
    
    write_info "📋 Imagen: ${REGISTRY}/${IMAGE_NAME}:${TAG}"
    write_info "📁 Context: ${ROOT_PATH}"
    write_info "🐳 Dockerfile: ${ROOT_PATH}/Dockerfile"
    echo ""
    
    pushd "$ROOT_PATH" > /dev/null
    
    # Desactivar buildx para compatibilidad con GitLab Registry
    export DOCKER_BUILDKIT=0
    
    write_info "🔨 Construyendo imagen..."
    docker build \
        -t "${REGISTRY}/${IMAGE_NAME}:${TAG}" \
        -t "${REGISTRY}/${IMAGE_NAME}:latest" \
        --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        .
    
    if [[ $? -ne 0 ]]; then
        write_error "❌ Error al construir la imagen"
        popd > /dev/null
        exit 1
    fi
    
    write_success "✅ Imagen construida exitosamente"
    echo ""
    
    # Verificar imagen
    write_info "🔍 Verificando imagen..."
    docker images "${REGISTRY}/${IMAGE_NAME}:${TAG}"
    
    popd > /dev/null
}

# ============================================================================
# Comando: PUSH
# ============================================================================
push_image() {
    write_title "📤 SUBIENDO IMAGEN: ${IMAGE_NAME}"
    
    write_info "📤 Subiendo imagen al registry..."
    
    docker push "${REGISTRY}/${IMAGE_NAME}:${TAG}"
    if [[ $? -ne 0 ]]; then
        write_error "❌ Error al subir la imagen con tag $TAG"
        exit 1
    fi
    
    docker push "${REGISTRY}/${IMAGE_NAME}:latest"
    if [[ $? -ne 0 ]]; then
        write_error "❌ Error al subir la imagen con tag latest"
        exit 1
    fi
    
    write_success "✅ Imagen subida exitosamente al registry"
    write_info "🎯 ${REGISTRY}/${IMAGE_NAME}:${TAG}"
    write_info "🎯 ${REGISTRY}/${IMAGE_NAME}:latest"
}

# ============================================================================
# Comando: BUILD-PUSH
# ============================================================================
build_and_push() {
    write_title "🏗️  BUILD AND PUSH: ${IMAGE_NAME}"
    
    build_image
    
    echo ""
    
    if [[ "$NO_PUSH" == false ]]; then
        push_image
        
        echo ""
        
        # Verificar manifest en el registry
        write_info "🔍 Verificando imagen en registry..."
        docker manifest inspect "${REGISTRY}/${IMAGE_NAME}:${TAG}" > /dev/null 2>&1 || \
            write_warning "⚠️  No se pudo inspeccionar el manifest (puede ser normal)"
    else
        write_warning "⚠️  Push omitido (--no-push)"
    fi
}

# ============================================================================
# Comando: RUN
# ============================================================================
run_container() {
    write_title "🚀 EJECUTANDO CONTENEDOR: ${CONTAINER_NAME}"
    
    # Detener contenedor existente si existe
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        write_info "🛑 Deteniendo contenedor existente..."
        docker stop "$CONTAINER_NAME" > /dev/null 2>&1 || true
        docker rm "$CONTAINER_NAME" > /dev/null 2>&1 || true
    fi
    
    write_info "🚀 Iniciando contenedor..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 4200:80 \
        -e DEPLOYMENT_MODE=local \
        -e AUTH_API_BASE_URL=http://localhost:5002/api/auth \
        -e CONTRIBUYENTES_API_BASE_URL=http://localhost:5001/api/contribuyentes \
        -e CONTRIBUCIONES_API_BASE_URL=http://localhost:5000/api/contribuciones \
        -e TESORERIA_API_BASE_URL=http://localhost:5003/api/tesoreria \
        -e NOTIFICACIONES_API_BASE_URL=http://localhost:5004/api/notificaciones \
        "${REGISTRY}/${IMAGE_NAME}:${TAG}"
    
    if [[ $? -eq 0 ]]; then
        write_success "✅ Contenedor iniciado exitosamente"
        write_info "🌐 URL: http://localhost:4200"
        write_info "📋 Logs: ./dev.sh logs -f"
    else
        write_error "❌ Error al iniciar el contenedor"
        exit 1
    fi
}

# ============================================================================
# Comando: STOP
# ============================================================================
stop_container() {
    write_title "🛑 DETENIENDO CONTENEDOR: ${CONTAINER_NAME}"
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop "$CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
        write_success "✅ Contenedor detenido y eliminado"
    else
        write_warning "⚠️  El contenedor no está ejecutándose"
    fi
}

# ============================================================================
# Comando: LOGS
# ============================================================================
show_logs() {
    write_title "📋 LOGS: ${CONTAINER_NAME}"
    
    if [[ "$FOLLOW" == true ]]; then
        docker logs -f "$CONTAINER_NAME"
    else
        docker logs --tail=100 "$CONTAINER_NAME"
    fi
}

# ============================================================================
# Comando: CLEAN
# ============================================================================
clean_images() {
    write_title "🧹 LIMPIEZA DE IMÁGENES"
    
    write_warning "⚠️  Esto eliminará las imágenes locales de ${IMAGE_NAME}"
    read -p "¿Estás seguro? (yes/no): " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        write_info "Operación cancelada"
        return
    fi
    
    # Detener contenedor si está corriendo
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        write_info "🛑 Deteniendo contenedor..."
        docker stop "$CONTAINER_NAME" > /dev/null 2>&1 || true
        docker rm "$CONTAINER_NAME" > /dev/null 2>&1 || true
    fi
    
    # Eliminar imágenes
    write_info "🧹 Eliminando imágenes..."
    docker rmi "${REGISTRY}/${IMAGE_NAME}:${TAG}" 2>/dev/null || true
    docker rmi "${REGISTRY}/${IMAGE_NAME}:latest" 2>/dev/null || true
    
    write_success "✅ Limpieza completada"
}

# ============================================================================
# Parseo de Argumentos
# ============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            build|push|build-push|run|stop|logs|clean|help)
                COMMAND="$1"
                shift
                ;;
            --tag)
                TAG="$2"
                shift 2
                ;;
            --registry)
                REGISTRY="$2"
                shift 2
                ;;
            --no-push)
                NO_PUSH=true
                shift
                ;;
            --follow|-f)
                FOLLOW=true
                shift
                ;;
            -h|--help)
                COMMAND="help"
                shift
                ;;
            *)
                write_error "❌ Opción desconocida: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# ============================================================================
# Main
# ============================================================================
main() {
    parse_args "$@"
    
    case "$COMMAND" in
        build)
            build_image
            ;;
        push)
            push_image
            ;;
        build-push)
            build_and_push
            ;;
        run)
            run_container
            ;;
        stop)
            stop_container
            ;;
        logs)
            show_logs
            ;;
        clean)
            clean_images
            ;;
        help|"")
            show_help
            ;;
        *)
            write_error "❌ Comando desconocido: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
