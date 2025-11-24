import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  width?: string;
}

export interface TableAction {
  icon: string;
  tooltip: string;
  severity?: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast';
  onClick: (row: any) => void;
}

/**
 * Componente reutilizable para mostrar tablas de datos con PrimeNG
 * 
 * @example
 * ```typescript
 * <app-data-table
 *   [data]="users"
 *   [columns]="userColumns"
 *   [actions]="userActions"
 *   [loading]="isLoading"
 *   [paginator]="true"
 *   [rows]="10"
 *   [globalFilterFields]="['name', 'email']"
 *   (rowSelect)="onUserSelect($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-data-table',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule
  ],
  template: `
    <div class="card">
      @if (showHeader()) {
        <div class="flex justify-content-between align-items-center mb-3">
          <h3 class="m-0">{{ title() }}</h3>
          
          @if (globalFilterFields().length > 0) {
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search" />
              <input 
                pInputText 
                type="text" 
                [(ngModel)]="globalFilterValue"
                (input)="onGlobalFilter($event)"
                [placeholder]="searchPlaceholder()" 
              />
            </p-iconField>
          }
        </div>
      }

      <p-table
        [value]="data()"
        [columns]="columns()"
        [paginator]="paginator()"
        [rows]="rows()"
        [showCurrentPageReport]="showCurrentPageReport()"
        [currentPageReportTemplate]="currentPageReportTemplate()"
        [rowsPerPageOptions]="rowsPerPageOptions()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields()"
        [tableStyle]="{ 'min-width': '50rem' }"
        [selectionMode]="selectionMode()"
        [(selection)]="selectedRow"
        (onRowSelect)="onRowSelectHandler($event)"
        (onRowUnselect)="onRowUnselectHandler($event)"
        styleClass="p-datatable-striped"
        [dataKey]="dataKey()"
      >
        <ng-template pTemplate="header" let-columns>
          <tr>
            @for (col of columns; track col.field) {
              <th [pSortableColumn]="col.sortable ? col.field : ''" [style.width]="col.width">
                {{ col.header }}
                @if (col.sortable) {
                  <p-sortIcon [field]="col.field" />
                }
              </th>
            }
            @if (actions().length > 0) {
              <th style="width: 150px">Acciones</th>
            }
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-rowData let-columns="columns">
          <tr [pSelectableRow]="rowData">
            @for (col of columns; track col.field) {
              <td>
                @switch (col.type) {
                  @case ('date') {
                    {{ rowData[col.field] | date: 'dd/MM/yyyy' }}
                  }
                  @case ('currency') {
                    {{ rowData[col.field] | currency: 'USD':'symbol':'1.2-2' }}
                  }
                  @case ('boolean') {
                    <i [class]="rowData[col.field] ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                  }
                  @default {
                    {{ rowData[col.field] }}
                  }
                }
              </td>
            }
            @if (actions().length > 0) {
              <td>
                <div class="flex gap-2">
                  @for (action of actions(); track action.icon) {
                    <p-button
                      [icon]="action.icon"
                      [severity]="action.severity || 'info'"
                      [rounded]="true"
                      [text]="true"
                      [pTooltip]="action.tooltip"
                      tooltipPosition="top"
                      (onClick)="action.onClick(rowData)"
                    />
                  }
                </div>
              </td>
            }
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="columns().length + (actions().length > 0 ? 1 : 0)" class="text-center">
              No se encontraron registros
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-datatable .p-datatable-thead > tr > th {
        background-color: #f8f9fa;
        font-weight: 600;
      }
      
      .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) {
        background-color: #f8f9fa;
      }
    }
  `]
})
export class DataTableComponent {
  // Inputs
  data = input.required<any[]>();
  columns = input.required<TableColumn[]>();
  actions = input<TableAction[]>([]);
  loading = input<boolean>(false);
  paginator = input<boolean>(true);
  rows = input<number>(10);
  rowsPerPageOptions = input<number[]>([5, 10, 20, 50]);
  showCurrentPageReport = input<boolean>(true);
  currentPageReportTemplate = input<string>('Mostrando {first} a {last} de {totalRecords} registros');
  globalFilterFields = input<string[]>([]);
  searchPlaceholder = input<string>('Buscar...');
  selectionMode = input<'single' | 'multiple' | null>(null);
  dataKey = input<string>('id');
  title = input<string>('');
  showHeader = input<boolean>(true);

  // Outputs
  rowSelect = output<any>();
  rowUnselect = output<any>();

  // State
  selectedRow: any = null;
  globalFilterValue = signal('');

  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.globalFilterValue.set(input.value);
  }

  onRowSelectHandler(event: any) {
    this.rowSelect.emit(event.data);
  }

  onRowUnselectHandler(event: any) {
    this.rowUnselect.emit(event.data);
  }
}
