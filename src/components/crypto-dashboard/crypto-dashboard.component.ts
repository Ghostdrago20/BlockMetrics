import { Component, ChangeDetectionStrategy, signal, WritableSignal, OnInit, OnDestroy, computed, Signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe, NgOptimizedImage, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { CryptoFeedService } from '../../services/crypto-feed.service';
import { CryptoAsset, WorkerDataRequest, WorkerDataResponse } from '../../models/crypto.model';
import { HighlightChangeDirective } from '../../directives/highlight-change.directive';
import { SparklineChartComponent } from '../sparkline-chart/sparkline-chart.component';
import { TradeModalComponent } from '../trade-modal/trade-modal.component';

@Component({
  selector: 'app-crypto-dashboard',
  templateUrl: './crypto-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, HighlightChangeDirective, NgOptimizedImage, SparklineChartComponent, DatePipe, TradeModalComponent]
})
export class CryptoDashboardComponent implements OnInit, OnDestroy {
  // Base state signal holding all assets
  private allCryptoAssets: WritableSignal<CryptoAsset[]> = signal([]);

  // Signal for the search input
  searchTerm = signal('');

  // Signal for the current time
  currentTime = signal(new Date());

  // Signal for the currently selected asset for the trade modal
  selectedAsset = signal<CryptoAsset | null>(null);

  // Signal to track which asset's details section is expanded
  expandedAssetId = signal<string | null>(null);

  // Computed signal that filters assets based on the search term
  filteredAssets: Signal<CryptoAsset[]> = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const assets = this.allCryptoAssets();
    if (!term) {
      return assets;
    }
    return assets.filter(asset =>
      asset.name.toLowerCase().includes(term) ||
      asset.symbol.toLowerCase().includes(term)
    );
  });

  // Computed signal to calculate the average 24h change
  averageChange: Signal<number> = computed(() => {
    const assets = this.allCryptoAssets();
    if (assets.length === 0) {
      return 0;
    }
    const totalChange = assets.reduce((sum, asset) => sum + asset.change24h, 0);
    return totalChange / assets.length;
  });

  private statisticsWorker: Worker | null = null;
  private feedSubscription: Subscription | null = null;
  private assetMap = new Map<string, CryptoAsset>();
  private timeInterval: any;

  constructor(private cryptoFeedService: CryptoFeedService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.initializeWorker();
    this.subscribeToFeed();
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  private initializeWorker(): void {
    const workerCode = `
      // ... (código del worker sin cambios) ...
      const calculateSMA = (prices, period) => {
        if (prices.length < period) return null;
        const relevantPrices = prices.slice(-period);
        const sum = relevantPrices.reduce((acc, val) => acc + val, 0);
        return sum / period;
      };
      const calculateStdDev = (prices, period) => {
        if (prices.length < period) return null;
        const sma = calculateSMA(prices, period);
        if (sma === null) return null;
        const relevantPrices = prices.slice(-period);
        const squaredDiffs = relevantPrices.map(price => Math.pow(price - sma, 2));
        const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
        return Math.sqrt(avgSquaredDiff);
      };
      const calculateRSI = (prices, period = 14) => {
          if (prices.length <= period) return null;
          let gains = 0; let losses = 0;
          for (let i = prices.length - period; i < prices.length; i++) {
              const diff = prices[i] - prices[i - 1];
              if (diff > 0) { gains += diff; } else { losses -= diff; }
          }
          const avgGain = gains / period; const avgLoss = losses / period;
          if (avgLoss === 0) return 100;
          const rs = avgGain / avgLoss;
          return 100 - (100 / (1 + rs));
      };
      self.onmessage = (e) => {
        const { id, priceHistory } = e.data;
        const sma20 = calculateSMA(priceHistory, 20);
        const stdDev = calculateStdDev(priceHistory, 20);
        const rsi = calculateRSI(priceHistory, 14);
        if (sma20 !== null && stdDev !== null && rsi !== null) {
          self.postMessage({ id, stats: { sma20, stdDev, rsi } });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.statisticsWorker = new Worker(workerUrl);

    this.statisticsWorker.onmessage = ({ data }: MessageEvent<WorkerDataResponse>) => {
      const assetToUpdate = this.assetMap.get(data.id);
      if (assetToUpdate) {
        assetToUpdate.stats = data.stats;
        this.assetMap.set(data.id, assetToUpdate);
        this.updateSignal();
      }
    };
  }

  private subscribeToFeed(): void {
    this.feedSubscription = this.cryptoFeedService.getFeed().subscribe(assets => {
      assets.forEach(asset => {
        const existingAsset = this.assetMap.get(asset.id);
        const stats = existingAsset ? existingAsset.stats : null;
        const alertThreshold = existingAsset ? existingAsset.alertThreshold : undefined;
        let alertTriggered = !!(alertThreshold !== undefined && asset.price >= alertThreshold);
        this.assetMap.set(asset.id, { ...asset, stats, alertThreshold, alertTriggered });
        const workerRequest: WorkerDataRequest = { id: asset.id, priceHistory: asset.priceHistory };
        this.statisticsWorker?.postMessage(workerRequest);
      });
      this.updateSignal();
    });
  }

  public setAlert(assetId: string, thresholdInput: HTMLInputElement): void {
    const thresholdStr = thresholdInput.value;
    const asset = this.assetMap.get(assetId);
    if (!asset) return;

    if (thresholdStr === '') {
      delete asset.alertThreshold;
      asset.alertTriggered = false;
    } else {
      const threshold = parseFloat(thresholdStr);
      if (!isNaN(threshold) && threshold > 0) {
        asset.alertThreshold = threshold;
        asset.alertTriggered = asset.price >= asset.alertThreshold;
      }
    }
    this.assetMap.set(assetId, asset);
    this.updateSignal();
    thresholdInput.value = '';
  }

  public setAlertById(inputId: string, assetId: string): void {
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (inputElement) {
      this.setAlert(assetId, inputElement);
    }
  }

  public shareAsset(asset: CryptoAsset): void {
    const formattedPrice = asset.price.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: asset.price < 1 ? 5 : 2
    });
    const message = `📈 Información de Criptoactivo\n\nActivo: ${asset.name} (${asset.symbol})\nPrecio Actual: ${formattedPrice}`;
    alert(message);
  }

  openTradeModal(asset: CryptoAsset): void {
    this.selectedAsset.set(asset);
  }

  closeTradeModal(): void {
    this.selectedAsset.set(null);
  }

  toggleDetails(assetId: string): void {
    if (this.expandedAssetId() === assetId) {
      this.expandedAssetId.set(null);
    } else {
      this.expandedAssetId.set(assetId);
    }
  }

  isExpanded(assetId: string): boolean {
    return this.expandedAssetId() === assetId;
  }

  private updateSignal(): void {
    this.allCryptoAssets.set(Array.from(this.assetMap.values()));
    this.cdr.markForCheck();
  }

  trackById(index: number, asset: CryptoAsset): string {
    return asset.id;
  }

  ngOnDestroy(): void {
    this.feedSubscription?.unsubscribe();
    this.statisticsWorker?.terminate();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
}