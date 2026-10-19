import { describe, expect, it } from 'vitest';
import { cleanupCounters, counterKeys, MemoryCounterStorage, memoryCounters } from '../src/bot/contadores';
import { fakeCounters } from './ayuda';
import { durableCounters } from '../src/servidor/contadores';

describe('contadores', () => {
  it('cuenta hasta el límite y no más', async () => {
    const c = memoryCounters();
    const key = counterKeys.user('2026-10-19', { channel: 'whatsapp', id: '39333' });
    expect(key).toBe('u:2026-10-19:wa:39333');
    expect(await c.take(key, 2)).toEqual({ ok: true, used: 1 });
    expect(await c.take(key, 2)).toEqual({ ok: true, used: 2 });
    expect(await c.take(key, 2)).toEqual({ ok: false, used: 2 });
  });

  it('no pierde cuentas cuando llegan muchas juntas', async () => {
    const { ns, storage } = fakeCounters();
    const c = durableCounters(ns, () => {});
    await Promise.all(Array.from({ length: 50 }, () => c.add('2026-10-19', 'bot', { revisiones: 1, alto: 1, medio: 0 })));
    expect(storage.data.get('st:bot:2026-10-19')).toEqual({ revisiones: 50, alto: 50 });
    expect(await c.read(['2026-10-19', '2026-10-18'])).toEqual({ '2026-10-19': { bot: { revisiones: 50, alto: 50 } } });
  });

  it('cada noche borra los usos de días anteriores y los totales de hace más de 400 días', async () => {
    const storage = new MemoryCounterStorage();
    for (const k of ['u:2026-10-18:1', 'u:2026-10-19:1', 'ip:2026-10-18:1.2.3.4', 'st:bot:2025-01-01', 'st:web:2026-10-18']) await storage.put(k, 1);
    expect(await cleanupCounters(storage, Date.parse('2026-10-19T00:05:00Z'))).toBe(3);
    expect([...storage.data.keys()].sort()).toEqual(['st:web:2026-10-18', 'u:2026-10-19:1']);
  });

  it('el Durable Object programa la limpieza para la noche siguiente', async () => {
    const { ns, storage } = fakeCounters();
    await durableCounters(ns, () => {}).take('u:2026-10-19:1', 30);
    expect(storage.alarm).toBeGreaterThan(Date.now());
    expect(new Date(storage.alarm!).toISOString().slice(11)).toBe('00:05:00.000Z');
  });
});
