import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';

export type SidebarIndicator = 'info' | 'success' | 'warning' | 'danger';

export interface SidebarMenuItem extends MenuItem {
  key?: string;
  badge?: string;
  badgeClass?: string;
  indicator?: SidebarIndicator;
}

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss'
})
export class SidebarNavComponent {
  @Input() title = 'Panel de Control';
  @Input() items: SidebarMenuItem[] = [];
  @Input() activeKey?: string;

  @Output() select = new EventEmitter<SidebarMenuItem>();

  trackByItem = (_: number, item: SidebarMenuItem): string => {
    return item.key ?? (item.id as string) ?? item.label ?? String(_);
  };

  getItemId(item: SidebarMenuItem): string {
    const label = item.label || 'item';
    return 'sidebar-' + label.toLowerCase().replace(/ /g, '-');
  }

  isActive(item: SidebarMenuItem): boolean {
    if (!this.activeKey) {
      return false;
    }
    return (item.key ?? (item.id as string) ?? item.label) === this.activeKey;
  }

  onSelect(event: Event, item: SidebarMenuItem): void {
    event.preventDefault();
    this.select.emit(item);
    if (item.command) {
      item.command({ item, originalEvent: event });
    }
  }
}
