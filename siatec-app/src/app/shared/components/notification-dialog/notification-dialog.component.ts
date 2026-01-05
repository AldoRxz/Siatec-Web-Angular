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
    <div class="notification-dialog" [ngClass]="config.data?.severity || 'info'">
      <button class="close-btn" (click)="close()" type="button">
        <i class="pi pi-times"></i>
      </button>

      <div class="dialog-icon-wrapper">
        <div class="dialog-icon">
          <i class="pi" [ngClass]="iconClass"></i>
        </div>
      </div>

      <div class="dialog-body">
        <p class="subtitle" *ngIf="config.data?.subtitle">{{ config.data?.subtitle }}</p>
        <h3 class="title">{{ config.data?.title || 'Notificación' }}</h3>
        <p class="message">{{ config.data?.message || 'Sin contenido adicional' }}</p>
        <p class="hint" *ngIf="config.data?.hint">
          <i class="pi pi-info-circle"></i>
          {{ config.data?.hint }}
        </p>

        <div class="actions" *ngIf="(config.data?.actions?.length ?? 0) > 0">
          <a
            *ngFor="let action of (config.data?.actions ?? [])"
            [href]="action.url || '#'"
            target="_blank"
            rel="noopener"
            pButton
            [label]="action.label || 'Ver más'"
            [icon]="action.icon || ''"
            class="p-button-outlined"
          ></a>
        </div>
      </div>

      <div class="dialog-footer">
        <button 
          pButton 
          type="button" 
          label="Entendido" 
          (click)="close()" 
          class="confirm-btn"
          [ngClass]="'btn-' + (config.data?.severity || 'info')"
        >
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .notification-dialog {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1.5rem;
        padding: 2rem 2rem 1.75rem;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 1.5rem;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
        max-width: 480px;
        overflow: hidden;
      }

      .notification-dialog::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      }

      .notification-dialog.success::before {
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      }

      .notification-dialog.danger::before {
        background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
      }

      .notification-dialog.warn::before {
        background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
      }

      .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 0.5rem;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
      }

      .close-btn:hover {
        background: #f1f5f9;
        color: #475569;
        transform: scale(1.1);
      }

      .dialog-icon-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-top: 0.5rem;
      }

      .dialog-icon {
        width: 5rem;
        height: 5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        position: relative;
        animation: scaleIn 0.3s ease-out;
      }

      @keyframes scaleIn {
        0% {
          transform: scale(0.5);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .notification-dialog.info .dialog-icon {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #1d4ed8;
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
      }

      .notification-dialog.success .dialog-icon {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        color: #059669;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);
      }

      .notification-dialog.warn .dialog-icon {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #d97706;
        box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2);
      }

      .notification-dialog.danger .dialog-icon {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #dc2626;
        box-shadow: 0 10px 30px rgba(239, 68, 68, 0.2);
      }

      .dialog-body {
        width: 100%;
        animation: fadeIn 0.4s ease-out 0.1s both;
      }

      @keyframes fadeIn {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dialog-body .subtitle {
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 0.75rem;
        font-weight: 600;
        color: #2563eb;
        margin: 0 0 0.5rem 0;
      }

      .notification-dialog.success .dialog-body .subtitle {
        color: #059669;
      }

      .notification-dialog.danger .dialog-body .subtitle {
        color: #dc2626;
      }

      .notification-dialog.warn .dialog-body .subtitle {
        color: #d97706;
      }

      .dialog-body .title {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.3;
      }

      .dialog-body .message {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        color: #475569;
        line-height: 1.6;
      }

      .dialog-body .hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin: 1rem 0 0;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: #64748b;
        background: #f1f5f9;
        border-radius: 0.75rem;
        border-left: 3px solid #3b82f6;
      }

      .notification-dialog.success .dialog-body .hint {
        background: #f0fdf4;
        border-left-color: #10b981;
        color: #047857;
      }

      .notification-dialog.danger .dialog-body .hint {
        background: #fef2f2;
        border-left-color: #ef4444;
        color: #b91c1c;
      }

      .notification-dialog.warn .dialog-body .hint {
        background: #fffbeb;
        border-left-color: #f59e0b;
        color: #b45309;
      }

      .dialog-body .hint i {
        font-size: 1rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: center;
        margin-top: 1.25rem;
      }

      .dialog-footer {
        width: 100%;
        margin-top: 0.5rem;
        animation: fadeIn 0.4s ease-out 0.2s both;
      }

      .confirm-btn {
        width: 100%;
        padding: 0.875rem 2rem;
        border-radius: 0.75rem;
        font-weight: 600;
        font-size: 1rem;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .confirm-btn.btn-info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }

      .confirm-btn.btn-info:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
      }

      .confirm-btn.btn-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }

      .confirm-btn.btn-success:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
      }

      .confirm-btn.btn-danger {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }

      .confirm-btn.btn-danger:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
      }

      .confirm-btn.btn-warn {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }

      .confirm-btn.btn-warn:hover {
        background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(217, 119, 6, 0.3);
      }

      .confirm-btn:active {
        transform: translateY(0);
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
