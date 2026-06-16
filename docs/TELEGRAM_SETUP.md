# Telegram Bot Setup Guide

The Stock Intelligence Bot connects to Telegram Bot API to dispatch market notifications, watchlist updates, and quick technical analysis reports.

## Setup Instructions

### 1. Register Bot with BotFather
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the instructions to choose a name and username.
3. Save the returned **API Token**. It looks like `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`.

### 2. Configure Environment Variables
Add the token to your local `.env` file:
```env
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_WEBHOOK_SECRET="a-custom-secret-string-to-secure-webhook"
```

### 3. Establish Webhook
Telegram requires a public HTTPS URL to send messages. When deploying on Vercel:
Use the standard Telegram API `setWebhook` endpoint to point to your routing path:
```bash
curl -F "url=https://your-vercel-domain.com/api/telegram/webhook" \
     -F "secret_token=a-custom-secret-string-to-secure-webhook" \
     https://api.telegram.org/bot<your-telegram-bot-token>/setWebhook
```

## Available Bot Commands
- `/start` - Connects the terminal and boots help menus.
- `/market` - Queries S&P 500, Nasdaq, Dow Jones, and Nifty quotes.
- `/news` - Fetches the latest global financial news headlines and sentiment.
- `/analyze <symbol>` - Triggers a real-time technical calculation (RSI, SMA).
