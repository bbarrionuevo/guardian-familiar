import { describe, expect, it } from 'vitest';
import { telegramHeaderSecret } from '../src/servidor/secreto';
import worker, { type Env } from '../src/servidor/worker';
import { fakeCounters } from './ayuda';

const env = {
  GUARDIAN_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [], list_complete: true }) },
  BOT_TOKEN: 'x',
  TELEGRAM_SECRET: 'Una contraseña con símbolos !@#$%',
  BOT_USERNAME: 'GuardianBot',
} as unknown as Env;

const ctx = () => {
  const pending: Promise<unknown>[] = [];
  return { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException: () => {}, pending } as unknown as ExecutionContext & { pending: Promise<unknown>[] };
};

describe('worker', () => {
  it('la cabecera secreta es el SHA-256 en hexadecimal', async () => {
    expect(await telegramHeaderSecret('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('rechaza el webhook sin la cabecera correcta y acepta la buena', async () => {
    const body = JSON.stringify({ update_id: 1 });
    const bad = await worker.fetch(new Request('https://w.dev/telegram/webhook', { method: 'POST', body, headers: { 'x-telegram-bot-api-secret-token': env.TELEGRAM_SECRET } }), env, ctx());
    expect(bad.status).toBe(403);

    const c = ctx();
    const header = await telegramHeaderSecret(env.TELEGRAM_SECRET);
    const good = await worker.fetch(new Request('https://w.dev/telegram/webhook', { method: 'POST', body, headers: { 'x-telegram-bot-api-secret-token': header } }), env, c);
    expect(good.status).toBe(200);
    await Promise.all(c.pending);
  });

  it('la API web responde solo con reglas si no hay clave de IA', async () => {
    const res = await worker.fetch(
      new Request('https://w.dev/api/analizar', { method: 'POST', body: JSON.stringify({ texto: 'Hola ma, cambié de número, agendá este. Necesito que me transfieras hoy', idioma: 'es-AR' }) }),
      env,
      ctx(),
    );
    const data = (await res.json()) as { nivel: string; respuesta: string };
    expect(data.nivel).toBe('alto');
    expect(data.respuesta).toContain('RIESGO ALTO');
  });

  it('las métricas piden clave', async () => {
    const res = await worker.fetch(new Request('https://w.dev/api/metricas?clave=x'), env, ctx());
    expect(res.status).toBe(403);
  });

  it('el control diario pide la clave y no cuenta como revisión', async () => {
    const counters = fakeCounters();
    const e = { ...env, METRICAS_CLAVE: 'clave', CONTADORES: counters.ns } as unknown as Env;
    const denied = await worker.fetch(new Request('https://w.dev/api/control?clave=otra'), e, ctx());
    expect(denied.status).toBe(403);
    const res = await worker.fetch(new Request('https://w.dev/api/control?clave=clave'), e, ctx());
    expect(await res.json()).toEqual({ reglas: 'alto', ia: 'sin clave', contadores: 'ok' });
    expect([...counters.storage.data.keys()]).toEqual([]);
  });
});
