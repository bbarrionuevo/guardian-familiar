// Normalización de texto e idioma. Todo el motor trabaja sobre texto en minúsculas,
// sin acentos y con los espacios colapsados, para que «Mamá» y «mama» sean lo mismo.

import type { Lang } from './tipos';

const ZERO_WIDTH = /[​-‍⁠﻿]/g;

export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(ZERO_WIDTH, '')
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Palabras muy frecuentes y propias de cada idioma.
const IT_MARKERS = [' il ', ' che ', ' per ', ' non ', ' sono ', ' della ', ' di ', 'ciao', 'grazie', ' e stato ', ' hai ', ' ho ', ' gli ', ' questo ', ' tuo ', ' tua ', ' nel ', ' alla ', ' anche ', ' clicca '];
const ES_MARKERS = [' el ', ' que ', ' por ', ' para ', ' es ', ' de la ', 'hola', 'gracias', ' los ', ' las ', ' tu ', ' su ', ' esta ', ' estoy ', ' usted ', ' con ', ' una ', ' del ', ' haga ', ' ingrese ', ' hace '];

export function detectLang(normalized: string, hint?: string | null): Lang {
  const padded = ` ${normalized.replace(/[^a-z0-9 ]/g, ' ')} `;
  let it = 0;
  let es = 0;
  for (const m of IT_MARKERS) if (padded.includes(m)) it++;
  for (const m of ES_MARKERS) if (padded.includes(m)) es++;
  if (it > es) return 'it';
  if (es > it) return 'es';
  if (hint && hint.toLowerCase().startsWith('it')) return 'it';
  return 'es';
}

// Idioma de la interfaz a partir del código que manda la app (it, it-IT, es-AR…).
export function langFromCode(code: string | null | undefined): Lang {
  return code && code.toLowerCase().startsWith('it') ? 'it' : 'es';
}
