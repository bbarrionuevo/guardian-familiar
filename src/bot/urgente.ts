// Qué hacer si la persona ya pagó o dio sus datos. Lo usan el bot (cuando alguien escribe «ya
// pagué») y la web (/es/me-estafaron/, /it/truffa-cosa-fare/).
// Cada número, horario y dirección sale de la página oficial de «sources», leída el 19/10/2026.
// Antes de cambiar uno, hay que leerlo de nuevo en esa página.

import { normalize } from '../motor/normalizar';
import type { Lang } from '../motor/tipos';
import type { Address } from './canal';

export type Country = 'es' | 'ar' | 'it';

export interface UrgentHelp {
  name: string;
  flag: string;
  steps: string[];
  // Si la estafa está pasando ahora mismo.
  emergency: string;
  // En la web, estos textos se pueden tocar para llamar o escribir.
  links: [text: string, href: string][];
  sources: { name: string; url: string }[];
}

export const URGENT: Record<Country, UrgentHelp> = {
  es: {
    name: 'En España',
    flag: '🇪🇸',
    steps: [
      'Llame ya a su banco, al número que figura en la tarjeta o en su web oficial (nunca al del mensaje), y cuente lo que pasó: pueden bloquear la tarjeta, la cuenta o la transferencia.',
      'Si escribió claves en una página sospechosa o se las dio a alguien, cámbielas.',
      'Llame al 017, la línea de ayuda en ciberseguridad de INCIBE: es gratis y confidencial, y atiende todos los días de 8 a 23 h. También por WhatsApp al 900 116 117. Le explican qué hacer (no es para denunciar).',
      'Haga la denuncia ante la Policía o la Guardia Civil y pida una copia para su banco.',
    ],
    emergency:
      'Si la estafa está pasando ahora (por ejemplo, alguien va a ir a su casa a buscar dinero o joyas), llame a la Guardia Civil al 062, las 24 horas.',
    links: [
      ['017', 'tel:017'],
      ['062', 'tel:062'],
    ],
    sources: [
      { name: 'INCIBE: línea de ayuda 017', url: 'https://www.incibe.es/linea-de-ayuda-en-ciberseguridad' },
      {
        name: 'INCIBE: suplantación de bancos',
        url: 'https://www.incibe.es/ciudadania/avisos/campanas-de-suplantacion-de-entidades-bancarias-con-falsos-cargos-y-bloqueo-de',
      },
      { name: 'Guardia Civil: atención al ciudadano (062)', url: 'https://web.guardiacivil.es/es/colaboracion/atencionciudadano_1/' },
      { name: 'Guardia Civil: denuncia electrónica', url: 'https://web.guardiacivil.es/es/tramites/denuncias/denuncia-electronica/' },
    ],
  },
  ar: {
    name: 'En Argentina',
    flag: '🇦🇷',
    steps: [
      'Comuníquese ya con su banco o su billetera virtual por sus canales oficiales (nunca por los del mensaje) y pida que bloqueen el acceso a la cuenta o la tarjeta.',
      'Si escribió claves en una página sospechosa o se las dio a alguien, cámbielas.',
      'Haga la denuncia en la comisaría o en la oficina de denuncias que corresponda a su domicilio.',
      'También puede consultar a la Unidad Fiscal Especializada en Ciberdelincuencia (UFECI): denunciasufeci@mpf.gov.ar o (011) 5071-0040.',
    ],
    emergency: 'Si la estafa está pasando ahora (por ejemplo, alguien va a ir a su casa a buscar dinero), llame al 911.',
    links: [
      ['(011) 5071-0040', 'tel:+541150710040'],
      ['denunciasufeci@mpf.gov.ar', 'mailto:denunciasufeci@mpf.gov.ar'],
      ['911', 'tel:911'],
    ],
    sources: [
      { name: 'Argentina.gob.ar: denunciar un delito informático', url: 'https://www.argentina.gob.ar/servicio/denunciar-un-delito-informatico' },
      { name: 'Ministerio Público Fiscal: UFECI', url: 'https://www.mpf.gob.ar/ufeci/' },
      { name: 'BCRA: reclamos por fraude o estafa', url: 'https://www.bcra.gob.ar/en/make-a-claim-to-the-central-bank-for-fraud-or-scam/' },
      {
        name: 'Fiscales.gob.ar: estafas telefónicas a personas mayores',
        url: 'https://www.fiscales.gob.ar/procuracion-general/la-unidad-fiscal-especializada-en-investigacion-criminal-compleja-advierte-sobre-estafas-telefonicas-a-personas-mayores/',
      },
    ],
  },
  it: {
    name: 'In Italia',
    flag: '🇮🇹',
    steps: [
      'Chiama subito la tua banca, al numero sulla carta o sul sito ufficiale (mai quello del messaggio), e racconta cosa è successo: possono bloccare la carta, il conto o il bonifico.',
      'Se hai scritto password o codici in una pagina sospetta o li hai dati a qualcuno, cambiali subito e attiva la verifica in due passaggi.',
      'Segnala l’accaduto alla Polizia Postale sul portale del Commissariato di PS Online (commissariatodips.it).',
      'Per la denuncia vera e propria rivolgiti alla Polizia o ai Carabinieri.',
    ],
    emergency:
      'Se la truffa sta succedendo adesso (per esempio, qualcuno sta venendo a casa a ritirare soldi o gioielli), chiama il 112 o il 113.',
    links: [
      ['commissariatodips.it', 'https://www.commissariatodips.it/segnalazioni/segnala-online/'],
      ['112', 'tel:112'],
      ['113', 'tel:113'],
    ],
    sources: [
      { name: 'Commissariato di PS Online: segnalazioni', url: 'https://www.commissariatodips.it/segnalazioni/segnala-online/' },
      {
        name: 'Polizia Postale: e-mail fraudolente',
        url: 'https://www.commissariatodips.it/notizie/articolo/e-mail-fraudolente-che-usano-il-nome-della-polizia-postale/index.html',
      },
      {
        name: 'Polizia Postale: carte di credito e bancomat',
        url: 'https://www.commissariatodips.it/approfondimenti/carte-di-credito-e-bancomat/domande-e-risposte/index.html',
      },
    ],
  },
};

export const URGENT_TEXT: Record<
  Lang,
  { title: string; closing: string[]; hint: string; familyLabel: string; familyAction: string; familyText: (who: string) => string }
> = {
  es: {
    title: '🆘 Si ya pagó o dio sus datos, haga esto ahora:',
    closing: [
      'Desconfíe de quien le ofrezca recuperar el dinero a cambio de un pago: suele ser otra estafa.',
      'No se avergüence: le pasa a mucha gente. Cuénteselo a su familia.',
    ],
    hint: '¿Ya pagó o dio sus datos? Escríbame «ya pagué» y le digo qué hacer.',
    familyLabel: 'dice que ya pagó o dio sus datos',
    familyAction: 'Llame ya a su banco y haga la denuncia.',
    familyText: (who) =>
      `🆘 ${who} me escribió que ya pagó o dio sus datos a un posible estafador.\n\n👉 Llame ahora a ${who}: lo primero es llamar juntos al banco para bloquear la tarjeta o la transferencia, y después hacer la denuncia.`,
  },
  it: {
    title: '🆘 Se hai già pagato o dato i tuoi dati, fai subito così:',
    closing: [
      'Diffida di chi ti offre di recuperare i soldi in cambio di un pagamento: di solito è un’altra truffa.',
      'Non vergognarti: succede a tante persone. Raccontalo alla tua famiglia.',
    ],
    hint: 'Hai già pagato o dato i tuoi dati? Scrivimi «ho pagato» e ti dico cosa fare.',
    familyLabel: 'dice di aver già pagato o dato i suoi dati',
    familyAction: 'Chiama subito la tua banca e fai la denuncia.',
    familyText: (who) =>
      `🆘 ${who} mi ha scritto di aver già pagato o dato i suoi dati a un possibile truffatore.\n\n👉 Chiama subito ${who}: per prima cosa chiamate insieme la banca per bloccare la carta o il bonifico, poi fate la denuncia.`,
  },
};

// «ya pagué», «ya le transferí», «di mis datos», «me estafaron»; «ho pagato», «ho fatto il bonifico»,
// «ho dato i miei dati», «mi hanno truffato». Solo en mensajes cortos escritos por la persona.
const INTENT =
  /\b(ya (le |les )?(pague|transferi|deposite|di (mis |los )?(datos|claves?|codigos?))|(le |les )?di (mis |los )?(datos|claves?|codigos?)|me (estafaron|robaron|enganaron)|(ho |gli ho )(gia )?(pagato|fatto (il |un )?bonifico|dato (i )?(miei )?(dati|codici?|password))|mi hanno (truffat|fregat)[oa])\b/;

// «No le di mis datos», «non ho pagato»: es una pregunta, no una urgencia.
const NEGATED = /\b(no|nunca|non|mai) (le |les |gli |ho |l'ho )?(gia )?(pague|transferi|deposite|di|pagato|dato|fatto)\b/;

export function isUrgentRequest(text: string): boolean {
  const t = normalize(text);
  return text.length <= 160 && INTENT.test(t) && !NEGATED.test(t);
}

// Qué países mostrar: por el idioma y, en WhatsApp, por el prefijo del número.
export function urgentCountries(lang: Lang, from?: Address): Country[] {
  if (lang === 'it') return ['it'];
  if (from?.channel === 'whatsapp' && from.id.startsWith('34')) return ['es'];
  if (from?.channel === 'whatsapp' && from.id.startsWith('54')) return ['ar'];
  return ['es', 'ar'];
}

export function renderUrgent(lang: Lang, countries: Country[]): string {
  const t = URGENT_TEXT[lang];
  const blocks = countries.map((c) => {
    const h = URGENT[c];
    const head = countries.length > 1 ? `${h.flag} ${h.name}\n` : '';
    return `${head}${h.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n🚨 ${h.emergency}`;
  });
  return `${t.title}\n\n${blocks.join('\n\n')}\n\n${t.closing.join('\n')}`;
}
