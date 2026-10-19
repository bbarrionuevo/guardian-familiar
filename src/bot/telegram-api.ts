// Cliente mínimo de la API de bots de Telegram, con fetch (funciona en Workers y en Node).

import type { Incoming, Messenger } from './canal';

export interface TgUser {
  id: number;
  first_name: string;
  language_code?: string;
}

export interface TgPhotoSize {
  file_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TgMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: TgUser;
  text?: string;
  caption?: string;
  photo?: TgPhotoSize[];
  document?: { file_id: string; mime_type?: string; file_size?: number };
  voice?: { file_id: string; mime_type?: string; file_size?: number; duration: number };
  audio?: { file_id: string; mime_type?: string; file_size?: number; duration: number };
  // Presente cuando el mensaje fue reenviado.
  forward_origin?: unknown;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
}

export interface TelegramApi {
  sendMessage(chatId: number, text: string): Promise<boolean>;
  sendTyping(chatId: number): Promise<void>;
  // Descarga un archivo; null si no se pudo o pesa más que el límite.
  downloadFile(fileId: string, maxBytes: number): Promise<Uint8Array | null>;
}

type FetchFn = typeof fetch;

export function createTelegramApi(token: string, fetchFn: FetchFn = fetch): TelegramApi {
  const base = `https://api.telegram.org/bot${token}`;

  async function call(method: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const res = await fetchFn(`${base}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok: boolean; result?: Record<string, unknown> };
    return data.ok ? (data.result ?? {}) : null;
  }

  return {
    async sendMessage(chatId, text) {
      // Sin formato: el texto puede traer guiones bajos o asteriscos que romperían el Markdown.
      return (await call('sendMessage', { chat_id: chatId, text, link_preview_options: { is_disabled: true } })) !== null;
    },
    async sendTyping(chatId) {
      await call('sendChatAction', { chat_id: chatId, action: 'typing' });
    },
    async downloadFile(fileId, maxBytes) {
      const file = await call('getFile', { file_id: fileId });
      const path = file?.file_path;
      const size = typeof file?.file_size === 'number' ? file.file_size : 0;
      if (typeof path !== 'string' || size > maxBytes) return null;
      const res = await fetchFn(`https://api.telegram.org/file/bot${token}/${path}`);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      return bytes.byteLength > maxBytes ? null : bytes;
    },
  };
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

// Traduce una actualización de Telegram al formato común del bot. Solo chats privados.
export function telegramIncoming(update: TgUpdate, maxImageBytes: number): Incoming | null {
  const msg = update.message;
  if (!msg || msg.chat.type !== 'private') return null;
  const incoming: Incoming = {
    from: { channel: 'telegram', id: String(msg.chat.id) },
    name: msg.from?.first_name,
    langCode: msg.from?.language_code,
    text: msg.text ?? msg.caption ?? '',
    forwarded: Boolean(msg.forward_origin),
  };
  if (msg.photo?.length) {
    // La foto más grande que entre en el límite.
    const photo = [...msg.photo].sort((a, b) => b.width * b.height - a.width * a.height).find((p) => (p.file_size ?? 0) <= maxImageBytes);
    if (photo) incoming.image = { id: photo.file_id, mimeType: 'image/jpeg' };
    else incoming.imageTooBig = true;
  } else if (msg.document?.mime_type?.startsWith('image/')) {
    incoming.image = { id: msg.document.file_id, mimeType: msg.document.mime_type };
  }
  const sound = msg.voice ?? msg.audio;
  if (sound) incoming.audio = { id: sound.file_id, mimeType: sound.mime_type, seconds: sound.duration };
  return incoming;
}

export function telegramMessenger(api: TelegramApi, botUsername: string): Messenger {
  return {
    send: (to, text) => api.sendMessage(Number(to), text),
    typing: (to) => api.sendTyping(Number(to)),
    download: (ref, maxBytes) => api.downloadFile(ref.id, maxBytes),
    // El usuario del bot puede venir escrito con @; en el enlace va sin.
    inviteLink: (code) => `https://t.me/${botUsername.replace(/^@/, '')}?start=fam_${code}`,
  };
}
