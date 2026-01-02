import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { firstValueFrom } from 'rxjs';

/**
 * Servicio para la API de Paccioli
 */
@Injectable({
  providedIn: 'root'
})
export class PaccioliService extends BaseApiService {
  
  /**
   * Obtiene la URL base de Paccioli
   */
  private get paccioliBaseUrl(): string {
    return this.config.getApiUrl('paccioli');
  }

  /**
   * GET /smart-use-cases/allowed-files/structure-output
   * Obtiene la estructura de archivos permitidos
   */
  async getAllowedFilesStructureOutput(): Promise<any> {
    const url = this.buildUrl(
      this.paccioliBaseUrl,
      'smart-use-cases',
      'allowed-files',
      'structure-output'
    );
    return firstValueFrom(this.get<any>(url));
  }

  /**
   * POST /smart-use-cases/allowed-files/structure-output
   * Procesa archivos con Paccioli
   * @param files - Archivo(s) a procesar
   * @param instance - Objeto de instancia a rellenar
   */
  async procesarArchivos(
    files: File | File[],
    instance: Record<string, any> = {}
  ): Promise<any> {
    const url = this.buildUrl(
      this.paccioliBaseUrl,
      'smart-use-cases',
      'allowed-files',
      'structure-output'
    );
    
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : files ? [files] : [];
    
    fileArray.forEach((file) => {
      if (file) {
        formData.append('files', file);
      }
    });

    try {
      const instanceStr = typeof instance === 'string' 
        ? instance 
        : JSON.stringify(instance || {});
      formData.set('object_instance_to_fill', instanceStr);
    } catch (error) {
      formData.set('object_instance_to_fill', '{}');
    }

    try {
      return await firstValueFrom(this.upload<any>(url, formData));
    } catch (error: any) {
      const errorMessage = error?.message || error?.error?.message || 'Error desconocido';
      throw new Error(`[Paccioli] Error procesando archivos: ${errorMessage}`);
    }
  }
}
