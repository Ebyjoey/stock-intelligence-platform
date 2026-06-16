import { MarketDataProvider } from './provider.interface';
import { MarketQuote, HistoricalBar, MarketMover, SectorPerformance, MarketIndex } from './types';

export class FinnhubProvider extends MarketDataProvider {
  readonly name = 'Finnhub';
  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.FINNHUB_API_KEY;
  }

  async isHealthy(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    if (!this.apiKey) throw new Error('Finnhub API key not configured');

    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${this.apiKey}`);
    if (!res.ok) throw new Error(`Finnhub API error: ${res.statusText}`);

    const data = await res.json();
    if (!data.c) throw new Error(`Finnhub returned empty quote for ${symbol}`);

    return {
      symbol: symbol.toUpperCase(),
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      volume: 0, // Finnhub base quote doesn't provide real-time volume
      timestamp: data.t,
    };
  }

  async getHistoricalData(symbol: string, timeframe: string): Promise<HistoricalBar[]> {
    if (!this.apiKey) throw new Error('Finnhub API key not configured');

    let resolution = 'D';
    let to = Math.floor(Date.now() / 1000);
    let from = to - 30 * 24 * 3600; // default 30 days

    if (timeframe === '1D') {
      resolution = '15';
      from = to - 24 * 3600;
    } else if (timeframe === '1W') {
      resolution = '30';
      from = to - 7 * 24 * 3600;
    } else if (timeframe === '1M') {
      resolution = 'D';
      from = to - 30 * 24 * 3600;
    }

    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`
    );
    if (!res.ok) throw new Error(`Finnhub API candle error: ${res.statusText}`);

    const data = await res.json();
    if (data.s !== 'ok') throw new Error(`Finnhub candle status: ${data.s}`);

    const bars: HistoricalBar[] = [];
    for (let i = 0; i < data.t.length; i++) {
      bars.push({
        time: new Date(data.t[i] * 1000).toISOString(),
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      });
    }
    return bars;
  }

  async getMarketMovers(): Promise<{ gainers: MarketMover[]; losers: MarketMover[] }> {
    throw new Error('Not implemented on Finnhub free tier');
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    throw new Error('Not implemented on Finnhub free tier');
  }

  async getSectorPerformance(): Promise<SectorPerformance[]> {
    throw new Error('Not implemented on Finnhub free tier');
  }
}
