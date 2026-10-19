import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import worker, { type Env } from '../src/servidor/worker';
import { GUIDES } from '../src/web/guias';
import { guidePath } from '../src/web/plantilla';

const ROOT = join(import.meta.dirname, '..');
const PUBLIC = join(ROOT, 'public');
const read = (p: string) => readFileSync(join(PUBLIC, p.endsWith('/') ? `${p}index.html` : p), 'utf8');
const words = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

beforeAll(() => {
  execFileSync('npx', ['tsx', 'scripts/generar-web.ts'], { cwd: ROOT, stdio: 'pipe' });
});

describe('web generada', () => {
  it('cada guía existe en los dos idiomas, con título, descripción, canónica y la otra versión', () => {
    for (const g of GUIDES) {
      for (const lang of ['es', 'it'] as const) {
        const html = read(guidePath(g, lang).slice(1));
        expect(html).toContain(`<html lang="${lang}">`);
        expect(html).toMatch(/<title>[^<]{20,}<\/title>/);
        expect(html).toMatch(/<meta name="description" content="[^"]{60,}">/);
        expect(html).toContain(`rel="canonical" href="https://`);
        const other = lang === 'es' ? 'it' : 'es';
        expect(html).toContain(`hreflang="${other}" href="https://guardian-familiar.briaan-b.workers.dev${guidePath(g, other)}"`);
        expect(html).toContain('<h1>');
        expect(html).toContain('<blockquote>');
        expect(html).toContain('https://wa.me/?text=');
        expect(words(html), `${g.id} ${lang}`).toBeGreaterThan(350);
        expect(html).not.toMatch(/undefined|\[object Object\]/);
      }
    }
  });

  it('el inicio tiene el verificador y la lista de guías', () => {
    for (const lang of ['es', 'it'] as const) {
      const html = read(`${lang}/`);
      expect(html).toContain('data-checker');
      expect(html).toContain('data-levels=');
      for (const g of GUIDES) expect(html).toContain(guidePath(g, lang));
    }
  });

  it('el manifiesto permite instalar la app y recibir lo que se comparte', () => {
    for (const lang of ['es', 'it'] as const) {
      const m = JSON.parse(read(`${lang}/manifest.webmanifest`));
      expect(m.share_target.action).toBe(`/${lang}/compartir`);
      expect(m.share_target.method).toBe('POST');
      expect(m.icons.length).toBeGreaterThanOrEqual(2);
      for (const icon of m.icons) expect(existsSync(join(PUBLIC, icon.src))).toBe(true);
    }
  });

  it('el sitemap lista todas las páginas', () => {
    const sitemap = read('sitemap.xml');
    for (const g of GUIDES) {
      expect(sitemap).toContain(guidePath(g, 'es'));
      expect(sitemap).toContain(guidePath(g, 'it'));
    }
    expect(read('robots.txt')).toContain('Sitemap: https://');
  });
});

function memoryKv() {
  const data = new Map<string, string>();
  return {
    data,
    get: async (k: string, type?: string) => (data.has(k) ? (type === 'json' ? JSON.parse(data.get(k)!) : data.get(k)) : null),
    put: async (k: string, v: string) => void data.set(k, v),
    delete: async (k: string) => void data.delete(k),
    list: async () => ({ keys: [], list_complete: true }),
  };
}

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;
const SCAM = 'Hola ma, se me rompió el celu, este es mi número nuevo. Necesito que me transfieras hoy, es urgente';

describe('rutas web del Worker', () => {
  it('lo que llega por «Compartir» devuelve una página con el resultado y cuenta la revisión', async () => {
    const kv = memoryKv();
    const env = { GUARDIAN_KV: kv } as unknown as Env;
    const form = new FormData();
    form.set('text', SCAM);
    const res = await worker.fetch(new Request('https://w.dev/es/compartir', { method: 'POST', body: form }), env, ctx);
    const html = await res.text();
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('<p class="pill alto">Riesgo alto</p>');
    expect(html).toContain('No transfiera nada');
    expect(html).toContain('https://wa.me/?text=');
    expect(html).toContain('noindex');
    const stats = JSON.parse([...kv.data.entries()].find(([k]) => k.startsWith('stw:'))![1]);
    expect(stats).toMatchObject({ revisiones: 1, alto: 1, desde_compartir: 1 });
    // El texto revisado no queda guardado.
    expect([...kv.data.values()].join(' ')).not.toContain('transfieras');
  });

  it('la API devuelve la etiqueta del patrón para el aviso a la familia', async () => {
    const env = { GUARDIAN_KV: memoryKv() } as unknown as Env;
    const res = await worker.fetch(
      new Request('https://w.dev/api/analizar', { method: 'POST', body: JSON.stringify({ texto: SCAM, idioma: 'es' }) }),
      env,
      ctx,
    );
    const data = (await res.json()) as { nivel: string; etiqueta: string };
    expect(data.nivel).toBe('alto');
    expect(data.etiqueta).toBe('falso familiar con número nuevo');
  });

  it('una imagen sin IA pide el texto, y una imagen enorme se rechaza', async () => {
    const env = { GUARDIAN_KV: memoryKv() } as unknown as Env;
    const small = await worker.fetch(
      new Request('https://w.dev/api/analizar', { method: 'POST', body: JSON.stringify({ imagen: { tipo: 'image/jpeg', base64: 'AAAA' }, idioma: 'it' }) }),
      env,
      ctx,
    );
    expect(((await small.json()) as { respuesta: string }).respuesta).toContain("Non sono riuscito a leggere l'immagine");
    const big = await worker.fetch(
      new Request('https://w.dev/api/analizar', { method: 'POST', body: JSON.stringify({ imagen: { tipo: 'image/jpeg', base64: 'A'.repeat(5_000_000) } }) }),
      env,
      ctx,
    );
    expect(big.status).toBe(413);
  });

  it('cuenta los avisos a la familia y rechaza eventos desconocidos', async () => {
    const kv = memoryKv();
    const env = { GUARDIAN_KV: kv } as unknown as Env;
    const ok = await worker.fetch(new Request('https://w.dev/api/evento', { method: 'POST', body: JSON.stringify({ tipo: 'compartir' }) }), env, ctx);
    expect(ok.status).toBe(204);
    const bad = await worker.fetch(new Request('https://w.dev/api/evento', { method: 'POST', body: JSON.stringify({ tipo: 'otro' }) }), env, ctx);
    expect(bad.status).toBe(400);
    expect(JSON.parse([...kv.data.values()][0]!)).toMatchObject({ aviso_familia: 1 });
  });
});
