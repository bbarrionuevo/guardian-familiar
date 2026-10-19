// Servidor en Cloudflare Workers.
//   POST /telegram/webhook  → actualizaciones de Telegram (con la cabecera secreta)
//   POST /api/analizar      → revisa un texto (para la página web), con límite por IP
//   GET  /salud             → control de vida

import { KvStore } from '../bot/almacen';
import { handleUpdate, type DayStats } from '../bot/bot';
import { createTelegramApi, type TgUpdate } from '../bot/telegram-api';
import { createWorkersAiTranscriber } from '../bot/transcriptor';
import { analyze } from '../motor/analizar';
import { createClaudeClassifier, type AiClassifier } from '../motor/ia';
import { langFromCode } from '../motor/normalizar';
import { renderVerdict } from '../motor/respuestas';
import { telegramHeaderSecret } from './secreto';

export interface Env {
  GUARDIAN_KV: KVNamespace;
  AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
  BOT_TOKEN: string;
  TELEGRAM_SECRET: string;
  BOT_USERNAME: string;
  ANTHROPIC_API_KEY?: string;
  GUARDIAN_MODELO?: string;
  // Clave para leer /api/metricas (los números de la validación).
  METRICAS_CLAVE?: string;
}

const MAX_TEXT = 4000;
const WEB_DAILY_LIMIT = 20;

const log = (m: string) => console.log(m);

function aiFrom(env: Env): AiClassifier | null {
  return env.ANTHROPIC_API_KEY ? createClaudeClassifier({ apiKey: env.ANTHROPIC_API_KEY, model: env.GUARDIAN_MODELO, log }) : null;
}

// Comparación en tiempo constante para la cabecera secreta.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || !a.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/salud') return json({ ok: true });

    if (url.pathname === '/telegram/webhook' && request.method === 'POST') {
      const expected = env.TELEGRAM_SECRET ? await telegramHeaderSecret(env.TELEGRAM_SECRET) : '';
      if (!safeEqual(request.headers.get('x-telegram-bot-api-secret-token') ?? '', expected)) {
        return new Response('forbidden', { status: 403 });
      }
      const update = (await request.json()) as TgUpdate;
      const deps = {
        api: createTelegramApi(env.BOT_TOKEN),
        store: new KvStore(env.GUARDIAN_KV),
        ai: aiFrom(env),
        transcriber: env.AI ? createWorkersAiTranscriber(env.AI, log) : null,
        botUsername: env.BOT_USERNAME,
        log,
      };
      // Se contesta enseguida a Telegram y la revisión sigue en segundo plano.
      ctx.waitUntil(handleUpdate(update, deps).catch((err: Error) => log(`bot: ${err.name} ${err.message}`)));
      return new Response('ok');
    }

    if (url.pathname === '/api/analizar') {
      if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
      if (request.method !== 'POST') return json({ error: 'método' }, 405, CORS);
      const body = (await request.json().catch(() => null)) as { texto?: unknown; idioma?: unknown } | null;
      const text = typeof body?.texto === 'string' ? body.texto.slice(0, MAX_TEXT) : '';
      if (!text.trim()) return json({ error: 'texto vacío' }, 400, CORS);

      const store = new KvStore(env.GUARDIAN_KV);
      const ip = request.headers.get('cf-connecting-ip') ?? 'sin-ip';
      const key = `web:${new Date().toISOString().slice(0, 10)}:${ip}`;
      const used = (await store.get<number>(key)) ?? 0;
      // Pasado el límite se sigue respondiendo, pero solo con las reglas (sin gastar IA).
      const ai = used < WEB_DAILY_LIMIT ? aiFrom(env) : null;
      if (ai) await store.put(key, used + 1, 2 * 24 * 3600);
      const lang = typeof body?.idioma === 'string' ? langFromCode(body.idioma) : null;
      const verdict = await analyze({ text, langHint: lang, replyLang: lang }, { ai });
      return json(
        { nivel: verdict.level, patron: verdict.pattern, fuente: verdict.source, respuesta: renderVerdict(verdict) },
        200,
        CORS,
      );
    }

    if (url.pathname === '/api/metricas' && request.method === 'GET') {
      const clave = url.searchParams.get('clave') ?? '';
      if (!env.METRICAS_CLAVE || !safeEqual(clave, env.METRICAS_CLAVE)) return new Response('forbidden', { status: 403 });
      const store = new KvStore(env.GUARDIAN_KV);
      const days: Record<string, DayStats & { usuarios: number }> = {};
      for (let i = 0; i < 14; i++) {
        const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
        const stats = await store.get<DayStats>(`st:${day}`);
        if (stats) days[day] = { ...stats, usuarios: await store.count(`cnt:${day}:`) };
      }
      return json(days);
    }

    return new Response('not found', { status: 404 });
  },
};
