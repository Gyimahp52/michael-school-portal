// WhatsApp Cloud API helper
// Requires env vars:
// VITE_WHATSAPP_TOKEN, VITE_WHATSAPP_PHONE_NUMBER_ID

type WhatsAppTextPayload = {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
};

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

function getConfig() {
  const token = import.meta.env.VITE_WHATSAPP_TOKEN as string | undefined;
  const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID as string | undefined;
  if (!token || !phoneNumberId) {
    throw new Error('Missing WhatsApp configuration. Set VITE_WHATSAPP_TOKEN and VITE_WHATSAPP_PHONE_NUMBER_ID');
  }
  return { token, phoneNumberId };
}

export function normalizePhoneToE164(rawPhone: string): string {
  const trimmed = (rawPhone || '').replace(/\D+/g, '');
  // If starts with 0 and likely Ghana local, convert 0XXXXXXXXX -> 233XXXXXXXXX
  if (trimmed.startsWith('0') && trimmed.length === 10) {
    return `233${trimmed.slice(1)}`;
  }
  // If already with country code
  return trimmed;
}

export async function sendWhatsAppText(rawTo: string, message: string): Promise<void> {
  const { token, phoneNumberId } = getConfig();
  const to = normalizePhoneToE164(rawTo);
  const url = `${GRAPH_BASE}/${phoneNumberId}/messages`;
  const payload: WhatsAppTextPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp send failed: ${res.status} ${errText}`);
  }
}


