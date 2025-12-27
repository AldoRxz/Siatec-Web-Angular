import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
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
import { finalize } from 'rxjs/operators';
import { AuthService, ContribuyentesService } from '../../../core/services';
import { DashboardNotificationsService } from '../services/dashboard-notifications.service';

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
    InputIconModule
  ],
  providers: [MessageService],
  templateUrl: './inscripcion.component.html',
  styleUrl: './inscripcion.component.scss'
})
export class InscripcionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly contribuyentesService = inject(ContribuyentesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);
  private readonly notificationsService = inject(DashboardNotificationsService);

  private readonly draftKey = 'inscripcionDraft';
  private readonly processingKey = 'inscripcionProcesando';

  readonly loading = signal(false);
  readonly currentStep = signal(0);
  readonly steps = ['Datos generales', 'Ubicación y contacto', 'Régimen e impuestos', 'Representante', 'Pagos', 'Resumen'];

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
    this.contribuyentesService
      .actualizarContribuyenteFormulario(contribuyenteId, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.persistProcessingState(contribuyenteId, payload);
          this.notificationsService.addNotification('📬 Enviamos tu solicitud de inscripción para validación.');
          this.messageService.add({ severity: 'success', summary: 'Solicitud enviada', detail: 'Tesorería revisará tu información.' });
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'No se pudo enviar', detail: error?.message || 'Intenta nuevamente.' });
        }
      });
  }

  useCurrentUserAs(section: 'representante' | 'pagos'): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }
    const identity = (user.identityInfo ?? {}) as Record<string, any>;
    const fullName = [user.nombre, user.apellidos].filter(Boolean).join(' ').trim() || identity['nombres'] || user.email || '';
    if (section === 'representante') {
      const group = this.form.controls.representante;
      group.patchValue({
        nombres: user.nombre || identity['nombres'] || fullName,
        primerApellido: user.apellidos?.split(' ')[0] || identity['primerApellido'] || '',
        segundoApellido: user.apellidos?.split(' ')[1] || identity['segundoApellido'] || '',
        rfc: identity['rfc'] || '',
        curp: identity['curp'] || ''
      });
    } else {
      const group = this.form.controls.pagos;
      group.patchValue({
        nombre: fullName,
        telefono: identity['telefono'] || '',
        correo: user.email || identity['correo'] || ''
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

  private prefillFromUser(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return;
    }
    const identity = (user.identityInfo ?? {}) as Record<string, any>;
    const identificacion = this.form.controls.identificacion;
    identificacion.patchValue({
      nombres: identificacion.value.nombres || user.nombre || identity['nombres'] || '',
      primerApellido: identificacion.value.primerApellido || user.apellidos?.split(' ')[0] || identity['primerApellido'] || '',
      segundoApellido: identificacion.value.segundoApellido || user.apellidos?.split(' ')[1] || identity['segundoApellido'] || '',
      rfc: identificacion.value.rfc || identity['rfc'] || '',
      curp: identificacion.value.curp || identity['curp'] || '',
      email: identificacion.value.email || user.email || identity['correo'] || '',
      telefono: identificacion.value.telefono || identity['telefono'] || ''
    });
  }
}
