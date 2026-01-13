/**
 * SIATEC - Configuración Dinámica de APIs para DESARROLLO LOCAL
 * 
 * Este archivo es SOLO para desarrollo local.
 * En producción/Docker, este archivo es generado dinámicamente por entrypoint.sh
 * 
 * NO MODIFICAR en producción - será sobrescrito por el contenedor
 */
(function (window) {
  'use strict';

  console.log('[config.js] 🏠 Configuración de desarrollo local cargada');

  // Configuración para desarrollo local
  window.__SIATEC_CONFIG = {
    // URLs de APIs para desarrollo local
    authApiBaseUrl: 'http://localhost:5010/internal/auth',
    contribuyentesApiBaseUrl: 'http://localhost:5086/internal',
    contribucionesApiBaseUrl: 'http://localhost:5087/internal',
    tesoreriaApiBaseUrl: 'http://localhost:5092/api/tesoreria',
    notificacionesApiBaseUrl: 'http://localhost:5005/api/notificaciones',
    paccioliApiBaseUrl: 'http://ia.192.168.1.223.sslip.io',
    cajaApiBaseUrl: 'http://localhost:5091/api/v1/ordenes-pago',

    // Información del ambiente
    environment: 'development',
    baseUrl: 'http://localhost',

    // Método para obtener URL de un servicio
    getApiUrl: function (service) {
      const serviceMap = {
        'auth': this.authApiBaseUrl,
        'contribuyentes': this.contribuyentesApiBaseUrl,
        'contribuciones': this.contribucionesApiBaseUrl,
        'tesoreria': this.tesoreriaApiBaseUrl,
        'notificaciones': this.notificacionesApiBaseUrl,
        'paccioli': this.paccioliApiBaseUrl,
        'caja': this.cajaApiBaseUrl
      };
      return serviceMap[service] || this.baseUrl;
    },

    // Método para mostrar configuración en consola
    logConfig: function () {
      console.group('🔧 SIATEC Angular - Configuración de APIs');
      console.log('Ambiente:', this.environment);
      console.log('Base URL:', this.baseUrl);
      console.log('Auth API:', this.authApiBaseUrl);
      console.log('Contribuyentes API:', this.contribuyentesApiBaseUrl);
      console.log('Contribuciones API:', this.contribucionesApiBaseUrl);
      console.log('Tesorería API:', this.tesoreriaApiBaseUrl);
      console.log('Notificaciones API:', this.notificacionesApiBaseUrl);
      console.log('Paccioli API:', this.paccioliApiBaseUrl);
      console.log('Caja API:', this.cajaApiBaseUrl);
      console.groupEnd();
    }
  };

  // Compatibilidad con API_CONFIG
  window.API_CONFIG = {
    authApi: window.__SIATEC_CONFIG.authApiBaseUrl,
    contribuyentesApi: window.__SIATEC_CONFIG.contribuyentesApiBaseUrl,
    contribucionesApi: window.__SIATEC_CONFIG.contribucionesApiBaseUrl,
    tesoreriaApi: window.__SIATEC_CONFIG.tesoreriaApiBaseUrl,
    notificacionesApi: window.__SIATEC_CONFIG.notificacionesApiBaseUrl,
    cajaApi: window.__SIATEC_CONFIG.cajaApiBaseUrl,
    environment: window.__SIATEC_CONFIG.environment
  };

  // Mostrar configuración en desarrollo
  window.__SIATEC_CONFIG.logConfig();

  console.log('[config.js] ✅ Configuración de desarrollo lista');
  console.log('[config.js] 💡 En producción, este archivo es generado por Docker');

})(window);
