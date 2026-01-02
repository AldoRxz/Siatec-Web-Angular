# 🎨 SIATEC Design System

Sistema de diseño estandarizado para mantener consistencia visual en toda la aplicación.

---

## 📐 Layout

| Elemento | Valor | Uso |
|----------|-------|-----|
| `max-width` | `1400px` | Contenedor principal de cada página |
| `padding` página | `0 1rem` | Padding lateral del contenedor |
| `margin` página | `0 auto` | Centrado del contenedor |
| `gap` entre secciones | `1.5rem` - `2rem` | Espacio entre cards/secciones |

---

## 🎨 Colores

### Colores Primarios
| Variable | Valor | Uso |
|----------|-------|-----|
| `$primary` | `#2563eb` | Color principal, botones, links |
| `$primary-dark` | `#1e40af` | Hover, gradientes |
| `$primary-light` | `#3b82f6` | Estados activos |
| `$primary-bg` | `#eff6ff` | Fondos suaves |

### Colores de Acento
| Variable | Valor | Uso |
|----------|-------|-----|
| `$accent` / `$success` | `#16a34a` | Éxito, confirmaciones |
| `$accent-dark` | `#15803d` | Hover verde |
| `$warn` | `#ea580c` | Advertencias |
| `$danger` | `#dc2626` | Errores, cancelar |
| `$info` | `#0ea5e9` | Información |

### Colores de Texto
| Variable | Valor | Uso |
|----------|-------|-----|
| `$text-primary` | `#1e293b` | Texto principal |
| `$text-secondary` | `#64748b` | Texto secundario |
| `$text-muted` | `#94a3b8` | Texto deshabilitado, hints |

### Colores de Fondo y Bordes
| Variable | Valor | Uso |
|----------|-------|-----|
| `$bg-page` | `#f8fafc` | Fondo de página |
| `$bg-card` | `#ffffff` | Fondo de cards |
| `$border` | `#e2e8f0` | Bordes principales |
| `$border-light` | `#f1f5f9` | Bordes suaves |

---

## 📝 Tipografía

### Tamaños de Fuente
| Elemento | Tamaño | Peso | Uso |
|----------|--------|------|-----|
| Título página (h1) | `1.5rem` | `700` | Headers principales |
| Subtítulo página | `0.9rem` | `400` | Descripción bajo títulos |
| Título sección (h2) | `1.1rem` | `600` | Headers de cards/secciones |
| Título formulario (h3) | `0.95rem` | `600` | Títulos dentro de forms |
| Texto normal | `0.9rem` | `400` | Contenido general |
| Labels | `0.85rem` | `500` | Etiquetas de campos |
| Texto pequeño | `0.8rem` | `400` | Hints, ayuda |
| Texto muy pequeño | `0.75rem` | `400` | Badges, tags |

### Line Height
- Títulos: `1.2` - `1.3`
- Texto normal: `1.5` - `1.6`

---

## 🔘 Botones

### Tamaños
| Tipo | Padding | Font Size | Border Radius |
|------|---------|-----------|---------------|
| **Principal** | `0.875rem 1.5rem` | `0.95rem` | `0.75rem` |
| **Secundario** | `0.75rem 1.25rem` | `0.875rem` | `0.625rem` |
| **Pequeño** | `0.5rem 1rem` | `0.8rem` | `0.5rem` |
| **Icono** | `2rem x 2rem` | - | `0.5rem` |

### Estilos
```scss
// Botón Principal
.btn-primary {
  padding: 0.875rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.25);
}

// Botón Secundario
.btn-secondary {
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.625rem;
  background: transparent;
  border: 1px solid $border;
}

// Botón de Icono
.btn-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}
```

---

## 📦 Inputs y Formularios

### Campos de Texto
| Propiedad | Valor |
|-----------|-------|
| `padding` | `0.875rem 1rem` |
| `font-size` | `0.9rem` |
| `border-radius` | `0.75rem` |
| `border` | `1px solid $border` |
| `min-height` | `44px` |

### Campos con Icono
| Propiedad | Valor |
|-----------|-------|
| `padding-left` | `2.75rem` |
| Tamaño icono | `1rem` |
| Posición icono left | `1rem` |

### Select / Dropdown
| Propiedad | Valor |
|-----------|-------|
| `padding` | `0.875rem 1rem` |
| `font-size` | `0.9rem` |
| `border-radius` | `0.75rem` |

### Labels
| Propiedad | Valor |
|-----------|-------|
| `font-size` | `0.85rem` |
| `font-weight` | `500` |
| `margin-bottom` | `0.375rem` |
| `color` | `$text-primary` |

### FloatLabel (Activado)
| Propiedad | Valor |
|-----------|-------|
| `font-size` | `0.75rem` |
| `top` | `-0.5rem` |
| `color` | `$primary` |
| `background` | `$bg-card` |
| `padding` | `0 0.5rem` |

### Mensajes de Error
| Propiedad | Valor |
|-----------|-------|
| `font-size` | `0.75rem` |
| `color` | `$danger` |
| `margin-top` | `0.375rem` |

---

## 🃏 Cards

### Card Principal
```scss
.card {
  background: $bg-card;
  border-radius: 1rem;
  border: 1px solid $border;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
```

### Card Header
| Propiedad | Valor |
|-----------|-------|
| `padding` | `1.25rem 1.5rem` |
| `background` | `linear-gradient(135deg, $primary, $primary-dark)` |
| `color` | `#ffffff` |
| Font size título | `1.1rem` |
| Font weight | `600` |

### Card Body
| Propiedad | Valor |
|-----------|-------|
| `padding` | `1.5rem` |
| `background` | `$bg-card` |

---

## 🏷️ Tags y Badges

### Tags de Estado
| Propiedad | Valor |
|-----------|-------|
| `padding` | `0.375rem 0.75rem` |
| `font-size` | `0.75rem` |
| `font-weight` | `600` |
| `border-radius` | `2rem` |

### Stat Badges (Header)
| Propiedad | Valor |
|-----------|-------|
| `padding` | `0.5rem 1rem` |
| `font-size` | `0.8rem` |
| `font-weight` | `600` |
| `border-radius` | `2rem` |
| `background` | `rgba(255, 255, 255, 0.18)` |

---

## 📊 Tablas

### Header
| Propiedad | Valor |
|-----------|-------|
| `padding` | `0.875rem 1rem` |
| `font-size` | `0.75rem` |
| `font-weight` | `600` |
| `text-transform` | `uppercase` |
| `letter-spacing` | `0.04em` |
| `background` | `linear-gradient(180deg, #f8fafc, #f1f5f9)` |
| `color` | `$text-secondary` |

### Celdas
| Propiedad | Valor |
|-----------|-------|
| `padding` | `0.875rem 1rem` |
| `font-size` | `0.875rem` |
| `color` | `$text-primary` |
| `border-bottom` | `1px solid $border-light` |

---

## 🖼️ Iconos

### Tamaños
| Contexto | Tamaño |
|----------|--------|
| Dentro de inputs | `1rem` |
| Botones de acción | `0.9rem` |
| Headers de sección | `1.1rem` |
| Header principal | `1.5rem` |
| Estados vacíos | `3rem` |
| Hero icons | `1.75rem` |

---

## 📱 Hero Header (Página)

```scss
.hero-header {
  padding: 1.5rem 2rem;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  box-shadow: 0 8px 30px rgba(37, 99, 235, 0.2);
  margin-bottom: 1.5rem;
  
  &__icon {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.875rem;
    font-size: 1.5rem;
  }
  
  &__title {
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  &__subtitle {
    font-size: 0.9rem;
    opacity: 0.9;
  }
}
```

---

## 📐 Espaciado (Spacing)

| Variable | Valor | Uso |
|----------|-------|-----|
| `xs` | `0.25rem` | Espaciado mínimo |
| `sm` | `0.5rem` | Entre elementos pequeños |
| `md` | `0.75rem` | Gap estándar |
| `base` | `1rem` | Padding base |
| `lg` | `1.25rem` | Padding de secciones |
| `xl` | `1.5rem` | Separación de secciones |
| `2xl` | `2rem` | Separación grande |

---

## 🔲 Border Radius

| Variable | Valor | Uso |
|----------|-------|-----|
| `sm` | `0.375rem` | Badges, tags pequeños |
| `md` | `0.5rem` | Botones pequeños, inputs |
| `base` | `0.75rem` | Inputs, botones |
| `lg` | `1rem` | Cards |
| `xl` | `1.25rem` | Hero headers |
| `full` | `2rem` | Pills, badges redondeados |

---

## 🌑 Sombras

```scss
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
$shadow-md: 0 4px 20px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 8px 30px rgba(37, 99, 235, 0.12);
$shadow-xl: 0 12px 40px rgba(37, 99, 235, 0.15);
```

---

## ✅ Checklist de Implementación

Al crear un nuevo componente, verificar:

- [ ] `max-width: 1400px` en el contenedor principal
- [ ] Usar variables de color del sistema
- [ ] Tamaños de fuente según la tabla
- [ ] Inputs con `padding: 0.875rem 1rem` y `font-size: 0.9rem`
- [ ] Botones con los estilos estandarizados
- [ ] Cards con `border-radius: 1rem`
- [ ] Hero header con gradiente azul
- [ ] Iconos con tamaños correctos según contexto

---

## 📁 Archivos de Referencia

Los estilos base están en:
- `src/styles.scss` - Estilos globales
- `src/app/features/auth/login/login.component.scss` - Referencia de inputs/floatlabel
- `src/app/features/dashboard/cuenta/cuenta.component.scss` - Referencia de cards y layout

---

*Última actualización: Diciembre 2025*
