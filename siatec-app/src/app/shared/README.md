# Componentes Compartidos - SIATEC

Esta carpeta contiene componentes reutilizables construidos con PrimeNG siguiendo las mejores prácticas de Angular.

## 📦 Componentes Disponibles

### 1. DataTableComponent (`app-data-table`)

Tabla de datos con paginación, ordenamiento, filtrado y acciones personalizables.

**Características:**
- ✅ Paginación integrada
- ✅ Ordenamiento por columnas
- ✅ Búsqueda global
- ✅ Acciones por fila (editar, eliminar, etc.)
- ✅ Formateo de tipos de datos (fecha, moneda, booleano)
- ✅ Selección de filas
- ✅ Estados de carga

**Ejemplo de uso:**

```typescript
import { Component } from '@angular/core';
import { DataTableComponent, TableColumn, TableAction } from '@/shared';

@Component({
  selector: 'app-users',
  imports: [DataTableComponent],
  template: `
    <app-data-table
      title="Usuarios"
      [data]="users"
      [columns]="columns"
      [actions]="actions"
      [loading]="isLoading"
      [paginator]="true"
      [rows]="10"
      [globalFilterFields]="['nombre', 'email']"
      (rowSelect)="onUserSelect($event)"
    />
  `
})
export class UsersComponent {
  users = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', activo: true, fecha: new Date() },
    { id: 2, nombre: 'María García', email: 'maria@example.com', activo: false, fecha: new Date() }
  ];

  columns: TableColumn[] = [
    { field: 'id', header: 'ID', sortable: true, width: '80px' },
    { field: 'nombre', header: 'Nombre', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'activo', header: 'Activo', type: 'boolean' },
    { field: 'fecha', header: 'Fecha Registro', type: 'date', sortable: true }
  ];

  actions: TableAction[] = [
    {
      icon: 'pi pi-pencil',
      tooltip: 'Editar',
      severity: 'info',
      onClick: (row) => this.editUser(row)
    },
    {
      icon: 'pi pi-trash',
      tooltip: 'Eliminar',
      severity: 'danger',
      onClick: (row) => this.deleteUser(row)
    }
  ];

  isLoading = false;

  editUser(user: any) {
    console.log('Editar usuario:', user);
  }

  deleteUser(user: any) {
    console.log('Eliminar usuario:', user);
  }

  onUserSelect(user: any) {
    console.log('Usuario seleccionado:', user);
  }
}
```

---

### 2. FormFieldComponent (`app-form-field`)

Campo de formulario universal que soporta múltiples tipos de inputs con validación integrada.

**Tipos soportados:**
- `text`, `email`, `password`
- `number` (con modo decimal o currency)
- `textarea`
- `date`
- `dropdown`, `multiselect`
- `checkbox`, `radio`, `switch`

**Ejemplo de uso:**

```typescript
import { Component, signal } from '@angular/core';
import { FormFieldComponent } from '@/shared';

@Component({
  selector: 'app-user-form',
  imports: [FormFieldComponent],
  template: `
    <form>
      <app-form-field
        label="Nombre completo"
        type="text"
        [(value)]="formData.nombre"
        [required]="true"
        [error]="errors().nombre"
        placeholder="Ingrese su nombre"
      />

      <app-form-field
        label="Email"
        type="email"
        [(value)]="formData.email"
        [required]="true"
        [error]="errors().email"
        placeholder="correo@ejemplo.com"
      />

      <app-form-field
        label="Contraseña"
        type="password"
        [(value)]="formData.password"
        [required]="true"
        [showPasswordStrength]="true"
      />

      <app-form-field
        label="Edad"
        type="number"
        [(value)]="formData.edad"
        [min]="18"
        [max]="100"
      />

      <app-form-field
        label="País"
        type="dropdown"
        [(value)]="formData.pais"
        [options]="paises"
        [required]="true"
        placeholder="Seleccione un país"
      />

      <app-form-field
        label="Biografía"
        type="textarea"
        [(value)]="formData.bio"
        [rows]="5"
        placeholder="Cuéntanos sobre ti..."
      />

      <app-form-field
        label="Acepto términos y condiciones"
        type="checkbox"
        [(value)]="formData.aceptaTerminos"
        [required]="true"
      />

      <app-form-field
        label="Recibir notificaciones"
        type="switch"
        [(value)]="formData.notificaciones"
      />
    </form>
  `
})
export class UserFormComponent {
  formData = {
    nombre: '',
    email: '',
    password: '',
    edad: 0,
    pais: '',
    bio: '',
    aceptaTerminos: false,
    notificaciones: true
  };

  errors = signal({
    nombre: '',
    email: ''
  });

  paises = [
    { label: 'México', value: 'MX' },
    { label: 'Estados Unidos', value: 'US' },
    { label: 'España', value: 'ES' }
  ];
}
```

---

### 3. LoadingSpinnerComponent (`app-loading-spinner`)

Indicador de carga con overlay opcional.

**Ejemplo de uso:**

```typescript
import { Component, signal } from '@angular/core';
import { LoadingSpinnerComponent } from '@/shared';

@Component({
  selector: 'app-dashboard',
  imports: [LoadingSpinnerComponent],
  template: `
    <!-- Spinner con overlay -->
    <app-loading-spinner 
      [loading]="isLoading()"
      message="Cargando datos..."
      [overlay]="true"
    />

    <!-- Spinner inline -->
    <app-loading-spinner 
      [loading]="isLoadingChart()"
      message="Generando gráfica..."
      [overlay]="false"
      [size]="40"
    />

    <div>Contenido de la página</div>
  `
})
export class DashboardComponent {
  isLoading = signal(false);
  isLoadingChart = signal(false);

  async loadData() {
    this.isLoading.set(true);
    try {
      // Cargar datos
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

---

### 4. PageHeaderComponent (`app-page-header`)

Encabezado de página con título, breadcrumb y acciones.

**Ejemplo de uso:**

```typescript
import { Component } from '@angular/core';
import { PageHeaderComponent, PageAction } from '@/shared';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-contribuyentes',
  imports: [PageHeaderComponent],
  template: `
    <app-page-header
      title="Contribuyentes"
      subtitle="Administración de contribuyentes del sistema"
      icon="pi pi-users"
      [breadcrumb]="breadcrumbItems"
      [actions]="pageActions"
    />

    <!-- Contenido de la página -->
  `
})
export class ContribuyentesComponent {
  breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Contribuyentes', routerLink: '/contribuyentes' }
  ];

  pageActions: PageAction[] = [
    {
      label: 'Exportar',
      icon: 'pi pi-download',
      severity: 'secondary',
      onClick: () => this.exportData()
    },
    {
      label: 'Nuevo Contribuyente',
      icon: 'pi pi-plus',
      severity: 'success',
      onClick: () => this.createNew()
    }
  ];

  exportData() {
    console.log('Exportando datos...');
  }

  createNew() {
    console.log('Crear nuevo contribuyente');
  }
}
```

---

### 5. ConfirmationDialogComponent + Service

Diálogos de confirmación para acciones críticas.

**Setup (una sola vez en app.ts o layout):**

```typescript
import { Component } from '@angular/core';
import { ConfirmationDialogComponent } from '@/shared';

@Component({
  selector: 'app-root',
  imports: [ConfirmationDialogComponent],
  template: `
    <app-confirmation-dialog />
    <router-outlet />
  `
})
export class App {}
```

**Uso en componentes:**

```typescript
import { Component, inject } from '@angular/core';
import { ConfirmationDialogService } from '@/shared';

@Component({
  selector: 'app-users',
  template: `
    <button (click)="deleteUser(user)">Eliminar</button>
  `
})
export class UsersComponent {
  private confirmDialog = inject(ConfirmationDialogService);

  deleteUser(user: any) {
    // Método helper para eliminación
    this.confirmDialog.confirmDelete(user.nombre, () => {
      // Lógica de eliminación
      console.log('Usuario eliminado');
    });
  }

  saveChanges() {
    // Método helper para guardar
    this.confirmDialog.confirmSave(() => {
      console.log('Guardando...');
    });
  }

  customConfirm() {
    // Diálogo personalizado
    this.confirmDialog.confirm({
      message: '¿Proceder con esta acción?',
      header: 'Confirmación Personalizada',
      icon: 'pi pi-exclamation-circle',
      acceptLabel: 'Continuar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-primary',
      accept: () => console.log('Aceptado'),
      reject: () => console.log('Rechazado')
    });
  }
}
```

---

## 🎨 Estilos y Personalización

Todos los componentes utilizan las clases de PrimeNG y pueden ser personalizados mediante:

1. **Inputs del componente**: Cada componente expone múltiples inputs para configuración
2. **CSS Variables de PrimeNG**: Personaliza colores, tamaños y espaciado
3. **Estilos globales**: Define estilos en `styles.scss`

---

## 📝 Mejores Prácticas

1. **Importación**: Usa el barrel export para importar componentes
   ```typescript
   import { DataTableComponent, FormFieldComponent } from '@/shared';
   ```

2. **Signals**: Los componentes usan Angular Signals para reactividad
3. **Standalone**: Todos los componentes son standalone
4. **Tipado fuerte**: Interfaces TypeScript para todas las configuraciones
5. **Documentación inline**: JSDoc en todos los componentes

---

## 🔧 Mantenimiento

- **Ubicación**: `/src/app/shared/components/`
- **Convención de nombres**: `kebab-case` para archivos, `PascalCase` para clases
- **Pruebas**: Agregar tests unitarios en archivos `.spec.ts`
- **Versionamiento**: Documentar cambios en CHANGELOG al modificar componentes

---

## 📚 Recursos

- [Documentación PrimeNG](https://primeng.org/)
- [Angular Signals](https://angular.dev/guide/signals)
- [Standalone Components](https://angular.dev/guide/components)
