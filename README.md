# SIATEC Web Angular

Sistema Integral de Administración Tributaria - Frontend Angular

## 📋 Descripción

Aplicación web desarrollada con Angular 21, PrimeNG y Tailwind CSS para el Sistema Integral de Administración Tributaria y Economía Contributiva (SIATEC).

## 🚀 Tecnologías

- **Angular** v21.0.0
- **PrimeNG** v20.3.0 - Componentes UI
- **PrimeIcons** - Sistema de iconos
- **Tailwind CSS** v3.x - Framework CSS utility-first
- **TypeScript** - Lenguaje tipado
- **SCSS** - Preprocesador CSS
- **Docker** - Containerización con Nginx Alpine

## 📦 Estructura del Proyecto

```
Siatec-Web-Angular/
├── siatec-app/                 # Aplicación Angular
│   ├── src/                    # Código fuente
│   │   ├── app/               # Componentes y módulos
│   │   ├── assets/            # Recursos estáticos
│   │   └── styles.scss        # Estilos globales
│   ├── Dockerfile             # Multi-stage build
│   ├── docker-compose.yml     # Configuración Docker Compose
│   ├── nginx.conf             # Configuración Nginx
│   ├── entrypoint.sh          # Script de inicialización
│   ├── tailwind.config.js     # Configuración Tailwind
│   └── angular.json           # Configuración Angular
└── README.md
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos

- Node.js 20.x o superior
- npm 10.x o superior

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/AldoRxz/Siatec-Web-Angular.git
cd Siatec-Web-Angular/siatec-app

# Instalar dependencias (usar legacy-peer-deps por compatibilidad con PrimeNG)
npm install --legacy-peer-deps
```

### Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo (http://localhost:4200)
npm start

# Build de producción
npm run build

# Ejecutar tests
npm test

# Linting
npm run lint
```

## 🐳 Docker

### Configuración Docker

El proyecto incluye configuración Docker con generación dinámica de APIs en runtime.

#### Variables de Entorno

```bash
# Modo de despliegue
DEPLOYMENT_MODE=docker-local|kubernetes|auto

# URLs de APIs (modo kubernetes)
AUTH_API_BASE_URL=http://auth-api:8080/api/auth
CONTRIBUYENTES_API_BASE_URL=http://contribuyentes-api:8080/api/contribuyentes
CONTRIBUCIONES_API_BASE_URL=http://contribuciones-api:8080/api/contribuciones
TESORERIA_API_BASE_URL=http://tesoreria-api:8080/api/tesoreria
NOTIFICACIONES_API_BASE_URL=http://notificaciones-api:8080/api/notificaciones
```

### Uso con Docker

```bash
cd siatec-app

# Usar Docker Compose (recomendado)
docker-compose up -d

# O build y run manual
docker build -t siatec-angular:latest .
docker run -d -p 4200:80 -e DEPLOYMENT_MODE=docker-local siatec-angular:latest

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

Acceder a: http://localhost:4200

📖 Ver [DOCKER.md](siatec-app/DOCKER.md) para documentación completa de Docker.

## 🌐 Configuración de APIs

La aplicación genera dinámicamente la configuración de APIs según el ambiente:

- **docker-local**: APIs en localhost (puertos 5000-5005)
- **kubernetes**: Detección automática con Ingress
- **auto**: Detección según hostname

La configuración está disponible globalmente en el navegador:

```javascript
// Acceder a la configuración
console.log(window.__SIATEC_CONFIG);

// Obtener URL de un servicio
const authUrl = window.__SIATEC_CONFIG.getApiUrl('auth');

// Ver configuración completa
window.__SIATEC_CONFIG.logConfig();
```

## 📚 Librerías Principales

### PrimeNG

Componentes UI empresariales para Angular:

```typescript
// Importar componentes según necesidad
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
```

Documentación: https://primeng.org/

### Tailwind CSS

Framework CSS utility-first configurado en `tailwind.config.js`:

```html
<div class="flex items-center justify-center p-4 bg-blue-500">
  <h1 class="text-white text-2xl font-bold">SIATEC</h1>
</div>
```

Documentación: https://tailwindcss.com/

## 🔧 Configuración

### Angular

- Routing habilitado
- SCSS como preprocesador
- Standalone components (Angular 21)
- Build optimizado para producción

### Tailwind

Configurado para escanear todos los archivos HTML y TS:

```javascript
content: ["./src/**/*.{html,ts}"]
```

### PrimeNG

- Tema: Lara Light Blue
- Animaciones habilitadas
- Iconos PrimeIcons incluidos

## 🚢 Deploy

### Build de Producción

```bash
npm run build
```

Los archivos se generan en `dist/siatec-app/browser/`


### Convención de Commits

- `feat:` - Nueva característica
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Formateo, punto y coma faltantes, etc.
- `refactor:` - Refactorización de código
- `test:` - Agregar tests
- `chore:` - Cambios en build, herramientas, etc.



