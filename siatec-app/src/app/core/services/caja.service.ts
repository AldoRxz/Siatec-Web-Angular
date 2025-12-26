import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

/**
 * Datos para crear una orden de pago
 */
export interface CrearOrdenPagoRequest {
  determinacionId?: number;
  contribucionId?: number;
  usuarioId?: string;
  contribuyenteId?: number | null;
  rfcContribuyente: string;
  nombreContribuyente: string;
  conceptoCodigo: string;
  conceptoDescripcion: string;
  periodo: string;
  montoBase: number;
  montoRecargos?: number;
  montoActualizacion?: number;
  montoDescuento?: number;
  origen?: number;
  fechaVencimiento?: string;
}

/**
 * Respuesta de orden de pago
 */
export interface OrdenPagoResponse {
  id: string;
  numeroOrden: string;
  lineaCaptura: string;
  montoTotal: number;
  estado: string;
  fechaCreacion: string;
  fechaVencimiento?: string;
}

/**
 * Servicio para el microservicio de Caja (pagos)
 */
@Injectable({ providedIn: 'root' })
export class CajaService extends BaseApiService {
  private get baseUrl(): string {
    return this.config.getApiUrl('caja');
  }

  /**
   * Crea una nueva orden de pago desde una determinación
   */
  crearOrdenPago(ordenData: CrearOrdenPagoRequest): Observable<OrdenPagoResponse> {
    const payload = {
      ...ordenData,
      origen: ordenData.origen !== undefined ? ordenData.origen : 1, // 1 = PortalWeb
      montoRecargos: ordenData.montoRecargos || 0,
      montoActualizacion: ordenData.montoActualizacion || 0,
      montoDescuento: ordenData.montoDescuento || 0
    };

    return this.post<OrdenPagoResponse>(this.baseUrl, payload);
  }

  /**
   * Obtiene una orden de pago por su ID
   */
  getOrdenPago(ordenId: string): Observable<OrdenPagoResponse> {
    const url = this.buildUrl(this.baseUrl, ordenId);
    return this.get<OrdenPagoResponse>(url);
  }

  /**
   * Obtiene una orden de pago por su número de orden
   */
  getOrdenPorNumero(numeroOrden: string): Observable<OrdenPagoResponse> {
    const url = this.buildUrl(this.baseUrl, 'numero', numeroOrden);
    return this.get<OrdenPagoResponse>(url);
  }

  /**
   * Lista órdenes de pago con filtros
   */
  listarOrdenesPago(filtros?: {
    contribuyenteId?: number;
    usuarioId?: string;
    estado?: string;
    desde?: string;
    hasta?: string;
  }): Observable<OrdenPagoResponse[]> {
    const params: any = {};
    if (filtros) {
      if (filtros.contribuyenteId) params.contribuyenteId = filtros.contribuyenteId;
      if (filtros.usuarioId) params.usuarioId = filtros.usuarioId;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;
    }

    return this.getWithParams<OrdenPagoResponse[]>(this.baseUrl, params);
  }
}
