// Textos de respuesta. Italiano con «tu», español con «usted» (sirve igual en España y Argentina).
// Frases cortas: las lee una persona mayor en el teléfono.

import { isSuspicious } from './enlaces';
import type { Lang, Level, Note, Pattern, Verdict } from './tipos';

interface PatternText {
  label: string;
  reason: string;
  action: string;
}

type Texts = Record<Pattern, PatternText>;

const ES: Texts = {
  secuestro_virtual: {
    label: 'secuestro virtual',
    reason: 'Dicen tener a un familiar y piden plata. Es la estafa del secuestro virtual: casi siempre es mentira y buscan que usted no corte.',
    action: 'Corte. Llame enseguida a su familiar a su número de siempre y, si no contesta, a la policía.',
  },
  familiar_numero_nuevo: {
    label: 'falso familiar con número nuevo',
    reason: 'Alguien dice ser un familiar con número nuevo. Es la estafa más común por WhatsApp: después piden una transferencia urgente.',
    action: 'No transfiera nada. Llame a su familiar al número de siempre y pregúntele si es quien dice ser.',
  },
  falso_agente: {
    label: 'falso policía, abogado u hospital',
    reason: 'Alguien que dice ser policía, abogado o del hospital pide plata por un familiar en problemas. Ningún policía ni hospital pide plata así.',
    action: 'Corte y llame a su familiar a su número de siempre. No entregue plata, joyas ni tarjetas a nadie que venga a su casa.',
  },
  retiro_domicilio: {
    label: 'retiro de plata en su casa',
    reason: 'Le dicen que alguien pasará por su casa a buscar plata, dólares, joyas o tarjetas. Ningún banco, policía ni familiar manda a alguien a buscar eso.',
    action: 'No entregue nada. Cierre la puerta y llame a un familiar o a la policía.',
  },
  cuenta_segura: {
    label: '«cuenta segura» falsa',
    reason: 'Le piden mover su dinero a una «cuenta segura». Ningún banco pide eso: esa cuenta es de los estafadores.',
    action: 'No mueva nada. Corte y llame usted al banco al número que figura en su tarjeta.',
  },
  codigo_verificacion: {
    label: 'pedido de códigos o claves',
    reason: 'Le piden un código, una clave o los datos de la tarjeta. Con eso pueden entrar a su WhatsApp o a su cuenta.',
    action: 'No pase ningún código ni clave a nadie, aunque diga ser del banco o un familiar.',
  },
  votacion_falsa: {
    label: 'falso pedido de voto',
    reason: 'Le piden votar en un concurso con un enlace. Así se roban cuentas de WhatsApp: después le piden un código.',
    action: 'No toque el enlace y no pase ningún código que le llegue.',
  },
  banco_falso: {
    label: 'falso aviso del banco',
    reason: 'Parece un aviso del banco, pero lleva a un enlace o a un número que no son los oficiales. Así roban las claves.',
    action: 'No toque el enlace ni llame a ese número. Entre a la app de su banco como siempre, o llame al número de su tarjeta.',
  },
  inversion_falsa: {
    label: 'inversión falsa',
    reason: 'Promete ganancias fáciles o garantizadas. Nadie puede garantizar ganancias: es una estafa de inversión.',
    action: 'No deposite nada ni dé sus datos. Si quiere invertir, consúltelo antes con alguien de confianza.',
  },
  romance_falso: {
    label: 'falso romance',
    reason: 'Alguien que conoció por internet le pide plata para viajar, para un trámite o para liberar un paquete. Es la estafa del falso romance.',
    action: 'No mande plata a nadie que no conozca en persona. Hable con alguien de confianza.',
  },
  paquete_falso: {
    label: 'paquete falso',
    reason: 'Dice que hay un paquete retenido o un pago de envío pendiente. Es una estafa muy común para robar los datos de la tarjeta.',
    action: 'No toque el enlace. Si espera un paquete, búsquelo en la web oficial escribiendo la dirección a mano.',
  },
  multa_impuesto_falso: {
    label: 'multa o impuesto falso',
    reason: 'Habla de una multa, una deuda o una devolución de impuestos con un enlace o un pago urgente. Los organismos no cobran así.',
    action: 'No pague ni toque el enlace. Revise en la web oficial del organismo escribiendo la dirección a mano.',
  },
  ayuda_publica_falsa: {
    label: 'falso subsidio o jubilación',
    reason: 'Ofrece un subsidio, un bono o el pago de la jubilación a cambio de datos o de entrar a un enlace. Los organismos no piden datos así.',
    action: 'No toque el enlace. Consulte en la web oficial del organismo escribiendo la dirección a mano.',
  },
  servicio_corte_falso: {
    label: 'falso corte de luz, gas o agua',
    reason: 'Amenaza con cortar la luz, el gas o el agua si no paga ya. Las empresas avisan con tiempo y en la factura.',
    action: 'No pague por ese medio. Llame a la empresa al número que figura en su factura.',
  },
  premio_falso: {
    label: 'premio falso',
    reason: 'Dice que ganó un premio o un regalo, pero le piden datos, un pago o entrar a un enlace. Si no participó, no ganó nada.',
    action: 'No toque el enlace ni pague nada para recibir un premio.',
  },
  trabajo_falso: {
    label: 'trabajo falso',
    reason: 'Ofrece plata fácil por tareas simples, como dar «me gusta» o escribir reseñas. Al principio pagan poco y después piden que usted deposite.',
    action: 'No deposite nada ni dé sus datos. Un trabajo de verdad no le pide plata.',
  },
  compraventa_falsa: {
    label: 'compraventa falsa',
    reason: 'Un comprador o vendedor le manda un enlace o le pide datos para «cobrar». Para cobrar nunca hace falta poner la tarjeta.',
    action: 'Cobre solo dentro de la app de la web de ventas y no toque enlaces que le manden.',
  },
  soporte_tecnico_falso: {
    label: 'falso soporte técnico',
    reason: 'Dice que su equipo tiene un virus o le pide instalar una app para «ayudarlo». Así toman el control del teléfono o la computadora.',
    action: 'No instale nada y corte. Si le preocupa, pida ayuda a alguien de confianza.',
  },
  archivo_adjunto: {
    label: 'archivo adjunto peligroso',
    reason: 'Le piden abrir un archivo con una excusa (factura, multa o deuda). Esos archivos pueden instalar programas que roban datos.',
    action: 'No abra el archivo. Si cree que debe algo, consulte en la web oficial de la empresa escribiendo la dirección a mano.',
  },
  pedido_dinero: {
    label: 'pedido de plata sospechoso',
    reason: 'Le piden plata con apuro o en secreto. Son las dos señales más típicas de una estafa.',
    action: 'Antes de pagar, confirme por otro camino: llame a la persona a su número de siempre.',
  },
  enlace_sospechoso: {
    label: 'enlace sospechoso',
    reason: 'El enlace no lleva a un sitio oficial: imita una marca o usa una dirección rara.',
    action: 'No lo toque. Si el aviso le importa, entre a la web oficial escribiendo la dirección a mano.',
  },
  otro: {
    label: 'señales de estafa',
    reason: 'Tiene señales que suelen aparecer en las estafas.',
    action: 'No responda ni pague. Consulte con alguien de confianza antes de hacer nada.',
  },
};

const IT: Texts = {
  secuestro_virtual: {
    label: 'finto rapimento',
    reason: 'Dicono di avere un tuo familiare e chiedono soldi. È la truffa del finto rapimento: quasi sempre è falso e vogliono che tu resti al telefono.',
    action: 'Riattacca. Chiama subito il tuo familiare al suo numero di sempre e, se non risponde, il 112.',
  },
  familiar_numero_nuevo: {
    label: 'finto familiare con numero nuovo',
    reason: 'Qualcuno dice di essere un familiare con un numero nuovo. È la truffa più comune su WhatsApp: poi chiede un bonifico urgente.',
    action: 'Non mandare soldi. Chiama il tuo familiare al numero di sempre e chiedigli se è davvero lui o lei.',
  },
  falso_agente: {
    label: 'finto carabiniere, avvocato o ospedale',
    reason: "Qualcuno che dice di essere carabiniere, avvocato o dell'ospedale chiede soldi per un familiare nei guai. Nessun carabiniere o ospedale chiede soldi così.",
    action: 'Riattacca e chiama il tuo familiare al suo numero di sempre. Non consegnare soldi, gioielli o carte a nessuno che venga a casa.',
  },
  retiro_domicilio: {
    label: 'ritiro di soldi a casa',
    reason: 'Ti dicono che qualcuno passerà a casa a prendere soldi, gioielli o carte. Nessuna banca, carabiniere o familiare manda qualcuno a ritirarli.',
    action: 'Non consegnare niente. Chiudi la porta e chiama un familiare o il 112.',
  },
  cuenta_segura: {
    label: 'falso «conto sicuro»',
    reason: 'Ti chiedono di spostare i soldi su un «conto sicuro». Nessuna banca lo chiede: quel conto è dei truffatori.',
    action: 'Non spostare niente. Riattacca e chiama tu la banca al numero scritto sulla carta.',
  },
  codigo_verificacion: {
    label: 'richiesta di codici o password',
    reason: 'Ti chiedono un codice, una password o i dati della carta. Con quello possono entrare nel tuo WhatsApp o nel tuo conto.',
    action: 'Non dare nessun codice o password a nessuno, anche se dice di essere la banca o un familiare.',
  },
  votacion_falsa: {
    label: 'falsa richiesta di voto',
    reason: 'Ti chiedono di votare in un concorso con un link. Così rubano gli account WhatsApp: poi chiedono un codice.',
    action: 'Non aprire il link e non dare nessun codice che ti arriva.',
  },
  banco_falso: {
    label: 'falso avviso della banca',
    reason: 'Sembra un avviso della banca, ma porta a un link o a un numero che non sono quelli ufficiali. Così rubano le credenziali.',
    action: "Non aprire il link e non chiamare quel numero. Entra nell'app della tua banca come sempre, o chiama il numero sulla carta.",
  },
  inversion_falsa: {
    label: 'falso investimento',
    reason: 'Promette guadagni facili o garantiti. Nessuno può garantire guadagni: è una truffa sugli investimenti.',
    action: 'Non versare niente e non dare i tuoi dati. Se vuoi investire, parlane prima con qualcuno di fiducia.',
  },
  romance_falso: {
    label: 'falso amore',
    reason: 'Una persona conosciuta su internet ti chiede soldi per viaggiare, per una pratica o per sbloccare un pacco. È la truffa del falso amore.',
    action: 'Non mandare soldi a chi non conosci di persona. Parlane con qualcuno di fiducia.',
  },
  paquete_falso: {
    label: 'falso pacco',
    reason: "Dice che c'è un pacco fermo o una spedizione da pagare. È una truffa molto comune per rubare i dati della carta.",
    action: "Non aprire il link. Se aspetti un pacco, controlla sul sito ufficiale scrivendo l'indirizzo a mano.",
  },
  multa_impuesto_falso: {
    label: 'falsa multa o tassa',
    reason: 'Parla di una multa, un debito o un rimborso delle tasse con un link o un pagamento urgente. Gli enti non chiedono soldi così.',
    action: "Non pagare e non aprire il link. Controlla sul sito ufficiale dell'ente scrivendo l'indirizzo a mano.",
  },
  ayuda_publica_falsa: {
    label: 'falso bonus o pensione',
    reason: 'Offre un bonus, un rimborso o la pensione in cambio di dati o di un link. Gli enti pubblici non chiedono dati così.',
    action: "Non aprire il link. Controlla sul sito ufficiale dell'ente scrivendo l'indirizzo a mano.",
  },
  servicio_corte_falso: {
    label: 'falso distacco di luce, gas o acqua',
    reason: 'Minaccia di staccare luce, gas o acqua se non paghi subito. Le aziende avvisano per tempo e in bolletta.',
    action: "Non pagare in quel modo. Chiama l'azienda al numero scritto sulla bolletta.",
  },
  premio_falso: {
    label: 'falso premio',
    reason: 'Dice che hai vinto un premio o un regalo, ma chiede dati, un pagamento o di aprire un link. Se non hai partecipato, non hai vinto niente.',
    action: 'Non aprire il link e non pagare niente per ricevere un premio.',
  },
  trabajo_falso: {
    label: 'falso lavoro',
    reason: 'Offre soldi facili per compiti semplici, come mettere «mi piace» o scrivere recensioni. All\'inizio pagano poco, poi chiedono di versare soldi.',
    action: 'Non versare niente e non dare i tuoi dati. Un lavoro vero non ti chiede soldi.',
  },
  compraventa_falsa: {
    label: 'falsa compravendita',
    reason: 'Un compratore o un venditore ti manda un link o chiede dati per «ricevere il pagamento». Per ricevere soldi non serve mai inserire la carta.',
    action: "Ricevi i pagamenti solo dentro l'app del sito di annunci e non aprire link che ti mandano.",
  },
  soporte_tecnico_falso: {
    label: 'falsa assistenza tecnica',
    reason: "Dice che il tuo dispositivo ha un virus o ti chiede di installare un'app per «aiutarti». Così prendono il controllo del telefono o del computer.",
    action: 'Non installare niente e riattacca. Se sei preoccupato, chiedi aiuto a qualcuno di fiducia.',
  },
  archivo_adjunto: {
    label: 'allegato pericoloso',
    reason: "Ti chiedono di aprire un file con una scusa (bolletta, multa o debito). Quei file possono installare programmi che rubano i dati.",
    action: "Non aprire il file. Se pensi di dover pagare qualcosa, controlla sul sito ufficiale dell'azienda scrivendo l'indirizzo a mano.",
  },
  pedido_dinero: {
    label: 'richiesta di soldi sospetta',
    reason: 'Ti chiedono soldi con fretta o in segreto. Sono i due segnali più tipici di una truffa.',
    action: 'Prima di pagare, verifica in un altro modo: chiama la persona al suo numero di sempre.',
  },
  enlace_sospechoso: {
    label: 'link sospetto',
    reason: 'Il link non porta a un sito ufficiale: imita un marchio o usa un indirizzo strano.',
    action: "Non aprirlo. Se l'avviso ti interessa, entra nel sito ufficiale scrivendo l'indirizzo a mano.",
  },
  otro: {
    label: 'segnali di truffa',
    reason: 'Ha segnali che compaiono spesso nelle truffe.',
    action: 'Non rispondere e non pagare. Chiedi a qualcuno di fiducia prima di fare qualsiasi cosa.',
  },
};

const HEADERS: Record<Lang, Record<Level, string>> = {
  es: {
    alto: '🔴 RIESGO ALTO: parece una estafa',
    medio: '🟡 RIESGO MEDIO: verifique antes de hacer nada',
    sin_senales: '🟢 No encontré señales de estafa',
  },
  it: {
    alto: '🔴 RISCHIO ALTO: sembra una truffa',
    medio: '🟡 RISCHIO MEDIO: controlla prima di fare qualsiasi cosa',
    sin_senales: '🟢 Non ho trovato segnali di truffa',
  },
};

const NO_SIGNALS: Record<Lang, string> = {
  es: 'No vi señales de las estafas conocidas, pero eso no lo garantiza. Si le piden plata, códigos o datos, consúltelo antes con alguien de confianza.',
  it: 'Non ho visto segnali delle truffe conosciute, ma non è una garanzia. Se ti chiedono soldi, codici o dati, chiedi prima a qualcuno di fiducia.',
};

const ACTION_PREFIX: Record<Lang, string> = { es: '👉 Qué hacer:', it: '👉 Cosa fare:' };

const NOTES: Record<Lang, Record<Note, string>> = {
  es: {
    imagen_sin_ia: 'No pude leer la imagen. Copie el texto del mensaje y mándemelo.',
    audio_sin_transcripcion: 'No pude entender el audio. Si puede, escríbame lo que dice.',
    ia_no_disponible: 'Esta vez revisé solo con mis reglas fijas. Ante la duda, consulte a un familiar.',
    texto_vacio: 'No recibí nada para revisar. Reenvíeme el mensaje que le parece sospechoso.',
  },
  it: {
    imagen_sin_ia: "Non riesco a leggere l'immagine. Copia il testo del messaggio e mandamelo.",
    audio_sin_transcripcion: "Non riesco a capire l'audio. Se puoi, scrivimi cosa dice.",
    ia_no_disponible: 'Questa volta ho controllato solo con le regole fisse. Nel dubbio, chiedi a un familiare.',
    texto_vacio: 'Non ho ricevuto niente da controllare. Inoltrami il messaggio che ti sembra sospetto.',
  },
};

const LINK_WARNING: Record<Lang, (domain: string) => string> = {
  es: (d) => `El enlace lleva a ${d}, que no es un sitio oficial.`,
  it: (d) => `Il link porta a ${d}, che non è un sito ufficiale.`,
};

// Los dominios se muestran «desactivados» para que el chat no los convierta en enlaces.
export function defang(domain: string): string {
  return domain.replace(/\./g, '[.]');
}

export function patternLabel(pattern: Pattern | null, lang: Lang): string {
  return (lang === 'it' ? IT : ES)[pattern ?? 'otro'].label;
}

export function verdictText(v: Verdict): { reason: string; action: string } {
  if (v.level === 'sin_senales') return { reason: NO_SIGNALS[v.lang], action: '' };
  const canned = (v.lang === 'it' ? IT : ES)[v.pattern ?? 'otro'];
  return {
    reason: v.ai?.reason || canned.reason,
    action: v.ai?.action || canned.action,
  };
}

export function renderVerdict(v: Verdict): string {
  const lines: string[] = [];
  const onlyNotes = v.source === 'ninguna' && v.notes.length > 0 && v.findings.length === 0;
  if (!onlyNotes || v.notes.includes('ia_no_disponible')) {
    lines.push(HEADERS[v.lang][v.level]);
    const { reason, action } = verdictText(v);
    lines.push('', reason);
    const bad = v.links.find(isSuspicious);
    if (bad && v.level !== 'sin_senales') lines.push(LINK_WARNING[v.lang](defang(bad.domain)));
    if (action) lines.push('', `${ACTION_PREFIX[v.lang]} ${action}`);
  }
  for (const note of v.notes) lines.push('', `ℹ️ ${NOTES[v.lang][note]}`);
  return lines.join('\n').trim();
}

// Aviso para el familiar vinculado cuando el riesgo es alto. No incluye el mensaje original.
// Las partes del aviso, para los canales que lo mandan con una plantilla (WhatsApp).
export function familyAlertParts(v: Verdict, lang: Lang): { label: string; action: string } {
  const label = patternLabel(v.pattern, lang);
  const { action } = verdictText({ ...v, lang, ai: lang === v.lang ? v.ai : undefined });
  return { label, action };
}

export function renderFamilyAlert(v: Verdict, who: string, lang: Lang): string {
  const { label, action } = familyAlertParts(v, lang);
  if (lang === 'it') {
    return `⚠️ ${who} ha ricevuto un messaggio a rischio alto (${label}).\nHo risposto: «${action}»\nSe puoi, chiama ${who} adesso.`;
  }
  return `⚠️ ${who} recibió un mensaje con riesgo alto (${label}).\nLe respondí: «${action}»\nSi puede, llame a ${who} ahora.`;
}
