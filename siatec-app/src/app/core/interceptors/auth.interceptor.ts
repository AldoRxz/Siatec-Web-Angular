import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor HTTP que agrega el token de autenticación a todas las peticiones
 * y maneja errores 401 (No autorizado)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Obtener el token
  const token = authService.getToken();

  // Clonar la petición y agregar el header de autorización si existe token
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  // Continuar con la petición y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 (No autorizado), hacer logout
      if (error.status === 401) {
        console.warn('[AuthInterceptor] 401 Unauthorized - Logging out');
        authService.logout();
      }

      // Si es 403 (Prohibido), mostrar mensaje
      if (error.status === 403) {
        console.warn('[AuthInterceptor] 403 Forbidden - Access denied');
      }

      return throwError(() => error);
    })
  );
};
