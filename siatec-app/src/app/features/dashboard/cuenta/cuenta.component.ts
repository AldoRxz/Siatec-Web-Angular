import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { of } from 'rxjs';
import { finalize, switchMap, catchError } from 'rxjs/operators';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

// Services & Models
import { AuthService } from '../../../core/services';
import { User, UpdateAccountData } from '../../../core/models/auth.model';

@Component({
  selector: 'app-dashboard-cuenta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    DividerModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    ToastModule,
    PasswordModule,
    IconFieldModule,
    InputIconModule,
    MessageModule,
    SkeletonModule
  ],
  providers: [MessageService],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.scss'
})
export class CuentaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  /** Loading state for form submission */
  readonly loading = signal(false);

  /** Loading state for initial data fetch */
  readonly initialLoading = signal(true);

  /** Current user data */
  private currentUser: User | null = null;

  /** Account form with validation */
  readonly accountForm = this.fb.nonNullable.group({
    // Personal info
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    primerApellido: [''],
    segundoApellido: [''],
    telefono: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],
    email: ['', [Validators.required, Validators.email]],
    // Security
    oldPassword: [''],
    newPassword: ['', [Validators.minLength(8)]],
    confirmPassword: ['']
  }, {
    validators: [this.passwordMatchValidator]
  });

  /** User initials for avatar */
  readonly userInitials = computed(() => {
    const nombres = this.accountForm.get('nombres')?.value || '';
    const apellido = this.accountForm.get('primerApellido')?.value || '';
    const first = nombres.charAt(0).toUpperCase();
    const second = apellido.charAt(0).toUpperCase() || nombres.charAt(1)?.toUpperCase() || '';
    return first + second;
  });

  ngOnInit(): void {
    this.prefillForm();
  }

  /**
   * Custom validator for password confirmation
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Submit form to update account
   */
  submit(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, revisa los campos marcados en rojo.'
      });
      return;
    }

    const formValue = this.accountForm.getRawValue();

    // Validate password change requirements
    if ((formValue.newPassword || formValue.confirmPassword) && !formValue.oldPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contraseña requerida',
        detail: 'Ingresa tu contraseña actual para poder cambiarla.'
      });
      return;
    }

    // Build payload matching API contract
    const payload: UpdateAccountData = {
      email: formValue.email.trim(),
      nombres: formValue.nombres.trim(),
      primerApellido: formValue.primerApellido?.trim() || '',
      segundoApellido: formValue.segundoApellido?.trim() || '',
      telefono: formValue.telefono?.trim() || ''
    };

    // Include password fields only if changing password
    if (formValue.oldPassword && formValue.newPassword) {
      payload.oldPassword = formValue.oldPassword;
      payload.newPassword = formValue.newPassword;
    }

    this.loading.set(true);

    this.authService
      .updateAccount(payload)
      .pipe(
        switchMap(() => this.authService.refreshUser().pipe(catchError(() => of(null)))),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          const successMessage = payload.oldPassword
            ? 'Tu información y contraseña han sido actualizadas.'
            : 'Tu información ha sido actualizada correctamente.';

          this.messageService.add({
            severity: 'success',
            summary: '¡Guardado!',
            detail: successMessage,
            life: 5000
          });

          // Clear password fields after successful update
          this.accountForm.patchValue({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error al guardar',
            detail: err?.message || 'No pudimos actualizar tu información. Intenta nuevamente.',
            life: 6000
          });
        }
      });
  }

  /**
   * Prefill form with current user data
   */
  private prefillForm(): void {
    this.initialLoading.set(true);

    try {
      this.currentUser = this.authService.getCurrentUser();

      if (!this.currentUser) {
        this.initialLoading.set(false);
        return;
      }

      // Extract user data with fallbacks
      const user = this.currentUser;
      const identityInfo: Record<string, unknown> = (user.identityInfo as Record<string, unknown>) || {};

      // Try different property name conventions (camelCase and PascalCase)
      const nombres = (identityInfo['nombres'] || identityInfo['Nombres'] || user.nombre || '') as string;
      const primerApellido = (identityInfo['primerApellido'] || identityInfo['PrimerApellido'] || '') as string;
      const segundoApellido = (identityInfo['segundoApellido'] || identityInfo['SegundoApellido'] || '') as string;
      const telefono = (identityInfo['telefono'] || identityInfo['Telefono'] || '') as string;
      const email = (user.email || identityInfo['email'] || identityInfo['Email'] || '') as string;

      this.accountForm.patchValue({
        nombres,
        primerApellido,
        segundoApellido,
        telefono,
        email
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.initialLoading.set(false);
    }
  }

  /**
   * Helper to check if a form control has errors and is touched
   */
  hasError(controlName: string): boolean {
    const control = this.accountForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  /**
   * Get error message for a specific control
   */
  getErrorMessage(controlName: string): string {
    const control = this.accountForm.get(controlName);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['email']) return 'Ingresa un correo electrónico válido.';
    if (control.errors['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return `Mínimo ${min} caracteres.`;
    }
    if (control.errors['pattern']) return 'Formato inválido.';
    if (control.errors['passwordMismatch']) return 'Las contraseñas no coinciden.';

    return 'Campo inválido.';
  }
}
