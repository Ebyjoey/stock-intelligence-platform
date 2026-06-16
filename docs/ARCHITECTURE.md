# Stock Intelligence Platform Architecture

This document describes the design principles and structural patterns implemented in the **Stock Intelligence Platform** (`stock-intelligence-platform`).

## Design Philosophies
- **Bloomberg density meets TradingView visuals**: Focus on high-density information layout, fast rendering times, dark mode by default, and monospace typography accents.
- **RSC Patterns (Next.js App Router)**: Leverage React Server Components to fetch and display dashboard data, keeping initial bundle size minimal.
- **Grounded AI (No Hallucinations)**: The Chatbot intercepts user queries, fetches live quotes, indicators, and sentiments, and forwards them as system grounding context to OpenAI before returning streams.

---

## 1. Unified Market Data Layer

To prevent lock-in to a single vendor and handle rate limits or API outages gracefully, we implemented a Provider abstraction layer:

```
                  ┌──────────────────────┐
                  │  MarketDataService   │
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┬───────────────┐
            ▼                ▼                ▼               ▼
   ┌────────────────┐┌───────────────┐┌───────────────┐┌──────────────┐
   │ FinnhubProvider││PolygonProvider││AlphaVantagePr.││YahooFinanceP.│
   └────────────────┘└───────────────┘└───────────────┘└──────────────┘
```

- **Fallback Cascade**: Starts with Finnhub, moves to Polygon, then Alpha Vantage, and ultimately Yahoo Finance (which uses public chart scrapers and requires zero credentials).
- **Request Caching**: In-memory caching wraps every call with customizable TTLs (e.g. 15 seconds for live quote lookups, 5 minutes for charts and sector briefs).

---

## 2. Quantitative Context Pipeline

Chat completions are processed via a strict context enrichment flow:

```
User Question ──► Symbol Scan ──► Fetch Quotes ──► Fetch News & Sentiment ──► Grounded System System Context ──► OpenAI gpt-4o Stream ──► Client
```

1. **Symbol Scanning**: Scans text query for Cashtags (`$AAPL`) and company references ("Tesla").
2. **Context Assembly**: Fetches RSI, MACD, and SMA moving averages to avoid generating hallucinated values.
3. **Sentiment Analysis**: Evaluates news feeds using a localized VADER-style keywords scoring engine.
4. **Completion Delivery**: The prompt is processed at edge nodes to reduce time-to-first-token.

---

## 3. Webhook Bot Handlers

Both **Telegram** and **WhatsApp** bots run as background listeners via edge endpoints:
- `/api/telegram/webhook` handles subscriber updates and dispatches markdown alerts.
- `/api/whatsapp/webhook` uses Meta Cloud verification handshakes and message queues to perform retries.
