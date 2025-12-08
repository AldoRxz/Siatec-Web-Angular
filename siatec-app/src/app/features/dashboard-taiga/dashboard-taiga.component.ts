import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core/components/root';
import { TuiScrollbar } from '@taiga-ui/core/components/scrollbar';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiAppBar } from '@taiga-ui/layout/components/app-bar';
import { TuiCard } from '@taiga-ui/layout/components/card';
import { TuiBadge } from '@taiga-ui/kit/components/badge';
import { TuiAvatar } from '@taiga-ui/kit/components/avatar';
import { AuthService } from '../../core/services';
import { DashboardNotificationsService } from '../dashboard/services/dashboard-notifications.service';

interface TaigaSummaryCard {
  title: string;
  value: string;
  detail: string;
  badge: string;
  appearance: string;
  trend: string;
  progress: number;
  route: string;
}

interface TaigaTask {
  title: string;
  detail: string;
  status: string;
  progress: number;
}

interface TaigaDocument {
  title: string;
  detail: string;
  updated: string;
  status: string;
  accent: string;
}

interface TaigaTimelineItem {
  title: string;
  date: string;
  state: string;
  appearance: string;
}

interface TaigaInsightTile {
  label: string;
  title: string;
  helper: string;
  tone: 'soft' | 'deep';
  route: string;
}

interface SidebarSection {
  title: string;
  links: Array<{ label: string; route: string; badge?: string }>;
}

@Component({
  selector: 'app-dashboard-taiga',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TuiRoot,
    TuiScrollbar,
    ...TuiAppBar,
    ...TuiCard,
    TuiButton,
    TuiBadge,
    TuiAvatar
  ],
  templateUrl: './dashboard-taiga.component.html',
  styleUrl: './dashboard-taiga.component.scss'
})
export class DashboardTaigaComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(DashboardNotificationsService);

  readonly unreadNotifications = this.notifications.unreadCount;

  readonly summaryCards: TaigaSummaryCard[] = [
    {
      title: 'Contribuciones activas',
      value: '03',
      detail: 'Tesorería municipal',
      badge: '+1 esta semana',
      appearance: 'primary',
      trend: 'Crecimiento 64%',
      progress: 64,
      route: '/dashboard/operaciones'
    },
    {
      title: 'Documentos validados',
      value: '12',
      detail: 'Repositorio digital',
      badge: 'Automatizado',
      appearance: 'success',
      trend: 'Workflow 82%',
      progress: 82,
      route: '/dashboard/archivos'
    },
    {
      title: 'Citas confirmadas',
      value: '02',
      detail: 'Módulo presencial',
      badge: 'Próximas 48h',
      appearance: 'warning',
      trend: 'Agenda 54%',
      progress: 54,
      route: '/dashboard/operaciones'
    },
    {
      title: 'Alertas críticas',
      value: '01',
      detail: 'Revisión inmediata',
      badge: 'Prioridad alta',
      appearance: 'danger',
      trend: 'Atención 90%',
      progress: 90,
      route: '/dashboard/notificaciones'
    }
  ];

  readonly taskBoard: TaigaTask[] = [
    {
      title: 'Enviar comprobantes PACCIOLI',
      detail: 'Adjunta pólizas y conciliaciones en formato XML o PDF.',
      status: 'Pendiente',
      progress: 35
    },
    {
      title: 'Actualizar representantes',
      detail: 'Confirma poderes notariales y datos de contacto.',
      status: 'En curso',
      progress: 60
    },
    {
      title: 'Agendar acompañamiento',
      detail: 'Selecciona un asesor y define la ventana presencial.',
      status: 'Planificado',
      progress: 80
    }
  ];

  readonly documentCenter: TaigaDocument[] = [
    {
      title: 'Identificación representante legal',
      detail: 'Documento coincidente con los lineamientos vigentes.',
      updated: '08 julio · 09:41 h',
      status: 'Validado',
      accent: 'success'
    },
    {
      title: 'Contrato social digital',
      detail: 'Pendiente de firma electrónica del notario.',
      updated: '13 julio · 17:20 h',
      status: 'Por firmar',
      accent: 'warning'
    },
    {
      title: 'Comprobante de domicilio',
      detail: 'Se requiere recibo emitido durante los últimos 90 días.',
      updated: 'Hoy · 08:10 h',
      status: 'Actualizar',
      accent: 'danger'
    }
  ];

  readonly timeline: TaigaTimelineItem[] = [
    {
      title: 'Captura de datos fiscales',
      date: 'Finalizado · 22 junio',
      state: 'Completado',
      appearance: 'success'
    },
    {
      title: 'Validación documental',
      date: 'En curso · 45%',
      state: 'Revisión',
      appearance: 'warning'
    },
    {
      title: 'Resolución Tesorería',
      date: 'Estimado · 18 julio',
      state: 'Pendiente',
      appearance: 'secondary'
    }
  ];

  readonly insightTiles: TaigaInsightTile[] = [
    {
      label: 'Actividad reciente',
      title: 'Estatus sincronizados',
      helper: 'Actualizado hoy · 09:12 h',
      tone: 'soft',
      route: '/dashboard/notificaciones'
    },
    {
      label: 'Documentos críticos',
      title: 'Centro de archivos',
      helper: 'Último respaldo · 08 julio',
      tone: 'soft',
      route: '/dashboard/archivos'
    },
    {
      label: 'Solicitud de inscripción',
      title: 'Seguimiento por etapas',
      helper: '45% completado',
      tone: 'soft',
      route: '/dashboard/inscripcion'
    },
    {
      label: 'Acompañamiento',
      title: 'Soporte prioritario',
      helper: 'Inicia la solicitud del Registro Estatal',
      tone: 'deep',
      route: '/dashboard/notificaciones'
    }
  ];

  readonly sidebarSections: SidebarSection[] = [
    {
      title: 'Panel Taiga',
      links: [
        { label: 'Inicio Taiga', route: '/dashboard-taiga', badge: 'Nuevo' },
        { label: 'Dashboard Prime', route: '/dashboard/panel' },
        { label: 'Panel Spartan', route: '/dashboard-spartan' }
      ]
    },
    {
      title: 'Gestión municipal',
      links: [
        { label: 'Operaciones', route: '/dashboard/operaciones' },
        { label: 'Notificaciones', route: '/dashboard/notificaciones', badge: 'Alertas' },
        { label: 'Archivos', route: '/dashboard/archivos' }
      ]
    },
    {
      title: 'Soporte',
      links: [
        { label: 'Cuenta contribuyente', route: '/dashboard/cuenta' },
        { label: 'Guía PACCIOLI', route: '/dashboard/archivos' }
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

  get userInitials(): string {
    const target = this.userName;
    const matches = target
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase());

    return matches.join('') || 'SC';
  }

  get userEmail(): string {
    return this.authService.getCurrentUser()?.email || 'usuario@siatec.gob';
  }

  goTo(route?: string): void {
    if (!route) {
      return;
    }

    this.router.navigateByUrl(route);
  }
}
