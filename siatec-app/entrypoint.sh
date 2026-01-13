#!/bin/sh
set -e  # Exit on error

echo "=========================================="
echo "Starting SIATEC Angular App..."
echo "=========================================="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Hostname: $(hostname)"
echo "Working directory: $(pwd)"
echo ""

# Verificar que el directorio existe
if [ ! -d "/usr/share/nginx/html" ]; then
  echo "ERROR: Directory /usr/share/nginx/html does not exist!"
  exit 1
fi

echo "Generating dynamic config.js..."
echo "DEPLOYMENT_MODE: ${DEPLOYMENT_MODE:-auto}"
echo ""

# Determinar el modo de despliegue
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-auto}"

# Generar config.js dinámico según el modo de despliegue
if [ "$DEPLOYMENT_MODE" = "docker-local" ]; then
  echo "🐳 Generando config.js para Docker Local..."
  cat > /usr/share/nginx/html/config.js <<'EOF'
/**
 * SIATEC Angular - Configuración para Docker Local
 * Generado por entrypoint.sh con DEPLOYMENT_MODE=docker-local
 */
(function (window) {
  'use strict';

  console.log('[config.js] 🐳 Modo Docker Local - APIs en localhost con puertos directos');

  // Configuración fija para Docker local
  window.__SIATEC_CONFIG = {
    // URLs de APIs directas (sin ingress)
    authApiBaseUrl: 'http://localhost:5002/internal/auth',
    contribuyentesApiBaseUrl: 'http://localhost:5001/internal',
    contribucionesApiBaseUrl: 'http://localhost:5000/internal',
    tesoreriaApiBaseUrl: 'http://localhost:5003/api/tesoreria',
    notificacionesApiBaseUrl: 'http://localhost:5005/api/notificaciones',

    // Información del ambiente
    environment: 'docker-local',
    baseUrl: 'http://localhost',

    // Métodos de utilidad
    getApiUrl: function (service) {
      const serviceMap = {
        'auth': this.authApiBaseUrl,
        'contribuyentes': this.contribuyentesApiBaseUrl,
        'contribuciones': this.contribucionesApiBaseUrl,
        'tesoreria': this.tesoreriaApiBaseUrl,
        'notificaciones': this.notificacionesApiBaseUrl
      };
      return serviceMap[service] || this.baseUrl;
    },

    // Debug helper
    logConfig: function () {
      console.group('🔧 SIATEC Angular - Configuración de APIs');
      console.log('Ambiente:', this.environment);
      console.log('Base URL:', this.baseUrl);
      console.log('Auth API:', this.authApiBaseUrl);
      console.log('Contribuyentes API:', this.contribuyentesApiBaseUrl);
      console.log('Contribuciones API:', this.contribucionesApiBaseUrl);
      console.log('Tesorería API:', this.tesoreriaApiBaseUrl);
      console.log('Notificaciones API:', this.notificacionesApiBaseUrl);
      console.groupEnd();
    }
  };

  window.__SIATEC_CONFIG.logConfig();

  // Compatibilidad con API_CONFIG
  window.API_CONFIG = {
    authApi: window.__SIATEC_CONFIG.authApiBaseUrl,
    contribuyentesApi: window.__SIATEC_CONFIG.contribuyentesApiBaseUrl,
    contribucionesApi: window.__SIATEC_CONFIG.contribucionesApiBaseUrl,
    tesoreriaApi: window.__SIATEC_CONFIG.tesoreriaApiBaseUrl,
    notificacionesApi: window.__SIATEC_CONFIG.notificacionesApiBaseUrl,
    environment: window.__SIATEC_CONFIG.environment
  };

  console.log('[config.js] ✅ Configuración Docker Local cargada');

})(window);
EOF

else
  # Modo kubernetes - Usar variables de entorno
  echo "☸️  Generando config.js para Kubernetes (usando variables de entorno)..."
  
  # Leer variables de entorno con fallbacks
  AUTH_API="${AUTH_API_BASE_URL:-http://gateway-api:8080/api/v1/auth}"
  CONTRIB_API="${CONTRIBUYENTES_API_BASE_URL:-http://gateway-api:8080/api/v1/contribuyentes}"
  CONTRIBUCIONES_API="${CONTRIBUCIONES_API_BASE_URL:-http://gateway-api:8080/api/v1/contribuciones}"
  TESORERIA_API="${TESORERIA_API_BASE_URL:-http://gateway-api:8080/api/v1/tesoreria}"
  NOTIF_API="${NOTIFICACIONES_API_BASE_URL:-http://gateway-api:8080/api/v1/notificaciones}"
  CAJA_API="${CAJA_API_BASE_URL:-http://gateway-api:8080/api/v1/ordenes-pago}"
  PACCIOLI_API="${PACCIOLI_API_BASE_URL:-}"
  CITAS_API="${CITAS_API_BASE_URL:-http://gateway-api:8080/api/v1/citas}"
  ENV="${ENVIRONMENT:-production}"
  
  echo "Variables de entorno leídas:"
  echo "  AUTH_API: $AUTH_API"
  echo "  CONTRIB_API: $CONTRIB_API"
  echo "  CAJA_API: $CAJA_API"
  echo ""
  
  cat > /usr/share/nginx/html/config.js <<EOF
/**
 * SIATEC Angular - Configuración Dinámica de APIs
 * Generado por entrypoint.sh desde variables de entorno de Kubernetes
 */
(function (window) {
  'use strict';

  console.log('[config.js] ☸️  Modo Kubernetes - Configuración desde variables de entorno');
  console.log('[config.js] 🔍 Auth API recibida: ${AUTH_API}');
  console.log('[config.js] 🔍 Contribuyentes API recibida: ${CONTRIB_API}');
  console.log('[config.js] 🔍 Contribuciones API recibida: ${CONTRIBUCIONES_API}');
  console.log('[config.js] 🔍 Caja API recibida: ${CAJA_API}');

  // Configuración global de APIs (desde variables de entorno)
  window.__SIATEC_CONFIG = {
    // URLs de APIs
    authApiBaseUrl: '${AUTH_API}',
    contribuyentesApiBaseUrl: '${CONTRIB_API}',
    contribucionesApiBaseUrl: '${CONTRIBUCIONES_API}',
    tesoreriaApiBaseUrl: '${TESORERIA_API}',
    notificacionesApiBaseUrl: '${NOTIF_API}',
    cajaApiBaseUrl: '${CAJA_API}',
    paccioliApiBaseUrl: '${PACCIOLI_API}',
    citasApiBaseUrl: '${CITAS_API}',

    // Información del ambiente
    environment: '${ENV}',
    deploymentMode: 'kubernetes',

    // Métodos de utilidad
    getApiUrl: function (service) {
      const serviceMap = {
        'auth': this.authApiBaseUrl,
        'contribuyentes': this.contribuyentesApiBaseUrl,
        'contribuciones': this.contribucionesApiBaseUrl,
        'tesoreria': this.tesoreriaApiBaseUrl,
        'notificaciones': this.notificacionesApiBaseUrl,
        'caja': this.cajaApiBaseUrl,
        'paccioli': this.paccioliApiBaseUrl,
        'citas': this.citasApiBaseUrl
      };
      return serviceMap[service] || '';
    },

    // Debug helper
    logConfig: function () {
      console.group('🔧 SIATEC Angular - Configuración de APIs (Kubernetes)');
      console.log('Deployment Mode:', this.deploymentMode);
      console.log('Ambiente:', this.environment);
      console.log('Auth API:', this.authApiBaseUrl);
      console.log('Contribuyentes API:', this.contribuyentesApiBaseUrl);
      console.log('Contribuciones API:', this.contribucionesApiBaseUrl);
      console.log('Tesorería API:', this.tesoreriaApiBaseUrl);
      console.log('Notificaciones API:', this.notificacionesApiBaseUrl);
      console.log('Caja API:', this.cajaApiBaseUrl);
      console.log('Paccioli API:', this.paccioliApiBaseUrl);
      console.log('Citas API:', this.citasApiBaseUrl);
      console.groupEnd();
    }
  };

  // Mostrar configuración en desarrollo
  if (window.__SIATEC_CONFIG.environment === 'development') {
    window.__SIATEC_CONFIG.logConfig();
  } else {
    console.log('[config.js] ✅ SIATEC Angular APIs configuradas para:', window.__SIATEC_CONFIG.environment);
  }

  // Hacer la configuración disponible globalmente también como API_CONFIG
  window.API_CONFIG = {
    authApi: window.__SIATEC_CONFIG.authApiBaseUrl,
    contribuyentesApi: window.__SIATEC_CONFIG.contribuyentesApiBaseUrl,
    contribucionesApi: window.__SIATEC_CONFIG.contribucionesApiBaseUrl,
    tesoreriaApi: window.__SIATEC_CONFIG.tesoreriaApiBaseUrl,
    notificacionesApi: window.__SIATEC_CONFIG.notificacionesApiBaseUrl,
    cajaApi: window.__SIATEC_CONFIG.cajaApiBaseUrl,
    paccioliApi: window.__SIATEC_CONFIG.paccioliApiBaseUrl,
    citasApi: window.__SIATEC_CONFIG.citasApiBaseUrl,
    environment: window.__SIATEC_CONFIG.environment
  };

  console.log('[config.js] ✅ Configuración cargada exitosamente');

})(window);
EOF

  echo "✅ Configuración generada para Kubernetes"
  echo "🔍 Deployment Mode: kubernetes"
  echo "🔍 Environment: ${ENV}"
  echo "🔍 Auth API: ${AUTH_API}"
  echo "🔍 Contribuyentes API: ${CONTRIB_API}"
  echo "🔍 Contribuciones API: ${CONTRIBUCIONES_API}"
  echo "🔍 Tesorería API: ${TESORERIA_API}"
  echo "🔍 Notificaciones API: ${NOTIFICACIONES_API}"
  echo "🔍 Caja API: ${CAJA_API}"
  echo "🔍 Paccioli API: ${PACCIOLI_API}"
  echo "🔍 Citas API: ${CITAS_API}"
fi  # Fin del if DEPLOYMENT_MODE

# Verificar que el archivo se generó correctamente
if [ ! -f "/usr/share/nginx/html/config.js" ]; then
  echo "❌ ERROR: config.js was not created!"
  exit 1
fi

CONFIG_SIZE=$(wc -c < /usr/share/nginx/html/config.js)
echo "✅ config.js generated successfully (${CONFIG_SIZE} bytes)"
echo ""
echo "First 3 lines of config.js:"
head -n 3 /usr/share/nginx/html/config.js
echo "..."
echo ""

# Opcional: compresión previa (solo si existe gzip util)
if command -v gzip >/dev/null 2>&1; then
  echo "Compressing static files..."
  find /usr/share/nginx/html -type f -regex '.*\.(js|css|html)$' -exec gzip -9 -k {} \; 2>/dev/null || true
  echo "✅ Static files compressed"
else
  echo "ℹ️  gzip not available, skipping compression"
fi

echo ""
echo "=========================================="
echo "Starting Nginx..."
echo "=========================================="

exec nginx -g 'daemon off;'
