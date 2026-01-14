# SiatecBot - Asistente Virtual Inteligente

Este módulo contiene el asistente virtual SiatecBot para el Portal SIATEC.

## Estructura

```
siatec-bot/
├── siatec-bot.service.ts          # Servicio principal del bot
├── siatec-bot-modal/              # Componente del modal de chat
│   ├── siatec-bot-modal.component.ts
│   ├── siatec-bot-modal.component.html
│   └── siatec-bot-modal.component.scss
└── index.ts                        # Barrel export
```

## Características

- Modal deslizante desde el lado derecho (estilo Slack)
- Chat en tiempo real con el bot
- Diseño responsive
- Animaciones suaves
- Acciones rápidas predefinidas

## Uso

El SiatecBot se invoca desde el botón en el header del portal. El servicio `SiatecBotService` maneja:

- Estado de apertura/cierre del modal
- Mensajes del chat
- Envío de mensajes

## Próximas expansiones

- Integración con API de IA
- Historial de conversaciones
- Sugerencias contextuales
- Análisis de sentimientos
- Respuestas personalizadas por módulo
