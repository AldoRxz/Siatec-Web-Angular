import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

export interface PageAction {
  label: string;
  icon?: string;
  severity?: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'primary' | 'secondary';
  onClick: () => void;
}

/**
 * Componente reutilizable para encabezados de página
 * Incluye título, breadcrumb y acciones
 * 
 * @example
 * ```typescript
 * <app-page-header
 *   title="Contribuyentes"
 *   subtitle="Administración de contribuyentes del sistema"
 *   [breadcrumb]="breadcrumbItems"
 *   [actions]="pageActions"
 * />
 * ```
 */
@Component({
  selector: 'app-page-header',
  imports: [CommonModule, ButtonModule, BreadcrumbModule],
  template: `
    <div class="page-header mb-4">
      @if (breadcrumb().length > 0) {
        <p-breadcrumb 
          [model]="breadcrumb()" 
          [home]="homeItem()"
          styleClass="mb-3"
        />
      }

      <div class="flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <h1 class="text-3xl font-bold text-900 m-0 mb-2">
            @if (icon()) {
              <i [class]="icon() + ' mr-2'"></i>
            }
            {{ title() }}
          </h1>
          @if (subtitle()) {
            <p class="text-600 m-0 text-lg">{{ subtitle() }}</p>
          }
        </div>

        @if (actions().length > 0) {
          <div class="flex gap-2 flex-wrap">
            @for (action of actions(); track action.label) {
              <p-button
                [label]="action.label"
                [icon]="action.icon"
                [severity]="action.severity || 'primary'"
                (onClick)="action.onClick()"
              />
            }
          </div>
        }
      </div>

      @if (showDivider()) {
        <div class="border-bottom-1 border-200 mt-4"></div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
    }
  `]
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  icon = input<string>('');
  breadcrumb = input<MenuItem[]>([]);
  homeItem = input<MenuItem>({ icon: 'pi pi-home', routerLink: '/' });
  actions = input<PageAction[]>([]);
  showDivider = input<boolean>(true);
}
