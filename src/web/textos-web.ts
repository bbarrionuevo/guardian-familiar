// Textos de la web. Español con «usted» (sirve en España y en Argentina), italiano con «tu».

import type { Lang } from '../motor/tipos';

export interface WebTexts {
  siteName: string;
  homeTitle: string;
  homeDescription: string;
  homeH1: string;
  homeLead: string;
  navCheck: string;
  navGuides: string;
  otherLang: string;
  checkerLabel: string;
  checkerPlaceholder: string;
  checkerImage: string;
  checkerImageChosen: string;
  checkerButton: string;
  checkerWorking: string;
  checkerNote: string;
  checkerError: string;
  checkerEmpty: string;
  levelNames: { alto: string; medio: string; sin_senales: string };
  shareFamily: string;
  shareMessage: (label: string, url: string) => string;
  shareGuide: string;
  shareGuideMessage: (title: string, url: string) => string;
  installH2: string;
  installAndroid: string[];
  installIphone: string;
  installButton: string;
  telegramH2: string;
  telegramText: string;
  telegramButton: string;
  guidesH2: string;
  guidesLead: string;
  guideExamples: string;
  guideExampleQuoted: (source: string) => string;
  guideExampleBased: (source: string) => string;
  guideSignals: string;
  guideWhatToDo: string;
  guideIfHappened: string;
  guideCheckH2: string;
  privacyTitle: string;
  privacyLink: string;
  footerNote: string;
  sharedTitle: string;
  sharedBack: string;
  notFoundTitle: string;
  notFoundText: string;
}

export const WEB: Record<Lang, WebTexts> = {
  es: {
    siteName: 'Guardián',
    homeTitle: '¿Es una estafa este mensaje? Revíselo gratis',
    homeDescription:
      'Pegue el mensaje, la captura o el SMS que le llegó y le decimos si tiene señales de estafa y qué hacer. Gratis, sin registrarse y sin guardar sus mensajes.',
    homeH1: '¿Es una estafa este mensaje?',
    homeLead:
      'Pegue el mensaje que le llegó por WhatsApp, SMS o email, o suba una captura de pantalla. En segundos le decimos si tiene señales de estafa y qué hacer.',
    navCheck: 'Revisar un mensaje',
    navGuides: 'Estafas comunes',
    otherLang: 'Italiano',
    checkerLabel: 'Pegue aquí el mensaje que recibió',
    checkerPlaceholder: 'Por ejemplo: «Hola mamá, se me rompió el celular, este es mi número nuevo…»',
    checkerImage: 'Subir una captura',
    checkerImageChosen: 'Captura lista:',
    checkerButton: 'Revisar mensaje',
    checkerWorking: 'Revisando…',
    checkerNote: 'No guardamos lo que escribe ni las imágenes: se revisan y se descartan.',
    checkerError: 'No se pudo revisar el mensaje. Pruebe de nuevo en un momento.',
    checkerEmpty: 'Pegue el texto del mensaje o suba una captura.',
    levelNames: { alto: 'Riesgo alto', medio: 'Riesgo medio', sin_senales: 'Sin señales de estafa' },
    shareFamily: 'Avisar a mi familia por WhatsApp',
    shareMessage: (label, url) =>
      `⚠️ Ojo: me llegó un mensaje de ${label}. Lo revisé y tiene señales de estafa. Si les llega algo parecido, no respondan ni toquen enlaces. Pueden revisar cualquier mensaje gratis acá: ${url}`,
    shareGuide: 'Compartir esta alerta por WhatsApp',
    shareGuideMessage: (title, url) => `⚠️ Circula esta estafa: ${title}. Así se reconoce y qué hacer: ${url}`,
    installH2: 'Úselo desde WhatsApp, sin copiar ni pegar',
    installAndroid: [
      'Abra esta página en Chrome, en el celular.',
      'Toque los tres puntos ⋮ de arriba y elija «Instalar aplicación» o «Agregar a la pantalla principal».',
      'Desde ahora, cuando le llegue un mensaje raro en WhatsApp, manténgalo apretado, toque los tres puntos ⋮, elija «Compartir» y después «Guardián».',
    ],
    installIphone: 'En iPhone todavía no se puede compartir directo: copie el mensaje y péguelo en esta página, o use el bot de Telegram.',
    installButton: 'Instalar Guardián',
    telegramH2: 'También en Telegram',
    telegramText:
      'Si usa Telegram, reenvíe el mensaje a nuestro bot. Además puede vincular a un familiar: cuando le llegue algo de riesgo alto, le avisamos también a esa persona.',
    telegramButton: 'Abrir el bot en Telegram',
    guidesH2: 'Las estafas más comunes',
    guidesLead: 'Cómo funcionan, cómo reconocerlas y qué hacer si ya respondió o pagó.',
    guideExamples: 'Ejemplos de mensajes reales',
    guideExampleQuoted: (source) => `Mensaje citado por ${source}`,
    guideExampleBased: (source) => `Ejemplo armado a partir de lo que describe ${source}`,
    guideSignals: 'Señales para reconocerla',
    guideWhatToDo: 'Qué hacer',
    guideIfHappened: 'Si ya respondió o pagó',
    guideCheckH2: '¿Le llegó un mensaje parecido? Revíselo acá',
    privacyTitle: 'Privacidad',
    privacyLink: 'Privacidad',
    footerNote: 'Guardián no guarda los mensajes que revisa. Nunca le vamos a pedir datos, claves ni dinero.',
    sharedTitle: 'Resultado de la revisión',
    sharedBack: 'Revisar otro mensaje',
    notFoundTitle: 'Página no encontrada',
    notFoundText: 'Esta página no existe. Puede revisar un mensaje desde el inicio.',
  },
  it: {
    siteName: 'Guardiano',
    homeTitle: 'È una truffa questo messaggio? Controllalo gratis',
    homeDescription:
      'Incolla il messaggio, lo screenshot o l’SMS che hai ricevuto e ti diciamo se ha segnali di truffa e cosa fare. Gratis, senza registrazione e senza conservare i tuoi messaggi.',
    homeH1: 'È una truffa questo messaggio?',
    homeLead:
      'Incolla il messaggio che ti è arrivato su WhatsApp, via SMS o email, oppure carica uno screenshot. In pochi secondi ti diciamo se ha segnali di truffa e cosa fare.',
    navCheck: 'Controlla un messaggio',
    navGuides: 'Truffe comuni',
    otherLang: 'Español',
    checkerLabel: 'Incolla qui il messaggio che hai ricevuto',
    checkerPlaceholder: 'Per esempio: «Ciao mamma, il mio cellulare è rotto, questo è il mio nuovo numero…»',
    checkerImage: 'Carica uno screenshot',
    checkerImageChosen: 'Screenshot pronto:',
    checkerButton: 'Controlla il messaggio',
    checkerWorking: 'Sto controllando…',
    checkerNote: 'Non conserviamo quello che scrivi né le immagini: vengono controllati e scartati.',
    checkerError: 'Non è stato possibile controllare il messaggio. Riprova tra un momento.',
    checkerEmpty: 'Incolla il testo del messaggio o carica uno screenshot.',
    levelNames: { alto: 'Rischio alto', medio: 'Rischio medio', sin_senales: 'Nessun segnale di truffa' },
    shareFamily: 'Avvisa la famiglia su WhatsApp',
    shareMessage: (label, url) =>
      `⚠️ Attenzione: mi è arrivato un messaggio di ${label}. L’ho controllato e ha segnali di truffa. Se vi arriva qualcosa di simile, non rispondete e non aprite link. Potete controllare qualsiasi messaggio gratis qui: ${url}`,
    shareGuide: 'Condividi questo avviso su WhatsApp',
    shareGuideMessage: (title, url) => `⚠️ Gira questa truffa: ${title}. Ecco come riconoscerla e cosa fare: ${url}`,
    installH2: 'Usalo da WhatsApp, senza copiare e incollare',
    installAndroid: [
      'Apri questa pagina con Chrome, sul telefono.',
      'Tocca i tre puntini ⋮ in alto e scegli «Installa app» o «Aggiungi a schermata Home».',
      'Da ora, quando ti arriva un messaggio strano su WhatsApp, tienilo premuto, tocca i tre puntini ⋮, scegli «Condividi» e poi «Guardiano».',
    ],
    installIphone: 'Su iPhone non si può ancora condividere direttamente: copia il messaggio e incollalo in questa pagina, oppure usa il bot di Telegram.',
    installButton: 'Installa Guardiano',
    telegramH2: 'Anche su Telegram',
    telegramText:
      'Se usi Telegram, inoltra il messaggio al nostro bot. Puoi anche collegare un familiare: quando ti arriva qualcosa a rischio alto, avvisiamo anche quella persona.',
    telegramButton: 'Apri il bot su Telegram',
    guidesH2: 'Le truffe più comuni',
    guidesLead: 'Come funzionano, come riconoscerle e cosa fare se hai già risposto o pagato.',
    guideExamples: 'Esempi di messaggi reali',
    guideExampleQuoted: (source) => `Messaggio citato da ${source}`,
    guideExampleBased: (source) => `Esempio ricostruito da quanto descrive ${source}`,
    guideSignals: 'I segnali per riconoscerla',
    guideWhatToDo: 'Cosa fare',
    guideIfHappened: 'Se hai già risposto o pagato',
    guideCheckH2: 'Ti è arrivato un messaggio simile? Controllalo qui',
    privacyTitle: 'Privacy',
    privacyLink: 'Privacy',
    footerNote: 'Guardiano non conserva i messaggi che controlla. Non ti chiederemo mai dati, password o soldi.',
    sharedTitle: 'Risultato del controllo',
    sharedBack: 'Controlla un altro messaggio',
    notFoundTitle: 'Pagina non trovata',
    notFoundText: 'Questa pagina non esiste. Puoi controllare un messaggio dalla pagina iniziale.',
  },
};
