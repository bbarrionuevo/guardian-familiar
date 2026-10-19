// Pasa el banco de mensajes por el motor y cuenta aciertos y errores.
//   npm run evaluar                       → todo el banco, solo reglas (o con IA si hay ANTHROPIC_API_KEY)
//   npm run evaluar -- --solo-reglas      → ignora la clave aunque exista
//   npm run evaluar -- --estricto         → sale con error si alguna estafa queda «sin señales»
//                                           o algún mensaje legítimo pasa su nivel máximo
//   npm run evaluar -- --ciego            → usa data/banco/ciego/ y muestra solo los totales:
//                                           esos mensajes no se miran para no ajustar las reglas a ellos
// La IA usa GUARDIAN_MODELO (por defecto claude-opus-5-5).

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../src/motor/analizar';
import { createClaudeClassifier, DEFAULT_MODEL } from '../src/motor/ia';
import { LEVEL_RANK, type Level, type Verdict } from '../src/motor/tipos';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BANCO = join(ROOT, 'data', 'banco');

interface Row {
  id: string;
  lang: 'it' | 'es';
  country: string;
  category: string;
  channel: string;
  text: string;
  verbatim: boolean;
  max_ok?: Level;
}

function loadBank(dir: string): { row: Row; scam: boolean }[] {
  const out: { row: Row; scam: boolean }[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort()) {
    const scam = file.startsWith('estafas');
    for (const line of readFileSync(join(dir, file), 'utf8').split('\n')) {
      if (line.trim()) out.push({ row: JSON.parse(line) as Row, scam });
    }
  }
  return out;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const pct = (n: number, d: number) => (d ? `${((100 * n) / d).toFixed(0)} %` : '-');

async function main() {
  const args = new Set(process.argv.slice(2));
  const useAi = !args.has('--solo-reglas') && Boolean(process.env.ANTHROPIC_API_KEY);
  const model = process.env.GUARDIAN_MODELO || DEFAULT_MODEL;
  const ai = useAi ? createClaudeClassifier({ apiKey: process.env.ANTHROPIC_API_KEY, model, log: (m) => console.error(m) }) : null;

  // Una consulta de prueba antes del banco: si la IA no responde, no tiene sentido seguir.
  if (ai && !(await ai.classify({ text: 'Hola, ¿cómo estás?', lang: 'es', ruleFindings: [] }))) {
    console.error('La IA no respondió a la consulta de prueba: mirá el error de arriba.');
    process.exit(1);
  }

  const blind = args.has('--ciego');
  const bank = loadBank(blind ? join(BANCO, 'ciego') : BANCO);
  const verdicts = await mapLimit(bank, 4, ({ row }) => analyze({ text: row.text, langHint: row.lang }, { ai }));

  const scams = bank.map((b, i) => ({ ...b, v: verdicts[i]! })).filter((x) => x.scam);
  const legit = bank.map((b, i) => ({ ...b, v: verdicts[i]! })).filter((x) => !x.scam);

  const count = (xs: { v: Verdict }[], level: Level) => xs.filter((x) => x.v.level === level).length;
  const missed = scams.filter((x) => x.v.level === 'sin_senales');
  const aiFailed = bank.filter((_, i) => verdicts[i]!.notes.includes('ia_no_disponible')).length;
  const falseAlarms = legit.filter((x) => LEVEL_RANK[x.v.level] > LEVEL_RANK[x.row.max_ok ?? 'sin_senales']);
  const legitHigh = legit.filter((x) => x.v.level === 'alto');

  const lines: string[] = [];
  lines.push(`Motor: ${useAi ? `reglas + IA (${model})` : 'solo reglas'} · ${blind ? 'banco ciego' : 'banco visible'}`);
  lines.push('');
  lines.push(`Estafas (${scams.length}): alto ${count(scams, 'alto')} (${pct(count(scams, 'alto'), scams.length)}) · medio ${count(scams, 'medio')} · sin señales ${missed.length} (${pct(missed.length, scams.length)})`);
  for (const group of ['IT', 'ES', 'AR']) {
    const g = scams.filter((x) => x.row.country === group);
    if (g.length) lines.push(`  ${group} (${g.length}): alto ${count(g, 'alto')} · medio ${count(g, 'medio')} · sin señales ${count(g, 'sin_senales')}`);
  }
  const verb = scams.filter((x) => x.row.verbatim);
  const recon = scams.filter((x) => !x.row.verbatim);
  lines.push(`  textuales (${verb.length}): alto ${count(verb, 'alto')} · medio ${count(verb, 'medio')} · sin señales ${count(verb, 'sin_senales')}`);
  lines.push(`  reconstruidos (${recon.length}): alto ${count(recon, 'alto')} · medio ${count(recon, 'medio')} · sin señales ${count(recon, 'sin_senales')}`);
  lines.push('');
  lines.push(`Legítimos (${legit.length}): sin señales ${count(legit, 'sin_senales')} · medio ${count(legit, 'medio')} · alto ${legitHigh.length}`);
  lines.push(`  por encima de su nivel máximo (falsas alarmas): ${falseAlarms.length} (${pct(falseAlarms.length, legit.length)})`);

  const excerpt = (t: string) => t.replace(/\s+/g, ' ').slice(0, 110);
  // En el banco ciego solo se muestran los ids, nunca el texto.
  if (blind) {
    if (missed.length) lines.push('', `Sin señales: ${missed.map((x) => x.row.id).join(', ')}`);
    if (falseAlarms.length) lines.push('', `Falsas alarmas: ${falseAlarms.map((x) => x.row.id).join(', ')}`);
  } else if (missed.length) {
    lines.push('', 'Estafas que quedaron «sin señales»:');
    for (const x of missed) lines.push(`  ${x.row.id} [${x.row.category}] ${excerpt(x.row.text)}`);
  }
  const mid = scams.filter((x) => x.v.level === 'medio');
  if (!blind && mid.length) {
    lines.push('', 'Estafas en «medio»:');
    for (const x of mid) lines.push(`  ${x.row.id} [${x.row.category} → ${x.v.pattern}] ${excerpt(x.row.text)}`);
  }
  if (!blind && falseAlarms.length) {
    lines.push('', 'Falsas alarmas en legítimos:');
    for (const x of falseAlarms) lines.push(`  ${x.row.id} ${x.v.level}>${x.row.max_ok} [${x.v.pattern}] ${excerpt(x.row.text)}`);
  }
  console.log(lines.join('\n'));

  mkdirSync(join(ROOT, 'informes'), { recursive: true });
  const detail = bank.map((b, i) => ({
    id: b.row.id,
    estafa: b.scam,
    categoria: b.row.category,
    textual: b.row.verbatim,
    nivel: verdicts[i]!.level,
    patron: verdicts[i]!.pattern,
    fuente: verdicts[i]!.source,
    hallazgos: verdicts[i]!.findings,
  }));
  const name = `ultima-evaluacion${blind ? '-ciego' : ''}${useAi ? '-ia' : ''}.json`;
  writeFileSync(join(ROOT, 'informes', name), JSON.stringify(blind ? detail.map(({ hallazgos: _h, ...rest }) => rest) : detail, null, 1));

  // Si fallaron consultas, los números mezclan reglas e IA y no sirven para comparar modelos.
  if (aiFailed > 0) {
    console.error(`\n${aiFailed} consultas a la IA fallaron: esta evaluación no vale.`);
    process.exit(1);
  }

  if (args.has('--estricto') && (missed.length > 0 || falseAlarms.length > 0)) {
    console.error(`\nEstricto: ${missed.length} estafas sin señales, ${falseAlarms.length} falsas alarmas.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
