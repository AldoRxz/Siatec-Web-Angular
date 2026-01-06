import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService, ContribucionesService } from '../../../core/services';
import { Determinacion } from '../../../core/models/contribuciones.model';

type EstadoDeterminacion = 'Pagado' | 'Pendiente' | 'Vencido' | string;

@Component({
  selector: 'app-dashboard-determinaciones',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './determinaciones.component.html',
  styleUrl: './determinaciones.component.scss'
})
export class DeterminacionesComponent implements OnInit {
  private readonly contribucionesService = inject(ContribucionesService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly determinaciones = signal<Determinacion[]>([]);
  readonly hasDeterminaciones = computed(() => this.determinaciones().length > 0);

  ngOnInit(): void {
    this.cargarDeterminaciones();
  }

  cargarDeterminaciones(): void {
    const user = this.authService.currentUser();
    if (!user?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener información del usuario'
      });
      return;
    }

    this.loading.set(true);
    
    // Convertir el ID a string para usarlo como usuarioId
    const usuarioId = typeof user.id === 'string' ? user.id : user.id.toString();
    
    this.contribucionesService.getDeterminacionesPorUsuario(usuarioId)
      .subscribe({
        next: (data) => {
          console.log('Determinaciones recibidas:', data);
          this.determinaciones.set(data);
          this.loading.set(false);
          
          if (data.length === 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'Sin determinaciones',
              detail: 'No se encontraron determinaciones para este usuario'
            });
          }
        },
        error: (err) => {
          console.error('Error al cargar determinaciones:', err);
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las determinaciones'
          });
        }
      });
  }

  trackByDeterminacion(_: number, item: Determinacion): number {
    return item.id;
  }

  estadoTag(estado?: EstadoDeterminacion): 'success' | 'warn' | 'danger' | 'info' {
    if (!estado) {
      return 'info';
    }
    const normalized = estado.toLowerCase();
    if (normalized.includes('pag')) {
      return 'success';
    }
    if (normalized.includes('pend')) {
      return 'warn';
    }
    if (normalized.includes('venc')) {
      return 'danger';
    }
    return 'info';
  }

  formatMonto(monto?: number): string {
    if (monto == null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  formatFecha(fecha?: string): string {
    if (!fecha) {
      return 'N/A';
    }
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  getNombreContribucion(det: Determinacion): string {
    return det.contribucionInstance?.contribucionNombre || 'Sin nombre';
  }

  getTipoContribucion(det: Determinacion): string {
    if (!det.contribucionInstance) return 'N/A';
    const instance = det.contribucionInstance as Record<string, any>;
    return instance['tipo'] || 'N/A';
  }
}
