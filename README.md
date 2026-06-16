# Stock Intelligence Platform

A handcrafted, high-density, production-grade financial market intelligence terminal and chatbot. Designed with Bloomberg and TradingView aesthetics. Built with Next.js 15, PostgreSQL, Prisma, NextAuth, OpenAI API streaming, Power BI Embedded, Telegram webhook alerts, and WhatsApp Cloud queues.

## Core Feature Areas
- **Live Market Feed & Fallback Layer**: Implements a cascading provider strategy (Finnhub ➔ Polygon.io ➔ Alpha Vantage ➔ Yahoo Finance) with in-memory caching and rate-limit safeguards.
- **Quant Chat Assistant**: Grounded completion chatbot that extracts symbols, fetches quotes, technical averages (RSI/SMA/EMA), and sentiment indicators before generating OpenAI completions.
- **Watchlists & Threshold Alerts**: Track tickers, draft stock analysis logs, and deploy price alert triggers to Telegram or WhatsApp.
- **Power BI Secure Embeds**: Embedded report viewer powered by secure client token generation using Microsoft Azure AAD.

---

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, TanStack Query, Framer Motion, Lucide Icons.
- **Backend**: Server Actions, API Routes, Edge stream handlers.
- **Storage & Auth**: PostgreSQL, Prisma ORM, NextAuth JWT session handler.
- **Bots**: Meta WhatsApp Cloud API, Telegram Bot API.

---

## Folder Structure
```
stock-intelligence-platform/
├── prisma/               # DB schema file
├── app/                  # Next.js App Router (RSC page grids & API routes)
├── components/           # Reusable UI cards, Markdown parsers, Power BI embeds
├── features/             # Shared client hooks and structures
├── services/             # Live Market Providers, News Engines, WhatsApp, Telegram, Power BI
├── docs/                 # Guides for setup and architecture
└── tests/                # Unit and Integration test files
```

---

## Quick Start Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Settings
Create a `.env` file in the root folder (see [DEPLOYMENT.md](file:///Users/abyjoseph/.gemini/antigravity-ide/scratch/stock-intelligence-platform/DEPLOYMENT.md) for full configuration keys).

### 3. Initialize Prisma Database
Configure a local or cloud PostgreSQL database and push schemas:
```bash
npx prisma generate
npx prisma db push
```

### 4. Boot Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the terminal workspace dashboard.

---

## Guides & Documentation
- [Architecture & Design Details](file:///Users/abyjoseph/.gemini/antigravity-ide/scratch/stock-intelligence-platform/docs/ARCHITECTURE.md)
- [Production Deployment Guide](file:///Users/abyjoseph/.gemini/antigravity-ide/scratch/stock-intelligence-platform/DEPLOYMENT.md)
- [Telegram Webhook Setup](file:///Users/abyjoseph/.gemini/antigravity-ide/scratch/stock-intelligence-platform/docs/TELEGRAM_SETUP.md)
- [WhatsApp Cloud API Config](file:///Users/abyjoseph/.gemini/antigravity-ide/scratch/stock-intelligence-platform/docs/WHATSAPP_SETUP.md)
- [Microsoft Power BI Embed Config](file:///Users/abyjoseph/.gemini/antigravity-ide/scratch/stock-intelligence-platform/docs/POWERBI_SETUP.md)
