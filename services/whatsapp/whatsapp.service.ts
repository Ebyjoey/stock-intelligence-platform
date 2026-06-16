interface OutgoingMessage {
  to: string;
  text: string;
  retries: number;
}

class WhatsAppService {
  private apiToken = process.env.WHATSAPP_API_TOKEN;
  private phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  
  // Message Queue for retry handling
  private messageQueue: OutgoingMessage[] = [];
  private isProcessingQueue = false;

  /**
   * Queue message to send out via WhatsApp API.
   */
  async queueMessage(to: string, text: string): Promise<void> {
    this.messageQueue.push({ to, text, retries: 0 });
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (!msg) break;

      const success = await this.sendDirectMessage(msg.to, msg.text);
      if (!success) {
        if (msg.retries < 3) {
          msg.retries++;
          // Put back in queue with minor delay backoff
          console.warn(`WhatsApp send failed to ${msg.to}. Retrying ${msg.retries}/3...`);
          this.messageQueue.push(msg);
          await new Promise(resolve => setTimeout(resolve, 2000 * msg.retries));
        } else {
          console.error(`WhatsApp send failed permanently to ${msg.to} after 3 retries.`);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async sendDirectMessage(to: string, text: string): Promise<boolean> {
    if (!this.apiToken || !this.phoneId) {
      console.warn('WhatsAppService: Credentials not set. Simulating WhatsApp output.');
      console.log(`[WHATSAPP MOCK OUTBOX] To: ${to} | Text: ${text}`);
      return true; // Simulate success to empty queue in development
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${this.phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text },
        }),
      });

      return res.ok;
    } catch (err) {
      console.error('WhatsAppService direct message error:', err);
      return false;
    }
  }

  /**
   * Validates verification hubs sent by Meta during Webhook configurations.
   */
  verifyWebhook(mode: string | null, token: string | null, challenge: string | null): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Handles incoming user updates via Meta Cloud Webhook.
   */
  async handleIncomingMessage(entry: any): Promise<void> {
    const changes = entry?.[0]?.changes?.[0]?.value;
    const message = changes?.messages?.[0];
    if (!message || !message.text?.body) return;

    const from = message.from;
    const body = message.text.body.trim().toLowerCase();

    // Basic conversational parsing
    if (body.includes('market') || body === 'indices') {
      this.queueMessage(from, 'Fetching indices performance... standard triggers online.');
    } else if (body.startsWith('analyze ')) {
      const ticker = body.replace('analyze ', '').toUpperCase();
      this.queueMessage(from, `Initializing quant summary analysis for ticker ${ticker}...`);
    } else {
      this.queueMessage(
        from,
        `Welcome to Stock Intelligence Bot.\n\nReply with:\n- 'market' (Market overview)\n- 'analyze <symbol>' (e.g. 'analyze AAPL')`
      );
    }
  }
}

export const whatsAppService = new WhatsAppService();
export default whatsAppService;
