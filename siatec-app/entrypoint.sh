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
  # Modo kubernetes o auto - Detección dinámica
  echo "☸️  Generando config.js para Kubernetes/Auto..."
  cat > /usr/share/nginx/html/config.js <<'EOF'
/**
 * SIATEC Angular - Configuración Dinámica de APIs
 * Generado por entrypoint.sh en tiempo de ejecución del contenedor
 */
(function (window) {
  'use strict';

  const protocol = window.location.protocol;
  const host = window.location.host;
  const hostname = window.location.hostname;

  // Detectar el entorno actual
  let baseUrl;
  let environment = 'development';

  console.log('[config.js] Detectando configuración...');
  console.log('[config.js] hostname:', hostname);
  console.log('[config.js] host:', host);
  console.log('[config.js] protocol:', protocol);

  // Si estamos en localhost o puerto de desarrollo, usar URL base de ingress
  if (hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      /:\d{4,5}$/.test(host)) {
    // Desarrollo local - usar primer host de ingress por defecto
    baseUrl = "https://dev.192.168.1.197.sslip.io";
    environment = 'development';
    console.log('[config.js] 🏠 Modo desarrollo local - usando ingress:', baseUrl);
  } else {
    // Producción/staging - usar el mismo host desde el que se accede
    baseUrl = protocol + '//' + host.split(':')[0];

    // Detectar ambiente por hostname
    if (hostname.includes('dev.')) {
      environment = 'development';
    } else if (hostname.includes('staging.')) {
      environment = 'staging';
    } else if (hostname.includes('prod.')) {
      environment = 'production';
    }

    console.log('[config.js] 🌐 Accediendo desde:', hostname);
    console.log('[config.js] 🔗 Base URL:', baseUrl);
  }

  // Configuración global de APIs
  window.__SIATEC_CONFIG = {
    // URLs de APIs
    authApiBaseUrl: baseUrl + '/internal/auth',
    contribuyentesApiBaseUrl: baseUrl + '/internal',
    contribucionesApiBaseUrl: baseUrl + '/internal',
    tesoreriaApiBaseUrl: baseUrl + '/api/tesoreria',
    notificacionesApiBaseUrl: baseUrl + '/api/notificaciones',

    // Información del ambiente
    environment: environment,
    baseUrl: baseUrl,

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

  // Mostrar configuración en desarrollo
  if (environment === 'development') {
    window.__SIATEC_CONFIG.logConfig();
  } else {
    console.log('[config.js] ✅ SIATEC Angular APIs configuradas para:', environment);
  }

  // Hacer la configuración disponible globalmente también como API_CONFIG
  window.API_CONFIG = {
    authApi: window.__SIATEC_CONFIG.authApiBaseUrl,
    contribuyentesApi: window.__SIATEC_CONFIG.contribuyentesApiBaseUrl,
    contribucionesApi: window.__SIATEC_CONFIG.contribucionesApiBaseUrl,
    tesoreriaApi: window.__SIATEC_CONFIG.tesoreriaApiBaseUrl,
    notificacionesApi: window.__SIATEC_CONFIG.notificacionesApiBaseUrl,
    environment: window.__SIATEC_CONFIG.environment
  };

  console.log('[config.js] ✅ Configuración cargada exitosamente');

})(window);
EOF
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
