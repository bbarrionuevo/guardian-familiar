// Controla el banco de mensajes y que las reglas no empeoren sobre él.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../src/motor/analizar';
import { LEVEL_RANK, type Level } from '../src/motor/tipos';

const DIR = join(import.meta.dirname, '..', 'data', 'banco');
const files = readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));
interface Row {
  file: string;
  id: string;
  lang: string;
  text: string;
  source_url?: string;
  max_ok?: Level;
}
const rows: Row[] = files.flatMap((f) =>
  readFileSync(join(DIR, f), 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => ({ file: f, ...(JSON.parse(l) as Omit<Row, 'file'>) })),
);

describe('banco de mensajes', () => {
  it('tiene ids únicos y los campos obligatorios', () => {
    const ids = rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of rows) {
      expect(['it', 'es']).toContain(r.lang);
      expect(typeof r.text).toBe('string');
      if (r.file.startsWith('estafas')) expect(r.source_url).toMatch(/^https:\/\//);
      else expect(['sin_senales', 'medio']).toContain(r.max_ok);
    }
  });

  it('no publica teléfonos sin enmascarar', () => {
    for (const r of rows) expect(r.text).not.toMatch(/\+\d{2}\s?\d{6,}|\b\d{3}[ .-]?\d{3}[ .-]?\d{4}\b/);
  });

  it('solo con reglas: ningún legítimo pasa su nivel máximo y casi todas las estafas dan alto', async () => {
    let scams = 0;
    let high = 0;
    for (const r of rows) {
      const v = await analyze({ text: r.text, langHint: r.lang });
      if (r.file.startsWith('estafas')) {
        scams++;
        if (v.level === 'alto') high++;
      } else {
        expect(LEVEL_RANK[v.level], `${r.id} dio ${v.level}`).toBeLessThanOrEqual(LEVEL_RANK[r.max_ok ?? 'sin_senales']);
      }
    }
    // Piso de regresión, no meta: las reglas se ajustaron mirando este banco.
    expect(high / scams).toBeGreaterThanOrEqual(0.85);
  });
});
