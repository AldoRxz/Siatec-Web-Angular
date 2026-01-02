/**
 * Servicio de configuración que lee las URLs de APIs desde window.__SIATEC_CONFIG
 */
export interface SiatecConfig {
  authApiBaseUrl: string;
  contribuyentesApiBaseUrl: string;
  contribucionesApiBaseUrl: string;
  tesoreriaApiBaseUrl: string;
  notificacionesApiBaseUrl: string;
  paccioliApiBaseUrl: string;
  cajaApiBaseUrl: string;
  environment: 'development' | 'staging' | 'production' | 'docker-local';
  baseUrl: string;
  getApiUrl: (service: string) => string;
  logConfig: () => void;
}

declare global {
  interface Window {
    __SIATEC_CONFIG?: SiatecConfig;
    API_CONFIG?: {
      authApi: string;
      contribuyentesApi: string;
      contribucionesApi: string;
      tesoreriaApi: string;
      notificacionesApi: string;
      cajaApi: string;
      environment: string;
    };
  }
}

export {};
