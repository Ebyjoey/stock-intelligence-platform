import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/services/telegram/telegram.service';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // In production, verify Telegram headers/secrets for webhook security
    const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    const systemSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (systemSecret && secretHeader !== systemSecret) {
      return NextResponse.json({ error: 'Unauthorized secret token challenge' }, { status: 401 });
    }

    await telegramService.handleWebhookUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Telegram Webhook Route Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
