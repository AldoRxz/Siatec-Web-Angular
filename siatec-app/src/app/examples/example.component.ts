import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  AuthService, 
  ContribuyentesService, 
  ConfigService 
} from '../core/services';
import { 
  User, 
  Contribuyente, 
  LoginCredentials 
} from '../core/models';

/**
 * Ejemplo de uso de los servicios core de SIATEC
 * Este componente demuestra las mejores prácticas de Angular
 */
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container p-4">
      <h1 class="text-2xl font-bold mb-4">SIATEC - Ejemplo de Uso</h1>

      <!-- Estado de autenticación -->
      <div class="mb-6 p-4 border rounded">
        <h2 class="text-xl font-semibold mb-2">Estado de Autenticación</h2>
        <p>Autenticado: {{ auth.isAuthenticated() ? 'Sí' : 'No' }}</p>
        @if (auth.currentUser(); as user) {
          <p>Usuario: {{ user.nombre || user.email }}</p>
          <p>ID Contribuyente: {{ auth.getContribuyenteId() }}</p>
        }
      </div>

      <!-- Formulario de login -->
      @if (!auth.isAuthenticated()) {
        <div class="mb-6 p-4 border rounded">
          <h2 class="text-xl font-semibold mb-2">Login</h2>
          <form (ngSubmit)="login()" class="space-y-2">
            <input 
              type="email" 
              [(ngModel)]="credentials.email" 
              name="email"
              placeholder="Email"
              class="w-full p-2 border rounded"
            />
            <input 
              type="password" 
              [(ngModel)]="credentials.password" 
              name="password"
              placeholder="Password"
              class="w-full p-2 border rounded"
            />
            <button 
              type="submit"
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Iniciar Sesión
            </button>
          </form>
          @if (loginError) {
            <p class="text-red-500 mt-2">{{ loginError }}</p>
          }
        </div>
      } @else {
        <button 
          (click)="logout()"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-6"
        >
          Cerrar Sesión
        </button>
      }

      <!-- Lista de contribuyentes -->
      @if (auth.isAuthenticated()) {
        <div class="mb-6 p-4 border rounded">
          <h2 class="text-xl font-semibold mb-2">Contribuyentes</h2>
          <button 
            (click)="loadContribuyentes()"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
          >
            Cargar Contribuyentes
          </button>

          @if (loading) {
            <p>Cargando...</p>
          } @else if (contribuyentes.length > 0) {
            <ul class="space-y-2">
              @for (contrib of contribuyentes; track contrib.id) {
                <li class="p-2 bg-gray-100 rounded">
                  <strong>{{ contrib.nombre }}</strong> - {{ contrib.tipo }}
                  @if (contrib.rfc) {
                    <span class="text-gray-600">({{ contrib.rfc }})</span>
                  }
                </li>
              }
            </ul>
          } @else {
            <p class="text-gray-500">No hay contribuyentes</p>
          }

          @if (error) {
            <p class="text-red-500 mt-2">{{ error }}</p>
          }
        </div>
      }

      <!-- Información de configuración -->
      <div class="p-4 border rounded bg-gray-50">
        <h2 class="text-xl font-semibold mb-2">Configuración</h2>
        <p><strong>Ambiente:</strong> {{ config.getEnvironment() }}</p>
        <p><strong>Auth API:</strong> {{ config.getApiUrl('auth') }}</p>
        <p><strong>Contribuyentes API:</strong> {{ config.getApiUrl('contribuyentes') }}</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ExampleComponent implements OnInit {
  // Inject services con la nueva sintaxis de Angular
  auth = inject(AuthService);
  contribuyentesService = inject(ContribuyentesService);
  config = inject(ConfigService);

  // Estado del componente
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };

  contribuyentes: Contribuyente[] = [];
  loading = false;
  error: string | null = null;
  loginError: string | null = null;

  ngOnInit() {
    // Log de la configuración en desarrollo
    if (this.config.isDevelopment()) {
      console.log('Componente inicializado');
      console.log('Usuario actual:', this.auth.currentUser());
    }

    // Si está autenticado, cargar datos
    if (this.auth.isAuthenticated()) {
      this.loadContribuyentes();
    }
  }

  /**
   * Realiza el login
   */
  login() {
    this.loginError = null;

    this.auth.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);
        this.loadContribuyentes();
      },
      error: (error) => {
        console.error('Error en login', error);
        this.loginError = error.message || 'Error al iniciar sesión';
      }
    });
  }

  /**
   * Cierra la sesión
   */
  logout() {
    this.auth.logout();
    this.contribuyentes = [];
  }

  /**
   * Carga la lista de contribuyentes
   */
  loadContribuyentes() {
    this.loading = true;
    this.error = null;

    this.contribuyentesService.getContribuyentes().subscribe({
      next: (data) => {
        console.log('Contribuyentes cargados:', data);
        this.contribuyentes = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando contribuyentes:', error);
        this.error = error.message || 'Error al cargar contribuyentes';
        this.loading = false;
      }
    });
  }

  /**
   * Ejemplo de subir archivo
   */
  uploadFile(event: Event, contribuyenteId: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.contribuyentesService.subirArchivo(contribuyenteId, formData).subscribe({
      next: (response) => {
        console.log('Archivo subido:', response);
      },
      error: (error) => {
        console.error('Error subiendo archivo:', error);
      }
    });
  }

  /**
   * Ejemplo de descargar archivo
   */
  downloadFile(contribuyenteId: number, archivoId: number) {
    this.contribuyentesService.descargarArchivo(contribuyenteId, archivoId).subscribe({
      next: (blob) => {
        // Crear URL del blob y descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `archivo-${archivoId}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error descargando archivo:', error);
      }
    });
  }
}
