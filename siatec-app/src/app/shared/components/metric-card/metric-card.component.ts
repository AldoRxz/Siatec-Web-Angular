import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss'
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() description = '';
  @Input() icon = 'pi pi-circle-fill';
  @Input() severity: 'primary' | 'success' | 'warn' | 'info' = 'primary';
  @Input() actionLabel = 'Ver detalle';
  @Input() hint = '';

  @Output() action = new EventEmitter<void>();

  emitAction(): void {
    this.action.emit();
  }

  get tagSeverity(): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' | null {
    if (this.severity === 'primary') {
      return 'info';
    }

    if (this.severity === 'success' || this.severity === 'info' || this.severity === 'warn') {
      return this.severity;
    }

    return 'secondary';
  }
}
