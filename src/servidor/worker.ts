// Servidor en Cloudflare Workers.
//   POST /telegram/webhook    → actualizaciones de Telegram (con la cabecera secreta)
//   GET|POST /whatsapp/webhook → verificación y mensajes de WhatsApp (firmados por Meta)
//   POST /api/analizar        → revisa un texto o una captura (web), con límite por conexión
//   POST /es|it/compartir     → lo que se comparte desde otra app con la app instalada
//   POST /api/evento          → cuenta clics de «avisar a la familia» e instalaciones
//   GET  /api/metricas?clave= → números de la validación
//   GET  /api/control?clave=  → para el control diario: reglas, IA y contadores con un mensaje fijo
//   GET  /salud               → control de vida
// El resto (páginas, estilos, íconos) lo sirven los assets de public/.

import { KvStore } from '../bot/almacen';
import { handleIncoming, handleUpdate } from '../bot/bot';
import { memoryCounters, type Counters } from '../bot/contadores';
import type { Messenger } from '../bot/canal';
import { createTelegramApi, telegramMessenger, type TgUpdate } from '../bot/telegram-api';
import { validSignature, whatsappIncoming, whatsappMessenger } from '../bot/whatsapp';
import { createWorkersAiTranscriber } from '../bot/transcriptor';
import { analyze } from '../motor/analizar';
import { createClaudeClassifier, type AiClassifier } from '../motor/ia';
import { siteConfig } from '../web/config';
import { durableCounters, type CounterNamespace } from './contadores';
import { telegramHeaderSecret } from './secreto';
import { handleAnalyze, handleEvent, handleShare } from './web';

// El Durable Object de los contadores tiene que salir del módulo principal.
export { Contadores } from './contadores';

export interface Env {
  GUARDIAN_KV: KVNamespace;
  // Durable Object con los contadores (límites diarios y métricas).
  CONTADORES?: CounterNamespace;
  ASSETS?: Fetcher;
  SITIO_URL?: string;
  AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
  BOT_TOKEN: string;
  TELEGRAM_SECRET: string;
  BOT_USERNAME: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_WORKSPACE_ID?: string;
  GUARDIAN_MODELO?: string;
  // Clave para leer /api/metricas (los números de la validación).
  METRICAS_CLAVE?: string;
  // WhatsApp Cloud API (opcional: sin estas claves el canal queda apagado).
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_ID?: string;
  WHATSAPP_NUMBER?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_TEMPLATE_ALERTA?: string;
  WHATSAPP_API_VERSION?: string;
}

const log = (m: string) => console.log(m);

// Mensaje fijo del control diario: una estafa clara, que tiene que dar riesgo alto.
const CONTROL_SAMPLE = 'Hola ma, se me rompió el celu, este es mi número nuevo. Necesito que me transfieras hoy, es urgente';

// Sin el Durable Object (desarrollo), contadores en memoria que duran lo que dura el pedido.
const countersFrom = (env: Env): Counters => (env.CONTADORES ? durableCounters(env.CONTADORES, log) : memoryCounters());

function aiFrom(env: Env, logTo: (m: string) => void = log): AiClassifier | null {
  return env.ANTHROPIC_API_KEY
    ? createClaudeClassifier({ apiKey: env.ANTHROPIC_API_KEY, workspaceId: env.ANTHROPIC_WORKSPACE_ID, model: env.GUARDIAN_MODELO, log: logTo })
    : null;
}

function whatsappFrom(env: Env): Messenger | undefined {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !env.WHATSAPP_NUMBER) return undefined;
  return whatsappMessenger(
    {
      token: env.WHATSAPP_TOKEN,
      phoneNumberId: env.WHATSAPP_PHONE_ID,
      number: env.WHATSAPP_NUMBER,
      apiVersion: env.WHATSAPP_API_VERSION,
      alertTemplate: env.WHATSAPP_TEMPLATE_ALERTA,
    },
    fetch,
    log,
  );
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

// www.pausa.family y *.workers.dev llevan al dominio, con la misma ruta. La API, los webhooks y
// /salud responden en cualquier dirección: Telegram o Meta pueden tener guardada otra.
function canonicalRedirect(request: Request, url: URL, env: Env): Response | null {
  const home = new URL(siteConfig(env as unknown as Record<string, string>).url);
  const other = url.hostname.endsWith('.workers.dev') || url.hostname === `www.${home.hostname}`;
  if (!other || url.hostname === home.hostname) return null;
  if ((request.method !== 'GET' && request.method !== 'HEAD') || /^\/(api|telegram|whatsapp)\//.test(url.pathname) || url.pathname === '/salud') return null;
  return Response.redirect(`${home.origin}${url.pathname}${url.search}`, 301);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const redirect = canonicalRedirect(request, url, env);
    if (redirect) return redirect;

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
        counters: countersFrom(env),
        ai: aiFrom(env),
        transcriber: env.AI ? createWorkersAiTranscriber(env.AI, log) : null,
        botUsername: env.BOT_USERNAME,
        whatsapp: whatsappFrom(env),
        log,
      };
      // Se contesta enseguida a Telegram y la revisión sigue en segundo plano.
      ctx.waitUntil(handleUpdate(update, deps).catch((err: Error) => log(`bot: ${err.name} ${err.message}`)));
      return new Response('ok');
    }

    if (url.pathname === '/whatsapp/webhook') {
      const whatsapp = whatsappFrom(env);
      if (request.method === 'GET') {
        // Meta comprueba la dirección una vez, al configurar el webhook.
        const ok = url.searchParams.get('hub.mode') === 'subscribe' && env.WHATSAPP_VERIFY_TOKEN && safeEqual(url.searchParams.get('hub.verify_token') ?? '', env.WHATSAPP_VERIFY_TOKEN);
        return ok ? new Response(url.searchParams.get('hub.challenge') ?? '') : new Response('forbidden', { status: 403 });
      }
      if (request.method !== 'POST' || !whatsapp) return new Response('not found', { status: 404 });
      const raw = await request.text();
      if (!(await validSignature(raw, request.headers.get('x-hub-signature-256'), env.WHATSAPP_APP_SECRET ?? ''))) {
        return new Response('forbidden', { status: 403 });
      }
      const messages = whatsappIncoming(JSON.parse(raw));
      const deps = {
        messengers: { whatsapp, telegram: env.BOT_TOKEN ? telegramMessenger(createTelegramApi(env.BOT_TOKEN), env.BOT_USERNAME) : undefined },
        store: new KvStore(env.GUARDIAN_KV),
        counters: countersFrom(env),
        ai: aiFrom(env),
        transcriber: env.AI ? createWorkersAiTranscriber(env.AI, log) : null,
        log,
      };
      for (const m of messages) ctx.waitUntil(handleIncoming(m, deps).catch((err: Error) => log(`whatsapp: ${err.name} ${err.message}`)));
      return new Response('ok');
    }

    if (url.pathname === '/api/analizar') return handleAnalyze(request, countersFrom(env), aiFrom(env));
    if (url.pathname === '/api/evento') return handleEvent(request, countersFrom(env));
    const share = /^\/(es|it)\/compartir\/?$/.exec(url.pathname);
    if (share) return handleShare(request, share[1] as 'es' | 'it', countersFrom(env), aiFrom(env), siteConfig(env as unknown as Record<string, string>));

    if (url.pathname === '/api/metricas' && request.method === 'GET') {
      const clave = url.searchParams.get('clave') ?? '';
      if (!env.METRICAS_CLAVE || !safeEqual(clave, env.METRICAS_CLAVE)) return new Response('forbidden', { status: 403 });
      // Por día, de las últimas dos semanas: «bot» (Telegram y WhatsApp) y «web».
      const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
      return json(await countersFrom(env).read(days));
    }

    // No cuenta como revisión: no pasa por los contadores de uso ni por las métricas.
    if (url.pathname === '/api/control' && request.method === 'GET') {
      if (!env.METRICAS_CLAVE || !safeEqual(url.searchParams.get('clave') ?? '', env.METRICAS_CLAVE)) return new Response('forbidden', { status: 403 });
      const rules = await analyze({ text: CONTROL_SAMPLE, langHint: 'es', replyLang: 'es' }, { ai: null });
      // El motivo de un error de la IA (código y mensaje de la API, con el mensaje fijo de arriba).
      let aiError = '';
      const ai = aiFrom(env, (m) => {
        log(m);
        aiError = m;
      });
      const aiResult = ai ? await ai.classify({ text: CONTROL_SAMPLE, lang: 'es', ruleFindings: [] }) : null;
      let contadores = 'sin Durable Object';
      if (env.CONTADORES) {
        const today = new Date().toISOString().slice(0, 10);
        const res = await env.CONTADORES.get(env.CONTADORES.idFromName('global'))
          .fetch('https://contadores/', { method: 'POST', body: JSON.stringify({ op: 'read', days: [today] }) })
          .catch(() => null);
        contadores = res?.ok ? 'ok' : `error ${res?.status ?? 'de red'}`;
      }
      return json({ reglas: rules.level, ia: ai ? (aiResult?.level ?? 'error') : 'sin clave', ...(aiError ? { ia_error: aiError } : {}), contadores });
    }

    // En producción los assets responden antes; esto queda para desarrollo y pruebas.
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('not found', { status: 404 });
  },
};
