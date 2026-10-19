// Control diario del sitio y del bot. Lo corre .github/workflows/control-diario.yml; si algo falla,
// el workflow abre una issue (y se cierra sola cuando vuelve a andar).
//   METRICAS_CLAVE=… BOT_TOKEN=… node scripts/control-diario.mjs [archivo para el informe]

import { writeFileSync } from 'node:fs';

const url = (process.env.WORKER_URL || 'https://pausa.family').replace(/\/$/, '');
const workersDev = (process.env.URL_WORKERS || 'https://pausa.briaan-b.workers.dev').replace(/\/$/, '');
const previous = (process.env.URL_ANTERIOR || 'https://guardian-familiar.briaan-b.workers.dev').replace(/\/$/, '');
const clave = process.env.METRICAS_CLAVE ?? '';
const token = process.env.BOT_TOKEN ?? '';
const problems = [];

// Cada control devuelve true o el problema en palabras.
async function check(name, fn) {
  try {
    const result = await fn();
    if (result === true) console.log(`✔ ${name}`);
    else problems.push(`${name}: ${result}`);
  } catch (err) {
    problems.push(`${name}: ${err.message}`);
  }
}

await check('El Worker responde', async () => (await fetch(`${url}/salud`)).ok || 'no responde');

await check('La web se ve', async () => {
  const res = await fetch(`${url}/es/`);
  return (res.ok && (await res.text()).includes('Pausa')) || `HTTP ${res.status}`;
});

await check('La privacidad dice quién es el responsable y cómo contactarlo', async () => {
  const html = await (await fetch(`${url}/es/privacidad/`)).text();
  return (html.includes('Responsable de los datos') && html.includes('mailto:')) || 'faltan las variables SITIO_RESPONSABLE y SITIO_CONTACTO en GitHub';
});

await check('Reglas, IA y contadores', async () => {
  if (!clave) return 'falta el secreto METRICAS_CLAVE';
  const once = async () => {
    const res = await fetch(`${url}/api/control?clave=${encodeURIComponent(clave)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  let d = await once();
  // Un error suelto de la IA (sobrecarga, red) no merece una issue: se prueba otra vez.
  if (d.ia === 'error') {
    await new Promise((r) => setTimeout(r, 15_000));
    d = await once();
  }
  const bad = [];
  if (d.reglas !== 'alto') bad.push(`las reglas dan «${d.reglas}» a una estafa clara`);
  if (d.ia !== 'alto') bad.push(`la IA da «${d.ia}»${d.ia_error ? ` (${d.ia_error})` : ''}. Si es un error 400 o 401, revisá el saldo y la clave de Anthropic`);
  if (d.contadores !== 'ok') bad.push(`contadores: ${d.contadores}`);
  return bad.length ? bad.join('; ') : true;
});

await check('www y la dirección de workers.dev llevan al dominio', async () => {
  const bad = [];
  for (const from of [`https://www.${new URL(url).hostname}`, workersDev]) {
    const res = await fetch(`${from}/es/`, { redirect: 'manual' });
    if (res.status !== 301 || res.headers.get('location') !== `${url}/es/`) bad.push(`${from}: HTTP ${res.status} → ${res.headers.get('location')}`);
  }
  return bad.length ? bad.join('; ') : true;
});

await check('La dirección anterior redirige', async () => {
  const res = await fetch(`${previous}/es/`, { redirect: 'manual' });
  return (res.status === 301 && res.headers.get('location') === `${url}/es/`) || `HTTP ${res.status} → ${res.headers.get('location')}`;
});

await check('Telegram entrega los mensajes al bot', async () => {
  if (!token) return 'falta el secreto BOT_TOKEN';
  const info = (await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json()).result ?? {};
  if (info.url !== `${url}/telegram/webhook`) return `el webhook apunta a «${info.url || 'ninguna dirección'}»`;
  if (info.last_error_date && Date.now() / 1000 - info.last_error_date < 24 * 3600) return `error en las últimas 24 h: ${info.last_error_message}`;
  if (info.pending_update_count > 20) return `${info.pending_update_count} mensajes esperando`;
  return true;
});

const report = problems.length
  ? `El control diario encontró ${problems.length === 1 ? 'un problema' : `${problems.length} problemas`}:\n\n${problems.map((p) => `- ${p}`).join('\n')}\n`
  : 'Todo anda.\n';
console.log(`\n${report}`);
if (process.argv[2]) writeFileSync(process.argv[2], report);
process.exit(problems.length ? 1 : 0);
