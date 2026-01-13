import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';

export interface CatalogoDocumentoDto {
  id: number;
  nombre: string;
  descripcion?: string;
  esObligatorio: boolean;
  esActivo: boolean;
}

export interface ArchivoDto {
  id: number;
  contribuyenteId: number;
  catalogoDocumentoId?: number;
  nombreArchivo: string;
  tamanioBytes: number;
  fechaSubida: string;
  descripcionArchivo?: string;
  isActive: boolean;
  catalogoDocumento?: CatalogoDocumentoDto;
}

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Obtiene todos los archivos de un contribuyente
   * Endpoint: GET archivos/{contribuyenteId}
   */
  getArchivosByContribuyente(contribuyenteId: number): Observable<ArchivoDto[]> {
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${contribuyenteId}`;
    return this.http.get<ArchivoDto[]>(url);
  }

  /**
   * Sube un nuevo archivo
   * Endpoint: POST archivos/{contribuyenteId}/upload
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

    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${contribuyenteId}/upload`;
    return this.http.post<ArchivoDto>(url, formData);
  }

  /**
   * Descarga un archivo
   * Endpoint: GET archivos/{contribuyenteId}/download/{archivoId}
   */
  downloadArchivo(contribuyenteId: number, archivoId: number): Observable<Blob> {
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${contribuyenteId}/download/${archivoId}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Elimina un archivo
   * Endpoint: DELETE archivos/{contribuyenteId}/{id}
   */
  deleteArchivo(id: number, contribuyenteId?: number): Observable<void> {
    const contribId = contribuyenteId || 0;
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${contribId}/${id}`;
    return this.http.delete<void>(url);
  }

  /**
   * Renombra un archivo
   * Endpoint: PATCH archivos/{contribuyenteId}/{id}
   */
  renameArchivo(id: number, nuevoNombre: string, contribuyenteId?: number): Observable<ArchivoDto> {
    const contribId = contribuyenteId || 0;
    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${contribId}/${id}`;
    return this.http.patch<ArchivoDto>(url, { nombreArchivo: nuevoNombre });
  }
}
