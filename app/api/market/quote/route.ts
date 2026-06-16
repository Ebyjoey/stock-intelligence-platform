import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/services/market-data/market-data.service';

export const revalidate = 10; // Cache endpoint for 10s at router boundary

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Ticker symbol parameter is required' }, { status: 400 });
    }

    const quote = await marketDataService.getQuote(symbol);
    return NextResponse.json(quote);
  } catch (err: any) {
    console.error('Market Quote API error:', err);
    return NextResponse.json({ error: 'Failed to fetch quote data', details: err.message }, { status: 500 });
  }
}
