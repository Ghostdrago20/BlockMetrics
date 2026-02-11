import { Directive, Input, ElementRef, Renderer2, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appHighlightChange]',
  standalone: true
})
export class HighlightChangeDirective implements OnChanges {
  @Input('appHighlightChange') price: number = 0;
  private previousPrice: number | undefined = undefined;
  private timeoutId: any;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['price']) {
      const currentValue = changes['price'].currentValue;
      
      if (this.previousPrice !== undefined && currentValue !== this.previousPrice) {
        // Clear any existing flash animation timeout to handle rapid changes
        clearTimeout(this.timeoutId);

        const directionClass = currentValue > this.previousPrice ? 'flash-green' : 'flash-red';
        
        this.renderer.addClass(this.el.nativeElement, directionClass);
        
        this.timeoutId = setTimeout(() => {
          this.renderer.removeClass(this.el.nativeElement, directionClass);
        }, 750); // Must match the animation duration in CSS
      }
      
      this.previousPrice = currentValue;
    }
  }
}