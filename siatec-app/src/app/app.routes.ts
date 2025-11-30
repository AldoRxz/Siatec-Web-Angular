import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar Sesión - SIATEC'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Registro - SIATEC'
  },
  {
    path: 'forgot',
    loadComponent: () => import('./features/auth/forgot/forgot.component').then(m => m.ForgotComponent),
    title: 'Recuperar contraseña - SIATEC'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
