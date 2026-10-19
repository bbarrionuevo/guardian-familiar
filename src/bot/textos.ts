// Textos del bot. Italiano con «tu», español con «usted».

import type { Lang } from '../motor/tipos';

interface BotTexts {
  welcome: string;
  help: string;
  privacy: string;
  langSet: string;
  unsupported: string;
  tooBig: string;
  limit: (n: number) => string;
  inviteForChild: (link: string) => string;
  inviteToForward: (link: string) => string;
  linkedParent: (child: string) => string;
  linkedChild: (parent: string) => string;
  inviteInvalid: string;
  inviteSelf: string;
  unlinked: string;
  deleted: string;
  nothingToUnlink: string;
  familyNotified: string;
}

export const TEXTS: Record<Lang, BotTexts> = {
  es: {
    welcome:
      '👋 Hola, soy Pausa. Antes de responder o pagar, hagamos una pausa: si le llega un mensaje, una foto o un audio que le parece raro, reenvíemelo y le digo si tiene señales de estafa.\n\n' +
      '• Para reenviar: mantenga apretado el mensaje, toque «Reenviar» y elija Pausa.\n' +
      '• También puede pegar el texto o mandarme una captura de pantalla.\n\n' +
      'No guardo sus mensajes. Nunca le voy a pedir datos, claves ni plata.\n\n' +
      '🇮🇹 Parlo anche italiano: /lingua',
    help:
      'Reenvíeme el mensaje que le parece raro (texto, captura o audio) y le contesto con el nivel de riesgo y qué hacer.\n\n' +
      '/familia: crea un enlace para que un familiar quede conectado con usted.\n' +
      '/urgente: qué hacer si ya pagó o dio sus datos.\n' +
      '/desvincular: borra los vínculos con su familia.\n' +
      '/borrar: borra todos sus datos.\n' +
      '/privacidad: qué hago con sus mensajes.\n' +
      '/lingua: passa all’italiano.',
    privacy:
      '🔒 Privacidad\n' +
      '• No guardo el texto, las fotos ni los audios que me manda: los reviso y los descarto.\n' +
      '• Para revisarlos uso reglas propias y, cuando hace falta, la IA de Anthropic (Claude). Según sus condiciones, Anthropic no usa estos mensajes para entrenar su IA.\n' +
      '• Los audios los pasa a texto el servicio de Cloudflare.\n' +
      '• Guardo solo su idioma, su nombre (en WhatsApp, también su número) y con quién está vinculado. Si no me usa durante un año, se borra solo.\n' +
      '• /desvincular borra los vínculos y /borrar, todos sus datos.',
    langSet: 'Listo, le hablo en español.',
    unsupported: 'Puedo revisar texto, capturas de pantalla y audios. Reenvíeme el mensaje que le parece raro.',
    tooBig: 'El archivo es muy grande para revisarlo. Mándeme una captura de pantalla o copie el texto.',
    limit: (n) => `Hoy ya revisé ${n} mensajes suyos. Mañana sigo. Mientras tanto: no pague ni dé datos, y ante la duda consulte a un familiar.`,
    inviteForChild: (link) =>
      `Para que le avise cuando su familiar reciba un mensaje de riesgo alto, mándele el mensaje de abajo y pídale que toque el enlace. El enlace vale 7 días.\n\n${link}`,
    inviteToForward: (link) => `Hola, te paso Pausa, un asistente que revisa mensajes sospechosos. Con este enlace quedamos conectados: ${link}`,
    linkedParent: (child) => `✅ Listo. Cuando le llegue un mensaje de riesgo alto, también le aviso a ${child}.`,
    linkedChild: (parent) =>
      `✅ Ya está: ${parent} abrió su enlace. Le voy a avisar cuando reciba un mensaje de riesgo alto.\n\n¿Hay otra persona mayor en su familia? Escriba /familia y le doy otro enlace.`,
    inviteInvalid: 'Ese enlace ya no vale. Pídale a su familiar uno nuevo.',
    inviteSelf: 'Este enlace es para su familiar, no para usted. Mándeselo por WhatsApp o por Telegram.',
    unlinked: 'Listo, borré los vínculos con su familia.',
    deleted: 'Listo, borré todos sus datos: su nombre, su idioma y los vínculos con su familia. Si vuelve a escribirme, empiezo de cero.',
    nothingToUnlink: 'No tiene vínculos con ningún familiar.',
    familyNotified: '📣 Le avisé a su familiar.',
  },
  it: {
    welcome:
      '👋 Ciao, sono Pausa. Prima di rispondere o pagare, facciamo una pausa: se ti arriva un messaggio, una foto o un audio che ti sembra strano, inoltramelo e ti dico se ha segnali di truffa.\n\n' +
      '• Per inoltrare: tieni premuto il messaggio, tocca «Inoltra» e scegli Pausa.\n' +
      '• Puoi anche incollare il testo o mandarmi uno screenshot.\n\n' +
      'Non conservo i tuoi messaggi. Non ti chiederò mai dati, password o soldi.\n\n' +
      '🇪🇸 También hablo español: /idioma',
    help:
      'Inoltrami il messaggio che ti sembra strano (testo, screenshot o audio) e ti rispondo con il livello di rischio e cosa fare.\n\n' +
      '/famiglia: crea un link per collegare un familiare.\n' +
      '/urgente: cosa fare se hai già pagato o dato i tuoi dati.\n' +
      '/scollega: cancella i collegamenti con la tua famiglia.\n' +
      '/cancella: cancella tutti i tuoi dati.\n' +
      '/privacy: cosa faccio con i tuoi messaggi.\n' +
      '/idioma: cambia a español.',
    privacy:
      '🔒 Privacy\n' +
      '• Non conservo il testo, le foto o gli audio che mi mandi: li controllo e li scarto.\n' +
      "• Per controllarli uso regole mie e, quando serve, l'IA di Anthropic (Claude). Secondo le sue condizioni, Anthropic non usa questi messaggi per addestrare la sua IA.\n" +
      '• Gli audio vengono trascritti dal servizio di Cloudflare.\n' +
      '• Conservo solo la tua lingua, il tuo nome (su WhatsApp, anche il tuo numero) e con chi sei collegato. Se non mi usi per un anno, si cancella da solo.\n' +
      '• /scollega cancella i collegamenti e /cancella tutti i tuoi dati.',
    langSet: 'Fatto, ti parlo in italiano.',
    unsupported: 'Posso controllare testo, screenshot e audio. Inoltrami il messaggio che ti sembra strano.',
    tooBig: 'Il file è troppo grande da controllare. Mandami uno screenshot o copia il testo.',
    limit: (n) => `Oggi ho già controllato ${n} tuoi messaggi. Continuo domani. Nel frattempo: non pagare e non dare dati, e nel dubbio chiedi a un familiare.`,
    inviteForChild: (link) =>
      `Per ricevere un avviso quando un tuo familiare riceve un messaggio a rischio alto, mandagli il messaggio qui sotto e chiedigli di aprire il link. Il link vale 7 giorni.\n\n${link}`,
    inviteToForward: (link) => `Ciao, ti mando Pausa, un assistente che controlla i messaggi sospetti. Con questo link restiamo collegati: ${link}`,
    linkedParent: (child) => `✅ Fatto. Quando ti arriva un messaggio a rischio alto, avviso anche ${child}.`,
    linkedChild: (parent) =>
      `✅ Fatto: ${parent} ha aperto il tuo link. Ti avviserò quando riceve un messaggio a rischio alto.\n\nC’è un’altra persona anziana in famiglia? Scrivi /famiglia e ti do un altro link.`,
    inviteInvalid: 'Questo link non è più valido. Chiedi al tuo familiare di mandartene uno nuovo.',
    inviteSelf: 'Questo link è per il tuo familiare, non per te. Mandaglielo su WhatsApp o Telegram.',
    unlinked: 'Fatto, ho cancellato i collegamenti con la tua famiglia.',
    deleted: 'Fatto, ho cancellato tutti i tuoi dati: nome, lingua e collegamenti con la famiglia. Se mi riscrivi, ricomincio da zero.',
    nothingToUnlink: 'Non sei collegato a nessun familiare.',
    familyNotified: '📣 Ho avvisato il tuo familiare.',
  },
};

// Perfil del bot en Telegram: nombre, descripción del chat vacío (hasta 512 caracteres) y
// descripción corta del perfil (hasta 120). Los carga scripts/configurar-webhook.ts.
export const PROFILE: Record<Lang, { name: string; description: string; shortDescription: string }> = {
  es: {
    name: 'Pausa',
    description:
      'Antes de responder o pagar, una pausa. Reenvíeme el mensaje que le parece raro (texto, captura de pantalla o audio) y le digo si tiene señales de estafa y qué hacer. Si vincula a un familiar, también le aviso cuando el riesgo es alto. No guardo sus mensajes.',
    shortDescription: 'Reenvíeme un mensaje raro y le digo si tiene señales de estafa.',
  },
  it: {
    name: 'Pausa',
    description:
      'Prima di rispondere o pagare, una pausa. Inoltrami il messaggio che ti sembra strano (testo, screenshot o audio) e ti dico se ha segnali di truffa e cosa fare. Se colleghi un familiare, avviso anche quella persona quando il rischio è alto. Non conservo i tuoi messaggi.',
    shortDescription: 'Inoltrami un messaggio strano e ti dico se ha segnali di truffa.',
  },
};

// Comandos en los dos idiomas.
export const COMMANDS: Record<string, 'start' | 'help' | 'family' | 'unlink' | 'delete' | 'urgent' | 'privacy' | 'lang_es' | 'lang_it'> = {
  start: 'start',
  ayuda: 'help',
  aiuto: 'help',
  help: 'help',
  familia: 'family',
  famiglia: 'family',
  desvincular: 'unlink',
  scollega: 'unlink',
  borrar: 'delete',
  cancella: 'delete',
  urgente: 'urgent',
  privacidad: 'privacy',
  privacy: 'privacy',
  idioma: 'lang_es',
  lingua: 'lang_it',
};
