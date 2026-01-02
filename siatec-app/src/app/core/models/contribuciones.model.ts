/**
 * Modelos para el módulo de contribuciones y determinaciones
 */

export interface Determinacion {
  id: number;
  contribucionId: number;
  contribuyenteId?: number;
  periodo?: string;
  monto?: number;
  estado?: string;
  fechaCreacion?: string;
  contribucionInstance?: {
    contribucionNombre?: string;
    [key: string]: any;
  };
  metadata?: Record<string, any> | null;
  [key: string]: any;
}

export interface ContribucionVersion {
  id: number;
  contribucionId: number;
  version?: number | string;
  year?: number;
  periodo?: string;
  metadata?: ContribucionMetadata | string | null;
  [key: string]: any;
}

export interface ContribucionMetadata {
  atributos?: ContribucionAtributo[];
  [key: string]: any;
}

export interface ContribucionAtributo {
  nombre: string;
  Descripcion?: string;
  descripcion?: string;
  tipo?: number | string;
  values?: Array<string | number>;
  required?: boolean;
  [key: string]: any;
}

export interface DeterminacionCalculoRequest {
  determinacionId: number;
  contribucionId: number;
  contribuyenteId: number;
  versionId?: number;
  year: number;
  periodo?: string;
  data: Record<string, any>;
}

export interface CalculoDetalle {
  baseGravable?: CalculoDetalleItem;
  tarifa?: CalculoDetalleItem;
  deducciones?: CalculoDetalleItem[];
  totalDeducciones?: number;
  montoFinal?: number;
  calculoFormula?: string;
  [key: string]: any;
}

export interface CalculoDetalleItem {
  nombre?: string;
  formula?: string;
  valor?: number;
  [key: string]: any;
}

export interface DeterminacionCalculoData {
  determinacion: Determinacion;
  calculo: {
    contribucionId?: number;
    contribuyenteId?: number;
    determinacionId?: number;
    versionId?: number;
    year?: number;
    periodo?: string;
    fechaCalculo?: string;
    detalleCalculo?: CalculoDetalle;
    data?: Record<string, any>;
    [key: string]: any;
  };
}

export interface DeterminacionCalculoResponse {
  message?: string;
  data?: DeterminacionCalculoData;
}
