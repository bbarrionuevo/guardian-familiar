// Canal de WhatsApp con la API oficial de Meta (WhatsApp Cloud API).
//   GET  /whatsapp/webhook → verificación de Meta (hub.verify_token)
//   POST /whatsapp/webhook → mensajes, firmados con X-Hub-Signature-256 (secreto de la app)
// Las respuestas dentro de las 24 h del último mensaje de la persona son texto libre. El aviso a
// un familiar que no escribió hace poco necesita una plantilla aprobada por Meta.
// Pausa puede tener dos números: el argentino (español) y el italiano. A cada persona se le contesta
// por el número al que escribió; a quien no escribió, por el de su país.

import type { Lang } from '../motor/tipos';
import type { Incoming, Messenger } from './canal';

export interface WhatsAppLine {
  phoneNumberId: string;
  // Número sin «+» ni espacios, para los enlaces wa.me.
  number: string;
  lang: Lang;
}

export interface WhatsAppConfig {
  token: string;
  // El primero es el de siempre: se usa cuando no hay uno del idioma de la persona.
  lines: WhatsAppLine[];
  apiVersion?: string;
  // Nombre de la plantilla aprobada para el aviso a la familia (opcional).
  alertTemplate?: string;
  // Por qué número escribió cada persona en este pedido (de Incoming.via).
  replyVia?: Map<string, string>;
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
  entry?: {
    changes?: {
      value?: { metadata?: { phone_number_id?: string }; messages?: WaMessage[]; contacts?: { wa_id: string; profile?: { name?: string } }[] };
    }[];
  }[];
}

// Reacciones con emoji, stickers y avisos del sistema (cambio de número): no son mensajes para
// revisar, y contestarles «puedo revisar texto…» molesta.
const IGNORED_TYPES = new Set(['reaction', 'sticker', 'system', 'ephemeral']);

// Meta no informa el idioma: por el prefijo del número, Italia en italiano y el resto en español.
const langFromNumber = (n: string) => (n.startsWith('39') ? 'it' : 'es');

export function whatsappIncoming(body: unknown): Incoming[] {
  const out: Incoming[] = [];
  for (const entry of (body as WaWebhook)?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      for (const m of value?.messages ?? []) {
        if (IGNORED_TYPES.has(m.type)) continue;
        const contact = value?.contacts?.find((c) => c.wa_id === m.from);
        const incoming: Incoming = {
          from: { channel: 'whatsapp', id: m.from },
          name: contact?.profile?.name,
          langCode: langFromNumber(m.from),
          text: m.text?.body ?? m.image?.caption ?? m.document?.caption ?? '',
          forwarded: Boolean(m.context?.forwarded || m.context?.frequently_forwarded),
          messageId: m.id,
          via: value?.metadata?.phone_number_id,
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
  const main = cfg.lines[0]!;
  const forLang = (lang?: Lang) => cfg.lines.find((l) => l.lang === lang) ?? main;
  // Por el número al que escribió la persona; si no escribió en este pedido, por el de su país.
  const lineFor = (to: string) => cfg.lines.find((l) => l.phoneNumberId === cfg.replyVia?.get(to)) ?? forLang(langFromNumber(to));

  async function post(line: WhatsAppLine, payload: Record<string, unknown>): Promise<boolean> {
    const res = await fetchFn(`${base}/${line.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
    });
    if (!res.ok) log(`whatsapp: envío ${res.status}`);
    return res.ok;
  }

  const sendText = (to: string, text: string) => post(lineFor(to), { to, type: 'text', text: { body: text, preview_url: false } });

  return {
    send: sendText,
    // Marca el mensaje como leído (tilde azul) y muestra «escribiendo…» hasta la respuesta. Si la
    // API no lo acepta, se sigue igual.
    async typing(to, messageId) {
      if (!messageId) return;
      await post(lineFor(to), { status: 'read', message_id: messageId, typing_indicator: { type: 'text' } }).catch(() => false);
    },
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
    inviteLink: (code, lang) => `https://wa.me/${forLang(lang).number.replace(/\D/g, '')}?text=fam_${code}`,
    async sendAlert(to, alert) {
      if (!cfg.alertTemplate) return sendText(to, alert.text);
      const ok = await post(lineFor(to), {
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
