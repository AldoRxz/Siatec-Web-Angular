import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services';
import { DashboardNotificationsService } from '../services/dashboard-notifications.service';
import { DashboardDocumentsService } from '../services/dashboard-documents.service';
import { DashboardService, ContribuyenteDashboard } from '../services/dashboard.service';

interface PanelCard {
  key: 'cuenta' | 'citas' | 'contribuciones' | 'archivos';
  icon: string;
  title: string;
  value: string;
  action: string;
  route: string;
  accent: 'blue' | 'purple' | 'emerald' | 'amber';
  helper?: string;
}

interface ActivityItem {
  icon: string;
  title: string;
  detail: string;
  accent: 'emerald' | 'blue' | 'purple' | 'amber';
}

interface InscripcionState {
  id?: number | string;
  status?: string;
  rfc?: string;
  timestamp?: string;
  payload?: any;
}

@Component({
  selector: 'app-dashboard-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss'
})
export class PanelComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(DashboardNotificationsService);
  private readonly documentsService = inject(DashboardDocumentsService);
  private readonly dashboardService = inject(DashboardService);
  
  readonly dashboardData = signal<ContribuyenteDashboard | null>(null);
  readonly loadingDashboard = signal<boolean>(true);
  readonly cards = signal<PanelCard[]>([
    {
      key: 'cuenta',
      icon: 'pi pi-user',
      title: 'Cuenta',
      value: 'Usuario activo',
      action: 'Ver perfil',
      route: '/dashboard/cuenta',
      accent: 'blue'
    },
    {
      key: 'citas',
      icon: 'pi pi-calendar',
      title: 'Citas',
      value: '2 próximas',
      action: 'Agendar',
      route: '/dashboard/citas',
      accent: 'purple'
    },
    {
      key: 'contribuciones',
      icon: 'pi pi-file-edit',
      title: 'Determinaciones',
      value: '3 pendientes',
      action: 'Revisar',
      route: '/dashboard/contribuciones',
      accent: 'emerald'
    },
    {
      key: 'archivos',
      icon: 'pi pi-folder-open',
      title: 'Archivos',
      value: '0 asignados',
      action: 'Gestionar',
      route: '/dashboard/archivos',
      accent: 'amber'
    }
  ]);

  readonly activity: ActivityItem[] = [
    {
      icon: 'pi pi-file-pdf',
      title: 'Archivo subido',
      detail: 'declaracion_anual.pdf',
      accent: 'emerald'
    },
    {
      icon: 'pi pi-check-circle',
      title: 'Determinación completada',
      detail: 'Impuesto sobre nómina',
      accent: 'blue'
    },
    {
      icon: 'pi pi-calendar-plus',
      title: 'Cita confirmada',
      detail: '22 de julio · Módulo Centro',
      accent: 'purple'
    }
  ];

  readonly quickActions = [
    {
      label: 'Iniciar inscripción',
      description: 'Completa tu registro estatal',
      icon: 'pi pi-shield',
      route: '/dashboard/inscripcion'
    },
    {
      label: 'Subir documentos',
      description: 'Entrega comprobantes y anexos',
      icon: 'pi pi-upload',
      route: '/dashboard/archivos'
    },
    {
      label: 'Explorar contribuciones',
      description: 'Calcula determinaciones',
      icon: 'pi pi-calculator',
      route: '/dashboard/contribuciones'
    }
  ];

  readonly inscripcionState = signal<InscripcionState | null>(null);
  readonly notificationsCount = this.notificationsService.unreadCount;
  readonly documentSummary = this.documentsService.summary;

  // Computed para determinar si se debe mostrar la opción de inscripción
  readonly shouldShowInscripcion = computed(() => {
    const data = this.dashboardData();
    if (!data) return true; // Mostrar por defecto mientras carga
    
    // No mostrar si el contribuyente ya está activo
    if (data.activo) return false;
    
    // No mostrar si hay una solicitud en estado "Pendiente" o "Enviada"
    const ultimaSolicitud = data.ultimaSolicitud;
    if (ultimaSolicitud) {
      const estado = ultimaSolicitud.estado?.toLowerCase() || '';
      if (estado === 'pendiente' || estado === 'enviada' || estado === 'procesando') {
        return false;
      }
    }
    
    return true;
  });

  private readonly documentCardEffect = computed(() => {
    const summary = this.documentSummary();
    this.updateCardValue('archivos', `${summary.total} asignados`);
    return summary.total;
  });

  ngOnInit(): void {
    this.documentsService.load();
    this.loadInscripcionState();
    this.loadDashboardData();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Usuario Contribuyente';
    }

    // Intentar diferentes fuentes de nombre completo
    const fullName = user.nombreCompleto || user.fullName;
    if (fullName?.trim()) {
      return fullName.trim();
    }

    // Intentar construir desde identityInfo
    const identityInfo = user.identityInfo as any;
    if (identityInfo) {
      const nombres = identityInfo.nombres || identityInfo.Nombres || '';
      const primerApellido = identityInfo.primerApellido || identityInfo.PrimerApellido || '';
      const segundoApellido = identityInfo.segundoApellido || identityInfo.SegundoApellido || '';
      
      const constructed = [nombres, primerApellido, segundoApellido]
        .filter(Boolean)
        .join(' ')
        .trim();
      
      if (constructed) {
        return constructed;
      }
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

  navigate(route: string): void {
    this.router.navigateByUrl(route);
  }

  refreshInscripcionState(): void {
    this.loadInscripcionState();
  }

  clearInscripcionState(): void {
    try {
      localStorage.removeItem('inscripcionProcesando');
    } catch (error) {
      console.warn('[Panel] No se pudo limpiar el estado de inscripción', error);
    }
    this.inscripcionState.set(null);
  }

  getInscripcionSeverity(): 'success' | 'info' | 'warn' | 'danger' {
    const status = this.inscripcionState()?.status?.toLowerCase() || '';
    if (!status) {
      return 'info';
    }
    if (status.includes('aprob')) {
      return 'success';
    }
    if (status.includes('rech')) {
      return 'danger';
    }
    return 'warn';
  }

  private updateCardValue(key: PanelCard['key'], value: string): void {
    this.cards.update((items) => items.map((item) => (item.key === key ? { ...item, value } : item)));
  }

  private loadInscripcionState(): void {
    try {
      const stored = localStorage.getItem('inscripcionProcesando');
      if (stored) {
        this.inscripcionState.set(JSON.parse(stored));
        return;
      }
    } catch (error) {
      console.warn('[Panel] No se pudo leer el estado de inscripción', error);
    }
    this.inscripcionState.set(null);
  }

  getPersonaResumen(): string {
    const payload = this.inscripcionState()?.payload;
    if (!payload) {
      return 'Solicitud en revisión por Tesorería.';
    }
    if (payload?.razonSocial) {
      return payload.razonSocial;
    }
    const parts = [payload?.nombres, payload?.primerApellido, payload?.segundoApellido]
      .filter(Boolean)
      .join(' ');
    return parts || 'Solicitud registrada';
  }

  getResumenDetalle(): string {
    const payload = this.inscripcionState()?.payload;
    if (!payload) {
      return 'Registros en validación.';
    }
    const regimenes = Array.isArray(payload?.regimenes) ? payload.regimenes.length : 0;
    const impuestos = Array.isArray(payload?.impuestos) ? payload.impuestos.length : 0;
    return `${regimenes} régimen(es) · ${impuestos} impuesto(s)`;
  }

  private loadDashboardData(): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    
    if (!contribuyenteId) {
      console.warn('[Panel] No se pudo obtener el ID del contribuyente');
      this.loadingDashboard.set(false);
      return;
    }

    this.loadingDashboard.set(true);
    
    this.dashboardService.getDashboard(contribuyenteId).subscribe({
      next: (data) => {
        console.log('[Panel] Dashboard data loaded:', data);
        this.dashboardData.set(data);
        this.updateCardsWithDashboardData(data);
        this.loadingDashboard.set(false);
      },
      error: (error) => {
        console.error('[Panel] Error loading dashboard data:', error);
        this.loadingDashboard.set(false);
      }
    });
  }

  private updateCardsWithDashboardData(data: ContribuyenteDashboard): void {
    // Actualizar tarjeta de cuenta
    const cuentaValue = data.activo ? 'Usuario activo' : 'Usuario inactivo';
    this.updateCardValue('cuenta', cuentaValue);

    // Actualizar tarjeta de citas
    const citasValue = data.cantidadCitas === 0 
      ? 'Sin citas' 
      : `${data.cantidadCitas} ${data.cantidadCitas === 1 ? 'próxima' : 'próximas'}`;
    this.updateCardValue('citas', citasValue);

    // Actualizar tarjeta de determinaciones
    const determinacionesValue = data.cantidadDeterminaciones === 0
      ? 'Sin determinaciones'
      : `${data.cantidadDeterminaciones} ${data.cantidadDeterminaciones === 1 ? 'pendiente' : 'pendientes'}`;
    this.updateCardValue('contribuciones', determinacionesValue);

    // Actualizar tarjeta de archivos
    const archivosValue = `${data.cantidadArchivos} ${data.cantidadArchivos === 1 ? 'asignado' : 'asignados'}`;
    this.updateCardValue('archivos', archivosValue);
  }

}
