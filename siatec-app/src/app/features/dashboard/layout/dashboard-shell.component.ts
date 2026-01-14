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
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { SiatecBotService, SiatecBotModalComponent } from '../../siatec-bot';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PortalHeaderComponent, SidebarNavComponent, DrawerModule, ButtonModule, SiatecBotModalComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(DashboardNotificationsService);
  private readonly documentsService = inject(DashboardDocumentsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly siatecBotService = inject(SiatecBotService);

  readonly activeKey = signal<string>('panel');
  readonly navItems = signal<SidebarMenuItem[]>(this.buildNavItems());
  readonly notificationsCount = this.notificationsService.unreadCount;
  readonly documentSummary = this.documentsService.summary;
  readonly footerYear = new Date().getFullYear();
  mobileSidebarVisible = false;

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
      .subscribe((event) => {
        this.syncActiveKeyWithRoute(event.urlAfterRedirects ?? event.url);
        this.closeMobileSidebar();
      });
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return 'Usuario Contribuyente';
    }

    // Usar el userName directamente del backend
    const userName = (user as any).userName;
    if (userName?.trim()) {
      return userName.trim();
    }

    // Usar email como fallback
    return user.email?.split('@')[0] || 'Usuario Contribuyente';
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
    this.closeMobileSidebar();
  }

  onProfile(): void {
    this.router.navigateByUrl('/contribuyentes/dashboard/cuenta');
  }

  onSettings(): void {
    this.router.navigateByUrl('/contribuyentes/dashboard/resumen');
  }

  onLogout(): void {
    this.authService.logout();
  }

  onNotificationsClick(): void {
    this.notificationsService.markAllAsRead();
    this.router.navigateByUrl('/contribuyentes/dashboard/notificaciones');
  }

  onSiatecBotClick(): void {
    this.siatecBotService.toggleChat();
  }

  private syncActiveKeyWithRoute(url: string): void {
    if (!url) {
      return;
    }
    const parts = url.split('/');
    const dashboardIndex = parts.indexOf('dashboard');
    const segment = dashboardIndex >= 0 && parts[dashboardIndex + 1] ? parts[dashboardIndex + 1] : 'panel';
    this.activeKey.set(segment);
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
        command: () => this.navigate('/contribuyentes/dashboard/panel', 'panel')
      },
      {
        key: 'contribuciones',
        label: 'Contribuciones',
        icon: 'pi pi-file-edit',
        indicator: 'warning',
        command: () => this.navigate('/contribuyentes/dashboard/contribuciones', 'contribuciones')
      },
      {
        key: 'citas',
        label: 'Agendar citas',
        icon: 'pi pi-calendar',
        indicator: 'success',
        command: () => this.navigate('/contribuyentes/dashboard/citas', 'citas')
      },
      {
        key: 'archivos',
        label: 'Mis documentos',
        icon: 'pi pi-folder-open',
        command: () => this.navigate('/contribuyentes/dashboard/archivos', 'archivos')
      },
      {
        key: 'cuenta',
        label: 'Mi perfil',
        icon: 'pi pi-id-card',
        command: () => this.navigate('/contribuyentes/dashboard/cuenta', 'cuenta')
      },
      {
        key: 'notificaciones',
        label: 'Notificaciones',
        icon: 'pi pi-bell',
        indicator: 'danger',
        command: () => this.navigate('/contribuyentes/dashboard/notificaciones', 'notificaciones')
      },
      {
        separator: true,
        label: ''
      },
      {
        key: 'inscripcion',
        label: 'Inscripción al REC',
        icon: 'pi pi-shield',
        command: () => this.navigate('/contribuyentes/dashboard/inscripcion', 'inscripcion')
      }
    ];
  }

  private patchNavItem(id: string, changes: Partial<SidebarMenuItem>): void {
    this.navItems.update((items) => items.map((item) => (item.key === id ? { ...item, ...changes } : item)));
  }

  openMobileSidebar(): void {
    this.mobileSidebarVisible = true;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarVisible = false;
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarVisible = !this.mobileSidebarVisible;
  }
}
