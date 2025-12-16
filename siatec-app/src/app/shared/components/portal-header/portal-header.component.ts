import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-portal-header',
  standalone: true,
  imports: [CommonModule, ToolbarModule, ButtonModule, AvatarModule, BadgeModule, MenuModule, RippleModule],
  templateUrl: './portal-header.component.html',
  styleUrl: './portal-header.component.scss'
})
export class PortalHeaderComponent implements OnChanges {
  @Input() title = 'SIATEC';
  @Input() subtitle = 'Portal Tributario';
  @Input() userName = 'Usuario Contribuyente';
  @Input() userEmail = 'usuario@siatec.gob';
  @Input() notifications = 0;
  @Input() badgeSeverity: 'info' | 'success' | 'warn' | 'danger' = 'info';
  @Input() menuItems: MenuItem[] | null = null;
  @Input() showMenuButton = false;

  @Output() profile = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() notificationsClick = new EventEmitter<void>();
  @Output() menuToggle = new EventEmitter<void>();

  internalMenu: MenuItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menuItems'] || !this.menuItems) {
      this.buildMenu();
    }
  }

  get initials(): string {
    return this.userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('');
  }

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  private buildMenu(): void {
    if (this.menuItems && this.menuItems.length) {
      this.internalMenu = this.menuItems;
      return;
    }

    this.internalMenu = [
      {
        label: 'Mi perfil',
        icon: 'pi pi-id-card',
        command: () => this.profile.emit()
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        command: () => this.settings.emit()
      },
      {
        separator: true
      },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logout.emit()
      }
    ];
  }
}
