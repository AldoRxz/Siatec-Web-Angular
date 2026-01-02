import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DashboardNotificationsService, DashboardNotification } from '../services/dashboard-notifications.service';

@Component({
  selector: 'app-dashboard-notificaciones',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent implements OnInit {
  private readonly notificationsService = inject(DashboardNotificationsService);
  readonly notifications = this.notificationsService.notifications;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly hasNotifications = computed(() => this.notifications().length > 0);

  ngOnInit(): void {
    this.notificationsService.markAllAsRead();
  }

  marcarLeidas(): void {
    this.notificationsService.markAllAsRead();
  }

  trackById(_: number, item: DashboardNotification): number {
    return item.id;
  }

  severityFor(message: string): 'success' | 'info' | 'warn' | 'secondary' {
    const normalized = message.toLowerCase();
    if (normalized.includes('autoriz') || normalized.includes('aprob') || normalized.includes('éxito') || normalized.includes('complet')) {
      return 'success';
    }
    if (normalized.includes('observ') || normalized.includes('error') || normalized.includes('eliminaste') || normalized.includes('rechaz')) {
      return 'warn';
    }
    return 'info';
  }

  iconFor(message: string): string {
    const severity = this.severityFor(message);
    const normalized = message.toLowerCase();
    
    if (normalized.includes('cita')) return 'pi-calendar';
    if (normalized.includes('archivo') || normalized.includes('documento')) return 'pi-folder';
    if (normalized.includes('operación') || normalized.includes('pago')) return 'pi-credit-card';
    if (normalized.includes('mensaje') || normalized.includes('correo')) return 'pi-envelope';
    
    switch (severity) {
      case 'success': return 'pi-check-circle';
      case 'warn': return 'pi-exclamation-triangle';
      default: return 'pi-info-circle';
    }
  }

  labelFor(message: string): string {
    const severity = this.severityFor(message);
    switch (severity) {
      case 'success': return 'Éxito';
      case 'warn': return 'Aviso';
      default: return 'Info';
    }
  }
}
