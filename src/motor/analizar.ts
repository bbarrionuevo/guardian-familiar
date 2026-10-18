// Une las tres capas: reglas fijas, análisis de enlaces e IA. El nivel final es el mayor
// de los dos: la IA puede subir un «medio» a «alto», pero nunca bajar lo que marcaron las reglas.

import { extractLinks } from './enlaces';
import type { AiClassifier, ImageMediaType } from './ia';
import { detectLang, langFromCode, normalize } from './normalizar';
import { detectSignals, evaluateRules } from './reglas';
import { LEVEL_RANK, PATTERNS, maxLevel, type Finding, type Lang, type Level, type Note, type Pattern, type Verdict } from './tipos';

export interface AnalyzeInput {
  text?: string | null;
  image?: { mediaType: ImageMediaType; base64: string } | null;
  // Llegó un audio: su transcripción, o null si no se pudo transcribir.
  audio?: { transcript: string | null } | null;
  // Idioma de la interfaz del usuario (it, es-AR…), para cuando el texto no alcanza.
  langHint?: string | null;
  // Idioma en que se responde. Si falta, el del mensaje: un italiano puede reenviar una estafa en español.
  replyLang?: Lang | null;
}

export interface AnalyzeDeps {
  ai?: AiClassifier | null;
}

interface RulesResult {
  findings: Finding[];
  level: Level;
  pattern: Pattern | null;
}

function runRules(text: string, lang: Lang) {
  const links = extractLinks(text);
  const findings = evaluateRules(detectSignals(normalize(text), lang, links));
  return { links, ...summarize(findings) };
}

function summarize(findings: Finding[]): RulesResult {
  let level: Level = 'sin_senales';
  for (const f of findings) level = maxLevel(level, f.level);
  // Entre los hallazgos del nivel más alto gana el patrón que va primero en PATTERNS.
  const top = findings
    .filter((f) => f.level === level)
    .sort((a, b) => PATTERNS.indexOf(a.pattern) - PATTERNS.indexOf(b.pattern))[0];
  return { findings, level, pattern: top?.pattern ?? null };
}

export async function analyze(input: AnalyzeInput, deps: AnalyzeDeps = {}): Promise<Verdict> {
  const notes: Note[] = [];
  const parts = [input.text ?? ''];
  if (input.audio) {
    if (input.audio.transcript) parts.push(input.audio.transcript);
    else notes.push('audio_sin_transcripcion');
  }
  const text = parts.join('\n').trim();
  const textLang = text ? detectLang(normalize(text), input.langHint) : langFromCode(input.langHint);
  const lang = input.replyLang ?? textLang;

  if (!text && !input.image) {
    if (!notes.length) notes.push('texto_vacio');
    return { level: 'sin_senales', pattern: null, lang, source: 'ninguna', findings: [], links: [], notes };
  }

  let rules = runRules(text, textLang);
  let verdict: Verdict = {
    level: rules.level,
    pattern: rules.pattern,
    lang,
    source: rules.level === 'sin_senales' ? 'ninguna' : 'reglas',
    findings: rules.findings,
    links: rules.links,
    notes,
  };

  // Con «alto» de las reglas no hace falta gastar una consulta a la IA.
  if (rules.level === 'alto') return verdict;

  if (!deps.ai) {
    if (input.image && !text) notes.push('imagen_sin_ia');
    return verdict;
  }

  const ai = await deps.ai.classify({ text, image: input.image ?? undefined, lang, ruleFindings: rules.findings });
  if (!ai) {
    notes.push(input.image && !text ? 'imagen_sin_ia' : 'ia_no_disponible');
    return verdict;
  }

  // El texto que la IA lee en la captura también pasa por las reglas.
  if (input.image && ai.visibleText) {
    const fromImage = runRules(`${text}\n${ai.visibleText}`.trim(), text ? textLang : detectLang(normalize(ai.visibleText), input.langHint));
    if (LEVEL_RANK[fromImage.level] > LEVEL_RANK[rules.level]) rules = fromImage;
    verdict = { ...verdict, level: rules.level, pattern: rules.pattern, findings: rules.findings, links: rules.links };
    if (rules.level !== 'sin_senales') verdict.source = 'reglas';
  }

  const finalLevel = maxLevel(rules.level, ai.level);
  const aiDecides = LEVEL_RANK[ai.level] >= LEVEL_RANK[rules.level];
  verdict.level = finalLevel;
  if (aiDecides) {
    verdict.pattern = ai.level === 'sin_senales' ? null : ai.pattern;
    verdict.ai = { reason: ai.reason, action: ai.action };
    verdict.source = rules.level === 'sin_senales' ? 'ia' : 'reglas+ia';
  } else {
    verdict.source = 'reglas+ia';
  }
  return verdict;
}
