import { Component, ChangeDetectionStrategy, input, computed, signal, ElementRef, viewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-sparkline-chart',
  templateUrl: './sparkline-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe],
})
export class SparklineChartComponent {
  priceHistory = input.required<number[]>();
  isPositiveChange = input(true);
  
  width = 300;
  height = 75;
  padding = 5;

  tooltipVisible = signal(false);
  tooltipX = signal(0);
  tooltipY = signal(0);
  tooltipValue = signal<number | null>(null);
  
  svgContainer = viewChild.required<ElementRef<HTMLDivElement>>('svgContainer');

  private dimensions = computed(() => {
    const prices = this.priceHistory();
    if (prices.length < 2) {
      return { minPrice: 0, maxPrice: 0, priceRange: 1, xStep: 0 };
    }
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return {
      minPrice,
      maxPrice,
      priceRange: maxPrice - minPrice === 0 ? 1 : maxPrice - minPrice,
      xStep: (this.width - 2 * this.padding) / (prices.length - 1),
    };
  });

  private points = computed(() => {
    const prices = this.priceHistory();
    if (prices.length < 2) return [];
    const { minPrice, priceRange, xStep } = this.dimensions();
    return prices.map((price, i) => {
      const x = i * xStep + this.padding;
      const y = this.height - (((price - minPrice) / priceRange) * (this.height - 2 * this.padding) + this.padding);
      return { x, y };
    });
  });

  pathData = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '';
    return 'M ' + pts.map(p => `${p.x},${p.y}`).join(' L ');
  });

  areaPathData = computed(() => {
    const path = this.pathData();
    if (!path) return '';
    return `${path} V ${this.height - this.padding} H ${this.padding} Z`;
  });
  
  gradientColor = computed(() => this.isPositiveChange() ? 'rgb(34 197 94)' : 'rgb(239 68 68)'); // green-500 or red-500

  onMouseMove(event: MouseEvent): void {
    const svgEl = this.svgContainer().nativeElement;
    const prices = this.priceHistory();
    if (prices.length === 0) return;

    const rect = svgEl.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const index = Math.round(x / rect.width * (prices.length - 1));
    const safeIndex = Math.max(0, Math.min(prices.length - 1, index));
    
    const point = this.points()[safeIndex];

    this.tooltipVisible.set(true);
    this.tooltipX.set(point.x);
    this.tooltipY.set(point.y);
    this.tooltipValue.set(prices[safeIndex]);
  }

  onMouseLeave(): void {
    this.tooltipVisible.set(false);
  }
}