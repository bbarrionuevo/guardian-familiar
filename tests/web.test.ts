import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import worker, { type Env } from '../src/servidor/worker';
import { GUIDES } from '../src/web/guias';
import { siteConfig } from '../src/web/config';
import { guidePath, privacyPage } from '../src/web/plantilla';
import { fakeCounters } from './ayuda';

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
        expect(html).toContain(`hreflang="${other}" href="https://pausa.family${guidePath(g, other)}"`);
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

  it('todas las páginas llevan el nombre Pausa y ninguna el anterior', () => {
    const pages = (readdirSync(PUBLIC, { recursive: true }) as string[]).filter((f) => f.endsWith('.html') || f.endsWith('.webmanifest'));
    expect(pages.length).toBeGreaterThan(20);
    for (const f of pages) expect(read(f), f).not.toMatch(/Guardi[aá]n|Guardiano/);
    expect(read('es/')).toContain('<title>¿Es una estafa este mensaje? Revíselo gratis · Pausa</title>');
    expect(read('it/')).toContain('<meta property="og:site_name" content="Pausa">');
    expect(JSON.parse(read('it/manifest.webmanifest')).name).toBe('Pausa');
  });

  it('la página para la familia tiene el formulario con etiquetas, la prueba y el verificador', () => {
    for (const [lang, path, other] of [['es', 'es/familia/', '/it/famiglia/'], ['it', 'it/famiglia/', '/es/familia/']] as const) {
      const html = read(path);
      expect(html).toContain('<label for="familiar-nombre">');
      expect(html).toContain('<label for="familiar-telefono">');
      expect(html).toContain('type="tel"');
      expect(html).toContain('data-fill=');
      expect(html).toContain('data-checker');
      expect(html).toContain('class="install-btn"');
      expect(html).toContain(`hreflang="${lang === 'es' ? 'it' : 'es'}" href="https://pausa.family${other}"`);
      expect(words(html)).toBeGreaterThan(350);
      // Se llega desde el inicio y desde el menú de todas las páginas.
      expect(read(`${lang}/`)).toContain(`href="/${path}"`);
    }
    expect(read('sitemap.xml')).toContain('/es/familia/');
  });

  it('cada verificador trae los botones para llamar al familiar guardado', () => {
    const html = read('es/');
    expect(html).toContain('class="family-actions" hidden');
    expect(html).toContain('data-call="Llamar a {name}"');
    expect(html).toContain('class="family-setup" hidden');
  });

  it('la página «ya pagué» tiene los pasos de cada país con sus fuentes oficiales y se enlaza desde todas', () => {
    const es = read('es/me-estafaron/');
    for (const x of ['017', '900 116 117', '062', '911', 'denunciasufeci@mpf.gov.ar', 'https://www.incibe.es/', 'https://www.mpf.gob.ar/ufeci/']) expect(es).toContain(x);
    const it = read('it/truffa-cosa-fare/');
    for (const x of ['href="tel:113"', 'commissariatodips.it', 'https://www.commissariatodips.it/']) expect(it).toContain(x);
    expect(it).not.toContain('017');
    // Los números se tocan para llamar.
    for (const x of ['href="tel:017"', 'href="tel:062"', 'href="tel:911"', 'href="tel:+541150710040"']) expect(es).toContain(x);
    expect(it).toContain('href="tel:112"');
    for (const g of GUIDES) expect(read(guidePath(g, 'es').slice(1))).toContain('href="/es/me-estafaron/"');
    expect(read('es/')).toContain('class="urgent-link" hidden');
    expect(read('sitemap.xml')).toContain('/it/truffa-cosa-fare/');
  });

  it('condiciones de uso y privacidad, con el responsable solo si está configurado', () => {
    expect(read('es/condiciones/')).toContain('no una garantía');
    expect(read('it/')).toContain('href="/it/condizioni/"');
    expect(read('es/privacidad/')).toContain('como máximo 30 días');
    expect(read('es/privacidad/')).not.toContain('Responsable de los datos');
    const html = privacyPage('it', siteConfig({ SITIO_RESPONSABLE: 'Pausa', SITIO_CONTACTO: 'ayuda@example.org' }));
    expect(html).toContain('Titolare del trattamento: Pausa');
    expect(html).toContain('href="mailto:ayuda@example.org"');
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
    const counters = fakeCounters();
    const env = { GUARDIAN_KV: kv, CONTADORES: counters.ns } as unknown as Env;
    const form = new FormData();
    form.set('text', SCAM);
    const res = await worker.fetch(new Request('https://w.dev/es/compartir', { method: 'POST', body: form }), env, ctx);
    const html = await res.text();
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('<p class="pill alto">Riesgo alto</p>');
    expect(html).toContain('No transfiera nada');
    expect(html).toContain('https://wa.me/?text=');
    expect(html).toContain('noindex');
    expect(html).toContain('class="family-actions" hidden data-level="alto" data-label="falso familiar con número nuevo"');
    expect(html).toContain('<p class="urgent-link"><a href="/es/me-estafaron/">');
    const day = new Date().toISOString().slice(0, 10);
    expect(counters.storage.data.get(`st:web:${day}`)).toMatchObject({ revisiones: 1, alto: 1, desde_compartir: 1 });
    // El texto revisado no queda guardado: ni en KV ni en los contadores.
    expect(kv.data.size).toBe(0);
    expect(JSON.stringify([...counters.storage.data])).not.toContain('transfieras');
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
    expect(((await small.json()) as { respuesta: string }).respuesta).toContain("Non riesco a leggere l'immagine");
    const big = await worker.fetch(
      new Request('https://w.dev/api/analizar', { method: 'POST', body: JSON.stringify({ imagen: { tipo: 'image/jpeg', base64: 'A'.repeat(5_000_000) } }) }),
      env,
      ctx,
    );
    expect(big.status).toBe(413);
  });

  it('cuenta los avisos a la familia y rechaza eventos desconocidos', async () => {
    const counters = fakeCounters();
    const env = { GUARDIAN_KV: memoryKv(), CONTADORES: counters.ns } as unknown as Env;
    const ok = await worker.fetch(new Request('https://w.dev/api/evento', { method: 'POST', body: JSON.stringify({ tipo: 'compartir' }) }), env, ctx);
    expect(ok.status).toBe(204);
    const bad = await worker.fetch(new Request('https://w.dev/api/evento', { method: 'POST', body: JSON.stringify({ tipo: 'otro' }) }), env, ctx);
    expect(bad.status).toBe(400);
    expect(counters.storage.data.get(`st:web:${new Date().toISOString().slice(0, 10)}`)).toEqual({ aviso_familia: 1 });
  });
});
