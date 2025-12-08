import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideArrowUpRight,
  lucideBell,
  lucideCalendarDays,
  lucideCheckCircle2,
  lucideClock8,
  lucideFileOutput,
  lucideFileText,
  lucideFolderOpen,
  lucideSend,
  lucideShieldCheck,
  lucideStar
} from '@ng-icons/lucide';
import {
  heroBellAlert,
  heroBuildingOffice2,
  heroCalendarDays,
  heroChartBarSquare,
  heroCheckBadge,
  heroDevicePhoneMobile,
  heroDocumentText,
  heroEnvelopeOpen,
  heroFolderOpen,
  heroGiftTop
} from '@ng-icons/heroicons/outline';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports, type BadgeVariants } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { AuthService } from '../../core/services';
import { DashboardNotificationsService } from '../dashboard/services/dashboard-notifications.service';

type BadgeVariant = BadgeVariants['variant'];

type StageStatus = 'complete' | 'in-progress' | 'pending';

type AlertTone = 'default' | 'destructive';

interface MetricTile {
  label: string;
  value: string;
  trend: string;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  action: string;
  route: string;
}

interface InscriptionStage {
  title: string;
  detail: string;
  progress: number;
  status: StageStatus;
}

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
  status: string;
  icon: string;
}

interface QuickAction {
  label: string;
  detail: string;
  route: string;
  icon: string;
}

interface DocumentSummary {
  title: string;
  detail: string;
  status: string;
  severity: 'ok' | 'warn';
  updated: string;
}

interface AlertEntry {
  title: string;
  detail: string;
  icon: string;
  variant: AlertTone;
}

interface SidebarLink {
  label: string;
  description?: string;
  icon: string;
  route: string;
  badge?: string;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

interface SidebarSupportCard {
  title: string;
  detail: string;
  action: string;
  route: string;
  icon: string;
}

interface HeaderHighlight {
  label: string;
  value: string;
  icon: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
}

interface FooterHighlight {
  label: string;
  value: string;
  icon: string;
  note?: string;
}

@Component({
  selector: 'app-dashboard-spartan',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ...HlmCardImports,
    ...HlmButtonImports,
    ...HlmBadgeImports,
    ...HlmAvatarImports,
    ...HlmSeparatorImports,
    ...HlmProgressImports,
    ...HlmAlertImports,
    ...HlmIconImports
  ],
  providers: [
    provideIcons({
      lucideAlertTriangle,
      lucideArrowUpRight,
      lucideBell,
      lucideCalendarDays,
      lucideCheckCircle2,
      lucideClock8,
      lucideFileOutput,
      lucideFileText,
      lucideFolderOpen,
      lucideSend,
      lucideShieldCheck,
      lucideStar,
      heroBellAlert,
      heroBuildingOffice2,
      heroCalendarDays,
      heroChartBarSquare,
      heroCheckBadge,
      heroDevicePhoneMobile,
      heroDocumentText,
      heroEnvelopeOpen,
      heroFolderOpen,
      heroGiftTop
    })
  ],
  templateUrl: './dashboard-spartan.component.html',
  styleUrl: './dashboard-spartan.component.scss'
})
export class DashboardSpartanComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(DashboardNotificationsService);

  readonly unreadNotifications = this.notificationsService.unreadCount;

  readonly sidebarSections: SidebarSection[] = [
    {
      title: 'Navegación principal',
      links: [
        {
          label: 'Panel Spartan',
          description: 'Resumen optimizado',
          icon: 'heroBuildingOffice2',
          route: '/dashboard-spartan',
          badge: 'Nuevo'
        },
        {
          label: 'Dashboard Prime',
          description: 'Vista histórica',
          icon: 'heroChartBarSquare',
          route: '/dashboard/panel'
        },
        {
          label: 'Operaciones',
          description: 'Pagos y citas',
          icon: 'heroDocumentText',
          route: '/dashboard/operaciones'
        }
      ]
    },
    {
      title: 'Gestión documental',
      links: [
        {
          label: 'Repositorio',
          description: 'Archivos y evidencias',
          icon: 'heroFolderOpen',
          route: '/dashboard/archivos'
        },
        {
          label: 'Alertas',
          description: 'Avisos prioritarios',
          icon: 'heroBellAlert',
          route: '/dashboard/notificaciones',
          badge: 'Prioridad'
        }
      ]
    },
    {
      title: 'Soporte y cuenta',
      links: [
        {
          label: 'Cuenta contribuyente',
          description: 'Representantes y contacto',
          icon: 'heroCheckBadge',
          route: '/dashboard/cuenta'
        },
        {
          label: 'Guía PACCIOLI',
          description: 'Integración contable',
          icon: 'heroGiftTop',
          route: '/dashboard/panel'
        }
      ]
    }
  ];

  readonly sidebarSupport: SidebarSupportCard = {
    title: 'Expediente express',
    detail: 'Adjunta plantillas validadas y obtén una revisión previa en minutos.',
    action: 'Subir documentos',
    route: '/dashboard/archivos',
    icon: 'heroGiftTop'
  };

  readonly headerHighlights: HeaderHighlight[] = [
    {
      label: 'Última conexión',
      value: 'Hoy · 09:18 hrs',
      icon: 'heroBellAlert',
      badge: 'Seguro',
      badgeVariant: 'secondary'
    },
    {
      label: 'Estado fiscal',
      value: 'Sin adeudos',
      icon: 'heroCheckBadge',
      badge: 'Verificado',
      badgeVariant: 'default'
    },
    {
      label: 'Ventana de soporte',
      value: 'Activa 24/7',
      icon: 'heroGiftTop',
      badge: 'Prioritario',
      badgeVariant: 'outline'
    }
  ];

  readonly footerHighlights: FooterHighlight[] = [
    {
      label: 'Mesa de ayuda',
      value: '800 835 SIATEC',
      icon: 'heroDevicePhoneMobile',
      note: 'Tiempo estimado < 2 min'
    },
    {
      label: 'Agenda presencial',
      value: 'L-V · 09:00 - 18:00 h',
      icon: 'heroCalendarDays',
      note: 'Módulo Tesorería Centro'
    },
    {
      label: 'Correo seguro',
      value: 'soporte@siatec.gob',
      icon: 'heroEnvelopeOpen',
      note: 'Respuesta promedio 4 h'
    }
  ];

  readonly metricTiles: MetricTile[] = [
    {
      label: 'Contribuciones activas',
      value: '3 pendientes',
      trend: 'Última actualización · hace 2 h',
      badgeLabel: 'Prioridad media',
      badgeVariant: 'outline',
      action: 'Revisar operaciones',
      route: '/dashboard/operaciones'
    },
    {
      label: 'Archivos cargados',
      value: '12 documentos',
      trend: '+4 esta semana',
      badgeLabel: 'Digitalizados',
      badgeVariant: 'secondary',
      action: 'Ver repositorio',
      route: '/dashboard/archivos'
    },
    {
      label: 'Citas programadas',
      value: '2 proximas',
      trend: 'Tesorería Centro · 22 julio',
      badgeLabel: 'Confirmadas',
      badgeVariant: 'default',
      action: 'Gestionar agenda',
      route: '/dashboard/operaciones'
    },
    {
      label: 'Alertas críticas',
      value: '01 prioridad',
      trend: 'Verifica correo alterno',
      badgeLabel: 'Atención',
      badgeVariant: 'destructive',
      action: 'Abrir notificaciones',
      route: '/dashboard/notificaciones'
    }
  ];

  readonly inscriptionStages: InscriptionStage[] = [
    {
      title: 'Captura de datos fiscales',
      detail: 'RFC y domicilio verificados',
      progress: 100,
      status: 'complete'
    },
    {
      title: 'Carga de documentación',
      detail: 'Contrato social y poderes notariales',
      progress: 70,
      status: 'in-progress'
    },
    {
      title: 'Autorización Tesorería',
      detail: 'Revisión documental en curso',
      progress: 35,
      status: 'pending'
    }
  ];

  readonly activityLog: ActivityItem[] = [
    {
      title: 'Determinación enviada',
      detail: 'Impuesto sobre nómina · folio 12034',
      time: 'Hace 12 min',
      status: 'Registrado',
      icon: 'lucideFileText'
    },
    {
      title: 'Archivo validado',
      detail: 'comprobante_gastos.pdf',
      time: 'Ayer · 18:20',
      status: 'Aceptado',
      icon: 'lucideCheckCircle2'
    },
    {
      title: 'Recordatorio de cita',
      detail: 'Atención presencial · Tesorería Centro',
      time: 'Hace 2 días',
      status: 'En curso',
      icon: 'lucideCalendarDays'
    }
  ];

  readonly quickActions: QuickAction[] = [
    {
      label: 'Enviar comprobantes',
      detail: 'Carga múltiples archivos en un solo paso',
      route: '/dashboard/archivos',
      icon: 'lucideSend'
    },
    {
      label: 'Agendar atención',
      detail: 'Selecciona módulo y confirma horario',
      route: '/dashboard/operaciones',
      icon: 'lucideCalendarDays'
    },
    {
      label: 'Actualizar contribuyente',
      detail: 'Modifica representantes o contactos',
      route: '/dashboard/cuenta',
      icon: 'lucideShieldCheck'
    }
  ];

  readonly documents: DocumentSummary[] = [
    {
      title: 'Identificación representante',
      detail: 'Archivo coincide con los lineamientos vigentes.',
      status: 'Validado',
      severity: 'ok',
      updated: '12 mayo · 09:41'
    },
    {
      title: 'Contrato social (PDF)',
      detail: 'Pendiente de firma digital del notario.',
      status: 'Por firmar',
      severity: 'warn',
      updated: '16 mayo · 11:05'
    },
    {
      title: 'Comprobante domicilio',
      detail: 'Se requiere comprobante emitido durante los últimos 3 meses.',
      status: 'Actualizar',
      severity: 'warn',
      updated: 'Actualmente'
    }
  ];

  readonly alertFeed: AlertEntry[] = [
    {
      title: 'Confirma tu correo alterno',
      detail: 'Necesitamos confirmar el buzón seguro para enviarte resoluciones automáticas.',
      icon: 'lucideAlertTriangle',
      variant: 'destructive'
    },
    {
      title: 'Ventana de mantenimiento',
      detail: 'El portal se actualizará el domingo de 22:00 a 23:00 hrs.',
      icon: 'lucideClock8',
      variant: 'default'
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
    const target = this.userName;
    const matches = target
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase());

    return matches.join('') || 'SC';
  }

  get inscriptionCompletion(): number {
    if (!this.inscriptionStages.length) {
      return 0;
    }

    const total = this.inscriptionStages.reduce((acc, stage) => acc + stage.progress, 0);
    return Math.round(total / this.inscriptionStages.length);
  }

  goTo(route?: string): void {
    if (!route) {
      return;
    }

    this.router.navigateByUrl(route);
  }
}
