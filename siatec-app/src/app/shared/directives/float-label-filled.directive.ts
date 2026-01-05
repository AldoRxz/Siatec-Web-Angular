import { Directive, ElementRef, HostListener, Renderer2, OnInit, OnDestroy } from '@angular/core';

/**
 * Directiva que agrega la clase 'has-value' a p-floatlabel cuando el input contiene texto.
 * Esto permite mantener el label elevado incluso cuando el input pierde el foco.
 */
@Directive({
  selector: 'p-floatlabel',
  standalone: true
})
export class FloatLabelFilledDirective implements OnInit, OnDestroy {
  private input: HTMLInputElement | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Buscar el input dentro de p-floatlabel
    this.input = this.el.nativeElement.querySelector('input');
    
    if (this.input) {
      // Verificar valor inicial
      this.checkValue();
      
      // Observar cambios en el DOM para inputs dinámicos
      this.mutationObserver = new MutationObserver(() => {
        this.checkValue();
      });
      
      this.mutationObserver.observe(this.input, {
        attributes: true,
        attributeFilter: ['value']
      });
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    this.checkValue();
  }

  @HostListener('change', ['$event'])
  onChange(event: Event) {
    this.checkValue();
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event) {
    // Pequeño delay para asegurar que el valor esté actualizado
    setTimeout(() => this.checkValue(), 10);
  }

  private checkValue() {
    if (!this.input) return;
    
    const hasValue = this.input.value && this.input.value.trim().length > 0;
    
    if (hasValue) {
      this.renderer.addClass(this.el.nativeElement, 'has-value');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'has-value');
    }
  }

  ngOnDestroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}
