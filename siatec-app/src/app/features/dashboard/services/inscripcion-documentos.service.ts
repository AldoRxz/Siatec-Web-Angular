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

export interface DocumentoRequeridoDto {
  id: number;
  catalogoDocumentoId: number;
  tipoPersona: string;
  seccion?: string;
  orden: number;
  esObligatorio: boolean;
  esActivo: boolean;
  catalogoDocumento?: CatalogoDocumentoDto;
}

export interface DocumentosInscripcionResponse {
  documentos: DocumentoRequeridoDto[];
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionDocumentosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Obtiene los documentos requeridos para inscripción de persona física
   */
  getDocumentosFisica(seccion?: string): Observable<DocumentosInscripcionResponse> {
    let url = `${this.config.getApiUrl('contribuyentes')}/internal/inscripcion-documentos/fisica`;
    if (seccion) {
      url += `?seccion=${encodeURIComponent(seccion)}`;
    }
    return this.http.get<DocumentosInscripcionResponse>(url);
  }

  /**
   * Obtiene los documentos requeridos para inscripción de persona moral
   */
  getDocumentosMoral(seccion?: string): Observable<DocumentosInscripcionResponse> {
    let url = `${this.config.getApiUrl('contribuyentes')}/internal/inscripcion-documentos/moral`;
    if (seccion) {
      url += `?seccion=${encodeURIComponent(seccion)}`;
    }
    return this.http.get<DocumentosInscripcionResponse>(url);
  }

  /**
   * Sube un archivo para un documento de inscripción
   */
  uploadDocumento(
    contribuyenteId: number,
    file: File,
    catalogoDocumentoId?: number,
    descripcion?: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (catalogoDocumentoId) {
      formData.append('catalogoDocumentoId', catalogoDocumentoId.toString());
    }
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const url = `${this.config.getApiUrl('contribuyentes')}/archivos/${contribuyenteId}`;
    return this.http.post<any>(url, formData);
  }
}
