import { marketDataService } from '../market-data/market-data.service';
import { newsService } from '../news/news.service';

class TelegramService {
  private botToken = process.env.TELEGRAM_BOT_TOKEN;

  /**
   * Dispatches direct messages to Telegram subscribers.
   */
  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.botToken) {
      console.warn('TelegramService: Bot token not configured. Skipping notification.');
      return false;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      return res.ok;
    } catch (err) {
      console.error('TelegramService Error sending message:', err);
      return false;
    }
  }

  /**
   * Handles incoming webhook updates from Telegram Bot API.
   */
  async handleWebhookUpdate(update: any): Promise<void> {
    const message = update?.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id.toString();
    const text = message.text.trim();

    if (text.startsWith('/start')) {
      await this.sendMessage(
        chatId,
        `Welcome to *Stock Intelligence Platform* Bot!\n\nUse commands to query the market:\n/market - Indices update\n/news - Latest headlines\n/analyze <symbol> - Quick quantitative review\n/watchlist - View watchlist status`
      );
    } else if (text.startsWith('/help')) {
      await this.sendMessage(
        chatId,
        `Available Commands:\n/market - indices quotes\n/news - top business stories\n/analyze <symbol> - stock technical levels\n/watchlist - watchlist summary`
      );
    } else if (text.startsWith('/market')) {
      try {
        const indices = await marketDataService.getMarketIndices();
        let reply = `*Live Market Indices Overview*:\n\n`;
        indices.forEach(idx => {
          reply += `• *${idx.name}* (${idx.symbol}): $${idx.price.toLocaleString()} (${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%)\n`;
        });
        await this.sendMessage(chatId, reply);
      } catch {
        await this.sendMessage(chatId, 'Unable to retrieve indices details at this moment.');
      }
    } else if (text.startsWith('/news')) {
      try {
        const feed = await newsService.getNews();
        let reply = `*Latest Business News Aggregation*:\n\n`;
        feed.slice(0, 5).forEach(art => {
          reply += `• *${art.title}* (_${art.source}_)\n  Sentiment: ${art.sentiment} (${art.sentimentScore >= 0 ? '+' : ''}${art.sentimentScore.toFixed(2)})\n\n`;
        });
        await this.sendMessage(chatId, reply);
      } catch {
        await this.sendMessage(chatId, 'Error compiling financial news feed.');
      }
    } else if (text.startsWith('/analyze')) {
      const parts = text.split(' ');
      const symbol = parts[1]?.toUpperCase();
      if (!symbol) {
        await this.sendMessage(chatId, 'Usage: `/analyze <symbol>` (e.g. `/analyze TSLA`)');
        return;
      }

      await this.sendMessage(chatId, `Analyzing ticker *${symbol}*...`);

      try {
        const quote = await marketDataService.getQuote(symbol);
        const indicators = await marketDataService.calculateTechnicalIndicators(symbol);
        const sentiment = await newsService.getMarketSentiment(symbol);

        let reply = `*Profile Report: ${symbol}*\n\n`;
        reply += `• *Price*: $${quote.price.toLocaleString()} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)\n`;
        reply += `• *RSI (14)*: ${indicators.rsi.toFixed(2)}\n`;
        reply += `• *SMA (20/50)*: $${indicators.sma20.toFixed(2)} / $${indicators.sma50.toFixed(2)}\n`;
        reply += `• *Sentiment*: ${sentiment.bullishPercent}% Bullish | ${sentiment.bearishPercent}% Bearish\n`;

        await this.sendMessage(chatId, reply);
      } catch {
        await this.sendMessage(chatId, `Failed to retrieve quantitative details for symbol: ${symbol}`);
      }
    } else {
      await this.sendMessage(
        chatId,
        `Sorry, I didn't recognize that command. Type /help to see all available commands.`
      );
    }
  }
}

export const telegramService = new TelegramService();
export default telegramService;
