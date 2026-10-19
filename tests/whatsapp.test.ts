import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryStore } from '../src/bot/almacen';
import { handleIncoming, type CoreDeps } from '../src/bot/bot';
import type { Channel, FamilyAlert, Incoming, Messenger } from '../src/bot/canal';
import { validSignature, whatsappIncoming, whatsappMessenger } from '../src/bot/whatsapp';
import worker, { type Env } from '../src/servidor/worker';

const SCAM = 'Hola ma, se me rompió el celu, este es mi número nuevo. Necesito que me transfieras hoy, es urgente';

function payload(messages: unknown[], contacts: unknown[] = []) {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages, contacts } }] }] };
}

async function sign(body: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  return `sha256=${[...mac].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

describe('mensajes de WhatsApp', () => {
  it('traduce texto, imagen, audio y reenviados', () => {
    const list = whatsappIncoming(
      payload(
        [
          { from: '5491100000000', id: '1', type: 'text', text: { body: 'hola' }, context: { forwarded: true } },
          { from: '393330000000', id: '2', type: 'image', image: { id: 'img1', mime_type: 'image/jpeg', caption: 'guarda' } },
          { from: '5491100000000', id: '3', type: 'audio', audio: { id: 'aud1', mime_type: 'audio/ogg; codecs=opus' } },
        ],
        [{ wa_id: '5491100000000', profile: { name: 'Rosa' } }],
      ),
    );
    expect(list[0]).toMatchObject({ from: { channel: 'whatsapp', id: '5491100000000' }, name: 'Rosa', text: 'hola', forwarded: true, langCode: 'es' });
    expect(list[1]).toMatchObject({ text: 'guarda', image: { id: 'img1', mimeType: 'image/jpeg' }, langCode: 'it' });
    expect(list[2]?.audio?.id).toBe('aud1');
    expect(whatsappIncoming({})).toEqual([]);
  });

  it('comprueba la firma de Meta', async () => {
    const body = JSON.stringify({ a: 1 });
    expect(await validSignature(body, await sign(body, 'secreto'), 'secreto')).toBe(true);
    expect(await validSignature(body, await sign(body, 'otro'), 'secreto')).toBe(false);
    expect(await validSignature(body, null, 'secreto')).toBe(false);
  });

  it('manda el aviso a la familia con la plantilla y, si falla, como texto', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(new Response('', { status: 400 })).mockResolvedValue(new Response('{}'));
    const m = whatsappMessenger({ token: 't', phoneNumberId: 'p', number: '+39 333 000', alertTemplate: 'alerta_familia' }, fetchFn as unknown as typeof fetch);
    const alert: FamilyAlert = { who: 'Rosa', label: 'falso familiar', action: 'No transfiera nada.', text: 'texto', lang: 'es' };
    expect(await m.sendAlert!('549', alert)).toBe(true);
    const first = JSON.parse(fetchFn.mock.calls[0]![1].body);
    expect(first.type).toBe('template');
    expect(first.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual(['Rosa', 'falso familiar', 'No transfiera nada.']);
    expect(JSON.parse(fetchFn.mock.calls[1]![1].body).type).toBe('text');
    expect(m.inviteLink('abc123')).toBe('https://wa.me/39333000?text=fam_abc123');
  });
});

function fakeMessenger(channel: Channel, sent: { channel: Channel; to: string; text: string }[]): Messenger {
  return {
    send: async (to, text) => (sent.push({ channel, to, text }), true),
    typing: async () => {},
    download: async () => null,
    inviteLink: (code) => (channel === 'telegram' ? `https://t.me/bot?start=fam_${code}` : `https://wa.me/39000?text=fam_${code}`),
  };
}

describe('familia entre canales', () => {
  it('la hija en Telegram invita, la madre acepta en WhatsApp y recibe la alerta', async () => {
    const sent: { channel: Channel; to: string; text: string }[] = [];
    const deps: CoreDeps = {
      messengers: { telegram: fakeMessenger('telegram', sent), whatsapp: fakeMessenger('whatsapp', sent) },
      store: new MemoryStore(),
      ai: null,
      transcriber: null,
    };
    const tg = (text: string): Incoming => ({ from: { channel: 'telegram', id: '100' }, name: 'Lucía', langCode: 'es', text, forwarded: false });
    const wa = (text: string): Incoming => ({ from: { channel: 'whatsapp', id: '5491100000000' }, name: 'Rosa', langCode: 'es', text, forwarded: false });

    await handleIncoming(tg('/familia'), deps);
    const invite = sent.find((s) => s.text.includes('wa.me/'))!.text;
    expect(invite).toContain('t.me/bot?start=fam_');
    const code = /text=fam_([A-Za-z0-9]+)/.exec(invite)![1];

    sent.length = 0;
    await handleIncoming(wa(`fam_${code}`), deps);
    expect(sent.some((s) => s.channel === 'whatsapp' && s.text.includes('Hola, soy Pausa'))).toBe(true);
    expect(sent.some((s) => s.channel === 'telegram' && s.text.includes('Rosa abrió su enlace'))).toBe(true);

    sent.length = 0;
    await handleIncoming(wa(SCAM), deps);
    expect(sent.find((s) => s.channel === 'telegram')?.text).toContain('Rosa recibió un mensaje con riesgo alto');
    expect(sent.find((s) => s.channel === 'whatsapp')?.text).toContain('Le avisé a su familiar');
  });

  it('la primera vez que alguien escribe por WhatsApp recibe la bienvenida y la revisión', async () => {
    const sent: { channel: Channel; to: string; text: string }[] = [];
    const deps: CoreDeps = { messengers: { whatsapp: fakeMessenger('whatsapp', sent) }, store: new MemoryStore(), ai: null, transcriber: null };
    await handleIncoming({ from: { channel: 'whatsapp', id: '393330000000' }, langCode: 'it', text: 'Ciao mamma, ho cambiato numero. Mi serve un bonifico urgente', forwarded: true }, deps);
    expect(sent[0]?.text).toContain('Ciao, sono Pausa');
    expect(sent.at(-1)?.text).toContain('RISCHIO ALTO');
  });
});

describe('webhook de WhatsApp en el Worker', () => {
  const env = {
    GUARDIAN_KV: { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [], list_complete: true }) },
    WHATSAPP_TOKEN: 'tok',
    WHATSAPP_PHONE_ID: '123',
    WHATSAPP_NUMBER: '39000',
    WHATSAPP_APP_SECRET: 'app-secret',
    WHATSAPP_VERIFY_TOKEN: 'verifica',
  } as unknown as Env;

  afterEach(() => vi.unstubAllGlobals());

  it('responde la verificación de Meta solo con el token correcto', async () => {
    const ok = await worker.fetch(new Request('https://w.dev/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verifica&hub.challenge=42'), env, {} as ExecutionContext);
    expect(await ok.text()).toBe('42');
    const bad = await worker.fetch(new Request('https://w.dev/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=no&hub.challenge=42'), env, {} as ExecutionContext);
    expect(bad.status).toBe(403);
  });

  it('rechaza mensajes sin firma y responde los firmados', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    const body = JSON.stringify(payload([{ from: '5491100000000', id: '1', type: 'text', text: { body: SCAM } }]));
    const pending: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException: () => {} } as unknown as ExecutionContext;

    const unsigned = await worker.fetch(new Request('https://w.dev/whatsapp/webhook', { method: 'POST', body }), env, ctx);
    expect(unsigned.status).toBe(403);

    const signed = await worker.fetch(
      new Request('https://w.dev/whatsapp/webhook', { method: 'POST', body, headers: { 'x-hub-signature-256': await sign(body, 'app-secret') } }),
      env,
      ctx,
    );
    expect(signed.status).toBe(200);
    await Promise.all(pending);
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(fetchMock.mock.calls[0]![0]).toBe('https://graph.facebook.com/v23.0/123/messages');
    expect(bodies.some((b) => b.to === '5491100000000' && b.text.body.includes('RIESGO ALTO'))).toBe(true);
  });
});
