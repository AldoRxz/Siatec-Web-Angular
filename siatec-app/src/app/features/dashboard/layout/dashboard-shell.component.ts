import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortalHeaderComponent } from '../../../shared/components/portal-header/portal-header.component';
import { SidebarNavComponent, SidebarMenuItem } from '../../../shared/components/sidebar-nav/sidebar-nav.component';
import { AuthService } from '../../../core/services';
import { DashboardNotificationsService } from '../services/dashboard-notifications.service';
import { DashboardDocumentsService } from '../services/dashboard-documents.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PortalHeaderComponent, SidebarNavComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(DashboardNotificationsService);
  private readonly documentsService = inject(DashboardDocumentsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeKey = signal<string>('panel');
  readonly navItems = signal<SidebarMenuItem[]>(this.buildNavItems());
  readonly notificationsCount = this.notificationsService.unreadCount;
  readonly documentSummary = this.documentsService.summary;
  readonly footerYear = new Date().getFullYear();

  private readonly navBadgesEffect = effect(() => {
    const docs = this.documentSummary().total ?? 0;
    const unread = this.notificationsCount();
    this.patchNavItem('archivos', {
      badge: docs > 0 ? String(docs) : undefined,
      badgeClass: docs > 0 ? 'sidebar-badge' : undefined
    });
    this.patchNavItem('notificaciones', {
      badge: unread > 0 ? String(unread) : undefined,
      badgeClass: unread > 0 ? 'sidebar-badge warn' : undefined
    });
  });

  ngOnInit(): void {
    this.documentsService.load();
    this.syncActiveKeyWithRoute(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => this.syncActiveKeyWithRoute(event.urlAfterRedirects ?? event.url));
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Usuario Contribuyente';
    }
    return [user.nombre, user.apellidos].filter(Boolean).join(' ').trim() || user.email || 'Usuario Contribuyente';
  }

  get userEmail(): string {
    return this.authService.getCurrentUser()?.email || 'correo@siatec.gob';
  }

  onSidebarSelect(item: SidebarMenuItem): void {
    const key = item.key ?? (item.id as string) ?? item.label ?? '';
    if (item.command) {
      item.command({ item });
    }
    if (key) {
      this.activeKey.set(key);
    }
  }

  onProfile(): void {
    this.router.navigateByUrl('/dashboard/cuenta');
  }

  onSettings(): void {
    this.router.navigateByUrl('/dashboard/resumen');
  }

  onLogout(): void {
    this.authService.logout();
  }

  onNotificationsClick(): void {
    this.notificationsService.markAllAsRead();
    this.router.navigateByUrl('/dashboard/notificaciones');
  }

  private syncActiveKeyWithRoute(url: string): void {
    if (!url) {
      return;
    }
    const [, base, segment = 'panel'] = url.split('/');
    if (base !== 'dashboard') {
      return;
    }
    const normalized = segment || 'panel';
    this.activeKey.set(normalized);
  }

  private navigate(route: string, key: string): void {
    this.activeKey.set(key);
    this.router.navigateByUrl(route);
  }

  private buildNavItems(): SidebarMenuItem[] {
    return [
      {
        key: 'panel',
        label: 'Principal',
        icon: 'pi pi-chart-pie',
        command: () => this.navigate('/dashboard/panel', 'panel')
      },
      {
        key: 'operaciones',
        label: 'Contribuciones',
        icon: 'pi pi-file-edit',
        indicator: 'warning',
        command: () => this.navigate('/dashboard/operaciones', 'operaciones')
      },
      {
        key: 'citas',
        label: 'Agendar citas',
        icon: 'pi pi-calendar',
        indicator: 'success',
        command: () => this.navigate('/dashboard/operaciones', 'citas')
      },
      {
        key: 'archivos',
        label: 'Mis documentos',
        icon: 'pi pi-folder-open',
        command: () => this.navigate('/dashboard/archivos', 'archivos')
      },
      {
        key: 'cuenta',
        label: 'Mi perfil',
        icon: 'pi pi-id-card',
        command: () => this.navigate('/dashboard/cuenta', 'cuenta')
      },
      {
        key: 'notificaciones',
        label: 'Notificaciones',
        icon: 'pi pi-bell',
        indicator: 'danger',
        command: () => this.navigate('/dashboard/notificaciones', 'notificaciones')
      },
      {
        separator: true,
        label: ''
      },
      {
        key: 'inscripcion',
        label: 'Inscripción al REC',
        icon: 'pi pi-shield',
        command: () => this.navigate('/dashboard/inscripcion', 'inscripcion')
      }
    ];
  }

  private patchNavItem(id: string, changes: Partial<SidebarMenuItem>): void {
    this.navItems.update((items) => items.map((item) => (item.key === id ? { ...item, ...changes } : item)));
  }
}
