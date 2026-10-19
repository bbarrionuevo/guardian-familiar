// Rutas de la web: revisar un mensaje (texto o captura), recibir lo que se comparte desde
// otra app y contar eventos. No se guarda el contenido revisado: solo contadores por día.

import { KvStore, type Store } from '../bot/almacen';
import { toBase64 } from '../bot/telegram-api';
import { analyze } from '../motor/analizar';
import type { AiClassifier, ImageMediaType } from '../motor/ia';
import { langFromCode } from '../motor/normalizar';
import { patternLabel, renderVerdict } from '../motor/respuestas';
import type { Lang, Verdict } from '../motor/tipos';
import type { SiteConfig } from '../web/config';
import { resultPage } from '../web/plantilla';

const MAX_TEXT = 4000;
// Claude acepta imágenes de hasta 5 MB; en base64 crecen un tercio.
const MAX_IMAGE_BYTES = 3_500_000;
const WEB_DAILY_LIMIT = 20;
const IMAGE_TYPES: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface WebStats {
  revisiones: number;
  alto: number;
  medio: number;
  sin_senales: number;
  imagen: number;
  desde_compartir: number;
  aviso_familia: number;
  instalaciones: number;
}

const EMPTY_STATS: WebStats = { revisiones: 0, alto: 0, medio: 0, sin_senales: 0, imagen: 0, desde_compartir: 0, aviso_familia: 0, instalaciones: 0 };

const today = () => new Date().toISOString().slice(0, 10);

async function bumpStats(store: Store, change: (s: WebStats) => void) {
  const key = `stw:${today()}`;
  const stats = { ...EMPTY_STATS, ...((await store.get<WebStats>(key)) ?? {}) };
  change(stats);
  await store.put(key, stats, 400 * 24 * 3600);
}

// La IA se usa hasta WEB_DAILY_LIMIT veces por día y por conexión; después responden solo las reglas.
async function aiForRequest(request: Request, store: Store, ai: AiClassifier | null): Promise<AiClassifier | null> {
  if (!ai) return null;
  const ip = request.headers.get('cf-connecting-ip') ?? 'sin-ip';
  const key = `web:${today()}:${ip}`;
  const used = (await store.get<number>(key)) ?? 0;
  if (used >= WEB_DAILY_LIMIT) return null;
  await store.put(key, used + 1, 2 * 24 * 3600);
  return ai;
}

function decodeBase64Length(b64: string): number {
  return Math.floor((b64.length * 3) / 4);
}

async function runCheck(
  input: { text: string; image: { mediaType: ImageMediaType; base64: string } | null; lang: Lang | null },
  request: Request,
  store: Store,
  ai: AiClassifier | null,
  fromShare: boolean,
): Promise<Verdict> {
  const verdict = await analyze(
    { text: input.text, image: input.image, langHint: input.lang, replyLang: input.lang },
    { ai: await aiForRequest(request, store, ai) },
  );
  await bumpStats(store, (s) => {
    s.revisiones++;
    s[verdict.level]++;
    if (input.image) s.imagen++;
    if (fromShare) s.desde_compartir++;
  });
  return verdict;
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS } });
}

// POST /api/analizar  {texto, idioma, imagen?: {tipo, base64}}
export async function handleAnalyze(request: Request, kv: KVNamespace, ai: AiClassifier | null): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'método' }, 405);
  const body = (await request.json().catch(() => null)) as { texto?: unknown; idioma?: unknown; imagen?: { tipo?: unknown; base64?: unknown } | null } | null;
  const text = typeof body?.texto === 'string' ? body.texto.slice(0, MAX_TEXT) : '';
  let image: { mediaType: ImageMediaType; base64: string } | null = null;
  const img = body?.imagen;
  if (img && typeof img.base64 === 'string' && IMAGE_TYPES.includes(img.tipo as ImageMediaType)) {
    if (decodeBase64Length(img.base64) > MAX_IMAGE_BYTES) return json({ error: 'imagen muy grande' }, 413);
    image = { mediaType: img.tipo as ImageMediaType, base64: img.base64 };
  }
  if (!text.trim() && !image) return json({ error: 'texto vacío' }, 400);
  const lang = typeof body?.idioma === 'string' ? langFromCode(body.idioma) : null;
  const verdict = await runCheck({ text, image, lang }, request, new KvStore(kv), ai, false);
  return json({
    nivel: verdict.level,
    patron: verdict.pattern,
    etiqueta: patternLabel(verdict.pattern, verdict.lang),
    fuente: verdict.source,
    respuesta: renderVerdict(verdict),
  });
}

// POST /es/compartir y /it/compartir: lo que manda Android al elegir «Compartir → Guardián».
export async function handleShare(request: Request, lang: Lang, kv: KVNamespace, ai: AiClassifier | null, site: SiteConfig): Promise<Response> {
  if (request.method !== 'POST') return Response.redirect(new URL(`/${lang}/`, request.url).toString(), 303);
  const form = await request.formData().catch(() => null);
  const parts = ['title', 'text', 'url']
    .map((k) => form?.get(k))
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  // Algunas apps repiten el texto en «title» y en «text».
  const text = [...new Set(parts)].join('\n').slice(0, MAX_TEXT);
  let image: { mediaType: ImageMediaType; base64: string } | null = null;
  let imageTooBig = false;
  const file = form?.get('imagen');
  if (file && typeof file === 'object' && 'arrayBuffer' in file && IMAGE_TYPES.includes(file.type as ImageMediaType)) {
    if (file.size > MAX_IMAGE_BYTES) imageTooBig = true;
    else image = { mediaType: file.type as ImageMediaType, base64: toBase64(new Uint8Array(await file.arrayBuffer())) };
  }
  const verdict = await runCheck({ text, image, lang }, request, new KvStore(kv), ai, true);
  let shown = renderVerdict(verdict);
  if (imageTooBig && !text) {
    shown = lang === 'it' ? "L'immagine è troppo grande. Fai uno screenshot del messaggio e condividi quello." : 'La imagen es muy grande. Haga una captura de pantalla del mensaje y comparta esa.';
  }
  return new Response(resultPage(lang, verdict.level, verdict.pattern, shown, site), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// POST /api/evento {tipo: 'compartir' | 'instalar'}: cuenta clics, sin datos de la persona.
export async function handleEvent(request: Request, kv: KVNamespace): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const body = (await request.json().catch(() => null)) as { tipo?: unknown } | null;
  const tipo = body?.tipo;
  if (tipo !== 'compartir' && tipo !== 'instalar') return new Response(null, { status: 400 });
  await bumpStats(new KvStore(kv), (s) => {
    if (tipo === 'compartir') s.aviso_familia++;
    else s.instalaciones++;
  });
  return new Response(null, { status: 204 });
}

export async function webStats(store: Store, day: string): Promise<WebStats | null> {
  return store.get<WebStats>(`stw:${day}`);
}
