// Lógica del bot, igual para Telegram y WhatsApp: comandos, vínculo familiar y revisión de
// mensajes. Cada canal traduce lo que recibe a un Incoming (canal.ts). No guarda el contenido
// de lo que revisa: solo contadores por día.

import { analyze, type AnalyzeInput } from '../motor/analizar';
import type { AiClassifier, ImageMediaType } from '../motor/ia';
import { langFromCode } from '../motor/normalizar';
import { familyAlertParts, renderFamilyAlert, renderVerdict } from '../motor/respuestas';
import type { Lang } from '../motor/tipos';
import { keys, linkAddress, sameAddress, type Invite, type Link, type Store, type UserRecord } from './almacen';
import type { Address, Channel, Incoming, Messenger } from './canal';
import { telegramIncoming, telegramMessenger, toBase64, type TelegramApi, type TgUpdate } from './telegram-api';
import { COMMANDS, TEXTS } from './textos';
import type { Transcriber } from './transcriptor';

export interface CoreDeps {
  messengers: Partial<Record<Channel, Messenger>>;
  store: Store;
  ai: AiClassifier | null;
  transcriber: Transcriber | null;
  now?: () => Date;
  dailyLimit?: number;
  log?: (msg: string) => void;
}

// Claude acepta imágenes de hasta 5 MB; en base64 crecen un tercio.
export const MAX_IMAGE_BYTES = 3_500_000;
const MAX_AUDIO_BYTES = 10_000_000;
const MAX_AUDIO_SECONDS = 180;
const INVITE_TTL = 7 * 24 * 3600;
const DAILY_TTL = 40 * 24 * 3600;
const STATS_TTL = 400 * 24 * 3600;
const MAX_GUARDIANS = 5;
const IMAGE_TYPES: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const INVITE_TEXT = /^(?:\/start\s+)?fam_([A-Za-z0-9]{6,32})$/;

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
const toLink = (a: Address, name: string): Link => ({ chatId: a.channel === 'telegram' ? Number(a.id) : a.id, name, channel: a.channel });

function newCode(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

async function loadUser(store: Store, msg: Incoming): Promise<{ user: UserRecord; isNew: boolean }> {
  const key = keys.user(msg.from);
  const existing = await store.get<UserRecord>(key);
  const name = cleanName(msg.name);
  if (existing) {
    if (msg.name && existing.name !== name) {
      existing.name = name;
      await store.put(key, existing);
    }
    return { user: existing, isNew: false };
  }
  const user: UserRecord = { lang: langFromCode(msg.langCode), name, guardians: [], protects: [] };
  await store.put(key, user);
  return { user, isNew: true };
}

// Telegram: el Worker llama a esta función con cada actualización.
export interface BotDeps extends Omit<CoreDeps, 'messengers'> {
  api: TelegramApi;
  botUsername: string;
  // Si WhatsApp está configurado, para avisar a familiares que estén allá.
  whatsapp?: Messenger;
}

export async function handleUpdate(update: TgUpdate, deps: BotDeps): Promise<void> {
  const incoming = telegramIncoming(update, MAX_IMAGE_BYTES);
  if (!incoming) return;
  const { api, botUsername, whatsapp, ...rest } = deps;
  await handleIncoming(incoming, { ...rest, messengers: { telegram: telegramMessenger(api, botUsername), whatsapp } });
}

export async function handleIncoming(msg: Incoming, deps: CoreDeps): Promise<void> {
  const out = deps.messengers[msg.from.channel];
  if (!out) return;
  const { user, isNew } = await loadUser(deps.store, msg);
  const text = msg.text.trim();

  const invite = msg.forwarded ? null : INVITE_TEXT.exec(text);
  if (invite) {
    await out.send(msg.from.id, TEXTS[user.lang].welcome);
    await acceptInvite(msg.from, user, invite[1]!, deps);
    return;
  }
  if (text.startsWith('/') && !msg.forwarded) {
    await handleCommand(msg.from, user, text, deps);
    return;
  }
  // En WhatsApp no hay /start: la primera vez se saluda antes de revisar.
  if (isNew) await out.send(msg.from.id, TEXTS[user.lang].welcome);
  await checkMessage(msg, user, deps);
}

async function handleCommand(from: Address, user: UserRecord, text: string, deps: CoreDeps): Promise<void> {
  const { store } = deps;
  const out = deps.messengers[from.channel]!;
  const [rawCmd = ''] = text.slice(1).split(/\s+/, 1);
  const cmd = COMMANDS[rawCmd.split('@')[0]!.toLowerCase()];
  const t = TEXTS[user.lang];

  switch (cmd) {
    case 'start':
      await out.send(from.id, t.welcome);
      return;
    case 'family': {
      const code = newCode();
      await store.put(keys.invite(code), { childChatId: from.id, childName: user.name, channel: from.channel } satisfies Invite, INVITE_TTL);
      // Primero el enlace del canal de quien invita; si hay otro canal, también ese.
      const channels: Channel[] = [from.channel, ...(['telegram', 'whatsapp'] as Channel[]).filter((c) => c !== from.channel)];
      const links = channels.flatMap((c) => (deps.messengers[c] ? [deps.messengers[c]!.inviteLink(code)] : []));
      await out.send(from.id, t.inviteForChild(links.join('\n')));
      await out.send(from.id, t.inviteToForward(links.join('\n')));
      return;
    }
    case 'unlink': {
      if (!user.guardians.length && !user.protects.length) {
        await out.send(from.id, t.nothingToUnlink);
        return;
      }
      // Se borra el vínculo de los dos lados.
      for (const other of [...user.guardians, ...user.protects]) {
        const key = keys.user(linkAddress(other));
        const rec = await store.get<UserRecord>(key);
        if (!rec) continue;
        rec.guardians = rec.guardians.filter((g) => !sameAddress(linkAddress(g), from));
        rec.protects = rec.protects.filter((p) => !sameAddress(linkAddress(p), from));
        await store.put(key, rec);
      }
      user.guardians = [];
      user.protects = [];
      await store.put(keys.user(from), user);
      await out.send(from.id, t.unlinked);
      return;
    }
    case 'privacy':
      await out.send(from.id, t.privacy);
      return;
    case 'lang_es':
    case 'lang_it': {
      user.lang = cmd === 'lang_it' ? 'it' : 'es';
      await store.put(keys.user(from), user);
      await out.send(from.id, TEXTS[user.lang].langSet);
      return;
    }
    default:
      await out.send(from.id, t.help);
  }
}

async function acceptInvite(from: Address, user: UserRecord, code: string, deps: CoreDeps): Promise<void> {
  const { store } = deps;
  const out = deps.messengers[from.channel]!;
  const t = TEXTS[user.lang];
  const invite = await store.get<Invite>(keys.invite(code));
  if (!invite) {
    await out.send(from.id, t.inviteInvalid);
    return;
  }
  const childAddr = linkAddress({ chatId: invite.childChatId, channel: invite.channel });
  if (sameAddress(childAddr, from)) {
    await out.send(from.id, t.inviteSelf);
    return;
  }
  await store.delete(keys.invite(code));

  const addLink = (list: Link[], link: Link) =>
    [...list.filter((l) => !sameAddress(linkAddress(l), linkAddress(link))), link].slice(-MAX_GUARDIANS);
  user.guardians = addLink(user.guardians, toLink(childAddr, invite.childName));
  await store.put(keys.user(from), user);

  const childKey = keys.user(childAddr);
  const child = await store.get<UserRecord>(childKey);
  if (child) {
    child.protects = addLink(child.protects, toLink(from, user.name));
    await store.put(childKey, child);
  }
  await out.send(from.id, t.linkedParent(invite.childName));
  await deps.messengers[childAddr.channel]?.send(childAddr.id, TEXTS[child?.lang ?? user.lang].linkedChild(user.name));
}

async function checkMessage(msg: Incoming, user: UserRecord, deps: CoreDeps): Promise<void> {
  const { store } = deps;
  const from = msg.from;
  const out = deps.messengers[from.channel]!;
  const t = TEXTS[user.lang];
  const text = msg.text.trim();

  if (!text && !msg.image && !msg.imageTooBig && !msg.audio) {
    await out.send(from.id, t.unsupported);
    return;
  }

  const now = deps.now?.() ?? new Date();
  const day = dayOf(now);
  const limit = deps.dailyLimit ?? 30;
  const countKey = keys.daily(day, from);
  const used = (await store.get<number>(countKey)) ?? 0;
  if (used >= limit) {
    await out.send(from.id, t.limit(used));
    return;
  }
  await store.put(countKey, used + 1, DAILY_TTL);
  await out.typing(from.id);

  const input: AnalyzeInput = { text, langHint: user.lang, replyLang: user.lang };
  if (msg.image && IMAGE_TYPES.includes((msg.image.mimeType ?? 'image/jpeg') as ImageMediaType)) {
    const bytes = await out.download(msg.image, MAX_IMAGE_BYTES);
    if (bytes) input.image = { mediaType: (msg.image.mimeType ?? 'image/jpeg') as ImageMediaType, base64: toBase64(bytes) };
    else if (!text) {
      await out.send(from.id, t.tooBig);
      return;
    }
  } else if (msg.imageTooBig && !text) {
    await out.send(from.id, t.tooBig);
    return;
  }
  if (msg.audio) {
    let transcript: string | null = null;
    if (deps.transcriber && (msg.audio.seconds ?? 0) <= MAX_AUDIO_SECONDS) {
      const bytes = await out.download(msg.audio, MAX_AUDIO_BYTES);
      if (bytes) transcript = await deps.transcriber.transcribe(bytes);
    }
    input.audio = { transcript };
  }

  const verdict = await analyze(input, { ai: deps.ai });
  let reply = renderVerdict(verdict);

  let alerts = 0;
  if (verdict.level === 'alto') {
    for (const g of user.guardians) {
      const to = linkAddress(g);
      const messenger = deps.messengers[to.channel];
      if (!messenger) continue;
      const guardian = await store.get<UserRecord>(keys.user(to));
      const lang: Lang = guardian?.lang ?? user.lang;
      const parts = familyAlertParts(verdict, lang);
      const alert = { who: user.name, label: parts.label, action: parts.action, text: renderFamilyAlert(verdict, user.name, lang), lang };
      const sent = messenger.sendAlert ? await messenger.sendAlert(to.id, alert) : await messenger.send(to.id, alert.text);
      if (sent) alerts++;
    }
    if (alerts) reply += `\n\n${t.familyNotified}`;
  }
  await out.send(from.id, reply);

  const statsKey = keys.stats(day);
  const stats = (await store.get<DayStats>(statsKey)) ?? { checks: 0, alto: 0, medio: 0, sin_senales: 0, imagen: 0, audio: 0, alertas: 0 };
  stats.checks++;
  stats[verdict.level]++;
  if (input.image) stats.imagen++;
  if (input.audio) stats.audio++;
  stats.alertas += alerts;
  await store.put(statsKey, stats, STATS_TTL);
  deps.log?.(`revisión ${from.channel}: ${verdict.level} ${verdict.pattern ?? '-'} ${verdict.source}`);
}
