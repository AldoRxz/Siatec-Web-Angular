import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthService } from '../../../core/services';
import { NotificationDialogComponent, NotificationDialogData } from '../../../shared/components/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    ButtonModule,
    FloatLabelModule,
    IconFieldModule,
    InputIconModule,
    DividerModule,
    MessageModule,
    DynamicDialogModule
  ],
  templateUrl: './forgot.component.html',
  styleUrl: './forgot.component.scss',
  providers: [DialogService]
})
export class ForgotComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);

  private dialogRef: DynamicDialogRef | null = null;

  recoveryForm: FormGroup;
  loading = false;
  responseMessage = '';

  helperTopics = [
    {
      icon: 'pi pi-inbox',
      title: '¿No recibiste correos?',
      detail: 'Revisa spam o bandejas alternativas. El remitente oficial es notificaciones@siatec.gob.'
    },
    {
      icon: 'pi pi-id-card',
      title: 'Confirma tu usuario',
      detail: 'Puedes usar RFC o el identificador que usas para facturación en Tesorería.'
    },
    {
      icon: 'pi pi-shield',
      title: 'Seguridad primero',
      detail: 'Solo enviamos ligas válidas por 15 minutos. No compartas el código con terceros.'
    }
  ];

  constructor() {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      identifier: ['', [Validators.minLength(6)]],
      contactPreference: ['email', [Validators.required]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.responseMessage = '';

    try {
      const payload = this.recoveryForm.value;
      const response = await firstValueFrom(this.authService.requestPasswordRecovery(payload));

      this.responseMessage = response?.message || 'Hemos enviado las instrucciones a tu correo registrado.';

      this.openStatusDialog(
        {
          title: 'Solicitud registrada',
          subtitle: 'Recuperación de acceso',
          message: this.responseMessage,
          hint: 'Revisa tu bandeja y sigue los pasos del correo. Si no llega, intenta nuevamente en 5 minutos.',
          severity: 'info'
        },
        {
          onClose: () => this.recoveryForm.reset({ contactPreference: 'email' }),
          autoCloseMs: 4000
        }
      );
    } catch (error: any) {
      this.responseMessage = error?.message || 'No pudimos procesar tu solicitud. Inténtalo de nuevo más tarde.';
      console.error('Forgot password error:', error);
    } finally {
      this.loading = false;
    }
  }

  get emailControl() {
    return this.recoveryForm.get('email');
  }

  get identifierControl() {
    return this.recoveryForm.get('identifier');
  }

  private openStatusDialog(
    payload: NotificationDialogData,
    options?: { onClose?: () => void; autoCloseMs?: number }
  ): void {
    this.dialogRef?.close();

    const ref = this.dialogService.open(NotificationDialogComponent, {
      header: payload.title || 'Notificación',
      width: '440px',
      styleClass: 'notification-dialog-shell',
      data: payload,
      modal: true
    })!;

    this.dialogRef = ref;

    if (options?.onClose) {
      ref.onClose?.pipe(take(1)).subscribe(options.onClose);
    }

    if (options?.autoCloseMs) {
      setTimeout(() => ref.close(), options.autoCloseMs);
    }
  }

  ngOnDestroy(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
  }
}
