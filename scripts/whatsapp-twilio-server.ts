import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import type { Request, Response } from 'express';

// Do not import Twilio on the client. This file runs under Node.
// Requires environment variables:
//  - TWILIO_ACCOUNT_SID
//  - TWILIO_AUTH_TOKEN
//  - TWILIO_WHATSAPP_FROM  (e.g., whatsapp:+14155238886)

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (_req: Request, res: Response) => {
  res.type('html').send(
    '<!doctype html><html><head><meta charset="utf-8"/><title>WhatsApp Service</title></head><body style="font-family:system-ui,sans-serif;padding:24px"><h1>Twilio WhatsApp server is running</h1><p>POST <code>/api/whatsapp/send</code> with JSON { "to": "+233XXXXXXXXX", "body": "Your message" }.</p></body></html>'
  );
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  const { to, body } = req.body || {};
  if (!to || !body) {
    return res.status(400).json({ error: 'Missing "to" or "body"' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'Server not configured for Twilio (missing env vars)' });
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    const normalizedTo = normalizeToWhatsApp(to);
    const message = await client.messages.create({
      from: fromNumber,
      to: normalizedTo,
      body,
    });

    return res.json({ sid: message.sid, status: message.status });
  } catch (err: any) {
    const msg = err?.message || String(err);
    return res.status(500).json({ error: msg });
  }
});

function normalizeToWhatsApp(raw: string): string {
  // Ensure format whatsapp:+<E164>
  const digits = String(raw || '').replace(/\D+/g, '');
  // Simple Ghana local normalization: 0XXXXXXXXX -> +233XXXXXXXXX
  const e164 = digits.startsWith('0') && digits.length === 10
    ? `+233${digits.slice(1)}`
    : (digits.startsWith('+') ? digits : `+${digits}`);
  return `whatsapp:${e164}`;
}

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Twilio WhatsApp server listening on http://localhost:${port}`);
});
