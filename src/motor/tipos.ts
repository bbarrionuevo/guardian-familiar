// Tipos compartidos por el motor de detección.

export type Lang = 'it' | 'es';

// Nunca existe un nivel "seguro": lo máximo que Pausa dice es que no ve señales.
export type Level = 'alto' | 'medio' | 'sin_senales';

export const LEVEL_RANK: Record<Level, number> = { sin_senales: 0, medio: 1, alto: 2 };

export function maxLevel(a: Level, b: Level): Level {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

// Patrones de estafa que Pausa sabe explicar. El orden es la prioridad
// cuando varias reglas coinciden: el primero es el más grave o el más claro.
export const PATTERNS = [
  'secuestro_virtual',
  'familiar_numero_nuevo',
  'falso_agente',
  'retiro_domicilio',
  'cuenta_segura',
  'codigo_verificacion',
  'votacion_falsa',
  'banco_falso',
  'inversion_falsa',
  'romance_falso',
  'paquete_falso',
  'multa_impuesto_falso',
  'ayuda_publica_falsa',
  'servicio_corte_falso',
  'premio_falso',
  'trabajo_falso',
  'compraventa_falsa',
  'soporte_tecnico_falso',
  'archivo_adjunto',
  'pedido_dinero',
  'enlace_sospechoso',
  'otro',
] as const;

export type Pattern = (typeof PATTERNS)[number];

export interface Finding {
  pattern: Pattern;
  level: Exclude<Level, 'sin_senales'>;
  // Señales que la dispararon, para explicar y para depurar.
  signals: string[];
}

export interface LinkReport {
  url: string;
  host: string;
  domain: string;
  official: boolean;
  flags: LinkFlag[];
}

export type LinkFlag =
  | 'acortador'
  | 'ip'
  | 'punycode'
  | 'dominio_raro'
  | 'imita_marca'
  | 'palabra_cebo'
  | 'muchos_guiones'
  | 'sin_https';

export interface Verdict {
  level: Level;
  pattern: Pattern | null;
  lang: Lang;
  source: 'reglas' | 'ia' | 'reglas+ia' | 'ninguna';
  findings: Finding[];
  links: LinkReport[];
  // Explicación y acción redactadas por la IA en el idioma del usuario, cuando intervino.
  ai?: { reason: string; action: string };
  // Avisos técnicos para la respuesta: imagen sin IA, audio sin transcribir, etc.
  notes: Note[];
}

export type Note = 'imagen_sin_ia' | 'audio_sin_transcripcion' | 'ia_no_disponible' | 'texto_vacio';
