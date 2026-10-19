// Conecta el bot de Telegram con el Worker y carga los comandos y el perfil en los dos idiomas.
//   BOT_TOKEN=… TELEGRAM_SECRET=… WORKER_URL=https://pausa.<cuenta>.workers.dev npx tsx scripts/configurar-webhook.ts

import { PROFILE } from '../src/bot/textos';
import { telegramHeaderSecret } from '../src/servidor/secreto';

const token = process.env.BOT_TOKEN;
const secret = process.env.TELEGRAM_SECRET;
const workerUrl = process.env.WORKER_URL?.replace(/\/$/, '');

if (!token || !secret || !workerUrl) {
  console.error('Faltan BOT_TOKEN, TELEGRAM_SECRET o WORKER_URL.');
  process.exit(1);
}

async function call(method: string, body: Record<string, unknown>, quiet = false): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; description?: string; result?: unknown };
  if (!data.ok) throw new Error(`${method}: ${data.description ?? res.status}`);
  if (!quiet) console.log(`${method}: ok`);
  return (data.result ?? {}) as Record<string, unknown>;
}

// Telegram limita mucho los cambios de nombre y descripción: se manda solo lo que cambió, y un
// error ahí avisa pero no frena el despliegue.
async function ensure(field: 'name' | 'description' | 'short_description', value: string, scope: Record<string, string>) {
  const suffix = { name: 'Name', description: 'Description', short_description: 'ShortDescription' }[field];
  try {
    const current = await call(`getMy${suffix}`, scope, true);
    if (current[field] === value) return;
    await call(`setMy${suffix}`, { [field]: value, ...scope });
  } catch (err) {
    console.warn(`Aviso: no se pudo cargar ${field} (${scope.language_code ?? 'por defecto'}): ${(err as Error).message}`);
  }
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
    { command: 'borrar', description: 'Borrar todos sus datos' },
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
    { command: 'cancella', description: 'Cancellare tutti i tuoi dati' },
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
    { command: 'borrar', description: 'Borrar todos sus datos' },
    { command: 'lingua', description: 'Italiano' },
  ],
});

// Perfil: en español, en italiano y, para el resto de los idiomas, en español.
for (const [lang, scope] of [['es', { language_code: 'es' }], ['it', { language_code: 'it' }], ['es', {}]] as const) {
  const p = PROFILE[lang];
  await ensure('name', p.name, scope);
  await ensure('description', p.description, scope);
  await ensure('short_description', p.shortDescription, scope);
}
