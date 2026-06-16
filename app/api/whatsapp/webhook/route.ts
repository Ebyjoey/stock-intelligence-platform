import { NextRequest, NextResponse } from 'next/server';
import { whatsAppService } from '@/services/whatsapp/whatsapp.service';

/**
 * Handles Webhook setup verification challenge from Meta.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const response = whatsAppService.verifyWebhook(mode, token, challenge);
  if (response !== null) {
    return new Response(response, { status: 200 });
  }

  return new Response('Forbidden verify challenge', { status: 403 });
}

/**
 * Process incoming WhatsApp messages and notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const entry = payload?.entry;
    if (entry) {
      await whatsAppService.handleIncomingMessage(entry);
    }

    return NextResponse.json({ success: true });
    err: unknown) {
    console.error('WhatsApp Webhook Route Error:', err);
    return NextResponse.json({ error: 'Webhook payload parsing failed', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
