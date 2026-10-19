// Canal de WhatsApp con la API oficial de Meta (WhatsApp Cloud API).
//   GET  /whatsapp/webhook → verificación de Meta (hub.verify_token)
//   POST /whatsapp/webhook → mensajes, firmados con X-Hub-Signature-256 (secreto de la app)
// Las respuestas dentro de las 24 h del último mensaje de la persona son texto libre. El aviso a
// un familiar que no escribió hace poco necesita una plantilla aprobada por Meta.

import type { Incoming, Messenger } from './canal';

export interface WhatsAppConfig {
  token: string;
  phoneNumberId: string;
  // Número del bot sin «+» ni espacios, para el enlace wa.me de las invitaciones.
  number: string;
  apiVersion?: string;
  // Nombre de la plantilla aprobada para el aviso a la familia (opcional).
  alertTemplate?: string;
}

interface WaMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type?: string; caption?: string };
  audio?: { id: string; mime_type?: string };
  document?: { id: string; mime_type?: string; caption?: string };
  context?: { forwarded?: boolean; frequently_forwarded?: boolean };
}

interface WaWebhook {
  entry?: { changes?: { value?: { messages?: WaMessage[]; contacts?: { wa_id: string; profile?: { name?: string } }[] } }[] }[];
}

// Meta no informa el idioma: por el prefijo del número, Italia en italiano y el resto en español.
const langFromNumber = (n: string) => (n.startsWith('39') ? 'it' : 'es');

export function whatsappIncoming(body: unknown): Incoming[] {
  const out: Incoming[] = [];
  for (const entry of (body as WaWebhook)?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      for (const m of value?.messages ?? []) {
        const contact = value?.contacts?.find((c) => c.wa_id === m.from);
        const incoming: Incoming = {
          from: { channel: 'whatsapp', id: m.from },
          name: contact?.profile?.name,
          langCode: langFromNumber(m.from),
          text: m.text?.body ?? m.image?.caption ?? m.document?.caption ?? '',
          forwarded: Boolean(m.context?.forwarded || m.context?.frequently_forwarded),
        };
        if (m.image) incoming.image = { id: m.image.id, mimeType: m.image.mime_type?.split(';')[0] };
        else if (m.document?.mime_type?.startsWith('image/')) incoming.image = { id: m.document.id, mimeType: m.document.mime_type };
        if (m.audio) incoming.audio = { id: m.audio.id, mimeType: m.audio.mime_type };
        out.push(incoming);
      }
    }
  }
  return out;
}

// Comprueba la firma HMAC-SHA256 que Meta pone en X-Hub-Signature-256.
export async function validSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header?.startsWith('sha256=') || !appSecret) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  const got = header.slice('sha256='.length);
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

type FetchFn = typeof fetch;

export function whatsappMessenger(cfg: WhatsAppConfig, fetchFn: FetchFn = fetch, log: (m: string) => void = () => {}): Messenger {
  const base = `https://graph.facebook.com/${cfg.apiVersion || 'v23.0'}`;
  const auth = { authorization: `Bearer ${cfg.token}` };

  async function post(payload: Record<string, unknown>): Promise<boolean> {
    const res = await fetchFn(`${base}/${cfg.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
    });
    if (!res.ok) log(`whatsapp: envío ${res.status}`);
    return res.ok;
  }

  const sendText = (to: string, text: string) => post({ to, type: 'text', text: { body: text, preview_url: false } });

  return {
    send: sendText,
    // La API no tiene un «escribiendo…» simple: no se muestra nada.
    typing: async () => {},
    async download(ref, maxBytes) {
      const meta = await fetchFn(`${base}/${ref.id}`, { headers: auth });
      if (!meta.ok) return null;
      const info = (await meta.json()) as { url?: string; file_size?: number };
      if (!info.url || (info.file_size ?? 0) > maxBytes) return null;
      const file = await fetchFn(info.url, { headers: auth });
      if (!file.ok) return null;
      const bytes = new Uint8Array(await file.arrayBuffer());
      return bytes.byteLength > maxBytes ? null : bytes;
    },
    inviteLink: (code) => `https://wa.me/${cfg.number.replace(/\D/g, '')}?text=fam_${code}`,
    async sendAlert(to, alert) {
      if (!cfg.alertTemplate) return sendText(to, alert.text);
      const ok = await post({
        to,
        type: 'template',
        template: {
          name: cfg.alertTemplate,
          language: { code: alert.lang },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: alert.who },
                { type: 'text', text: alert.label },
                { type: 'text', text: alert.action },
              ],
            },
          ],
        },
      });
      // Si la plantilla falla, se prueba como texto (llega si el familiar escribió en las últimas 24 h).
      return ok || sendText(to, alert.text);
    },
  };
}
