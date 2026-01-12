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
   * Obtiene todas las contribuciones disponibles en el sistema.
   */
  getContribuciones(): Observable<any[]> {
    const url = this.buildUrl(this.baseUrl, 'internal', 'contribuciones');
    return this.get<any[]>(url);
  }

  /**
   * Obtiene la lista de determinaciones vinculadas al contribuyente actual (ID numérico legacy).
   */
  getDeterminacionesPorContribuyente(contribuyenteId: number): Observable<Determinacion[]> {
    const url = this.buildUrl(this.baseUrl, 'internal', 'determinaciones', 'contribuyente', contribuyenteId);
    return this.get<Determinacion[] | { data?: Determinacion[] }>(url).pipe(
      map(response => this.normalizeDeterminaciones(response))
    );
  }

  /**
   * Obtiene la lista de determinaciones vinculadas al usuario autenticado por UUID.
   * Este es el método preferido ya que usa el identificador único del usuario.
   */
  getDeterminacionesPorUsuario(usuarioId: string): Observable<Determinacion[]> {
    const url = this.buildUrl(this.baseUrl, 'internal', 'determinaciones', 'usuario', usuarioId);
    return this.get<Determinacion[] | { data?: Determinacion[] }>(url).pipe(
      map(response => this.normalizeDeterminaciones(response))
    );
  }

  /**
   * Normaliza la respuesta de determinaciones (puede venir como array o envuelto en {data: [...]})
   */
  private normalizeDeterminaciones(response: Determinacion[] | { data?: Determinacion[] }): Determinacion[] {
    if (Array.isArray(response)) {
      return this.mapDeterminaciones(response);
    }
    if (response && Array.isArray(response.data)) {
      return this.mapDeterminaciones(response.data);
    }
    return [];
  }

  /**
   * Mapea las determinaciones normalizando propiedades PascalCase a camelCase
   */
  private mapDeterminaciones(items: any[]): Determinacion[] {
    return items.map(d => ({
      id: d.Id ?? d.id,
      contribucionId: d.ContribucionId ?? d.contribucionId,
      contribuyenteId: d.ContribuyenteId ?? d.contribuyenteId,
      versionId: d.VersionId ?? d.versionId,
      periodo: d.Periodo ?? d.periodo,
      monto: d.MontoDeterminado ?? d.montoDeterminado ?? d.monto,
      metadata: d.Metadata ?? d.metadata,
      fechaCreacion: d.FechaCreacion ?? d.fechaCreacion,
      contribucionInstance: d.Contribucion ? {
        id: d.Contribucion.Id ?? d.Contribucion.id,
        contribucionNombre: d.Contribucion.Nombre ?? d.Contribucion.nombre,
        tipo: d.Contribucion.Tipo ?? d.Contribucion.tipo,
        objeto: d.Contribucion.Objeto ?? d.Contribucion.objeto
      } : (d.contribucionInstance ?? null)
    }));
  }

  /**
   * Obtiene la versión activa de una contribución.
   */
  getContribucionActiva(contribucionId: number): Observable<ContribucionVersion> {
    const url = this.buildUrl(this.baseUrl, 'internal', 'versiones', 'contribucion', contribucionId, 'activa');
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
   * Usa POST /internal/determinaciones/calcular para crear y calcular la determinación.
   */
  calcularDeterminacion(payload: DeterminacionCalculoRequest): Observable<DeterminacionCalculoResponse> {
    const url = this.buildUrl(this.baseUrl, 'internal', 'determinaciones', 'calcular');
    const body = {
      determinacionId: payload.determinacionId || null,
      contribucionId: payload.contribucionId,
      contribuyenteId: payload.contribuyenteId,
      versionId: payload.versionId,
      anio: payload.year,
      data: payload.data ?? {}
    };

    return this.post<DeterminacionCalculoResponse>(url, body);
  }

  /**
   * Crea una determinación.
   */
  crearDeterminacion(data: Partial<Determinacion>): Observable<Determinacion> {
    const url = this.buildUrl(this.baseUrl, 'internal', 'determinaciones');
    return this.post<Determinacion>(url, data);
  }

  /**
   * Actualiza información de una determinación existente.
   */
  actualizarDeterminacion(determinacionId: number, data: Partial<Determinacion>): Observable<Determinacion> {
    const url = this.buildUrl(this.baseUrl, 'internal', 'determinaciones', determinacionId);
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
