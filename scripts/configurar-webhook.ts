// Conecta el bot de Telegram con el Worker y carga los comandos en los dos idiomas.
//   BOT_TOKEN=… TELEGRAM_SECRET=… WORKER_URL=https://guardian-familiar.<cuenta>.workers.dev npx tsx scripts/configurar-webhook.ts

import { telegramHeaderSecret } from '../src/servidor/secreto';

const token = process.env.BOT_TOKEN;
const secret = process.env.TELEGRAM_SECRET;
const workerUrl = process.env.WORKER_URL?.replace(/\/$/, '');

if (!token || !secret || !workerUrl) {
  console.error('Faltan BOT_TOKEN, TELEGRAM_SECRET o WORKER_URL.');
  process.exit(1);
}

async function call(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(`${method}: ${data.description ?? res.status}`);
  console.log(`${method}: ok`);
}

await call('setWebhook', {
  url: `${workerUrl}/telegram/webhook`,
  secret_token: await telegramHeaderSecret(secret),
  allowed_updates: ['message'],
  drop_pending_updates: true,
});

await call('setMyCommands', {
  commands: [
    { command: 'familia', description: 'Conectar a un familiar' },
    { command: 'ayuda', description: 'Cómo funciona' },
    { command: 'privacidad', description: 'Qué hago con sus mensajes' },
    { command: 'desvincular', description: 'Borrar los vínculos' },
    { command: 'lingua', description: 'Passa all’italiano' },
  ],
  language_code: 'es',
});

await call('setMyCommands', {
  commands: [
    { command: 'famiglia', description: 'Collegare un familiare' },
    { command: 'aiuto', description: 'Come funziona' },
    { command: 'privacy', description: 'Cosa faccio con i tuoi messaggi' },
    { command: 'scollega', description: 'Cancellare i collegamenti' },
    { command: 'idioma', description: 'Cambiar a español' },
  ],
  language_code: 'it',
});

// Para el resto de los idiomas, los comandos en español.
await call('setMyCommands', {
  commands: [
    { command: 'familia', description: 'Conectar a un familiar' },
    { command: 'ayuda', description: 'Cómo funciona' },
    { command: 'privacidad', description: 'Qué hago con sus mensajes' },
    { command: 'desvincular', description: 'Borrar los vínculos' },
    { command: 'lingua', description: 'Italiano' },
  ],
});
