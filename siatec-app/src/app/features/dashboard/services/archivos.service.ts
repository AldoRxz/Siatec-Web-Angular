import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';

export interface ArchivoDto {
  id: number;
  contribuyenteId: number;
  catalogoDocumentoId?: number;
  nombreArchivo: string;
  tamanioBytes: number;
  fechaSubida: string;
  descripcionArchivo?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Obtiene todos los archivos de un contribuyente
   * Endpoint: GET /internal/archivos/contribuyente/{contribuyenteId}
   */
  getArchivosByContribuyente(contribuyenteId: number): Observable<ArchivoDto[]> {
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/contribuyente/${contribuyenteId}`;
    return this.http.get<ArchivoDto[]>(url);
  }

  /**
   * Sube un nuevo archivo
   * Endpoint: POST /api/contribuyentes/archivos/{contribuyenteId}
   */
  uploadArchivo(contribuyenteId: number, file: File, catalogoDocumentoId?: number, descripcion?: string): Observable<ArchivoDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (catalogoDocumentoId) {
      formData.append('catalogoDocumentoId', catalogoDocumentoId.toString());
    }
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const baseUrl = this.config.getApiUrl('contribuyentes').replace('/api/contribuyentes', '');
    const url = `${baseUrl}/api/contribuyentes/archivos/${contribuyenteId}`;
    return this.http.post<ArchivoDto>(url, formData);
  }

  /**
   * Descarga un archivo
   * Endpoint: GET /api/contribuyentes/archivos/{id}/download
   */
  downloadArchivo(id: number): Observable<Blob> {
    const baseUrl = this.config.getApiUrl('contribuyentes').replace('/api/contribuyentes', '');
    const url = `${baseUrl}/api/contribuyentes/archivos/${id}/download`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Elimina un archivo
   * Endpoint: DELETE /api/contribuyentes/archivos/{id}
   */
  deleteArchivo(id: number): Observable<void> {
    const baseUrl = this.config.getApiUrl('contribuyentes').replace('/api/contribuyentes', '');
    const url = `${baseUrl}/api/contribuyentes/archivos/${id}`;
    return this.http.delete<void>(url);
  }

  /**
   * Renombra un archivo
   * Endpoint: PATCH /api/contribuyentes/archivos/{id}/rename
   */
  renameArchivo(id: number, nuevoNombre: string): Observable<ArchivoDto> {
    const baseUrl = this.config.getApiUrl('contribuyentes').replace('/api/contribuyentes', '');
    const url = `${baseUrl}/api/contribuyentes/archivos/{id}/rename`;
    return this.http.patch<ArchivoDto>(url, { nuevoNombre });
  }
}
