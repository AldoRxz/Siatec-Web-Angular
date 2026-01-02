import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { 
  Contribuyente, 
  ArchivoContribuyente, 
  PaginatedResponse, 
  DocumentType,
  ContribuyenteDocumentType,
  ContribuyenteDashboard
} from '../models/contribuyente.model';

/**
 * Servicio para el microservicio de Contribuyentes
 */
@Injectable({
  providedIn: 'root'
})
export class ContribuyentesService extends BaseApiService {
  private get baseUrl(): string {
    return this.config.getApiUrl('contribuyentes');
  }

  // ============================================
  // CRUD de Contribuyentes
  // ============================================

  /**
   * Obtiene todos los contribuyentes
   */
  getContribuyentes(): Observable<Contribuyente[]> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes');
    return this.get<Contribuyente[]>(url);
  }

  /**
   * Obtiene un contribuyente por ID
   */
  getContribuyente(id: number): Observable<Contribuyente> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes', id);
    return this.get<Contribuyente>(url);
  }

  /**
   * Obtiene el dashboard con estadísticas del contribuyente
   */
  getDashboard(id: number): Observable<ContribuyenteDashboard> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes', 'dashboard', id);
    return this.get<ContribuyenteDashboard>(url);
  }

  /**
   * Crea un nuevo contribuyente
   */
  crearContribuyente(data: Partial<Contribuyente>): Observable<Contribuyente> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes');
    return this.post<Contribuyente>(url, data);
  }

  /**
   * Actualiza un contribuyente
   */
  actualizarContribuyente(id: number, data: Partial<Contribuyente>): Observable<Contribuyente> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes', id);
    return this.put<Contribuyente>(url, data);
  }

  /**
   * Actualiza un contribuyente mediante formulario
   */
  actualizarContribuyenteFormulario(id: number, data: any): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes', id, 'formulario');
    return this.post<any>(url, data);
  }

  /**
   * Activa un contribuyente
   */
  activarContribuyente(id: number): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes', id, 'activar');
    return this.put<any>(url, {});
  }

  /**
   * Elimina un contribuyente
   */
  eliminarContribuyente(id: number): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'Contribuyentes', id);
    return this.delete<any>(url);
  }

  // ============================================
  // Archivos
  // ============================================

  /**
   * Obtiene archivos de un contribuyente con paginación
   */
  getArchivosContribuyente(
    contribuyenteId: number, 
    page: number = 1, 
    pageSize: number = 20
  ): Observable<PaginatedResponse<ArchivoContribuyente>> {
    const url = this.buildUrl(this.baseUrl, 'Archivos', contribuyenteId);
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.getWithParams<PaginatedResponse<ArchivoContribuyente>>(url, params);
  }

  /**
   * Sube un archivo para un contribuyente
   */
  subirArchivo(contribuyenteId: number, formData: FormData): Observable<ArchivoContribuyente> {
    const url = this.buildUrl(this.baseUrl, 'Archivos', contribuyenteId, 'upload');
    return this.upload<ArchivoContribuyente>(url, formData);
  }

  /**
   * Descarga un archivo
   */
  descargarArchivo(contribuyenteId: number, archivoId: number): Observable<Blob> {
    const url = this.buildUrl(this.baseUrl, 'Archivos', contribuyenteId, 'download', archivoId);
    return this.download(url);
  }

  /**
   * Elimina un archivo
   */
  eliminarArchivo(contribuyenteId: number, archivoId: number): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'Archivos', contribuyenteId, archivoId);
    return this.delete<any>(url);
  }

  /**
   * Renombra un archivo
   */
  renombrarArchivo(contribuyenteId: number, archivoId: number, nuevoNombre: string): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'Archivos', contribuyenteId, archivoId);
    return this.patch<any>(url, { nombre: nuevoNombre });
  }

  // ============================================
  // Inscripción Documentos
  // ============================================

  /**
   * Obtiene documentos de inscripción por tipo de persona
   */
  getInscripcionDocumentos(tipoPersona: 'fisica' | 'moral'): Observable<DocumentType[]> {
    const segment = tipoPersona === 'moral' ? 'moral' : 'fisica';
    const url = this.buildUrl(this.baseUrl, 'InscripcionDocumentos', segment);
    return this.get<DocumentType[]>(url);
  }

  /**
   * Agrega un documento de inscripción
   */
  addInscripcionDocumento(tipoPersona: 'fisica' | 'moral', contribuyenteId: number): Observable<any> {
    const segment = tipoPersona === 'moral' ? 'moral' : 'fisica';
    const url = this.buildUrl(this.baseUrl, 'InscripcionDocumentos', segment, contribuyenteId);
    return this.post<any>(url, {});
  }

  // ============================================
  // Asignación de Documentos del Contribuyente
  // ============================================

  /**
   * Obtiene tipos de documentos asignados a un contribuyente
   */
  getContribuyenteDocumentTypes(contribuyenteId: number): Observable<ContribuyenteDocumentType[]> {
    const url = this.buildUrl(this.baseUrl, 'AsignarDocumentos', contribuyenteId);
    return this.get<ContribuyenteDocumentType[]>(url);
  }

  /**
   * Asigna un tipo de documento a un contribuyente
   */
  assignContribuyenteDocumentType(contribuyenteId: number, documentTypeId: number): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'AsignarDocumentos', contribuyenteId);
    return this.post<any>(url, { documentTypeId });
  }

  /**
   * Desasigna un tipo de documento de un contribuyente
   */
  unassignContribuyenteDocumentType(contribuyenteId: number, documentTypeId: number): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'AsignarDocumentos', contribuyenteId, documentTypeId);
    return this.delete<any>(url);
  }

  /**
   * Actualiza un tipo de documento asignado
   */
  updateContribuyenteDocumentType(
    contribuyenteId: number, 
    documentTypeId: number, 
    body: any
  ): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'AsignarDocumentos', contribuyenteId, documentTypeId);
    return this.patch<any>(url, body);
  }
}
