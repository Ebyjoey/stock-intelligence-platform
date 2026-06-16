import { MarketDataProvider } from './provider.interface';
import { YahooFinanceProvider } from './yahoo.provider';
import { FinnhubProvider } from './finnhub.provider';
import { PolygonProvider } from './polygon.provider';
import { AlphaVantageProvider } from './alphavantage.provider';
import { MarketQuote, HistoricalBar, MarketMover, SectorPerformance, MarketIndex, TechnicalIndicators } from './types';

class CacheEntry<T> {
  data: T;
  timestamp: number;
  constructor(data: T) {
    this.data = data;
    this.timestamp = Date.now();
  }
}

export class MarketDataService {
  private providers: MarketDataProvider[];
  private cache = new Map<string, CacheEntry<any>>();
  private quoteTTL = 15 * 1000; // 15 seconds for live quote price caching
  private historyTTL = 300 * 1000; // 5 minutes for charts/sectors
  private providerHealth = new Map<string, { healthy: boolean; retryAfter: number }>();

  constructor() {
    this.providers = [
      new FinnhubProvider(),
      new PolygonProvider(),
      new AlphaVantageProvider(),
      new YahooFinanceProvider(), // The ultimate fallback that works without keys
    ];
  }

  private isProviderHealthy(providerName: string): boolean {
    const health = this.providerHealth.get(providerName);
    if (!health) return true;
    if (!health.healthy && Date.now() > health.retryAfter) {
      this.providerHealth.delete(providerName);
      return true;
    }
    return health.healthy;
  }

  private markProviderFailed(providerName: string) {
    console.warn(`Provider ${providerName} reported failure. Marking temporary offline for 60s.`);
    this.providerHealth.set(providerName, {
      healthy: false,
      retryAfter: Date.now() + 60 * 1000,
    });
  }

  private async executeWithFailover<T>(
    operation: (provider: MarketDataProvider) => Promise<T>,
    cacheKey?: string,
    ttl: number = this.quoteTTL
  ): Promise<T> {
    // 1. Check cache
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }

    // 2. Loop providers
    for (const provider of this.providers) {
      if (!this.isProviderHealthy(provider.name)) continue;

      try {
        const isApiConfigured = await provider.isHealthy();
        if (!isApiConfigured && provider.name !== 'YahooFinance') {
          continue; // skip if API keys are missing
        }

        const data = await operation(provider);

        // Save to cache
        if (cacheKey) {
          this.cache.set(cacheKey, new CacheEntry(data));
        }

        return data;
      } catch (error) {
        console.error(`Provider ${provider.name} failed during execution:`, error);
        if (provider.name !== 'YahooFinance') {
          this.markProviderFailed(provider.name);
        }
      }
    }

    throw new Error('All market data providers are currently exhausted or unavailable.');
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const cleanSym = symbol.trim().toUpperCase();
    return this.executeWithFailover(
      (p) => p.getQuote(cleanSym),
      `quote_${cleanSym}`,
      this.quoteTTL
    );
  }

  async getHistoricalData(symbol: string, timeframe: string): Promise<HistoricalBar[]> {
    const cleanSym = symbol.trim().toUpperCase();
    return this.executeWithFailover(
      (p) => p.getHistoricalData(cleanSym, timeframe),
      `history_${cleanSym}_${timeframe}`,
      this.historyTTL
    );
  }

  async getMarketMovers(): Promise<{ gainers: MarketMover[]; losers: MarketMover[] }> {
    return this.executeWithFailover(
      (p) => p.getMarketMovers(),
      'market_movers',
      this.historyTTL
    );
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    return this.executeWithFailover(
      (p) => p.getMarketIndices(),
      'market_indices',
      this.quoteTTL
    );
  }

  async getSectorPerformance(): Promise<SectorPerformance[]> {
    return this.executeWithFailover(
      (p) => p.getSectorPerformance(),
      'sector_performance',
      this.historyTTL
    );
  }

  /**
   * Helper that calculates technical indicators from historical bars.
   * Eliminates need for complex external technical math packages.
   */
  async calculateTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    const bars = await this.getHistoricalData(symbol, '1M'); // daily bars
    if (bars.length < 50) {
      // Not enough data, return standard presets
      return { rsi: 50, sma20: 0, sma50: 0, ema20: 0, macd: { macdLine: 0, signalLine: 0, histogram: 0 } };
    }

    const prices = bars.map(b => b.close);

    const rsi = this.computeRSI(prices, 14);
    const sma20 = this.computeSMA(prices, 20);
    const sma50 = this.computeSMA(prices, 50);
    const ema20 = this.computeEMA(prices, 20);
    const macd = this.computeMACD(prices);

    return { rsi, sma20, sma50, ema20, macd };
  }

  private computeSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const slice = prices.slice(prices.length - period);
    return slice.reduce((sum, p) => sum + p, 0) / period;
  }

  private computeEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  private computeRSI(prices: number[], period: number): number {
    if (prices.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    // Initial average
    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smooth averages
    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private computeMACD(prices: number[]): { macdLine: number; signalLine: number; histogram: number } {
    const ema12 = this.computeEMAArray(prices, 12);
    const ema26 = this.computeEMAArray(prices, 26);

    const macdLine: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }

    const signalLine = this.computeEMAArray(macdLine, 9);
    const lastIdx = prices.length - 1;
    const activeMacd = macdLine[lastIdx] || 0;
    const activeSignal = signalLine[lastIdx] || 0;

    return {
      macdLine: activeMacd,
      signalLine: activeSignal,
      histogram: activeMacd - activeSignal,
    };
  }

  private computeEMAArray(prices: number[], period: number): number[] {
    const ema: number[] = [];
    if (prices.length === 0) return ema;

    const k = 2 / (period + 1);
    ema.push(prices[0] as number);

    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] as number) * k + ema[i - 1] * (1 - k));
    }
    return ema;
  }
}

// Singleton instances for use in Server Actions and API Router
export const marketDataService = new MarketDataService();
export default marketDataService;
