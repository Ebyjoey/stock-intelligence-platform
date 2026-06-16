import { MarketQuote, HistoricalBar, MarketMover, SectorPerformance, MarketIndex } from './types';

export abstract class MarketDataProvider {
  abstract readonly name: string;
  
  /**
   * Health check to check if API credentials and connections are online.
   */
  abstract isHealthy(): Promise<boolean>;

  /**
   * Retrieves current stock quote details for a symbol.
   */
  abstract getQuote(symbol: string): Promise<MarketQuote>;

  /**
   * Retrieves historical candles for charts.
   * @param symbol Ticker symbol.
   * @param timeframe Timeframe (e.g., "1D", "1W", "1M").
   */
  abstract getHistoricalData(symbol: string, timeframe: string): Promise<HistoricalBar[]>;

  /**
   * Retrieves top gainers and losers.
   */
  abstract getMarketMovers(): Promise<{ gainers: MarketMover[]; losers: MarketMover[] }>;

  /**
   * Retrieves current performance for standard market indices (e.g. S&P 500, Nasdaq, Dow Jones, Nifty 50).
   */
  abstract getMarketIndices(): Promise<MarketIndex[]>;

  /**
   * Retrieves changes across various industry sectors.
   */
  abstract getSectorPerformance(): Promise<SectorPerformance[]>;
}
