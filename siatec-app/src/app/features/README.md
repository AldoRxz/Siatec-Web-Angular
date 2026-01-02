# Features

Esta carpeta contiene todos los módulos de características (features) de la aplicación, organizados de forma modular para facilitar el mantenimiento y escalabilidad.

## Estructura

```
features/
├── auth/           # Autenticación y autorización
│   ├── login/     # Componente de inicio de sesión
│   └── register/  # Componente de registro
└── [futuras-features]/
```

## Convenciones

### Organización por Feature
Cada feature debe tener su propia carpeta con la siguiente estructura:

```
feature-name/
├── components/     # Componentes específicos del feature
├── services/       # Servicios específicos del feature
├── models/         # Modelos/interfaces específicos
├── guards/         # Guards de rutas (si aplica)
└── feature-name.component.ts/html/scss
```

### Nomenclatura
- Usar kebab-case para nombres de carpetas y archivos
- Los componentes principales deben tener el nombre del feature
- Los componentes internos deben estar en subcarpeta `components/`

## Features Actuales

### Auth (Autenticación)

#### Login
- **Ruta**: `/login`
- **Componente**: `LoginComponent`
- **Descripción**: Pantalla de inicio de sesión con validación de formularios
- **Características**:
  - Validación de email y contraseña
  - Manejo de errores
  - Integración con `AuthService`
  - Diseño responsive con PrimeNG

#### Register
- **Ruta**: `/register`
- **Componente**: `RegisterComponent`
- **Descripción**: Pantalla de registro de nuevos usuarios
- **Características**:
  - Validación completa de formularios
  - Indicador de fortaleza de contraseña
  - Validación de coincidencia de contraseñas
  - Máscara de teléfono
  - Diseño responsive con PrimeNG

## Componentes de PrimeNG Utilizados

- **Card**: Contenedor principal
- **InputText**: Campos de texto
- **Password**: Campo de contraseña con toggle
- **InputMask**: Máscara para teléfono
- **Button**: Botones de acción
- **Message**: Mensajes de error/éxito
- **Divider**: Separadores visuales

## Estilos

Los componentes utilizan:
- **PrimeNG**: Sistema de diseño base
- **Tailwind CSS**: Utilidades de espaciado y layout
- **SCSS**: Estilos personalizados por componente

### Tema Visual
- Gradiente morado/azul de fondo
- Tarjetas con efecto glassmorphism
- Animaciones suaves de entrada
- Diseño responsive mobile-first

## Mejores Prácticas

1. **Standalone Components**: Todos los componentes son standalone
2. **Lazy Loading**: Las rutas cargan componentes de forma diferida
3. **Reactive Forms**: Uso de FormBuilder y validaciones
4. **Type Safety**: TypeScript estricto en todos los archivos
5. **Accesibilidad**: Labels asociados, placeholders descriptivos
6. **UX**: Feedback visual, estados de carga, mensajes claros

## Próximos Pasos

- [ ] Agregar recuperación de contraseña
- [ ] Dashboard principal
- [ ] Gestión de contribuyentes
- [ ] Gestión de contribuciones
- [ ] Módulo de notificaciones
