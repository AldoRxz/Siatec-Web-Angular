import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FloatLabel } from 'primeng/floatlabel';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

// Interfaces
export interface Cita {
  id: number;
  nombre: string;
  rfc: string;
  tipoPersona: 'PF' | 'PM';
  fecha: string;
  hora: string;
  estado: string;
  municipio: string;
  oficina: string;
  tramite: string;
  status: 'AGENDADA' | 'CANCELADA' | 'COMPLETADA';
  fechaCreacion: Date;
}

interface SelectOption {
  label: string;
  value: string;
}

interface Tramite {
  label: string;
  value: string;
  icon: string;
}

interface DocumentoRequerido {
  codigo: string;
  label: string;
  disponible: boolean;
}

// Datos simulados - Estructura territorial
const ESTRUCTURA_TERRITORIAL: Record<string, Record<string, string[]>> = {
  'Ciudad de México': {
    'Benito Juárez': ['SAT Benito Juárez', 'Módulo Express BJ'],
    'Cuauhtémoc': ['SAT Reforma', 'SAT Buenavista']
  },
  'Jalisco': {
    'Guadalajara': ['SAT Guadalajara Centro', 'SAT Oblatos'],
    'Zapopan': ['SAT Zapopan', 'SAT Plaza Patria'],
    'Tlaquepaque': ['SAT Tlaquepaque']
  },
  'Nuevo León': {
    'Monterrey': ['SAT Monterrey Centro', 'SAT Cumbres'],
    'San Nicolás': ['SAT San Nicolás', 'SAT Sendero']
  },
  'Guanajuato': {
    'León': ['SAT León Centro']
  },
  'Puebla': {
    'Puebla': ['SAT Puebla Angelópolis']
  },
  'Yucatán': {
    'Mérida': ['SAT Mérida']
  },
  'Querétaro': {
    'Querétaro': ['SAT Querétaro']
  },
  'Estado de México': {
    'Toluca': ['SAT Toluca']
  },
  'Quintana Roo': {
    'Cancún': ['SAT Cancún Zona Hotelera']
  }
};

const TRAMITES_PF: Tramite[] = [
  { value: 'DEV_SALDO', label: 'Devolución saldo a favor', icon: 'pi-money-bill' },
  { value: 'ACT_DATOS', label: 'Actualización de datos', icon: 'pi-pencil' },
  { value: 'OPINION', label: 'Opinión de cumplimiento', icon: 'pi-check-circle' },
  { value: 'ACLARACIONES', label: 'Aclaraciones', icon: 'pi-comments' }
];

const TRAMITES_PM: Tramite[] = [
  { value: 'ESTABLECIMIENTO', label: 'Alta de establecimiento', icon: 'pi-building' },
  { value: 'OPINION_PM', label: 'Opinión de cumplimiento', icon: 'pi-check-circle' },
  { value: 'ACLARACIONES_PM', label: 'Aclaraciones', icon: 'pi-comments' }
];

const HORAS_DISPONIBLES: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00'
];

const DOCUMENTOS_REQUERIDOS: Record<string, { codigo: string; label: string }[]> = {
  DEV_SALDO: [
    { codigo: 'RFC', label: 'Constancia RFC' },
    { codigo: 'ESTADO_CTA', label: 'Estado de Cuenta Bancario' }
  ],
  ACT_DATOS: [
    { codigo: 'RFC', label: 'Constancia RFC' },
    { codigo: 'DOMICILIO', label: 'Comprobante de Domicilio' }
  ],
  OPINION: [
    { codigo: 'RFC', label: 'Constancia RFC' }
  ],
  ACLARACIONES: [
    { codigo: 'RFC', label: 'Constancia RFC' }
  ],
  ESTABLECIMIENTO: [
    { codigo: 'ACTA_CONST', label: 'Acta Constitutiva' },
    { codigo: 'RFC_PM', label: 'Constancia RFC (PM)' },
    { codigo: 'DOMICILIO', label: 'Comprobante de Domicilio' }
  ],
  OPINION_PM: [
    { codigo: 'RFC_PM', label: 'Constancia RFC (PM)' }
  ],
  ACLARACIONES_PM: [
    { codigo: 'RFC_PM', label: 'Constancia RFC (PM)' }
  ]
};

@Component({
  selector: 'app-dashboard-citas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DatePicker,
    Select,
    InputTextModule,
    ToastModule,
    TableModule,
    TooltipModule,
    ProgressSpinnerModule,
    FloatLabel,
    IconField,
    InputIcon
  ],
  providers: [MessageService],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.scss'
})
export class CitasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  // Signals
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly detalleVisible = signal(false);
  readonly citaDetalle = signal<Cita | null>(null);
  
  // Citas simuladas
  readonly citas = signal<Cita[]>([
    {
      id: 1,
      nombre: 'Juan Pérez García',
      rfc: 'PEGJ850101ABC',
      tipoPersona: 'PF',
      fecha: '2025-01-20',
      hora: '10:00',
      estado: 'Ciudad de México',
      municipio: 'Benito Juárez',
      oficina: 'SAT Benito Juárez',
      tramite: 'Devolución saldo a favor',
      status: 'AGENDADA',
      fechaCreacion: new Date()
    },
    {
      id: 2,
      nombre: 'María López Hernández',
      rfc: 'LOHM900215XYZ',
      tipoPersona: 'PF',
      fecha: '2025-01-25',
      hora: '14:30',
      estado: 'Jalisco',
      municipio: 'Guadalajara',
      oficina: 'SAT Guadalajara Centro',
      tramite: 'Actualización de datos',
      status: 'AGENDADA',
      fechaCreacion: new Date()
    },
    {
      id: 3,
      nombre: 'Empresa ABC S.A. de C.V.',
      rfc: 'EAB120515PM1',
      tipoPersona: 'PM',
      fecha: '2025-01-15',
      hora: '11:00',
      estado: 'Nuevo León',
      municipio: 'Monterrey',
      oficina: 'SAT Monterrey Centro',
      tramite: 'Opinión de cumplimiento',
      status: 'COMPLETADA',
      fechaCreacion: new Date(2025, 0, 10)
    }
  ]);

  // Opciones de formulario
  readonly estados = signal<SelectOption[]>(
    Object.keys(ESTRUCTURA_TERRITORIAL).sort().map(e => ({ label: e, value: e }))
  );
  readonly municipios = signal<SelectOption[]>([]);
  readonly oficinas = signal<SelectOption[]>([]);
  readonly tramites = signal<Tramite[]>([]);
  readonly horasDisponibles = signal<SelectOption[]>([]);
  readonly documentosRequeridos = signal<DocumentoRequerido[]>([]);
  
  // Tipo de persona detectado
  readonly tipoPersona = signal<'PF' | 'PM' | ''>('');
  
  // Fecha mínima (hoy + 2 días)
  readonly minDate = new Date();
  
  // Computed
  readonly hasCitas = computed(() => this.citas().length > 0);
  readonly citasAgendadas = computed(() => this.citas().filter(c => c.status === 'AGENDADA').length);
  readonly citasCompletadas = computed(() => this.citas().filter(c => c.status === 'COMPLETADA').length);
  readonly tramitesDisponibles = computed(() => this.tramites());

  // Form
  citaForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    rfc: ['', [Validators.required, Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i)]],
    estado: [null, Validators.required],
    municipio: [{ value: null, disabled: true }, Validators.required],
    oficina: [{ value: null, disabled: true }, Validators.required],
    tramite: [{ value: null, disabled: true }, Validators.required],
    fecha: [{ value: null, disabled: true }, Validators.required],
    hora: [{ value: null, disabled: true }, Validators.required]
  });

  constructor() {
    this.minDate.setDate(this.minDate.getDate() + 2);
  }

  ngOnInit(): void {
    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    // Listener para RFC - detectar tipo de persona
    this.citaForm.get('rfc')?.valueChanges.subscribe(value => {
      this.detectarTipoPersona(value);
    });

    // Listener para Estado
    this.citaForm.get('estado')?.valueChanges.subscribe(value => {
      this.onEstadoChange(value);
    });

    // Listener para Municipio
    this.citaForm.get('municipio')?.valueChanges.subscribe(value => {
      this.onMunicipioChange(value);
    });

    // Listener para Oficina
    this.citaForm.get('oficina')?.valueChanges.subscribe(value => {
      this.onOficinaChange(value);
    });

    // Listener para Fecha
    this.citaForm.get('fecha')?.valueChanges.subscribe(value => {
      this.onFechaChange(value);
    });

    // Listener para Trámite
    this.citaForm.get('tramite')?.valueChanges.subscribe(value => {
      this.onTramiteChange(value);
    });
  }

  private detectarTipoPersona(rfc: string): void {
    if (!rfc) {
      this.tipoPersona.set('');
      this.tramites.set([]);
      this.citaForm.get('tramite')?.disable();
      return;
    }

    const rfcClean = rfc.trim().toUpperCase();
    if (rfcClean.length === 12) {
      this.tipoPersona.set('PM');
      this.tramites.set(TRAMITES_PM);
      this.citaForm.get('tramite')?.enable();
    } else if (rfcClean.length === 13) {
      this.tipoPersona.set('PF');
      this.tramites.set(TRAMITES_PF);
      this.citaForm.get('tramite')?.enable();
    } else {
      this.tipoPersona.set('');
      this.tramites.set([]);
      this.citaForm.get('tramite')?.disable();
    }
  }

  private onEstadoChange(estado: string): void {
    this.citaForm.get('municipio')?.setValue(null);
    this.citaForm.get('oficina')?.setValue(null);
    this.citaForm.get('fecha')?.setValue(null);
    this.citaForm.get('hora')?.setValue(null);
    this.municipios.set([]);
    this.oficinas.set([]);
    this.horasDisponibles.set([]);

    if (estado && ESTRUCTURA_TERRITORIAL[estado]) {
      const muns = Object.keys(ESTRUCTURA_TERRITORIAL[estado]).sort().map(m => ({ label: m, value: m }));
      this.municipios.set(muns);
      this.citaForm.get('municipio')?.enable();
    } else {
      this.citaForm.get('municipio')?.disable();
    }
    this.citaForm.get('oficina')?.disable();
    this.citaForm.get('fecha')?.disable();
    this.citaForm.get('hora')?.disable();
  }

  private onMunicipioChange(municipio: string): void {
    const estado = this.citaForm.get('estado')?.value;
    
    this.citaForm.get('oficina')?.setValue(null);
    this.citaForm.get('fecha')?.setValue(null);
    this.citaForm.get('hora')?.setValue(null);
    this.oficinas.set([]);
    this.horasDisponibles.set([]);

    if (estado && municipio && ESTRUCTURA_TERRITORIAL[estado]?.[municipio]) {
      const ofs = ESTRUCTURA_TERRITORIAL[estado][municipio].map(o => ({ label: o, value: o }));
      this.oficinas.set(ofs);
      this.citaForm.get('oficina')?.enable();
    } else {
      this.citaForm.get('oficina')?.disable();
    }
    this.citaForm.get('fecha')?.disable();
    this.citaForm.get('hora')?.disable();
  }

  private onOficinaChange(oficina: string): void {
    this.citaForm.get('fecha')?.setValue(null);
    this.citaForm.get('hora')?.setValue(null);
    this.horasDisponibles.set([]);

    if (oficina) {
      this.citaForm.get('fecha')?.enable();
    } else {
      this.citaForm.get('fecha')?.disable();
    }
    this.citaForm.get('hora')?.disable();
  }

  private onFechaChange(fecha: Date | null): void {
    this.citaForm.get('hora')?.setValue(null);
    this.horasDisponibles.set([]);

    if (fecha) {
      const horas = HORAS_DISPONIBLES.filter(() => Math.random() > 0.3)
        .map(h => ({ label: h, value: h }));
      this.horasDisponibles.set(horas.length > 0 ? horas : [{ label: '10:00', value: '10:00' }]);
      this.citaForm.get('hora')?.enable();
    } else {
      this.citaForm.get('hora')?.disable();
    }
  }

  private onTramiteChange(tramite: string): void {
    if (tramite && DOCUMENTOS_REQUERIDOS[tramite]) {
      const docs = DOCUMENTOS_REQUERIDOS[tramite].map(d => ({
        ...d,
        disponible: Math.random() > 0.5
      }));
      this.documentosRequeridos.set(docs);
    } else {
      this.documentosRequeridos.set([]);
    }
  }

  agendarCita(): void {
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    this.submitting.set(true);

    setTimeout(() => {
      const formValue = this.citaForm.getRawValue();
      const fechaStr = formValue.fecha instanceof Date 
        ? formValue.fecha.toISOString().split('T')[0] 
        : formValue.fecha;
      
      const tramiteObj = this.tramites().find(t => t.value === formValue.tramite);
      
      const nuevaCita: Cita = {
        id: Date.now(),
        nombre: formValue.nombre,
        rfc: formValue.rfc.toUpperCase(),
        tipoPersona: this.tipoPersona() as 'PF' | 'PM',
        fecha: fechaStr,
        hora: formValue.hora,
        estado: formValue.estado,
        municipio: formValue.municipio,
        oficina: formValue.oficina,
        tramite: tramiteObj?.label || formValue.tramite,
        status: 'AGENDADA',
        fechaCreacion: new Date()
      };

      this.citas.update(citas => [nuevaCita, ...citas]);
      this.submitting.set(false);
      this.resetForm();

      this.messageService.add({
        severity: 'success',
        summary: 'Cita agendada',
        detail: `Tu cita ha sido registrada para el ${fechaStr} a las ${formValue.hora}`
      });
    }, 1500);
  }

  cancelarCita(cita: Cita): void {
    this.citas.update(citas => 
      citas.map(c => c.id === cita.id ? { ...c, status: 'CANCELADA' as const } : c)
    );

    this.messageService.add({
      severity: 'info',
      summary: 'Cita cancelada',
      detail: 'La cita ha sido cancelada exitosamente'
    });
  }

  verDetalle(cita: Cita): void {
    this.citaDetalle.set(cita);
    this.detalleVisible.set(true);
  }

  cerrarDetalle(): void {
    this.detalleVisible.set(false);
    this.citaDetalle.set(null);
  }

  private resetForm(): void {
    this.citaForm.reset();
    this.tipoPersona.set('');
    this.municipios.set([]);
    this.oficinas.set([]);
    this.tramites.set([]);
    this.horasDisponibles.set([]);
    this.documentosRequeridos.set([]);
    
    this.citaForm.get('municipio')?.disable();
    this.citaForm.get('oficina')?.disable();
    this.citaForm.get('tramite')?.disable();
    this.citaForm.get('fecha')?.disable();
    this.citaForm.get('hora')?.disable();
  }

  trackByCita(_: number, item: Cita): number {
    return item.id;
  }

  getSeverity(status: Cita['status']): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<Cita['status'], 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      AGENDADA: 'success',
      COMPLETADA: 'info',
      CANCELADA: 'danger'
    };
    return severities[status] || 'secondary';
  }

  getStatusLabel(status: Cita['status']): string {
    const labels: Record<Cita['status'], string> = {
      AGENDADA: 'Agendada',
      COMPLETADA: 'Completada',
      CANCELADA: 'Cancelada'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: Cita['status']): string {
    const icons: Record<Cita['status'], string> = {
      AGENDADA: 'pi-check-circle',
      COMPLETADA: 'pi-verified',
      CANCELADA: 'pi-times-circle'
    };
    return icons[status] || 'pi-circle';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  formatFecha(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  getStatusSeverity(status: Cita['status']): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<Cita['status'], 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      AGENDADA: 'success',
      COMPLETADA: 'info',
      CANCELADA: 'danger'
    };
    return severities[status] || 'secondary';
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  getTipoPersonaLabel(): string {
    const tipo = this.tipoPersona();
    if (tipo === 'PF') return 'Persona Física';
    if (tipo === 'PM') return 'Persona Moral';
    return '';
  }

  getTramiteIcon(tramite: string): string {
    const tramiteObj = [...TRAMITES_PF, ...TRAMITES_PM].find(t => t.label === tramite || t.value === tramite);
    return tramiteObj?.icon || 'pi-file';
  }
}
