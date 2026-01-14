import { Injectable, computed, signal } from '@angular/core';
import { take } from 'rxjs/operators';
import { ContribuyentesService } from '../../../core/services/contribuyentes.service';
import { AuthService } from '../../../core/services/auth.service';

interface DocumentSummary {
  total: number;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class DashboardDocumentsService {
  private readonly summarySignal = signal<DocumentSummary>({ total: 0 });
  private readonly loadingSignal = signal(false);
  private loaded = false;

  readonly summary = computed(() => this.summarySignal());
  readonly totalDocuments = computed(() => this.summary().total);
  readonly isLoading = computed(() => this.loadingSignal());

  constructor(
    private readonly contribuyentesService: ContribuyentesService,
    private readonly authService: AuthService
  ) {}

  load(force = false): void {
    if (this.loadingSignal() || (!force && this.loaded)) {
      return;
    }

    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      this.summarySignal.set({ total: 0 });
      return;
    }

    this.loadingSignal.set(true);

    this.contribuyentesService
      .getArchivosContribuyente(contribuyenteId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const total = response?.length ?? 0;
          this.summarySignal.set({ total, updatedAt: new Date() });
          this.loaded = true;
          this.loadingSignal.set(false);
        },
        error: () => {
          this.summarySignal.set({ total: 0 });
          this.loadingSignal.set(false);
        }
      });
  }
}
