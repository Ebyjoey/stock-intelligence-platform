import { MarketDataProvider } from './provider.interface';
import { MarketQuote, HistoricalBar, MarketMover, SectorPerformance, MarketIndex } from './types';

export class AlphaVantageProvider extends MarketDataProvider {
  readonly name = 'AlphaVantage';
  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.ALPHAVANTAGE_API_KEY;
  }

  async isHealthy(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    if (!this.apiKey) throw new Error('Alpha Vantage API key not configured');

    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol.toUpperCase()}&apikey=${this.apiKey}`
    );
    if (!res.ok) throw new Error(`Alpha Vantage quote error: ${res.statusText}`);

    const data = await res.json();
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) throw new Error(`Alpha Vantage quote empty or rate-limited for ${symbol}`);

    const price = parseFloat(quote['05. price']);
    const prevClose = parseFloat(quote['08. previous close']);
    const change = parseFloat(quote['09. change']);
    // Parse percent string e.g. "0.15%"
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

    return {
      symbol: symbol.toUpperCase(),
      price,
      change,
      changePercent,
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: prevClose,
      volume: parseInt(quote['06. volume'], 10),
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  async getHistoricalData(symbol: string, timeframe: string): Promise<HistoricalBar[]> {
    if (!this.apiKey) throw new Error('Alpha Vantage API key not configured');

    let func = 'TIME_SERIES_DAILY';
    if (timeframe === '1D') {
      func = 'TIME_SERIES_INTRADAY&interval=15min';
    }

    const res = await fetch(
      `https://www.alphavantage.co/query?function=${func}&symbol=${symbol.toUpperCase()}&apikey=${this.apiKey}`
    );
    if (!res.ok) throw new Error(`Alpha Vantage history error: ${res.statusText}`);

    const data = await res.json();
    const key = timeframe === '1D' ? 'Time Series (15min)' : 'Time Series (Daily)';
    const series = data[key];

    if (!series) throw new Error(`Alpha Vantage history empty or rate-limited for ${symbol}`);

    const bars: HistoricalBar[] = [];
    const keys = Object.keys(series).sort();
    for (const timeStr of keys) {
      const item = series[timeStr];
      bars.push({
        time: new Date(timeStr).toISOString(),
        open: parseFloat(item['1. open']),
        high: parseFloat(item['2. high']),
        low: parseFloat(item['3. low']),
        close: parseFloat(item['4. close']),
        volume: parseInt(item['5. volume'], 10),
      });
    }

    return bars;
  }

  async getMarketMovers(): Promise<{ gainers: MarketMover[]; losers: MarketMover[] }> {
    throw new Error('Not implemented on Alpha Vantage free tier');
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    throw new Error('Not implemented on Alpha Vantage free tier');
  }

  async getSectorPerformance(): Promise<SectorPerformance[]> {
    if (!this.apiKey) throw new Error('Alpha Vantage API key not configured');

    const res = await fetch(`https://www.alphavantage.co/query?function=SECTOR&apikey=${this.apiKey}`);
    if (!res.ok) throw new Error(`Alpha Vantage sector error: ${res.statusText}`);

    const data = await res.json();
    const performance = data['Rank A: Real-Time Performance'];
    if (!performance) throw new Error('Alpha Vantage sector performance not available or rate-limited');

    return Object.entries(performance as Record<string, string>).map(([name, val]) => ({
      name,
      changePercent: parseFloat(val.replace('%', '')),
    }));
  }
}
