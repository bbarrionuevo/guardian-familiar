// Almacenamiento mínimo en KV: idioma, nombre y vínculos familiares de cada chat, e invitaciones.
// Los contadores están en contadores.ts. Nunca se guarda el texto, las fotos ni los audios que se
// revisan.

import type { Lang } from '../motor/tipos';
import type { Address, Channel } from './canal';

export interface Store {
  get<T>(key: string): Promise<T | null>;
  put(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Link {
  chatId: number | string;
  name: string;
  // Sin canal es Telegram (los vínculos guardados antes de sumar WhatsApp).
  channel?: Channel;
}

export const linkAddress = (l: { chatId: number | string; channel?: Channel }): Address => ({ channel: l.channel ?? 'telegram', id: String(l.chatId) });
export const sameAddress = (a: Address, b: Address) => a.channel === b.channel && a.id === b.id;

export interface UserRecord {
  lang: Lang;
  name: string;
  // A quiénes se avisa cuando este usuario recibe un mensaje de riesgo alto.
  guardians: Link[];
  // A quiénes cuida este usuario (la otra punta del vínculo).
  protects: Link[];
  // Último mes en que se usó (AAAA-MM). El registro se borra solo a los 13 meses sin uso.
  visto?: string;
}

export interface Invite {
  childChatId: number | string;
  childName: string;
  channel?: Channel;
}

// Telegram conserva las claves de antes (u:<id>); WhatsApp lleva prefijo (u:wa:<número>).
const addressKey = (a: Address) => (a.channel === 'telegram' ? a.id : `wa:${a.id}`);

export const keys = {
  user: (a: Address) => `u:${addressKey(a)}`,
  invite: (code: string) => `inv:${code}`,
};

export class MemoryStore implements Store {
  private data = new Map<string, { value: string; expires: number | null }>();
  constructor(private now: () => number = () => Date.now()) {}

  async get<T>(key: string): Promise<T | null> {
    const item = this.data.get(key);
    if (!item) return null;
    if (item.expires !== null && item.expires <= this.now()) {
      this.data.delete(key);
      return null;
    }
    return JSON.parse(item.value) as T;
  }

  async put(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.data.set(key, { value: JSON.stringify(value), expires: ttlSeconds ? this.now() + ttlSeconds * 1000 : null });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
}

export class KvStore implements Store {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    return (await this.kv.get(key, 'json')) as T | null;
  }

  async put(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    // KV pide al menos 60 segundos de vida.
    const options = ttlSeconds ? { expirationTtl: Math.max(60, ttlSeconds) } : undefined;
    await this.kv.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
