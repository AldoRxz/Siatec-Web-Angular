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
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AuthService, ContribuyentesService } from '../../../core/services';
import { PaccioliService } from '../../../core/services/paccioli.service';
import { DashboardNotificationsService } from '../services/dashboard-notifications.service';
import { InscripcionDocumentosService, DocumentoRequeridoDto } from '../services/inscripcion-documentos.service';
import { DashboardService, ContribuyenteDashboard } from '../services/dashboard.service';
import { FloatLabelFilledDirective } from '../../../shared/directives';

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
    FloatLabelFilledDirective
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
  readonly impuestosCatalog: CatalogOption[] = [
    { code: 'IVA', label: 'Impuesto al Valor Agregado' },
    { code: 'ISR', label: 'Impuesto Sobre la Renta' },
    { code: 'ISN', label: 'Impuesto Sobre Nómina' },
    { code: 'CED', label: 'Impuesto Cedular' },
    { code: 'HOS', label: 'Impuesto al Hospedaje' },
    { code: 'ESP', label: 'Impuesto Especial' }
  ];
  readonly impuestosSeleccionados = signal<string[]>([]);

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

  ngOnInit(): void {
    this.setupPersonaWatcher();
    this.loadDraft();
    this.loadProcessingState();
    this.prefillFromUser();
    this.loadDashboardData(); // Cargar estado del dashboard
    this.cargarDocumentosSeccion(0); // Cargar documentos del primer paso
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
      
      // Rellenar campos con la respuesta
      if (response?.data || response?.extractedFields) {
        this.rellenarCamposDesdeRespuesta(response, stepIndex);
        
        this.messageService.add({
          severity: 'info',
          summary: 'Campos actualizados',
          detail: 'Se extrajeron datos del documento y se rellenaron los campos automáticamente'
        });
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
   * Maneja el cambio de paso en el stepper
   * Carga automáticamente los documentos de la nueva sección
   */
  onStepChange(event: any): void {
    const newStep = event.index;
    this.currentStep.set(newStep);
    this.cargarDocumentosSeccion(newStep);
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
      
      // Rellenar campos con la respuesta
      if (response?.data || response?.extractedFields) {
        this.rellenarCamposDesdeRespuesta(response, stepIndex);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Documento procesado',
          detail: 'Los campos se han rellenado automáticamente con la información extraída'
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
    const data = response?.data || response?.extractedFields || {};
    const formGroup = this.getCurrentFormGroup(stepIndex);
    
    if (!formGroup) return;

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
    Object.keys(data).forEach(key => {
      const mappedField = fieldMapping[key];
      if (mappedField && formGroup.get(mappedField)) {
        const value = data[key];
        if (value !== null && value !== undefined && value !== '') {
          formGroup.get(mappedField)?.setValue(value);
          console.log(`Campo ${mappedField} rellenado con: ${value}`);
        }
      }
    });
  }

  /**
   * Maneja el evento de selección de archivo
   */
  async onFileSelected(event: Event, stepIndex: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      await this.procesarArchivoConPaccioli(file, stepIndex);
      // Limpiar el input para permitir subir el mismo archivo de nuevo
      input.value = '';
    }
  }

  /**
   * Verifica si debe mostrar la sección de documentos
   * Solo muestra si está cargando o si hay documentos
   */
  mostrarSeccionDocumentos(stepIndex: number): boolean {
    const seccion = this.seccionesDocumentos[stepIndex];
    if (!seccion) return false;
    
    // Mostrar si está cargando
    if (this.cargandoDocumentos()) return true;
    
    // Mostrar si hay documentos
    const documentos = this.documentosPorSeccion()[seccion];
    return documentos && documentos.length > 0;
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
      this.currentStep.set(step + 1);
    }
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step > 0) {
      this.currentStep.set(step - 1);
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

  getImpuestoSeleccionado(code: string): boolean {
    return this.impuestosSeleccionados().includes(code);
  }

  getImpuestoControl(code: string): FormControl {
    const control = new FormControl(this.getImpuestoSeleccionado(code));
    return control;
  }

  getImpuestoLabel(code: string): string {
    const impuesto = this.impuestosCatalog.find(i => i.code === code);
    return impuesto ? `${impuesto.code} - ${impuesto.label}` : code;
  }

  toggleImpuesto(code: string, checked: boolean): void {
    this.impuestosSeleccionados.update((list) => {
      if (checked) {
        if (list.includes(code)) {
          return list;
        }
        return [...list, code];
      }
      return list.filter((item) => item !== code);
    });
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
        contribucionIds: [], // Se pueden agregar los IDs de contribuciones si aplica
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
          .map((clave) => this.impuestosCatalog.find((item) => item.code === clave)?.label || clave)
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

  private buildPayload(): any {
    const raw = this.form.getRawValue();
    return {
      ...raw,
      regimenes: this.regimenes(),
      actividades: this.actividades(),
      impuestos: this.impuestosSeleccionados(),
      personaDescripcion: this.personaDescripcion()
    };
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
      },
      error: (error) => {
        console.error('[Inscripcion] Error loading dashboard data:', error);
        this.loadingDashboard.set(false);
      }
    });
  }
}
