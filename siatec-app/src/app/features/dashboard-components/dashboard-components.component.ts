import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services';

interface ComponentsStatCard {
  label: string;
  value: string;
  description: string;
  chip: string;
  appearance: 'primary' | 'success' | 'warning' | 'danger';
  route?: string;
}

interface ComponentsTask {
  title: string;
  detail: string;
  progress: number;
  route?: string;
}

interface ComponentsTimelineItem {
  title: string;
  detail: string;
  timestamp: string;
  appearance: 'success' | 'info' | 'warning';
}

interface ComponentsDocument {
  title: string;
  detail: string;
  status: string;
  hint: string;
  appearance: 'success' | 'warning' | 'danger';
}

interface ComponentsSidebarSection {
  title: string;
  items: Array<{ label: string; route?: string }>;
}

@Component({
  selector: 'app-dashboard-components',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './dashboard-components.component.html',
  styleUrl: './dashboard-components.component.scss'
})
export class DashboardComponentsComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly statsCards: ComponentsStatCard[] = [
    {
      label: 'Cuenta verificada',
      value: 'Completa',
      description: 'Tus datos coinciden con el padrón municipal.',
      chip: 'Perfil',
      appearance: 'primary',
      route: '/dashboard/cuenta'
    },
    {
      label: 'Documentos cargados',
      value: '12',
      description: 'Repositorio SIATEC actualizado hace 2 h.',
      chip: 'Archivos',
      appearance: 'success',
      route: '/dashboard/archivos'
    },
    {
      label: 'Citas confirmadas',
      value: '02',
      description: 'Módulo Centro · Próximas 48h.',
      chip: 'Agenda',
      appearance: 'warning',
      route: '/dashboard/operaciones'
    },
    {
      label: 'Alertas activas',
      value: '01',
      description: 'Tesorería requiere documentación adicional.',
      chip: 'Atiende hoy',
      appearance: 'danger',
      route: '/dashboard/notificaciones'
    }
  ];

  readonly tasks: ComponentsTask[] = [
    {
      title: 'Actualizar poderes notariales',
      detail: 'Sube las escrituras digitalizadas y firma electrónicamente.',
      progress: 45,
      route: '/dashboard/archivos'
    },
    {
      title: 'Conciliar contribuciones',
      detail: 'Cruza los pagos municipales con PACCIOLI.',
      progress: 70,
      route: '/dashboard/operaciones'
    },
    {
      title: 'Programar acompañamiento',
      detail: 'Selecciona asesor y ventana presencial.',
      progress: 15,
      route: '/dashboard/operaciones'
    }
  ];

  readonly timeline: ComponentsTimelineItem[] = [
    {
      title: 'Captura de expediente',
      detail: 'Unidad digital completó 100% de datos.',
      timestamp: '22 junio · 09:18 h',
      appearance: 'success'
    },
    {
      title: 'Validación documental',
      detail: 'Revisión automática al 45% · faltan poderes.',
      timestamp: 'En curso',
      appearance: 'info'
    },
    {
      title: 'Resolución Tesorería',
      detail: 'Esperando turno consecutivo 184-TS.',
      timestamp: 'Estimado 18 julio',
      appearance: 'warning'
    }
  ];

  readonly documents: ComponentsDocument[] = [
    {
      title: 'Identificación representante',
      detail: 'Coincide con lineamientos vigentes.',
      status: 'Validado',
      hint: '08 julio · 09:41 h',
      appearance: 'success'
    },
    {
      title: 'Contrato social digital',
      detail: 'Pendiente de firma electrónica de notario.',
      status: 'Por firmar',
      hint: '13 julio · 17:20 h',
      appearance: 'warning'
    },
    {
      title: 'Comprobante de domicilio',
      detail: 'Carga un recibo con antigüedad menor a 90 días.',
      status: 'Actualizar',
      hint: 'Hoy · 08:10 h',
      appearance: 'danger'
    }
  ];

  readonly sidebar: ComponentsSidebarSection[] = [
    {
      title: 'Panel Angular',
      items: [
        { label: 'Inicio Componentes', route: '/dashboard-components' },
        { label: 'Dashboard Prime', route: '/dashboard/panel' },
        { label: 'Panel Taiga', route: '/dashboard-taiga' }
      ]
    },
    {
      title: 'Gestión municipal',
      items: [
        { label: 'Operaciones', route: '/dashboard/operaciones' },
        { label: 'Notificaciones', route: '/dashboard/notificaciones' },
        { label: 'Archivos', route: '/dashboard/archivos' }
      ]
    },
    {
      title: 'Soporte',
      items: [
        { label: 'Cuenta contribuyente', route: '/dashboard/cuenta' },
        { label: 'Mesa de ayuda', route: '/dashboard/notificaciones' }
      ]
    }
  ];

  get userName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Usuario contribuyente';
    }

    return [user.nombre, user.apellidos]
      .filter(Boolean)
      .join(' ')
      .trim() || user.email || 'Usuario contribuyente';
  }

  get userEmail(): string {
    return this.authService.getCurrentUser()?.email || 'usuario@siatec.gob';
  }

  get userInitials(): string {
    return this.userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join('') || 'SC';
  }

  goTo(route?: string): void {
    if (!route) {
      return;
    }

    this.router.navigateByUrl(route);
  }
}
