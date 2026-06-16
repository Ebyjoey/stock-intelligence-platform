import { MarketDataProvider } from './provider.interface';
import { MarketQuote, HistoricalBar, MarketMover, SectorPerformance, MarketIndex } from './types';

export class PolygonProvider extends MarketDataProvider {
  readonly name = 'Polygon';
  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.POLYGON_API_KEY;
  }

  async isHealthy(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    if (!this.apiKey) throw new Error('Polygon API key not configured');

    const res = await fetch(`https://api.polygon.io/v2/last/trade/${symbol.toUpperCase()}?apiKey=${this.apiKey}`);
    if (!res.ok) throw new Error(`Polygon API quote error: ${res.statusText}`);

    const data = await res.json();
    const trade = data.results;
    if (!trade) throw new Error(`Polygon returned empty quote results for ${symbol}`);

    // Fetch previous close to compute change
    const prevRes = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/prev?adjusted=true&apiKey=${this.apiKey}`);
    let prevClose = trade.p;
    if (prevRes.ok) {
      const prevData = await prevRes.json();
      if (prevData.results?.[0]) {
        prevClose = prevData.results[0].c;
      }
    }

    const price = trade.p;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      price,
      change,
      changePercent,
      high: price,
      low: price,
      open: price,
      previousClose: prevClose,
      volume: 0,
      timestamp: trade.t ? Math.floor(trade.t / 1000000) : Math.floor(Date.now() / 1000), // nano to seconds
    };
  }

  async getHistoricalData(symbol: string, timeframe: string): Promise<HistoricalBar[]> {
    if (!this.apiKey) throw new Error('Polygon API key not configured');

    let multiplier = 1;
    let timespan = 'day';
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();

    if (timeframe === '1D') {
      multiplier = 15;
      timespan = 'minute';
      fromDate.setDate(fromDate.getDate() - 1);
    } else if (timeframe === '1W') {
      multiplier = 30;
      timespan = 'minute';
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (timeframe === '1M') {
      multiplier = 1;
      timespan = 'day';
      fromDate.setDate(fromDate.getDate() - 30);
    }

    const from = fromDate.toISOString().split('T')[0];

    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&apiKey=${this.apiKey}`
    );
    if (!res.ok) throw new Error(`Polygon API aggs error: ${res.statusText}`);

    const data = await res.json();
    const results = data.results || [];

    return results.map((item: any) => ({
      time: new Date(item.t).toISOString(),
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v,
    }));
  }

  async getMarketMovers(): Promise<{ gainers: MarketMover[]; losers: MarketMover[] }> {
    throw new Error('Not implemented on Polygon free tier');
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    throw new Error('Not implemented on Polygon free tier');
  }

  async getSectorPerformance(): Promise<SectorPerformance[]> {
    throw new Error('Not implemented on Polygon free tier');
  }
}
