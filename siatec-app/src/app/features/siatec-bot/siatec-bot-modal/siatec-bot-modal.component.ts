import { Component, inject, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SiatecBotService, ChatMessage } from '../siatec-bot.service';

@Component({
  selector: 'app-siatec-bot-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ScrollPanelModule
  ],
  templateUrl: './siatec-bot-modal.component.html',
  styleUrl: './siatec-bot-modal.component.scss'
})
export class SiatecBotModalComponent {
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;
  
  private readonly botService = inject(SiatecBotService);

  readonly isOpen = this.botService.isOpen;
  readonly messages = this.botService.messages;
  
  messageText = '';

  constructor() {
    // Auto-scroll al recibir nuevos mensajes
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  closeChat(): void {
    this.botService.closeChat();
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;
    
    this.botService.sendMessage(this.messageText);
    this.messageText = '';
  }

  sendQuickMessage(message: string): void {
    this.botService.sendMessage(message);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
