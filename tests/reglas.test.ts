import { describe, expect, it } from 'vitest';
import { extractLinks } from '../src/motor/enlaces';
import { detectLang, normalize } from '../src/motor/normalizar';
import { detectSignals, evaluateRules } from '../src/motor/reglas';
import { maxLevel, type Level } from '../src/motor/tipos';

function run(text: string) {
  const norm = normalize(text);
  const lang = detectLang(norm);
  const signals = detectSignals(norm, lang, extractLinks(text));
  const findings = evaluateRules(signals);
  const level = findings.reduce<Level>((acc, f) => maxLevel(acc, f.level), 'sin_senales');
  return { signals: signals.ids, findings, level, patterns: findings.map((f) => f.pattern) };
}

describe('normalización e idioma', () => {
  it('quita acentos y espacios de más', () => {
    expect(normalize('  Mamá,   ¿me PASÁS  plata?')).toBe('mama, ¿me pasas plata?');
  });
  it('detecta italiano y español', () => {
    expect(detectLang(normalize('Ciao mamma, il mio telefono è rotto, questo è il mio numero'))).toBe('it');
    expect(detectLang(normalize('Hola mamá, se me rompió el celu, este es mi número nuevo'))).toBe('es');
  });
});

describe('señales', () => {
  it('«ma» en italiano no es trato familiar', () => {
    expect(run('Sono arrivata, ma il treno era in ritardo').signals.has('trato_familiar')).toBe(false);
    expect(run('Ma, ya llegué a casa').signals.has('trato_familiar')).toBe(true);
  });

  it('«llame al número de su tarjeta» no cuenta como llamar a un número del estafador', () => {
    const r = run('Santander: compra de 12,90 EUR. Si no la reconoces, llama al número de la parte trasera de tu tarjeta.');
    expect(r.signals.has('llamar_numero')).toBe(false);
    expect(r.level).not.toBe('alto');
  });

  it('una invitación a un enlace oficial no es sospechosa', () => {
    const r = run('Correos: tu envío está en reparto. Consulta el seguimiento en este enlace: https://www.correos.es/seguimiento');
    expect(r.signals.has('cta_texto')).toBe(true);
    expect(r.signals.has('cta_enlace')).toBe(false);
    expect(r.level).not.toBe('alto');
  });

  it('«Subito» como adverbio no es la web de anuncios', () => {
    expect(run('Lo verifichi subito').signals.has('cobrar_venta')).toBe(false);
  });

  it('montos chicos con el símbolo después', () => {
    expect(run('debe pagar 1,64 € de tasas').signals.has('cargo_pequeno')).toBe(true);
    expect(run('paga 1,99€ di spese').signals.has('cargo_pequeno')).toBe(true);
    expect(run('pagó 21,64 € de luz').signals.has('cargo_pequeno')).toBe(false);
  });
});

describe('combinaciones: estafas', () => {
  const cases: [string, string, string][] = [
    ['Ciao mamma, ho cambiato numero, salva questo. Mi serve un bonifico urgente', 'alto', 'familiar_numero_nuevo'],
    ['Hola ma, se me rompió el celu, agendá este número nuevo. Necesito que me transfieras hoy', 'alto', 'familiar_numero_nuevo'],
    ['Signora, sono il maresciallo dei carabinieri: suo figlio ha avuto un incidente, servono soldi per l’avvocato', 'alto', 'falso_agente'],
    ['Señora, la llamo del banco. Le mandamos un cadete a su casa para retirar los dólares de la serie vieja', 'alto', 'retiro_domicilio'],
    ['Para proteger su dinero debe pasarlo a una cuenta segura que le indicamos', 'alto', 'cuenta_segura'],
    ['Hola, te mandé un código por error, ¿me lo podés reenviar? Es de 6 dígitos', 'alto', 'codigo_verificacion'],
    ['Intesa Sanpaolo: accesso anomalo sul tuo conto, verifica i tuoi dati al seguente link https://intesa-verifica.top', 'alto', 'banco_falso'],
    ['Su cuenta será bloqueada hoy. Para evitarlo, valide sus datos en el siguiente enlace', 'alto', 'banco_falso'],
    ['Abbiamo rilevato un’anomalia sul tuo conto. Per sbloccarlo accedi al seguente link', 'alto', 'banco_falso'],
    ['Correos: su paquete está retenido. Pague 1,79 € de gastos de envío aquí: correos-envio.info/p', 'alto', 'paquete_falso'],
    ['Telepass: pedaggio non pagato. Regolarizza entro 24 ore: telepass-pagamenti.com', 'alto', 'multa_impuesto_falso'],
    ['ANSES: cobrá el bono de $70.000. Registrate en este link', 'alto', 'ayuda_publica_falsa'],
    ['Mercadona está regalando cupones de 500 € por su aniversario', 'alto', 'premio_falso'],
    ['Te pagamos por dar me gusta a videos de YouTube, 20 euros al día', 'alto', 'trabajo_falso'],
    ['Uy, me equivoqué y te transferí de más. ¿Me devolvés la diferencia?', 'alto', 'compraventa_falsa'],
    ['Con solo 250 euros puedes ganar hasta 3000 euros al mes, rendimiento garantizado', 'alto', 'inversion_falsa'],
    ['Le llamo del soporte técnico de Microsoft: tiene un virus, descargue la aplicación AnyDesk', 'alto', 'soporte_tecnico_falso'],
    ['Votate per mia nipote in questo concorso, basta un click: [link]', 'alto', 'votacion_falsa'],
  ];
  for (const [text, level, pattern] of cases) {
    it(`${pattern}: ${text.slice(0, 50)}…`, () => {
      const r = run(text);
      expect(r.level).toBe(level);
      expect(r.patterns).toContain(pattern);
    });
  }
});

describe('combinaciones: mensajes reales que no deben alarmar', () => {
  const cases: [string, Level][] = [
    ['Il codice di sicurezza per accedere a BancoPosta è 482913. Non comunicarlo a nessuno.', 'medio'],
    ['BBVA: Tu código para confirmar la operación es 591204. No lo compartas con nadie.', 'medio'],
    ['Mamá, ¿me puedes hacer un Bizum de 15 € para el regalo de la profe?', 'medio'],
    ['Enel Energia: la bolletta di ottobre è stata emessa e sarà addebitata sul tuo conto. Nessuna azione richiesta.', 'medio'],
    ['Hola, ¿sigue disponible la bici que publicaste en Marketplace?', 'medio'],
    ['Ci vediamo alle 18 al bar sotto casa?', 'sin_senales'],
    ['Avviso ai condomini: domani l’ascensore resterà bloccato e l’acqua sarà sospesa dalle 9 alle 12 per lavori.', 'sin_senales'],
    ['Vecinos: el portón quedó bloqueado, el cerrajero viene a la tarde.', 'sin_senales'],
    ['Ma, te mandé la plata al alias que me pasaste, fijate si te llegó.', 'sin_senales'],
    ['Pago in contanti quando ci vediamo sabato, va bene?', 'sin_senales'],
  ];
  for (const [text, maxOk] of cases) {
    it(text.slice(0, 60), () => {
      const order = { sin_senales: 0, medio: 1, alto: 2 } as const;
      expect(order[run(text).level]).toBeLessThanOrEqual(order[maxOk]);
    });
  }
});
