import { describe, expect, it } from 'vitest';
import redirect from '../redireccion/worker';

describe('dirección anterior', () => {
  it('manda cada página a la misma ruta en la dirección nueva', () => {
    const res = redirect.fetch(new Request('https://guardian-familiar.cuenta.workers.dev/es/estafas/x/?a=1'), {});
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://pausa.family/es/estafas/x/?a=1');
  });

  it('conserva el método de los envíos y respeta DESTINO', () => {
    const res = redirect.fetch(new Request('https://guardian-familiar.cuenta.workers.dev/es/compartir', { method: 'POST', body: 'x' }), {
      DESTINO: 'https://pausa.example/',
    });
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://pausa.example/es/compartir');
  });
});
