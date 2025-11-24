import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/**
 * Componente reutilizable para mostrar indicadores de carga
 * 
 * @example
 * ```typescript
 * <app-loading-spinner 
 *   [loading]="isLoading"
 *   message="Cargando datos..."
 *   [overlay]="true"
 * />
 * ```
 */
@Component({
  selector: 'app-loading-spinner',
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div [class]="overlay() ? 'loading-overlay' : 'loading-container'">
        <div class="spinner-wrapper">
          <p-progressSpinner
            [style]="{ width: size() + 'px', height: size() + 'px' }"
            styleClass="custom-spinner"
            strokeWidth="4"
            fill="transparent"
            animationDuration="1s"
          />
          @if (message()) {
            <p class="loading-message">{{ message() }}</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-message {
      color: white;
      font-size: 1rem;
      margin: 0;
      text-align: center;
    }

    .loading-container .loading-message {
      color: #495057;
    }
  `]
})
export class LoadingSpinnerComponent {
  loading = input<boolean>(true);
  message = input<string>('');
  overlay = input<boolean>(false);
  size = input<number>(60);
}
