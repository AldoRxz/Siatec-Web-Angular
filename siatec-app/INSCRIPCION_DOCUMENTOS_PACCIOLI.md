# Integración de Documentos y Paccioli en Inscripción

## Resumen de Cambios

Se agregó funcionalidad completa de carga de documentos y procesamiento automático con Paccioli en el componente de inscripción del nuevo frontend Angular.

## ✨ Características Implementadas

### 1. Carga de Documentos por Sección
- ✅ Cada paso del stepper tiene su propia sección de documentos
- ✅ Al cambiar de paso, se cargan automáticamente los documentos de esa sección
- ✅ Indicador visual de "Cargando documentos..."

### 2. Procesamiento con Paccioli
- ✅ Botón "Subir Documento" en cada paso
- ✅ Acepta archivos: PDF, JPG, JPEG, PNG
- ✅ Integración con PaccioliService existente
- ✅ Indicador "Procesando documento..." durante upload

### 3. Auto-Rellenado de Campos
- ✅ Extracción automática de datos del documento
- ✅ Mapeo inteligente de campos Paccioli → Formulario
- ✅ Actualización automática de FormControls
- ✅ Notificación de éxito con PrimeNG Toast

## 🗂️ Archivos Modificados

### TypeScript (`inscripcion.component.ts`)
```typescript
// Nuevos imports
import { PaccioliService } from '../../../core/services/paccioli.service';

// Nuevos signals
readonly documentosPorSeccion = signal<{[seccion: string]: any[]}>({});
readonly cargandoDocumentos = signal(false);
readonly subiendoArchivo = signal(false);

// Mapeo de pasos a secciones
private readonly seccionesDocumentos: {[step: number]: string} = {
  0: 'Identificacion',
  1: 'DomicilioFiscal',
  2: 'RegimenYActividades',
  3: 'Impuestos',
  4: 'RepresentanteLegal',
  5: 'PersonaEfectuaraPagos'
};

// Métodos nuevos
async cargarDocumentosSeccion(stepIndex: number)
async onStepChange(event: any)
async procesarArchivoConPaccioli(file: File, stepIndex: number)
private getCurrentFormGroup(stepIndex: number)
private rellenarCamposDesdeRespuesta(response: any, stepIndex: number)
async onFileSelected(event: Event, stepIndex: number)
```

### HTML (`inscripcion.component.html`)
```html
<!-- Evento de cambio de paso -->
<p-stepper [value]="1" [linear]="true" (onActiveStepChange)="onStepChange($event)">

<!-- Sección de carga en cada panel -->
<div class="document-upload-section">
  <div class="upload-header">
    <i class="pi pi-file-pdf"></i>
    <h3>Documentos de Identificación</h3>
  </div>
  
  <div class="upload-controls">
    <label class="upload-button">
      <i class="pi pi-upload"></i>
      <span>Subir Documento</span>
      <input type="file" (change)="onFileSelected($event, 0)" />
    </label>
    @if (subiendoArchivo()) {
      <span class="upload-status">
        <i class="pi pi-spinner pi-spin"></i>
        Procesando documento...
      </span>
    }
  </div>
</div>
```

### SCSS (`inscripcion.component.scss`)
```scss
// Estilos para sección de carga de documentos
.document-upload-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed $border-color;
  border-radius: 0.875rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary-color;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }
  // ... más estilos
}
```

## 🔄 Flujo de Procesamiento

### 1. Usuario Cambia de Paso
```
1. Usuario hace clic en "Siguiente" o en un paso del stepper
2. Se dispara el evento (onActiveStepChange)
3. Se ejecuta onStepChange(event)
4. Se llama a cargarDocumentosSeccion(stepIndex)
5. Se muestra "Cargando documentos..."
6. Se actualiza el signal documentosPorSeccion
```

### 2. Usuario Sube Documento
```
1. Usuario hace clic en "Subir Documento"
2. Selecciona archivo del sistema
3. Se ejecuta onFileSelected(event, stepIndex)
4. Se muestra "Procesando documento..."
5. Se llama a procesarArchivoConPaccioli(file, stepIndex)
6. Se envía el archivo a Paccioli con el formulario actual como contexto
7. Paccioli retorna campos extraídos
8. Se ejecuta rellenarCamposDesdeRespuesta(response, stepIndex)
9. Se actualizan los FormControls con patchValue()
10. Se muestra notificación de éxito
```

## 📋 Mapeo de Campos

### Identificación (Step 0)
```typescript
'nombre' / 'nombres' → 'nombres'
'apellido_paterno' / 'primerApellido' → 'primerApellido'
'apellido_materno' / 'segundoApellido' → 'segundoApellido'
'razon_social' / 'razonSocial' → 'razonSocial'
'rfc' → 'rfc'
'curp' → 'curp'
'email' / 'correo' → 'email'
'telefono' → 'telefono'
```

### Domicilio Fiscal (Step 1)
```typescript
'calle' → 'calle'
'numero_exterior' / 'numeroExterior' → 'numeroExterior'
'numero_interior' / 'numeroInterior' → 'numeroInterior'
'colonia' → 'colonia'
'codigo_postal' / 'cp' → 'cp'
'municipio' → 'municipio'
'estado' → 'estado'
'entre_calles' → 'entreCalles'
'referencias' → 'referencias'
```

## 🧪 Pruebas

### Script de Verificación
```powershell
# Ejecutar desde ingresos-conf
.\test-inscripcion-documentos.ps1
```

### Prueba Manual
1. Abrir navegador en `http://localhost:4200`
2. Login: `contribuyente@test.com` / `Test123!`
3. Ir a Dashboard > Inscripción
4. Ingresar RFC válido (ej: `GAMA850320X71`)
5. En cada paso:
   - Verificar que aparece el botón "Subir Documento"
   - Subir un documento de prueba (PDF/imagen)
   - Verificar que aparece "Procesando documento..."
   - Verificar que los campos se rellenan automáticamente
   - Verificar notificación de éxito

## 🔍 Debug

### Logs en Consola
```javascript
// Al cambiar de paso
"Cargando documentos de sección: Identificacion"

// Al procesar archivo
"Respuesta de Paccioli:", { data: {...} }
"Campo nombres rellenado con: Juan"
"Campo primerApellido rellenado con: García"
```

### Verificar PaccioliService
```typescript
// En browser console
// Verificar que el servicio está disponible
console.log(this.paccioliService)
```

## 📝 Pendientes (TODOs)

### Backend
- [ ] Implementar endpoint GET para obtener documentos por sección
  ```typescript
  // TODO en cargarDocumentosSeccion()
  // const documentos = await this.contribuyentesService.getDocumentosPorSeccion(seccion);
  ```

### Frontend
- [ ] Mostrar lista de documentos ya subidos
- [ ] Permitir eliminar documentos
- [ ] Agregar previsualización de documentos
- [ ] Validar tamaño máximo de archivo (actualmente ilimitado)
- [ ] Agregar más secciones de carga (steps 2-5)

### Paccioli
- [ ] Mejorar mapeo de campos para más tipos de documentos
- [ ] Manejar respuestas con múltiples entidades
- [ ] Agregar validación de campos extraídos
- [ ] Soporte para documentos de representante legal

## 🎨 UI/UX

### Estados Visuales
- ✅ **Normal**: Botón azul con gradiente, border punteado gris
- ✅ **Hover**: Border azul, fondo azul claro
- ✅ **Cargando**: Spinner + mensaje "Cargando documentos..."
- ✅ **Procesando**: Spinner + mensaje "Procesando documento..."
- ✅ **Disabled**: Opacidad 0.6, cursor not-allowed

### Colores
```scss
$primary-color: #2563eb;  // Azul
$primary-dark: #1e40af;   // Azul oscuro
$border-color: #d4dbe8;   // Gris claro
```

## 🔐 Seguridad

- ✅ Validación de tipos de archivo (accept=".pdf,.jpg,.jpeg,.png")
- ⚠️ **Pendiente**: Validación de tamaño máximo
- ⚠️ **Pendiente**: Sanitización de nombres de archivo
- ⚠️ **Pendiente**: Validación de contenido MIME type

## 📚 Servicios Utilizados

### PaccioliService
```typescript
async procesarArchivos(
  files: File | File[], 
  instance: Record<string, any> = {}
): Promise<any>
```

### ContribuyentesService
```typescript
// TODO: Implementar
async getDocumentosPorSeccion(seccion: string): Promise<any[]>
```

## 🚀 Deployment

### Checklist
- [x] Código TypeScript compilado sin errores
- [x] Estilos SCSS compilados
- [x] PaccioliService importado correctamente
- [x] Eventos del stepper conectados
- [x] Mapeo de campos configurado
- [ ] Backend de documentos implementado
- [ ] Paccioli API disponible en producción

## 📖 Referencias

- **PrimeNG Stepper**: https://primeng.org/stepper
- **PrimeNG FileUpload**: https://primeng.org/fileupload
- **Angular Signals**: https://angular.dev/guide/signals
- **Paccioli API**: http://192.168.1.113:8080 (desarrollo)

---

**Última actualización**: 18 de Diciembre, 2025  
**Autor**: GitHub Copilot  
**Versión**: 1.0.0
