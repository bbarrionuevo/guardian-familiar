// Durable Object con los contadores (la lógica está en src/bot/contadores.ts). Hay uno solo para
// todo el sitio y atiende los pedidos de a uno. Cada noche (UTC) una alarma borra los usos del día
// anterior, que tienen ids e IPs.

import { cleanupCounters, createCounters, dayOf, runCounter, type CounterCommand, type CounterStorage, type Counters } from '../bot/contadores';

interface State {
  storage: CounterStorage & { getAlarm(): Promise<number | null>; setAlarm(time: number): Promise<void> };
}

const nextCleanup = (now: number) => Date.parse(`${dayOf(now)}T00:05:00Z`) + 86_400_000;

export class Contadores {
  // Cola de pedidos: cada uno lee y escribe entero antes del siguiente, así ninguna suma se pisa
  // (sin depender de cómo Cloudflare intercala los pedidos).
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private state: State) {}

  async fetch(request: Request): Promise<Response> {
    const cmd = (await request.json()) as CounterCommand;
    const run = this.queue.then(() => runCounter(this.state.storage, cmd));
    this.queue = run.catch(() => {});
    const result = await run;
    if ((await this.state.storage.getAlarm()) === null) await this.state.storage.setAlarm(nextCleanup(Date.now()));
    return Response.json(result);
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    await cleanupCounters(this.state.storage, now);
    await this.state.storage.setAlarm(nextCleanup(now));
  }
}

// Lo que necesita el Worker del espacio de Durable Objects.
export interface CounterNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(input: string, init?: RequestInit): Promise<Response> };
}

export function durableCounters(ns: CounterNamespace, log: (m: string) => void): Counters {
  return createCounters(async (cmd) => {
    const res = await ns.get(ns.idFromName('global')).fetch('https://contadores/', { method: 'POST', body: JSON.stringify(cmd) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, log);
}
