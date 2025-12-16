import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService, ContribucionesService } from '../../../core/services';
import {
  Determinacion,
  ContribucionVersion,
  ContribucionMetadata,
  DeterminacionCalculoData,
  DeterminacionCalculoRequest
} from '../../../core/models/contribuciones.model';

type OperacionEstado = 'Pagado' | 'Pendiente' | 'Vencido' | string;

interface DynamicField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { label: string; value: string }[];
}

@Component({
  selector: 'app-dashboard-contribuciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    Select,
    InputTextModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './contribuciones.component.html',
  styleUrl: './contribuciones.component.scss'
})
export class ContribucionesComponent implements OnInit {
  private readonly contribucionesService = inject(ContribucionesService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly modalVisible = signal(false);
  readonly calculating = signal(false);
  readonly operaciones = signal<Determinacion[]>([]);
  readonly resultado = signal<DeterminacionCalculoData | null>(null);
  readonly campos = signal<DynamicField[]>([]);
  readonly form = signal<FormGroup>(this.fb.group({}));

  readonly hasOperaciones = computed(() => this.operaciones().length > 0);

  private versionActiva: ContribucionVersion | null = null;
  private determinacionSeleccionada: Determinacion | null = null;

  ngOnInit(): void {
    this.cargarOperaciones();
  }

  trackByDeterminacion(_: number, item: Determinacion): number {
    return item.id;
  }

  estadoTag(estado?: OperacionEstado): 'success' | 'warn' | 'danger' | 'info' {
    if (!estado) {
      return 'info';
    }
    const normalized = estado.toLowerCase();
    if (normalized.includes('pag')) {
      return 'success';
    }
    if (normalized.includes('venc')) {
      return 'danger';
    }
    return 'warn';
  }

  abrirDeterminacion(item: Determinacion): void {
    this.determinacionSeleccionada = item;
    this.resultado.set(null);
    this.obtenerMetadata(item.contribucionId);
  }

  enviarCalculo(): void {
    const formGroup = this.form();
    if (!formGroup.valid || !this.determinacionSeleccionada || !this.versionActiva) {
      formGroup.markAllAsTouched();
      return;
    }

    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      this.messageService.add({ severity: 'error', summary: 'Sesión', detail: 'No pudimos identificar al contribuyente.' });
      return;
    }

    const payload: DeterminacionCalculoRequest = {
      determinacionId: this.determinacionSeleccionada.id,
      contribucionId: this.determinacionSeleccionada.contribucionId,
      contribuyenteId,
      versionId: this.versionActiva.id,
      year: this.versionActiva.year ?? new Date().getFullYear(),
      periodo: this.determinacionSeleccionada.periodo ?? this.versionActiva.periodo ?? 'Mensual',
      data: formGroup.getRawValue()
    };

    this.calculating.set(true);
    this.contribucionesService
      .calcularDeterminacionCalculo(payload)
      .pipe(finalize(() => this.calculating.set(false)))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            this.resultado.set(response.data);
          }
          this.messageService.add({ severity: 'success', summary: 'Determinación generada', detail: response?.message || 'Cálculo completado.' });
          this.cargarOperaciones();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error en cálculo', detail: err?.message || 'No pudimos ejecutar la determinación.' });
        }
      });
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
    this.determinacionSeleccionada = null;
    this.versionActiva = null;
    this.campos.set([]);
    this.form().reset();
  }

  formatCurrency(value?: number | string): string {
    if (value === null || value === undefined || value === '') {
      return '$0.00';
    }
    const amount = typeof value === 'string' ? Number(value) : value;
    return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  private cargarOperaciones(): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      this.messageService.add({ severity: 'warn', summary: 'Sesión', detail: 'Inicia sesión para consultar tus determinaciones.' });
      return;
    }
    this.loading.set(true);
    this.contribucionesService
      .getDeterminacionesPorContribuyente(contribuyenteId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.operaciones.set(items ?? []),
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'No se pudo cargar', detail: err?.message || 'Intenta de nuevo más tarde.' });
        }
      });
  }

  private obtenerMetadata(contribucionId: number): void {
    this.loading.set(true);
    this.contribucionesService
      .getContribucionActiva(contribucionId)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((error) => {
          this.messageService.add({ severity: 'error', summary: 'Contribución', detail: error?.message || 'No pudimos obtener la versión activa.' });
          return of(null);
        })
      )
      .subscribe((version) => {
        if (!version) {
          return;
        }
        this.versionActiva = version;
        const metadata = this.parseMetadata(version.metadata);
        const campos = this.mapMetadata(metadata);
        if (!campos.length) {
          this.messageService.add({ severity: 'warn', summary: 'Formulario', detail: 'La contribución no tiene campos configurados.' });
          return;
        }
        this.campos.set(campos);
        const group = this.fb.group({});
        campos.forEach((campo) => {
          group.addControl(campo.name, this.fb.control('', Validators.required));
        });
        this.form.set(group);
        this.modalVisible.set(true);
      });
  }

  private parseMetadata(metadata: ContribucionMetadata | string | null | undefined): ContribucionMetadata {
    if (!metadata) {
      return {};
    }
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return {};
      }
    }
    return metadata;
  }

  private mapMetadata(metadata: ContribucionMetadata): DynamicField[] {
    const atributos = metadata?.atributos;
    if (!Array.isArray(atributos)) {
      return [];
    }
    return atributos.map((atributo, index) => {
      const tipo = Number(atributo.tipo);
      let fieldType: DynamicField['type'] = 'text';
      if (tipo === 1) {
        fieldType = 'number';
      } else if (tipo === 2) {
        fieldType = 'select';
      }
      const options = Array.isArray(atributo.values)
        ? atributo.values.map((value) => ({ label: String(value), value: String(value) }))
        : undefined;
      return {
        name: atributo.nombre || `campo_${index}`,
        label: atributo.Descripcion || atributo.descripcion || atributo.nombre || `Campo ${index + 1}`,
        type: fieldType,
        options
      };
    });
  }
}
