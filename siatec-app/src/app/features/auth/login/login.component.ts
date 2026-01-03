import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { FloatLabelFilledDirective } from '../../../shared/directives';

@Component({
  selector: 'app-login',
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
    DynamicDialogModule,
    FloatLabelFilledDirective
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [DialogService]
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);

  private dialogRef: DynamicDialogRef | null = null;

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      const response = await firstValueFrom(this.authService.login({ email, password }));
      
      if (response.token) {
        // Obtener URL de retorno o usar dashboard por defecto
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        
        this.openStatusDialog(
          {
            title: 'Inicio de sesión exitoso',
            subtitle: 'Portal SIATEC',
            message: 'Estamos preparando tu panel personalizado.',
            hint: 'Serás redirigido automáticamente en instantes.',
            severity: 'success'
          },
          {
            onClose: () => this.router.navigateByUrl(returnUrl),
            autoCloseMs: 1800
          }
        );
      }
    } catch (error: any) {
      this.errorMessage = error?.message || 'Error al iniciar sesión. Por favor intenta nuevamente.';
      console.error('Login error:', error);
    } finally {
      this.loading = false;
    }
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  private openStatusDialog(
    payload: NotificationDialogData,
    options?: { onClose?: () => void; autoCloseMs?: number }
  ): void {
    this.dialogRef?.close();

    const ref = this.dialogService.open(NotificationDialogComponent, {
      header: payload.title || 'Notificación',
      width: '420px',
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
