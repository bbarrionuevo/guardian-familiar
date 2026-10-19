// Contadores por día: el límite de revisiones de cada persona (o conexión de la web) y los totales
// para las métricas. Viven en un Durable Object (src/servidor/contadores.ts), que suma de a uno sin
// perder cuentas aunque lleguen muchas revisiones juntas y sin gastar escrituras de KV.
// Un contador nunca frena una respuesta: si falla, la revisión sigue como si no existiera.

import type { Address } from './canal';

export type StatsGroup = 'bot' | 'web';
export type Totals = Record<string, number>;
export type DayTotals = Partial<Record<StatsGroup, Totals>>;

export interface Counters {
  // Suma uno al uso del día si no llegó al límite. Devuelve cuántos lleva (con este).
  take(key: string, limit: number): Promise<{ ok: boolean; used: number }>;
  // Suma a los totales del día.
  add(day: string, group: StatsGroup, fields: Totals): Promise<void>;
  // Totales de varios días, para /api/metricas.
  read(days: string[]): Promise<Record<string, DayTotals>>;
}

// Las claves llevan el día: así la limpieza de cada noche borra las de días anteriores, que
// incluyen el id de la persona o la IP.
export const counterKeys = {
  user: (day: string, a: Address) => `u:${day}:${a.channel === 'telegram' ? a.id : `wa:${a.id}`}`,
  ip: (day: string, ip: string) => `ip:${day}:${ip}`,
};

const STATS_DAYS = 400;
const statsKey = (group: StatsGroup, day: string) => `st:${group}:${day}`;
export const dayOf = (t: number) => new Date(t).toISOString().slice(0, 10);

// Lo mínimo del almacenamiento de un Durable Object que usan los contadores.
export interface CounterStorage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(keys: string[]): Promise<number>;
  list<T>(options: { prefix: string; end?: string }): Promise<Map<string, T>>;
}

export type CounterCommand =
  | { op: 'take'; key: string; limit: number }
  | { op: 'add'; day: string; group: StatsGroup; fields: Totals }
  | { op: 'read'; days: string[] };

// La lógica de los contadores. El Durable Object la corre de a un pedido por vez, así que leer y
// escribir no pierde cuentas.
export async function runCounter(storage: CounterStorage, cmd: CounterCommand): Promise<unknown> {
  switch (cmd.op) {
    case 'take': {
      const used = (await storage.get<number>(cmd.key)) ?? 0;
      if (used >= cmd.limit) return { ok: false, used };
      await storage.put(cmd.key, used + 1);
      return { ok: true, used: used + 1 };
    }
    case 'add': {
      const key = statsKey(cmd.group, cmd.day);
      const totals = (await storage.get<Totals>(key)) ?? {};
      for (const [field, n] of Object.entries(cmd.fields)) if (n) totals[field] = (totals[field] ?? 0) + n;
      await storage.put(key, totals);
      return {};
    }
    case 'read': {
      const out: Record<string, DayTotals> = {};
      for (const day of cmd.days) {
        for (const group of ['bot', 'web'] as const) {
          const totals = await storage.get<Totals>(statsKey(group, day));
          if (totals) (out[day] ??= {})[group] = totals;
        }
      }
      return out;
    }
  }
}

// Borra los usos de días anteriores (tienen ids e IPs) y los totales de hace más de 400 días.
export async function cleanupCounters(storage: CounterStorage, now: number): Promise<number> {
  const today = dayOf(now);
  const oldest = dayOf(now - STATS_DAYS * 86_400_000);
  const stale: string[] = [];
  for (const prefix of ['u:', 'ip:']) stale.push(...(await storage.list({ prefix, end: `${prefix}${today}` })).keys());
  for (const key of (await storage.list({ prefix: 'st:' })).keys()) if (key.slice(-10) < oldest) stale.push(key);
  // delete() acepta hasta 128 claves por vez.
  for (let i = 0; i < stale.length; i += 128) await storage.delete(stale.slice(i, i + 128));
  return stale.length;
}

// Almacenamiento en memoria con la misma forma: para las pruebas y para desarrollo.
export class MemoryCounterStorage implements CounterStorage {
  readonly data = new Map<string, unknown>();
  async get<T>(key: string) {
    return this.data.get(key) as T | undefined;
  }
  async put(key: string, value: unknown) {
    this.data.set(key, structuredClone(value));
  }
  async delete(keys: string[]) {
    let n = 0;
    for (const k of keys) if (this.data.delete(k)) n++;
    return n;
  }
  async list<T>({ prefix, end }: { prefix: string; end?: string }) {
    const keys = [...this.data.keys()].filter((k) => k.startsWith(prefix) && (end === undefined || k < end)).sort();
    return new Map(keys.map((k) => [k, this.data.get(k) as T]));
  }
}

// Contadores que llaman a runCounter con cualquier transporte (el Durable Object o la memoria).
// Si el transporte falla, se registra y la revisión sigue.
export function createCounters(call: (cmd: CounterCommand) => Promise<unknown>, log: (m: string) => void = () => {}): Counters {
  const fail = (err: unknown) => log(`contadores: ${(err as Error).message ?? err}`);
  return {
    async take(key, limit) {
      try {
        return (await call({ op: 'take', key, limit })) as { ok: boolean; used: number };
      } catch (err) {
        fail(err);
        return { ok: true, used: 0 };
      }
    },
    async add(day, group, fields) {
      try {
        await call({ op: 'add', day, group, fields });
      } catch (err) {
        fail(err);
      }
    },
    async read(days) {
      try {
        return (await call({ op: 'read', days })) as Record<string, DayTotals>;
      } catch (err) {
        fail(err);
        return {};
      }
    },
  };
}

export function memoryCounters(storage = new MemoryCounterStorage()): Counters {
  return createCounters((cmd) => runCounter(storage, cmd));
}
