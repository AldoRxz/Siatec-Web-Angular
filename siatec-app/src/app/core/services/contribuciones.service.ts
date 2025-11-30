import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  Determinacion,
  ContribucionVersion,
  DeterminacionCalculoRequest,
  DeterminacionCalculoResponse
} from '../models/contribuciones.model';

/**
 * Servicio para consumir el microservicio de contribuciones.
 */
@Injectable({ providedIn: 'root' })
export class ContribucionesService extends BaseApiService {
  private get baseUrl(): string {
    return this.config.getApiUrl('contribuciones');
  }

  /**
   * Obtiene la lista de determinaciones vinculadas al contribuyente actual.
   */
  getDeterminacionesPorContribuyente(contribuyenteId: number): Observable<Determinacion[]> {
    const url = this.buildUrl(this.baseUrl, 'determinacion', 'contribuyente', contribuyenteId);
    return this.get<Determinacion[] | { data?: Determinacion[] }>(url).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtiene la versión activa de una contribución.
   */
  getContribucionActiva(contribucionId: number): Observable<ContribucionVersion> {
    const url = this.buildUrl(this.baseUrl, 'versiones', 'contribucion', contribucionId, 'activa');
    return this.get<ContribucionVersion | { data?: ContribucionVersion }>(url).pipe(
      map(response => {
        if (!response) {
          throw new Error('No se recibió información de la contribución.');
        }
        if ('data' in response && response.data) {
          return response.data;
        }
        return response as ContribucionVersion;
      })
    );
  }

  /**
   * Ejecuta el cálculo de determinación con los datos proporcionados.
   */
  calcularDeterminacionCalculo(payload: DeterminacionCalculoRequest): Observable<DeterminacionCalculoResponse> {
    const url = this.buildUrl(this.baseUrl, 'determinacion', payload.determinacionId, 'calculo');
    const queryString = this.buildQueryString(payload.data);
    const body = {
      contribucionVersionId: payload.versionId,
      contribucionId: payload.contribucionId,
      contribuyenteId: payload.contribuyenteId,
      year: payload.year,
      periodo: payload.periodo ?? 'Mensual',
      variables: payload.data ?? {}
    };

    return this.put<DeterminacionCalculoResponse>(queryString ? `${url}?${queryString}` : url, body);
  }

  /**
   * Crea una determinación.
   */
  crearDeterminacion(data: Partial<Determinacion>): Observable<Determinacion> {
    const url = this.buildUrl(this.baseUrl, 'determinacion');
    return this.post<Determinacion>(url, data);
  }

  /**
   * Actualiza información de una determinación existente.
   */
  actualizarDeterminacion(determinacionId: number, data: Partial<Determinacion>): Observable<Determinacion> {
    const url = this.buildUrl(this.baseUrl, 'determinacion', determinacionId);
    return this.put<Determinacion>(url, data);
  }

  private buildQueryString(params: Record<string, any> = {}): string {
    const entries = Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '');
    if (!entries.length) {
      return '';
    }
    const usp = new URLSearchParams();
    for (const [key, value] of entries) {
      usp.append(key, String(value));
    }
    return usp.toString();
  }
}
