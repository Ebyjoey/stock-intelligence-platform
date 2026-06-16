import OpenAI from 'openai';
import { marketDataService } from '../market-data/market-data.service';
import { newsService } from '../news/news.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-openai-key-for-compilation',
});

class ChatbotService {
  private companyMap: Record<string, string> = {
    apple: 'AAPL',
    tesla: 'TSLA',
    nvidia: 'NVDA',
    microsoft: 'MSFT',
    amazon: 'AMZN',
    meta: 'META',
    google: 'GOOGL',
    netflix: 'NFLX',
    amd: 'AMD',
    intel: 'INTC',
  };

  /**
   * Scans a user message to extract mentioned ticker symbols.
   */
  extractSymbols(message: string): string[] {
    const symbols = new Set<string>();
    const text = message.toLowerCase();

    // 1. Look for Cashtags e.g. $AAPL, $TSLA
    const cashtagRegex = /\$([a-zA-Z]{1,5})\b/g;
    let match;
    while ((match = cashtagRegex.exec(message)) !== null) {
      if (match[1]) symbols.add(match[1].toUpperCase());
    }

    // 2. Look for well-known company names
    Object.entries(this.companyMap).forEach(([company, ticker]) => {
      if (text.includes(company)) {
        symbols.add(ticker);
      }
    });

    // 3. Look for standalone uppercase symbols of 2-5 chars (e.g. "I love TSLA stock")
    const uppercaseTickerRegex = /\b([A-Z]{2,5})\b/g;
    let upMatch;
    while ((upMatch = uppercaseTickerRegex.exec(message)) !== null) {
      if (upMatch[1] && upMatch[1] !== 'NYSE' && upMatch[1] !== 'NASDAQ' && upMatch[1] !== 'NIFTY') {
        symbols.add(upMatch[1]);
      }
    }

    return Array.from(symbols);
  }

  /**
   * Dynamically constructs the financial market context prompt using live data.
   */
  async buildMarketContext(symbols: string[]): Promise<string> {
    if (symbols.length === 0) {
      // General market index lookup
      try {
        const indices = await marketDataService.getMarketIndices();
        const sector = await marketDataService.getSectorPerformance();
        
        let ctx = `[System Information: Current Local Time is ${new Date().toISOString()}]\n\n`;
        ctx += `### General Market Indices:\n`;
        indices.forEach(idx => {
          ctx += `- ${idx.name} (${idx.symbol}): $${idx.price.toLocaleString()} (${idx.change >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%)\n`;
        });
        
        ctx += `\n### Sector Performance:\n`;
        sector.slice(0, 5).forEach(sec => {
          ctx += `- ${sec.name}: ${sec.changePercent >= 0 ? '+' : ''}${sec.changePercent.toFixed(2)}%\n`;
        });

        return ctx;
      } catch (_err) {
        return '[System Information] Unable to fetch market indices. Proceeding with general financial reasoning.';
      }
    }

    let context = `[System Information: Current Local Time is ${new Date().toISOString()}]\n`;
    context += `Below is live market data, technical metrics, and sentiment aggregated for symbols mentioned in user query:\n\n`;

    for (const sym of symbols.slice(0, 3)) { // Limit to 3 symbols to save token limit
      try {
        const quote = await marketDataService.getQuote(sym);
        const indicators = await marketDataService.calculateTechnicalIndicators(sym);
        const news = await newsService.getNews(sym);
        const sentiment = await newsService.getMarketSentiment(sym);

        context += `--- Stock Profile: ${sym} ---\n`;
        context += `Price: $${quote.price.toLocaleString()} | Change: ${quote.change >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}% | High: $${quote.high} | Low: $${quote.low} | Volume: ${quote.volume.toLocaleString()}\n`;
        context += `Technical Indicators (Daily Chart):\n`;
        context += `- RSI (14): ${indicators.rsi.toFixed(2)} (${indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'})\n`;
        context += `- SMA 20: $${indicators.sma20.toFixed(2)} | SMA 50: $${indicators.sma50.toFixed(2)} | EMA 20: $${indicators.ema20.toFixed(2)}\n`;
        context += `- MACD: Histogram ${indicators.macd.histogram.toFixed(4)} | Line ${indicators.macd.macdLine.toFixed(4)} | Signal ${indicators.macd.signalLine.toFixed(4)}\n`;
        context += `Sentiment Analysis Metrics:\n`;
        context += `- Bullish: ${sentiment.bullishPercent}% | Bearish: ${sentiment.bearishPercent}% | Neutral: ${sentiment.neutralPercent}% (Overall Score: ${sentiment.overallScore.toFixed(2)})\n`;
        
        context += `Recent Relevant Headlines:\n`;
        news.slice(0, 3).forEach(art => {
          context += `- "${art.title}" (${art.source}) - Sentiment: ${art.sentiment} (Impact: ${art.impactScore}/10)\n`;
        });
        context += `\n`;
      } catch (_err) {
        context += `Unable to retrieve detailed live info for symbol: ${sym}. Please notify client if the ticker is invalid.\n\n`;
      }
    }

    return context;
  }

  /**
   * Calls OpenAI to create a completion stream with grounded financial contexts.
   */
  async getStreamingResponse(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    userMessage: string
  ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | ReadableStream<Uint8Array>> {
    const symbols = this.extractSymbols(userMessage);
    const context = await this.buildMarketContext(symbols);

    const systemPrompt = `You are a Senior Quantitative Analyst & Market Intelligence Assistant on the Stock Intelligence Platform. 
Your goal is to provide deep, analytical, professional responses to stock queries, similar to comments on a Bloomberg Terminal.
Ground your responses strictly in the live market context provided in the system block. Avoid hallucinations.
Present financial figures in tabular structures where possible.
Ensure technical terms (RSI, MACD, SMA) are explained with professional precision.
Do not use robot icons or generic greetings. Keep the tone human, objective, premium, and direct.`;

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(0, -1), // Include history except the active user query
      { role: 'system' as const, content: `Current Market Context:\n${context}` },
      { role: 'user' as const, content: userMessage }
    ];

    if (!process.env.OPENAI_API_KEY) {
      // Return a simulated readable stream so that the app functions offline or during tests without API keys
      return this.createSimulatedStream(userMessage, context);
    }

    return openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      stream: true,
      temperature: 0.1,
    });
  }

  private createSimulatedStream(userMessage: string, context: string) {
    const encoder = new TextEncoder();
    const mockReply = `### Quantitative Intelligence Report

*Note: OpenAI API Key is missing. Presenting simulated terminal output grounded in local Yahoo Finance feeds.*

${context.includes('Stock Profile') ? `#### Market Grounding Analysis
The extracted tickers show immediate trading volumes and technical alignments. Based on the calculated metrics:
- **RSI Momentum** signals stable trade support within the historical baseline.
- **Moving Average Convergence Divergence (MACD)** indicators reflect local consolidation indices.

| Indicator | Value | Signal |
| :--- | :--- | :--- |
| Relative Strength Index (RSI) | Neutral | Hold |
| 20-Day Simple Moving Avg | Supporting | Consolidation |
| Trend Bias | Neutral | Balanced |
` : `#### Sector Briefing
Global indices reflect general index changes across sectors. Technology indices continue to hold critical levels while Financial indices show relative consolidation.
`}

Please provide an \`OPENAI_API_KEY\` in your environment configuration to enable live GPT-4o analytics.`;

    let index = 0;
    const words = mockReply.split(' ');
    
    return new ReadableStream({
      async start(controller) {
        function pushWord() {
          if (index >= words.length) {
            controller.close();
            return;
          }
          const chunk = words[index] + ' ';
          controller.enqueue(encoder.encode(chunk));
          index++;
          setTimeout(pushWord, 40);
        }
        pushWord();
      }
    });
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
