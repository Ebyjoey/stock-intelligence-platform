import React from 'react';
import Link from 'next/link';
import { marketDataService } from '@/services/market-data/market-data.service';
import { newsService } from '@/services/news/news.service';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Newspaper, 
  Compass, 
  BarChart3,
  Search
} from 'lucide-react';

export const revalidate = 15; // Revalidate dashboard data every 15s

export default async function DashboardPage() {
  // 1. Fetch server-side market metrics in parallel
  const [indices, movers, sectors, sentiment] = await Promise.all([
    marketDataService.getMarketIndices().catch(() => []),
    marketDataService.getMarketMovers().catch(() => ({ gainers: [], losers: [] })),
    marketDataService.getSectorPerformance().catch(() => []),
    newsService.getMarketSentiment().catch(() => ({
      bullishPercent: 50,
      bearishPercent: 30,
      neutralPercent: 20,
      overallScore: 0.1,
      totalArticles: 0
    }))
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground font-sans">
      {/* 1. Header Indices Ticker (Horizontal Density Banner) */}
      <div className="h-12 border-b border-border bg-card flex items-center overflow-x-auto scroller px-6 shrink-0 gap-8 scrollbar-none">
        <div className="text-[10px] uppercase text-neutral font-mono shrink-0 tracking-wider flex items-center gap-1.5 border-r border-border pr-6">
          <span className="w-1.5 h-1.5 bg-gainer rounded-full animate-pulse"></span>
          Live Indices
        </div>
        
        {indices.map((idx) => {
          const isUp = idx.changePercent >= 0;
          return (
            <div key={idx.symbol} className="flex items-center gap-2 text-xs shrink-0 font-mono">
              <span className="text-neutral font-sans">{idx.name}</span>
              <span className="font-semibold text-foreground">
                {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`flex items-center text-[10px] ${isUp ? 'text-gainer' : 'text-loser'}`}>
                {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Dashboard Body Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Quick Actions Search Ticker Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
          <div>
            <h1 className="text-lg font-bold font-mono tracking-tight">TERMINAL_DASHBOARD</h1>
            <p className="text-xs text-neutral">Quantitative market briefing and analytics dashboard.</p>
          </div>
          
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral">
              <Search className="h-4 w-4" />
            </span>
            <form action="/chat" method="GET">
              <input
                type="text"
                name="q"
                placeholder="Analyze stock, e.g. TSLA..."
                className="w-full bg-accent border border-border text-xs rounded pl-9 pr-4 py-2 focus:outline-none focus:border-primary font-mono"
              />
            </form>
          </div>
        </div>

        {/* 3. Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Market Movers (Gainers & Losers Tables) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-border bg-card rounded p-5">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h3 className="text-xs font-bold font-mono tracking-wider text-neutral uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Top Daily Movers
                </h3>
                <span className="text-[10px] text-neutral font-mono">Sorted by Volume %</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gainers */}
                <div>
                  <h4 className="text-[11px] font-bold font-mono text-gainer uppercase mb-2">Gainers</h4>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[10px] text-neutral uppercase border-b border-border font-mono">
                        <th className="py-2">Symbol</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {movers.gainers.slice(0, 5).map((stock) => (
                        <tr key={stock.symbol} className="hover:bg-accent/30 transition-colors">
                          <td className="py-2 font-bold">
                            <Link href={`/chat?q=Analyze+${stock.symbol}`} className="hover:underline text-primary">
                              {stock.symbol}
                            </Link>
                          </td>
                          <td className="py-2 text-right">${stock.price.toFixed(2)}</td>
                          <td className="py-2 text-right text-gainer">+{stock.changePercent.toFixed(2)}%</td>
                        </tr>
                      ))}
                      {movers.gainers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-neutral text-xs">No gainers available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Losers */}
                <div>
                  <h4 className="text-[11px] font-bold font-mono text-loser uppercase mb-2">Losers</h4>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[10px] text-neutral uppercase border-b border-border font-mono">
                        <th className="py-2">Symbol</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {movers.losers.slice(0, 5).map((stock) => (
                        <tr key={stock.symbol} className="hover:bg-accent/30 transition-colors">
                          <td className="py-2 font-bold">
                            <Link href={`/chat?q=Analyze+${stock.symbol}`} className="hover:underline text-primary">
                              {stock.symbol}
                            </Link>
                          </td>
                          <td className="py-2 text-right">${stock.price.toFixed(2)}</td>
                          <td className="py-2 text-right text-loser">{stock.changePercent.toFixed(2)}%</td>
                        </tr>
                      ))}
                      {movers.losers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-neutral text-xs">No losers available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Templates Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/chat?q=Compare+Tesla+and+Nvidia" className="border border-border bg-card hover:bg-accent p-4 rounded transition flex flex-col justify-between h-28">
                <span className="text-[10px] font-bold font-mono text-primary uppercase">Templates</span>
                <span className="text-xs font-semibold text-foreground">Compare Tesla & Nvidia</span>
                <span className="text-[10px] text-neutral flex items-center">Open Analyst Chat <ChevronRight className="w-3.5 h-3.5 ml-1" /></span>
              </Link>
              <Link href="/chat?q=Why+is+Nifty+falling+today%3F" className="border border-border bg-card hover:bg-accent p-4 rounded transition flex flex-col justify-between h-28">
                <span className="text-[10px] font-bold font-mono text-primary uppercase">Templates</span>
                <span className="text-xs font-semibold text-foreground">Why is Nifty falling?</span>
                <span className="text-[10px] text-neutral flex items-center">Open Analyst Chat <ChevronRight className="w-3.5 h-3.5 ml-1" /></span>
              </Link>
              <Link href="/chat?q=Explain+RSI" className="border border-border bg-card hover:bg-accent p-4 rounded transition flex flex-col justify-between h-28">
                <span className="text-[10px] font-bold font-mono text-primary uppercase">Templates</span>
                <span className="text-xs font-semibold text-foreground">Explain RSI Indicators</span>
                <span className="text-[10px] text-neutral flex items-center">Open Analyst Chat <ChevronRight className="w-3.5 h-3.5 ml-1" /></span>
              </Link>
            </div>
          </div>

          {/* Col 3: Side panels (Sentiment Gauge & Sector Performance) */}
          <div className="space-y-6">
            {/* Sentiment Gauge */}
            <div className="border border-border bg-card rounded p-5">
              <h3 className="text-xs font-bold font-mono tracking-wider text-neutral uppercase mb-4 flex items-center gap-1.5 border-b border-border pb-2">
                <Newspaper className="w-4 h-4 text-primary" />
                Aggregated Sentiment
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span>Bullish Bias</span>
                  <span className="text-gainer font-semibold">{sentiment.bullishPercent}%</span>
                </div>
                {/* Horizontal Progress Ratio Bar */}
                <div className="h-3 w-full bg-accent rounded-full overflow-hidden flex">
                  <div style={{ width: `${sentiment.bullishPercent}%` }} className="bg-gainer h-full"></div>
                  <div style={{ width: `${sentiment.neutralPercent}%` }} className="bg-neutral/40 h-full"></div>
                  <div style={{ width: `${sentiment.bearishPercent}%` }} className="bg-loser h-full"></div>
                </div>
                <div className="flex justify-between text-[10px] text-neutral font-mono">
                  <span>{sentiment.bullishPercent}% Bullish</span>
                  <span>{sentiment.neutralPercent}% Neutral</span>
                  <span>{sentiment.bearishPercent}% Bearish</span>
                </div>

                <div className="bg-background/50 rounded p-3 text-xs border border-border/60">
                  <span className="font-bold font-mono text-[10px] uppercase text-neutral block mb-1">Quantitative Score</span>
                  <p className="font-mono text-foreground font-semibold">
                    {sentiment.overallScore.toFixed(2)} ({sentiment.overallScore > 0.15 ? 'BULLISH BIAS' : sentiment.overallScore < -0.15 ? 'BEARISH BIAS' : 'NEUTRAL CONSOLIDATION'})
                  </p>
                </div>
              </div>
            </div>

            {/* Sector Performance */}
            <div className="border border-border bg-card rounded p-5">
              <h3 className="text-xs font-bold font-mono tracking-wider text-neutral uppercase mb-4 flex items-center gap-1.5 border-b border-border pb-2">
                <Compass className="w-4 h-4 text-primary" />
                Sector Overview
              </h3>

              <div className="space-y-3 font-mono text-xs">
                {sectors.map((sec) => {
                  const isUp = sec.changePercent >= 0;
                  return (
                    <div key={sec.name} className="flex items-center justify-between py-1 border-b border-border/20">
                      <span className="text-foreground font-sans">{sec.name}</span>
                      <span className={`font-semibold ${isUp ? 'text-gainer' : 'text-loser'}`}>
                        {isUp ? '+' : ''}{sec.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
                {sectors.length === 0 && (
                  <div className="text-center py-4 text-neutral text-xs">Sectors mapping offline.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
