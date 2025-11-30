import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { finalize, switchMap, catchError } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-dashboard-cuenta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, DividerModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.scss'
})
export class CuentaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly accountForm = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    primerApellido: [''],
    segundoApellido: [''],
    telefono: ['', [Validators.maxLength(15)]],
    email: ['', [Validators.required, Validators.email]],
    oldPassword: [''],
    newPassword: ['', [Validators.minLength(8)]],
    confirmPassword: ['']
  });

  private currentUser: User | null = null;

  ngOnInit(): void {
    this.prefillForm();
  }

  submit(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const { nombres, primerApellido, segundoApellido, telefono, email, oldPassword, newPassword, confirmPassword } = this.accountForm.getRawValue();

    if ((newPassword || confirmPassword) && newPassword !== confirmPassword) {
      this.messageService.add({ severity: 'warn', summary: 'Contraseña', detail: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }

    if ((newPassword || confirmPassword) && !oldPassword) {
      this.messageService.add({ severity: 'warn', summary: 'Contraseña', detail: 'Ingresa tu contraseña actual para realizar el cambio.' });
      return;
    }

    const payload: Record<string, any> = {
      email: email.trim(),
      nombres: nombres.trim(),
      primerApellido: primerApellido?.trim() ?? '',
      segundoApellido: segundoApellido?.trim() ?? '',
      telefono: telefono?.trim() ?? ''
    };

    if (oldPassword && newPassword) {
      payload['oldPassword'] = oldPassword;
      payload['newPassword'] = newPassword;
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
          this.messageService.add({ severity: 'success', summary: 'Perfil actualizado', detail: 'Guardamos tus cambios correctamente.' });
          this.accountForm.patchValue({ oldPassword: '', newPassword: '', confirmPassword: '' });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'No se pudo guardar', detail: err?.message || 'Intenta nuevamente más tarde.' });
        }
      });
  }

  private prefillForm(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      return;
    }

    const fullName = this.currentUser.nombre ?? this.currentUser.identityInfo?.['nombre'] ?? '';
    const [firstName, ...rest] = fullName.split(' ');
    const apellidos = this.currentUser.apellidos ?? rest.join(' ');
    const [primerApellido, segundoApellido] = (apellidos || '').split(' ');

    this.accountForm.patchValue({
      nombres: fullName || this.currentUser.email || '',
      primerApellido: primerApellido || '',
      segundoApellido: segundoApellido || '',
      telefono: this.currentUser.identityInfo?.['telefono'] || '',
      email: this.currentUser.email || ''
    });
  }
}
