// Ayudas para las pruebas: el Durable Object de los contadores con almacenamiento en memoria.
import { MemoryCounterStorage } from '../src/bot/contadores';
import { Contadores, type CounterNamespace } from '../src/servidor/contadores';

export function fakeCounters() {
  const storage = Object.assign(new MemoryCounterStorage(), {
    alarm: null as number | null,
    async getAlarm() {
      return this.alarm;
    },
    async setAlarm(t: number) {
      this.alarm = t;
    },
  });
  const object = new Contadores({ storage });
  const ns: CounterNamespace = {
    idFromName: () => 'global',
    get: () => ({ fetch: (input: string, init?: RequestInit) => object.fetch(new Request(input, init)) }),
  };
  return { storage, object, ns };
}
