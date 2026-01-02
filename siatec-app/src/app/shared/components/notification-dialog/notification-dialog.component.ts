import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

export interface NotificationDialogData {
  title?: string;
  subtitle?: string;
  message?: string;
  hint?: string;
  severity?: 'info' | 'success' | 'warn' | 'danger';
  actions?: {
    label: string;
    icon?: string;
    url?: string;
  }[];
}

@Component({
  selector: 'app-notification-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="notification-dialog">
      <div class="dialog-icon" [ngClass]="config.data?.severity || 'info'">
        <i class="pi" [ngClass]="iconClass"></i>
      </div>

      <div class="dialog-body">
        <p class="subtitle" *ngIf="config.data?.subtitle">{{ config.data?.subtitle }}</p>
        <h3>{{ config.data?.title || 'Notificación' }}</h3>
        <p class="message">{{ config.data?.message || 'Sin contenido adicional' }}</p>
        <p class="hint" *ngIf="config.data?.hint">{{ config.data?.hint }}</p>

        <div class="actions" *ngIf="(config.data?.actions?.length ?? 0) > 0">
          <a
            *ngFor="let action of (config.data?.actions ?? [])"
            [href]="action.url || '#'"
            target="_blank"
            rel="noopener"
            pButton
            [label]="action.label || 'Ver más'"
            [icon]="action.icon || ''"
          ></a>
        </div>
      </div>

      <div class="dialog-footer">
        <button pButton type="button" label="Entendido" (click)="close()" class="w-full"></button>
      </div>
    </div>
  `,
  styles: [
    `
      .notification-dialog {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding-top: 0.5rem;
        background: #ffffff;
        border-radius: 1.25rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 15px 45px rgba(15, 23, 42, 0.12);
        padding: 0.75rem 0.5rem 0.35rem;
      }

      .dialog-icon {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 0.95rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        color: #1f2937;
        margin-left: 0.5rem;
      }

      .dialog-icon.info {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .dialog-icon.success {
        background: #ecfccb;
        color: #15803d;
      }

      .dialog-icon.warn {
        background: #fef3c7;
        color: #b45309;
      }

      .dialog-icon.danger {
        background: #fee2e2;
        color: #b91c1c;
      }

      .dialog-body h3 {
        margin: 0;
        font-size: 1.35rem;
        color: #0f172a;
      }

      .dialog-body .subtitle {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
        color: #2563eb;
        margin-bottom: 0.35rem;
      }

      .dialog-body .message {
        margin: 0.3rem 0 0;
        color: #334155;
      }

      .dialog-body .hint {
        margin: 0.15rem 0 0;
        font-size: 0.85rem;
        color: #64748b;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .dialog-footer {
        margin-top: 0.5rem;
        padding: 0 0.5rem 0.35rem;
      }

      .dialog-footer button {
        width: 100%;
        border-radius: 0.85rem;
        font-weight: 600;
      }
    `
  ]
})
export class NotificationDialogComponent {
  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig<NotificationDialogData>
  ) {}

  get iconClass(): string {
    const severity = this.config.data?.severity || 'info';
    const map: Record<string, string> = {
      info: 'pi-info-circle',
      success: 'pi-check-circle',
      warn: 'pi-exclamation-triangle',
      danger: 'pi-exclamation-circle'
    };

    return map[severity] || map['info'];
  }

  close(): void {
    this.ref.close();
  }
}
