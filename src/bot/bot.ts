// Lógica del bot de Telegram: comandos, vínculo familiar y revisión de mensajes.
// No guarda el contenido de lo que revisa: solo contadores por día.

import { analyze, type AnalyzeInput } from '../motor/analizar';
import type { AiClassifier, ImageMediaType } from '../motor/ia';
import { langFromCode } from '../motor/normalizar';
import { renderFamilyAlert, renderVerdict } from '../motor/respuestas';
import type { Lang } from '../motor/tipos';
import { keys, type Invite, type Link, type Store, type UserRecord } from './almacen';
import { toBase64, type TelegramApi, type TgMessage, type TgUpdate } from './telegram-api';
import { COMMANDS, TEXTS } from './textos';
import type { Transcriber } from './transcriptor';

export interface BotDeps {
  api: TelegramApi;
  store: Store;
  ai: AiClassifier | null;
  transcriber: Transcriber | null;
  botUsername: string;
  now?: () => Date;
  dailyLimit?: number;
  log?: (msg: string) => void;
}

// Claude acepta imágenes de hasta 5 MB; en base64 crecen un tercio.
const MAX_IMAGE_BYTES = 3_500_000;
const MAX_AUDIO_BYTES = 10_000_000;
const MAX_AUDIO_SECONDS = 180;
const INVITE_TTL = 7 * 24 * 3600;
const DAILY_TTL = 40 * 24 * 3600;
const STATS_TTL = 400 * 24 * 3600;
const MAX_GUARDIANS = 5;
const IMAGE_TYPES: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface DayStats {
  checks: number;
  alto: number;
  medio: number;
  sin_senales: number;
  imagen: number;
  audio: number;
  alertas: number;
}

const dayOf = (d: Date) => d.toISOString().slice(0, 10);
const cleanName = (name: string | undefined) => (name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) || '—';

function newCode(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

async function loadUser(store: Store, msg: TgMessage): Promise<UserRecord> {
  const key = keys.user(msg.chat.id);
  const existing = await store.get<UserRecord>(key);
  const name = cleanName(msg.from?.first_name);
  if (existing) {
    if (existing.name !== name && msg.from) {
      existing.name = name;
      await store.put(key, existing);
    }
    return existing;
  }
  const user: UserRecord = { lang: langFromCode(msg.from?.language_code), name, guardians: [], protects: [] };
  await store.put(key, user);
  return user;
}

export async function handleUpdate(update: TgUpdate, deps: BotDeps): Promise<void> {
  const msg = update.message;
  // Solo chats privados: en grupos el bot no lee nada.
  if (!msg || msg.chat.type !== 'private') return;
  const user = await loadUser(deps.store, msg);
  const text = msg.text?.trim() ?? '';
  if (text.startsWith('/') && !msg.forward_origin) {
    await handleCommand(msg, user, text, deps);
    return;
  }
  await checkMessage(msg, user, deps);
}

async function handleCommand(msg: TgMessage, user: UserRecord, text: string, deps: BotDeps): Promise<void> {
  const { api, store } = deps;
  const chatId = msg.chat.id;
  const [rawCmd = '', payload = ''] = text.slice(1).split(/\s+/, 2);
  const cmd = COMMANDS[rawCmd.split('@')[0]!.toLowerCase()];
  const t = TEXTS[user.lang];

  switch (cmd) {
    case 'start': {
      await api.sendMessage(chatId, t.welcome);
      if (payload.startsWith('fam_')) await acceptInvite(msg, user, payload.slice(4), deps);
      return;
    }
    case 'family': {
      const code = newCode();
      await store.put(keys.invite(code), { childChatId: chatId, childName: user.name } satisfies Invite, INVITE_TTL);
      const link = `https://t.me/${deps.botUsername}?start=fam_${code}`;
      await api.sendMessage(chatId, t.inviteForChild(link));
      await api.sendMessage(chatId, t.inviteToForward(link));
      return;
    }
    case 'unlink': {
      if (!user.guardians.length && !user.protects.length) {
        await api.sendMessage(chatId, t.nothingToUnlink);
        return;
      }
      // Se borra el vínculo de los dos lados.
      for (const other of [...user.guardians, ...user.protects]) {
        const key = keys.user(other.chatId);
        const rec = await store.get<UserRecord>(key);
        if (!rec) continue;
        rec.guardians = rec.guardians.filter((g) => g.chatId !== chatId);
        rec.protects = rec.protects.filter((p) => p.chatId !== chatId);
        await store.put(key, rec);
      }
      user.guardians = [];
      user.protects = [];
      await store.put(keys.user(chatId), user);
      await api.sendMessage(chatId, t.unlinked);
      return;
    }
    case 'privacy':
      await api.sendMessage(chatId, t.privacy);
      return;
    case 'lang_es':
    case 'lang_it': {
      user.lang = cmd === 'lang_it' ? 'it' : 'es';
      await store.put(keys.user(chatId), user);
      await api.sendMessage(chatId, TEXTS[user.lang].langSet);
      return;
    }
    default:
      await api.sendMessage(chatId, t.help);
  }
}

async function acceptInvite(msg: TgMessage, user: UserRecord, code: string, deps: BotDeps): Promise<void> {
  const { api, store } = deps;
  const chatId = msg.chat.id;
  const t = TEXTS[user.lang];
  const invite = /^[A-Za-z0-9]{6,32}$/.test(code) ? await store.get<Invite>(keys.invite(code)) : null;
  if (!invite) {
    await api.sendMessage(chatId, t.inviteInvalid);
    return;
  }
  if (invite.childChatId === chatId) {
    await api.sendMessage(chatId, t.inviteSelf);
    return;
  }
  await store.delete(keys.invite(code));

  const addLink = (list: Link[], link: Link) => [...list.filter((l) => l.chatId !== link.chatId), link].slice(-MAX_GUARDIANS);
  user.guardians = addLink(user.guardians, { chatId: invite.childChatId, name: invite.childName });
  await store.put(keys.user(chatId), user);

  const childKey = keys.user(invite.childChatId);
  const child = await store.get<UserRecord>(childKey);
  if (child) {
    child.protects = addLink(child.protects, { chatId, name: user.name });
    await store.put(childKey, child);
  }
  await api.sendMessage(chatId, t.linkedParent(invite.childName));
  await api.sendMessage(invite.childChatId, TEXTS[child?.lang ?? user.lang].linkedChild(user.name));
}

async function checkMessage(msg: TgMessage, user: UserRecord, deps: BotDeps): Promise<void> {
  const { api, store } = deps;
  const chatId = msg.chat.id;
  const t = TEXTS[user.lang];
  const text = (msg.text ?? msg.caption ?? '').trim();

  const photo = msg.photo?.length
    ? [...msg.photo].sort((a, b) => b.width * b.height - a.width * a.height).find((p) => (p.file_size ?? 0) <= MAX_IMAGE_BYTES)
    : undefined;
  const imageDoc = msg.document && IMAGE_TYPES.includes(msg.document.mime_type as ImageMediaType) ? msg.document : undefined;
  const sound = msg.voice ?? msg.audio;
  if (!text && !msg.photo?.length && !imageDoc && !sound) {
    await api.sendMessage(chatId, t.unsupported);
    return;
  }

  const now = deps.now?.() ?? new Date();
  const day = dayOf(now);
  const limit = deps.dailyLimit ?? 30;
  const countKey = keys.daily(day, chatId);
  const used = (await store.get<number>(countKey)) ?? 0;
  if (used >= limit) {
    await api.sendMessage(chatId, t.limit(used));
    return;
  }
  await store.put(countKey, used + 1, DAILY_TTL);
  await api.sendTyping(chatId);

  const input: AnalyzeInput = { text, langHint: user.lang, replyLang: user.lang };
  const imageFile = photo ? { id: photo.file_id, type: 'image/jpeg' as ImageMediaType } : imageDoc ? { id: imageDoc.file_id, type: imageDoc.mime_type as ImageMediaType } : null;
  if (imageFile) {
    const bytes = await api.downloadFile(imageFile.id, MAX_IMAGE_BYTES);
    if (bytes) input.image = { mediaType: imageFile.type, base64: toBase64(bytes) };
    else if (!text) {
      await api.sendMessage(chatId, t.tooBig);
      return;
    }
  } else if (msg.photo?.length && !text) {
    await api.sendMessage(chatId, t.tooBig);
    return;
  }
  if (sound) {
    let transcript: string | null = null;
    if (deps.transcriber && sound.duration <= MAX_AUDIO_SECONDS) {
      const bytes = await api.downloadFile(sound.file_id, MAX_AUDIO_BYTES);
      if (bytes) transcript = await deps.transcriber.transcribe(bytes);
    }
    input.audio = { transcript };
  }

  const verdict = await analyze(input, { ai: deps.ai });
  let reply = renderVerdict(verdict);

  let alerts = 0;
  if (verdict.level === 'alto') {
    for (const g of user.guardians) {
      const guardian = await store.get<UserRecord>(keys.user(g.chatId));
      const lang: Lang = guardian?.lang ?? user.lang;
      if (await api.sendMessage(g.chatId, renderFamilyAlert(verdict, user.name, lang))) alerts++;
    }
    if (alerts) reply += `\n\n${t.familyNotified}`;
  }
  await api.sendMessage(chatId, reply);

  const statsKey = keys.stats(day);
  const stats = (await store.get<DayStats>(statsKey)) ?? { checks: 0, alto: 0, medio: 0, sin_senales: 0, imagen: 0, audio: 0, alertas: 0 };
  stats.checks++;
  stats[verdict.level]++;
  if (input.image) stats.imagen++;
  if (input.audio) stats.audio++;
  stats.alertas += alerts;
  await store.put(statsKey, stats, STATS_TTL);
  deps.log?.(`revisión: ${verdict.level} ${verdict.pattern ?? '-'} ${verdict.source}`);
}
