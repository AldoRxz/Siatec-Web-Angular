/**
 * Modelos para el módulo de Contribuyentes
 */

export interface Contribuyente {
  id: number;
  nombre: string;
  apellidos?: string;
  rfc?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipo: 'fisica' | 'moral';
  estatus?: string;
  fechaRegistro?: string;
  [key: string]: any;
}

export interface ArchivoContribuyente {
  id: number;
  contribuyenteId: number;
  nombre: string;
  nombreOriginal?: string;
  rutaArchivo: string;
  tipoDocumento?: string;
  tamano?: number;
  fechaSubida: string;
  extension?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DocumentType {
  id: number;
  nombre: string;
  descripcion?: string;
  requerido: boolean;
  tipoPersona?: 'fisica' | 'moral' | 'ambos';
}

export interface ContribuyenteDocumentType {
  documentTypeId: number;
  contribuyenteId: number;
  nombre: string;
  estatus?: string;
  fechaAsignacion?: string;
}
