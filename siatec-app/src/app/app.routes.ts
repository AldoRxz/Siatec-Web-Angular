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
    loadComponent: () => import('./features/dashboard/layout/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'panel',
        pathMatch: 'full'
      },
      {
        path: 'panel',
        loadComponent: () => import('./features/dashboard/panel/panel.component').then(m => m.PanelComponent),
        title: 'Panel principal - SIATEC'
      },
      {
        path: 'resumen',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Resumen extendido - SIATEC'
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
        path: 'contribuciones',
        loadComponent: () => import('./features/dashboard/contribuciones/contribuciones.component').then(m => m.ContribucionesComponent),
        title: 'Contribuciones - SIATEC'
      },
      {
        path: 'citas',
        loadComponent: () => import('./features/dashboard/citas/citas.component').then(m => m.CitasComponent),
        title: 'Citas - SIATEC'
      },
      {
        path: 'inscripcion',
        loadComponent: () => import('./features/dashboard/inscripcion/inscripcion.component').then(m => m.InscripcionComponent),
        title: 'Solicitud de inscripción - SIATEC'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
