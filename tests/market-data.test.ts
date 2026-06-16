import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketDataService } from '@/services/market-data/market-data.service';
import { MarketDataProvider } from '@/services/market-data/provider.interface';

// Mock Providers for isolated unit tests
class MockHealthyProvider extends MarketDataProvider {
  readonly name = 'MockHealthy';
  async isHealthy() { return true; }
  async getQuote(symbol: string) {
    return {
      symbol: symbol.toUpperCase(),
      price: 150.0,
      change: 2.0,
      changePercent: 1.33,
      high: 151.0,
      low: 149.0,
      open: 148.0,
      previousClose: 148.0,
      volume: 1000000,
      timestamp: 1234567,
    };
  }
  async getHistoricalData() { return []; }
  async getMarketMovers() { return { gainers: [], losers: [] }; }
  async getMarketIndices() { return []; }
  async getSectorPerformance() { return []; }
}

class MockFailingProvider extends MarketDataProvider {
  readonly name = 'MockFailing';
  async isHealthy() { return true; }
  async getQuote() {
    throw new Error('API Rate Limit or Connection Failure');
  }
  async getHistoricalData() { return []; }
  async getMarketMovers() { return { gainers: [], losers: [] }; }
  async getMarketIndices() { return []; }
  async getSectorPerformance() { return []; }
}

describe('MarketDataService Failover Logic', () => {
  it('should successfully retrieve quotes from a healthy provider', async () => {
    const service = new MarketDataService();
    // Inject Mock Healthy Provider
    (service as any).providers = [new MockHealthyProvider()];
    
    const quote = await service.getQuote('AAPL');
    expect(quote.symbol).toBe('AAPL');
    expect(quote.price).toBe(150.0);
  });

  it('should cascade to the next provider when the primary provider throws an error', async () => {
    const service = new MarketDataService();
    // Inject failing provider, followed by healthy fallback provider
    (service as any).providers = [
      new MockFailingProvider(),
      new MockHealthyProvider()
    ];

    const quote = await service.getQuote('TSLA');
    expect(quote.symbol).toBe('TSLA');
    expect(quote.price).toBe(150.0); // Recovered from fallbacks
  });

  it('should correctly evaluate the mathematical RSI calculation', async () => {
    const service = new MarketDataService();
    // Simulating stock prices increasing consecutively 
    const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    const rsi = (service as any).computeRSI(prices, 14);
    
    expect(rsi).toBeGreaterThan(70); // Continuous gains must trigger overbought indicator (> 70)
  });
});
