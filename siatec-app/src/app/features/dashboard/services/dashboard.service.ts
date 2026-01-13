import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';

export interface UltimaSolicitudInscripcion {
  id: number;
  estado: string;
  fechaSolicitud: string;
  fechaRevision?: string;
  comentario?: string;
}

export interface ContribuyenteDashboard {
  contribuyenteId: number;
  activo: boolean;
  cantidadCitas: number;
  cantidadNotificaciones: number;
  cantidadDeterminaciones: number;
  cantidadArchivos: number;
  ultimaSolicitud?: UltimaSolicitudInscripcion;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Obtiene los datos del dashboard para un contribuyente
   * Endpoint: GET contribuyentes/dashboard/{contribuyenteId}
   */
  getDashboard(contribuyenteId: number | string): Observable<ContribuyenteDashboard> {
    const baseUrl = this.config.getApiUrl('contribuyentes');
    const url = `${baseUrl}/dashboard/${contribuyenteId}`;
    return this.http.get<ContribuyenteDashboard>(url);
  }
}
