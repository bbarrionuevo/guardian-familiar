import { describe, expect, it } from 'vitest';
import { extractLinks, isSuspicious, registrableDomain } from '../src/motor/enlaces';

describe('registrableDomain', () => {
  it('respeta los sufijos de dos niveles', () => {
    expect(registrableDomain('www.anses.gob.ar')).toBe('anses.gob.ar');
    expect(registrableDomain('vas.brt.it')).toBe('brt.it');
    expect(registrableDomain('a.b.mercadopago.com.ar')).toBe('mercadopago.com.ar');
  });
});

describe('extractLinks', () => {
  it('reconoce el dominio oficial', () => {
    const [link] = extractLinks('Segui la spedizione su https://vas.brt.it/tracking');
    expect(link?.official).toBe(true);
    expect(isSuspicious(link!)).toBe(false);
  });

  it('marca la imitación de una marca con palabra cebo', () => {
    const [link] = extractLinks('Poste: pacco in giacenza, paga su poste-it-consegna.top/ok');
    expect(link?.official).toBe(false);
    expect(link?.flags).toEqual(expect.arrayContaining(['imita_marca', 'dominio_raro', 'palabra_cebo']));
    expect(isSuspicious(link!)).toBe(true);
  });

  it('marca acortadores', () => {
    const [link] = extractLinks('Mirá esto bit.ly/abc123');
    expect(link?.flags).toContain('acortador');
    expect(isSuspicious(link!)).toBe(true);
  });

  it('reactiva enlaces desactivados', () => {
    const [link] = extractLinks('entra in hxxps://intesa-sicurezza[.]com/login');
    expect(link?.domain).toBe('intesa-sicurezza.com');
    expect(link?.flags).toContain('imita_marca');
  });

  it('no confunde un correo o una palabra con punto con un enlace', () => {
    expect(extractLinks('Escribime a juan@gmail.com')).toEqual([]);
    expect(extractLinks('Llego a las 9.30 y después vemos.')).toEqual([]);
  });

  it('las direcciones institucionales cuentan como oficiales', () => {
    const [link] = extractLinks('Info su https://www.comune.roma.gov.it/servizi');
    expect(link?.official).toBe(true);
  });
});
