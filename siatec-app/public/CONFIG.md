# Config.js - Configuración Dinámica de APIs

## 📋 ¿Qué es config.js?

`config.js` es un archivo JavaScript que expone la configuración de URLs de APIs en `window.__SIATEC_CONFIG`. Este archivo permite cambiar las URLs de las APIs **sin recompilar** la aplicación Angular.

## 🔄 Dos Versiones del Archivo

### 1. **Desarrollo Local** (`public/config.js`)
- ✅ Archivo versionado en Git
- ✅ URLs apuntando a localhost (puertos 5000-5005)
- ✅ Se usa cuando ejecutas `npm start`
- ✅ Puedes modificarlo para probar contra diferentes servidores

### 2. **Producción/Docker** (generado en runtime)
- ✅ Generado dinámicamente por `entrypoint.sh`
- ✅ URLs configuradas por variables de entorno de Docker
- ✅ Sobrescribe el archivo de desarrollo
- ✅ NO está en Git (se genera al iniciar el contenedor)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  index.html                                         │
│  <script src="/config.js"></script>                │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  config.js (expone window.__SIATEC_CONFIG)         │
│                                                     │
│  {                                                  │
│    authApiBaseUrl: "http://localhost:5002/...",   │
│    contribuyentesApiBaseUrl: "...",               │
│    ...                                             │
│  }                                                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Angular - ConfigService                           │
│                                                     │
│  getApiUrl(service: string): string {              │
│    return window.__SIATEC_CONFIG?.authApiBaseUrl;  │
│  }                                                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Servicios Angular (AuthService, etc.)             │
│  Usan ConfigService para obtener las URLs          │
└─────────────────────────────────────────────────────┘
```

## 🚀 Uso en Desarrollo

```bash
# 1. Iniciar el servidor de desarrollo
npm start

# 2. Angular carga public/config.js automáticamente

# 3. ConfigService lee window.__SIATEC_CONFIG

# 4. Los servicios obtienen las URLs correctas
```

### Cambiar URLs en Desarrollo

Edita `public/config.js`:

```javascript
window.__SIATEC_CONFIG = {
  authApiBaseUrl: 'http://mi-servidor-de-prueba:8080/api/auth',
  // ... otras URLs
};
```

## 🐳 Uso en Docker/Producción

```bash
# 1. Build de la imagen Docker
docker build -t siatec-angular .

# 2. Ejecutar contenedor con variables de entorno
docker run -d \
  -p 4200:80 \
  -e DEPLOYMENT_MODE=kubernetes \
  -e AUTH_API_BASE_URL=https://api.produccion.com/auth \
  siatec-angular

# 3. entrypoint.sh genera config.js con las URLs de producción

# 4. Nginx sirve la app con la configuración correcta
```

## 🔍 ¿Por qué esta Arquitectura?

### ✅ Ventajas

1. **Sin Recompilación**: Cambiar URLs sin rebuilds
2. **Mismo Build**: Un único build para dev/staging/prod
3. **Seguridad**: No exponer URLs en el código fuente
4. **Flexibilidad**: Configurar en runtime según el ambiente
5. **Compatibilidad**: Mantiene el patrón del proyecto original

### ❌ Alternativas Descartadas

#### Opción 1: Environment files de Angular
```typescript
// ❌ Requiere rebuild para cada ambiente
export const environment = {
  authApiUrl: 'http://localhost:5002'
};
```
**Problema**: Necesitas compilar una versión diferente para cada ambiente.

#### Opción 2: Angular CLI variables
```bash
# ❌ Complejo y requiere configuración adicional
ng build --configuration=production
```
**Problema**: Más configuración y menos flexible.

#### Opción 3: API Gateway discovery
```typescript
// ❌ Agrega complejidad y dependencia de red
await fetch('/api/config').then(r => r.json());
```
**Problema**: Requiere una API adicional y petición HTTP al inicio.

## 📝 TypeScript Integration

El `ConfigService` proporciona acceso tipado:

```typescript
import { ConfigService } from '@core/services';

constructor(private config: ConfigService) {}

// ✅ Type-safe
const authUrl: string = this.config.getApiUrl('auth');

// ✅ Autocomplete disponible
this.config.getApiUrl('contribuyentes' | 'auth' | ...);

// ✅ Detecta ambiente
if (this.config.isDevelopment()) {
  console.log('Modo desarrollo');
}
```

## 🧪 Testing

En tests, puedes mockear fácilmente:

```typescript
// Mock del config
window.__SIATEC_CONFIG = {
  authApiBaseUrl: 'http://mock-server/auth',
  environment: 'development',
  // ...
};

// El ConfigService usará el mock
const service = TestBed.inject(ConfigService);
expect(service.getApiUrl('auth')).toBe('http://mock-server/auth');
```

## 🔐 Seguridad

- ✅ Las URLs están en el cliente (es necesario)
- ✅ No hay secrets/tokens en config.js
- ✅ La autenticación se maneja por separado
- ✅ CORS protege las APIs en el servidor

## 📊 Comparación con el Proyecto Original

| Característica | sites.contribuyentes | Angular |
|----------------|---------------------|---------|
| Archivo config | ✅ config.js | ✅ config.js |
| Variables globales | ✅ window.__SIATEC_CONFIG | ✅ window.__SIATEC_CONFIG |
| Generación Docker | ✅ entrypoint.sh | ✅ entrypoint.sh |
| Acceso tipado | ❌ JavaScript puro | ✅ TypeScript + Service |
| Fallback defaults | ✅ Hardcoded | ✅ En ConfigService |

## 🎯 Conclusión

Esta arquitectura:
- ✅ **Mantiene compatibilidad** con el proyecto original
- ✅ **Sigue las mejores prácticas** de Angular
- ✅ **Es mantenible** y fácil de entender
- ✅ **Es flexible** para cualquier ambiente
- ✅ **Es testeable** con dependency injection

El archivo `config.js` es la **mejor práctica** para configuración dinámica en aplicaciones containerizadas.
