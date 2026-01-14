import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);
  
  readonly dashboardData = signal<ContribuyenteDashboard | null>(null);
  readonly loadingDashboard = signal<boolean>(true);
  readonly cards = signal<PanelCard[]>([
    {
      key: 'cuenta',
      icon: 'pi pi-user',
      title: 'Cuenta',
      value: 'Usuario inactivo',
      action: 'Ver perfil',
      route: '/contribuyentes/dashboard/cuenta',
      accent: 'blue'
    },
    {
      key: 'citas',
      icon: 'pi pi-calendar',
      title: 'Citas',
      value: 'Sin citas',
      action: 'Agendar',
      route: '/contribuyentes/dashboard/citas',
      accent: 'purple'
    },
    {
      key: 'contribuciones',
      icon: 'pi pi-file-edit',
      title: 'Determinaciones',
      value: 'Sin determinaciones',
      action: 'Revisar',
      route: '/contribuyentes/dashboard/contribuciones',
      accent: 'emerald'
    },
    {
      key: 'archivos',
      icon: 'pi pi-folder-open',
      title: 'Archivos',
      value: 'Sin archivos',
      action: 'Gestionar',
      route: '/contribuyentes/dashboard/archivos',
      accent: 'amber'
    }
  ]);

  readonly activity: ActivityItem[] = [];

  readonly quickActions = [
    {
      label: 'Iniciar inscripción',
      description: 'Completa tu registro estatal',
      icon: 'pi pi-shield',
      route: '/contribuyentes/dashboard/inscripcion'
    },
    {
      label: 'Subir documentos',
      description: 'Entrega comprobantes y anexos',
      icon: 'pi pi-upload',
      route: '/contribuyentes/dashboard/archivos'
    },
    {
      label: 'Explorar contribuciones',
      description: 'Calcula determinaciones',
      icon: 'pi pi-calculator',
      route: '/contribuyentes/dashboard/contribuciones'
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

  ngOnInit(): void {
    // this.documentsService.load(); // Se actualiza desde el dashboard
    this.loadInscripcionState();
    
    // Intentar cargar inmediatamente
    this.loadDashboardData();

    // Escuchar cambios de navegación para recargar datos
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter(event => event.urlAfterRedirects.includes('/contribuyentes/dashboard/panel')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        console.log('[Panel] Navegación detectada, recargando dashboard...');
        this.loadDashboardData();
      });
    
    // Reintentar carga si no hay contribuyenteId inicialmente (por ejemplo, después de login)
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      console.log('[Panel] No hay contribuyenteId inicialmente, reintentando en 500ms...');
      setTimeout(() => {
        const retryId = this.authService.getContribuyenteId();
        if (retryId) {
          console.log('[Panel] Contribuyente ID encontrado en reintento, cargando dashboard...');
          this.loadDashboardData();
        }
      }, 500);
    }
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
        // Actualizar el contador de notificaciones desde el backend
        this.notificationsService.updateUnreadCountFromBackend(data.cantidadNotificaciones);
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
