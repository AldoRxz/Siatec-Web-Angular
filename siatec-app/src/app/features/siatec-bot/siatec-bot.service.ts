import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SiatecBotService {
  private readonly _isOpen = signal(false);
  private readonly _messages = signal<ChatMessage[]>([]);

  readonly isOpen = this._isOpen.asReadonly();
  readonly messages = this._messages.asReadonly();

  toggleChat(): void {
    this._isOpen.update(value => !value);
  }

  openChat(): void {
    this._isOpen.set(true);
  }

  closeChat(): void {
    this._isOpen.set(false);
  }

  sendMessage(text: string): void {
    if (!text.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    this._messages.update(messages => [...messages, userMessage]);

    // Simular respuesta del bot (después integrarás con tu API)
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Gracias por tu mensaje. Estoy procesando tu solicitud...',
        sender: 'bot',
        timestamp: new Date()
      };
      this._messages.update(messages => [...messages, botMessage]);
    }, 1000);
  }

  clearMessages(): void {
    this._messages.set([]);
  }
}
