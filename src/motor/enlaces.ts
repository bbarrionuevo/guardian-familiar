// Análisis de enlaces sin conexión: no visita nada, solo mira cómo está armada la dirección.
// Las estafas por SMS y WhatsApp casi siempre llevan a un dominio que imita a una marca
// (poste-it-verifica.com), a un acortador o a una terminación barata (.top, .icu).

import type { LinkFlag, LinkReport } from './tipos';

// Terminaciones de dominio que reconocemos cuando el enlace viene sin http:// ni www.
const KNOWN_TLDS = new Set([
  'com', 'it', 'es', 'ar', 'net', 'org', 'info', 'eu', 'biz', 'io', 'co', 'me', 'app', 'dev', 'page', 'link',
  'top', 'xyz', 'icu', 'shop', 'click', 'live', 'online', 'site', 'store', 'cfd', 'sbs', 'cyou', 'buzz', 'rest',
  'lol', 'monster', 'vip', 'win', 'bond', 'qpon', 'support', 'help', 'cc', 'tk', 'ml', 'ga', 'cf', 'gq', 'ws', 'us',
  'uk', 'de', 'fr', 'br', 'mx', 'cl', 'uy', 'pe', 'ly', 'gl', 'gd', 'to', 'pw', 'ru', 'cn', 'su', 'one', 'club',
]);

// Terminaciones baratas o muy usadas en campañas de phishing.
const RISKY_TLDS = new Set([
  'top', 'xyz', 'icu', 'click', 'live', 'online', 'site', 'cfd', 'sbs', 'cyou', 'buzz', 'rest', 'lol', 'monster',
  'vip', 'win', 'bond', 'qpon', 'support', 'help', 'tk', 'ml', 'ga', 'cf', 'gq', 'ws', 'pw', 'su', 'shop', 'store', 'info', 'club',
]);

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.ly', 'cutt.ly', 'is.gd', 'rb.gy', 'shorturl.at', 'ow.ly', 'tiny.cc', 'buff.ly',
  'rebrand.ly', 'short.io', 'bl.ink', 's.id', 't.co', 'goo.su', 'shorturl.gg', 'qrco.de', 'linktr.ee', 'v.gd', 'u.to',
]);

// Sufijos de dos niveles: el dominio registrable es la etiqueta anterior más el sufijo.
const TWO_LEVEL_SUFFIXES = new Set([
  'com.ar', 'gob.ar', 'gov.ar', 'org.ar', 'net.ar', 'edu.ar', 'int.ar', 'mil.ar',
  'gov.it', 'edu.it', 'gob.es', 'com.es', 'org.es', 'nom.es', 'edu.es',
  'co.uk', 'org.uk', 'com.br', 'gov.br', 'com.mx', 'gob.mx', 'com.co', 'gov.co', 'com.pe', 'gob.pe', 'com.uy', 'gub.uy',
]);

// Dominios oficiales de las marcas e instituciones que más se imitan en IT, ES y AR.
const OFFICIAL_DOMAINS = new Set([
  // Italia
  'poste.it', 'posteitaliane.it', 'postepay.it', 'intesasanpaolo.com', 'unicredit.it', 'bper.it', 'inps.it',
  'agenziaentrate.gov.it', 'agenziaentrateriscossione.gov.it', 'telepass.com', 'autostrade.it', 'enel.it', 'enel.com',
  'bnl.it', 'mps.it', 'fineco.it', 'mediolanum.it', 'credem.it', 'bancobpm.it', 'pagopa.gov.it', 'ilportaledellautomobilista.it',
  'brt.it', 'gls-italy.com', 'inpost.it', 'sda.it', 'dhl.it', 'amazon.it', 'aci.it',
  // España
  'correos.es', 'dgt.es', 'agenciatributaria.gob.es', 'seg-social.es', 'sepe.es', 'bbva.es', 'bbva.com', 'santander.es',
  'bancosantander.es', 'caixabank.es', 'caixabank.com', 'ing.es', 'bancsabadell.com', 'unicaja.es', 'bankinter.com',
  'kutxabank.es', 'abanca.com', 'seur.com', 'mrw.es', 'naturgy.es', 'iberdrola.es', 'endesa.com', 'amazon.es', 'bizum.es',
  // Argentina
  'anses.gob.ar', 'afip.gob.ar', 'arca.gob.ar', 'argentina.gob.ar', 'mercadopago.com.ar', 'mercadolibre.com.ar',
  'mercadopago.com', 'mercadolibre.com', 'bna.com.ar', 'bancogalicia.com', 'galicia.ar', 'santander.com.ar', 'bbva.com.ar',
  'macro.com.ar', 'bancoprovincia.com.ar', 'andreani.com', 'correoargentino.com.ar', 'oca.com.ar', 'edenor.com',
  'edesur.com.ar', 'metrogas.com.ar', 'pami.org.ar', 'uala.com.ar', 'naranjax.com', 'brubank.com',
  // Globales
  'amazon.com', 'paypal.com', 'netflix.com', 'apple.com', 'icloud.com', 'microsoft.com', 'whatsapp.com', 'google.com',
  'dhl.com', 'ups.com', 'fedex.com', 'instagram.com', 'facebook.com',
]);

// Palabras de marca que, si aparecen en un dominio que no es el oficial, delatan una imitación.
const BRAND_TOKENS = [
  'poste', 'postepay', 'bancoposta', 'intesa', 'sanpaolo', 'unicredit', 'bper', 'inps', 'agenziaentrate', 'entrate',
  'telepass', 'autostrade', 'enel', 'pagopa', 'fineco', 'mediolanum', 'brt', 'inpost', 'correos', 'dgt',
  'agenciatributaria', 'tributaria', 'hacienda', 'segsocial', 'seg-social', 'bbva', 'santander', 'caixa', 'caixabank',
  'sabadell', 'unicaja', 'bankinter', 'bizum', 'naturgy', 'iberdrola', 'endesa', 'anses', 'afip', 'arca', 'mercadopago',
  'mercadolibre', 'bna', 'galicia', 'macro', 'andreani', 'correoargentino', 'edenor', 'edesur', 'metrogas', 'pami',
  'amazon', 'paypal', 'netflix', 'apple', 'icloud', 'microsoft', 'whatsapp', 'dhl', 'gls', 'seur', 'ups', 'fedex',
];

// Palabras que los estafadores ponen en el dominio o en el subdominio para dar urgencia o confianza.
const BAIT_WORDS = [
  'verifica', 'verify', 'sicurezza', 'secure', 'security', 'sblocc', 'aggiorna', 'update', 'rimborso', 'reembolso',
  'login', 'accesso', 'acceso', 'account', 'cliente', 'clienti', 'soporte', 'support', 'assistenza', 'validar',
  'validacion', 'desbloqueo', 'seguridad', 'premio', 'bonus', 'bono', 'pago', 'pagamento', 'consegna', 'entrega',
  'tracking', 'track', 'paquete', 'pacco', 'multa', 'sanzione', 'devolucion', 'confirm', 'conferma', 'alerta', 'avviso',
];

// Captura enlaces con esquema, con www. o desnudos (dominio.tld/ruta), también «desactivados» (hxxp, [.]).
const URL_CANDIDATE = /\b(?:(?:https?|hxxps?):\/\/[^\s<>"'«»]+|www\.[^\s<>"'«»]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:\/[^\s<>"'«»]*)?)/gi;

function refang(text: string): string {
  return text
    .replace(/hxxp/gi, 'http')
    .replace(/\[\s*\.\s*\]|\(\s*\.\s*\)|\[dot\]|\(dot\)/gi, '.');
}

export function registrableDomain(host: string): string {
  const labels = host.split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');
  const lastTwo = labels.slice(-2).join('.');
  if (TWO_LEVEL_SUFFIXES.has(lastTwo)) return labels.slice(-3).join('.');
  return lastTwo;
}

function isInstitutional(domain: string): boolean {
  return /\.(gov\.it|gob\.es|gob\.ar|gov\.ar|europa\.eu)$/.test(domain) || domain === 'europa.eu';
}

function analyzeHost(rawUrl: string): LinkReport | null {
  const withScheme = /^[a-z]+:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme.replace(/[.,;:!?)\]]+$/, ''));
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  const tld = host.split('.').pop() ?? '';
  // Un dominio desnudo con terminación desconocida suele ser una palabra con punto, no un enlace.
  const hadScheme = /^(https?:\/\/|www\.)/i.test(rawUrl);
  if (!isIp && !hadScheme && !KNOWN_TLDS.has(tld)) return null;

  const domain = isIp ? host : registrableDomain(host);
  const official = !isIp && (OFFICIAL_DOMAINS.has(domain) || isInstitutional(domain));
  const flags: LinkFlag[] = [];

  if (SHORTENERS.has(domain) || SHORTENERS.has(host)) flags.push('acortador');
  if (isIp) flags.push('ip');
  if (host.includes('xn--')) flags.push('punycode');
  if (!official && RISKY_TLDS.has(tld)) flags.push('dominio_raro');

  if (!official && !isIp) {
    const compactHost = host.replace(/-/g, '');
    if (BRAND_TOKENS.some((brand) => compactHost.includes(brand.replace(/-/g, '')))) flags.push('imita_marca');
    const lowerPath = `${host}${parsed.pathname}`.toLowerCase();
    if (BAIT_WORDS.some((word) => host.includes(word)) || (flags.includes('imita_marca') && BAIT_WORDS.some((w) => lowerPath.includes(w)))) {
      flags.push('palabra_cebo');
    }
    const firstLabel = domain.split('.')[0] ?? '';
    if ((firstLabel.match(/-/g) ?? []).length >= 2) flags.push('muchos_guiones');
  }
  if (/^http:\/\//i.test(withScheme) && hadScheme && !official) flags.push('sin_https');

  return { url: rawUrl, host, domain, official, flags };
}

export function extractLinks(rawText: string): LinkReport[] {
  const text = refang(rawText);
  const reports: LinkReport[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(URL_CANDIDATE)) {
    const candidate = match[0];
    // Evita confundir direcciones de correo con enlaces (nombre@dominio.com).
    const before = text[match.index - 1];
    if (before === '@') continue;
    const report = analyzeHost(candidate);
    if (!report || seen.has(report.host + report.url)) continue;
    seen.add(report.host + report.url);
    reports.push(report);
  }
  return reports;
}

// Un enlace es sospechoso si tiene al menos una señal fuerte, o dos débiles.
const STRONG_FLAGS: LinkFlag[] = ['acortador', 'ip', 'punycode', 'imita_marca'];

export function isSuspicious(report: LinkReport): boolean {
  if (report.official) return false;
  if (report.flags.some((f) => STRONG_FLAGS.includes(f))) return true;
  return report.flags.length >= 2;
}
