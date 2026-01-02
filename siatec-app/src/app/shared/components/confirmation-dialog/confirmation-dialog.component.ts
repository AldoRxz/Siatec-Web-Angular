import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

/**
 * Servicio helper para diálogos de confirmación
 * Wrapper alrededor de ConfirmationService de PrimeNG
 */
export class ConfirmationDialogService {
  private confirmationService = inject(ConfirmationService);

  /**
   * Muestra un diálogo de confirmación
   * 
   * @example
   * ```typescript
   * this.confirmDialog.confirm({
   *   message: '¿Está seguro de eliminar este registro?',
   *   header: 'Confirmar eliminación',
   *   icon: 'pi pi-exclamation-triangle',
   *   acceptLabel: 'Sí, eliminar',
   *   rejectLabel: 'Cancelar',
   *   accept: () => this.deleteRecord()
   * });
   * ```
   */
  confirm(config: {
    message: string;
    header?: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    acceptButtonStyleClass?: string;
    rejectButtonStyleClass?: string;
    accept?: () => void;
    reject?: () => void;
  }) {
    this.confirmationService.confirm({
      message: config.message,
      header: config.header || 'Confirmación',
      icon: config.icon || 'pi pi-question-circle',
      acceptLabel: config.acceptLabel || 'Sí',
      rejectLabel: config.rejectLabel || 'No',
      acceptButtonStyleClass: config.acceptButtonStyleClass || 'p-button-danger',
      rejectButtonStyleClass: config.rejectButtonStyleClass || 'p-button-secondary',
      accept: config.accept,
      reject: config.reject
    });
  }

  /**
   * Diálogo de confirmación para eliminación
   */
  confirmDelete(itemName: string, onConfirm: () => void) {
    this.confirm({
      message: `¿Está seguro de eliminar "${itemName}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: onConfirm
    });
  }

  /**
   * Diálogo de confirmación para guardar cambios
   */
  confirmSave(onConfirm: () => void, onReject?: () => void) {
    this.confirm({
      message: '¿Desea guardar los cambios realizados?',
      header: 'Guardar Cambios',
      icon: 'pi pi-save',
      acceptLabel: 'Guardar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: onConfirm,
      reject: onReject
    });
  }
}

/**
 * Componente contenedor para el diálogo de confirmación
 * Debe incluirse una vez en el componente raíz o layout
 * 
 * @example
 * ```typescript
 * // En app.ts o layout component
 * <app-confirmation-dialog />
 * ```
 */
@Component({
  selector: 'app-confirmation-dialog',
  imports: [CommonModule, ConfirmDialogModule],
  template: `<p-confirmDialog />`,
  providers: [ConfirmationService]
})
export class ConfirmationDialogComponent {}
