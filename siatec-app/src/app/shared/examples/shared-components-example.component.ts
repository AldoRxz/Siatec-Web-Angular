import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn, TableAction } from '../components/data-table/data-table.component';
import { FormFieldComponent, DropdownOption } from '../components/form-field/form-field.component';
import { LoadingSpinnerComponent } from '../components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent, PageAction } from '../components/page-header/page-header.component';
import { ConfirmationDialogService } from '../components/confirmation-dialog/confirmation-dialog.component';
import { MenuItem } from 'primeng/api';

interface ExampleUser {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  fechaRegistro: Date;
  saldo: number;
}

/**
 * Componente de ejemplo que demuestra el uso de todos los componentes compartidos
 * Este archivo puede ser usado como referencia para implementar nuevas funcionalidades
 */
@Component({
  selector: 'app-shared-components-example',
  imports: [
    CommonModule,
    DataTableComponent,
    FormFieldComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent
  ],
  template: `
    <!-- Page Header con breadcrumb y acciones -->
    <app-page-header
      title="Ejemplo de Componentes Compartidos"
      subtitle="Demostración de todos los componentes reutilizables"
      icon="pi pi-code"
      [breadcrumb]="breadcrumbItems"
      [actions]="pageActions"
    />

    <!-- Loading Spinner -->
    <app-loading-spinner 
      [loading]="isLoading()"
      message="Cargando datos del ejemplo..."
      [overlay]="true"
    />

    <!-- Formulario de ejemplo -->
    <div class="card mb-4">
      <h2 class="text-xl font-semibold mb-3">Formulario de Ejemplo</h2>
      
      <div class="grid">
        <div class="col-12 md:col-6">
          <app-form-field
            label="Nombre completo"
            type="text"
            [(value)]="formData.nombre"
            [required]="true"
            [error]="formErrors().nombre"
            placeholder="Ingrese su nombre"
            hint="Mínimo 3 caracteres"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Email"
            type="email"
            [(value)]="formData.email"
            [required]="true"
            [error]="formErrors().email"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Contraseña"
            type="password"
            [(value)]="formData.password"
            [required]="true"
            [showPasswordStrength]="true"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Edad"
            type="number"
            [(value)]="formData.edad"
            [min]="18"
            [max]="100"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="País"
            type="dropdown"
            [(value)]="formData.pais"
            [options]="paisesOptions"
            [required]="true"
            placeholder="Seleccione un país"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Hobbies"
            type="multiselect"
            [(value)]="formData.hobbies"
            [options]="hobbiesOptions"
            placeholder="Seleccione sus hobbies"
          />
        </div>

        <div class="col-12">
          <app-form-field
            label="Biografía"
            type="textarea"
            [(value)]="formData.bio"
            [rows]="4"
            placeholder="Cuéntanos sobre ti..."
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Acepto términos y condiciones"
            type="checkbox"
            [(value)]="formData.aceptaTerminos"
            [required]="true"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Recibir notificaciones"
            type="switch"
            [(value)]="formData.notificaciones"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Fecha de nacimiento"
            type="date"
            [(value)]="formData.fechaNacimiento"
          />
        </div>

        <div class="col-12 md:col-6">
          <app-form-field
            label="Sueldo"
            type="number"
            [(value)]="formData.sueldo"
            numberMode="currency"
            currency="USD"
          />
        </div>
      </div>
    </div>

    <!-- Tabla de ejemplo -->
    <app-data-table
      title="Usuarios del Sistema"
      [data]="users"
      [columns]="userColumns"
      [actions]="userActions"
      [loading]="isLoadingTable()"
      [paginator]="true"
      [rows]="5"
      [rowsPerPageOptions]="[5, 10, 20]"
      [globalFilterFields]="['nombre', 'email']"
      searchPlaceholder="Buscar por nombre o email..."
      selectionMode="single"
      (rowSelect)="onUserSelect($event)"
    />
  `
})
export class SharedComponentsExampleComponent {
  private confirmDialog = inject(ConfirmationDialogService);

  // Loading states
  isLoading = signal(false);
  isLoadingTable = signal(false);

  // Form data
  formData = {
    nombre: '',
    email: '',
    password: '',
    edad: 25,
    pais: '',
    hobbies: [],
    bio: '',
    aceptaTerminos: false,
    notificaciones: true,
    fechaNacimiento: null,
    sueldo: 0
  };

  formErrors = signal({
    nombre: '',
    email: ''
  });

  // Dropdown options
  paisesOptions: DropdownOption[] = [
    { label: 'México', value: 'MX' },
    { label: 'Estados Unidos', value: 'US' },
    { label: 'España', value: 'ES' },
    { label: 'Argentina', value: 'AR' },
    { label: 'Colombia', value: 'CO' }
  ];

  hobbiesOptions: DropdownOption[] = [
    { label: 'Lectura', value: 'lectura' },
    { label: 'Deportes', value: 'deportes' },
    { label: 'Música', value: 'musica' },
    { label: 'Cine', value: 'cine' },
    { label: 'Viajes', value: 'viajes' }
  ];

  // Breadcrumb
  breadcrumbItems: MenuItem[] = [
    { label: 'Ejemplos', routerLink: '/ejemplos' },
    { label: 'Componentes Compartidos' }
  ];

  // Page actions
  pageActions: PageAction[] = [
    {
      label: 'Recargar',
      icon: 'pi pi-refresh',
      severity: 'secondary',
      onClick: () => this.loadData()
    },
    {
      label: 'Exportar',
      icon: 'pi pi-download',
      severity: 'info',
      onClick: () => this.exportData()
    }
  ];

  // Table data
  users: ExampleUser[] = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      activo: true,
      fechaRegistro: new Date('2024-01-15'),
      saldo: 1500.50
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria@example.com',
      activo: false,
      fechaRegistro: new Date('2024-02-20'),
      saldo: 2300.75
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos@example.com',
      activo: true,
      fechaRegistro: new Date('2024-03-10'),
      saldo: 980.25
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      email: 'ana@example.com',
      activo: true,
      fechaRegistro: new Date('2024-04-05'),
      saldo: 4200.00
    }
  ];

  // Table columns
  userColumns: TableColumn[] = [
    { 
      field: 'id', 
      header: 'ID', 
      sortable: true, 
      width: '80px',
      type: 'number'
    },
    { 
      field: 'nombre', 
      header: 'Nombre', 
      sortable: true,
      filterable: true
    },
    { 
      field: 'email', 
      header: 'Email', 
      sortable: true,
      filterable: true
    },
    { 
      field: 'activo', 
      header: 'Activo', 
      type: 'boolean',
      width: '100px'
    },
    { 
      field: 'fechaRegistro', 
      header: 'Fecha Registro', 
      type: 'date', 
      sortable: true,
      width: '150px'
    },
    { 
      field: 'saldo', 
      header: 'Saldo', 
      type: 'currency', 
      sortable: true,
      width: '130px'
    }
  ];

  // Table actions
  userActions: TableAction[] = [
    {
      icon: 'pi pi-eye',
      tooltip: 'Ver detalles',
      severity: 'info',
      onClick: (row) => this.viewUser(row)
    },
    {
      icon: 'pi pi-pencil',
      tooltip: 'Editar',
      severity: 'success',
      onClick: (row) => this.editUser(row)
    },
    {
      icon: 'pi pi-trash',
      tooltip: 'Eliminar',
      severity: 'danger',
      onClick: (row) => this.deleteUser(row)
    }
  ];

  async loadData() {
    this.isLoading.set(true);
    this.isLoadingTable.set(true);
    
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    this.isLoading.set(false);
    this.isLoadingTable.set(false);
  }

  exportData() {
    console.log('Exportando datos...', this.users);
    // Implementar lógica de exportación
  }

  viewUser(user: ExampleUser) {
    console.log('Ver usuario:', user);
    // Implementar lógica de vista
  }

  editUser(user: ExampleUser) {
    console.log('Editar usuario:', user);
    // Implementar lógica de edición
  }

  deleteUser(user: ExampleUser) {
    this.confirmDialog.confirmDelete(user.nombre, () => {
      // Eliminar usuario del array
      const index = this.users.findIndex(u => u.id === user.id);
      if (index > -1) {
        this.users.splice(index, 1);
        this.users = [...this.users]; // Trigger change detection
        console.log('Usuario eliminado:', user);
      }
    });
  }

  onUserSelect(user: ExampleUser) {
    console.log('Usuario seleccionado:', user);
  }
}
