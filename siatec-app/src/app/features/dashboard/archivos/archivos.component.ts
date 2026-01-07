import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService, ContribuyentesService } from '../../../core/services';
import { ArchivoContribuyente } from '../../../core/models/contribuyente.model';
import { DashboardNotificationsService } from '../services/dashboard-notifications.service';
import { ArchivosService, ArchivoDto } from '../services/archivos.service';

type DocCategory = 'OBLIGATORIO' | 'OPCIONAL' | 'INACTIVO';

interface ArchivoResumen {
  id: number;
  nombre: string;
  nombreOriginal?: string;
  tamanoBytes?: number;
  fechaSubida?: string;
  tipoMime?: string;
}

interface DocumentoCatalogo {
  tipoId: number;
  nombre: string;
  requerido: boolean;
  multiple: boolean;
  activo: boolean;
  categoria: DocCategory;
  icono: string;
  archivos: ArchivoResumen[];
}

@Component({
  selector: 'app-dashboard-archivos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    Select,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './archivos.component.html',
  styleUrl: './archivos.component.scss'
})
export class ArchivosComponent implements OnInit {
  private readonly contribuyentesService = inject(ContribuyentesService);
  private readonly authService = inject(AuthService);
  private readonly archivosService = inject(ArchivosService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notificationsService = inject(DashboardNotificationsService);

  private readonly filters = signal<{ tipo: string; nombre: string }>({ tipo: '', nombre: '' });
  private readonly documentsSignal = signal<DocumentoCatalogo[]>([]);
  private readonly expandedDocs = signal<Set<number>>(new Set());
  private readonly archivosBackend = signal<ArchivoDto[]>([]);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly renameVisible = signal(false);

  readonly filterForm = this.fb.nonNullable.group({
    tipo: [''],
    nombre: ['']
  });

  readonly renameForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]]
  });

  readonly tipoOptions = computed(() => {
    const docs = this.documentsSignal();
    const unique = new Map<number, string>();
    docs.forEach((doc) => unique.set(doc.tipoId, doc.nombre));
    return Array.from(unique.entries()).map(([value, label]) => ({ label, value: value.toString() }));
  });

  readonly filteredDocuments = computed(() => {
    const { tipo, nombre } = this.filters();
    const search = nombre.trim().toLowerCase();
    const docs = this.documentsSignal();
    const orderedCategories: DocCategory[] = ['OBLIGATORIO', 'OPCIONAL', 'INACTIVO'];

    return docs
      .filter((doc) => {
        if (tipo && String(doc.tipoId) !== tipo) {
          return false;
        }
        if (search) {
          const matchesDocument = doc.nombre.toLowerCase().includes(search);
          const matchesFiles = doc.archivos.some(
            (file) =>
              file.nombre?.toLowerCase().includes(search) ||
              file.nombreOriginal?.toLowerCase().includes(search)
          );
          if (!matchesDocument && !matchesFiles) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const order = orderedCategories.indexOf(a.categoria) - orderedCategories.indexOf(b.categoria);
        if (order !== 0) {
          return order;
        }
        return a.nombre.localeCompare(b.nombre, 'es');
      });
  });

  private renameContext: { docId: number; fileId: number } | null = null;

  ngOnInit(): void {
    this.loadArchivosFromBackend();
    this.loadCatalog(true);
  }

  applyFilters(): void {
    this.filters.set({ ...this.filterForm.getRawValue() });
  }

  resetFilters(): void {
    this.filterForm.reset({ tipo: '', nombre: '' });
    this.filters.set({ tipo: '', nombre: '' });
  }

  getUploadedCount(): number {
    return this.documentsSignal().filter(doc => doc.archivos.length > 0).length;
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  isExpanded(doc: DocumentoCatalogo): boolean {
    return this.expandedDocs().has(doc.tipoId);
  }

  toggleExpanded(doc: DocumentoCatalogo): void {
    const clone = new Set(this.expandedDocs());
    if (clone.has(doc.tipoId)) {
      clone.delete(doc.tipoId);
    } else {
      clone.add(doc.tipoId);
    }
    this.expandedDocs.set(clone);
  }

  documentStatus(doc: DocumentoCatalogo): { label: string; severity: 'success' | 'warn' | 'danger' | 'info' } {
    if (!doc.activo) {
      return { label: 'Inactivo', severity: 'info' };
    }
    if (doc.archivos.length) {
      return { label: 'Subido', severity: 'success' };
    }
    if (doc.requerido) {
      return { label: 'Pendiente', severity: 'warn' };
    }
    return { label: 'Opcional', severity: 'info' };
  }

  formatBytes(bytes?: number): string {
    if (!bytes && bytes !== 0) {
      return '-';
    }
    if (bytes === 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx++;
    }
    return `${value.toFixed(value < 10 && idx > 0 ? 1 : 0)} ${units[idx]}`;
  }

  onUploadSelected(doc: DocumentoCatalogo, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) {
      return;
    }
    if (!doc.multiple && files.length > 1) {
      this.messageService.add({ severity: 'warn', summary: 'Documento único', detail: 'Solo puedes subir un archivo para este requisito.' });
      return;
    }
    const contribuyenteId = this.requireContribuyenteId();
    const formData = new FormData();
    formData.set('tipoDocumentoId', doc.tipoId.toString());
    files.forEach((file) => formData.append('archivos', file));
    if (files.length === 1) {
      formData.set('nombre', this.stripExtension(files[0].name));
    }

    this.loading.set(true);
    this.contribuyentesService
      .subirArchivo(contribuyenteId, formData)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Archivo cargado', detail: 'El documento se subió correctamente.' });
          this.notificationsService.addNotification(`📁 Subiste ${files.length} archivo${files.length > 1 ? 's' : ''} a ${doc.nombre}.`);
          this.loadCatalog();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error al subir', detail: err?.message || 'No pudimos subir el archivo.' });
        }
      });
  }

  viewFile(doc: DocumentoCatalogo, file: ArchivoResumen): void {
    const contribuyenteId = this.requireContribuyenteId();
    this.contribuyentesService.descargarArchivo(contribuyenteId, file.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const mime = file.tipoMime || blob.type || 'application/octet-stream';
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Vista previa', detail: `No se pudo abrir ${file.nombre}.` });
      }
    });
  }

  downloadFile(doc: DocumentoCatalogo, file: ArchivoResumen): void {
    const contribuyenteId = this.requireContribuyenteId();
    this.archivosService.downloadArchivo(file.id, contribuyenteId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = file.nombreOriginal || file.nombre;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Descarga exitosa', 
          detail: `${file.nombre} descargado correctamente.` 
        });
      },
      error: () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de descarga', 
          detail: `No se pudo descargar ${file.nombre}.` 
        });
      }
    });
  }

  confirmDelete(doc: DocumentoCatalogo, file: ArchivoResumen): void {
    this.confirmationService.confirm({
      header: 'Eliminar archivo',
      message: `¿Eliminar "${file.nombre}" del documento "${doc.nombre}"?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteFile(doc, file)
    });
  }

  openRenameDialog(doc: DocumentoCatalogo, file: ArchivoResumen): void {
    this.renameContext = { docId: doc.tipoId, fileId: file.id };
    this.renameForm.patchValue({ nombre: file.nombre });
    this.renameVisible.set(true);
  }

  closeRenameDialog(): void {
    this.renameVisible.set(false);
    this.renameContext = null;
  }

  submitRename(): void {
    if (!this.renameForm.valid || !this.renameContext) {
      return;
    }
    const nuevoNombre = this.renameForm.controls.nombre.value.trim();
    const contribuyenteId = this.requireContribuyenteId();
    this.loading.set(true);
    this.archivosService
      .renameArchivo(this.renameContext.fileId, nuevoNombre, contribuyenteId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Nombre actualizado', 
            detail: 'El archivo fue renombrado correctamente.' 
          });
          this.closeRenameDialog();
          this.loadArchivosFromBackend();
        },
        error: (err) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'No se pudo renombrar', 
            detail: err?.message || 'Intenta nuevamente.' 
          });
        }
      });
  }

  private deleteFile(doc: DocumentoCatalogo, file: ArchivoResumen): void {
    const contribuyenteId = this.requireContribuyenteId();
    this.loading.set(true);
    this.archivosService
      .deleteArchivo(file.id, contribuyenteId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.messageService.add({ 
            severity: 'info', 
            summary: 'Archivo eliminado', 
            detail: `${file.nombre} fue eliminado correctamente.` 
          });
          this.notificationsService.addNotification(`🗑️ Eliminaste ${file.nombre} de ${doc.nombre}.`);
          this.loadArchivosFromBackend();
        },
        error: (err) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'No se pudo eliminar', 
            detail: err?.message || 'Intenta nuevamente.' 
          });
        }
      });
  }

  private loadCatalog(initial = false): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      // No mostrar error, simplemente no cargar nada hasta que haya sesión
      return;
    }
    this.loading.set(true);
    this.contribuyentesService
      .getArchivosContribuyente(contribuyenteId, 1, 200)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.documentsSignal.set(this.mapResponse(response));
          if (initial) {
            this.applyFilters();
          }
          this.errorMessage.set(null);
        },
        error: (err) => {
          const detail = err?.message || 'No pudimos cargar los documentos.';
          this.errorMessage.set(detail);
          this.messageService.add({ severity: 'error', summary: 'Catálogo de documentos', detail });
        }
      });
  }

  private mapResponse(response: any): DocumentoCatalogo[] {
    if (response && Array.isArray(response.documentos)) {
      return response.documentos.map((doc: any) => this.mapDocumento(doc));
    }
    if (Array.isArray(response)) {
      return response.map((doc: any) => this.mapDocumento(doc));
    }
    if (response && Array.isArray(response.items)) {
      return this.mapPaginatedResponse(response.items as ArchivoContribuyente[]);
    }
    return [];
  }

  private mapDocumento(doc: any): DocumentoCatalogo {
    return {
      tipoId: Number(doc.documentTypeId ?? doc.tipoId ?? doc.id ?? 0),
      nombre: doc.nombre || doc.descripcion || 'Documento',
      requerido: Boolean(doc.requerido),
      multiple: Boolean(doc.multiple),
      activo: doc.active !== false,
      categoria: this.resolveCategory(doc),
      icono: this.resolveIcon(doc.nombre),
      archivos: Array.isArray(doc.archivos) ? doc.archivos.map((file: any) => this.mapArchivo(file)) : []
    };
  }

  private mapPaginatedResponse(items: ArchivoContribuyente[]): DocumentoCatalogo[] {
    const groups = new Map<number, DocumentoCatalogo>();
    for (const item of items) {
      const tipoId = Number((item as any).documentTypeId ?? item.contribuyenteId ?? item.id);
      const current = groups.get(tipoId) ?? {
        tipoId,
        nombre: item.tipoDocumento || 'Documento',
        requerido: false,
        multiple: false,
        activo: true,
        categoria: 'OPCIONAL',
        icono: this.resolveIcon(item.tipoDocumento),
        archivos: []
      };
      current.archivos.push({
        id: item.id,
        nombre: item.nombre,
        nombreOriginal: item.nombreOriginal,
        tamanoBytes: item.tamano,
        fechaSubida: item.fechaSubida,
        tipoMime: item.extension
      });
      groups.set(tipoId, current);
    }
    return Array.from(groups.values());
  }

  private mapArchivo(file: any): ArchivoResumen {
    return {
      id: Number(file.id),
      nombre: file.nombre || file.nombreOriginal || 'Archivo',
      nombreOriginal: file.nombreOriginal,
      tamanoBytes: file.tamanoBytes ?? file.tamano,
      fechaSubida: file.fechaSubida ?? file.fechaCarga,
      tipoMime: file.tipoMime || file.mimeType
    };
  }

  private resolveCategory(doc: any): DocCategory {
    if (doc.active === false) {
      return 'INACTIVO';
    }
    return doc.requerido ? 'OBLIGATORIO' : 'OPCIONAL';
  }

  private resolveIcon(nombre?: string | null): string {
    if (!nombre) {
      return 'pi pi-file';
    }
    const rules: Array<{ test: RegExp; icon: string }> = [
      { test: /(ine|identificaci[óo]n)/i, icon: 'pi pi-id-card' },
      { test: /curp/i, icon: 'pi pi-fingerprint' },
      { test: /(constancia|situaci[óo]n fiscal|rfc)/i, icon: 'pi pi-book' },
      { test: /(acta constitutiva|escritura)/i, icon: 'pi pi-briefcase' },
      { test: /(domicilio|comprobante|residencia)/i, icon: 'pi pi-home' },
      { test: /(licencia|funcionamiento)/i, icon: 'pi pi-shield' },
      { test: /(estado de cuenta|bancario)/i, icon: 'pi pi-dollar' }
    ];
    const match = rules.find((rule) => rule.test.test(nombre));
    return match?.icon ?? 'pi pi-file';
  }

  private stripExtension(name: string): string {
    return name.replace(/\.[^.]+$/, '');
  }

  private requireContribuyenteId(): number {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      throw new Error('No se pudo determinar el contribuyente actual.');
    }
    return contribuyenteId;
  }

  private loadArchivosFromBackend(): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      console.warn('[Archivos] No se pudo obtener el ID del contribuyente');
      return;
    }

    this.loading.set(true);
    
    this.archivosService.getArchivosByContribuyente(contribuyenteId).subscribe({
      next: (archivos) => {
        console.log('[Archivos] Archivos cargados desde el backend:', archivos);
        this.archivosBackend.set(archivos);
        this.integrarArchivosBackend(archivos);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[Archivos] Error al cargar archivos desde el backend:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error al cargar archivos', 
          detail: 'No se pudieron cargar los archivos del servidor.' 
        });
        this.loading.set(false);
      }
    });
  }

  private integrarArchivosBackend(archivosBackend: ArchivoDto[]): void {
    // Agrupar archivos por catalogoDocumentoId
    const grupos = new Map<number, ArchivoDto[]>();
    
    archivosBackend.forEach(archivo => {
      if (!archivo.isActive) return; // Ignorar archivos inactivos
      
      const key = archivo.catalogoDocumentoId || 0;
      if (!grupos.has(key)) {
        grupos.set(key, []);
      }
      grupos.get(key)!.push(archivo);
    });

    // Actualizar los documentos existentes con los archivos del backend
    const docsActualizados = this.documentsSignal().map(doc => {
      const archivosDelDoc = grupos.get(doc.tipoId) || [];
      return {
        ...doc,
        archivos: archivosDelDoc.map(archivo => ({
          id: archivo.id,
          nombre: archivo.nombreArchivo,
          nombreOriginal: archivo.nombreArchivo,
          tamanoBytes: archivo.tamanioBytes,
          fechaSubida: archivo.fechaSubida,
          tipoMime: this.getMimeTypeFromExtension(archivo.nombreArchivo)
        }))
      };
    });

    this.documentsSignal.set(docsActualizados);
  }

  private getMimeTypeFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  trackDoc(_: number, doc: DocumentoCatalogo): number {
    return doc.tipoId;
  }
}
