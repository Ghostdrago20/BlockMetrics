import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { CryptoAsset } from '../models/crypto.model';

@Injectable({
  providedIn: 'root',
})
export class CryptoFeedService {
  private readonly initialAssets: Omit<CryptoAsset, 'priceHistory' | 'change24h' | 'isPositiveChange' | 'stats' | 'alertThreshold' | 'alertTriggered'>[] = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 68000, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/btc.svg' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3500, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
    { id: 'ripple', name: 'XRP', symbol: 'XRP', price: 0.52, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/xrp.svg' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', price: 150, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/sol.svg' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.45, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ada.svg' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.15, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg' },
    { id: 'binance-coin', name: 'Binance Coin', symbol: 'BNB', price: 595, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg' },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', price: 83, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ltc.svg' },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 14, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/link.svg' },
    { id: 'tether', name: 'Tether', symbol: 'USDT', price: 1.00, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg' },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', price: 36, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/avax.svg' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 7, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/dot.svg' },
    { id: 'tron', name: 'Tron', symbol: 'TRX', price: 0.11, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/trx.svg' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', price: 0.72, iconUrl: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg' },
  ];

  private assets: Map<string, CryptoAsset> = new Map();

  constructor() {
    this.initialAssets.forEach(asset => {
        const priceHistory = Array.from({length: 50}, () => this.getInitialPrice(asset.price));
        this.assets.set(asset.id, {
            ...asset,
            price: priceHistory[priceHistory.length - 1],
            priceHistory,
            change24h: 0,
            isPositiveChange: true,
            stats: null,
            alertTriggered: false,
        });
    });
  }

  private getInitialPrice(basePrice: number): number {
      return basePrice * (1 + (Math.random() - 0.5) * 0.1); // +/- 5% initial spread
  }

  public getFeed(): Observable<CryptoAsset[]> {
    return timer(0, 1000).pipe(
      map(() => {
        const updatedAssets: CryptoAsset[] = [];
        this.assets.forEach((asset) => {
          const oldPrice = asset.price;
          const volatility = 0.015; // Represents max change per tick
          const changePercent = 2 * volatility * Math.random() - volatility;
          const newPrice = oldPrice * (1 + changePercent);

          const newPriceHistory = [...asset.priceHistory.slice(1), newPrice];
          const initialPrice = asset.priceHistory[0];
          const change24h = ((newPrice - initialPrice) / initialPrice) * 100;

          const updatedAsset: CryptoAsset = {
            ...asset,
            price: newPrice,
            priceHistory: newPriceHistory,
            change24h: change24h,
            isPositiveChange: newPrice >= oldPrice,
          };
          this.assets.set(asset.id, updatedAsset);
          updatedAssets.push(updatedAsset);
        });
        return updatedAssets;
      }),
      shareReplay(1)
    );
  }
}