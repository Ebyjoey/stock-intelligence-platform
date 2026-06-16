# Meta WhatsApp Cloud API Setup Guide

This guide details configuring the WhatsApp Cloud API integration for dispatching mobile stock briefings and threshold warnings.

## Meta Developer Console Configuration

### 1. Create Meta App
1. Navigate to [Meta for Developers](https://developers.facebook.com/).
2. Create a new app and select the **Business** type.
3. Add the **WhatsApp** product configuration to the app.

### 2. Retrieve Phone Number ID and Access Token
1. Under **WhatsApp** -> **Getting Started**:
   - Copy the **Temporary Access Token** (or configure a System User access token for persistent production use).
   - Copy the **Phone Number ID**.

### 3. Add to Environment Settings
Update your project `.env` with the retrieved keys:
```env
WHATSAPP_API_TOKEN="your-meta-access-token"
WHATSAPP_PHONE_NUMBER_ID="your-whatsapp-phone-id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="a-random-token-matching-meta-console"
```

### 4. Setup Webhook Handshake
1. In Meta App Dashboard, navigate to **WhatsApp** -> **Configuration**:
   - Set **Callback URL** to `https://your-vercel-domain.com/api/whatsapp/webhook`.
   - Set **Verify Token** to the same string as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
2. Click **Verify and Save**. Meta will execute a `GET` handshake request which the router processes.
3. Subscribe to the **messages** webhook topic.
