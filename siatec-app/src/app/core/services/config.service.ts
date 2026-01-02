import { Injectable } from '@angular/core';
import { SiatecConfig } from '../models/siatec-config.model';

/**
 * Servicio para acceder a la configuración dinámica de APIs
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly defaultConfig = {
    authApiBaseUrl: 'http://localhost:5002/api/auth',
    contribuyentesApiBaseUrl: 'http://localhost:5001/api/contribuyentes',
    contribucionesApiBaseUrl: 'http://localhost:5000/api/contribuciones',
    tesoreriaApiBaseUrl: 'http://localhost:5003/api/tesoreria',
    notificacionesApiBaseUrl: 'http://localhost:5005/api/notificaciones',
    paccioliApiBaseUrl: 'http://192.168.1.113:8080',
    cajaApiBaseUrl: 'http://localhost:5089/api/v1/ordenes-pago',
    environment: 'development' as const,
    baseUrl: 'http://localhost'
  };

  constructor() {
    this.logConfiguration();
  }

  /**
   * Obtiene la configuración completa desde window.__SIATEC_CONFIG o defaults
   */
  getConfig(): SiatecConfig {
    if (typeof window !== 'undefined' && window.__SIATEC_CONFIG) {
      return window.__SIATEC_CONFIG;
    }

    return {
      ...this.defaultConfig,
      getApiUrl: (service: string) => this.getApiUrl(service as any),
      logConfig: () => this.logConfiguration()
    };
  }

  /**
   * Obtiene la URL base de una API específica
   */
  getApiUrl(service: 'auth' | 'contribuyentes' | 'contribuciones' | 'tesoreria' | 'notificaciones' | 'paccioli' | 'caja'): string {
    const config = this.getConfig();
    
    const serviceMap: Record<string, string> = {
      auth: config.authApiBaseUrl,
      contribuyentes: config.contribuyentesApiBaseUrl,
      contribuciones: config.contribucionesApiBaseUrl,
      tesoreria: config.tesoreriaApiBaseUrl,
      notificaciones: config.notificacionesApiBaseUrl,
      paccioli: config.paccioliApiBaseUrl,
      caja: config.cajaApiBaseUrl
    };

    return serviceMap[service] || config.baseUrl;
  }

  /**
   * Obtiene el ambiente actual
   */
  getEnvironment(): string {
    return this.getConfig().environment;
  }

  /**
   * Verifica si estamos en modo desarrollo
   */
  isDevelopment(): boolean {
    return this.getEnvironment() === 'development' || this.getEnvironment() === 'docker-local';
  }

  /**
   * Verifica si estamos en modo producción
   */
  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Log de la configuración (solo en desarrollo)
   */
  private logConfiguration(): void {
    if (this.isDevelopment()) {
      const config = this.getConfig();
      console.group('🔧 SIATEC Angular - Configuración de APIs');
      console.log('Ambiente:', config.environment);
      console.log('Base URL:', config.baseUrl);
      console.log('Auth API:', config.authApiBaseUrl);
      console.log('Contribuyentes API:', config.contribuyentesApiBaseUrl);
      console.log('Contribuciones API:', config.contribucionesApiBaseUrl);
      console.log('Tesorería API:', config.tesoreriaApiBaseUrl);
      console.log('Notificaciones API:', config.notificacionesApiBaseUrl);
      console.log('Paccioli API:', config.paccioliApiBaseUrl);
      console.log('Caja API:', config.cajaApiBaseUrl);
      console.groupEnd();
    }
  }

  /**
   * Permite sobrescribir la URL de una API específica (útil para testing)
   */
  setApiUrl(service: string, url: string): void {
    if (typeof window !== 'undefined' && window.__SIATEC_CONFIG) {
      const key = `${service}ApiBaseUrl` as keyof SiatecConfig;
      (window.__SIATEC_CONFIG as any)[key] = url;
    }
  }
}
