import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
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
    path: 'dashboard',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Panel principal - SIATEC'
      },
      {
        path: 'archivos',
        loadComponent: () => import('./features/dashboard/archivos/archivos.component').then(m => m.ArchivosComponent),
        title: 'Archivos - SIATEC'
      },
      {
        path: 'cuenta',
        loadComponent: () => import('./features/dashboard/cuenta/cuenta.component').then(m => m.CuentaComponent),
        title: 'Cuenta - SIATEC'
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./features/dashboard/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent),
        title: 'Notificaciones - SIATEC'
      },
      {
        path: 'operaciones',
        loadComponent: () => import('./features/dashboard/operaciones/operaciones.component').then(m => m.OperacionesComponent),
        title: 'Operaciones - SIATEC'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
