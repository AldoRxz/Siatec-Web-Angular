import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, FormControl, FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { StepperModule } from 'primeng/stepper';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AuthService, ContribuyentesService, ContribucionesService } from '../../../core/services';
import { PaccioliService } from '../../../core/services/paccioli.service';
import { DashboardNotificationsService } from '../services/dashboard-notifications.service';
import { InscripcionDocumentosService, DocumentoRequeridoDto } from '../services/inscripcion-documentos.service';
import { DashboardService, ContribuyenteDashboard } from '../services/dashboard.service';
import { FloatLabelFilledDirective } from '../../../shared/directives';
import { StatusActivoComponent } from './components/status-activo/status-activo.component';
import { StatusProcesandoComponent } from './components/status-procesando/status-procesando.component';

interface InscripcionDraft {
  formValue: any;
  regimenes: string[];
  actividades: string[];
  impuestos: string[];
  updatedAt: string;
}

interface InscripcionState {
  id?: number | string;
  status?: string;
  rfc?: string;
  timestamp?: string;
  payload?: any;
}

interface CatalogOption {
  code: string;
  label: string;
}

@Component({
  selector: 'app-inscripcion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    CardModule,
    CheckboxModule,
    ChipModule,
    FloatLabelModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    StepperModule,
    ProgressSpinnerModule,
    TooltipModule,
    FloatLabelFilledDirective,
    StatusActivoComponent,
    StatusProcesandoComponent
  ],
  providers: [MessageService],
  templateUrl: './inscripcion.component.html',
  styleUrl: './inscripcion.component.scss'
})
export class InscripcionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly contribuyentesService = inject(ContribuyentesService);
  private readonly contribucionesService = inject(ContribucionesService);
  private readonly paccioliService = inject(PaccioliService);
  private readonly inscripcionDocumentosService = inject(InscripcionDocumentosService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);
  private readonly notificationsService = inject(DashboardNotificationsService);

  private readonly draftKey = 'inscripcionDraft';
  private readonly processingKey = 'inscripcionProcesando';

  readonly loading = signal(false);
  readonly currentStep = signal(0);
  readonly steps = ['Datos generales', 'Ubicación y contacto', 'Régimen e impuestos', 'Representante', 'Pagos', 'Resumen'];
  
  // Dashboard data para verificar estado
  readonly dashboardData = signal<ContribuyenteDashboard | null>(null);
  readonly loadingDashboard = signal<boolean>(false);
  readonly contribuyenteData = signal<any | null>(null);
  readonly loadingContribuyente = signal<boolean>(false);
  
  // Computed para determinar si debe mostrar el formulario o el mensaje de procesando
  readonly shouldShowForm = computed(() => {
    const data = this.dashboardData();
    if (!data) return true; // Mostrar formulario por defecto mientras carga
    
    // Si está activo, no mostrar formulario
    if (data.activo) return false;
    
    // Si hay solicitud en proceso, no mostrar formulario
    const ultimaSolicitud = data.ultimaSolicitud;
    if (ultimaSolicitud) {
      const estado = ultimaSolicitud.estado?.toLowerCase() || '';
      if (estado === 'pendiente' || estado === 'enviada' || estado === 'procesando') {
        return false;
      }
    }
    
    return true;
  });
  
  // Signals para documentos por sección
  readonly documentosPorSeccion = signal<{[seccion: string]: DocumentoRequeridoDto[]}>({});
  readonly cargandoDocumentos = signal(false);
  readonly subiendoArchivo = signal(false);
  readonly archivosSubidos = signal<any[]>([]);
  readonly cargandoArchivos = signal(false);
  
  // Map de secciones del stepper a nombres de documentos
  private readonly seccionesDocumentos: {[step: number]: string} = {
    0: 'Identificacion',
    1: 'DomicilioFiscal',
    2: 'RegimenYActividades',
    3: 'Impuestos',
    4: 'RepresentanteLegal',
    5: 'PersonaEfectuaraPagos'
  };

  // RFC validation signals
  readonly rfcValue = signal('');
  readonly tipoPersona = signal<'fisica' | 'moral' | null>(null);
  readonly rfcValidado = signal(false);
  readonly rfcError = signal<string | null>(null);
  readonly mostrarFormulario = signal(false);

  readonly regimenControl = this.fb.control('');
  readonly actividadControl = this.fb.control('');
  regimenInput = '';
  actividadInput = '';
  readonly regimenes = signal<string[]>([]);
  readonly actividades = signal<string[]>([]);
  readonly impuestosCatalog = signal<any[]>([]);
  readonly impuestosSeleccionados = signal<string[]>([]); // Nombres para mostrar
  readonly contribucionIds = signal<number[]>([]); // IDs para enviar al backend

  readonly form = this.fb.group({
    tipoPersona: this.fb.nonNullable.control<'fisica' | 'moral'>('fisica'),
    identificacion: this.fb.group({
      nombres: ['', Validators.required],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      razonSocial: [''],
      rfc: ['', [Validators.required, Validators.minLength(12)]],
      curp: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      telefonoAlterno: ['']
    }),
    domicilio: this.fb.group({
      calle: ['', Validators.required],
      numeroExterior: ['', Validators.required],
      numeroInterior: [''],
      colonia: ['', Validators.required],
      cp: ['', [Validators.required, Validators.minLength(5)]],
      municipio: ['', Validators.required],
      estado: ['', Validators.required],
      entreCalles: [''],
      referencias: ['']
    }),
    fechas: this.fb.group({
      inicioOperaciones: ['', Validators.required],
      registroIMSS: ['']
    }),
    representante: this.fb.group({
      nombres: [''],
      primerApellido: [''],
      segundoApellido: [''],
      rfc: [''],
      curp: ['']
    }),
    pagos: this.fb.group({
      nombre: [''],
      telefono: [''],
      correo: ['', Validators.email],
      domicilio: ['']
    })
  });

  readonly personaDescripcion = computed(() => (this.form.controls.tipoPersona.value === 'fisica' ? 'persona física' : 'persona moral'));
  readonly draftUpdatedAt = signal<Date | null>(null);
  readonly processingState = signal<InscripcionState | null>(null);
  readonly contribucionesSeleccionadasDetalle = computed(() => {
    const ids = this.contribucionIds();
    const catalogo = this.impuestosCatalog();
    return catalogo.filter(c => ids.includes(c.id));
  });

  ngOnInit(): void {
    this.setupPersonaWatcher();
    this.loadDraft();
    this.loadProcessingState();
    this.prefillFromUser();
    this.loadDashboardData(); // Cargar estado del dashboard
    this.loadContribuciones(); // Cargar contribuciones desde la API
    // NO cargar documentos aquí - esperamos a que el usuario valide su RFC primero
    
    // Cargar archivos subidos si el usuario ya está autenticado
    const contribuyenteId = this.authService.getContribuyenteId();
    if (contribuyenteId) {
      this.cargarArchivosSubidos();
    }
  }

  /**
   * Carga los documentos de una sección específica
   * Se llama al cambiar de paso en el stepper
   */
  cargarDocumentosSeccion(stepIndex: number): void {
    const seccion = this.seccionesDocumentos[stepIndex];
    if (!seccion) {
      console.log(`No hay sección de documentos para el paso ${stepIndex}`);
      return;
    }

    // NO cargar documentos si aún no se muestra el formulario (RFC no validado)
    if (!this.mostrarFormulario()) {
      console.log('Formulario no visible aún, omitiendo carga de documentos');
      return;
    }

    this.cargandoDocumentos.set(true);
    const tipoPersona = this.form.controls.tipoPersona.value;
    
    console.log(`Cargando documentos de sección: ${seccion} para ${tipoPersona}`);
    
    const request$ = tipoPersona === 'fisica' 
      ? this.inscripcionDocumentosService.getDocumentosFisica(seccion)
      : this.inscripcionDocumentosService.getDocumentosMoral(seccion);
    
    request$.pipe(
      finalize(() => this.cargandoDocumentos.set(false))
    ).subscribe({
      next: (response) => {
        console.log(`Documentos cargados para ${seccion}:`, response.documentos);
        if (response.documentos && response.documentos.length > 0) {
          this.documentosPorSeccion.update(docs => ({ 
            ...docs, 
            [seccion]: response.documentos 
          }));
        }
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
        this.messageService.add({ 
          severity: 'warn', 
          summary: 'Documentos', 
          detail: 'No se pudieron cargar los documentos requeridos para esta sección.' 
        });
      }
    });
  }

  /**
   * Sube un archivo para un documento específico y lo procesa con Paccioli
   */
  async subirArchivo(event: Event, catalogoDocumentoId: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'No se pudo identificar el contribuyente.' 
      });
      return;
    }

    console.log('📤 Subiendo archivo con catalogoDocumentoId:', catalogoDocumentoId);
    this.subiendoArchivo.set(true);
    
    // 1. Subir el archivo al backend
    this.inscripcionDocumentosService.uploadDocumento(contribuyenteId, file, catalogoDocumentoId)
      .pipe(finalize(() => {
        // Limpiar el input al final de todo el proceso
        input.value = '';
      }))
      .subscribe({
        next: async (response) => {
          console.log('Archivo subido:', response);
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Archivo subido', 
            detail: `${file.name} se subió correctamente.` 
          });
          
          // 2. Procesar con Paccioli para extraer información
          await this.procesarArchivoConPaccioliEnSeccion(file, this.currentStep());
          
          // 3. Recargar lista de archivos
          this.cargarArchivosSubidos();
          
          this.subiendoArchivo.set(false);
        },
        error: (error) => {
          console.error('Error al subir archivo:', error);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error al subir', 
            detail: error?.error?.mensaje || 'No se pudo subir el archivo.' 
          });
          this.subiendoArchivo.set(false);
        }
      });
  }

  /**
   * Procesa un archivo con Paccioli enviando los campos actuales de la sección
   */
  private async procesarArchivoConPaccioliEnSeccion(file: File, stepIndex: number): Promise<void> {
    if (!file) return;

    try {
      // Obtener el FormGroup de la sección actual
      const currentFormGroup = this.getCurrentFormGroup(stepIndex);
      const currentFormValue = currentFormGroup?.value || {};
      
      console.log('Enviando a Paccioli - Archivo:', file.name);
      console.log('Enviando a Paccioli - Campos actuales:', currentFormValue);
      
      // Procesar con Paccioli
      const response = await this.paccioliService.procesarArchivos([file], currentFormValue);
      
      console.log('Respuesta de Paccioli:', response);
      
      // Rellenar campos con la respuesta - verificar múltiples estructuras posibles
      if (response?.payload || response?.data || response?.extractedFields) {
        this.rellenarCamposDesdeRespuesta(response, stepIndex);
        
        this.messageService.add({
          severity: 'info',
          summary: 'Campos actualizados',
          detail: 'Se extrajeron datos del documento y se rellenaron los campos automáticamente'
        });
      } else {
        console.warn('Respuesta de Paccioli sin payload/data/extractedFields');
      }
    } catch (error: any) {
      console.error('Error al procesar archivo con Paccioli:', error);
      // No mostramos error crítico aquí ya que el archivo ya se subió exitosamente
      console.warn('No se pudo procesar con Paccioli, pero el archivo se subió correctamente');
    }
  }

  /**
   * Obtiene los documentos de la sección actual
   */
  getDocumentosSeccionActual(): DocumentoRequeridoDto[] {
    const seccion = this.seccionesDocumentos[this.currentStep()];
    return seccion ? (this.documentosPorSeccion()[seccion] || []) : [];
  }

  /**
   * Determina si se debe mostrar la sección de documentos para un paso dado
   */
  mostrarSeccionDocumentos(stepIndex: number): boolean {
    const seccion = this.seccionesDocumentos[stepIndex];
    if (!seccion) return false;
    
    const documentos = this.documentosPorSeccion()[seccion] || [];
    return documentos.length > 0;
  }

  /**
   * Maneja la selección de un archivo por el usuario
   * Determina automáticamente el catalogoDocumentoId basado en el stepIndex
   */
  onFileSelected(event: Event, stepIndex: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Obtener los documentos de la sección actual
    const seccion = this.seccionesDocumentos[stepIndex];
    console.log('📁 onFileSelected - Sección:', seccion, 'StepIndex:', stepIndex);
    
    if (!seccion) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Sin documentos', 
        detail: 'Esta sección no tiene documentos configurados.' 
      });
      return;
    }

    const documentos = this.documentosPorSeccion()[seccion] || [];
    console.log('📋 Documentos de la sección:', documentos);
    
    if (documentos.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Sin documentos', 
        detail: 'No hay documentos disponibles para esta sección.' 
      });
      return;
    }

    // Por ahora, usamos el primer documento de la lista
    // En el futuro, podrías mostrar un selector si hay múltiples documentos
    const primerDocumento = documentos[0];
    console.log('📄 Primer documento seleccionado:', primerDocumento);
    console.log('🆔 catalogoDocumentoId:', primerDocumento.catalogoDocumentoId);
    
    // Llamar a subirArchivo con el catalogoDocumentoId
    this.subirArchivo(event, primerDocumento.catalogoDocumentoId);
  }

  /**
   * Carga los archivos subidos del contribuyente
   */
  cargarArchivosSubidos(): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) return;

    this.cargandoArchivos.set(true);
    this.inscripcionDocumentosService.getArchivos(contribuyenteId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoArchivos.set(false))
      )
      .subscribe({
        next: (archivos) => {
          console.log('✅ Archivos cargados del backend:', archivos);
          // Enriquecer archivos con nombre del catálogo
          const archivosConCatalogo = archivos.map(archivo => {
            const nombreCatalogo = archivo.catalogoDocumento?.nombre || 
                                  this.obtenerNombreCatalogo(archivo.catalogoDocumentoId) ||
                                  'Documento';
            console.log(`📄 Archivo: ${archivo.nombreArchivo}, Catálogo: ${nombreCatalogo}`);
            return {
              ...archivo,
              nombreCatalogo
            };
          });
          console.log('📋 Archivos enriquecidos:', archivosConCatalogo);
          this.archivosSubidos.set(archivosConCatalogo);
        },
        error: (error) => {
          console.error('❌ Error al cargar archivos:', error);
        }
      });
  }

  /**
   * Obtiene el nombre del catálogo de documentos por ID
   */
  obtenerNombreCatalogo(catalogoDocumentoId: number | null): string {
    if (!catalogoDocumentoId) return '';
    
    // Buscar en todos los documentos por sección
    const todasSecciones = Object.values(this.documentosPorSeccion());
    for (const seccion of todasSecciones) {
      const documento = seccion.find(d => d.catalogoDocumentoId === catalogoDocumentoId);
      if (documento?.catalogoDocumento?.nombre) {
        return documento.catalogoDocumento.nombre;
      }
    }
    return '';
  }

  /**
   * Busca si existe un archivo subido para un catalogoDocumentoId específico
   */
  obtenerArchivoSubidoPorCatalogo(catalogoDocumentoId: number): any | null {
    const archivos = this.archivosSubidos();
    return archivos.find(a => a.catalogoDocumentoId === catalogoDocumentoId) || null;
  }

  /**
   * Verifica si un documento ya fue subido
   */
  documentoYaSubido(catalogoDocumentoId: number): boolean {
    return this.obtenerArchivoSubidoPorCatalogo(catalogoDocumentoId) !== null;
  }

  /**
   * Elimina un archivo subido
   */
  eliminarArchivo(archivoId: number): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) return;

    this.inscripcionDocumentosService.deleteArchivo(contribuyenteId, archivoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Archivo eliminado', 
            detail: 'El archivo se eliminó correctamente.' 
          });
          this.cargarArchivosSubidos();
        },
        error: (error) => {
          console.error('Error al eliminar archivo:', error);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error al eliminar', 
            detail: error?.error?.mensaje || 'No se pudo eliminar el archivo.' 
          });
        }
      });
  }

  /**
   * Previsualiza o descarga un archivo
   */
  previsualizarArchivo(archivo: any): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) return;

    this.inscripcionDocumentosService.downloadArchivo(contribuyenteId, archivo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          
          // Detectar tipo de archivo
          const extension = archivo.nombreArchivo.split('.').pop()?.toLowerCase();
          const isPdf = extension === 'pdf';
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
          
          if (isPdf || isImage) {
            // Abrir en nueva pestaña para previsualizar
            window.open(url, '_blank');
          } else {
            // Descargar archivo
            const a = document.createElement('a');
            a.href = url;
            a.download = archivo.nombreArchivo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Descarga iniciada', 
              detail: `Descargando ${archivo.nombreArchivo}` 
            });
          }
        },
        error: (error) => {
          console.error('Error al descargar archivo:', error);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error al descargar', 
            detail: error?.error?.mensaje || 'No se pudo descargar el archivo.' 
          });
        }
      });
  }

  /**
   * Maneja el cambio de paso en el stepper
   * Carga automáticamente los documentos de la nueva sección
   */
  onStepChange(event: any): void {
    // PrimeNG stepper usa 'value' (1-based), no 'index' (0-based)
    const newStep = (event.value || event.index || 1) - 1; // Convertir a 0-based
    console.log('onStepChange llamado, valor:', event.value || event.index, 'paso calculado:', newStep);
    this.currentStep.set(newStep);
    this.cargarDocumentosSeccion(newStep);
    this.cargarArchivosSubidos();
  }

  /**
   * Navega a un paso específico y carga sus documentos
   * Wrapper para activateCallback de PrimeNG
   */
  goToStep(stepValue: number, activateCallback: (value: number) => void): void {
    console.log('goToStep llamado con valor:', stepValue);
    const stepIndex = stepValue - 1; // Convertir a 0-based
    this.currentStep.set(stepIndex);
    activateCallback(stepValue);
    this.cargarDocumentosSeccion(stepIndex);
    this.cargarArchivosSubidos();
    
    // Cargar contribuciones cuando se llega al paso 4 (Selecciona las Contribuciones)
    if (stepValue === 4) {
      console.log('📍 Llegando al paso de contribuciones, cargando catálogo...');
      this.loadContribuciones();
    }
  }

  /**
   * Procesa un archivo subido usando Paccioli
   * Extrae información y rellena los campos del formulario
   */
  async procesarArchivoConPaccioli(file: File, stepIndex: number): Promise<void> {
    if (!file) return;

    this.subiendoArchivo.set(true);
    
    try {
      // Obtener el objeto del formulario actual para pasarlo como instancia
      const currentFormValue = this.getCurrentFormGroup(stepIndex)?.value || {};
      
      // Procesar con Paccioli
      const response = await this.paccioliService.procesarArchivos([file], currentFormValue);
      
      console.log('Respuesta de Paccioli:', response);
      
      // Rellenar campos con la respuesta - verificar múltiples estructuras posibles
      if (response?.payload || response?.data || response?.extractedFields) {
        this.rellenarCamposDesdeRespuesta(response, stepIndex);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Documento procesado',
          detail: 'Los campos se han rellenado automáticamente con la información extraída'
        });
      } else {
        console.warn('Respuesta de Paccioli sin payload/data/extractedFields');
        this.messageService.add({
          severity: 'warn',
          summary: 'Documento procesado',
          detail: 'El documento se procesó pero no se pudo extraer información'
        });
      }
    } catch (error: any) {
      console.error('Error al procesar archivo con Paccioli:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error al procesar documento',
        detail: error.message || 'No se pudo procesar el documento'
      });
    } finally {
      this.subiendoArchivo.set(false);
    }
  }

  /**
   * Obtiene el FormGroup correspondiente al paso actual
   */
  private getCurrentFormGroup(stepIndex: number): AbstractControl | null {
    switch (stepIndex) {
      case 0: return this.form.controls.identificacion;
      case 1: return this.form.controls.domicilio;
      case 2: return null; // Régimen y actividades (tags)
      case 3: return null; // Impuestos (checkboxes)
      case 4: return this.form.controls.representante;
      case 5: return this.form.controls.pagos;
      default: return null;
    }
  }

  /**
   * Rellena los campos del formulario con la respuesta de Paccioli
   */
  private rellenarCamposDesdeRespuesta(response: any, stepIndex: number): void {
    // La respuesta puede venir en diferentes formatos según la API
    const data = response?.payload || response?.data || response?.extractedFields || {};
    const formGroup = this.getCurrentFormGroup(stepIndex);
    
    console.log('Rellenando campos - Respuesta completa:', response);
    console.log('Rellenando campos - Data extraída:', data);
    
    if (!formGroup) {
      console.warn('No hay FormGroup para el paso:', stepIndex);
      return;
    }

    // Mapeo de campos de Paccioli a campos del formulario
    const fieldMapping: {[key: string]: string} = {
      // Identificación
      'nombre': 'nombres',
      'nombres': 'nombres',
      'apellido_paterno': 'primerApellido',
      'primerApellido': 'primerApellido',
      'apellido_materno': 'segundoApellido',
      'segundoApellido': 'segundoApellido',
      'razon_social': 'razonSocial',
      'razonSocial': 'razonSocial',
      'rfc': 'rfc',
      'curp': 'curp',
      'email': 'email',
      'correo': 'email',
      'telefono': 'telefono',
      'telefonoAlterno': 'telefonoAlterno',
      
      // Domicilio
      'calle': 'calle',
      'numero_exterior': 'numeroExterior',
      'numeroExterior': 'numeroExterior',
      'numero_interior': 'numeroInterior',
      'numeroInterior': 'numeroInterior',
      'colonia': 'colonia',
      'codigo_postal': 'cp',
      'cp': 'cp',
      'municipio': 'municipio',
      'estado': 'estado',
      'entre_calles': 'entreCalles',
      'referencias': 'referencias'
    };

    // Rellenar campos encontrados
    let camposRellenados = 0;
    Object.keys(data).forEach(key => {
      const mappedField = fieldMapping[key];
      if (mappedField && formGroup.get(mappedField)) {
        const value = data[key];
        if (value !== null && value !== undefined && value !== '') {
          formGroup.get(mappedField)?.setValue(value);
          console.log(`✅ Campo ${mappedField} rellenado con: ${value}`);
          camposRellenados++;
        }
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        console.warn(`Campo ${key} no tiene mapeo o no existe en el formulario`);
      }
    });
    
    console.log(`Total de campos rellenados: ${camposRellenados}`);
  }

  /**
   * Validates RFC and determines persona type based on length
   * 12 characters = Persona Moral
   * 13 characters = Persona Física
   */
  /**
   * Handle RFC input changes
   */
  onRfcInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    this.rfcValue.set(value);
    this.rfcError.set(null);
  }

  evaluarRFC(): void {
    const rfc = this.rfcValue().trim().toUpperCase();
    this.rfcValue.set(rfc);
    this.rfcError.set(null);

    if (!rfc) {
      this.rfcError.set('Captura un RFC primero');
      return;
    }

    if (rfc.length !== 12 && rfc.length !== 13) {
      this.rfcError.set(`Longitud inválida (${rfc.length}). Debe ser 12 (Persona Moral) o 13 (Persona Física)`);
      return;
    }

    // Determine persona type
    if (rfc.length === 12) {
      this.tipoPersona.set('moral');
      this.form.controls.tipoPersona.setValue('moral');
    } else {
      this.tipoPersona.set('fisica');
      this.form.controls.tipoPersona.setValue('fisica');
    }

    // Set RFC in form
    this.form.controls.identificacion.controls.rfc.setValue(rfc);
    this.rfcValidado.set(true);
    // Don't show form yet, wait for continuarInscripcion()
  }

  /**
   * Continues to the inscription form after RFC validation
   */
  continuarInscripcion(): void {
    this.mostrarFormulario.set(true);
    // Ahora sí cargar los documentos de la primera sección, ya que conocemos el tipo de persona
    this.cargarDocumentosSeccion(0);
  }

  /**
   * Navega a una ruta específica
   */
  navigate(route: string): void {
    this.router.navigateByUrl(route);
  }

  /**
   * Resets the RFC validation and returns to initial state
   */
  resetRFC(): void {
    this.rfcValue.set('');
    this.tipoPersona.set(null);
    this.rfcValidado.set(false);
    this.rfcError.set(null);
    this.mostrarFormulario.set(false);
    this.form.reset();
    this.form.controls.tipoPersona.setValue('fisica');
    this.regimenes.set([]);
    this.actividades.set([]);
    this.impuestosSeleccionados.set([]);
    this.contribucionIds.set([]);
    this.currentStep.set(0);
  }

  togglePersona(tipo: 'fisica' | 'moral'): void {
    this.form.controls.tipoPersona.setValue(tipo);
  }

  nextStep(): void {
    const step = this.currentStep();
    if (!this.validateStep(step)) {
      return;
    }
    if (step < this.steps.length - 1) {
      const newStep = step + 1;
      this.currentStep.set(newStep);
      this.cargarDocumentosSeccion(newStep);
    }
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step > 0) {
      const newStep = step - 1;
      this.currentStep.set(newStep);
      this.cargarDocumentosSeccion(newStep);
    }
  }

  addRegimen(): void {
    const value = (this.regimenInput || '').trim();
    if (!value) {
      return;
    }
    if (this.regimenes().includes(value)) {
      this.messageService.add({ severity: 'warn', summary: 'Régimen', detail: 'Ya agregaste ese régimen.' });
      return;
    }
    this.regimenes.update((list) => [...list, value]);
    this.regimenInput = '';
  }

  removeRegimen(value: string): void {
    this.regimenes.update((list) => list.filter((item) => item !== value));
  }

  addActividad(): void {
    const value = (this.actividadInput || '').trim();
    if (!value) {
      return;
    }
    if (this.actividades().includes(value)) {
      this.messageService.add({ severity: 'warn', summary: 'Actividad', detail: 'Ya agregaste esa actividad.' });
      return;
    }
    this.actividades.update((list) => [...list, value]);
    this.actividadInput = '';
  }

  removeActividad(value: string): void {
    this.actividades.update((list) => list.filter((item) => item !== value));
  }

  clearRegimenes(): void {
    this.regimenes.set([]);
  }

  clearActividades(): void {
    this.actividades.set([]);
  }

  getImpuestoSeleccionado(id: number): boolean {
    return this.contribucionIds().includes(id);
  }

  getImpuestoControl(id: number): FormControl {
    const control = new FormControl(this.getImpuestoSeleccionado(id));
    return control;
  }

  getImpuestoLabel(id: number): string {
    const contribucion = this.impuestosCatalog().find(c => c.id === id);
    return contribucion ? `${contribucion.nombre}` : `ID: ${id}`;
  }

  toggleImpuesto(contribucionId: number, checked: boolean): void {
    this.contribucionIds.update((list) => {
      if (checked) {
        if (list.includes(contribucionId)) {
          return list;
        }
        return [...list, contribucionId];
      }
      return list.filter((id) => id !== contribucionId);
    });
    
    // También actualizar los nombres para compatibilidad con el draft
    const contribucion = this.impuestosCatalog().find(c => c.id === contribucionId);
    if (contribucion) {
      this.impuestosSeleccionados.update((list) => {
        if (checked) {
          if (list.includes(contribucion.nombre)) {
            return list;
          }
          return [...list, contribucion.nombre];
        }
        return list.filter((nombre) => nombre !== contribucion.nombre);
      });
    }
  }

  saveDraft(): void {
    const draft: InscripcionDraft = {
      formValue: this.form.getRawValue(),
      regimenes: this.regimenes(),
      actividades: this.actividades(),
      impuestos: this.impuestosSeleccionados(),
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(draft));
      this.draftUpdatedAt.set(new Date(draft.updatedAt));
      this.messageService.add({ severity: 'success', summary: 'Borrador guardado', detail: 'Puedes continuar más tarde.' });
    } catch (error) {
      console.warn('[Inscripcion] No se pudo guardar borrador', error);
      this.messageService.add({ severity: 'error', summary: 'No se pudo guardar', detail: 'Revisa el almacenamiento disponible.' });
    }
  }

  clearDraft(): void {
    localStorage.removeItem(this.draftKey);
    this.draftUpdatedAt.set(null);
  }

  editProcessingPayload(): void {
    const payload = this.processingState()?.payload;
    if (!payload) {
      return;
    }
    if (payload.formValue) {
      this.patchFormFromDraft(payload as InscripcionDraft);
      this.currentStep.set(this.steps.length - 1);
      return;
    }
    const { regimenes = [], actividades = [], impuestos = [], ...rest } = payload;
    this.form.patchValue(rest);
    this.regimenes.set(regimenes);
    this.actividades.set(actividades);
    this.impuestosSeleccionados.set(impuestos);
    this.currentStep.set(this.steps.length - 1);
  }

  clearProcessingState(): void {
    localStorage.removeItem(this.processingKey);
    this.processingState.set(null);
  }

  submitSolicitud(): void {
    if (!this.validateStep(this.currentStep()) || !this.form.valid) {
      this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Revisa los campos requeridos antes de enviar.' });
      return;
    }
    const contribuyenteId = this.authService.getContribuyenteId();
    if (!contribuyenteId) {
      this.messageService.add({ severity: 'error', summary: 'Sesión', detail: 'No se pudo identificar al contribuyente.' });
      return;
    }

    const payload = this.buildPayload();
    this.loading.set(true);

    // Llamar a ambos endpoints: actualizar formulario y crear solicitud de inscripción
    forkJoin({
      formulario: this.contribuyentesService.actualizarContribuyenteFormulario(contribuyenteId, payload),
      solicitud: this.contribuyentesService.crearSolicitudInscripcion({
        contribuyenteId,
        contribucionIds: this.contribucionIds(), // Usar los IDs seleccionados por el usuario
        observaciones: 'Solicitud de inscripción generada desde el formulario'
      })
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (results) => {
          this.persistProcessingState(contribuyenteId, payload);
          this.notificationsService.addNotification('📬 Enviamos tu solicitud de inscripción para validación.');
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Solicitud enviada', 
            detail: 'Tesorería revisará tu información.' 
          });
          console.log('Formulario actualizado:', results.formulario);
          console.log('Solicitud creada:', results.solicitud);
          
          // Recargar el dashboard para mostrar el estado "procesando"
          this.loadDashboardData();
        },
        error: (error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'No se pudo enviar', 
            detail: error?.message || 'Intenta nuevamente.' 
          });
        }
      });
  }

  useCurrentUserAs(section: 'representante' | 'pagos'): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }
    const fullName = [user.nombre, user.apellidos].filter(Boolean).join(' ').trim() || user.email || '';
    if (section === 'representante') {
      const group = this.form.controls.representante;
      group.patchValue({
        nombres: user.nombre || fullName,
        primerApellido: user.apellidos?.split(' ')[0] || '',
        segundoApellido: user.apellidos?.split(' ')[1] || '',
        rfc: '',
        curp: ''
      });
    } else {
      const group = this.form.controls.pagos;
      group.patchValue({
        nombre: fullName,
        telefono: user.telefono || '',
        correo: user.email || ''
      });
    }
  }

  get resumenRegimenes(): string {
    return this.regimenes().length ? this.regimenes().join(', ') : 'Sin registros';
  }

  get resumenActividades(): string {
    return this.actividades().length ? this.actividades().join(', ') : 'Sin registros';
  }

  get resumenImpuestos(): string {
    return this.impuestosSeleccionados().length
      ? this.impuestosSeleccionados()
          .map((clave: string) => this.impuestosCatalog().find((item: any) => item.code === clave)?.label || clave)
          .join(', ')
      : 'Sin selección';
  }

  private setupPersonaWatcher(): void {
    this.form.controls.tipoPersona.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tipo) => {
      this.applyPersonaValidators(tipo);
    });
    this.applyPersonaValidators(this.form.controls.tipoPersona.value);
  }

  private applyPersonaValidators(tipo: 'fisica' | 'moral'): void {
    const identificacion = this.form.controls.identificacion;
    const nombres = identificacion.controls.nombres;
    const primerApellido = identificacion.controls.primerApellido;
    const razonSocial = identificacion.controls.razonSocial;

    if (tipo === 'moral') {
      nombres.setValidators([]);
      primerApellido.setValidators([]);
      razonSocial.setValidators([Validators.required]);
    } else {
      nombres.setValidators([Validators.required]);
      primerApellido.setValidators([Validators.required]);
      razonSocial.setValidators([]);
    }

    nombres.updateValueAndValidity({ emitEvent: false });
    primerApellido.updateValueAndValidity({ emitEvent: false });
    razonSocial.updateValueAndValidity({ emitEvent: false });
  }

  private validateStep(step: number): boolean {
    const controls = this.getControlsForStep(step);
    let valid = true;
    controls.forEach((control) => {
      if (!control) {
        return;
      }
      if ('markAllAsTouched' in control) {
        (control as any).markAllAsTouched();
      } else {
        (control as AbstractControl).markAsTouched();
      }
      if (control.invalid) {
        valid = false;
      }
    });

    if (step === 2) {
      if (!this.regimenes().length || !this.actividades().length || !this.impuestosSeleccionados().length) {
        this.messageService.add({ severity: 'warn', summary: 'Información requerida', detail: 'Agrega al menos un régimen, una actividad y un impuesto.' });
        valid = false;
      }
    }

    return valid;
  }

  private getControlsForStep(step: number): AbstractControl[] {
    switch (step) {
      case 0:
        return [this.form.controls.identificacion];
      case 1:
        return [this.form.controls.domicilio];
      case 2:
        return [this.form.controls.fechas];
      case 3:
        return [this.form.controls.representante];
      case 4:
        return [this.form.controls.pagos];
      default:
        return [this.form];
    }
  }

  private loadDraft(): void {
    try {
      const stored = localStorage.getItem(this.draftKey);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as InscripcionDraft;
      if (parsed?.formValue) {
        this.patchFormFromDraft(parsed);
      }
    } catch (error) {
      console.warn('[Inscripcion] No se pudo leer el borrador', error);
    }
  }

  private patchFormFromDraft(draft: InscripcionDraft): void {
    this.form.patchValue(draft.formValue);
    this.regimenes.set(draft.regimenes || []);
    this.actividades.set(draft.actividades || []);
    this.impuestosSeleccionados.set(draft.impuestos || []);
    this.draftUpdatedAt.set(draft.updatedAt ? new Date(draft.updatedAt) : null);
  }

  private loadProcessingState(): void {
    try {
      const stored = localStorage.getItem(this.processingKey);
      if (!stored) {
        this.processingState.set(null);
        return;
      }
      this.processingState.set(JSON.parse(stored));
    } catch (error) {
      console.warn('[Inscripcion] No se pudo leer el estado de procesamiento', error);
      this.processingState.set(null);
    }
  }

  private persistProcessingState(contribuyenteId: number, payload: any): void {
    const state: InscripcionState = {
      id: contribuyenteId,
      status: 'validacion',
      rfc: payload?.identificacion?.rfc || payload?.rfc,
      timestamp: new Date().toISOString(),
      payload
    };
    try {
      localStorage.setItem(this.processingKey, JSON.stringify(state));
    } catch (error) {
      console.warn('[Inscripcion] No se pudo guardar el estado de procesamiento', error);
    }
    this.processingState.set(state);
  }

  private loadContribuciones(): void {
    console.log('🔵 Iniciando carga de contribuciones...');
    console.log('🔵 URL base contribuciones:', this.contribucionesService['baseUrl']);
    
    this.contribucionesService.getContribuciones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contribuciones) => {
          console.log('✅ Contribuciones recibidas (raw):', contribuciones);
          
          // Mapear de PascalCase a camelCase
          const contribucionesMapeadas = contribuciones.map((c: any) => ({
            id: c.Id ?? c.id,
            nombre: c.Nombre ?? c.nombre,
            sujetoId: c.SujetoId ?? c.sujetoId,
            objeto: c.Objeto ?? c.objeto,
            tipo: c.Tipo ?? c.tipo,
            tipoNombre: c.TipoNombre ?? c.tipoNombre
          }));
          
          console.log('✅ Contribuciones mapeadas:', contribucionesMapeadas);
          this.impuestosCatalog.set(contribucionesMapeadas);
          console.log('✅ Signal actualizado, valor actual:', this.impuestosCatalog());
        },
        error: (error) => {
          console.error('❌ Error al cargar contribuciones:', error);
          console.error('❌ Error status:', error?.status);
          console.error('❌ Error message:', error?.message);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las contribuciones disponibles'
          });
        }
      });
  }

  private buildPayload(): any {
    const raw = this.form.getRawValue();
    return {
      ...raw,
      regimenes: this.regimenes(),
      actividades: this.actividades(),
      contribucionIds: this.contribucionIds(), // Enviar IDs en lugar de nombres
      personaDescripcion: this.personaDescripcion()
    };
  }

  /**
   * Copia los datos de identificación a la sección de representante legal
   */
  copiarDatosARepresentante(): void {
    const identificacion = this.form.controls.identificacion.value;
    this.form.controls.representante.patchValue({
      nombres: identificacion.nombres,
      primerApellido: identificacion.primerApellido,
      segundoApellido: identificacion.segundoApellido,
      rfc: identificacion.rfc,
      curp: identificacion.curp
    });
    this.messageService.add({
      severity: 'success',
      summary: 'Datos copiados',
      detail: 'Los datos de identificación se copiaron al representante legal'
    });
  }

  /**
   * Copia los datos de identificación a la sección de pagos
   */
  copiarDatosAPagos(): void {
    const identificacion = this.form.controls.identificacion.value;
    
    // Construir nombre completo
    const nombreCompleto = `${identificacion.nombres || ''} ${identificacion.primerApellido || ''} ${identificacion.segundoApellido || ''}`.trim();
    
    this.form.controls.pagos.patchValue({
      nombre: nombreCompleto,
      telefono: identificacion.telefono,
      correo: identificacion.email
    });
    this.messageService.add({
      severity: 'success',
      summary: 'Datos copiados',
      detail: 'Los datos de identificación se copiaron a la persona que efectuará pagos'
    });
  }

  // TrackBy functions para optimizar loops
  trackByIndex(index: number): number {
    return index;
  }

  trackByString(_index: number, item: string): string {
    return item;
  }

  trackByCode(_index: number, item: CatalogOption): string {
    return item.code;
  }

  private prefillFromUser(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }
    const identificacion = this.form.controls.identificacion;
    identificacion.patchValue({
      nombres: identificacion.value.nombres || user.nombre || '',
      primerApellido: identificacion.value.primerApellido || user.apellidos?.split(' ')[0] || '',
      segundoApellido: identificacion.value.segundoApellido || user.apellidos?.split(' ')[1] || '',
      rfc: identificacion.value.rfc || '',
      curp: identificacion.value.curp || '',
      email: identificacion.value.email || user.email || '',
      telefono: identificacion.value.telefono || user.telefono || ''
    });
  }

  private loadDashboardData(): void {
    const contribuyenteId = this.authService.getContribuyenteId();
    
    if (!contribuyenteId) {
      console.warn('[Inscripcion] No se pudo obtener el ID del contribuyente');
      return;
    }

    this.loadingDashboard.set(true);
    
    this.dashboardService.getDashboard(contribuyenteId).subscribe({
      next: (data) => {
        console.log('[Inscripcion] Dashboard data loaded:', data);
        this.dashboardData.set(data);
        this.loadingDashboard.set(false);
        
        // Si está activo o tiene solicitud, cargar información detallada del contribuyente
        if (data.activo || data.ultimaSolicitud) {
          this.loadContribuyenteData(contribuyenteId);
        }
      },
      error: (error) => {
        console.error('[Inscripcion] Error loading dashboard data:', error);
        this.loadingDashboard.set(false);
      }
    });
  }

  private loadContribuyenteData(contribuyenteId: number): void {
    this.loadingContribuyente.set(true);
    
    this.contribuyentesService.getContribuyente(contribuyenteId).subscribe({
      next: (data) => {
        console.log('[Inscripcion] Contribuyente data loaded:', data);
        this.contribuyenteData.set(data);
        this.loadingContribuyente.set(false);
      },
      error: (error) => {
        console.error('[Inscripcion] Error loading contribuyente data:', error);
        this.loadingContribuyente.set(false);
      }
    });
  }
}

