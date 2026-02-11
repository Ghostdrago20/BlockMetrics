import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CryptoAsset } from '../../models/crypto.model';

@Component({
  selector: 'app-trade-modal',
  templateUrl: './trade-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe]
})
export class TradeModalComponent {
  asset = input.required<CryptoAsset>();
  close = output<void>();

  tradeType = signal<'buy' | 'sell'>('buy');
  usdAmount = signal<number | null>(null);
  assetAmount = signal<number | null>(null);

  // When USD amount changes, calculate asset amount
  onUsdAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value >= 0) {
      this.usdAmount.set(value);
      this.assetAmount.set(value / this.asset().price);
    } else {
      this.usdAmount.set(null);
      this.assetAmount.set(null);
    }
  }

  // When asset amount changes, calculate USD amount
  onAssetAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value >= 0) {
      this.assetAmount.set(value);
      this.usdAmount.set(value * this.asset().price);
    } else {
      this.usdAmount.set(null);
      this.assetAmount.set(null);
    }
  }

  setTradeType(type: 'buy' | 'sell'): void {
    this.tradeType.set(type);
    this.resetAmounts();
  }

  resetAmounts(): void {
    this.usdAmount.set(null);
    this.assetAmount.set(null);
  }

  confirmTrade(): void {
    const usd = this.usdAmount();
    const assetAmt = this.assetAmount();

    if (usd === null || assetAmt === null || usd <= 0) {
        alert('Por favor, introduce una cantidad válida.');
        return;
    }

    const tradeAction = this.tradeType() === 'buy' ? 'Comprado' : 'Vendido';
    const message = `${tradeAction} ${assetAmt.toFixed(6)} ${this.asset().symbol} por ${usd.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}.`;
    
    alert(`¡Transacción Simulada!\n\n${message}`);
    this.closeModal();
  }

  closeModal(): void {
    this.close.emit();
  }
}
