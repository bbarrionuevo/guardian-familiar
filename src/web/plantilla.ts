// HTML de la web. Lo usan el generador de páginas estáticas (scripts/generar-web.ts) y el Worker
// para la página de resultado de «Compartir». Funciones puras: no leen archivos.

import { URGENT, URGENT_TEXT, type Country } from '../bot/urgente';
import { patternLabel } from '../motor/respuestas';
import type { Lang, Level, Pattern } from '../motor/tipos';
import type { SiteConfig } from './config';
import { GUIDES, type Guide } from './guias';
import { WEB } from './textos-web';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const homePath = (lang: Lang) => `/${lang}/`;
export const guidesBase = (lang: Lang) => (lang === 'es' ? '/es/estafas/' : '/it/truffe/');
export const guidePath = (g: Guide, lang: Lang) => `${guidesBase(lang)}${g[lang].slug}/`;
export const privacyPath = (lang: Lang) => (lang === 'es' ? '/es/privacidad/' : '/it/privacy/');
export const familyPath = (lang: Lang) => (lang === 'es' ? '/es/familia/' : '/it/famiglia/');
export const urgentPath = (lang: Lang) => (lang === 'es' ? '/es/me-estafaron/' : '/it/truffa-cosa-fare/');

export interface Example {
  text: string;
  sourceName: string;
  sourceUrl: string;
  verbatim: boolean;
}

interface PageOptions {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  body: string;
  // Misma página en el otro idioma, para hreflang.
  altPath?: string;
  noindex?: boolean;
}

export function page(o: PageOptions, site: SiteConfig): string {
  const t = WEB[o.lang];
  const other: Lang = o.lang === 'es' ? 'it' : 'es';
  const alt = o.altPath ?? homePath(other);
  const hreflang = o.altPath
    ? `<link rel="alternate" hreflang="${o.lang}" href="${site.url}${o.path}">
<link rel="alternate" hreflang="${other}" href="${site.url}${o.altPath}">`
    : '';
  // El nombre va al final de cada título, para que se reconozca en Google y al compartir.
  const title = o.title.includes(t.siteName) ? o.title : `${o.title} · ${t.siteName}`;
  return `<!doctype html>
<html lang="${o.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.description)}">
${o.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${site.url}${o.path}">`}
${hreflang}
<meta property="og:title" content="${esc(title)}">
<meta property="og:site_name" content="${t.siteName}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${site.url}${o.path}">
<meta property="og:image" content="${site.url}/icono-512.png">
<meta name="theme-color" content="#0f6a7a">
<link rel="manifest" href="/${o.lang}/manifest.webmanifest">
<link rel="icon" href="/icono.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icono-192.png">
<link rel="stylesheet" href="/estilos.css">
<script src="/app.js" defer></script>
</head>
<body>
<a class="skip" href="#contenido">${o.lang === 'es' ? 'Ir al contenido' : 'Vai al contenuto'}</a>
<header class="top">
  <div class="wrap top-row">
    <a class="brand" href="${homePath(o.lang)}"><img src="/icono.svg" alt="" width="32" height="32"><span>${t.siteName}</span></a>
    <nav class="nav">
      <a href="${homePath(o.lang)}#revisar">${t.navCheck}</a>
      <a href="${homePath(o.lang)}#estafas">${t.navGuides}</a>
      <a href="${familyPath(o.lang)}">${t.family.nav}</a>
      <a href="${alt}" hreflang="${other}" lang="${other}">${t.otherLang}</a>
    </nav>
  </div>
</header>
<main id="contenido" class="wrap">
${o.body}
</main>
<footer class="foot">
  <div class="wrap">
    <p>${esc(t.footerNote)}</p>
    <p><a href="${urgentPath(o.lang)}">${esc(t.urgent.link)}</a></p>
    <p><a href="${privacyPath(o.lang)}">${t.privacyLink}</a> · <a href="https://t.me/${site.botUsername}">Telegram</a></p>
  </div>
</footer>
</body>
</html>
`;
}

// Formulario para revisar un mensaje. Lo maneja /app.js.
export function checker(lang: Lang, heading: string, hideHeading = false): string {
  const t = WEB[lang];
  return `<section class="checker-box" id="revisar" aria-labelledby="revisar-h">
  <h2 id="revisar-h"${hideHeading ? ' class="visually-hidden"' : ''}>${esc(heading)}</h2>
  <form class="checker" data-checker data-lang="${lang}" data-working="${esc(t.checkerWorking)}" data-error="${esc(t.checkerError)}" data-empty="${esc(t.checkerEmpty)}" data-chosen="${esc(t.checkerImageChosen)}" data-levels="${esc(JSON.stringify(t.levelNames))}" data-share="${esc(t.shareMessage('{label}', '{url}'))}">
    <label for="mensaje">${esc(t.checkerLabel)}</label>
    <textarea id="mensaje" name="texto" rows="6" maxlength="4000" placeholder="${esc(t.checkerPlaceholder)}"></textarea>
    <div class="checker-row">
      <label class="file-btn" for="captura">📷 ${esc(t.checkerImage)}</label>
      <input id="captura" class="file-input" type="file" name="imagen" accept="image/*">
      <span class="file-name" aria-live="polite"></span>
      <button type="submit">${esc(t.checkerButton)}</button>
    </div>
    <p class="checker-note">${esc(t.checkerNote)}</p>
  </form>
  <div class="result" hidden aria-live="polite">
    <p class="pill"></p>
    <div class="result-text"></div>
    ${familyActions(lang)}
    <a class="share-wa" hidden target="_blank" rel="noopener">${esc(t.shareFamily)}</a>
    <p class="urgent-link" hidden><a href="${urgentPath(lang)}">${esc(t.urgent.link)}</a></p>
  </div>
</section>`;
}

// Botones para llamar o escribirle al familiar guardado en el teléfono. Los completa /app.js con
// lo que hay en el teléfono; si no hay nadie guardado, muestra el enlace para guardarlo.
function familyActions(lang: Lang, level?: Level, label?: string): string {
  const f = WEB[lang].family;
  const known = level ? ` data-level="${level}" data-label="${esc(label ?? '')}"` : '';
  return `<div class="family-actions" hidden${known} data-lead="${esc(f.lead)}" data-call="${esc(f.call)}" data-whatsapp="${esc(f.whatsapp)}" data-message="${esc(f.message)}">
      <p class="family-lead"></p>
      <a class="call-btn" href="#"></a>
      <a class="wa-btn" href="#" target="_blank" rel="noopener"></a>
    </div>
    <p class="family-setup" hidden><a href="${familyPath(lang)}">${esc(f.setupLink)}</a></p>`;
}

function familyForm(lang: Lang): string {
  const f = WEB[lang].family;
  return `<form class="family-form" data-family data-saved="${esc(f.saved)}" data-cleared="${esc(f.cleared)}" data-invalid="${esc(f.invalid)}">
    <label for="familiar-nombre">${esc(f.nameLabel)}</label>
    <input id="familiar-nombre" name="nombre" type="text" maxlength="40" autocomplete="off" placeholder="${esc(f.namePlaceholder)}">
    <label for="familiar-telefono">${esc(f.phoneLabel)}</label>
    <input id="familiar-telefono" name="telefono" type="tel" inputmode="tel" maxlength="24" autocomplete="off" placeholder="${esc(f.phonePlaceholder)}" aria-describedby="familiar-ayuda">
    <p class="muted" id="familiar-ayuda">${esc(f.phoneHelp)}</p>
    <div class="checker-row">
      <button type="submit">${esc(f.save)}</button>
      <button type="button" class="secondary" data-clear>${esc(f.clear)}</button>
    </div>
    <p class="family-status" aria-live="polite"></p>
  </form>`;
}

export function shareFamilyUrl(lang: Lang, pattern: Pattern | null, site: SiteConfig): string {
  const label = patternLabel(pattern, lang);
  return `https://wa.me/?text=${encodeURIComponent(WEB[lang].shareMessage(label, `${site.url}${homePath(lang)}`))}`;
}

function list(items: string[]): string {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

export function homePage(lang: Lang, site: SiteConfig): string {
  const t = WEB[lang];
  const guides = GUIDES.map(
    (g) => `<li><a href="${guidePath(g, lang)}"><strong>${esc(g[lang].title)}</strong><span>${esc(g[lang].description)}</span></a></li>`,
  ).join('\n');
  const body = `<section class="hero">
  <h1>${esc(t.homeH1)}</h1>
  <p class="lead">${esc(t.homeLead)}</p>
</section>
${checker(lang, t.navCheck, true)}
<section class="card" aria-labelledby="familia-h">
  <h2 id="familia-h">${esc(t.family.cardH2)}</h2>
  <p>${esc(t.family.cardText)}</p>
  <p><a class="button-link" href="${familyPath(lang)}">${esc(t.family.cardButton)}</a></p>
</section>
<section class="card" aria-labelledby="instalar-h">
  <h2 id="instalar-h">${esc(t.installH2)}</h2>
  <ol class="steps">${t.installAndroid.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  <button type="button" class="install-btn" hidden>${esc(t.installButton)}</button>
  <p class="muted">${esc(t.installIphone)}</p>
</section>
<section class="guides" id="estafas" aria-labelledby="estafas-h">
  <h2 id="estafas-h">${esc(t.guidesH2)}</h2>
  <p>${esc(t.guidesLead)}</p>
  <ul class="guide-list">
${guides}
  </ul>
</section>
<section class="card" aria-labelledby="telegram-h">
  <h2 id="telegram-h">${esc(t.telegramH2)}</h2>
  <p>${esc(t.telegramText)}</p>
  <p><a class="button-link" href="https://t.me/${site.botUsername}">${esc(t.telegramButton)}</a></p>
</section>`;
  return page(
    { lang, path: homePath(lang), title: t.homeTitle, description: t.homeDescription, body, altPath: homePath(lang === 'es' ? 'it' : 'es') },
    site,
  );
}

export function guidePage(g: Guide, lang: Lang, examples: Example[], site: SiteConfig): string {
  const t = WEB[lang];
  const gt = g[lang];
  const other: Lang = lang === 'es' ? 'it' : 'es';
  const url = `${site.url}${guidePath(g, lang)}`;
  const share = `https://wa.me/?text=${encodeURIComponent(t.shareGuideMessage(gt.title, url))}`;
  const ex = examples
    .map(
      (e) => `<figure class="example">
  <blockquote>${esc(e.text)}</blockquote>
  <figcaption>${esc(e.verbatim ? t.guideExampleQuoted(e.sourceName) : t.guideExampleBased(e.sourceName))} · <a href="${esc(e.sourceUrl)}" rel="nofollow noopener" target="_blank">${esc(e.sourceName)}</a></figcaption>
</figure>`,
    )
    .join('\n');
  const body = `<article class="guide">
  <h1>${esc(gt.title)}</h1>
  ${gt.intro.map((p) => `<p>${esc(p)}</p>`).join('\n  ')}
  <p><a class="share-wa" href="${share}" target="_blank" rel="noopener">${esc(t.shareGuide)}</a></p>
  <h2>${esc(t.guideExamples)}</h2>
  ${ex}
  <h2>${esc(t.guideSignals)}</h2>
  ${list(gt.signals)}
  <h2>${esc(t.guideWhatToDo)}</h2>
  ${list(gt.whatToDo)}
  <h2>${esc(t.guideIfHappened)}</h2>
  ${list(gt.ifHappened)}
  <p><a href="${urgentPath(lang)}">${esc(t.urgent.link)}</a></p>
</article>
${checker(lang, t.guideCheckH2)}`;
  return page({ lang, path: guidePath(g, lang), title: gt.title, description: gt.description, body, altPath: guidePath(g, other) }, site);
}

// Página para que un hijo o una hija deje Pausa listo en el teléfono de sus padres.
export function familyPage(lang: Lang, site: SiteConfig): string {
  const t = WEB[lang];
  const f = t.family;
  const extras = {
    install: `<button type="button" class="install-btn" hidden>${esc(t.installButton)}</button>\n  <p class="muted">${esc(f.iphone)}</p>`,
    contact: familyForm(lang),
    test: `<p><button type="button" class="secondary" data-fill="${esc(f.testMessage)}">${esc(f.testButton)}</button></p>\n  ${checker(lang, t.navCheck, true)}`,
    telegram: `<p><a class="button-link" href="https://t.me/${site.botUsername}">${esc(t.telegramButton)}</a></p>`,
  };
  const steps = f.steps
    .map(
      (s) => `<section class="card">
  <h2>${esc(s.h2)}</h2>
  ${s.text.map((p) => `<p>${esc(p)}</p>`).join('\n  ')}
  ${s.extra ? extras[s.extra] : ''}
</section>`,
    )
    .join('\n');
  const body = `<section class="hero">
  <h1>${esc(f.title)}</h1>
  ${f.intro.map((p) => `<p class="lead">${esc(p)}</p>`).join('\n  ')}
</section>
${steps}`;
  return page({ lang, path: familyPath(lang), title: f.title, description: f.description, body, altPath: familyPath(lang === 'es' ? 'it' : 'es') }, site);
}

// «Me estafaron»: qué hacer si ya pagó o dio sus datos, por país, con las fuentes oficiales.
export function urgentPage(lang: Lang, site: SiteConfig): string {
  const t = WEB[lang];
  const u = URGENT_TEXT[lang];
  const countries: Country[] = lang === 'it' ? ['it'] : ['es', 'ar'];
  const sections = countries
    .map((c) => {
      const h = URGENT[c];
      // Los números y direcciones se pueden tocar para llamar o escribir.
      const linked = (text: string) =>
        h.links.reduce((html, [label, href]) => html.replace(esc(label), `<a href="${esc(href)}">${esc(label)}</a>`), esc(text));
      return `<section class="card">
  <h2>${h.flag} ${esc(h.name)}</h2>
  <ol class="steps">${h.steps.map((s) => `<li>${linked(s)}</li>`).join('')}</ol>
  <p class="urgent-now">🚨 ${linked(h.emergency)}</p>
</section>`;
    })
    .join('\n');
  const sources = countries.flatMap((c) => URGENT[c].sources);
  const body = `<section class="hero">
  <h1>${esc(t.urgent.title)}</h1>
  <p class="lead">${esc(t.urgent.intro)}</p>
</section>
${sections}
<section class="guide">
  ${u.closing.map((p) => `<p>${esc(p)}</p>`).join('\n  ')}
  <h2>${esc(t.urgent.sourcesH2)}</h2>
  <ul>${sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.name)}</a></li>`).join('')}</ul>
  <p><a class="button-link" href="${homePath(lang)}">${esc(t.navCheck)}</a></p>
</section>`;
  return page({ lang, path: urgentPath(lang), title: t.urgent.title, description: t.urgent.description, body, altPath: urgentPath(lang === 'es' ? 'it' : 'es') }, site);
}

const PRIVACY: Record<Lang, { title: string; description: string; paragraphs: string[] }> = {
  es: {
    title: 'Privacidad',
    description: 'Qué hace Pausa con los mensajes que revisa: no los guarda, los analiza y los descarta.',
    paragraphs: [
      'Pausa revisa los mensajes que usted pega, sube o comparte para decirle si tienen señales de estafa. No los guarda: se analizan en el momento y se descartan.',
      'Para revisarlos usamos reglas propias y, cuando hace falta, la inteligencia artificial de Anthropic (Claude). El texto o la imagen se envían a Anthropic solo para esa revisión. Según sus condiciones para empresas, Anthropic no usa estos datos para entrenar su IA.',
      'La web y el bot funcionan sobre Cloudflare. Para evitar abusos contamos cuántas revisiones se hacen por día desde cada conexión; ese contador se borra cada noche. También guardamos totales por día (cuántas revisiones y de qué nivel), sin el contenido.',
      'En el bot guardamos solo su idioma, su nombre (en WhatsApp, también su número) y, si usted lo pide, con qué familiar está vinculado. Con /desvincular se borran los vínculos y con /borrar, todos sus datos. Si no usa Pausa durante 13 meses, sus datos se borran solos.',
      'No usamos cookies de publicidad ni de seguimiento.',
    ],
  },
  it: {
    title: 'Privacy',
    description: 'Cosa fa Pausa con i messaggi che controlla: non li conserva, li analizza e li scarta.',
    paragraphs: [
      'Pausa controlla i messaggi che incolli, carichi o condividi per dirti se hanno segnali di truffa. Non li conserva: vengono analizzati al momento e poi scartati.',
      'Per controllarli usiamo regole nostre e, quando serve, l’intelligenza artificiale di Anthropic (Claude). Il testo o l’immagine vengono inviati ad Anthropic solo per quel controllo. Secondo le sue condizioni per le aziende, Anthropic non usa questi dati per addestrare la sua IA.',
      'Il sito e il bot funzionano su Cloudflare. Per evitare abusi contiamo quanti controlli arrivano ogni giorno da ciascuna connessione; il contatore si cancella ogni notte. Conserviamo anche i totali giornalieri (quanti controlli e di che livello), senza il contenuto.',
      'Nel bot conserviamo solo la tua lingua, il tuo nome (su WhatsApp, anche il tuo numero) e, se lo chiedi, a quale familiare sei collegato. Con /scollega si cancellano i collegamenti e con /cancella tutti i tuoi dati. Se non usi Pausa per 13 mesi, i tuoi dati si cancellano da soli.',
      'Non usiamo cookie pubblicitari né di tracciamento.',
    ],
  },
};

export function privacyPage(lang: Lang, site: SiteConfig): string {
  const p = PRIVACY[lang];
  const body = `<article class="guide"><h1>${esc(p.title)}</h1>${p.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('\n')}</article>`;
  return page({ lang, path: privacyPath(lang), title: p.title, description: p.description, body, altPath: privacyPath(lang === 'es' ? 'it' : 'es') }, site);
}

// Página de resultado cuando el mensaje llega por «Compartir» desde otra app.
export function resultPage(lang: Lang, level: Level, pattern: Pattern | null, text: string, site: SiteConfig): string {
  const t = WEB[lang];
  const share =
    level === 'sin_senales'
      ? ''
      : `${familyActions(lang, level, patternLabel(pattern, lang))}
  <a class="share-wa" href="${shareFamilyUrl(lang, pattern, site)}" target="_blank" rel="noopener">${esc(t.shareFamily)}</a>${
    level === 'alto' ? `\n  <p class="urgent-link"><a href="${urgentPath(lang)}">${esc(t.urgent.link)}</a></p>` : ''
  }`;
  const body = `<section class="result result-page">
  <h1 class="visually-hidden">${esc(t.sharedTitle)}</h1>
  <p class="pill ${level}">${esc(t.levelNames[level])}</p>
  <div class="result-text">${esc(/^(🔴|🟡|🟢)/u.test(text) ? text.replace(/^.*\n+/, '') : text)}</div>
  ${share}
</section>
<p><a class="button-link" href="${homePath(lang)}">${esc(t.sharedBack)}</a></p>`;
  return page({ lang, path: `/${lang}/compartir`, title: t.sharedTitle, description: t.homeDescription, body, noindex: true }, site);
}

export function notFoundPage(lang: Lang, site: SiteConfig): string {
  const t = WEB[lang];
  const body = `<section class="hero"><h1>${esc(t.notFoundTitle)}</h1><p>${esc(t.notFoundText)}</p><p><a class="button-link" href="${homePath(lang)}">${esc(t.navCheck)}</a></p></section>`;
  return page({ lang, path: '/404', title: t.notFoundTitle, description: t.notFoundText, body, noindex: true }, site);
}
