// Almacenamiento mínimo: idioma, nombre y vínculos familiares de cada chat, invitaciones
// y contadores diarios. Nunca se guarda el texto, las fotos ni los audios que se revisan.

import type { Lang } from '../motor/tipos';

export interface Store {
  get<T>(key: string): Promise<T | null>;
  put(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  // Cuántas claves empiezan con el prefijo (para las métricas del día).
  count(prefix: string): Promise<number>;
}

export interface Link {
  chatId: number;
  name: string;
}

export interface UserRecord {
  lang: Lang;
  name: string;
  // A quiénes se avisa cuando este usuario recibe un mensaje de riesgo alto.
  guardians: Link[];
  // A quiénes cuida este usuario (la otra punta del vínculo).
  protects: Link[];
}

export interface Invite {
  childChatId: number;
  childName: string;
}

export const keys = {
  user: (chatId: number) => `u:${chatId}`,
  invite: (code: string) => `inv:${code}`,
  // Una clave por chat y día: sirve de límite diario y para contar usuarios activos.
  daily: (day: string, chatId: number) => `cnt:${day}:${chatId}`,
  stats: (day: string) => `st:${day}`,
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

  async count(prefix: string): Promise<number> {
    let n = 0;
    for (const key of this.data.keys()) if (key.startsWith(prefix) && (await this.get(key)) !== null) n++;
    return n;
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

  async count(prefix: string): Promise<number> {
    let n = 0;
    let cursor: string | undefined;
    do {
      const page = await this.kv.list({ prefix, cursor });
      n += page.keys.length;
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    return n;
  }
}
