import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { MenuItem } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, ContribuyentesService } from '../../core/services';
import { DashboardNotificationsService } from './services/dashboard-notifications.service';
import { PortalHeaderComponent, SidebarNavComponent, MetricCardComponent } from '../../shared';

interface MetricCard {
  label: string;
  value: string;
  description: string;
  icon: string;
  severity: 'primary' | 'success' | 'warn' | 'info';
  actionLabel: string;
  anchor: string;
  hint?: string;
  route?: string;
}

interface QuickAction {
  label: string;
  icon: string;
  description: string;
  route?: string;
  anchor?: string;
}

interface ActivityItem {
  icon: string;
  label: string;
  detail: string;
  timestamp: string;
  severity: 'success' | 'info' | 'warn';
}

interface TimelineItem {
  status: string;
  detail: string;
  date: string;
  severity: 'success' | 'info' | 'warn';
}

interface AlertItem {
  title: string;
  detail: string;
  severity: 'info' | 'warn' | 'success' | 'danger' | 'secondary' | 'contrast';
  tag?: string;
}

interface InscriptionState {
  id?: number | string;
  status?: string;
  rfc?: string;
  timestamp?: string;
  payload?: any;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DividerModule,
    TagModule,
    TimelineModule,
    PortalHeaderComponent,
    SidebarNavComponent,
    MetricCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private contribuyentesService = inject(ContribuyentesService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private notificationsService = inject(DashboardNotificationsService);
  private readonly anchorRouteMap: Record<string, string> = {
    profilePanel: '/dashboard/cuenta',
    activityPanel: '/dashboard/archivos',
    alertsPanel: '/dashboard/notificaciones',
    actionsPanel: '/dashboard/operaciones'
  };

  readonly documentSummary = signal<{ total: number; lastUpdated?: Date }>({ total: 0 });

  readonly metricCards: MetricCard[] = [
    {
      label: 'Cuenta',
      value: 'Usuario activo',
      description: 'Completa tu perfil y verifica identidad',
      icon: 'pi pi-id-card',
      severity: 'info',
      actionLabel: 'Ver perfil',
      anchor: 'profilePanel',
      route: '/dashboard/cuenta'
    },
    {
      label: 'Citas',
      value: '2 próximas',
      description: 'Administra tus atenciones presenciales',
      icon: 'pi pi-calendar',
      severity: 'primary',
      actionLabel: 'Agendar',
      anchor: 'actionsPanel',
      route: '/dashboard/operaciones',
      hint: 'Agenda abierta'
    },
    {
      label: 'Contribuciones',
      value: '3 pendientes',
      description: 'Determina y paga tus obligaciones',
      icon: 'pi pi-file-edit',
      severity: 'warn',
      actionLabel: 'Revisar',
      anchor: 'tasksPanel'
    },
    {
      label: 'Archivos',
      value: '0 documentos',
      description: 'Sube requisitos y comprobantes',
      icon: 'pi pi-folder',
      severity: 'success',
      actionLabel: 'Ver archivos',
      anchor: 'activityPanel',
      route: '/dashboard/archivos'
    }
  ];

  readonly recentActivity: ActivityItem[] = [
    {
      icon: 'pi pi-file-pdf',
      label: 'Archivo subido',
      detail: 'declaracion_anual.pdf',
      timestamp: 'Hace 10 minutos',
      severity: 'success'
    },
    {
      icon: 'pi pi-check-circle',
      label: 'Determinación completada',
      detail: 'Impuesto sobre nómina',
      timestamp: 'Ayer 17:34',
      severity: 'info'
    },
    {
      icon: 'pi pi-calendar',
      label: 'Cita confirmada',
      detail: '22 de julio · Módulo Centro',
      timestamp: 'Hace 2 días',
      severity: 'warn'
    }
  ];

  readonly timeline: TimelineItem[] = [
    {
      status: 'Solicitud enviada',
      detail: 'Inscripción al registro estatal recibida',
      date: '12 mayo · 09:41',
      severity: 'success'
    },
    {
      status: 'Documentos validados',
      detail: 'Tus archivos cumplen los requisitos',
      date: '16 mayo · 11:05',
      severity: 'info'
    },
    {
      status: 'Autorización pendiente',
      detail: 'Tesorería revisa tu información',
      date: 'Actualmente',
      severity: 'warn'
    }
  ];

  readonly quickActions: QuickAction[] = [
    {
      label: 'Agendar cita',
      icon: 'pi pi-calendar-plus',
      description: 'Coordina una visita presencial',
      route: '/dashboard/operaciones'
    },
    {
      label: 'Subir archivos',
      icon: 'pi pi-upload',
      description: 'Entrega comprobantes y anexos',
      route: '/dashboard/archivos'
    },
    {
      label: 'Generar determinación',
      icon: 'pi pi-calculator',
      description: 'Calcula contribuciones estatales',
      route: '/dashboard/operaciones'
    }
  ];

  readonly alerts: AlertItem[] = [
    {
      title: 'Ventana de mantenimiento',
      detail: 'Domingo 22:00 - 23:00 hrs. Tesorería notificará cualquier afectación.',
      severity: 'warn',
      tag: 'Sistema'
    },
    {
      title: 'Mensajería segura',
      detail: 'Confirma tu correo alterno para activar notificaciones críticas.',
      severity: 'info',
      tag: 'Recomendación'
    }
  ];

  navItems: MenuItem[] = [];
  inscriptionState: InscriptionState | null = null;
  readonly unreadNotifications = this.notificationsService.unreadCount;

  constructor() {
    this.loadNavItems();
    this.loadInscriptionState();
    this.fetchDocumentSummary();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Usuario Contribuyente';
    }

    return [user.nombre, user.apellidos]
      .filter(Boolean)
      .join(' ')
      .trim() || user.email || 'Usuario Contribuyente';
  }

  get userEmail(): string {
    return this.authService.getCurrentUser()?.email || 'usuario@siatec.gob';
  }

  onMetricAction(card: MetricCard): void {
    if (card.route) {
      this.router.navigateByUrl(card.route);
      return;
    }

    this.navigateToSection(card.anchor);
  }

  onQuickAction(route?: string, anchor?: string): void {
    if (route) {
      this.router.navigateByUrl(route);
      return;
    }

    if (anchor) {
      this.navigateToSection(anchor);
    }
  }

  onSidebarNavigate(command?: () => void): void {
    command?.();
  }

  handleLogout(): void {
    this.authService.logout();
  }

  handleProfile(): void {
    this.navigateToSection('profilePanel');
  }

  handleSettings(): void {
    this.router.navigate(['/dashboard/cuenta'], { queryParams: { tab: 'settings' } });
  }

  handleNotificationsClick(): void {
    this.router.navigateByUrl('/dashboard/notificaciones');
  }

  trackActivity(_: number, item: ActivityItem): string {
    return item.label + item.detail;
  }

  scrollTo(anchor: string): void {
    if (!anchor) {
      return;
    }

    const target = this.document?.getElementById(anchor);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  navigateToSection(anchor: string): void {
    if (!anchor) {
      return;
    }

    const targetRoute = this.anchorRouteMap[anchor];
    if (targetRoute) {
      this.router.navigateByUrl(targetRoute);
      return;
    }

    this.scrollTo(anchor);
  }

  private loadNavItems(): void {
    this.navItems = [
      {
        label: 'Principal',
        icon: 'pi pi-home',
        command: () => this.router.navigateByUrl('/dashboard')
      },
      {
        label: 'Cuenta',
        icon: 'pi pi-id-card',
        command: () => this.router.navigateByUrl('/dashboard/cuenta')
      },
      {
        label: 'Archivos',
        icon: 'pi pi-folder',
        command: () => this.router.navigateByUrl('/dashboard/archivos')
      },
      {
        label: 'Notificaciones',
        icon: 'pi pi-bell',
        command: () => this.router.navigateByUrl('/dashboard/notificaciones')
      },
      {
        label: 'Operaciones',
        icon: 'pi pi-briefcase',
        command: () => this.router.navigateByUrl('/dashboard/operaciones')
      },
      {
        label: 'Contribuciones',
        icon: 'pi pi-file-edit',
        command: () => this.scrollTo('tasksPanel')
      },
      {
        label: 'Inscripción',
        icon: 'pi pi-shield',
        command: () => this.scrollTo('inscriptionPanel')
      }
    ];
  }

  private loadInscriptionState(): void {
    try {
      const stored = localStorage.getItem('inscripcionProcesando');
      if (stored) {
        this.inscriptionState = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[Dashboard] No se pudo leer el estado de inscripción', error);
    }
  }

  private fetchDocumentSummary(): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      return;
    }

    this.contribuyentesService
      .getArchivosContribuyente(contribuyenteId, 1, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const total = response?.totalItems ?? response?.items?.length ?? 0;
          this.documentSummary.set({ total, lastUpdated: new Date() });
          this.metricCards[3].value = `${total} documentos`;
        },
        error: () => {
          this.documentSummary.set({ total: 0 });
          this.metricCards[3].value = '0 documentos';
        }
      });
  }
}
