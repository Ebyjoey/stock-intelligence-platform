# Production Deployment Guide

This document outlines the deployment process for the Stock Intelligence Platform to **Vercel** and **PostgreSQL**.

---

## 1. Database Provisioning (PostgreSQL)

You can provision a PostgreSQL database using providers like Vercel Postgres, Neon, AWS RDS, or Supabase.

Once created, retrieve your database connection string. It should look like:
```env
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"
```

---

## 2. Environment Variables Configuration

Copy or create a `.env` file containing the following variables:

```env
# 1. System Database Connection
DATABASE_URL="postgresql://..."

# 2. Authentication Secrets (NextAuth)
NEXTAUTH_SECRET="a-random-32-character-hash-for-jwt-signing"
NEXTAUTH_URL="https://your-vercel-domain.com" # Or http://localhost:3000 for local

# 3. Artificial Intelligence Engine
OPENAI_API_KEY="sk-proj-..."

# 4. Market Data Providers (Optional - Falls back to Yahoo Finance automatically)
FINNHUB_API_KEY="..."
POLYGON_API_KEY="..."
ALPHAVANTAGE_API_KEY="..."

# 5. Mobile Chat Integrations (Optional)
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_WEBHOOK_SECRET="..."
WHATSAPP_API_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_WEBHOOK_VERIFY_TOKEN="..."

# 6. Embedded Power BI Dashboards (Optional)
POWERBI_TENANT_ID="..."
POWERBI_CLIENT_ID="..."
POWERBI_CLIENT_SECRET="..."
POWERBI_WORKSPACE_ID="..."
POWERBI_REPORT_ID="..."
```

---

## 3. Vercel Deployment

Deploy directly using the Vercel CLI or link a GitHub Repository:

### Option A: Vercel CLI
```bash
# 1. Install CLI
npm install -g vercel

# 2. Deploy
vercel
```

### Option B: GitHub Integration
1. Push this codebase to your personal GitHub repository.
2. Open Vercel dashboard and click **Add New Project**.
3. Import the repository.
4. Input all the Environment Variables listed above under the **Environment Variables** accordion.
5. Click **Deploy**. Vercel will automatically run:
   - Build command: `npm run build`
   - Output directory: `.next`
