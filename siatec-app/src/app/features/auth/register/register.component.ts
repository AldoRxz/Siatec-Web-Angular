import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { InputMaskModule } from 'primeng/inputmask';
import { DynamicDialogModule, DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthService } from '../../../core/services';
import { NotificationDialogComponent, NotificationDialogData } from '../../../shared/components/notification-dialog/notification-dialog.component';
import { FloatLabelFilledDirective } from '../../../shared/directives';

/**
 * Validador personalizado para confirmar que las contraseñas coincidan
 */
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
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
    InputMaskModule,
    DynamicDialogModule,
    FloatLabelFilledDirective
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  providers: [DialogService]
})
export class RegisterComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);

  private dialogRef: DynamicDialogRef | null = null;

  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  passwordStrength = 0;
  passwordStrengthLabel = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor() {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(4)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      primerApellido: ['', [Validators.required, Validators.minLength(2)]],
      segundoApellido: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator() });

    // Calcular fortaleza de contraseña
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  calculatePasswordStrength(password: string) {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthLabel = '';
      return;
    }

    let strength = 0;
    
    // Longitud
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    
    // Mayúsculas
    if (/[A-Z]/.test(password)) strength += 15;
    
    // Minúsculas
    if (/[a-z]/.test(password)) strength += 15;
    
    // Números
    if (/\d/.test(password)) strength += 10;
    
    // Caracteres especiales
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;

    this.passwordStrength = Math.min(strength, 100);

    if (this.passwordStrength < 40) {
      this.passwordStrengthLabel = 'Débil';
    } else if (this.passwordStrength < 70) {
      this.passwordStrengthLabel = 'Media';
    } else {
      this.passwordStrengthLabel = 'Fuerte';
    }
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData = { 
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        nombres: this.registerForm.value.nombres,
        primerApellido: this.registerForm.value.primerApellido,
        segundoApellido: this.registerForm.value.segundoApellido || '',
        rfc: '', // RFC opcional para registro inicial
        telefono: this.registerForm.value.telefono || '',
        userName: this.registerForm.value.userName || this.registerForm.value.email
      };

      await firstValueFrom(this.authService.register(formData));

      this.successMessage = 'Registro exitoso. Redirigiendo al inicio de sesión...';

      this.openStatusDialog(
        {
          title: 'Solicitud recibida',
          subtitle: 'Portal SIATEC',
          message: 'Enviaremos un correo con la confirmación de tu registro en breve.',
          hint: 'Te redirigiremos para que inicies sesión.',
          severity: 'success'
        },
        {
          onClose: () => this.router.navigate(['/login']),
          autoCloseMs: 2200
        }
      );
    } catch (error: any) {
      console.error('Register error - Full object:', error);
      console.error('Register error - error.error:', error?.error);
      console.error('Register error - error.error.errors:', error?.error?.errors);
      
      // Extraer mensaje de error del backend
      let finalMessage = 'Error al registrar usuario. Por favor intenta nuevamente.';
      
      // Intentar extraer el mensaje de diferentes formatos de error
      if (error?.error?.mensaje) {
        finalMessage = error.error.mensaje;
      } else if (error?.error?.message) {
        finalMessage = error.error.message;
      } else if (error?.error?.errors) {
        // Manejar errores de validación de FluentValidation o ModelState
        const errors = error.error.errors;
        
        if (typeof errors === 'object') {
          // Errores de ModelState (objeto con claves)
          const errorMessages = Object.values(errors).flat() as string[];
          if (errorMessages.length > 0) {
            finalMessage = errorMessages.join('. ');
          }
        } else if (Array.isArray(errors)) {
          // Errores de FluentValidation (array)
          const specificErrors = errors.filter((err: string) => 
            err && err.length > 0 && 
            !err.toLowerCase().includes('temporal') &&
            !err.toLowerCase().includes('consistencia') &&
            !err.toLowerCase().includes('revirtió')
          );
          
          if (specificErrors.length > 0) {
            finalMessage = specificErrors[specificErrors.length - 1];
          } else if (errors.length > 0) {
            finalMessage = errors[errors.length - 1];
          }
        }
      } else if (error?.message) {
        finalMessage = error.message;
      }
      
      console.log('Final message to display:', finalMessage);
      this.errorMessage = finalMessage;
      
      // Mostrar modal de error
      this.openStatusDialog(
        {
          title: 'Error en el registro',
          subtitle: 'Portal SIATEC',
          message: finalMessage,
          hint: 'Por favor verifica los datos e intenta nuevamente.',
          severity: 'danger'
        },
        {
          autoCloseMs: 5000
        }
      );
    } finally {
      this.loading = false;
    }
  }

  getControl(name: string) {
    return this.registerForm.get(name);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  get formHasPasswordMismatch(): boolean {
    return !!(this.registerForm.hasError('passwordMismatch') && 
             this.registerForm.get('confirmPassword')?.touched);
  }

  private openStatusDialog(
    payload: NotificationDialogData,
    options?: { onClose?: () => void; autoCloseMs?: number }
  ): void {
    this.dialogRef?.close();

    const ref = this.dialogService.open(NotificationDialogComponent, {
      showHeader: false,
      width: '440px',
      styleClass: 'notification-dialog-shell',
      data: payload,
      modal: true,
      closable: false
    })!;

    this.dialogRef = ref;

    if (options?.onClose) {
      ref.onClose?.pipe(take(1)).subscribe(options.onClose);
    }

    if (options?.autoCloseMs) {
      setTimeout(() => ref.close(), options.autoCloseMs);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnDestroy(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
  }
}
