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
  showPassword = false;

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
      console.log('[LoginComponent] Enviando login...');
      const response = await firstValueFrom(this.authService.login({ email, password }));
      console.log('[LoginComponent] Respuesta recibida:', response);
      
      // El backend puede devolver token o accessToken
      const token = response.token || response.accessToken;
      console.log('[LoginComponent] Token extraído:', token ? 'Sí' : 'No');
      
      if (token) {
        console.log('[LoginComponent] Token encontrado, mostrando diálogo...');
        // Obtener URL de retorno o usar dashboard por defecto
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/contribuyentes/dashboard';
        
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
            autoCloseMs: 1800,
            redirectUrl: returnUrl
          }
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extraer mensaje de error del response
      let errorMsg = 'Error al iniciar sesión. Por favor intenta nuevamente.';
      if (error?.error?.mensaje) {
        errorMsg = error.error.mensaje;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      this.errorMessage = errorMsg;
      
      // Mostrar modal de error
      this.openStatusDialog(
        {
          title: 'Error de autenticación',
          subtitle: 'No se pudo iniciar sesión',
          message: errorMsg,
          hint: 'Verifica tus credenciales e intenta nuevamente.',
          severity: 'danger'
        },
        {
          autoCloseMs: 4000
        }
      );
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private openStatusDialog(
    payload: NotificationDialogData,
    options?: { onClose?: () => void; autoCloseMs?: number; redirectUrl?: string }
  ): void {
    console.log('Opening dialog with payload:', payload);
    this.dialogRef?.close();

    const ref = this.dialogService.open(NotificationDialogComponent, {
      showHeader: false,
      width: '420px',
      styleClass: 'notification-dialog-shell',
      data: payload,
      modal: true,
      closable: false
    });

    console.log('Dialog ref created:', ref);
    
    if (!ref) {
      console.error('Failed to create dialog ref');
      // Si el diálogo no se puede crear, redirigir inmediatamente
      if (options?.redirectUrl) {
        setTimeout(() => this.router.navigateByUrl(options.redirectUrl!), 100);
      }
      return;
    }
    
    this.dialogRef = ref;

    if (options?.onClose) {
      ref.onClose?.pipe(take(1)).subscribe(options.onClose);
    }

    if (options?.autoCloseMs) {
      setTimeout(() => {
        ref.close();
        // Si hay una URL de redirección, navegar después de cerrar el diálogo
        if (options.redirectUrl) {
          this.router.navigateByUrl(options.redirectUrl);
        }
      }, options.autoCloseMs);
    }
  }

  ngOnDestroy(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
  }
}
