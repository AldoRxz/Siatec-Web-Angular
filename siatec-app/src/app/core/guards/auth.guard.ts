import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * Redirige al login si el usuario no está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Guardar la URL a la que se intentó acceder para redirigir después del login
  const returnUrl = state.url;
  console.warn('[AuthGuard] Usuario no autenticado, redirigiendo a login');
  
  router.navigate(['/login'], { 
    queryParams: { returnUrl } 
  });
  
  return false;
};

/**
 * Guard para rutas que NO deben ser accesibles si ya está autenticado
 * (ej: login, registro)
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // Si ya está autenticado, redirigir al dashboard
  console.warn('[GuestGuard] Usuario ya autenticado, redirigiendo a dashboard');
  router.navigate(['/contribuyentes/dashboard'});
  
  return false;
};
