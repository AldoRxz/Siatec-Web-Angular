import { Injectable, computed, signal } from '@angular/core';

export interface DashboardNotification {
  id: number;
  mensaje: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardNotificationsService {
  private readonly STORAGE_KEY = 'notificaciones_historial';
  private readonly READ_KEY = 'notificaciones_leidas';
  private readonly defaults: DashboardNotification[] = [
    { id: 1, mensaje: '🔔 Cita confirmada para mañana a las 10:00 AM.', fecha: '2025-07-16T08:30:00.000Z' },
    { id: 2, mensaje: '📁 Un archivo fue actualizado.', fecha: '2025-07-15T14:20:00.000Z' },
    { id: 3, mensaje: '✅ Tu operación #1245 fue aprobada.', fecha: '2025-07-14T10:00:00.000Z' }
  ];

  private notificationsSignal = signal<DashboardNotification[]>(this.restoreNotifications());
  private readIdsSignal = signal<number[]>(this.restoreReadIds());
  private unreadCountOverride = signal<number | null>(null);

  readonly notifications = computed(() => this.notificationsSignal().sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha)));
  readonly unreadCount = computed(() => {
    // Si hay un valor del backend, usarlo
    const override = this.unreadCountOverride();
    if (override !== null) {
      return override;
    }
    // Si no, calcular del localStorage
    return this.notifications().filter(n => !this.readIdsSignal().includes(n.id)).length;
  });

  getNotificationsSnapshot(): DashboardNotification[] {
    return this.notifications().map(item => ({ ...item }));
  }

  getUnreadCount(): number {
    return this.unreadCount();
  }

  markAllAsRead(): void {
    const allIds = this.notifications().map(n => n.id);
    this.readIdsSignal.set(allIds);
    this.persistReadIds(allIds);
  }

  markAsRead(id: number): void {
    const current = new Set(this.readIdsSignal());
    current.add(id);
    const updated = Array.from(current.values());
    this.readIdsSignal.set(updated);
    this.persistReadIds(updated);
  }

  addNotification(message: string): void {
    const nextId = this.generateNextId();
    const notification: DashboardNotification = {
      id: nextId,
      mensaje: message,
      fecha: new Date().toISOString()
    };
    const updated = [notification, ...this.notificationsSignal()];
    this.notificationsSignal.set(updated);
    this.persistNotifications(updated);
    const currentRead = new Set(this.readIdsSignal());
    currentRead.delete(nextId);
    this.readIdsSignal.set(Array.from(currentRead.values()));
    this.persistReadIds(this.readIdsSignal());
  }

  resetHistory(notifications: DashboardNotification[]): void {
    const merged = notifications.length ? notifications : this.defaults;
    this.notificationsSignal.set(merged);
    this.persistNotifications(merged);
    this.readIdsSignal.set([]);
    this.persistReadIds([]);
  }

  /**
   * Actualiza el contador de notificaciones no leídas desde el backend
   */
  updateUnreadCountFromBackend(count: number): void {
    this.unreadCountOverride.set(count);
  }

  private restoreNotifications(): DashboardNotification[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as DashboardNotification[]) : [];
      const merged = this.mergeDefaults(parsed);
      this.persistNotifications(merged);
      return merged;
    } catch {
      return [...this.defaults];
    }
  }

  private restoreReadIds(): number[] {
    try {
      const stored = localStorage.getItem(this.READ_KEY);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  }

  private mergeDefaults(list: DashboardNotification[]): DashboardNotification[] {
    const registry = new Map<number, DashboardNotification>();
    [...list, ...this.defaults].forEach(item => {
      if (!item?.id) {
        return;
      }
      registry.set(item.id, item);
    });
    return Array.from(registry.values());
  }

  private persistNotifications(list: DashboardNotification[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* noop */
    }
  }

  private persistReadIds(ids: number[]): void {
    try {
      localStorage.setItem(this.READ_KEY, JSON.stringify(ids));
    } catch {
      /* noop */
    }
  }

  private generateNextId(): number {
    const existing = this.notificationsSignal().map(n => n.id);
    const max = existing.length ? Math.max(...existing) : 0;
    return max + 1;
  }
}
