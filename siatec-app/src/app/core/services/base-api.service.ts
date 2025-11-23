import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

/**
 * Opciones para peticiones HTTP
 */
export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
}

/**
 * Servicio base para todas las APIs
 * Proporciona métodos HTTP comunes y manejo de errores
 */
@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  constructor(
    protected http: HttpClient,
    protected config: ConfigService
  ) {}

  /**
   * Construye una URL completa concatenando segmentos
   */
  protected buildUrl(base: string, ...segments: (string | number)[]): string {
    const parts = [base, ...segments.filter(s => s !== null && s !== undefined)]
      .map(s => s.toString().trim())
      .join('/')
      .replace(/([^:])\/+/g, '$1/'); // Eliminar slashes duplicados excepto en protocolo

    return parts;
  }

  /**
   * GET request
   */
  protected get<T>(url: string): Observable<T> {
    return this.http.get<T>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * GET request with params
   */
  protected getWithParams<T>(url: string, params: any): Observable<T> {
    return this.http.get<T>(url, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * POST request
   */
  protected post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * PUT request
   */
  protected put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * PATCH request
   */
  protected patch<T>(url: string, body: any): Observable<T> {
    return this.http.patch<T>(url, body).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * DELETE request
   */
  protected delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Upload file with FormData
   */
  protected upload<T>(url: string, formData: FormData): Observable<T> {
    // No establecer Content-Type para que el browser lo haga automáticamente con boundary
    return this.http.post<T>(url, formData).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Download file
   */
  protected download(url: string): Observable<Blob> {
    return this.http.get(url, { 
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Manejo centralizado de errores
   */
  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error en la petición';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('[BaseApiService]', errorMessage, error);
    return throwError(() => ({ 
      message: errorMessage, 
      status: error.status,
      error: error.error,
      originalError: error
    }));
  }

  /**
   * Log para debugging (solo en desarrollo)
   */
  protected log(message: string, ...args: any[]): void {
    if (this.config.isDevelopment()) {
      console.log(`[${this.constructor.name}]`, message, ...args);
    }
  }
}
