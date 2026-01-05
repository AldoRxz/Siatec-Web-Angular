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
   */
  getArchivosByContribuyente(contribuyenteId: number): Observable<ArchivoDto[]> {
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/contribuyente/${contribuyenteId}`;
    return this.http.get<ArchivoDto[]>(url);
  }

  /**
   * Sube un nuevo archivo
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

    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${contribuyenteId}`;
    return this.http.post<ArchivoDto>(url, formData);
  }

  /**
   * Descarga un archivo
   */
  downloadArchivo(id: number): Observable<Blob> {
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${id}/download`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Elimina un archivo
   */
  deleteArchivo(id: number): Observable<void> {
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${id}`;
    return this.http.delete<void>(url);
  }

  /**
   * Renombra un archivo
   */
  renameArchivo(id: number, nuevoNombre: string): Observable<ArchivoDto> {
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${id}/rename`;
    return this.http.patch<ArchivoDto>(url, { nuevoNombre });
  }
}
