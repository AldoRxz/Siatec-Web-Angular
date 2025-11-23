# Core Architecture - SIATEC Angular

Esta carpeta contiene la arquitectura core de la aplicación SIATEC, implementada siguiendo las mejores prácticas de Angular y basada en el sistema existente de `sites.contribuyentes`.

## 📁 Estructura

```
core/
├── guards/          # Route guards para protección de rutas
├── interceptors/    # HTTP interceptors para manejo centralizado
├── models/          # Interfaces y tipos TypeScript
└── services/        # Servicios de negocio y API
```

## 🔧 Servicios

### ConfigService
Maneja la configuración dinámica de URLs de APIs desde `window.__SIATEC_CONFIG`.

```typescript
import { ConfigService } from '@core/services';

constructor(private config: ConfigService) {}

// Obtener URL de una API
const authUrl = this.config.getApiUrl('auth');

// Verificar ambiente
if (this.config.isDevelopment()) {
  console.log('Modo desarrollo');
}
```

### AuthService
Gestiona autenticación, tokens y estado del usuario con Angular Signals.

```typescript
import { AuthService } from '@core/services';

constructor(private auth: AuthService) {}

// Login
this.auth.login({ email, password }).subscribe({
  next: (response) => {
    console.log('Login exitoso', response);
  },
  error: (error) => {
    console.error('Error en login', error);
  }
});

// Obtener usuario actual (Signal)
const user = this.auth.currentUser();
const isAuth = this.auth.isAuthenticated();

// Observable para reactive forms
this.auth.user$.subscribe(user => {
  console.log('Usuario:', user);
});

// Logout
this.auth.logout();
```

### BaseApiService
Clase base para todos los servicios de API con métodos HTTP comunes.

```typescript
import { BaseApiService } from '@core/services';

@Injectable({ providedIn: 'root' })
export class MiServicio extends BaseApiService {
  
  getData(): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'endpoint');
    return this.get<any>(url);
  }

  postData(data: any): Observable<any> {
    const url = this.buildUrl(this.baseUrl, 'endpoint');
    return this.post<any>(url, data);
  }
}
```

### ContribuyentesService
Servicio completo para el módulo de Contribuyentes.

```typescript
import { ContribuyentesService } from '@core/services';

constructor(private contribuyentes: ContribuyentesService) {}

// Obtener contribuyentes
this.contribuyentes.getContribuyentes().subscribe(data => {
  console.log('Contribuyentes:', data);
});

// Subir archivo
const formData = new FormData();
formData.append('file', file);
this.contribuyentes.subirArchivo(contribuyenteId, formData).subscribe();

// Descargar archivo
this.contribuyentes.descargarArchivo(contribId, archivoId).subscribe(blob => {
  const url = window.URL.createObjectURL(blob);
  window.open(url);
});
```

## 🛡️ Guards

### authGuard
Protege rutas que requieren autenticación.

```typescript
import { Routes } from '@angular/router';
import { authGuard } from '@core/guards';

export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component')
  }
];
```

### guestGuard
Protege rutas que solo deben ser accesibles sin autenticación (login, registro).

```typescript
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login.component')
  }
];
```

## 🔌 Interceptors

### authInterceptor
Agrega automáticamente el token de autorización a todas las peticiones HTTP.

**No necesitas hacer nada**, el interceptor está configurado globalmente en `app.config.ts`.

```typescript
// ❌ NO hagas esto manualmente
headers: { Authorization: `Bearer ${token}` }

// ✅ El interceptor lo hace automáticamente
this.http.get('/api/data') // Token agregado automáticamente
```

El interceptor también maneja:
- Errores 401 (logout automático)
- Errores 403 (acceso denegado)

## 📦 Modelos

### User
```typescript
interface User {
  id: number;
  email: string;
  contribuyenteId?: number;
  nombre?: string;
  apellidos?: string;
}
```

### Contribuyente
```typescript
interface Contribuyente {
  id: number;
  nombre: string;
  apellidos?: string;
  rfc?: string;
  tipo: 'fisica' | 'moral';
  estatus?: string;
}
```

### PaginatedResponse
```typescript
interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

## 🚀 Uso en Componentes

### Ejemplo completo de componente con autenticación

```typescript
import { Component, inject } from '@angular/core';
import { AuthService, ContribuyentesService } from '@core/services';
import { Contribuyente } from '@core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div *ngIf="auth.isAuthenticated()">
      <h1>Bienvenido {{ auth.currentUser()?.nombre }}</h1>
      <ul>
        <li *ngFor="let contrib of contribuyentes">
          {{ contrib.nombre }}
        </li>
      </ul>
    </div>
  `
})
export class DashboardComponent {
  // Inject con la nueva sintaxis
  auth = inject(AuthService);
  contribuyentesService = inject(ContribuyentesService);

  contribuyentes: Contribuyente[] = [];

  ngOnInit() {
    this.loadContribuyentes();
  }

  loadContribuyentes() {
    this.contribuyentesService.getContribuyentes().subscribe({
      next: (data) => {
        this.contribuyentes = data;
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  logout() {
    this.auth.logout();
  }
}
```

## 🔄 Migración desde JavaScript

### Antes (JavaScript vanilla)
```javascript
// authService.js
window.authService.loginCuentaContribuyente(credentials)
  .then(response => {
    console.log('Login exitoso');
  });
```

### Después (Angular)
```typescript
// component.ts
this.authService.login(credentials).subscribe({
  next: (response) => {
    console.log('Login exitoso');
  }
});
```

## 🎯 Ventajas de esta Arquitectura

1. **Tipado completo**: TypeScript detecta errores en tiempo de desarrollo
2. **Reactivo**: Uso de RxJS Observables y Angular Signals
3. **Mantenible**: Separación clara de responsabilidades
4. **Testeable**: Servicios inyectables fáciles de mockear
5. **Reutilizable**: BaseApiService reduce código duplicado
6. **Seguro**: Interceptors manejan autenticación automáticamente
7. **Escalable**: Fácil agregar nuevos servicios y módulos

## 📚 Mejores Prácticas Implementadas

- ✅ Dependency Injection con `providedIn: 'root'`
- ✅ Angular Signals para estado reactivo
- ✅ Standalone components compatible
- ✅ HTTP Interceptors para cross-cutting concerns
- ✅ Route Guards funcionales (CanActivateFn)
- ✅ Error handling centralizado
- ✅ Configuración dinámica desde Docker
- ✅ Barrel exports para imports limpios
- ✅ Interfaces TypeScript para type safety

## 🔗 Referencias

- [Angular HTTP Client](https://angular.dev/guide/http)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Guards](https://angular.dev/guide/router#preventing-unauthorized-access)
- [RxJS Operators](https://rxjs.dev/guide/operators)
