import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, PanelMenuModule],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss'
})
export class SidebarNavComponent {
  @Input() title = 'Panel de Control';
  @Input() items: MenuItem[] = [];
}
