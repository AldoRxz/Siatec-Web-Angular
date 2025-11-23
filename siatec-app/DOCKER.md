# SIATEC Angular - Docker Deployment

## 🐳 Configuración Docker

Este proyecto incluye configuración Docker multi-stage con generación dinámica de configuración de APIs.

### Características

- **Multi-stage build**: Construcción optimizada con Node.js 20 y despliegue con Nginx Alpine
- **Configuración dinámica**: Generación de `config.js` en runtime según el ambiente
- **Múltiples modos de despliegue**:
  - `docker-local`: Desarrollo local con APIs en localhost
  - `kubernetes`: Producción con Ingress
  - `auto`: Detección automática (default)

### Variables de Entorno

```bash
# Modo de despliegue
DEPLOYMENT_MODE=docker-local|kubernetes|auto

# URLs de APIs (solo para modo kubernetes)
AUTH_API_BASE_URL=http://auth-api:8080/api/auth
CONTRIBUYENTES_API_BASE_URL=http://contribuyentes-api:8080/api/contribuyentes
CONTRIBUCIONES_API_BASE_URL=http://contribuciones-api:8080/api/contribuciones
TESORERIA_API_BASE_URL=http://tesoreria-api:8080/api/tesoreria
NOTIFICACIONES_API_BASE_URL=http://notificaciones-api:8080/api/notificaciones
```

## 🚀 Uso

### Build

```bash
# Build de la imagen
docker build -t siatec-angular:latest .

# Build con argumentos
docker build \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -t siatec-angular:latest .
```

### Run

```bash
# Desarrollo local (APIs en localhost:500X)
docker run -d \
  -p 4200:80 \
  -e DEPLOYMENT_MODE=docker-local \
  --name siatec-angular \
  siatec-angular:latest

# Kubernetes/Producción
docker run -d \
  -p 4200:80 \
  -e DEPLOYMENT_MODE=kubernetes \
  -e AUTH_API_BASE_URL=http://auth-api:8080/api/auth \
  --name siatec-angular \
  siatec-angular:latest
```

### Docker Compose

```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 📦 Acceso a la Configuración

La aplicación expone la configuración globalmente en el navegador:

```javascript
// Acceder a la configuración
console.log(window.__SIATEC_CONFIG);
console.log(window.API_CONFIG); // Alias de compatibilidad

// Obtener URL de un servicio
const authUrl = window.__SIATEC_CONFIG.getApiUrl('auth');

// Ver configuración completa
window.__SIATEC_CONFIG.logConfig();
```

## 🔍 Healthcheck

El contenedor incluye healthcheck automático que verifica que Nginx esté respondiendo correctamente.

```bash
# Ver estado del healthcheck
docker inspect --format='{{json .State.Health}}' siatec-angular
```

## 📝 Logs

```bash
# Logs del contenedor
docker logs -f siatec-angular

# Logs de nginx
docker exec siatec-angular tail -f /var/log/nginx/access.log
docker exec siatec-angular tail -f /var/log/nginx/error.log
```

## 🛠️ Desarrollo

```bash
# Desarrollo sin Docker
npm start

# Build de producción
npm run build

# Preview del build
npx http-server dist/siatec-app/browser -p 8080
```
