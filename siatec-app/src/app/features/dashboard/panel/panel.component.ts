import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService, ContribuyentesService } from '../../../core/services';
import { DashboardNotificationsService } from '../services/dashboard-notifications.service';
import { take } from 'rxjs/operators';

interface PanelCard {
  key: 'cuenta' | 'citas' | 'operaciones' | 'archivos';
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
  private readonly contribuyentesService = inject(ContribuyentesService);
  private readonly notificationsService = inject(DashboardNotificationsService);

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
      route: '/dashboard/operaciones',
      accent: 'purple'
    },
    {
      key: 'operaciones',
      icon: 'pi pi-file-edit',
      title: 'Determinaciones',
      value: '3 pendientes',
      action: 'Revisar',
      route: '/dashboard/operaciones',
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
      route: '/dashboard/operaciones'
    }
  ];

  readonly inscripcionState = signal<InscripcionState | null>(null);
  readonly notificationsCount = this.notificationsService.unreadCount;

  readonly documentSummary = signal<{ total: number; updatedAt?: Date }>({ total: 0 });

  ngOnInit(): void {
    this.loadDocumentCount();
    this.loadInscripcionState();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Usuario Contribuyente';
    }
    return [user.nombre, user.apellidos].filter(Boolean).join(' ').trim() || user.email || 'Usuario Contribuyente';
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

  private loadDocumentCount(): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      return;
    }

    this.contribuyentesService
      .getArchivosContribuyente(contribuyenteId, 1, 1)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const total = response?.totalItems ?? response?.items?.length ?? 0;
          this.documentSummary.set({ total, updatedAt: new Date() });
          this.updateCardValue('archivos', `${total} asignados`);
        },
        error: () => {
          this.documentSummary.set({ total: 0 });
          this.updateCardValue('archivos', '0 asignados');
        }
      });
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
}
