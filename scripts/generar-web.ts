// Genera la web estática en public/: inicio y guías en español e italiano, privacidad,
// manifiestos de la app instalable, sitemap y robots. La sirve el Worker como assets.
//   npx tsx scripts/generar-web.ts            (SITIO_URL y BOT_USERNAME opcionales)

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Lang } from '../src/motor/tipos';
import { siteConfig } from '../src/web/config';
import { GUIDES } from '../src/web/guias';
import {
  familyPage,
  familyPath,
  guidePage,
  guidePath,
  homePage,
  homePath,
  notFoundPage,
  privacyPage,
  privacyPath,
  urgentPage,
  urgentPath,
  type Example,
} from '../src/web/plantilla';
import { WEB } from '../src/web/textos-web';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const LANGS: Lang[] = ['es', 'it'];

interface BankRow {
  id: string;
  text: string;
  verbatim: boolean;
  source_url: string;
}

function loadBank(): Map<string, BankRow> {
  const dir = join(ROOT, 'data', 'banco');
  const rows = new Map<string, BankRow>();
  for (const file of readdirSync(dir).filter((f) => f.startsWith('estafas') && f.endsWith('.jsonl'))) {
    for (const line of readFileSync(join(dir, file), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const row = JSON.parse(line) as BankRow;
      rows.set(row.id, row);
    }
  }
  return rows;
}

// Nombre corto de la fuente a partir de la dirección: «incibe.es», «ilfattoquotidiano.it».
function sourceName(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

function write(path: string, content: string) {
  const file = join(OUT, path.endsWith('/') ? `${path}index.html` : path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function manifest(lang: Lang): string {
  const t = WEB[lang];
  return JSON.stringify(
    {
      id: `/${lang}/`,
      name: t.siteName,
      short_name: t.siteName,
      description: t.homeDescription,
      lang,
      start_url: `/${lang}/?app=1`,
      scope: `/${lang}/`,
      display: 'standalone',
      background_color: '#f2f6f7',
      theme_color: '#0f6a7a',
      icons: [
        { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      // «Compartir» desde WhatsApp u otra app manda el texto o la imagen a esta dirección.
      share_target: {
        action: `/${lang}/compartir`,
        method: 'POST',
        enctype: 'multipart/form-data',
        params: { title: 'title', text: 'text', url: 'url', files: [{ name: 'imagen', accept: ['image/*'] }] },
      },
    },
    null,
    2,
  );
}

function rootPage(siteUrl: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pausa</title>
<meta name="description" content="¿Es una estafa este mensaje? · È una truffa questo messaggio?">
<link rel="alternate" hreflang="es" href="${siteUrl}/es/">
<link rel="alternate" hreflang="it" href="${siteUrl}/it/">
<link rel="alternate" hreflang="x-default" href="${siteUrl}/">
<link rel="icon" href="/icono.svg" type="image/svg+xml">
<link rel="stylesheet" href="/estilos.css">
<script>
  (function () {
    var l = (navigator.languages && navigator.languages[0]) || navigator.language || 'es';
    location.replace(l.toLowerCase().indexOf('it') === 0 ? '/it/' : '/es/');
  })();
</script>
</head>
<body>
<main class="wrap">
  <h1>Pausa</h1>
  <div class="lang-pick">
    <a class="button-link" href="/es/" hreflang="es" lang="es">Español</a>
    <a class="button-link" href="/it/" hreflang="it" lang="it">Italiano</a>
  </div>
</main>
</body>
</html>
`;
}

function main() {
  const site = siteConfig(process.env);
  const bank = loadBank();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  cpSync(join(ROOT, 'web'), OUT, { recursive: true });

  const urls: string[] = ['/'];
  write('index.html', rootPage(site.url));
  write('404.html', notFoundPage('es', site));
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site.url}/sitemap.xml\n`);

  for (const lang of LANGS) {
    write(homePath(lang), homePage(lang, site));
    write(privacyPath(lang), privacyPage(lang, site));
    write(familyPath(lang), familyPage(lang, site));
    write(urgentPath(lang), urgentPage(lang, site));
    write(`${lang}/manifest.webmanifest`, manifest(lang));
    urls.push(homePath(lang), familyPath(lang), urgentPath(lang), privacyPath(lang));
    for (const g of GUIDES) {
      const examples: Example[] = g[lang].examples.map((id) => {
        const row = bank.get(id);
        if (!row) throw new Error(`La guía ${g.id} usa el ejemplo ${id}, que no está en el banco.`);
        return { text: row.text, sourceName: sourceName(row.source_url), sourceUrl: row.source_url, verbatim: row.verbatim };
      });
      write(guidePath(g, lang), guidePage(g, lang, examples, site));
      urls.push(guidePath(g, lang));
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${site.url}${u}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  console.log(`Web generada en public/: ${urls.length} páginas para ${site.url}`);
}

main();
