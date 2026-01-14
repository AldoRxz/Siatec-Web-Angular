import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuItem } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, ContribuyentesService } from '../../core/services';
import { DashboardNotificationsService } from './services/dashboard-notifications.service';
import { PortalHeaderComponent, SidebarNavComponent, MetricCardComponent } from '../../shared';
import { SiatecBotService, SiatecBotModalComponent } from '../siatec-bot';

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
    SkeletonModule,
    PortalHeaderComponent,
    SidebarNavComponent,
    MetricCardComponent,
    SiatecBotModalComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private contribuyentesService = inject(ContribuyentesService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private notificationsService = inject(DashboardNotificationsService);
  private siatecBotService = inject(SiatecBotService);
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
  readonly isDashboardLoading = signal(true);
  readonly metricSkeletonPlaceholders = Array.from({ length: 4 });

  constructor() {
    this.loadNavItems();
    this.loadInscriptionState();
  }

  ngOnInit(): void {
    // Cargar datos del dashboard cada vez que se entra al componente
    this.fetchDocumentSummary();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Usuario Contribuyente';
    }

    // Intentar diferentes fuentes de nombre completo
    if (user.nombreCompleto?.trim()) {
      return user.nombreCompleto.trim();
    }

    // Construir desde propiedades individuales
    const nombres = user.nombres || '';
    const primerApellido = user.primerApellido || '';
    const segundoApellido = user.segundoApellido || '';
    
    const constructed = [nombres, primerApellido, segundoApellido]
      .filter(Boolean)
      .join(' ')
      .trim();
    
    if (constructed) {
      return constructed;
    }

    // Intentar construir desde propiedades individuales
    const fromProps = [user.nombre, user.apellidos]
      .filter(Boolean)
      .join(' ')
      .trim();
    
    if (fromProps) {
      return fromProps;
    }

    // Usar email como último recurso
    return user.email?.split('@')[0] || 'Usuario Contribuyente';
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

  handleSiatecBotClick(): void {
    this.siatecBotService.toggleChat();
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
    this.setDashboardLoading(true);
    const userId = this.authService.getUserId();
    if (!userId) {
      console.warn('[Dashboard] No se pudo obtener el ID del usuario');
      this.setDashboardLoading(false);
      return;
    }

    // Usar el endpoint de dashboard para obtener todas las estadísticas
    this.contribuyentesService
      .getDashboard(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard) => {
          // Actualizar métrica de Cuenta (estado activo/inactivo)
          this.metricCards[0].value = dashboard.activo ? 'Usuario activo' : 'Usuario inactivo';
          this.metricCards[0].severity = dashboard.activo ? 'info' : 'warn';
          
          // Actualizar métrica de Citas
          const citasText = dashboard.cantidadCitas === 1 ? 'próxima' : 'próximas';
          this.metricCards[1].value = `${dashboard.cantidadCitas} ${citasText}`;
          this.metricCards[1].hint = dashboard.cantidadCitas > 0 ? 'Agenda confirmada' : 'Agenda abierta';
          
          // Actualizar métrica de Determinaciones
          const determinacionesText = dashboard.cantidadDeterminaciones === 1 ? 'pendiente' : 'pendientes';
          this.metricCards[2].value = `${dashboard.cantidadDeterminaciones} ${determinacionesText}`;
          this.metricCards[2].severity = dashboard.cantidadDeterminaciones > 0 ? 'warn' : 'success';
          
          // Actualizar métrica de Archivos
          const archivosText = dashboard.cantidadArchivos === 1 ? 'documento' : 'documentos';
          this.metricCards[3].value = `${dashboard.cantidadArchivos} ${archivosText}`;
          
          // Actualizar resumen de documentos
          this.documentSummary.set({ 
            total: dashboard.cantidadArchivos, 
            lastUpdated: new Date() 
          });
          
          // Si hay solicitud de inscripción, actualizar estado
          if (dashboard.ultimaSolicitud) {
            this.updateInscriptionStateFromDashboard(dashboard.ultimaSolicitud);
          }
          
          this.setDashboardLoading(false);
        },
        error: (error) => {
          console.error('[Dashboard] Error al cargar dashboard:', error);
          // Mantener valores por defecto en caso de error
          this.documentSummary.set({ total: 0 });
          this.metricCards[3].value = '0 documentos';
          this.setDashboardLoading(false);
        }
      });
  }

  private setDashboardLoading(state: boolean): void {
    this.isDashboardLoading.set(state);
  }

  /**
   * Actualiza el estado de inscripción desde el dashboard del backend
   */
  private updateInscriptionStateFromDashboard(solicitud: any): void {
    const newState: InscriptionState = {
      id: solicitud.id,
      status: solicitud.estado,
      timestamp: solicitud.fechaSolicitud
    };
    
    // Actualizar localStorage si hay cambios
    try {
      const currentState = localStorage.getItem('inscripcionProcesando');
      if (!currentState || JSON.stringify(newState) !== currentState) {
        localStorage.setItem('inscripcionProcesando', JSON.stringify(newState));
        this.inscriptionState = newState;
      }
    } catch (error) {
      console.warn('[Dashboard] No se pudo guardar estado de inscripción:', error);
    }
  }
}
