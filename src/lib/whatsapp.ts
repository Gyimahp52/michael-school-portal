// WhatsApp Cloud API helper
// Requires env vars:
// VITE_WHATSAPP_TOKEN, VITE_WHATSAPP_PHONE_NUMBER_ID

type SendRequest = {
  to: string;
  body: string;
};

export function normalizePhoneToE164(rawPhone: string): string {
  const trimmed = (rawPhone || '').replace(/\D+/g, '');
  if (trimmed.startsWith('0') && trimmed.length === 10) {
    return `233${trimmed.slice(1)}`;
  }
  return trimmed;
}

export async function sendWhatsAppText(rawTo: string, message: string): Promise<void> {
  const apiBase = import.meta.env.VITE_TWILIO_WHATSAPP_API || 'http://localhost:3001';
  const toE164 = normalizePhoneToE164(rawTo);

  const res = await fetch(`${apiBase}/api/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: toE164, body: message } satisfies SendRequest),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio WhatsApp send failed: ${res.status} ${errText}`);
  }
}


