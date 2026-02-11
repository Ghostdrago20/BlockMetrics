export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  iconUrl: string;
  price: number;
  priceHistory: number[];
  change24h: number;
  isPositiveChange: boolean;
  stats: ComputedStats | null;
  alertThreshold?: number;
  alertTriggered: boolean;
}

export interface ComputedStats {
  sma20: number; // Simple Moving Average over 20 periods
  stdDev: number; // Standard Deviation
  rsi: number; // Relative Strength Index
}

export interface WorkerDataRequest {
  id: string;
  priceHistory: number[];
}

export interface WorkerDataResponse {
  id: string;
  stats: ComputedStats;
}