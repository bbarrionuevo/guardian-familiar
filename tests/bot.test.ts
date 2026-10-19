import { describe, expect, it } from 'vitest';
import { keys, MemoryStore, type UserRecord } from '../src/bot/almacen';
import { handleUpdate, type BotDeps } from '../src/bot/bot';
import { createCounters, MemoryCounterStorage, memoryCounters } from '../src/bot/contadores';
import { PROFILE, TEXTS } from '../src/bot/textos';
import type { TelegramApi, TgMessage } from '../src/bot/telegram-api';

interface Sent {
  chatId: number;
  text: string;
}

function setup(over: Partial<BotDeps> = {}) {
  const sent: Sent[] = [];
  const files = new Map<string, Uint8Array>();
  const api: TelegramApi = {
    async sendMessage(chatId, text) {
      sent.push({ chatId, text });
      return true;
    },
    async sendTyping() {},
    async downloadFile(fileId, maxBytes) {
      const f = files.get(fileId);
      return f && f.byteLength <= maxBytes ? f : null;
    },
  };
  const store = new MemoryStore();
  const counterStorage = new MemoryCounterStorage();
  const deps: BotDeps = {
    api,
    store,
    counters: memoryCounters(counterStorage),
    ai: null,
    transcriber: null,
    botUsername: 'GuardianBot',
    now: () => new Date('2026-10-18T10:00:00Z'),
    ...over,
  };
  let id = 1;
  const send = (chatId: number, msg: Partial<TgMessage>, lang = 'es', name = 'Rosa') =>
    handleUpdate(
      { update_id: id++, message: { message_id: id, chat: { id: chatId, type: 'private' }, from: { id: chatId, first_name: name, language_code: lang }, ...msg } },
      deps,
    );
  return { sent, store, counterStorage, files, send, deps };
}

const SCAM = 'Hola ma, se me rompió el celu, este es mi número nuevo. Necesito que me transfieras hoy, es urgente';

describe('bot', () => {
  it('da la bienvenida en el idioma del teléfono', async () => {
    const { sent, send } = setup();
    await send(1, { text: '/start' }, 'it-IT');
    expect(sent[0]?.text).toContain('Ciao, sono Pausa');
  });

  it('se presenta como Pausa y el perfil entra en los límites de Telegram', () => {
    expect(JSON.stringify([TEXTS, PROFILE])).not.toMatch(/Guardi[aá]n|Guardiano/);
    for (const p of Object.values(PROFILE)) {
      expect(p.name).toBe('Pausa');
      expect(p.description.length).toBeLessThanOrEqual(512);
      expect(p.shortDescription.length).toBeLessThanOrEqual(120);
    }
  });

  it('revisa un mensaje reenviado y responde con el nivel', async () => {
    const { sent, send } = setup();
    await send(1, { text: SCAM, forward_origin: { type: 'hidden_user' } });
    expect(sent.at(-1)?.text).toContain('RIESGO ALTO');
  });

  it('responde en el idioma del usuario aunque el mensaje esté en otro', async () => {
    const { sent, send } = setup();
    await send(1, { text: SCAM }, 'it');
    expect(sent.at(-1)?.text).toContain('RISCHIO ALTO');
  });

  it('vincula a un familiar con el enlace y le avisa ante un riesgo alto', async () => {
    const { sent, send, store } = setup();
    await send(100, { text: '/familia' }, 'es', 'Lucía');
    const link = sent.find((s) => s.chatId === 100 && s.text.includes('t.me/GuardianBot?start=fam_'))!.text;
    const code = /start=fam_([A-Za-z0-9]+)/.exec(link)![1];

    await send(1, { text: `/start fam_${code}` }, 'es', 'Rosa');
    expect(sent.some((s) => s.chatId === 1 && s.text.includes('también le aviso a Lucía'))).toBe(true);
    expect(sent.some((s) => s.chatId === 100 && s.text.includes('Rosa abrió su enlace'))).toBe(true);

    sent.length = 0;
    await send(1, { text: SCAM });
    const alert = sent.find((s) => s.chatId === 100);
    expect(alert?.text).toContain('Rosa recibió un mensaje con riesgo alto');
    expect(alert?.text).not.toContain('transfieras hoy');
    expect(sent.find((s) => s.chatId === 1)?.text).toContain('Le avisé a su familiar');

    // El enlace es de un solo uso.
    await send(2, { text: `/start fam_${code}` });
    expect(sent.at(-1)?.text).toContain('ya no vale');

    // Desvincular borra los dos lados.
    await send(1, { text: '/desvincular' });
    expect((await store.get<UserRecord>(keys.user({ channel: 'telegram', id: '100' })))?.protects).toEqual([]);
    expect((await store.get<UserRecord>(keys.user({ channel: 'telegram', id: '1' })))?.guardians).toEqual([]);
  });

  it('el enlace no lleva @ aunque el usuario del bot se haya cargado con @', async () => {
    const { sent, send } = setup({ botUsername: '@guardian_familiar_bot' });
    await send(100, { text: '/familia' });
    expect(sent.at(-1)?.text).toContain('https://t.me/guardian_familiar_bot?start=fam_');
  });

  it('no deja usar el propio enlace', async () => {
    const { sent, send } = setup();
    await send(100, { text: '/familia' });
    const code = /start=fam_([A-Za-z0-9]+)/.exec(sent.at(-1)!.text)![1];
    await send(100, { text: `/start fam_${code}` });
    expect(sent.at(-1)?.text).toContain('es para su familiar');
  });

  it('respeta el límite diario', async () => {
    const { sent, send } = setup({ dailyLimit: 2 });
    await send(1, { text: 'hola' });
    await send(1, { text: 'hola' });
    await send(1, { text: 'hola' });
    expect(sent.at(-1)?.text).toContain('Hoy ya revisé 2');
  });

  it('una foto sin IA pide el texto; con IA la analiza', async () => {
    const { sent, send, files } = setup();
    files.set('foto1', new Uint8Array([1, 2, 3]));
    await send(1, { photo: [{ file_id: 'foto1', width: 10, height: 10, file_size: 3 }] });
    expect(sent.at(-1)?.text).toContain('No pude leer la imagen');

    const withAi = setup({
      ai: { classify: async (input) => ({ level: input.image ? 'alto' : 'sin_senales', pattern: 'banco_falso', reason: 'r', action: 'a', visibleText: '' }) },
    });
    withAi.files.set('foto1', new Uint8Array([1, 2, 3]));
    await withAi.send(1, { photo: [{ file_id: 'foto1', width: 10, height: 10, file_size: 3 }] });
    expect(withAi.sent.at(-1)?.text).toContain('RIESGO ALTO');
  });

  it('transcribe audios y avisa si no puede', async () => {
    const withT = setup({ transcriber: { transcribe: async () => SCAM } });
    withT.files.set('voz', new Uint8Array([1]));
    await withT.send(1, { voice: { file_id: 'voz', duration: 12 } });
    expect(withT.sent.at(-1)?.text).toContain('RIESGO ALTO');

    const without = setup();
    await without.send(1, { voice: { file_id: 'voz', duration: 12 } });
    expect(without.sent.at(-1)?.text).toContain('No pude entender el audio');
  });

  it('no guarda el texto revisado, solo contadores', async () => {
    const { send, store, counterStorage } = setup();
    await send(1, { text: SCAM });
    await send(1, { text: 'hola' });
    expect(counterStorage.data.get('st:bot:2026-10-18')).toMatchObject({ revisiones: 2, alto: 1, telegram: 2, usuarios: 1 });
    expect(counterStorage.data.get('u:2026-10-18:1')).toBe(2);
    const saved = [...(store as unknown as { data: Map<string, { value: string }> }).data.values()].map((v) => v.value).join(' ');
    expect(saved.length).toBeGreaterThan(0);
    expect(saved + JSON.stringify([...counterStorage.data])).not.toContain('transfieras');
  });

  it('guarda el mes de uso, para borrar solo a quien no usa Pausa en un año', async () => {
    const { send, store } = setup();
    await send(1, { text: 'hola' });
    expect((await store.get<UserRecord>(keys.user({ channel: 'telegram', id: '1' })))?.visto).toBe('2026-10');
  });

  it('/borrar elimina el registro y el vínculo en el registro del familiar', async () => {
    const { sent, send, store } = setup();
    await send(100, { text: '/familia' }, 'es', 'Lucía');
    const code = /start=fam_([A-Za-z0-9]+)/.exec(sent.at(-1)!.text)![1];
    await send(1, { text: `/start fam_${code}` }, 'es', 'Rosa');
    await send(1, { text: '/borrar' });
    expect(sent.at(-1)?.text).toContain('borré todos sus datos');
    expect(await store.get(keys.user({ channel: 'telegram', id: '1' }))).toBeNull();
    expect((await store.get<UserRecord>(keys.user({ channel: 'telegram', id: '100' })))?.protects).toEqual([]);
  });

  it('responde aunque no pueda guardar nada (por ejemplo, sin escrituras de KV en el día)', async () => {
    const broken = new MemoryStore();
    broken.put = async () => {
      throw new Error('KV put() limit exceeded for the day.');
    };
    const { sent, send } = setup({ store: broken });
    await send(1, { text: SCAM });
    expect(sent.at(-1)?.text).toContain('RIESGO ALTO');
  });

  it('si fallan los contadores, la revisión sigue igual', async () => {
    const { sent, send } = setup({
      counters: createCounters(async () => {
        throw new Error('Durable Object caído');
      }),
    });
    await send(1, { text: SCAM });
    expect(sent.at(-1)?.text).toContain('RIESGO ALTO');
  });

  it('ignora grupos y cambia de idioma con /lingua', async () => {
    const { sent, send, deps } = setup();
    await handleUpdate({ update_id: 9, message: { message_id: 1, chat: { id: -5, type: 'group' }, text: SCAM } }, deps);
    expect(sent).toHaveLength(0);
    await send(1, { text: '/lingua' });
    expect(sent.at(-1)?.text).toBe('Fatto, ti parlo in italiano.');
  });
});
